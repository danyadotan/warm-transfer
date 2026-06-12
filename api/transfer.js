const { callDial } = require("../lib/engine");

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
  try {
    const result = await callDial({ to, prompt: brief });
    res.status(200).json({ ok: true, result });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err.message || err) });
  }
};
