// Unit tests for /api/stevo/webhook — exercises the three behavioral branches:
// (1) routing button → applies a tag in GoHighLevel
// (2) chain:<msg-id>  → dispatches the chained command back to the same contact
// (3) keep_receiving  → engagement signal only (no tag, no chain)
//
// fetch is mocked; the tests don't hit the real network. Exits non-zero on failure
// so CI fails the job.

process.env.TENANTS = JSON.stringify({
  LOC1: {
    name: "Acme",
    ghlPit: "pit-x",
    stevoApiBase: "https://api.acme.stevo.chat",
    stevoApiKey: "k",
    stevoReady: true,
    routes: { quero_planoA_v1: "plano-a", quero_planoB_v1: "plano-b" },
    chainMessages: { "msg-next": "#bt|Próximo|Escolha|.|Mensal*plano_mensal_a/Anual*plano_anual_a" }
  }
});

const calls = [];
global.fetch = async (url, opts = {}) => {
  calls.push({ url, method: opts.method || "GET", body: opts.body });
  if (String(url).includes("/contacts/?")) return { ok: true, text: async () => JSON.stringify({ contacts: [{ id: "C42" }] }) };
  return { ok: true, text: async () => JSON.stringify({ ok: true }) };
};

const path = require("path");
const webhook = require(path.join(__dirname, "..", "api", "stevo", "webhook.js"));

function mkRes() {
  return { _c: null, _b: null, setHeader() {}, status(c) { this._c = c; return this; }, send(b) { this._b = b; return this; } };
}
function run(reqUrl, payload) {
  return new Promise((resolve) => {
    const res = mkRes();
    const chunks = [Buffer.from(JSON.stringify(payload))];
    const req = {
      method: "POST",
      url: reqUrl,
      [Symbol.asyncIterator]() {
        let i = 0;
        return { next() { return Promise.resolve(i < chunks.length ? { value: chunks[i++], done: false } : { value: undefined, done: true }); } };
      }
    };
    const orig = res.send.bind(res);
    res.send = (b) => { orig(b); resolve({ code: res._c, body: JSON.parse(b) }); };
    webhook(req, res);
  });
}

(async () => {
  let pass = 0, fail = 0;
  function ok(name, cond, ctx) {
    if (cond) { pass++; console.log("✅", name); }
    else { fail++; console.log("❌", name, "—", JSON.stringify(ctx || "")); }
  }

  // 1) Routing button → applies tag, parses analytics dimensions
  calls.length = 0;
  let r = await run("/api/stevo/webhook?loc=LOC1", { data: { from: "5511999", button: { id: "quero_planoA_v1" } } });
  ok("routing tag applied",            r.body.routedTag === "plano-a" && r.body.tagged === true, r.body);
  ok("routing analytics parsed",        r.body.analytics && r.body.analytics.action === "quero" && r.body.analytics.topic === "planoA");
  ok("routing did NOT trigger chain",   r.body.chained === null);

  // 2) Chain button → dispatches next command
  calls.length = 0;
  r = await run("/api/stevo/webhook?loc=LOC1", { data: { from: "5511999", button: { id: "chain:msg-next" } } });
  ok("chain detected and dispatched",   r.body.chained === "msg-next", r.body);
  ok("chain calls /send/text",          calls.some((c) => String(c.url).endsWith("/send/text") && c.method === "POST"));
  const sent = calls.find((c) => String(c.url).endsWith("/send/text"));
  ok("chain forwards the chained command text", sent && sent.body && sent.body.includes("#bt|Próximo"));
  ok("chain did NOT apply a tag",       r.body.tagged === false);

  // 3) keep_receiving — opt-in only
  r = await run("/api/stevo/webhook?loc=LOC1", { data: { from: "5511999", button: { id: "keep_receiving" } } });
  ok("keep_receiving optIn signal",     r.body.optIn === true && r.body.tagged === false && r.body.chained === null);
  ok("keep_receiving no analytics",      r.body.analytics === null);

  // 4) Unknown loc → graceful
  r = await run("/api/stevo/webhook?loc=UNKNOWN", { data: { from: "5511999", button: { id: "quero_planoA_v1" } } });
  ok("unknown loc returns 200 without crashing", r.code === 200 && r.body.routedTag === null);

  // 5) Non-convention ID
  r = await run("/api/stevo/webhook?loc=LOC1", { data: { from: "5511999", button: { id: "idAleatorio" } } });
  ok("non-convention ID: no analytics, no tag", r.body.analytics === null && r.body.tagged === false);

  console.log("---", pass, "passed,", fail, "failed");
  process.exit(fail ? 1 : 0);
})();
