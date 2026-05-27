const { reply, readJson } = require("./_stevo");
const { tenant } = require("../_tenants");
const { findContactByPhone, addContactTags } = require("../_ghl");

// POST /api/stevo/webhook?loc=<ghlLocationId>
// Point each company's Stevo instance webhook here, appending ?loc=<its GHL locationId>.
//
// What it does on an inbound message / button click:
//   • "keep_receiving"  → engagement signal (re-opt-in); resets the no-reply path.
//   • any routing button → maps buttonId → segment tag (TENANTS[loc].routes) and
//     applies that tag to the contact in GoHighLevel. The location's NATIVE workflow
//     (trigger: "tag added") then sends the response-specific message.
//
// The endpoint always returns 200 so Stevo never retries on our processing errors.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return reply(res, 200, { ok: true, info: "Stevo webhook ready. Set this URL on each company's instance with ?loc=<GHL locationId>." });
  }
  const body = await readJson(req);
  const d = body.data || body.message || body;
  const from = d.from || d.sender || d.number || d.phone || d.remoteJid || null;
  const buttonId = (d.button && d.button.id) || d.selectedButtonId || d.buttonId || null;

  // which company/location this instance belongs to
  let loc = body.locationId || null;
  try { loc = loc || new URL(req.url, "http://x").searchParams.get("loc"); } catch {}
  const t = loc ? tenant(loc) : null;

  const optIn = buttonId === "keep_receiving";
  // a routing button (not the opt-in) maps to a segment tag
  const routedTag = (!optIn && t && buttonId) ? (t.routes[buttonId] || null) : null;

  let tagged = false, error = null;
  if (t && t.ghlPit && from && routedTag) {
    try {
      const contact = await findContactByPhone(from, { locationId: t.locationId, token: t.ghlPit });
      if (contact && contact.id) { await addContactTags(contact.id, [routedTag], { token: t.ghlPit }); tagged = true; }
      else error = "contact not found";
    } catch (e) { error = e.message; }
  }

  reply(res, 200, { ok: true, received: true, from, isReply: true, optIn, locationId: loc, buttonId, routedTag, tagged, error });
};
