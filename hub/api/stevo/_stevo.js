// Stevo (WhatsApp) helper — server-side only. apikey/base live in env vars.
// The exact send endpoint/payload is gated by STEVO_READY: until the real
// contract + a connected number are confirmed, /send returns { pending:true }.
const APIKEY = () => process.env.STEVO_APIKEY || "";
const BASE = () => (process.env.STEVO_API_BASE || "").replace(/\/$/, "");
const READY = () => process.env.STEVO_READY === "1";

async function stevo(path, body) {
  const r = await fetch(BASE() + path, {
    method: "POST",
    headers: { apikey: APIKEY(), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = { raw: t }; }
  if (!r.ok) { const e = new Error("Stevo " + r.status); e.status = r.status; e.data = d; throw e; }
  return d;
}
function reply(res, code, obj) { res.setHeader("Content-Type", "application/json"); res.status(code).send(JSON.stringify(obj)); }
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let s = ""; for await (const c of req) s += c;
  try { return JSON.parse(s || "{}"); } catch { return {}; }
}
module.exports = { APIKEY, BASE, READY, stevo, reply, readJson };
