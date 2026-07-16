const fs = require("fs");
const path = require("path");
const express = require("express");
const { app, ensureDatabase } = require("./server/app");
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");
const distIndexPath = path.join(distPath, "index.html");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (!fs.existsSync(distIndexPath)) {
    return res
      .status(503)
      .send("Frontend build not found. Run `npm run build` before starting the server.");
  }

  res.sendFile(distIndexPath);
});

ensureDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
