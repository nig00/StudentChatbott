"use strict";

const crypto = require("node:crypto");
const { handleRequest } = require("./advisor");

function isAuthorized(headers = {}) {
  const configuredKey = process.env.STUDENT_ADVISOR_API_KEY;
  // Local demo is open by default; set this environment variable for every hosted deployment.
  if (!configuredKey) return true;
  const headerKey = headers["x-advisor-key"];
  const authorization = headers.authorization;
  const suppliedKey = Array.isArray(headerKey) ? headerKey[0] : headerKey ||
    (typeof authorization === "string" && authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "");

  if (typeof suppliedKey !== "string") return false;
  const expected = Buffer.from(configuredKey, "utf8");
  const actual = Buffer.from(suppliedKey, "utf8");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function processWebhook(body, headers = {}) {
  if (!isAuthorized(headers)) return { status: 401, data: { success: false, error: "Unauthorized" } };
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { status: 400, data: { success: false, error: "Send a JSON object containing query or input.text" } };
  }
  return { status: 200, data: handleRequest(body) };
}

module.exports = { isAuthorized, processWebhook };
