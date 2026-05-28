const { READY, stevo, reply, readJson } = require("./_stevo");
const { tenant } = require("../_tenants");

// POST /api/stevo/send — send a WhatsApp message via Stevo Manager v2.
//
// Stevo's interactive messages (Reply Buttons, List, Carousel) are produced by
// a CHAT-COMMAND syntax (see cmd.stevo.chat): the message body is a string like
// "#bt|Title|Description|Footer|Btn1*id1/Btn2*id2" sent as a normal text — the
// Stevo bot parses it and renders the interactive WhatsApp message.
//
// This endpoint therefore only needs two real send paths:
//   • kind:"text"   → POST /send/text   (covers Reply Buttons / List / Carousel,
//                                        because their command IS the text)
//   • kind:"image"  → POST /send/image  (a plain image with optional caption)
//
// Body: { kind, number, text, image, locationId }
//   kind        "text" (default) | "image"
//   number      destination phone (E.164 digits)
//   text        message text — a plain message OR a Stevo command (#bt|... etc.)
//   image       image URL (required when kind:"image")
//   locationId  optional — routes through the tenant's Stevo instance (multi-tenant)
const NUMF = process.env.STEVO_NUMBER_FIELD || "number";
const TXTF = process.env.STEVO_TEXT_FIELD || "text";
const IMGF = process.env.STEVO_IMAGE_FIELD || "image";

module.exports = async (req, res) => {
  if (req.method !== "POST") return reply(res, 405, { error: "POST only" });
  const { kind = "text", number, text, image, locationId } = await readJson(req);

  const t = locationId ? tenant(locationId) : null;
  if (locationId && !t) return reply(res, 400, { error: `unknown locationId: ${locationId}` });
  const ready = t ? t.stevoReady : READY();
  const creds = t ? { base: t.stevoApiBase, apikey: t.stevoApiKey } : {};

  // ⬇️ THE ONLY MISSING PIECE: real endpoint contract + a connected number.
  if (!ready) return reply(res, 200, { pending: true, kind, note: t
    ? `Stevo wired for ${t.name} — set stevoReady:true (with a connected number) in TENANTS to go live.`
    : "Stevo wired & ready — set STEVO_READY=1 with the confirmed send payload + a connected number to go live." });
  if (!number) return reply(res, 400, { error: "number is required" });

  try {
    if (kind === "image") {
      if (!image) return reply(res, 400, { error: "image URL required for kind:image" });
      const body = { [NUMF]: number, [IMGF]: image, [TXTF]: text || "" };
      return reply(res, 200, { ok: true, kind, path: "/send/image", result: await stevo("/send/image", body, creds) });
    }
    if (!text) return reply(res, 400, { error: "text is required" });
    const body = { [NUMF]: number, [TXTF]: text };
    reply(res, 200, { ok: true, kind: "text", path: "/send/text", result: await stevo("/send/text", body, creds) });
  } catch (e) {
    reply(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
