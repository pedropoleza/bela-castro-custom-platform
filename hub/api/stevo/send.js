const { READY, stevo, reply, readJson } = require("./_stevo");
const { tenant } = require("../_tenants");

// POST /api/stevo/send — send one WhatsApp message via Stevo Manager v2.
// Body: { kind, number, text, title, footer, image, buttons, list, cards, locationId }
//   kind        "text" | "button" | "list" | "carousel" | "image"
//   number      destination phone (E.164 digits)
//   text        main body / description
//   title       optional header (button/list/carousel-card)
//   footer      optional footer (button/list)
//   image       optional image URL (text/button/image; carousel uses per-card images)
//   buttons     [{id,text}]  — kind:"button" (max 3)
//   list        { buttonText, sections:[{title, rows:[{id,title,description}]}] } (max 10 rows total)
//   cards       [{ image, title, description, buttons:[{id,text}] }] — kind:"carousel" (max 10)
//   locationId  optional — routes through the tenant's Stevo instance (multi-tenant)
const NUMF = process.env.STEVO_NUMBER_FIELD || "number";
const TXTF = process.env.STEVO_TEXT_FIELD || "text";

module.exports = async (req, res) => {
  if (req.method !== "POST") return reply(res, 405, { error: "POST only" });
  const { kind = "text", number, text, title, footer, image, buttons, list, cards, locationId } = await readJson(req);

  const t = locationId ? tenant(locationId) : null;
  if (locationId && !t) return reply(res, 400, { error: `unknown locationId: ${locationId}` });
  const ready = t ? t.stevoReady : READY();
  const creds = t ? { base: t.stevoApiBase, apikey: t.stevoApiKey } : {};

  // ⬇️ THE ONLY MISSING PIECE: real endpoint contract + a connected number.
  if (!ready) return reply(res, 200, { pending: true, note: t
    ? `Stevo wired for ${t.name} — set stevoReady:true (with a connected number) in TENANTS to go live.`
    : "Stevo wired & ready — set STEVO_READY=1 with the confirmed send payload + a connected number to go live." });
  if (!number) return reply(res, 400, { error: "number is required" });

  try {
    const base = { [NUMF]: number };
    let path, body;
    switch (kind) {
      case "button": {
        if (!Array.isArray(buttons) || !buttons.length) return reply(res, 400, { error: "buttons[] required for kind:button" });
        if (buttons.length > 3) return reply(res, 400, { error: "Reply Buttons: max 3" });
        path = "/send/button";
        body = { ...base, [TXTF]: text || "", title: title || "", footer: footer || "", image: image || "", buttons };
        break;
      }
      case "list": {
        const rows = (list && list.sections || []).reduce((n, s) => n + (s.rows || []).length, 0);
        if (!rows) return reply(res, 400, { error: "list.sections[].rows[] required for kind:list" });
        if (rows > 10) return reply(res, 400, { error: "List: max 10 rows" });
        path = "/send/list";
        body = { ...base, [TXTF]: text || "", title: title || "", footer: footer || "", list };
        break;
      }
      case "carousel": {
        if (!Array.isArray(cards) || !cards.length) return reply(res, 400, { error: "cards[] required for kind:carousel" });
        if (cards.length > 10) return reply(res, 400, { error: "Carousel: max 10 cards" });
        path = "/send/carousel";
        body = { ...base, [TXTF]: text || "", cards };
        break;
      }
      case "image": {
        if (!image) return reply(res, 400, { error: "image URL required for kind:image" });
        path = "/send/image";
        body = { ...base, [TXTF]: text || "", image };
        break;
      }
      case "text":
      default: {
        if (!text) return reply(res, 400, { error: "text is required for kind:text" });
        path = "/send/text";
        body = { ...base, [TXTF]: text };
        break;
      }
    }
    reply(res, 200, { ok: true, kind, path, result: await stevo(path, body, creds) });
  } catch (e) {
    reply(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
