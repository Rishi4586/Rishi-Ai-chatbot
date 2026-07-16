const body = document.body;
const container = document.querySelector(".container");
const chatWindow = document.getElementById("chat-window");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.getElementById("message");
const sendPromptBtn = document.getElementById("send-prompt-btn");
const stopResponseBtn = document.getElementById("stop-response-btn");
const deleteChatsBtn = document.getElementById("delete-chats-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const suggestionItems = document.querySelectorAll(".suggestions-item");
const addFileBtn = document.getElementById("add-file-btn");
const fileInput = document.getElementById("file-input");
const uploadPreview = document.getElementById("upload-preview");
const uploadPreviewMedia = document.getElementById("upload-preview-media");
const uploadPreviewName = document.getElementById("upload-preview-name");
const uploadPreviewMeta = document.getElementById("upload-preview-meta");
const removeUploadBtn = document.getElementById("remove-upload-btn");
const authToastElement = document.getElementById("auth-toast");

const sidebar = document.getElementById("chat-sidebar");
const sidebarScrim = document.getElementById("sidebar-scrim");
const collapseSidebarBtn = document.getElementById("collapse-sidebar-btn");
const mobileSidebarToggleBtn = document.getElementById("mobile-sidebar-toggle");
const newChatBtn = document.getElementById("new-chat-btn");
const chatSearchInput = document.getElementById("chat-search-input");
const chatList = document.getElementById("chat-list");
const chatListEmpty = document.getElementById("chat-list-empty");
const chatCountBadge = document.getElementById("chat-count-badge");

const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginPopup = document.getElementById("login-popup");
const registerPopup = document.getElementById("register-popup");
const guestLimitPopup = document.getElementById("guest-limit-popup");
const renameChatPopup = document.getElementById("rename-chat-popup");
const deleteChatPopup = document.getElementById("delete-chat-popup");
const closeLoginBtn = document.getElementById("close-login");
const closeRegisterBtn = document.getElementById("close-register");
const closeGuestLimitBtn = document.getElementById("close-guest-limit");
const closeRenameChatBtn = document.getElementById("close-rename-chat");
const closeDeleteChatBtn = document.getElementById("close-delete-chat");
const guestLimitSignInBtn = document.getElementById("guest-limit-signin");
const guestLimitSignUpBtn = document.getElementById("guest-limit-signup");
const guestLimitCancelBtn = document.getElementById("guest-limit-cancel");
const renameChatForm = document.getElementById("rename-chat-form");
const renameChatInput = document.getElementById("rename-chat-input");
const renameChatCancelBtn = document.getElementById("rename-chat-cancel");
const renameChatSaveBtn = document.getElementById("rename-chat-save");
const deleteChatCancelBtn = document.getElementById("delete-chat-cancel");
const deleteChatConfirmBtn = document.getElementById("delete-chat-confirm");
const deleteChatCopy = document.getElementById("delete-chat-copy");
const openRegisterLink = document.getElementById("open-register");
const openLoginLink = document.getElementById("open-login");
const forgotPasswordLink = document.getElementById("forgot-password-link");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");

const openChangelogBtn = document.getElementById("open-changelog");
const changelogPopup = document.getElementById("changelog-popup");
const changelogContainer = document.getElementById("changelog-container");
const closeChangelogBtn = document.getElementById("close-changelog-btn");
const infoPopup = document.getElementById("info-popup");
const closeInfoPopupBtn = document.getElementById("close-popup");

const modelDropdown = document.querySelector(".model-dropdown");
const modelDropdownBtn = document.getElementById("model-dropdown-btn");
const modelOptions = document.querySelectorAll(".model-option");
const modelInfo = document.getElementById("model-info");

const GUEST_PROMPT_LIMIT = 2;
const guestUsageMemoryFallback = { guestPromptCount: "0" };
const authMemoryFallback = { token: "" };
const modelDescriptions = {
    "openrouter/free": "OpenRouter Free keeps the experience flexible, fast, and ready for saved conversations."
};

let selectedModel = localStorage.getItem("selectedModel") || "openrouter/free";
let toastTimeout;
let searchDebounceTimer;
let changelogLoaded = false;

const guestStorage = {
    getItem(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return guestUsageMemoryFallback[key] ?? null;
        }
    },
    setItem(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            guestUsageMemoryFallback[key] = value;
        }
    },
    removeItem(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            delete guestUsageMemoryFallback[key];
        }
    }
};

const authStorage = {
    getToken() {
        try {
            return window.localStorage.getItem("token") || authMemoryFallback.token || "";
        } catch (error) {
            return authMemoryFallback.token || "";
        }
    },
    setToken(token) {
        try {
            window.localStorage.setItem("token", token);
        } catch (error) {
            authMemoryFallback.token = token;
        }
    },
    clearToken() {
        try {
            window.localStorage.removeItem("token");
        } catch (error) {
            authMemoryFallback.token = "";
        }
    }
};

const state = {
    currentChatId: null,
    chatList: [],
    messages: [],
    searchQuery: "",
    pendingUpload: null,
    isUploading: false,
    isSending: false,
    isAuthenticated: Boolean(authStorage.getToken()),
    currentUser: null,
    draft: "",
    chatListLoading: false,
    currentChatLoading: false,
    sidebarPinned: window.innerWidth >= 1080,
    sidebarPeekOpen: false,
    requestController: null,
    pendingSidebarAction: null
};

const isDesktopViewport = () => window.innerWidth >= 1080;

const showGlobalToast = (message, type = "info") => {
    if (!authToastElement) return;
    clearTimeout(toastTimeout);
    authToastElement.textContent = message;
    authToastElement.className = `auth-toast show ${type}`;
    toastTimeout = setTimeout(() => {
        authToastElement.className = "auth-toast";
    }, 3200);
};

const syncPopupScrollState = () => {
    body.classList.toggle(
        "no-scroll",
        Boolean(document.querySelector(".popup-overlay.active")) || body.classList.contains("sidebar-mobile-open")
    );
};

const openPopup = (popup) => {
    popup?.classList.add("active");
    syncPopupScrollState();
};

const closePopup = (popup) => {
    popup?.classList.remove("active");
    syncPopupScrollState();
};

const closeAllPopups = () => {
    [loginPopup, registerPopup, guestLimitPopup, renameChatPopup, deleteChatPopup, changelogPopup, infoPopup].forEach((popup) => popup?.classList.remove("active"));
    syncPopupScrollState();
};

function getGuestCount() {
    const rawValue = guestStorage.getItem("guestPromptCount");
    const parsedValue = Number.parseInt(rawValue ?? "0", 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function incrementGuestCount() {
    const nextCount = getGuestCount() + 1;
    guestStorage.setItem("guestPromptCount", String(nextCount));
    return nextCount;
}

function isGuestLimitReached() {
    return !state.isAuthenticated && getGuestCount() >= GUEST_PROMPT_LIMIT;
}

const resetGuestCount = () => {
    guestStorage.removeItem("guestPromptCount");
};

const blockGuestLimitAttempt = (event) => {
    if (!isGuestLimitReached()) return false;
    event?.preventDefault();
    event?.stopPropagation();
    openPopup(guestLimitPopup);
    return true;
};

const escapeHtml = (unsafe) => String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatInlineText = (text) => String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/==(.*?)==/g, "<mark>$1</mark>");

const buildParagraphHtml = (lines) => {
    const content = lines
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => formatInlineText(line))
        .join("<br>");

    return content ? `<p>${content}</p>` : "";
};

const formatStructuredResponse = (text) => {
    const codeBlocks = [];
    const withTokens = String(text || "").replace(/```([\w-]+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const token = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`<pre><code class="language-${escapeHtml(language || "plaintext")}">${escapeHtml(code)}</code></pre>`);
        return token;
    });

    const lines = withTokens.split(/\r?\n/);
    const blocks = [];
    let paragraphLines = [];
    let listType = null;
    let listItems = [];

    const flushParagraph = () => {
        const paragraphHtml = buildParagraphHtml(paragraphLines);
        if (paragraphHtml) {
            blocks.push(paragraphHtml);
        }
        paragraphLines = [];
    };

    const flushList = () => {
        if (!listType || !listItems.length) {
            listType = null;
            listItems = [];
            return;
        }

        const items = listItems.map((item) => `<li>${formatInlineText(item)}</li>`).join("");
        blocks.push(`<${listType}>${items}</${listType}>`);
        listType = null;
        listItems = [];
    };

    lines.forEach((rawLine) => {
        const line = rawLine.trim();
        const codeBlockMatch = line.match(/^__CODE_BLOCK_(\d+)__$/);
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        const standaloneStepMatch = line.match(/^(\d+)[.)]$/);
        const orderedListMatch = line.match(/^\d+[.)]\s+(.+)$/);
        const bulletListMatch = line.match(/^[-*\u2022]\s+(.+)$/);
        const keylineMatch = line.match(/^([A-Za-z][A-Za-z0-9 '&/()+-]{1,40}:)\s*(.*)$/);

        if (!line) {
            flushParagraph();
            flushList();
            return;
        }

        if (/^[-*\u2022]$/.test(line)) {
            flushParagraph();
            flushList();
            return;
        }

        if (codeBlockMatch) {
            flushParagraph();
            flushList();
            blocks.push(codeBlockMatch[0]);
            return;
        }

        if (headingMatch) {
            flushParagraph();
            flushList();
            const headingLevel = Math.min(5, Number(headingMatch[1].length) + 2);
            blocks.push(`<h${headingLevel} class="chat-heading">${formatInlineText(headingMatch[2])}</h${headingLevel}>`);
            return;
        }

        if (standaloneStepMatch) {
            flushParagraph();
            flushList();
            blocks.push(`<p class="chat-step-index">${standaloneStepMatch[1]}</p>`);
            return;
        }

        if (orderedListMatch) {
            flushParagraph();
            if (listType !== "ol") {
                flushList();
                listType = "ol";
            }
            listItems.push(orderedListMatch[1]);
            return;
        }

        if (bulletListMatch) {
            flushParagraph();
            if (listType !== "ul") {
                flushList();
                listType = "ul";
            }
            listItems.push(bulletListMatch[1]);
            return;
        }

        if (keylineMatch) {
            flushParagraph();
            flushList();
            const valueHtml = keylineMatch[2] ? `<span class="chat-key-value">${formatInlineText(keylineMatch[2])}</span>` : "";
            blocks.push(
                `<p class="chat-keyline"><span class="chat-key">${formatInlineText(keylineMatch[1])}</span>${valueHtml}</p>`
            );
            return;
        }

        paragraphLines.push(line);
    });

    flushParagraph();
    flushList();

    let html = blocks.join("");
    codeBlocks.forEach((block, index) => {
        html = html.replace(`__CODE_BLOCK_${index}__`, block);
    });

    return `<div class="formatted-response">${html}</div>`;
};

const scrollChatToBottom = () => {
    window.requestAnimationFrame(() => {
        const latestMessage = chatWindow.lastElementChild;
        if (latestMessage) {
            latestMessage.scrollIntoView({ behavior: "smooth", block: "end" });
            return;
        }

        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
});

const formatRelativeTime = (value) => {
    if (!value) return "Just now";
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const sortChats = (chats) => [...chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

const sanitizeAttachment = (attachment) => {
    if (!attachment) return null;
    return {
        kind: attachment.kind,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        previewUrl: attachment.previewUrl || "",
        extractedText: attachment.extractedText || "",
        summary: attachment.summary || ""
    };
};

const updateModelUI = () => {
    modelDropdownBtn.innerHTML = `${escapeHtml(selectedModel)} <svg xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px" fill="#e3e3e3"><path d="M480-360 280-559h400L480-360Z"/></svg>`;
    modelOptions.forEach((option) => {
        option.classList.toggle("selected", option.dataset.model === selectedModel);
    });
    modelInfo.textContent = modelDescriptions[selectedModel] || modelDescriptions["openrouter/free"];
};

const syncSidebarToggleButtons = (open) => {
    if (collapseSidebarBtn) {
        collapseSidebarBtn.textContent = open ? "left_panel_close" : "left_panel_open";
    }

    if (mobileSidebarToggleBtn) {
        mobileSidebarToggleBtn.textContent = open ? "close" : "menu";
        mobileSidebarToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }
};

const syncSidebarState = () => {
    const open = state.sidebarPinned;
    body.classList.toggle("sidebar-expanded", open);
    body.classList.toggle("sidebar-collapsed", !open);
    body.classList.toggle("sidebar-mobile-open", !isDesktopViewport() && open);
    sidebar.classList.toggle("collapsed", !open);
    sidebar.classList.toggle("expanded", open);
    sidebarScrim.classList.toggle("active", !isDesktopViewport() && open);
    syncSidebarToggleButtons(open);
    syncPopupScrollState();
};

const closeSidebarOnMobile = () => {
    if (!isDesktopViewport()) {
        state.sidebarPinned = false;
        syncSidebarState();
    }
};

const updateAppChrome = () => {
    body.classList.toggle("authenticated", state.isAuthenticated);
    body.classList.toggle("chats-active", state.messages.length > 0);
    loginBtn.style.display = state.isAuthenticated ? "none" : "inline-flex";
    registerBtn.style.display = state.isAuthenticated ? "none" : "inline-flex";
    logoutBtn.style.display = state.isAuthenticated ? "inline-flex" : "none";
};

const updateGuestUsageUI = () => {
    const guestLimitReached = isGuestLimitReached();
    const isBusy = state.isSending || state.isUploading;
    const sendLocked = guestLimitReached && !isBusy;
    body.classList.toggle("guest-limit-reached", guestLimitReached);
    sendPromptBtn.disabled = isBusy;
    sendPromptBtn.classList.toggle("is-locked", sendLocked);
    sendPromptBtn.setAttribute("aria-disabled", String(sendLocked || isBusy));
    addFileBtn.disabled = isBusy;
    addFileBtn.classList.toggle("is-locked", sendLocked);
    addFileBtn.setAttribute("aria-disabled", String(sendLocked || isBusy));
    promptInput.readOnly = sendLocked;
    promptInput.setAttribute("aria-disabled", String(sendLocked));
    promptInput.title = guestLimitReached ? "Sign in to continue chatting" : "";
    stopResponseBtn.style.display = state.isSending ? "block" : "none";
};

const renderUploadPreview = () => {
    if (!state.pendingUpload && !state.isUploading) {
        uploadPreview.hidden = true;
        uploadPreviewMedia.innerHTML = "";
        uploadPreviewMeta.hidden = false;
        return;
    }

    uploadPreview.hidden = false;

    if (state.isUploading) {
        uploadPreviewName.textContent = "Uploading file...";
        uploadPreviewMeta.textContent = "Preparing the attachment for your next message";
        uploadPreviewMeta.hidden = false;
        uploadPreviewMedia.innerHTML = '<span class="material-symbols-rounded">sync</span>';
        return;
    }

    if (state.pendingUpload?.kind === "image") {
        uploadPreviewName.textContent = state.pendingUpload.fileName;
        uploadPreviewMeta.textContent = "Image ready to send with your next prompt";
        uploadPreviewMeta.hidden = false;
        uploadPreviewMedia.innerHTML = `<img src="${state.pendingUpload.previewUrl}" alt="${escapeHtml(state.pendingUpload.fileName)}">`;
        return;
    }

    uploadPreviewName.textContent = state.pendingUpload?.fileName || "Uploaded PDF";
    uploadPreviewMeta.textContent = "";
    uploadPreviewMeta.hidden = true;
    uploadPreviewMedia.innerHTML = '<span class="material-symbols-rounded">description</span>';
};

const getFilteredChats = () => {
    const query = state.searchQuery.trim().toLowerCase();
    if (!query) return state.chatList;
    return state.chatList.filter((chat) => `${chat.title} ${chat.searchableText} ${chat.lastMessagePreview}`.toLowerCase().includes(query));
};

const renderChatList = () => {
    const filteredChats = getFilteredChats();
    chatCountBadge.textContent = String(state.chatList.length);

    if (state.chatListLoading) {
        chatList.innerHTML = `
            <div class="chat-item-skeleton"></div>
            <div class="chat-item-skeleton"></div>
            <div class="chat-item-skeleton"></div>
        `;
        chatListEmpty.hidden = true;
        return;
    }

    if (!state.isAuthenticated) {
        chatList.innerHTML = "";
        chatListEmpty.hidden = false;
        chatListEmpty.innerHTML = `
            <p class="empty-title">Saved history is locked</p>
            <p class="empty-copy">Sign in to save chats, search old conversations, and continue later.</p>
        `;
        return;
    }

    if (!filteredChats.length) {
        chatList.innerHTML = "";
        chatListEmpty.hidden = false;
        chatListEmpty.innerHTML = state.chatList.length
            ? `<p class="empty-title">No matching chats</p><p class="empty-copy">Try a different search term.</p>`
            : `<p class="empty-title">No chats yet</p><p class="empty-copy">Start a new conversation to build your history.</p>`;
        return;
    }

    chatListEmpty.hidden = true;
    chatList.innerHTML = filteredChats.map((chat) => `
        <button class="chat-list-item ${chat.chatId === state.currentChatId ? "active" : ""}" type="button" data-chat-id="${chat.chatId}">
            <span class="chat-item-title">${escapeHtml(chat.title)}</span>
            <span class="chat-item-preview">${escapeHtml(chat.lastMessagePreview || "No messages yet")}</span>
            <span class="chat-item-meta">${formatRelativeTime(chat.updatedAt)}</span>
            <span class="chat-item-actions">
                <span class="chat-item-action material-symbols-rounded" data-action="rename" title="Rename chat">edit</span>
                <span class="chat-item-action material-symbols-rounded" data-action="delete" title="Delete chat">delete</span>
            </span>
        </button>
    `).join("");
};

const renderMessages = () => {
    if (!state.messages.length) {
        chatWindow.innerHTML = "";
        updateAppChrome();
        return;
    }

    chatWindow.innerHTML = state.messages.map((message) => {
        const attachment = message.attachment;
        const attachmentHtml = attachment
            ? attachment.kind === "image"
                ? `<div class="message-attachment image-attachment"><img src="${attachment.previewUrl}" alt="${escapeHtml(attachment.fileName)}"></div>`
                : `<div class="message-attachment file-attachment-card"><span class="material-symbols-rounded">description</span><div class="file-attachment-copy"><span class="file-attachment-label">Attachment</span><strong>${escapeHtml(attachment.fileName)}</strong></div></div>`
            : "";

        if (message.role === "user") {
            return `
                <div class="message user-message" data-message-id="${message.id}">
                    <div class="user-message-shell">
                        ${attachmentHtml}
                        <div class="message-bubble user-bubble">
                            <p class="message-text">${escapeHtml(message.content)}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const contentHtml = message.loading
            ? `
                <div class="bot-message-body is-typing" aria-label="Assistant is typing">
                    <div class="typing-indicator" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `
            : `<div class="bot-message-body">${formatStructuredResponse(message.content)}</div>`;

        return `
            <div class="message bot-message ${message.loading ? "loading" : ""}" data-message-id="${message.id}">
                <div class="bot-message-shell">
                    <div class="avatar-shell">
                        <img src="images/chatbot.png" class="avatar" alt="Rishi AI">
                    </div>
                    <div class="bot-message-card">
                        ${attachmentHtml}
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    updateAppChrome();
    document.querySelectorAll("pre code").forEach((block) => {
        window.hljs?.highlightElement(block);
    });
    scrollChatToBottom();
};

const upsertChatSummary = (chat) => {
    if (!chat?.chatId) return;
    const summary = {
        chatId: chat.chatId,
        title: chat.title,
        createdAt: chat.createdAt || new Date().toISOString(),
        updatedAt: chat.updatedAt || new Date().toISOString(),
        messageCount: chat.messageCount ?? state.messages.length,
        lastMessagePreview: chat.lastMessagePreview || (state.messages.at(-1)?.content || "No messages yet"),
        searchableText: chat.searchableText || `${chat.title} ${state.messages.map((message) => message.content).join(" ")}`
    };

    state.chatList = sortChats([summary, ...state.chatList.filter((item) => item.chatId !== summary.chatId)]);
};

const resetConversationState = ({ preserveChatId = false } = {}) => {
    state.messages = [];
    state.pendingUpload = null;
    state.isUploading = false;
    if (!preserveChatId) {
        state.currentChatId = null;
    }
    promptInput.value = "";
    state.draft = "";
    renderUploadPreview();
    renderMessages();
    updateGuestUsageUI();
};
const apiFetch = async (url, options = {}) => {
    const {
        method = "GET",
        body: requestBody,
        headers = {},
        authMode = "optional",
        signal
    } = options;

    const token = authStorage.getToken();
    const requestHeaders = { ...headers };

    if (requestBody && !requestHeaders["Content-Type"]) {
        requestHeaders["Content-Type"] = "application/json";
    }

    if (token && authMode !== "none") {
        requestHeaders.Authorization = `Bearer ${token}`;
    }

    if (authMode === "required" && !token) {
        throw new Error("Please sign in to continue.");
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        if ((response.status === 401 || response.status === 403) && token) {
            authStorage.clearToken();
            state.isAuthenticated = false;
            state.currentUser = null;
            state.chatList = [];
            state.currentChatId = null;
            state.messages = [];
            updateAppChrome();
            renderChatList();
            renderMessages();
        }

        throw new Error(payload.error || "Request failed");
    }

    return payload;
};

const createLocalMessage = (role, content, attachment = null, loading = false) => ({
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role,
    content,
    attachment: sanitizeAttachment(attachment),
    loading,
    createdAt: new Date().toISOString()
});

const openLoginModal = () => {
    closePopup(registerPopup);
    closePopup(guestLimitPopup);
    openPopup(loginPopup);
    loginEmail.focus();
};

const openRegisterModal = () => {
    closePopup(loginPopup);
    closePopup(guestLimitPopup);
    openPopup(registerPopup);
    registerEmail.focus();
};

const openRenameChatModal = (chat) => {
    if (!chat) return;
    state.pendingSidebarAction = { type: "rename", chatId: chat.chatId };
    renameChatInput.value = chat.title || "New chat";
    openPopup(renameChatPopup);
    window.requestAnimationFrame(() => {
        renameChatInput.focus();
        renameChatInput.select();
    });
};

const openDeleteChatModal = (chat) => {
    if (!chat) return;
    state.pendingSidebarAction = { type: "delete", chatId: chat.chatId };
    deleteChatCopy.textContent = `Delete "${chat.title || "this chat"}" permanently? This action cannot be undone.`;
    openPopup(deleteChatPopup);
};

const clearPendingSidebarAction = () => {
    state.pendingSidebarAction = null;
};

const loadChat = async (chatId) => {
    if (!state.isAuthenticated || !chatId) return;

    state.currentChatId = chatId;
    state.currentChatLoading = true;
    renderChatList();

    try {
        const data = await apiFetch(`/api/chat/${chatId}`, { authMode: "required" });
        state.messages = data.chat.messages || [];
        state.currentChatId = data.chat.chatId;
        renderMessages();
        renderChatList();
        closeSidebarOnMobile();
    } catch (error) {
        showGlobalToast(error.message || "Failed to load chat", "error");
    } finally {
        state.currentChatLoading = false;
        renderChatList();
    }
};

const refreshChats = async ({ autoSelect = true } = {}) => {
    if (!state.isAuthenticated) {
        state.chatList = [];
        renderChatList();
        return;
    }

    state.chatListLoading = true;
    renderChatList();

    try {
        const data = await apiFetch("/api/chats", { authMode: "required" });
        state.chatList = sortChats(data.chats || []);
        renderChatList();

        if (autoSelect && state.currentChatId) {
            const currentExists = state.chatList.some((chat) => chat.chatId === state.currentChatId);
            if (currentExists) return;
        }

        if (autoSelect && state.chatList.length) {
            await loadChat(state.chatList[0].chatId);
        } else if (!state.chatList.length) {
            resetConversationState();
        }
    } catch (error) {
        showGlobalToast(error.message || "Failed to load chat history", "error");
    } finally {
        state.chatListLoading = false;
        renderChatList();
    }
};

const handleLoginSuccess = async (payload) => {
    authStorage.setToken(payload.token);
    resetGuestCount();
    state.isAuthenticated = true;
    state.currentUser = payload.user || null;
    closeAllPopups();
    resetConversationState();
    await refreshChats({ autoSelect: true });
    updateAppChrome();
    updateGuestUsageUI();
    showGlobalToast(payload.message || "Login successful", "success");
};

const handleLogout = () => {
    authStorage.clearToken();
    state.isAuthenticated = false;
    state.currentUser = null;
    state.chatList = [];
    resetConversationState();
    updateAppChrome();
    renderChatList();
    showGlobalToast("Logged out successfully.", "success");
};

const createNewChat = async () => {
    if (!state.isAuthenticated) {
        resetConversationState();
        promptInput.focus();
        closeSidebarOnMobile();
        return;
    }

    try {
        const data = await apiFetch("/api/chat/new", {
            method: "POST",
            body: JSON.stringify({}),
            authMode: "required"
        });

        state.currentChatId = data.chat.chatId;
        state.messages = [];
        upsertChatSummary(data.chat);
        renderMessages();
        renderChatList();
        closeSidebarOnMobile();
        promptInput.focus();
    } catch (error) {
        showGlobalToast(error.message || "Failed to create a new chat", "error");
    }
};

const handleDeleteCurrentConversation = async () => {
    promptInput.value = "";
    state.draft = "";

    if (state.pendingUpload) {
        state.pendingUpload = null;
        fileInput.value = "";
        renderUploadPreview();
    }

    updateGuestUsageUI();
    promptInput.focus();
    showGlobalToast("Prompt cleared", "success");
};

const handleSidebarClick = async (event) => {
    const actionButton = event.target.closest("[data-action]");
    const chatItem = event.target.closest(".chat-list-item");
    if (!chatItem) return;

    const chatId = chatItem.dataset.chatId;
    if (!chatId) return;

    if (actionButton) {
        event.preventDefault();
        event.stopPropagation();
        const action = actionButton.dataset.action;

        if (action === "rename") {
            const existingChat = state.chatList.find((chat) => chat.chatId === chatId);
            openRenameChatModal(existingChat);
            return;
        }

        if (action === "delete") {
            const existingChat = state.chatList.find((chat) => chat.chatId === chatId);
            openDeleteChatModal(existingChat);
            return;
        }
    }

    await loadChat(chatId);
};

const handleFileSelection = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (blockGuestLimitAttempt()) {
        fileInput.value = "";
        return;
    }

    if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
        showGlobalToast("Upload a PDF, JPG, or PNG file.", "error");
        fileInput.value = "";
        return;
    }

    try {
        state.isUploading = true;
        renderUploadPreview();
        updateGuestUsageUI();

        const dataUrl = await readFileAsDataUrl(file);
        const payload = await apiFetch("/api/upload", {
            method: "POST",
            authMode: "optional",
            body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type,
                dataUrl
            })
        });

        state.pendingUpload = sanitizeAttachment(payload.upload);
        showGlobalToast(`${file.name} attached`, "success");
    } catch (error) {
        state.pendingUpload = null;
        showGlobalToast(error.message || "Upload failed", "error");
    } finally {
        state.isUploading = false;
        fileInput.value = "";
        renderUploadPreview();
        updateGuestUsageUI();
    }
};

const removePendingUpload = () => {
    state.pendingUpload = null;
    fileInput.value = "";
    renderUploadPreview();
};
const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (state.isSending || state.isUploading) return;
    if (blockGuestLimitAttempt(event)) return;

    const typedMessage = promptInput.value.trim();
    if (!typedMessage && !state.pendingUpload) return;

    const outgoingMessageText = typedMessage || (state.pendingUpload?.kind === "pdf" ? "Please analyze this PDF." : "Please analyze this image.");
    const outgoingAttachment = state.pendingUpload ? { ...state.pendingUpload } : null;
    const historyForRequest = state.messages.map((message) => ({
        role: message.role,
        content: message.content,
        attachment: sanitizeAttachment(message.attachment),
        createdAt: message.createdAt,
        id: message.id
    }));

    if (!state.isAuthenticated) {
        const nextGuestCount = incrementGuestCount();
        const remainingMessages = GUEST_PROMPT_LIMIT - nextGuestCount;
        if (remainingMessages === 1) {
            showGlobalToast("1 free message remaining", "info");
        }
    }

    const userMessage = createLocalMessage("user", outgoingMessageText, outgoingAttachment);
    const loadingMessage = createLocalMessage("assistant", "Thinking...", null, true);

    state.messages = [...state.messages, userMessage, loadingMessage];
    state.pendingUpload = null;
    state.isSending = true;
    promptInput.value = "";
    state.draft = "";
    renderUploadPreview();
    renderMessages();
    updateGuestUsageUI();

    const requestController = new AbortController();
    state.requestController = requestController;

    try {
        const payload = await apiFetch("/api/chat", {
            method: "POST",
            authMode: "optional",
            signal: requestController.signal,
            body: JSON.stringify({
                chatId: state.isAuthenticated ? state.currentChatId : null,
                message: outgoingMessageText,
                model: selectedModel,
                history: historyForRequest,
                attachment: outgoingAttachment
            })
        });

        state.messages = state.messages.map((message) => message.id === loadingMessage.id ? payload.message : message);

        if (state.isAuthenticated) {
            state.currentChatId = payload.chatId || state.currentChatId;
            if (payload.chat) {
                upsertChatSummary(payload.chat);
            }
            renderChatList();
        }
    } catch (error) {
        const errorContent = error.name === "AbortError"
            ? "Response stopped."
            : `I ran into an issue: ${error.message || "Unable to finish the request."}`;

        state.messages = state.messages.map((message) => message.id === loadingMessage.id
            ? createLocalMessage("assistant", errorContent)
            : message
        );
        showGlobalToast(error.message || "Message failed", "error");
    } finally {
        state.isSending = false;
        state.requestController = null;
        renderMessages();
        updateGuestUsageUI();
    }
};

const stopActiveResponse = () => {
    state.requestController?.abort();
};

const setupChangelog = async () => {
    if (changelogLoaded) {
        openPopup(changelogPopup);
        return;
    }

    try {
        changelogContainer.innerHTML = "<p>Loading changelog...</p>";
        openPopup(changelogPopup);
        const response = await fetch("changelog.json");
        const payload = await response.json();

        const html = `
            <div class="changelog-shell">
                <div class="changelog-heading">
                    <p class="changelog-eyebrow">✨ OpenRouter Updates</p>
                    <h2>Announcements</h2>
                    <p class="changelog-subtitle">Experience faster, smarter, and more flexible AI with multi-model support.</p>
                    <div class="changelog-meta">
                        <span class="changelog-badge">Powered by OpenRouter</span>
                        <span class="changelog-helper">Access multiple AI models through a single unified platform.</span>
                    </div>
                </div>
                <div class="changelog-list">
                    ${payload.versions.map((version, index) => `
                        <section class="changelog-entry ${index === 0 ? "is-latest" : ""}">
                            <div class="changelog-entry-top">
                                <p class="changelog-version">${index === 0 ? "🚀" : index === 1 ? "⚡" : "🧠"} Version ${escapeHtml(version.version)}</p>
                                ${index === 0 ? '<span class="changelog-latest-pill">Latest Release</span>' : ""}
                            </div>
                            <p class="changelog-date">${escapeHtml(version.date)}</p>
                            <ul class="changelog-points">
                                ${version.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}
                            </ul>
                        </section>
                    `).join("")}
                </div>
            </div>
        `;

        changelogContainer.innerHTML = html;
        changelogLoaded = true;
    } catch (error) {
        changelogContainer.innerHTML = "<p>Unable to load the changelog right now.</p>";
    }
};

const handleSearchInput = () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        state.searchQuery = chatSearchInput.value.trim();
        renderChatList();
    }, 180);
};

const handleRenameChatSubmit = async (event) => {
    event.preventDefault();
    const chatId = state.pendingSidebarAction?.chatId;
    const nextTitle = renameChatInput.value.trim();
    if (!chatId || !nextTitle) return;

    renameChatSaveBtn.disabled = true;
    renameChatSaveBtn.textContent = "Saving...";

    try {
        const data = await apiFetch(`/api/chat/${chatId}`, {
            method: "PATCH",
            body: JSON.stringify({ title: nextTitle }),
            authMode: "required"
        });
        upsertChatSummary(data.chat);
        renderChatList();
        closePopup(renameChatPopup);
        clearPendingSidebarAction();
        showGlobalToast("Chat renamed", "success");
    } catch (error) {
        showGlobalToast(error.message || "Unable to rename chat", "error");
    } finally {
        renameChatSaveBtn.disabled = false;
        renameChatSaveBtn.textContent = "Save Changes";
    }
};

const handleDeleteChatConfirm = async () => {
    const chatId = state.pendingSidebarAction?.chatId;
    if (!chatId) return;

    deleteChatConfirmBtn.disabled = true;
    deleteChatConfirmBtn.textContent = "Deleting...";

    try {
        await apiFetch(`/api/chat/${chatId}`, {
            method: "DELETE",
            authMode: "required"
        });
        state.chatList = state.chatList.filter((chat) => chat.chatId !== chatId);
        if (state.currentChatId === chatId) {
            resetConversationState();
            promptInput.focus();
        }
        renderChatList();
        closePopup(deleteChatPopup);
        clearPendingSidebarAction();
        showGlobalToast("Chat deleted", "success");
    } catch (error) {
        showGlobalToast(error.message || "Unable to delete chat", "error");
    } finally {
        deleteChatConfirmBtn.disabled = false;
        deleteChatConfirmBtn.textContent = "Delete Chat";
    }
};

const bindSuggestionTiles = () => {
    suggestionItems.forEach((tile) => {
        const activate = () => {
            if (blockGuestLimitAttempt()) return;
            promptInput.value = tile.dataset.prompt || tile.querySelector(".text")?.textContent?.trim() || "";
            state.draft = promptInput.value;
            promptInput.focus();
            promptInput.setSelectionRange(promptInput.value.length, promptInput.value.length);
        };

        tile.addEventListener("click", activate);
        tile.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activate();
            }
        });
    });
};

const initAuthForms = () => {
    loginForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = loginForm.querySelector(".auth-submit");
        submitButton.disabled = true;
        submitButton.textContent = "Signing In...";

        try {
            const payload = await apiFetch("/api/login", {
                method: "POST",
                authMode: "none",
                body: JSON.stringify({
                    email: loginEmail.value.trim(),
                    password: loginPassword.value.trim()
                })
            });

            loginForm.reset();
            await handleLoginSuccess(payload);
        } catch (error) {
            showGlobalToast(error.message || "Login failed", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Sign In";
        }
    });

    registerForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const emailValue = registerEmail.value.trim();
        const submitButton = registerForm.querySelector(".auth-submit");
        submitButton.disabled = true;
        submitButton.textContent = "Creating...";

        try {
            const payload = await apiFetch("/api/register", {
                method: "POST",
                authMode: "none",
                body: JSON.stringify({
                    email: emailValue,
                    password: registerPassword.value.trim()
                })
            });

            registerForm.reset();
            closePopup(registerPopup);
            openLoginModal();
            loginEmail.value = emailValue;
            showGlobalToast(payload.message || "Account created. Please sign in.", "success");
        } catch (error) {
            showGlobalToast(error.message || "Registration failed", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Create Account";
        }
    });
};

const initializeSession = async () => {
    updateModelUI();
    updateAppChrome();
    renderUploadPreview();
    renderChatList();
    renderMessages();
    updateGuestUsageUI();
    syncSidebarState();

    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
    body.classList.toggle("light-theme", isLightTheme);
    themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";

    if (authStorage.getToken()) {
        try {
            state.isAuthenticated = true;
            await refreshChats({ autoSelect: true });
        } catch (error) {
            handleLogout();
        }
    }
};
collapseSidebarBtn.addEventListener("click", () => {
    state.sidebarPinned = !state.sidebarPinned;
    state.sidebarPeekOpen = false;
    syncSidebarState();
});

mobileSidebarToggleBtn?.addEventListener("click", () => {
    state.sidebarPinned = !state.sidebarPinned;
    state.sidebarPeekOpen = false;
    syncSidebarState();
});

sidebarScrim.addEventListener("click", () => {
    state.sidebarPinned = false;
    syncSidebarState();
});

window.addEventListener("resize", () => {
    if (isDesktopViewport() && body.classList.contains("sidebar-mobile-open")) {
        state.sidebarPinned = true;
    }
    syncSidebarState();
});

modelDropdownBtn.addEventListener("click", () => {
    modelDropdown.classList.toggle("active");
});

modelOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectedModel = option.dataset.model || "openrouter/free";
        localStorage.setItem("selectedModel", selectedModel);
        updateModelUI();
        modelDropdown.classList.remove("active");
    });
});

promptForm.addEventListener("submit", handleFormSubmit);
promptInput.addEventListener("input", () => {
    state.draft = promptInput.value;
});
promptInput.addEventListener("pointerdown", (event) => {
    if (blockGuestLimitAttempt(event)) {
        promptInput.blur();
    }
});
promptInput.addEventListener("focus", () => {
    if (isGuestLimitReached()) {
        openPopup(guestLimitPopup);
        promptInput.blur();
    }
});
sendPromptBtn.addEventListener("click", (event) => {
    blockGuestLimitAttempt(event);
});
addFileBtn.addEventListener("click", (event) => {
    if (blockGuestLimitAttempt(event)) return;
    fileInput.click();
});
fileInput.addEventListener("change", handleFileSelection);
removeUploadBtn.addEventListener("click", removePendingUpload);
stopResponseBtn.addEventListener("click", stopActiveResponse);
deleteChatsBtn.addEventListener("click", handleDeleteCurrentConversation);
themeToggleBtn.addEventListener("click", () => {
    const isLightTheme = body.classList.toggle("light-theme");
    localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
    themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

chatSearchInput.addEventListener("input", handleSearchInput);
chatList.addEventListener("click", handleSidebarClick);
newChatBtn.addEventListener("click", createNewChat);

loginBtn.addEventListener("click", openLoginModal);
registerBtn.addEventListener("click", openRegisterModal);
logoutBtn.addEventListener("click", handleLogout);
closeLoginBtn.addEventListener("click", () => closePopup(loginPopup));
closeRegisterBtn.addEventListener("click", () => closePopup(registerPopup));
closeGuestLimitBtn.addEventListener("click", () => closePopup(guestLimitPopup));
closeRenameChatBtn.addEventListener("click", () => {
    closePopup(renameChatPopup);
    clearPendingSidebarAction();
});
closeDeleteChatBtn.addEventListener("click", () => {
    closePopup(deleteChatPopup);
    clearPendingSidebarAction();
});
guestLimitCancelBtn.addEventListener("click", () => closePopup(guestLimitPopup));
guestLimitSignInBtn.addEventListener("click", openLoginModal);
guestLimitSignUpBtn.addEventListener("click", openRegisterModal);
renameChatForm.addEventListener("submit", handleRenameChatSubmit);
renameChatCancelBtn.addEventListener("click", () => {
    closePopup(renameChatPopup);
    clearPendingSidebarAction();
});
deleteChatCancelBtn.addEventListener("click", () => {
    closePopup(deleteChatPopup);
    clearPendingSidebarAction();
});
deleteChatConfirmBtn.addEventListener("click", handleDeleteChatConfirm);
openRegisterLink.addEventListener("click", (event) => {
    event.preventDefault();
    openRegisterModal();
});
openLoginLink.addEventListener("click", (event) => {
    event.preventDefault();
    openLoginModal();
});
forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();
    showGlobalToast("Password reset is not available yet.", "info");
});

[loginPopup, registerPopup, guestLimitPopup, renameChatPopup, deleteChatPopup, changelogPopup, infoPopup].forEach((popup) => {
    popup?.addEventListener("click", (event) => {
        if (event.target === popup) {
            closePopup(popup);
            if (popup === renameChatPopup || popup === deleteChatPopup) {
                clearPendingSidebarAction();
            }
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeAllPopups();
        if (!isDesktopViewport()) {
            state.sidebarPinned = false;
            syncSidebarState();
        }
    }
});

openChangelogBtn.addEventListener("click", setupChangelog);
closeChangelogBtn.addEventListener("click", () => closePopup(changelogPopup));
closeInfoPopupBtn.addEventListener("click", () => closePopup(infoPopup));

bindSuggestionTiles();
initAuthForms();
initializeSession();
