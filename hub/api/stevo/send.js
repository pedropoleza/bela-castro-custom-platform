const { READY, stevo, reply, readJson } = require("./_stevo");
const { tenant } = require("../_tenants");

// POST /api/stevo/send — send one WhatsApp message (text or with buttons) via Stevo.
// Body: { kind:"text"|"button", number, text, buttons:[{id,text}], title, footer, locationId }
// When locationId is present it routes through that company's Stevo instance
// (multi-tenant); otherwise it uses the legacy single-location env vars.
// Field names are env-overridable until the real Stevo contract is confirmed.
const NUMF = process.env.STEVO_NUMBER_FIELD || "number";
const TXTF = process.env.STEVO_TEXT_FIELD || "text";

module.exports = async (req, res) => {
  if (req.method !== "POST") return reply(res, 405, { error: "POST only" });
  const { kind, number, text, buttons, title, footer, locationId } = await readJson(req);

  // resolve the company (tenant) when a locationId is supplied
  const t = locationId ? tenant(locationId) : null;
  if (locationId && !t) return reply(res, 400, { error: `unknown locationId: ${locationId}` });
  const ready = t ? t.stevoReady : READY();
  const creds = t ? { base: t.stevoApiBase, apikey: t.stevoApiKey } : {};

  // ⬇️ THE ONLY MISSING PIECE: real endpoint/payload + a connected number.
  if (!ready) return reply(res, 200, { pending: true, note: t
    ? `Stevo wired for ${t.name} — set stevoReady:true (with a connected number) in the TENANTS config to go live.`
    : "Stevo wired & ready — set STEVO_READY=1 with the confirmed send payload + a connected number to go live." });
  if (!number || !text) return reply(res, 400, { error: "number and text are required" });
  try {
    if (kind === "button" && Array.isArray(buttons) && buttons.length) {
      const body = { [NUMF]: number, [TXTF]: text, title: title || "", footer: footer || "", buttons };
      return reply(res, 200, { ok: true, result: await stevo("/send/button", body, creds) });
    }
    const body = { [NUMF]: number, [TXTF]: text };
    reply(res, 200, { ok: true, result: await stevo("/send/text", body, creds) });
  } catch (e) {
    reply(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
