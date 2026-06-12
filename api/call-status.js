const { getCallStatus } = require("../lib/engine");

module.exports = async (req, res) => {
  const id =
    (req.query && req.query.id) ||
    new URL(req.url, "http://localhost").searchParams.get("id");
  if (!id) {
    res.status(400).json({ error: "Missing 'id' query parameter" });
    return;
  }
  try {
    const result = await getCallStatus(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
};
