"use strict";

// Serverless entrypoint: Vercel exposes this file at /api/recommend.
const { processWebhook } = require("../lib/http");

module.exports = async function recommend(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Use POST" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ success: false, error: "Invalid JSON body" });
      return;
    }
  }
  const outcome = processWebhook(body, req.headers);
  res.status(outcome.status).json(outcome.data);
};
