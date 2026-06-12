const { sendWhatsApp } = require("../lib/whatsapp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const message = req.body && req.body.message;
  if (!message) {
    res.status(400).json({ error: "Missing 'message' in request body" });
    return;
  }
  const to = (req.body && req.body.to) || process.env.REP_PHONE;
  try {
    const result = await sendWhatsApp({ to, message });
    res.status(200).json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err.message || err) });
  }
};
