const { reply, readJson, stevo } = require("./_stevo");
const { tenant } = require("../_tenants");
const { findContactByPhone, addContactTags } = require("../_ghl");

// POST /api/stevo/webhook?loc=<ghlLocationId>
// Point each company's Stevo instance webhook here, appending ?loc=<its GHL locationId>.
//
// On an inbound message / button click we run THREE behaviors in priority order:
//
//   1. "keep_receiving"  → engagement (re-opt-in); resets no-reply path.
//   2. "chain:<msg-id>"  → look up the next Stevo command in TENANTS[loc].chainMessages
//                         and dispatch it to the same contact via /send/text. Lets you
//                         build multi-step funnels entirely inside Stevo, with the hub
//                         supplying the next command at runtime.
//   3. routing button    → buttonId → TENANTS[loc].routes[buttonId] → segment tag
//                         applied on the contact in GHL. The location's native workflow
//                         (trigger: "tag added") then sends the response-specific message.
//
// We also try to PARSE the buttonId into the analytics convention
// "action_topic[_variant]" so downstream consumers can aggregate dimensions
// without any extra wiring.
//
// The endpoint always returns 200 so Stevo never retries on our processing errors.

const ID_CONVENTION_RE = /^[a-z0-9]+_[a-z0-9]+(?:_[a-z0-9]+)?$/i;
function parseIdConvention(id) {
  if (!id || id.startsWith("chain:") || id === "keep_receiving") return null;
  if (!ID_CONVENTION_RE.test(id)) return null;
  const [action, topic, variant] = id.split("_");
  return { action, topic, variant: variant || null };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return reply(res, 200, { ok: true, info: "Stevo webhook ready. Set this URL on each company's instance with ?loc=<GHL locationId>." });
  }
  const body = await readJson(req);
  const d = body.data || body.message || body;
  const from = d.from || d.sender || d.number || d.phone || d.remoteJid || null;
  const buttonId = (d.button && d.button.id) || d.selectedButtonId || d.buttonId || null;

  let loc = body.locationId || null;
  try { loc = loc || new URL(req.url, "http://x").searchParams.get("loc"); } catch {}
  const t = loc ? tenant(loc) : null;

  const optIn = buttonId === "keep_receiving";
  const isChain = !!(buttonId && buttonId.startsWith("chain:"));
  const routedTag = (!optIn && !isChain && t && buttonId) ? (t.routes[buttonId] || null) : null;
  const analytics = parseIdConvention(buttonId);

  let tagged = false, chained = null, error = null;

  // 1) chain: dispatch the next command back to the same contact
  if (isChain && t && from) {
    const nextId = buttonId.slice("chain:".length);
    const cmd = (t.chainMessages || {})[nextId];
    if (!cmd) error = `chain target not found in TENANTS[${loc}].chainMessages: ${nextId}`;
    else if (!t.stevoReady) error = "tenant not stevoReady — cannot dispatch chain";
    else {
      try {
        await stevo("/send/text", { number: from, text: cmd }, { base: t.stevoApiBase, apikey: t.stevoApiKey });
        chained = nextId;
      } catch (e) { error = "chain dispatch failed: " + e.message; }
    }
  }

  // 2) routing button → apply tag in GHL → native workflow takes over
  if (!isChain && t && t.ghlPit && from && routedTag) {
    try {
      const contact = await findContactByPhone(from, { locationId: t.locationId, token: t.ghlPit });
      if (contact && contact.id) { await addContactTags(contact.id, [routedTag], { token: t.ghlPit }); tagged = true; }
      else error = error || "contact not found";
    } catch (e) { error = error || e.message; }
  }

  reply(res, 200, {
    ok: true, received: true, from, isReply: true,
    optIn, locationId: loc, buttonId, routedTag, tagged, chained, analytics, error
  });
};
