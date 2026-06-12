// Inbound event webhook for Dial. Configure this URL on the Webhooks
// page of the Dial dashboard: https://<your-app>.vercel.app/api/webhook
//
// Handles message.received events (shape per docs.getdial.ai) by echoing
// the body back on the same channel — the foundation of the ambient
// agent: it wakes up on incoming events, nobody has to activate it.
const { sendMessage } = require("../lib/whatsapp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const event = req.body || {};
  const data = event.data || {};

  if (event.type === "message.received" && data.body && data.from) {
    try {
      const result = await sendMessage({
        to: data.from,
        message: data.body,
        channel: data.channel,
      });
      res.status(200).json({ ok: true, echoed: data.body, result });
    } catch (err) {
      // 200 so Dial doesn't endlessly retry; the error is in the payload.
      res.status(200).json({ ok: false, error: String(err.message || err) });
    }
    return;
  }

  res.status(200).json({ ok: true, ignored: event.type || "unknown" });
};
