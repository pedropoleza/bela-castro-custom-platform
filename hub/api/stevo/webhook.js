const { reply, readJson } = require("./_stevo");

// POST /api/stevo/webhook — point the Stevo instance's webhook here.
// Any inbound message OR a click on the "Quero continuar recebendo" button
// counts as a reply → the contact is engaged and their no-reply counter resets.
// (Persistence to the CRM/store is added once the storage layer is wired.)
module.exports = async (req, res) => {
  if (req.method !== "POST") return reply(res, 200, { ok: true, info: "Stevo webhook endpoint ready. Set this URL as the instance webhook." });
  const body = await readJson(req);
  const d = body.data || body.message || body;
  const from = d.from || d.sender || d.number || d.phone || d.remoteJid || null;
  const buttonId = (d.button && d.button.id) || d.selectedButtonId || d.buttonId || null;
  const optIn = buttonId === "keep_receiving";
  // Engagement signal — to reset no-reply / re-opt-in. TODO: persist to store/CRM.
  reply(res, 200, { ok: true, received: true, from, isReply: true, optIn });
};
