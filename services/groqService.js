const axios = require("axios");

async function extractEvent(userMessage) {
  try {
    const today = new Date();

    const currentDate =
      `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;

    const prompt = `
Today's date is ${currentDate}.
Timezone is Asia/Kolkata.

Extract the calendar event.

Return ONLY raw JSON.

NO markdown.
NO explanation.
NO code block.

Format:

{
  "title": "",
  "date": "YYYY-MM-DD",
  "time": "HH:MM"
}

Examples:

Input:
Meeting tomorrow at 4 PM

Output:
{
  "title": "Meeting",
  "date": "${currentDate}",
  "time": "16:00"
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