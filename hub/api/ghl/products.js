const { ghl, LOC, configured, send, readJson } = require("../_ghl");
const { tenant } = require("../_tenants");

// POST /api/ghl/products  Body: { locationId? }
// Lists the location's products from GoHighLevel so the carousel builder can
// hydrate up to 10 cards from real data. Falls back to a small mock catalog
// when no token is configured for the location.
const MOCK = [
  { id: "p1", name: "Plano Essencial", description: "Acompanhamento mensal",  image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400" },
  { id: "p2", name: "Plano Premium",   description: "Acompanhamento semanal + treinos", image: "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=400" },
  { id: "p3", name: "Pacote VIP",      description: "Acompanhamento 1:1 + grupos VIP",  image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400" }
];

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const body = await readJson(req);
  const locationId = body.locationId || LOC();
  const t = locationId ? tenant(locationId) : null;
  const token = t ? t.ghlPit : undefined;

  if (!locationId || (!token && !configured())) {
    return send(res, 200, { mock: true, products: MOCK });
  }
  try {
    const data = await ghl(`/products/?locationId=${encodeURIComponent(locationId)}&limit=10`, { token });
    const list = (data.products || data.items || data.data || []).map((p) => ({
      id: p.id || p._id || "",
      name: p.name || p.title || "",
      description: p.description || p.shortDescription || "",
      image: p.image || p.imageUrl || (Array.isArray(p.images) && p.images[0]) || ""
    }));
    send(res, 200, { products: list });
  } catch (e) {
    send(res, e.status || 500, { error: e.message, detail: e.data, products: [] });
  }
};
