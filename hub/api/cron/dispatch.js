const { stevo } = require("../stevo/_stevo");
const { ghl } = require("../_ghl");
const { all: tenants } = require("../_tenants");

// GET /api/cron/dispatch — invoked by Vercel Cron every hour at minute 0.
//
// Each tenant (TENANTS[<loc>]) can include a `schedule` entry per weekday:
//
//   "schedule": {
//     "Monday":  { "hourUtc": 11, "audienceTag": "weekly-active", "command": "#bt|...|...|Sim*sim_keep/Não*sim_stop" },
//     "Wednesday": { "hourUtc": 11, "audienceTag": "weekly-active", "messageRef": "msg-abc" },
//     ...
//   }
//
// `command` is sent verbatim as a Stevo /send/text payload. Alternatively,
// `messageRef` looks up the command in `chainMessages[<id>]` (same store the
// chain feature uses). If both are absent, the day is skipped.
//
// SECURITY: Vercel Cron requests carry `Authorization: Bearer <CRON_SECRET>`.
// We validate it when CRON_SECRET is set in env.
//
// SCALING NOTE: without a persistent store (Vercel KV / Supabase), each cron
// tick must finish within the function timeout. We cap each location's run at
// BATCH_LIMIT contacts and rely on drip / multiple ticks to cover larger
// audiences. For full coverage at scale, add KV pagination cursors.
const BATCH_LIMIT = 25;
const PER_SEND_DELAY_MS = 200;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // unset = open (dev / preview)
  const hdr = req.headers["authorization"] || req.headers["Authorization"];
  return hdr === `Bearer ${secret}`;
}

async function fetchAudience(loc, token, tag, limit) {
  try {
    const data = await ghl(`/contacts/?locationId=${encodeURIComponent(loc)}&tags=${encodeURIComponent(tag)}&limit=${limit}`, { token });
    return Array.isArray(data.contacts) ? data.contacts : (Array.isArray(data.items) ? data.items : []);
  } catch { return []; }
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (!authorized(req)) { res.status(401).send(JSON.stringify({ error: "unauthorized" })); return; }

  const now = new Date();
  const today = DAYS[now.getUTCDay()];
  const hourUtc = now.getUTCHours();
  const results = [];

  const allTenants = tenants();
  for (const [loc, t] of Object.entries(allTenants)) {
    const slot = t.schedule && t.schedule[today];
    if (!slot || slot.hourUtc !== hourUtc) { results.push({ loc, skipped: "no-slot-or-hour" }); continue; }
    if (!t.stevoReady) { results.push({ loc, skipped: "stevo-not-ready" }); continue; }

    let command = slot.command;
    if (!command && slot.messageRef) command = (t.chainMessages || {})[slot.messageRef];
    if (!command) { results.push({ loc, skipped: "no-command" }); continue; }

    const audienceTag = slot.audienceTag || "weekly-active";
    const contacts = await fetchAudience(loc, t.ghlPit, audienceTag, BATCH_LIMIT);
    if (!contacts.length) { results.push({ loc, today, audienceTag, sent: 0, note: "empty-audience" }); continue; }

    let sent = 0, failed = 0;
    for (const c of contacts) {
      const number = c.phone || (c.contact && c.contact.phone);
      if (!number) { failed++; continue; }
      try {
        await stevo("/send/text", { number, text: command }, { base: t.stevoApiBase, apikey: t.stevoApiKey });
        sent++;
      } catch { failed++; }
      if (PER_SEND_DELAY_MS) await new Promise((r) => setTimeout(r, PER_SEND_DELAY_MS));
    }
    results.push({ loc, today, audienceTag, sent, failed, capped: contacts.length >= BATCH_LIMIT });
  }

  res.status(200).send(JSON.stringify({ ok: true, hourUtc, today, results }));
};
