const axios = require("axios");

async function extractEvent(userMessage) {
  try {
    const prompt = `
Convert the following calendar request into JSON.

Current timezone: Asia/Kolkata

Return ONLY valid JSON in this format:

{
  "title": "",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}

User message:
"${userMessage}"
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

    const content =
      response.data.choices[0].message.content;

    return JSON.parse(content);
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  extractEvent,
};