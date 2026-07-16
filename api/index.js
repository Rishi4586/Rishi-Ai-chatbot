const { app, ensureDatabase } = require("../server/app");

module.exports = async (req, res) => {
  try {
    await ensureDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API bootstrap error:", error);
    return res.status(500).json({ error: "Service unavailable" });
  }
};
