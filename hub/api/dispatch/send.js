const { ghl, configured, send, readJson } = require("../_ghl");

// POST /api/dispatch/send — trigger a weekday workflow for each eligible contact.
// Body: { workflowId, contactIds: [], dispatchId, day }
// Safety: requires explicit workflowId + contactIds; caps batch size.
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!configured()) return send(res, 200, { ok: true, mock: true, sent: 0, failed: 0, note: "Backend not configured (mock)." });
  const body = await readJson(req);
  const { workflowId, contactIds } = body;
  if (!workflowId) return send(res, 400, { error: "No workflowId mapped for this day. Map it in Settings." });
  if (!Array.isArray(contactIds) || !contactIds.length) return send(res, 400, { error: "No contacts to dispatch." });
  if (contactIds.length > 2000) return send(res, 400, { error: "Batch too large (>2000)." });

  let sent = 0, failed = 0; const errors = [];
  for (const id of contactIds) {
    try { await ghl(`/contacts/${id}/workflow/${workflowId}`, { method: "POST", body: "{}" }); sent++; }
    catch (e) { failed++; if (errors.length < 5) errors.push({ id, status: e.status }); }
  }
  send(res, 200, { ok: true, sent, failed, errors });
};
