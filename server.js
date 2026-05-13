require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { extractEvent } = require("./services/groqService");
const { createCalendarEvent } = require("./services/calendarService");
const { sendTelegramMessage } = require("./services/telegramService");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Calendar Assistant Running");
});

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const userText = message.text;

    console.log("User Message:", userText);

    await sendTelegramMessage(
      chatId,
      "Processing your calendar request..."
    );

    const extractedEvent = await extractEvent(userText);

    console.log("Extracted Event:", extractedEvent);

    await createCalendarEvent(extractedEvent);

    await sendTelegramMessage(
      chatId,
      `✅ Event Created!

Title: ${extractedEvent.title}
Date: ${extractedEvent.date}
Time: ${extractedEvent.time}`
    );

    res.sendStatus(200);
  } catch (error) {
    console.error(error);

    const chatId =
      req.body?.message?.chat?.id;

    if (chatId) {
      await sendTelegramMessage(
        chatId,
        "❌ Failed to create event."
      );
    }

    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.get("/test-calendar", async (req, res) => {
  try {
    const { createCalendarEvent } = require("./services/calendarService");

    await createCalendarEvent({
      title: "Test Event",
      date: "2026-05-13",
      time: "18:00",
    });

    res.send("Test event created");
  } catch (error) {
    console.error(error);
    res.send("Error creating event");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});