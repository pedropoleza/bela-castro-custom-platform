const { ghl, LOC, configured, send } = require("../_ghl");

// GET /api/ghl/contacts — real contacts from the location, normalized
module.exports = async (req, res) => {
  if (!configured()) return send(res, 200, { contacts: [], total: 0, mock: true });
  try {
    // field id -> key map (to resolve custom field values on contacts)
    let idKey = {};
    try {
      const cf = await ghl(`/locations/${LOC()}/customFields`);
      (cf.customFields || []).forEach((f) => { idKey[f.id] = (f.fieldKey || "").replace(/^contact\./, "") || f.name; });
    } catch {}

    const out = [];
    let url = `/contacts/?locationId=${LOC()}&limit=100`;
    for (let page = 0; page < 5 && url; page++) {
      const data = await ghl(url);
      (data.contacts || []).forEach((c) => {
        const custom = {};
        (c.customFields || []).forEach((x) => { const k = idKey[x.id]; if (k) custom[k] = x.value; });
        out.push({
          id: c.id,
          full_name: c.contactName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "(no name)",
          first_name: c.firstName || (c.contactName || "").split(" ")[0] || "",
          email: c.email || "", phone: c.phone || "",
          tags: c.tags || [], custom,
          status: c.dnd ? "dnd" : "active",
          source: c.source || "", pipeline: "",
          lastActivity: c.dateUpdated || c.dateAdded || null
        });
      });
      const next = data.meta && data.meta.startAfterId;
      url = next ? `/contacts/?locationId=${LOC()}&limit=100&startAfterId=${next}&startAfter=${data.meta.startAfter || ""}` : null;
    }
    send(res, 200, { contacts: out, total: out.length });
  } catch (e) {
    send(res, e.status || 500, { error: e.message, detail: e.data });
  }
};
