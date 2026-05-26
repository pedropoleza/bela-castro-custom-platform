const { ghl, LOC, configured, send } = require("../_ghl");

// GET /api/ghl/tags — real location tags
module.exports = async (req, res) => {
  if (!configured()) return send(res, 200, { tags: [], mock: true });
  try {
    const d = await ghl(`/locations/${LOC()}/tags`);
    send(res, 200, { tags: (d.tags || []).map((t) => t.name) });
  } catch (e) {
    send(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
