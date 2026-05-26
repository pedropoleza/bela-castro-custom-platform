const { configured, send, readJson } = require("../_ghl");

// POST /api/dispatch/schedule — record a scheduled dispatch.
// Real recurring timing is handled by the weekday GoHighLevel workflow itself;
// this endpoint acknowledges the schedule (persistence would be added with a DB).
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const body = await readJson(req);
  send(res, 200, { ok: true, scheduled: true, mock: !configured(), echo: { day: body.day, when: body.when, count: body.count } });
};
