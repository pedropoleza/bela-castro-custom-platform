const { ghl, LOC, configured, send } = require("../_ghl");

// GET /api/ghl/custom-fields — real contact custom fields ({key,name,options})
module.exports = async (req, res) => {
  if (!configured()) return send(res, 200, { fields: [], mock: true });
  try {
    const d = await ghl(`/locations/${LOC()}/customFields`);
    const fields = (d.customFields || [])
      .filter((f) => (f.model || "contact") === "contact")
      .map((f) => ({ key: (f.fieldKey || "").replace(/^contact\./, "") || f.name, name: f.name, options: f.picklistOptions || [] }));
    send(res, 200, { fields });
  } catch (e) {
    send(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
