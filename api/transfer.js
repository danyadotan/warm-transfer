const { callDial } = require("../lib/engine");
const { sendWhatsApp } = require("../lib/whatsapp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const brief = req.body && req.body.brief;
  if (!brief) {
    res.status(400).json({ error: "Missing 'brief' in request body" });
    return;
  }
  const to = (req.body && req.body.to) || process.env.MANAGER_PHONE;
  const out = { ok: true };

  // Case file on WhatsApp first, so it's on the manager's screen
  // before (and during) the briefing call. Non-fatal if it fails.
  const caseSummary = req.body && req.body.caseSummary;
  if (caseSummary) {
    try {
      out.whatsapp = await sendWhatsApp({ to, message: caseSummary });
    } catch (err) {
      out.whatsapp = { error: String(err.message || err) };
    }
  }

  try {
    out.result = await callDial({ to, prompt: brief });
    res.status(200).json(out);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err.message || err) });
  }
};
