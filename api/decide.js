const { decide } = require("../lib/engine");

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const lines = (req.body && req.body.customerLines) || [];
  res.status(200).json(decide(lines));
};
