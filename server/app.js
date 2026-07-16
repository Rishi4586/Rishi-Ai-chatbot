const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

require("dotenv").config();

const app = express();
const DEFAULT_MODEL = "openrouter/free";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

const pool = globalThis.__chatbotPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

globalThis.__chatbotPool = pool;

let databaseReadyPromise = null;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const fetchImpl = (...args) => {
  if (typeof fetch === "function") {
    return fetch(...args);
  }

  return import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args));
};

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7);
};

const getOptionalUser = (req) => {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authenticateUser = (req, res, next) => {
  const user = getOptionalUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user;
  next();
};

const normalizeModel = (model) => {
  const rawModel = String(model || "").trim();
  if (!rawModel) return DEFAULT_MODEL;
  if (/^openrouter$/i.test(rawModel)) return DEFAULT_MODEL;
  return rawModel;
};

const sanitizeAttachmentForStorage = (attachment) => {
  if (!attachment || typeof attachment !== "object") return null;

  const kind = attachment.kind === "image" ? "image" : attachment.kind === "pdf" ? "pdf" : null;
  if (!kind) return null;

  return {
    kind,
    fileName: String(attachment.fileName || "attachment").slice(0, 255),
    mimeType: String(attachment.mimeType || ""),
    previewUrl: kind === "image" ? String(attachment.previewUrl || "") : "",
    extractedText: kind === "pdf" ? String(attachment.extractedText || "").slice(0, 12000) : "",
    summary: kind === "pdf"
      ? "PDF attached and ready to send."
      : String(attachment.summary || "Image attached and ready to send.").slice(0, 500)
  };
};

const createMessage = (role, content, attachment = null) => ({
  id: randomUUID(),
  role,
  content: String(content || "").trim(),
  attachment: attachment ? sanitizeAttachmentForStorage(attachment) : null,
  createdAt: new Date().toISOString()
});

const sanitizeMessageHistory = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => message && typeof message === "object")
    .map((message) => ({
      id: typeof message.id === "string" ? message.id : randomUUID(),
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || "").trim(),
      attachment: sanitizeAttachmentForStorage(message.attachment),
      createdAt: typeof message.createdAt === "string" ? message.createdAt : new Date().toISOString()
    }))
    .filter((message) => message.content);
};

const buildChatTitle = (message) => {
  const normalized = String(message || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "New chat";
  return normalized.length > 56 ? `${normalized.slice(0, 56).trim()}...` : normalized;
};

const getLastMessagePreview = (messages) => {
  const lastTextMessage = [...messages].reverse().find((message) => message.content);
  if (!lastTextMessage) return "No messages yet";

  const preview = lastTextMessage.content.replace(/\s+/g, " ").trim();
  return preview.length > 84 ? `${preview.slice(0, 84).trim()}...` : preview;
};

const buildSearchableText = (title, messages) => {
  const combinedMessages = messages.map((message) => message.content).join(" ");
  return `${title} ${combinedMessages}`.trim();
};

const mapChatRow = (row, includeMessages = false) => {
  const messages = sanitizeMessageHistory(row.messages);

  return {
    chatId: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messageCount: messages.length,
    lastMessagePreview: getLastMessagePreview(messages),
    searchableText: buildSearchableText(row.title, messages),
    ...(includeMessages ? { messages } : {})
  };
};

const readDataUrlBuffer = (dataUrl, mimeType) => {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    throw new Error("Invalid upload payload");
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Unsupported upload encoding");
  }

  if (mimeType && match[1] !== mimeType) {
    throw new Error("MIME type does not match upload data");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("Upload is empty or exceeds the size limit");
  }

  return buffer;
};

const extractPdfText = (buffer) => {
  const asciiText = buffer
    .toString("latin1")
    .replace(/\\[rn]/g, " ")
    .replace(/[^ -~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!asciiText) {
    return "PDF uploaded successfully, but text extraction was limited. Mention the key section in your prompt for better results.";
  }

  return asciiText.slice(0, 12000);
};

const toOpenRouterMessage = (message) => {
  if (message.role === "assistant") {
    return { role: "assistant", content: message.content };
  }

  const attachment = sanitizeAttachmentForStorage(message.attachment);
  if (!attachment) {
    return { role: "user", content: message.content };
  }

  if (attachment.kind === "image" && attachment.previewUrl) {
    return {
      role: "user",
      content: [
        {
          type: "text",
          text: `${message.content}\n\nAttached image: ${attachment.fileName}`
        },
        {
          type: "image_url",
          image_url: { url: attachment.previewUrl }
        }
      ]
    };
  }

  if (attachment.kind === "pdf" && attachment.extractedText) {
    return {
      role: "user",
      content: `${message.content}\n\nPDF context:\n${attachment.extractedText}`
    };
  }

  return { role: "user", content: message.content };
};

const getChatForUser = async (chatId, userId) => {
  const result = await pool.query(
    "SELECT * FROM chats WHERE id = $1 AND user_id = $2 LIMIT 1",
    [chatId, userId]
  );

  return result.rows[0] || null;
};

const createEmptyChatForUser = async (userId) => {
  const result = await pool.query(
    `INSERT INTO chats (id, user_id, title, messages)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING *`,
    [randomUUID(), userId, "New chat", JSON.stringify([])]
  );

  return result.rows[0];
};

const requestAssistantReply = async (model, messages) => {
  const response = await fetchImpl(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: normalizeModel(model),
      messages
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to generate chat response");
  }

  return data?.choices?.[0]?.message?.content || "I couldn't generate a response just now.";
};

const ensureDatabase = async () => {
  if (!databaseReadyPromise) {
    databaseReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL DEFAULT 'New chat',
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await pool.query("CREATE INDEX IF NOT EXISTS chats_user_id_updated_idx ON chats (user_id, updated_at DESC)");
      console.log("Connected to PostgreSQL database");
    })().catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }

  return databaseReadyPromise;
};

app.use(async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/config", (req, res) => {
  res.json({
    defaultModel: DEFAULT_MODEL,
    uploadTypes: [...ALLOWED_UPLOAD_TYPES]
  });
});

app.get("/api/user", authenticateUser, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [normalizedEmail, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "User registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim();

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [normalizedEmail]);
    if (!result.rows.length) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(normalizedPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

const chatRouter = express.Router();

chatRouter.post("/upload", async (req, res) => {
  try {
    const { fileName, mimeType, dataUrl } = req.body;

    if (!ALLOWED_UPLOAD_TYPES.has(mimeType)) {
      return res.status(400).json({ error: "Only PDF, JPG, and PNG uploads are supported" });
    }

    const buffer = readDataUrlBuffer(dataUrl, mimeType);

    if (mimeType === "application/pdf") {
      const extractedText = extractPdfText(buffer);

      return res.json({
        upload: {
          kind: "pdf",
          fileName: String(fileName || "document.pdf"),
          mimeType,
          extractedText,
          summary: "PDF attached and ready to send."
        }
      });
    }

    res.json({
      upload: {
        kind: "image",
        fileName: String(fileName || "image"),
        mimeType,
        previewUrl: dataUrl,
        summary: "Image attached and ready to send."
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(400).json({ error: error.message || "Upload failed" });
  }
});

chatRouter.get("/chats", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM chats WHERE user_id = $1 ORDER BY updated_at DESC",
      [req.user.id]
    );

    res.json({ chats: result.rows.map((row) => mapChatRow(row, false)) });
  } catch (error) {
    console.error("Fetch chats error:", error);
    res.status(500).json({ error: "Failed to load chats" });
  }
});

chatRouter.get("/chat/:id", authenticateUser, async (req, res) => {
  try {
    const chat = await getChatForUser(req.params.id, req.user.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ chat: mapChatRow(chat, true) });
  } catch (error) {
    console.error("Fetch chat error:", error);
    res.status(500).json({ error: "Failed to load chat" });
  }
});

chatRouter.post("/chat/new", authenticateUser, async (req, res) => {
  try {
    const chat = await createEmptyChatForUser(req.user.id);
    res.status(201).json({ chat: mapChatRow(chat, true) });
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

chatRouter.patch("/chat/:id", authenticateUser, async (req, res) => {
  try {
    const title = buildChatTitle(req.body?.title);
    const result = await pool.query(
      `UPDATE chats
       SET title = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [title, req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ chat: mapChatRow(result.rows[0], false) });
  } catch (error) {
    console.error("Rename chat error:", error);
    res.status(500).json({ error: "Failed to rename chat" });
  }
});

chatRouter.delete("/chat/:id", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

chatRouter.post("/chat", async (req, res) => {
  try {
    const user = getOptionalUser(req);
    const { chatId, message, model, attachment, history } = req.body;
    const normalizedMessage = String(message || "").trim();

    if (!normalizedMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    let chat = null;
    let messageHistory = sanitizeMessageHistory(history);

    if (user) {
      if (chatId) {
        chat = await getChatForUser(chatId, user.id);
        if (!chat) {
          return res.status(404).json({ error: "Chat not found" });
        }
      } else {
        chat = await createEmptyChatForUser(user.id);
      }

      messageHistory = sanitizeMessageHistory(chat.messages);
    }

    const userMessage = createMessage("user", normalizedMessage, attachment);
    const openRouterMessages = [...messageHistory, userMessage].map(toOpenRouterMessage);
    const assistantReply = await requestAssistantReply(model, openRouterMessages);
    const assistantMessage = createMessage("assistant", assistantReply);

    let savedChat = null;
    if (user && chat) {
      const updatedMessages = [...messageHistory, userMessage, assistantMessage];
      const nextTitle = (!chat.title || chat.title === "New chat") && messageHistory.length === 0
        ? buildChatTitle(normalizedMessage)
        : chat.title;

      const result = await pool.query(
        `UPDATE chats
         SET title = $1, messages = $2::jsonb, updated_at = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [nextTitle, JSON.stringify(updatedMessages), chat.id, user.id]
      );

      savedChat = mapChatRow(result.rows[0], false);
    }

    res.json({
      chatId: savedChat?.chatId || null,
      title: savedChat?.title || buildChatTitle(normalizedMessage),
      userMessage,
      message: assistantMessage,
      chat: savedChat
    });
  } catch (error) {
    console.error("Chat send error:", error);
    res.status(500).json({ error: error.message || "Failed to send message" });
  }
});

app.use("/api", chatRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled API error:", error);
  res.status(500).json({ error: "Service unavailable" });
});

module.exports = {
  app,
  ensureDatabase
};
