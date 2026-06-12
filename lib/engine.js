// Warm Transfer decision engine.
// Rule: the agent stays silent unless the customer demands a manager twice.

const MANAGER_DEMAND = /(manager|supervisor|מנהל)/i;

// English is the default; Hebrew variants are used when DIAL_LANGUAGE is he-*.
function pickLang(en, he) {
  const lang = (process.env.DIAL_LANGUAGE || "en-US").toLowerCase();
  return lang.startsWith("he") && he ? he : en;
}

function countManagerDemands(customerLines) {
  return customerLines.filter((line) => MANAGER_DEMAND.test(line)).length;
}

function decide(customerLines) {
  const demands = countManagerDemands(customerLines);
  if (demands >= 2) {
    return {
      action: "trigger",
      demands,
      reason: "Two consecutive manager demands + rep refusal loop detected.",
    };
  }
  if (demands === 1) {
    return {
      action: "notify",
      demands,
      reason:
        "First manager demand — red flag. Send the rep a calming one-liner on WhatsApp to lower cognitive load before this escalates.",
    };
  }
  return {
    action: "silent",
    demands,
    reason: "Rep is in control. Stay out of the way.",
  };
}

// Places the live briefing call to the manager via Dial's REST API.
// Format per docs.getdial.ai: POST /api/v1/calls
// { to, fromNumberId, outboundInstruction, language }.
// The call returns immediately with status "initiated".
async function callDial({ to, prompt }) {
  const url = process.env.DIAL_API_URL || "https://getdial.ai/api/v1/calls";
  const key = process.env.DIAL_API_KEY;
  const fromNumberId = process.env.DIAL_FROM_NUMBER_ID;

  if (!key || !fromNumberId) {
    return {
      simulated: true,
      message:
        "Demo mode: DIAL_API_KEY / DIAL_FROM_NUMBER_ID not set, no real call placed.",
      to,
      prompt,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      fromNumberId,
      outboundInstruction: prompt,
      language: process.env.DIAL_LANGUAGE || "en-US",
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Dial API ${res.status}: ${body}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}

// Fetches a call record (status, duration, transcript) by id.
// Per docs.getdial.ai: GET /api/v1/calls/{id}; status moves from
// "initiated" to completed / failed / cancelled when the call ends.
async function getCallStatus(id) {
  const base = (process.env.DIAL_API_URL || "https://getdial.ai/api/v1/calls").replace(/\/+$/, "");
  const key = process.env.DIAL_API_KEY;

  if (!key) {
    return { simulated: true, id, status: "completed" };
  }

  const res = await fetch(`${base}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Dial API ${res.status}: ${body}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}

module.exports = { decide, countManagerDemands, callDial, getCallStatus, pickLang };
