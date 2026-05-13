const { google } = require("googleapis");
const authorize = require("../utils/authorize");

async function createCalendarEvent(eventData) {
  try {
    console.log("Creating Google Calendar event...");

    const auth = await authorize();

    const calendar = google.calendar({
      version: "v3",
      auth,
    });

    const startDateTime =
      `${eventData.date}T${eventData.time}:00`;

    const start = new Date(startDateTime);

    const end = new Date(
      start.getTime() + 60 * 60 * 1000
    );

    const formatDate = (date) => {
      const pad = (n) => String(n).padStart(2, "0");

      return (
        `${date.getFullYear()}-` +
        `${pad(date.getMonth() + 1)}-` +
        `${pad(date.getDate())}T` +
        `${pad(date.getHours())}:` +
        `${pad(date.getMinutes())}:` +
        `${pad(date.getSeconds())}`
      );
    };

    const event = {
      summary: eventData.title,
      start: {
        dateTime: formatDate(start),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: formatDate(end),
        timeZone: "Asia/Kolkata",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log("EVENT CREATED SUCCESSFULLY");
    console.log(response.data.htmlLink);

    return response.data;
  } catch (error) {
    console.error("GOOGLE CALENDAR ERROR:");
    console.error(error);

    throw error;
  }
}

module.exports = {
  createCalendarEvent,
};