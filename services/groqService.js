const axios = require("axios");

async function extractEvent(userMessage) {
  try {
    const prompt = `
Extract calendar event details.

Return ONLY raw JSON.

No markdown.
No explanation.
No code blocks.

Format:

{
  "title": "",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}

User message:
${userMessage}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let content =
      response.data.choices[0].message.content;

    content = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(content);
  } catch (error) {
    console.error(
      error.response?.data || error.message
    );

    throw error;
  }
}

module.exports = {
  extractEvent,
};