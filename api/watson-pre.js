"use strict";

// IBM watsonx Assistant / Orchestrate pre-message webhook endpoint.
// IBM sends { event: { name: "message_received" }, payload: { input, context } }.
// See IBM's pre-message webhook documentation for the special response header.

const { handleRequest } = require("../lib/advisor");
const { isAuthorized } = require("../lib/http");

module.exports = async function watsonPre(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  if (!isAuthorized(req.headers || {})) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  if (!body || typeof body !== "object" || !body.payload || typeof body.payload !== "object") {
    return res.status(400).json({ error: "Expected a Watson pre-message payload" });
  }

  const text = body.payload.input?.text;
  if (typeof text === "string" && text.trim()) {
    const recommendation = handleRequest({ query: text });

    if (recommendation.intent === "course_recommendation") {
      // Instruct Watson to return our course recommendations directly, instead
      // of running its static actions for these five topics.
      res.setHeader("X-Watson-Assistant-Webhook-Return", "true");
      return res.status(200).json({ output: recommendation.output });
    }
  }

  // Leave other messages (greetings, thanks, unknown input) unchanged so the
  // regular Watson Assistant actions still process them.
  return res.status(200).json({ payload: body.payload });
};
