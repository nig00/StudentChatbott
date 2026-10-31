"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { handleRequest, TOPICS } = require("../lib/advisor");
const { processWebhook } = require("../lib/http");

const examples = [
  ["Recommend me a course on Python", "Python"],
  ["Recommend me a course on Data Analysis Tools", "Data Analysis Tools"],
  ["Recommend me a course on Data Science", "Data Science"],
  ["Recommend me a course on Nanotechnology", "Nanotechnology"],
  ["Recommend me a course on Javascript", "JavaScript"]
];

for (const [query, expectedTopic] of examples) {
  test(`grades: ${query}`, () => {
    const result = handleRequest({ input: { text: query } });
    assert.equal(result.topic, expectedTopic);
    assert.equal(result.intent, "course_recommendation");
    assert.ok(result.recommendations.length >= 1);
    assert.match(result.answer, /coursera\.org\/search/);
    assert.deepEqual(result.output.generic[0].text, result.answer);
  });
}

test("responds politely to greeting", () => {
  assert.match(handleRequest({ query: "Hello!" }).answer, /Hello!/);
});

test("responds politely to thanks", () => {
  assert.match(handleRequest({ query: "Thank you" }).answer, /welcome/i);
});

test("adapts beginner recommendations", () => {
  const result = handleRequest({ query: "I'm a beginner, recommend Python" });
  assert.ok(result.recommendations.every(course => course.level === "Beginner"));
});

test("handles unknown subjects without inventing courses", () => {
  const result = handleRequest({ query: "Recommend a course on medieval calligraphy" });
  assert.equal(result.intent, "fallback");
  assert.match(result.answer, /couldn't identify/i);
});

test("supports action webhook payload shape", () => {
  const result = handleRequest({ parameters: { topic: "Javascript" } });
  assert.equal(result.topic, "JavaScript");
});

test("validates webhook key when configured", () => {
  const oldKey = process.env.STUDENT_ADVISOR_API_KEY;
  process.env.STUDENT_ADVISOR_API_KEY = "grade-demo-secret";
  try {
    assert.equal(processWebhook({ query: "Python" }, {}).status, 401);
    assert.equal(processWebhook({ query: "Python" }, { "x-advisor-key": "grade-demo-secret" }).status, 200);
  } finally {
    if (oldKey === undefined) delete process.env.STUDENT_ADVISOR_API_KEY;
    else process.env.STUDENT_ADVISOR_API_KEY = oldKey;
  }
});

test("all topics are represented in catalog", () => {
  for (const topic of TOPICS) {
    assert.ok(handleRequest({ topic }).recommendations.length > 0, topic);
  }
});
