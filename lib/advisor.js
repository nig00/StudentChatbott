"use strict";

const { courses } = require("../coursera_courses.json");

const TOPICS = ["Python", "Data Analysis Tools", "Data Science", "Nanotechnology", "JavaScript"];

function readMessage(body) {
  if (!body || typeof body !== "object") return "";

  const candidates = [
    body.topic,
    body.query,
    body.message,
    body.text,
    body.utterance,
    body.input && body.input.text,
    typeof body.input === "string" ? body.input : undefined,
    body.parameters && body.parameters.topic,
    body.parameters && body.parameters.query,
    body.properties && body.properties.topic,
    body.properties && body.properties.query,
    body.context && body.context.topic
  ];

  return candidates.find(value => typeof value === "string" && value.trim())?.trim() || "";
}

function recognizeTopic(text) {
  const message = text.toLowerCase();

  // Specific phrases come first so "Data Analysis Tools" is not mistaken for Data Science.
  if (/nano\s*technology|nano\s*sensors|nano\s*science/.test(message)) return "Nanotechnology";
  if (/java\s*script|\bjs\b|front[ -]?end/.test(message)) return "JavaScript";
  if (/data\s+analys(is|tics?)\s+tools?|analys(is|tics?)\s+tools?|\bexcel\b|\btableau\b|power\s*bi/.test(message)) {
    return "Data Analysis Tools";
  }
  if (/\bpython\b/.test(message)) return "Python";
  if (/data\s+scien(ce|tist)|machine\s+learning/.test(message)) return "Data Science";
  if (/data\s+analys(is|tics?)|data\s+analyst/.test(message)) return "Data Analysis Tools";

  return null;
}

function recognizeChitChat(text) {
  const message = text.trim().toLowerCase();
  if (/\b(thank you|thanks|thank u|thx|merci)\b/.test(message)) {
    return "You're very welcome! I can help you find more Coursera courses anytime.";
  }
  if (/\b(bye|goodbye|see you|farewell)\b/.test(message)) {
    return "Goodbye, and good luck with your learning!";
  }
  if (/\b(hello|hi|hey|good morning|good afternoon|good evening|greetings)\b/.test(message)) {
    return "Hello! I'm your Coursera Student Advisor. Ask me for a course on Python, Data Analysis Tools, Data Science, Nanotechnology, or JavaScript.";
  }
  if (/\b(help|what can you do|topics|subjects|courses)\b/.test(message)) {
    return `I recommend Coursera courses in: ${TOPICS.join(", ")}. For example, ask: "Recommend me a course on Python".`;
  }
  return null;
}

function getRecommendations(topic, text) {
  const matches = courses.filter(course => course.category === topic);
  const requestedIntermediate = /intermediate|advanced|experienced/i.test(text);
  const requestedBeginner = /beginner|new\s+to|start(ing)?\s+out|no\s+experience/i.test(text);

  const preferredLevel = requestedIntermediate ? "Intermediate" : requestedBeginner ? "Beginner" : null;
  const sorted = preferredLevel
    ? [...matches].sort((first, second) => Number(second.level === preferredLevel) - Number(first.level === preferredLevel))
    : matches;

  return sorted.slice(0, 3);
}

function makeResponse(input) {
  const topic = recognizeTopic(input);
  const recommendations = topic ? getRecommendations(topic, input) : [];
  let intent;
  let answer;

  if (topic && recommendations.length) {
    intent = "course_recommendation";
    const list = recommendations.map((course, index) =>
      `${index + 1}. ${course.title} — ${course.provider} (${course.level})\n` +
      `   ${course.description}\n   Find it: ${course.url}`
    ).join("\n\n");
    answer = `Here are my Coursera suggestions for ${topic}:\n\n${list}\n\nTip: Tell me if you're a beginner or intermediate learner for a better match.`;
  } else if (topic) {
    intent = "no_match";
    answer = `I don't have a verified ${topic} course in my sample catalog yet. You can search Coursera directly, or ask about ${TOPICS.filter(value => value !== topic).join(", ")}.`;
  } else {
    const chitChat = recognizeChitChat(input);
    intent = chitChat ? "chit_chat" : "fallback";
    answer = chitChat || `I couldn't identify a course topic in that request. Try one of these: ${TOPICS.join(", ")}.`;
  }

  return {
    success: true,
    intent,
    topic,
    answer,
    message: answer,
    result: answer,
    recommendations,
    // The plain `answer` field is easiest to map to a Watson action variable.
    // The `output.generic` shape is also useful to dialog-oriented integrations.
    output: { generic: [{ response_type: "text", text: answer }] }
  };
}

function handleRequest(body) {
  return makeResponse(readMessage(body));
}

module.exports = { TOPICS, readMessage, recognizeTopic, makeResponse, handleRequest };
