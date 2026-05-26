const { READY, stevo, reply, readJson } = require("./_stevo");

// POST /api/stevo/send — send one WhatsApp message (text or with buttons) via Stevo.
// Body: { kind:"text"|"button", number, text, buttons:[{id,text}], title, footer }
// Field names are env-overridable until the real Stevo contract is confirmed.
const NUMF = process.env.STEVO_NUMBER_FIELD || "number";
const TXTF = process.env.STEVO_TEXT_FIELD || "text";

module.exports = async (req, res) => {
  if (req.method !== "POST") return reply(res, 405, { error: "POST only" });
  const { kind, number, text, buttons, title, footer } = await readJson(req);
  // ⬇️ THE ONLY MISSING PIECE: real endpoint/payload + a connected number.
  if (!READY()) return reply(res, 200, { pending: true, note: "Stevo wired & ready — set STEVO_READY=1 with the confirmed send payload + a connected number to go live." });
  if (!number || !text) return reply(res, 400, { error: "number and text are required" });
  try {
    if (kind === "button" && Array.isArray(buttons) && buttons.length) {
      const body = { [NUMF]: number, [TXTF]: text, title: title || "", footer: footer || "", buttons };
      return reply(res, 200, { ok: true, result: await stevo("/send/button", body) });
    }
    const body = { [NUMF]: number, [TXTF]: text };
    reply(res, 200, { ok: true, result: await stevo("/send/text", body) });
  } catch (e) {
    reply(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
