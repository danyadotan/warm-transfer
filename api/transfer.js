const { callDial, pickLang } = require("../lib/engine");
const { sendMessage } = require("../lib/whatsapp");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const body = req.body || {};
  const brief = pickLang(body.brief, body.briefHe);
  if (!brief) {
    res.status(400).json({ error: "Missing 'brief' in request body" });
    return;
  }
  const to = body.to || process.env.MANAGER_PHONE;
  const out = { ok: true };

  // Case file by SMS first, so it's on the manager's screen
  // before (and during) the briefing call. Non-fatal if it fails.
  const caseSummary = pickLang(body.caseSummary, body.caseSummaryHe);
  if (caseSummary) {
    try {
      out.whatsapp = await sendMessage({ to, message: caseSummary });
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
