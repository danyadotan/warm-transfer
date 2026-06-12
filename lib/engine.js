// Warm Transfer decision engine.
// Rule: the agent stays silent unless the customer demands a manager twice.

const MANAGER_DEMAND = /(manager|supervisor|מנהל)/i;

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

// Places the live briefing call to the manager via Dial's REST API
// (base URL per docs.getdial.ai).
// TODO: confirm payload field names against the Calls page in the docs.
async function callDial({ to, prompt }) {
  const url = process.env.DIAL_API_URL || "https://getdial.ai/api/v1/calls";
  const key = process.env.DIAL_API_KEY;
  const from = process.env.DIAL_FROM_NUMBER;

  if (!key) {
    return {
      simulated: true,
      message: "Demo mode: DIAL_API_KEY not set, no real call placed.",
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
    body: JSON.stringify({ to, from, prompt }),
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

module.exports = { decide, countManagerDemands, callDial };
