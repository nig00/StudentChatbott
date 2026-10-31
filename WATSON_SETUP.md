# Watson Assistant setup — Student Advisor

The Watson user interface has changed across releases and account plans. Some course environments provide a **Dialog skill** with **Options → Webhooks**; newer interfaces emphasize **Actions** and integrations/extensions. Use the corresponding controls in your account, and prioritize the course-provided instructions where labels differ.

## 1. Create the assistant and skill/action

1. Open IBM watsonx Assistant / Watson Assistant in your IBM Cloud account.
2. Create an assistant named **Coursera Student Advisor** (unless the course already gave you a basic assistant to extend).
3. Create or extend the conversation skill/action called **Student Advisor**. Set English as its conversation language.
4. Create training examples/intents/steps for:
   - Course recommendation: `Recommend me a course on Python`, `Find a Data Science course`, `Suggest Data Analysis Tools`, `Teach me JavaScript`, `I want to learn Nanotechnology`.
   - Greetings: `Hi`, `Hello`, `Good morning`.
   - Thanks: `Thank you`, `Thanks`.
   - Farewell: `Goodbye`, `Bye`.
   - Fallback/help for unmatched input.

## 2. Deploy the recommendation endpoint

The supplied Node.js project runs locally, but **Watson must reach its webhook over public HTTPS** for real chat testing. The course does not grade the deployment itself, but webhook-based course responses require a reachable URL while you test.

One simple hosting option is Vercel:

1. Push the complete project to your **StudentChatbott** GitHub repository.
2. In your own Vercel account, add a new project from that repository. Keep the root directory as the repository root and deploy. No custom build command is needed for the included serverless function.
3. Set environment variable **`STUDENT_ADVISOR_API_KEY`** to a random secret and redeploy if prompted.
4. The API endpoint is `https://YOUR-PROJECT.vercel.app/api/recommend` (replace `YOUR-PROJECT` with the real assigned domain).

You can use another HTTPS Node.js host, including IBM Cloud, if preferred.

## 3. Configure the webhook

In your Watson skill's webhook or external-service settings, set:

**URL:** `https://YOUR-REAL-HOST/api/recommend`

**Method:** `POST`

**Headers:**

| Name | Value |
| --- | --- |
| `Content-Type` | `application/json` |
| `x-advisor-key` | The private API key you configured in the host |

**Request JSON body** (adapt your Watson UI's variable syntax to insert the current user utterance):

```json
{
  "query": "THE_CURRENT_USER_MESSAGE"
}
```

`THE_CURRENT_USER_MESSAGE` is a placeholder for Watson's user-input variable or action step variable, not literal text to submit. If your Watson UI sends its default `input.text` property, the backend recognizes that too. For an action that first collects a course topic, you can instead send `{ "topic": "THE_COLLECTED_TOPIC" }`.

**Response mapping:** read the webhook JSON's **`answer`** field and display it as an assistant text response. Depending on Watson version this may be called a response variable, output variable, session variable, or webhook result expression. A generic response mapping should reference `answer`, not the entire JSON object.

## 4. Wire up your conversation

1. The course-recommendation step should call the webhook and show its `answer`.
2. A greeting step should say: "Hello! I'm your Coursera Student Advisor. What subject would you like to learn?"
3. A thank-you step should say: "You're welcome! Happy learning!"
4. A farewell step should say: "Goodbye and good luck with your studies!"
5. Add a fallback step such as: "I can recommend courses on Python, Data Analysis Tools, Data Science, Nanotechnology, or JavaScript. What interests you?"

If your flow sends **all** user messages to the webhook, greeting/thanks/farewell/help are already handled by the backend. You can still add these as explicit Watson steps for a more polished demo.

## 5. Test before taking screenshots

Use Watson's preview/test-chat panel. Enter these **exact** messages one at a time:

1. `Recommend me a course on Python`
2. `Recommend me a course on Data Analysis Tools`
3. `Recommend me a course on Data Science`
4. `Recommend me a course on Nanotechnology`
5. `Recommend me a course on Javascript`
6. `Hello`
7. `Thank you`

Each recommendation should contain the topic name, at least one relevant course title/provider, and a Coursera search link. Greeting and thanks should sound natural. Fix any missed intent, input-variable, or response mapping before submitting the evidence.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Watson says the webhook failed | Confirm HTTPS URL, `/api/recommend` path, POST method, working host, and API key |
| `401 Unauthorized` | The value of `x-advisor-key` must exactly match `STUDENT_ADVISOR_API_KEY` |
| `400 Invalid JSON body` | Confirm your request body is JSON and the `Content-Type` header is set |
| Reply says it couldn't identify a topic | Ensure Watson sends the **current user text**, not a literal placeholder string |
| Assistant shows raw JSON | Display the `answer` property rather than the full webhook response |
| A greeting works but courses don't | Make sure the recommendation action actually calls the webhook |

Only claim the skill, settings, and conversations are completed after seeing them work in your Watson account.
