// Sends a one-line WhatsApp message to the rep via Dial's WhatsApp API.
// Carried over from the original webhook bot, rewritten dependency-free.
async function sendWhatsApp({ to, message }) {
  const url = process.env.WHATSAPP_API_URL || "https://api.dial.com/whatsapp";
  const key = process.env.DIAL_API_KEY;

  if (!key || !to) {
    return {
      simulated: true,
      message: "Demo mode: DIAL_API_KEY or recipient not set, no WhatsApp sent.",
      to,
      text: message,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, message }),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status}: ${body}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}

module.exports = { sendWhatsApp };
