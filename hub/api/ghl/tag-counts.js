const { ghl, LOC, configured, send, readJson } = require("../_ghl");
const { tenant } = require("../_tenants");

// POST /api/ghl/tag-counts  Body: { tags:[...], locationId? }
// Returns per-tag contact counts so the hub can render the analytics tile
// without needing its own persistence layer — GoHighLevel itself IS the
// store (each button click applies a tag, and we count contacts per tag).
//
// In mock mode (no GHL token), returns plausible seeded numbers so the UI
// can still be shown end-to-end.
const MOCK_BASE = { "plano-a": 47, "plano-b": 23, "lead-frio": 8, "weekly-active": 312 };

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const body = await readJson(req);
  const tags = Array.isArray(body.tags) ? body.tags.slice(0, 30) : [];
  if (!tags.length) return send(res, 200, { counts: {} });

  const locationId = body.locationId || LOC();
  const t = locationId ? tenant(locationId) : null;
  const token = t ? t.ghlPit : undefined;

  if (!locationId || (!token && !configured())) {
    const counts = {};
    tags.forEach((tag) => { counts[tag] = MOCK_BASE[tag] != null ? MOCK_BASE[tag] : Math.floor(Math.random() * 25); });
    return send(res, 200, { mock: true, counts });
  }

  const counts = {};
  // Query each tag in parallel — GHL doesn't ship a batch tag-count endpoint, so
  // we use the contacts list with a tag filter and trust meta.total when present.
  await Promise.all(tags.map(async (tag) => {
    try {
      const data = await ghl(`/contacts/?locationId=${encodeURIComponent(locationId)}&tags=${encodeURIComponent(tag)}&limit=1`, { token });
      const total = (data.meta && (data.meta.total || data.meta.count)) || (Array.isArray(data.contacts) ? data.contacts.length : 0);
      counts[tag] = total;
    } catch (e) {
      counts[tag] = null; // distinguishes "unknown" from 0
    }
  }));
  send(res, 200, { counts });
};
