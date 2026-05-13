const axios = require("axios");

async function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    await axios.post(url, {
      chat_id: chatId,
      text,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

module.exports = {
  sendTelegramMessage,
};