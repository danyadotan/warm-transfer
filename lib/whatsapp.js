// Sends a text message (SMS) via Dial's Messages API.
// Format per docs.getdial.ai: POST /api/v1/messages { to, body, fromNumberId }.
async function sendMessage({ to, message }) {
  const url = process.env.DIAL_MESSAGES_URL || "https://getdial.ai/api/v1/messages";
  const key = process.env.DIAL_API_KEY;
  const fromNumberId = process.env.DIAL_FROM_NUMBER_ID;

  if (!key || !fromNumberId || !to) {
    return {
      simulated: true,
      message:
        "Demo mode: DIAL_API_KEY / DIAL_FROM_NUMBER_ID / recipient not set, no SMS sent.",
      to,
      text: message,
    };
  }

  const payload = { to, body: message, fromNumberId };
  // The Dial number supports voice / sms / whatsapp; set
  // DIAL_MESSAGE_CHANNEL=whatsapp to deliver over WhatsApp instead of SMS.
  if (process.env.DIAL_MESSAGE_CHANNEL) {
    payload.channel = process.env.DIAL_MESSAGE_CHANNEL;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Dial Messages API ${res.status}: ${body}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}

module.exports = { sendMessage, sendWhatsApp: sendMessage };
