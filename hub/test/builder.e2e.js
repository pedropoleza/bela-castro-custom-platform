// End-to-end test for the Stevo command builder UI.
// Spawns a static server (caller's responsibility — see test workflow) and
// drives a headless Chromium through each command type, verifying the
// generated command exactly matches Stevo's documented syntax.
//
// Usage:  node hub/test/builder.e2e.js
// Exits non-zero on any mismatch so CI fails.

const { chromium } = require("playwright");

const URL = process.env.TEST_URL || "http://localhost:8099/index.html";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGE " + e.message));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const txt = m.text();
    // Static test server returns 404 for missing assets and 501 for POST endpoints —
    // both are expected during local E2E runs.
    if (/404|501|CERT|NAME_NOT_RESOLVED|Unsupported method/i.test(txt)) return;
    errs.push("CON " + txt);
  });
  // mock the products endpoint so the carousel hydrator works without a real backend
  await page.route("**/api/ghl/products", (route) =>
    route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ products: [
        { id: "P1", name: "Plano Essencial", description: "Mensal",  image: "https://x/1.jpg" },
        { id: "P2", name: "Plano Premium",   description: "Semanal", image: "https://x/2.jpg" }
      ]})
    })
  );

  await page.goto(URL); await page.waitForTimeout(700);
  await page.evaluate(() => { Object.keys(localStorage).filter((k) => k.startsWith("iwh_")).forEach((k) => localStorage.removeItem(k)); });
  await page.reload(); await page.waitForTimeout(800);

  let pass = 0, fail = 0;
  function ok(name, cond, ctx) { if (cond) { pass++; console.log("✅", name); } else { fail++; console.log("❌", name, "—", JSON.stringify(ctx || "")); } }
  async function setVal(sel, v) { await page.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event("input")); }, v); }
  async function clickKind(k) { await page.click('.kind-chip[data-kind="' + k + '"]'); await page.waitForTimeout(350); }

  await page.evaluate(() => { location.hash = "#/library?day=Monday"; }); await page.waitForTimeout(400);
  const link = await page.$('a.btn--soft[href^="#/library?edit="]');
  await link.click(); await page.waitForTimeout(500);

  // TEXT
  await clickKind("text");
  await setVal("#ed-body", "Olá Marina!"); await page.waitForTimeout(200);
  const txtCmd = (await page.$eval("#ed-command", (e) => e.textContent)).trim();
  ok("text command = plain body", txtCmd === "Olá Marina!", txtCmd);

  // BUTTON  →  #bt|...|...|btn*id/btn*id
  await clickKind("button");
  await setVal("#ed-header", "Cardápio do dia");
  await setVal("#ed-body", "Escolha uma opção abaixo");
  await setVal("#ed-footer", "Bom apetite!");
  await page.click("#b-add"); await page.click("#b-add"); await page.click("#b-add"); await page.waitForTimeout(200);
  const bs = await page.$$("[data-bi]");
  const fill = async (row, sel, v) => row.$eval(sel, (e, v) => { e.value = v; e.dispatchEvent(new Event("input")); }, v);
  await fill(bs[0], 'input[data-b="text"]', "Pizza");      await fill(bs[0], 'input[data-b="id"]', "id1");
  await fill(bs[1], 'input[data-b="text"]', "Suco");       await fill(bs[1], 'input[data-b="id"]', "id2");
  await fill(bs[2], 'input[data-b="text"]', "Sobremesa");  await fill(bs[2], 'input[data-b="id"]', "id3");
  await page.waitForTimeout(200);
  const btnCmd = (await page.$eval("#ed-command", (e) => e.textContent)).trim();
  ok("button command matches documented syntax",
    btnCmd === "#bt|Cardápio do dia|Escolha uma opção abaixo|Bom apetite!|Pizza*id1/Suco*id2/Sobremesa*id3",
    btnCmd);
  ok("buttons max 3 enforced", await page.$eval("#b-add", (e) => e.disabled));

  // LIST  →  #List|...|...|btnText|Opt*Desc*id/...
  await clickKind("list");
  await setVal("#ed-header", "Cardápio do dia");
  await setVal("#ed-body", "Escolha uma opção");
  await setVal("#ed-listbtn", "Ver Cardápio");
  await page.click("#l-add"); await page.click("#l-add"); await page.waitForTimeout(200);
  const ls = await page.$$("[data-li]");
  await fill(ls[0], 'input[data-l="title"]', "Pizza");
  await fill(ls[0], 'input[data-l="description"]', "Pizza de queijo");
  await fill(ls[0], 'input[data-l="id"]', "id1");
  await fill(ls[1], 'input[data-l="title"]', "Suco");
  await fill(ls[1], 'input[data-l="description"]', "Suco de laranja");
  await fill(ls[1], 'input[data-l="id"]', "id2");
  await page.waitForTimeout(200);
  const listCmd = (await page.$eval("#ed-command", (e) => e.textContent)).trim();
  ok("list command matches documented syntax",
    listCmd === "#List|Cardápio do dia|Escolha uma opção|Ver Cardápio|Pizza*Pizza de queijo*id1/Suco*Suco de laranja*id2",
    listCmd);

  // CAROUSEL  →  #carousel|img|title|desc|btn*id/btn*id||img|title|desc|btn*id/btn*id
  await clickKind("carousel");
  await page.click("#c-add"); await page.click("#c-add"); await page.waitForTimeout(200);
  const cs = await page.$$("[data-ci]");
  await fill(cs[0], 'input[data-c="image"]',       "https://exemplo.com/prod1.jpg");
  await fill(cs[0], 'input[data-c="title"]',       "iPhone 15 Pro");
  await fill(cs[0], 'textarea[data-c="description"]', "128GB Preto");
  await page.click('[data-ci="0"] [data-cba]'); await page.waitForTimeout(120);
  await page.click('[data-ci="0"] [data-cba]'); await page.waitForTimeout(120);
  let cbs0 = await page.$$('[data-ci="0"] [data-cb]');
  for (const [i, v] of [[0, "Ver"], [1, "ver1"], [2, "Comprar"], [3, "comp1"]]) {
    await cbs0[i].$eval("xpath=.", (e, v) => { e.value = v; e.dispatchEvent(new Event("input")); }, v);
  }
  await fill(cs[1], 'input[data-c="image"]',       "https://exemplo.com/prod2.jpg");
  await fill(cs[1], 'input[data-c="title"]',       "Samsung S24");
  await fill(cs[1], 'textarea[data-c="description"]', "256GB Branco");
  await page.click('[data-ci="1"] [data-cba]'); await page.waitForTimeout(120);
  await page.click('[data-ci="1"] [data-cba]'); await page.waitForTimeout(120);
  let cbs1 = await page.$$('[data-ci="1"] [data-cb]');
  for (const [i, v] of [[0, "Ver"], [1, "ver2"], [2, "Comprar"], [3, "comp2"]]) {
    await cbs1[i].$eval("xpath=.", (e, v) => { e.value = v; e.dispatchEvent(new Event("input")); }, v);
  }
  await page.waitForTimeout(300);
  const carCmd = (await page.$eval("#ed-command", (e) => e.textContent)).trim();
  ok("carousel command matches documented syntax",
    carCmd === "#carousel|https://exemplo.com/prod1.jpg|iPhone 15 Pro|128GB Preto|Ver*ver1/Comprar*comp1||https://exemplo.com/prod2.jpg|Samsung S24|256GB Branco|Ver*ver2/Comprar*comp2",
    carCmd);

  ok("no JS errors during the run", errs.length === 0, errs);

  console.log("---", pass, "passed,", fail, "failed");
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
