"use strict";

const http = require("node:http");
const { processWebhook } = require("./lib/http");

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_BYTES = 32 * 1024;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", service: "StudentChatbott" }));
    return;
  }

  if (req.url !== "/api/recommend" || req.method !== "POST") {
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: "Use POST /api/recommend" }));
    return;
  }

  let raw = "";
  let oversized = false;
  req.on("data", chunk => {
    raw += chunk;
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      oversized = true;
      req.destroy();
    }
  });
  req.on("end", () => {
    if (oversized) return;
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: "Invalid JSON body" }));
      return;
    }

    const result = processWebhook(body, req.headers);
    res.writeHead(result.status);
    res.end(JSON.stringify(result.data));
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    process.stdout.write(`StudentChatbott listening at http://localhost:${PORT}\n`);
  });
}

module.exports = server;
