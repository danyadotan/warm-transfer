// Local dev server for the Warm Transfer demo.
// On Vercel the api/ functions and static files are served automatically;
// this file exists so `node server.js` runs the exact same app locally.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { decide, callDial } = require("./lib/engine");
const { sendWhatsApp } = require("./lib/whatsapp");

// Minimal .env loader (no dependencies).
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const PORT = process.env.PORT || 3000;

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function sendFile(res, file, type) {
  fs.readFile(path.join(__dirname, file), (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/demo.html")) {
    return sendFile(res, "demo.html", "text/html; charset=utf-8");
  }
  if (req.method === "GET" && req.url === "/scenarios.json") {
    return sendFile(res, "scenarios.json", "application/json");
  }
  if (req.method === "POST" && req.url === "/api/decide") {
    const body = await readBody(req);
    return sendJson(res, 200, decide(body.customerLines || []));
  }
  if (req.method === "POST" && req.url === "/api/notify") {
    const body = await readBody(req);
    if (!body.message) {
      return sendJson(res, 400, { error: "Missing 'message' in request body" });
    }
    try {
      const result = await sendWhatsApp({
        to: body.to || process.env.REP_PHONE,
        message: body.message,
      });
      return sendJson(res, 200, { ok: true, result });
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: String(err.message || err) });
    }
  }
  if (req.method === "POST" && req.url === "/api/transfer") {
    const body = await readBody(req);
    if (!body.brief) {
      return sendJson(res, 400, { error: "Missing 'brief' in request body" });
    }
    const to = body.to || process.env.MANAGER_PHONE;
    const out = { ok: true };
    if (body.caseSummary) {
      try {
        out.whatsapp = await sendWhatsApp({ to, message: body.caseSummary });
      } catch (err) {
        out.whatsapp = { error: String(err.message || err) };
      }
    }
    try {
      out.result = await callDial({ to, prompt: body.brief });
      return sendJson(res, 200, out);
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: String(err.message || err) });
    }
  }
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Warm Transfer demo running at http://localhost:${PORT}`);
});
