// Unit tests for the cron dispatcher and the tag-counts endpoint.
// Mocks fetch + TENANTS env so the tests don't hit the real network.

const path = require("path");

const calls = [];
global.fetch = async (url, opts = {}) => {
  calls.push({ url, method: opts.method || "GET", body: opts.body });
  if (String(url).includes("/contacts/?")) {
    return { ok: true, text: async () => JSON.stringify({ contacts: [{ id: "C1", phone: "5511999" }, { id: "C2", phone: "5511888" }] }) };
  }
  if (String(url).includes("/send/text")) return { ok: true, text: async () => JSON.stringify({ ok: true }) };
  return { ok: true, text: async () => JSON.stringify({}) };
};

const mkRes = () => ({ _h: {}, _c: null, _b: null, setHeader(k, v) { this._h[k] = v; }, status(c) { this._c = c; return this; }, send(b) { this._b = b; return this; } });

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

(async () => {
  let pass = 0, fail = 0;
  function ok(name, cond, ctx) { if (cond) { pass++; console.log("✅", name); } else { fail++; console.log("❌", name, "—", JSON.stringify(ctx || "")); } }
  function reloadModules() {
    Object.keys(require.cache).filter((k) => k.includes("/hub/api/")).forEach((k) => delete require.cache[k]);
  }

  // 1) Cron with no tenants
  process.env.TENANTS = JSON.stringify({}); reloadModules();
  let cron = require(path.join(__dirname, "..", "api", "cron", "dispatch.js"));
  let res = mkRes();
  await cron({ method: "GET", headers: {}, url: "/api/cron/dispatch" }, res);
  ok("cron: 200 with no tenants",  res._c === 200 && JSON.parse(res._b).results.length === 0);

  // 2) Cron with a tenant whose slot matches the current hour
  const now = new Date();
  const today = DAYS[now.getUTCDay()];
  const hourUtc = now.getUTCHours();
  process.env.TENANTS = JSON.stringify({
    LOC1: {
      name: "Acme", ghlPit: "pit-x", stevoApiBase: "https://api.x.stevo.chat", stevoApiKey: "k", stevoReady: true,
      schedule: { [today]: { hourUtc, audienceTag: "weekly-active", command: "#bt|Hi|How are you?|.|Sim*sim_keep" } }
    }
  });
  reloadModules();
  cron = require(path.join(__dirname, "..", "api", "cron", "dispatch.js"));
  calls.length = 0;
  res = mkRes();
  await cron({ method: "GET", headers: {}, url: "/api/cron/dispatch" }, res);
  const body = JSON.parse(res._b);
  ok("cron: matched tenant dispatched", body.results[0] && body.results[0].sent > 0, body);
  ok("cron: hit /send/text",            calls.some((c) => String(c.url).endsWith("/send/text")));
  ok("cron: forwards the configured command", calls.find((c) => String(c.url).endsWith("/send/text")).body.includes("#bt|Hi"));

  // 3) tag-counts mock mode
  delete process.env.GHL_PIT; delete process.env.GHL_LOCATION_ID;
  reloadModules();
  const tagCounts = require(path.join(__dirname, "..", "api", "ghl", "tag-counts.js"));
  res = mkRes();
  const chunks = [Buffer.from(JSON.stringify({ tags: ["plano-a", "plano-b", "lead-frio"], locationId: "NOPE" }))];
  const req = {
    method: "POST", url: "/api/ghl/tag-counts", headers: {},
    [Symbol.asyncIterator]() {
      let i = 0;
      return { next() { return Promise.resolve(i < chunks.length ? { value: chunks[i++], done: false } : { value: undefined, done: true }); } };
    }
  };
  await tagCounts(req, res);
  const r = JSON.parse(res._b);
  ok("tag-counts: mock mode returns counts", r.mock && r.counts && Object.keys(r.counts).length === 3, r);
  ok("tag-counts: plano-a count present",     typeof r.counts["plano-a"] === "number");

  // 4) Cron authentication
  process.env.CRON_SECRET = "topsecret"; reloadModules();
  const cronAuth = require(path.join(__dirname, "..", "api", "cron", "dispatch.js"));
  res = mkRes();
  await cronAuth({ method: "GET", headers: {}, url: "/api/cron/dispatch" }, res);
  ok("cron: requires Bearer token when CRON_SECRET set", res._c === 401);
  res = mkRes();
  await cronAuth({ method: "GET", headers: { authorization: "Bearer topsecret" }, url: "/api/cron/dispatch" }, res);
  ok("cron: accepts correct Bearer token", res._c === 200);

  console.log("---", pass, "passed,", fail, "failed");
  process.exit(fail ? 1 : 0);
})();
