const { pickLang } = require("../lib/engine");
const { sendMessage } = require("../lib/whatsapp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const body = req.body || {};
  const message = pickLang(body.message, body.messageHe);
  if (!message) {
    res.status(400).json({ error: "Missing 'message' in request body" });
    return;
  }
  const to = body.to || process.env.REP_PHONE;
  try {
    const result = await sendMessage({ to, message });
    res.status(200).json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err.message || err) });
  }
};
