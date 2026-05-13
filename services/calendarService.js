const { google } = require("googleapis");
const authorize = require("../utils/authorize");

async function createCalendarEvent(eventData) {
  try {
    const auth = await authorize();

    const calendar = google.calendar({
      version: "v3",
      auth,
    });

    const startDateTime = new Date(
      `${eventData.date}T${eventData.time}:00`
    );

    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: eventData.title,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "Asia/Kolkata",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  createCalendarEvent,
};