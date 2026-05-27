// Shared GoHighLevel helper (server-side only — token never reaches the browser)
// Files prefixed with "_" are not exposed as routes by Vercel.
const BASE = "https://services.leadconnectorhq.com";

const headers = (token) => ({
  Authorization: `Bearer ${token || process.env.GHL_PIT || ""}`,
  Version: "2021-07-28",
  Accept: "application/json",
  "Content-Type": "application/json"
});
const LOC = () => process.env.GHL_LOCATION_ID || "";
const configured = () => Boolean(process.env.GHL_PIT && process.env.GHL_LOCATION_ID);

// ghl(path, { token, ...fetchOpts }) — token overrides the env PIT for multi-tenant calls.
async function ghl(path, opts = {}) {
  const { token, headers: extra, ...rest } = opts;
  const r = await fetch(BASE + path, { ...rest, headers: { ...headers(token), ...(extra || {}) } });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) { const e = new Error("GHL " + r.status); e.status = r.status; e.data = data; throw e; }
  return data;
}

// Find a contact in a given location by phone number. Returns the contact or null.
async function findContactByPhone(phone, { locationId, token }) {
  const data = await ghl(`/contacts/?locationId=${encodeURIComponent(locationId)}&query=${encodeURIComponent(phone)}`, { token });
  const list = data.contacts || data.items || [];
  return list[0] || null;
}

// Add one or more tags to a contact (fires native "tag added" workflows).
async function addContactTags(contactId, tags, { token }) {
  return ghl(`/contacts/${contactId}/tags`, { method: "POST", token, body: JSON.stringify({ tags }) });
}

function send(res, code, obj) {
  res.setHeader("Content-Type", "application/json");
  res.status(code).send(JSON.stringify(obj));
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let s = "";
  for await (const c of req) s += c;
  try { return JSON.parse(s || "{}"); } catch { return {}; }
}

module.exports = { BASE, ghl, LOC, configured, send, readJson, findContactByPhone, addContactTags };
