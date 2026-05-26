const { ghl, configured, send, readJson } = require("../_ghl");

// POST /api/dispatch/test — send a single test message to one contact.
// Body: { contactId, channel, message }
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!configured()) return send(res, 200, { ok: true, mock: true, note: "Backend not configured (mock)." });
  const { contactId, channel, message } = await readJson(req);
  if (!contactId) return send(res, 400, { error: "Provide a test contactId (set the test contact in Settings)." });
  try {
    const type = ({ WhatsApp: "WhatsApp", SMS: "SMS", Email: "Email" })[channel] || "WhatsApp";
    const out = await ghl(`/conversations/messages`, { method: "POST", body: JSON.stringify({ type, contactId, message }) });
    send(res, 200, { ok: true, result: out });
  } catch (e) {
    send(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
