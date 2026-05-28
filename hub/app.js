/* ============================================================
   ISABELA WEEKLY MESSAGE HUB
   Internal CRM dispatch hub (static SPA, mock data).
   Structured so screens can later call real backend endpoints:
     GET  /api/ghl/contacts        GET  /api/ghl/tags
     GET  /api/ghl/custom-fields   POST /api/dispatch/test
     POST /api/dispatch/send       POST /api/dispatch/schedule
     GET  /api/dispatch/logs       POST /api/settings/workflows
   No API keys live in the frontend — the backend holds credentials and
   triggers GoHighLevel workflows/webhooks per weekday.
   ============================================================ */

/* ---------------- helpers ---------------- */
// language: pt-BR by default, switchable to English (whole UI)
let LANG = (localStorage.getItem("iwh_lang") === "en") ? "en" : "pt";
const t = (pt, en) => (LANG === "en" ? en : pt);
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDT = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const statusClass = (s) => "st-" + String(s).toLowerCase().replace(/\s+/g, "-");

/* ---------------- config: weekday -> GHL workflow ---------------- */
const WORKFLOWS = {
  Monday: "WF_Isabela_Monday_Mindset",
  Tuesday: "WF_Isabela_Tuesday_Training",
  Wednesday: "WF_Isabela_Wednesday_Wellness",
  Thursday: "WF_Isabela_Thursday_Gratitude",
  Friday: "WF_Isabela_Friday_Curiosity",
  Saturday: null,
  Sunday: "WF_Isabela_Sunday_Reset"
};

/* ---------------- seed data ---------------- */
const DAY_DEFS = [
  { day: "Monday", theme: "Motivation & Mindset", objective: "Begin the week with clarity, intention, discipline and emotional strength." },
  { day: "Tuesday", theme: "Train Yourself", objective: "Encourage movement, body awareness, consistency and physical strength." },
  { day: "Wednesday", theme: "Wellness Tip", objective: "Educate on a healthier, more sustainable lifestyle through small changes." },
  { day: "Thursday", theme: "Gratitude & Emotional Awareness", objective: "Create emotional grounding and strengthen mindfulness practices." },
  { day: "Friday", theme: "Wellness Curiosity", objective: "Keep the community engaged with light, inspiring, educational content." },
  { day: "Saturday", theme: "Offline Presence Day", objective: "Rest, presence and real connection — no message sent by default.", offline: true },
  { day: "Sunday", theme: "Reset & Preparation", objective: "Prepare emotionally and mentally for the new week with structure." }
];

const DAY_PT = {
  Monday: { short: "Seg", theme: "Motivação & Mentalidade" },
  Tuesday: { short: "Ter", theme: "Treine-se" },
  Wednesday: { short: "Qua", theme: "Dica de Wellness" },
  Thursday: { short: "Qui", theme: "Gratidão & Consciência" },
  Friday: { short: "Sex", theme: "Curiosidade Wellness" },
  Saturday: { short: "Sáb", theme: "Dia Offline" },
  Sunday: { short: "Dom", theme: "Reset & Preparação" }
};
const dayShort = (day) => LANG === "pt" ? DAY_PT[day].short : day.slice(0, 3);
const dayTheme = (d) => LANG === "pt" ? DAY_PT[d.day].theme : d.theme;
// A day is offline only if it's an offline-by-default day AND the user hasn't enabled it.
const isOffline = (d) => {
  const def = typeof d === "string" ? DAY_DEFS.find((x) => x.day === d) : d;
  if (!def || !def.offline) return false;
  return !(state.dayState[def.day] && state.dayState[def.day].enabled);
};

const VARIABLES = [
  "{{contact.first_name}}", "{{contact.full_name}}", "{{contact.email}}",
  "{{contact.phone}}", "{{custom_field.goal}}", "{{custom_field.program_status}}"
];

const SAMPLE_CONTACT = {
  first_name: "Marina", full_name: "Marina Alves", email: "marina@email.com",
  phone: "+55 11 98888-1234", goal: "Lose weight & feel strong", program_status: "Week 1"
};

const seedMessages = () => ([
  // Portuguese (primary — audience tag idioma-pt) · ready & formatted for WhatsApp
  { id: uid("msg"), day: "Monday", title: "Segunda — Motivação & Mentalidade (PT)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Bom dia, {{contact.first_name}}! ☀️\n\nDisciplina vence a motivação. Escolha *uma* intenção clara para a sua semana e dê o primeiro passo hoje.\n\nQual é o seu foco essa semana? 💛" },
  { id: uid("msg"), day: "Tuesday", title: "Terça — Treine-se (PT)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "{{contact.first_name}}, treine o corpo e fortaleça a mente 💪\n\n20 minutinhos de movimento hoje já contam. Consistência vale mais que intensidade.\n\nBora se mexer? 🏃‍♀️" },
  { id: uid("msg"), day: "Wednesday", title: "Quarta — Dica de Wellness (PT)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Dica de bem-estar, {{contact.first_name}} 💧\n\nUm copo de água agora e dormir 30 min mais cedo hoje. Pequenas mudanças, grandes resultados. 🌿" },
  { id: uid("msg"), day: "Thursday", title: "Quinta — Gratidão & Consciência (PT)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Respira fundo, {{contact.first_name}} 🤍\n\nAnote 3 coisas pelas quais você é grata hoje. Presença muda o seu dia." },
  { id: uid("msg"), day: "Friday", title: "Sexta — Curiosidade Wellness (PT)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Você sabia, {{contact.first_name}}? 🧠\n\nUma caminhada de 10 minutos depois das refeições ajuda a equilibrar energia e humor. Testa hoje! ✨" },
  { id: uid("msg"), day: "Sunday", title: "Domingo — Reset & Preparação (PT)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Domingo de reset, {{contact.first_name}} 🌙\n\nReflita, planeje e prepare sua semana. O que você vai fazer diferente?" },
  // English variant (audience tag idioma-en)
  { id: uid("msg"), day: "Monday", title: "Monday — Motivation & Mindset (EN)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Good morning, {{contact.first_name}}! ☀️\n\nDiscipline beats motivation. Pick one clear intention for your week and take the first step today.\n\nWhat's your focus this week? 💛" },
  { id: uid("msg"), day: "Tuesday", title: "Tuesday — Train Yourself (EN)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "{{contact.first_name}}, train your body, strengthen your mind 💪\n\nJust 20 minutes of movement today counts. Consistency over intensity.\n\nLet's move? 🏃‍♀️" },
  { id: uid("msg"), day: "Wednesday", title: "Wednesday — Wellness Tip (EN)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Wellness tip, {{contact.first_name}} 💧\n\nA glass of water now and lights out 30 min earlier tonight. Small changes, big results. 🌿" },
  { id: uid("msg"), day: "Thursday", title: "Thursday — Gratitude (EN)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Breathe deep, {{contact.first_name}} 🤍\n\nWrite down 3 things you're grateful for today. Presence changes your day." },
  { id: uid("msg"), day: "Friday", title: "Friday — Wellness Curiosity (EN)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Did you know, {{contact.first_name}}? 🧠\n\nA 10-minute walk after meals helps balance your energy and mood. Try it today! ✨" },
  { id: uid("msg"), day: "Sunday", title: "Sunday — Reset & Preparation (EN)", channel: "WhatsApp", status: "ready", version: 1, created: "2026-05-20", edited: "2026-05-26",
    body: "Sunday reset, {{contact.first_name}} 🌙\n\nReflect, plan and prep your week. What's one thing you'll do differently?" }
]);

const seedDayState = () => ({
  Monday: { status: "scheduled", lastSent: null, eligible: 0 },
  Tuesday: { status: "scheduled", lastSent: null, eligible: 0 },
  Wednesday: { status: "scheduled", lastSent: null, eligible: 0 },
  Thursday: { status: "scheduled", lastSent: null, eligible: 0 },
  Friday: { status: "scheduled", lastSent: null, eligible: 0 },
  Saturday: { status: "paused", lastSent: null, eligible: 0 },
  Sunday: { status: "scheduled", lastSent: null, eligible: 0 }
});

const TAGS = ["weekly-messages-active", "weekly-messages-paused", "weekly-messages-optout", "isabela-client", "isabela-lead", "wellness-active", "wellness-inactive"];
const CUSTOM_FIELDS = [
  { key: "wellness_program_status", name: "Wellness program status" },
  { key: "program_phase", name: "Program phase" },
  { key: "goal", name: "Goal" }
];

const seedContacts = () => {
  const first = ["Marina", "Júlia", "Camila", "Beatriz", "Larissa", "Sofia", "Helena", "Aline", "Renata", "Patrícia", "Carla", "Fernanda", "Bianca", "Letícia"];
  const cs = [];
  for (let i = 0; i < 340; i++) {
    const f = first[i % first.length];
    const client = Math.random() > 0.35;
    const optout = Math.random() < 0.05;
    const paused = !optout && Math.random() < 0.08;
    const tags = [];
    tags.push(client ? "isabela-client" : "isabela-lead");
    if (optout) tags.push("weekly-messages-optout");
    if (paused) tags.push("weekly-messages-paused");
    if (!optout && !paused && Math.random() > 0.2) tags.push("weekly-messages-active");
    tags.push(Math.random() > 0.3 ? "wellness-active" : "wellness-inactive");
    cs.push({
      id: uid("c"), first_name: f, full_name: f + " " + ["Alves", "Souza", "Lima", "Costa", "Rocha"][i % 5],
      email: f.toLowerCase() + i + "@email.com", phone: "+55 11 9" + (7000 + i),
      tags,
      custom: {
        wellness_program_status: ["active", "active", "inactive", "trial"][i % 4],
        program_phase: ["week-1", "week-2", "week-3", "week-4"][i % 4],
        goal: ["Weight loss", "Strength", "Energy", "Balance"][i % 4]
      },
      pipeline: ["Lead", "Onboarding", "Active Client", "Renewal"][i % 4],
      status: optout ? "unsubscribed" : "active",
      source: ["Instagram", "Referral", "Ad", "Organic"][i % 4],
      lastActivity: "2026-05-" + (10 + (i % 18)),
      noReplyCount: i % 5,           // messages sent with no reply
      lastReplyAfter: i % 3 === 0    // replied since last send (resets counter)
    });
  }
  return cs;
};

const seedLogs = () => ([
  { id: "SCH-MON", day: "Monday", title: "Segunda — Motivação & Mentalidade (PT)", filters: "tag: idioma-pt", estimated: 0, sent: 0, failed: 0, skipped: 0, when: "weekly · 08:00", user: "Isabela", status: "scheduled", notes: "Recurring weekly" },
  { id: "SCH-TUE", day: "Tuesday", title: "Terça — Treine-se (PT)", filters: "tag: idioma-pt", estimated: 0, sent: 0, failed: 0, skipped: 0, when: "weekly · 08:00", user: "Isabela", status: "scheduled", notes: "Recurring weekly" },
  { id: "SCH-WED", day: "Wednesday", title: "Quarta — Dica de Wellness (PT)", filters: "tag: idioma-pt", estimated: 0, sent: 0, failed: 0, skipped: 0, when: "weekly · 08:30", user: "Isabela", status: "scheduled", notes: "Recurring weekly" },
  { id: "SCH-THU", day: "Thursday", title: "Quinta — Gratidão & Consciência (PT)", filters: "tag: idioma-pt", estimated: 0, sent: 0, failed: 0, skipped: 0, when: "weekly · 09:00", user: "Isabela", status: "scheduled", notes: "Recurring weekly" },
  { id: "SCH-FRI", day: "Friday", title: "Sexta — Curiosidade Wellness (PT)", filters: "tag: idioma-pt", estimated: 0, sent: 0, failed: 0, skipped: 0, when: "weekly · 10:00", user: "Isabela", status: "scheduled", notes: "Recurring weekly" },
  { id: "SCH-SUN", day: "Sunday", title: "Domingo — Reset & Preparação (PT)", filters: "tag: idioma-pt", estimated: 0, sent: 0, failed: 0, skipped: 0, when: "weekly · 18:00", user: "Isabela", status: "scheduled", notes: "Recurring weekly" }
]);

const seedSettings = () => ({
  workflows: { ...WORKFLOWS },
  defaultTimes: { Monday: "08:00", Tuesday: "08:00", Wednesday: "08:30", Thursday: "09:00", Friday: "10:00", Saturday: "", Sunday: "18:00" },
  excludedTags: [],
  drip: { batch: 2, everySec: 60 },
  engagement: { flagAfter: 3, flagTag: "sem-resposta" }, // auto-flag non-responders
  channel: "stevo", // "stevo" (WhatsApp w/ buttons) | "ghl" (workflow)
  fieldMap: {
    weekly_message_enabled: "weekly_message_enabled",
    last_weekly_message_sent: "last_weekly_message_sent",
    last_weekly_message_theme: "last_weekly_message_theme",
    last_dispatch_id: "last_dispatch_id",
    wellness_program_status: "wellness_program_status"
  },
  testContact: "marina@email.com"
});

/* ---------------- persistent state ---------------- */
// bump to reset stored messages/schedule when seed defaults change
const STORE_VER = "4";
try {
  if (localStorage.getItem("iwh_ver") !== STORE_VER) {
    ["messages", "dayState", "logs", "settings"].forEach((k) => localStorage.removeItem("iwh_" + k));
    localStorage.setItem("iwh_ver", STORE_VER);
  }
} catch {}
const store = {
  load(key, seed) { try { const v = localStorage.getItem("iwh_" + key); return v ? JSON.parse(v) : seed(); } catch { return seed(); } },
  save(key, val) { try { localStorage.setItem("iwh_" + key, JSON.stringify(val)); } catch {} }
};
const state = {
  messages: store.load("messages", seedMessages),
  dayState: store.load("dayState", seedDayState),
  logs: store.load("logs", seedLogs),
  settings: store.load("settings", seedSettings),
  segments: store.load("segments", () => []),
  contacts: seedContacts(),         // mock CRM base until live data loads
  tags: TAGS,                        // replaced by real location tags on load
  customFields: CUSTOM_FIELDS,       // replaced by real custom fields on load
  live: false,
  ui: { dayOpen: null },
  dispatch: { messageId: null, filters: null }
};
const persist = () => { store.save("messages", state.messages); store.save("dayState", state.dayState); store.save("logs", state.logs); store.save("settings", state.settings); store.save("segments", state.segments); };

/* ---------------- API (calls the serverless backend -> GoHighLevel) ---------------- */
const jpost = async (url, body) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
};
const api = {
  async dispatchTest(payload) { return jpost("/api/dispatch/test", payload); },
  async dispatchSend(payload) { return jpost("/api/dispatch/send", payload); },
  async dispatchSchedule(payload) { return jpost("/api/dispatch/schedule", payload); },
  async stevoSend(payload) { return jpost("/api/stevo/send", payload); },
  async saveWorkflows(map) { return { ok: true, map }; } // mapping stored client-side (settings)
};
// pull real location data; falls back to seeded mock if backend is absent
async function loadLive() {
  try {
    const [t, f, c] = await Promise.all([
      fetch("/api/ghl/tags").then((r) => r.json()).catch(() => ({})),
      fetch("/api/ghl/custom-fields").then((r) => r.json()).catch(() => ({})),
      fetch("/api/ghl/contacts").then((r) => r.json()).catch(() => ({}))
    ]);
    if (t && !t.mock && Array.isArray(t.tags) && t.tags.length) { state.tags = t.tags; state.live = true; }
    if (f && !f.mock && Array.isArray(f.fields) && f.fields.length) state.customFields = f.fields;
    if (c && !c.mock && Array.isArray(c.contacts)) { state.contacts = c.contacts; state.live = true; }
  } catch {}
}

/* ---------------- engagement / non-responder flagging ---------------- */
const engCfg = () => state.settings.engagement || { flagAfter: 3, flagTag: "sem-resposta" };
// a contact is a non-responder if explicitly tagged, or received N+ messages with no reply
const isNonResponder = (c) => {
  const e = engCfg();
  return (c.tags || []).includes(e.flagTag) || (c.noReplyCount || 0) >= e.flagAfter;
};
const nonResponders = () => state.contacts.filter(isNonResponder);
// after a send, bump the no-reply counter and auto-flag those who hit the limit
function recordSend(eligible) {
  const e = engCfg();
  eligible.forEach((c) => {
    if (c.lastReplyAfter) { c.noReplyCount = 0; return; }   // replied since last send
    c.noReplyCount = (c.noReplyCount || 0) + 1;
    if (c.noReplyCount >= e.flagAfter && !(c.tags || []).includes(e.flagTag)) (c.tags = c.tags || []).push(e.flagTag);
  });
}

/* ---------------- drip mode (always on) ---------------- */
const dripCfg = () => state.settings.drip || { batch: 2, everySec: 60 };
async function dripSend({ msg, wfId, eligible, f, logDispatch, button }) {
  const drip = dripCfg();
  const channel = state.settings.channel || "stevo";
  if (button) button.disabled = true;
  if (!eligible.length) {
    logDispatch("sent", { sent: 0, failed: 0 }, f, eligible);
    toast("No eligible contacts to send.");
    if (button) button.disabled = false; render(); return;
  }
  // batch the audience for drip pacing
  const chunks = [];
  for (let i = 0; i < eligible.length; i += drip.batch) chunks.push(eligible.slice(i, i + drip.batch));
  let sent = 0, failed = 0, pending = 0;
  const flagAfter = engCfg().flagAfter;
  toast(`Drip started: ${eligible.length} contacts · ${drip.batch}/batch every ${drip.everySec}s.`);
  const summary = document.getElementById("aud-summary");
  for (let b = 0; b < chunks.length; b++) {
    if (channel === "stevo") {
      // Each message's payload is built from its authored kind. Interactive
      // kinds (button/list/carousel) come out of buildStevoCommand as a single
      // chat-command line that Stevo's bot parses into a real interactive WA
      // message — so they all ship as kind:text. Image kind goes via /send/image.
      for (const c of chunks[b]) {
        const isLastChance = (c.noReplyCount || 0) === flagAfter - 1;
        const payload = buildStevoPayload(msg, c, isLastChance);
        payload.number = c.phone;
        if (state.settings.locationId) payload.locationId = state.settings.locationId;
        const r = await api.stevoSend(payload);
        if (r && r.pending) pending++;
        else if (r && r.error) failed++;
        else sent++;
      }
    } else {
      const res = await api.dispatchSend({ workflowId: wfId, contactIds: chunks[b].map((c) => c.id), day: msg.day });
      if (res && res.error) failed += chunks[b].length;
      else { sent += res && res.mock ? chunks[b].length : (res.sent || 0); failed += (res && res.failed) || 0; }
    }
    if (summary) summary.textContent = `Drip: ${sent + pending}/${eligible.length} processed…`;
    if (b < chunks.length - 1) await new Promise((r) => setTimeout(r, drip.everySec * 1000));
  }
  recordSend(eligible);   // bump no-reply counters; auto-flag non-responders
  persist();
  const status = pending && !sent ? "scheduled" : (failed > 0 ? "partially sent" : "sent");
  logDispatch(status, { sent, failed }, f, eligible);
  toast(pending ? `Drip queued (Stevo pending number): ${pending} ready, ${sent} sent.` : `Drip complete: ${sent} sent, ${failed} failed.`);
  if (button) button.disabled = false;
  location.hash = "#/logs";
}

/* ---------------- audience logic ---------------- */
function applyFilters(contacts, f) {
  const ex = state.settings.excludedTags;
  return contacts.filter((c) => {
    // hard safety exclusions always
    if (c.status === "unsubscribed") return false;
    if (isNonResponder(c)) return false; // never keep messaging non-responders (anti-spam)
    if (ex.some((t) => c.tags.includes(t))) return false;
    if (f.excludeOptout && c.tags.includes("weekly-messages-optout")) return false;
    if (f.excludePaused && c.tags.includes("weekly-messages-paused")) return false;
    if (f.tag && !c.tags.includes(f.tag)) return false;
    if (f.withoutTag && c.tags.includes(f.withoutTag)) return false;
    if (f.field && f.fieldValue && String(c.custom[f.field] ?? "").toLowerCase() !== f.fieldValue.toLowerCase()) return false;
    if (f.pipeline && c.pipeline !== f.pipeline) return false;
    if (f.contactStatus && c.status !== f.contactStatus) return false;
    if (f.source && c.source !== f.source) return false;
    return true;
  });
}
const filtersSummary = (f) => {
  const parts = [];
  if (f.tag) parts.push("tag: " + f.tag);
  if (f.withoutTag) parts.push("without: " + f.withoutTag);
  if (f.field && f.fieldValue) parts.push(f.field + " = " + f.fieldValue);
  if (f.pipeline) parts.push("pipeline: " + f.pipeline);
  if (f.contactStatus) parts.push("status: " + f.contactStatus);
  if (f.source) parts.push("source: " + f.source);
  return parts.length ? parts.join("; ") : "no filter (all eligible)";
};

// practical one-click audience presets built from the real location tags
function audiencePresets() {
  const has = (x) => state.tags.includes(x);
  const P = [{ label: t("Todos", "Everyone"), filters: {} }];
  [["cliente-ativa", t("Clientes ativas", "Active clients")], ["idioma-pt", t("Português", "Portuguese")], ["idioma-en", t("Inglês", "English")],
   ["vip", "VIP"], ["cliente-inativa", t("Inativas", "Inactive")], ["weekly-messages-active", t("Semanal ativo", "Weekly active")]
  ].forEach(([tag, label]) => { if (has(tag)) P.push({ label, filters: { tag } }); });
  return P;
}
const isPresetActive = (p, f) => p.filters.tag
  ? f.tag === p.filters.tag
  : (!f.tag && !f.withoutTag && !f.field && !f.pipeline && !f.source);

/* ---------------- preview substitution ---------------- */
function renderMessage(body, contact = SAMPLE_CONTACT) {
  const g = (v) => v == null ? "" : v;
  return body
    .replace(/\{\{contact\.first_name\}\}/g, g(contact.first_name))
    .replace(/\{\{contact\.full_name\}\}/g, g(contact.full_name))
    .replace(/\{\{contact\.email\}\}/g, g(contact.email))
    .replace(/\{\{contact\.phone\}\}/g, g(contact.phone))
    .replace(/\{\{custom_field\.goal\}\}/g, g(contact.goal ?? (contact.custom && contact.custom.goal)))
    .replace(/\{\{custom_field\.program_status\}\}/g, g(contact.program_status ?? (contact.custom && contact.custom.status_na_comunidade)));
}

/* ---------------- toast + modal ---------------- */
function toast(msg, bad = false) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " toast--bad" : "");
  t.textContent = msg;
  $("#toastRoot").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; t.style.transition = "all .3s"; setTimeout(() => t.remove(), 300); }, 3200);
}
function modal({ title, body, warn, confirmLabel, danger, onConfirm }) {
  confirmLabel = confirmLabel || t("Confirmar", "Confirm");
  const root = $("#modalRoot");
  root.innerHTML = `
    <div class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal">
        <h3>${esc(title)}</h3>
        ${warn ? `<div class="modal__warn">${esc(warn)}</div>` : ""}
        <p>${body}</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" data-x>${esc(t("Cancelar", "Cancel"))}</button>
          <button class="btn ${danger ? "btn--danger" : "btn--primary"}" data-ok>${esc(confirmLabel)}</button>
        </div>
      </div>
    </div>`;
  const close = () => (root.innerHTML = "");
  root.querySelector("[data-x]").onclick = close;
  root.querySelector(".modal-overlay").onclick = (e) => { if (e.target.classList.contains("modal-overlay")) close(); };
  root.querySelector("[data-ok]").onclick = () => { close(); onConfirm && onConfirm(); };
}

/* ============================================================
   SCREENS
   ============================================================ */
const icon = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const NAV = () => [
  { id: "dashboard", label: t("Painel", "Dashboard"), ic: icon('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>') },
  { id: "library", label: t("Mensagens", "Messages"), ic: icon('<path d="M4 5h16M4 12h16M4 19h10"/>') },
  { id: "dispatch", label: t("Enviar", "Send"), ic: icon('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>') },
  { id: "logs", label: t("Histórico", "Logs"), ic: icon('<path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01"/>') },
  { id: "settings", label: t("Config.", "Settings"), ic: icon('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z"/>') }
];

const screens = {};

/* ---- A) Dashboard ---- */
screens.dashboard = () => {
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  const today = DAY_DEFS[todayIdx];
  const activeContacts = state.contacts.filter((c) => c.status === "active").length;
  const scheduledCount = DAY_DEFS.filter((d) => state.dayState[d.day].status === "scheduled").length;
  const cells = DAY_DEFS.map((d) => {
    const ds = state.dayState[d.day];
    const off = isOffline(d);
    const time = state.settings.defaultTimes[d.day];
    const msg = state.messages.find((m) => m.day === d.day && m.status !== "archived");
    const label = off ? t("Folga", "Offline") : (ds.status === "paused" ? t("Pausado", "Paused") : (ds.status === "scheduled" ? t("Vai enviar", "Will send") : ds.status));
    return `<div class="sched__day ${off ? "is-offline" : ""} ${(!off && ds.status === "scheduled") ? "is-on" : ""}">
      <div class="sched__head"><span class="sched__dow">${dayShort(d.day)}</span><span class="sched__time">${off ? "—" : (time || "—")}</span></div>
      <span class="pill ${statusClass(off ? "paused" : ds.status)}">${label}</span>
      ${off
        ? `<div class="sched__msg">${t("Dia de descanso — sem envio.", "Rest day — no message sent.")}</div>`
        : `<div class="sched__theme">${esc(dayTheme(d))}</div><div class="sched__msg">${msg ? "✉ " + esc(msg.title) : t("sem mensagem", "no message picked")}</div>`}
      <div class="sched__foot">
        ${off
          ? `<button class="btn btn--soft btn--sm" data-act="enable-day" data-day="${d.day}">${t("Ativar", "Enable")}</button>`
          : `<button class="btn btn--primary btn--sm" data-open-day="${d.day}">${t("Abrir", "Open")}</button>
             <button class="btn btn--ghost btn--sm" data-act="${ds.status === "paused" ? "resume" : "pause"}" data-day="${d.day}">${ds.status === "paused" ? t("Retomar", "Resume") : t("Pausar", "Pause")}</button>
             ${d.offline ? `<button class="btn btn--ghost btn--sm" data-act="disable-day" data-day="${d.day}">${t("Desativar", "Disable")}</button>` : ""}`}
      </div>
    </div>`;
  }).join("");
  const flagged = nonResponders().length;
  const openDay = state.ui.dayOpen;
  const openDef = openDay && DAY_DEFS.find((d) => d.day === openDay);
  return `
    <div class="dash-top">
      <div><h1 class="section-title">${t("Esta semana", "This week")}</h1><p class="section-sub" style="margin:0">${t("Quais dias enviam, em que horário e qual mensagem vai.", "Which days send, at what time, and which message goes out.")}</p></div>
      <div class="dash-stats">
        <div class="ministat"><b>${activeContacts}</b><span>${t("contatos", "contacts")}</span></div>
        <div class="ministat"><b>${scheduledCount}</b><span>${t("dias ativos", "days set")}</span></div>
        <a class="ministat" href="#/logs" style="text-decoration:none"><b>${flagged}</b><span>${t("sem resposta", "no-reply")}</span></a>
      </div>
    </div>
    <div class="panel-title">${t("Agenda da semana", "Weekly schedule")}</div>
    <div class="sched">${cells}</div>
    ${openDay && openDef && !isOffline(openDef) ? `
      <div class="daypanel">
        <div class="daypanel__bar">
          <div><strong>${esc(openDay)}</strong> · ${esc(dayTheme(openDef))} — ${t("gerencie tudo aqui", "manage everything here")}</div>
          <button class="btn btn--ghost btn--sm" data-close-day>${t("Fechar", "Close")}</button>
        </div>
        ${dispatchPanels()}
      </div>` : dashInfo(today)}`;
};

// informative lower section of the home (shown when no day panel is open)
function dashInfo(today) {
  const ds = state.dayState[today.day];
  const recent = state.logs.slice(0, 5);
  const chLabel = state.settings.channel === "stevo" ? "Stevo WhatsApp" : "GHL workflow";
  const todayBlock = isOffline(today)
    ? `<p class="muted">${t("Hoje é dia de descanso (offline) — sem envio.", "Today is an offline rest day — no message.")}</p>`
    : `<div class="row between" style="margin-bottom:10px"><strong>${dayShort(today.day)} · ${esc(dayTheme(today))}</strong><span class="pill ${statusClass(ds.status)}">${ds.status === "scheduled" ? t("Vai enviar", "Will send") : ds.status}</span></div>
       <p class="muted mb" style="font-size:.85rem">${t("Horário", "Time")}: ${state.settings.defaultTimes[today.day] || "—"}</p>
       <button class="btn btn--primary btn--block" data-open-day="${today.day}">${t("Configurar o dia de hoje", "Configure today")}</button>`;
  return `
    <div class="dash-info">
      <div class="card">
        <div class="panel-title">${t("Hoje", "Today")}</div>
        ${todayBlock}
      </div>
      <div class="card">
        <div class="panel-title">${t("Atividade recente", "Recent activity")}</div>
        ${recent.length ? recent.map((l) => `<div class="row between" style="padding:7px 0;border-bottom:1px solid var(--line-2);font-size:.84rem">
          <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.title)}</span>
          <span class="pill ${statusClass(l.status)}" style="flex:none">${l.status}</span></div>`).join("") : `<p class="muted">${t("Sem atividade ainda.", "No activity yet.")}</p>`}
        <a class="btn btn--soft btn--sm mt" href="#/logs">${t("Ver histórico", "View logs")}</a>
      </div>
      <div class="card">
        <div class="panel-title">${t("Automação", "Automation")}</div>
        <div class="row between" style="padding:6px 0;font-size:.86rem"><span class="muted">${t("Canal", "Channel")}</span><strong>${chLabel}</strong></div>
        <div style="padding:6px 0;font-size:.86rem"><span class="muted">Drip</span>
          <div class="row" style="gap:8px;margin-top:6px">
            <input class="input" type="number" min="1" id="auto-drip-batch" value="${dripCfg().batch}" style="width:64px" title="${t("Mensagens por lote", "Messages per batch")}">
            <span class="muted" style="align-self:center">${t("por lote a cada", "per batch every")}</span>
            <input class="input" type="number" min="1" id="auto-drip-every" value="${dripCfg().everySec}" style="width:72px" title="${t("Segundos entre lotes", "Seconds between batches")}">
            <span class="muted" style="align-self:center">s</span>
          </div>
        </div>
        <div class="row between" style="padding:6px 0;font-size:.86rem"><span class="muted">${t("Parar após sem resposta", "Stop after no-reply")}</span><strong>${engCfg().flagAfter}</strong></div>
        <div class="row between" style="padding:6px 0;font-size:.86rem"><span class="muted">${t("Sem resposta (flag)", "Flagged no-reply")}</span><strong>${nonResponders().length}</strong></div>
        <a class="btn btn--soft btn--sm mt" href="#/settings">${t("Ajustar automação", "Adjust automation")}</a>
      </div>
    </div>`;
}

function dayCard(d) {
  const ds = state.dayState[d.day];
  const offline = d.offline;
  return `
    <div class="card daycard ${offline ? "daycard--offline" : ""}">
      <div class="daycard__top">
        <div><div class="daycard__day">${d.day}</div><div class="daycard__theme">${d.theme}</div></div>
        <span class="pill ${statusClass(ds.status)}">${ds.status}</span>
      </div>
      <p class="daycard__obj">${esc(d.objective)}</p>
      <div class="daycard__meta"><span>Last sent<br><b>${fmtDate(ds.lastSent)}</b></span><span style="text-align:right">Eligible<br><b>${offline ? "—" : ds.eligible}</b></span></div>
      <div class="daycard__actions">
        ${offline
          ? `<button class="btn btn--soft btn--sm" data-act="resume" data-day="${d.day}">Enable day</button>`
          : `<a class="btn btn--primary btn--sm" href="#/dispatch?day=${d.day}">Open day →</a>
             <button class="btn btn--ghost btn--sm" data-act="${ds.status === "paused" ? "resume" : "pause"}" data-day="${d.day}">${ds.status === "paused" ? "Resume" : "Pause"}</button>`}
      </div>
    </div>`;
}

/* ---- B) Weekly Calendar ---- */
screens.calendar = () => {
  const cols = DAY_DEFS.map((d) => {
    const ds = state.dayState[d.day];
    const msg = state.messages.find((m) => m.day === d.day && (m.status === "ready" || m.status === "scheduled"));
    const time = state.settings.defaultTimes[d.day];
    return `<div class="card cal__day ${d.offline ? "daycard--offline" : ""}">
      <div class="cal__dow">${d.day.slice(0, 3)}</div>
      <span class="pill ${statusClass(ds.status)}" style="align-self:flex-start">${ds.status}</span>
      ${d.offline ? `<div class="muted" style="font-size:.78rem">Offline day</div>`
        : `<div class="cal__chip">${esc(d.theme)}</div>
           <div class="cal__chip">⏰ ${time || "—"}</div>
           ${msg ? `<div class="cal__chip" title="${esc(msg.title)}">✉ ${esc(msg.title.split("—")[1] || msg.title)}</div>` : `<div class="muted" style="font-size:.76rem">no message picked</div>`}
           <a class="btn btn--soft btn--sm mt" href="#/dispatch?day=${d.day}" style="margin-top:auto">Schedule</a>`}
    </div>`;
  }).join("");
  return `<h1 class="section-title">Weekly Calendar</h1><p class="section-sub">Visual weekly structure with each day's status, default time and selected message. Adjust schedules in the Dispatch Center.</p><div class="cal">${cols}</div>`;
};

/* ---- C) Message Library ---- */
screens.library = (params) => {
  const day = params.get("day");
  const editId = params.get("edit");
  if (editId) return messageEditor(editId);
  const days = day ? [day] : DAY_DEFS.map((d) => d.day);
  const groups = days.map((dn) => {
    const def = DAY_DEFS.find((d) => d.day === dn);
    const msgs = state.messages.filter((m) => m.day === dn);
    const rows = msgs.length ? msgs.map((m) => `
      <div class="list-item">
        <div style="min-width:0">
          <div class="row" style="gap:8px;flex-wrap:wrap">
            <strong>${esc(m.title)}</strong>
            <span class="pill pill--muted">${esc(KIND_INFO(m.kind || "text").icon + " " + KIND_INFO(m.kind || "text").label)}</span>
            <span class="pill ${statusClass(m.status)}">${m.status}</span>
          </div>
          <div class="muted" style="font-size:.8rem">${m.channel} · v${m.version} · edited ${fmtDate(m.edited)}</div>
        </div>
        <div class="row" style="gap:6px">
          <a class="btn btn--soft btn--sm" href="#/library?edit=${m.id}">${t("Editar", "Edit")}</a>
          <button class="btn btn--ghost btn--sm" data-act="duplicate" data-id="${m.id}">${t("Duplicar", "Duplicate")}</button>
          <button class="btn btn--ghost btn--sm" data-act="usedispatch" data-id="${m.id}">${t("Usar no envio", "Use in dispatch")}</button>
          <button class="btn btn--ghost btn--sm" data-act="archive" data-id="${m.id}">${t("Arquivar", "Archive")}</button>
        </div>
      </div>`).join("") : `<p class="muted mb">${t("Nenhuma mensagem para", "No messages yet for")} ${dn}.</p>`;
    return `<div class="card mb">
      <div class="row between mb"><div><h3 style="font-family:var(--display)">${dn} — ${esc(dayTheme(def))}</h3><span class="muted" style="font-size:.82rem">${esc(def.objective)}</span></div>
      ${isOffline(dn) ? `<span class="pill pill--muted">${t("Dia offline", "Offline day")}</span>` : `<button class="btn btn--soft btn--sm" data-act="new" data-day="${dn}">+ ${t("Nova mensagem", "New message")}</button>`}</div>
      ${rows}</div>`;
  }).join("");
  return `<h1 class="section-title">${t("Mensagens", "Message Library")}</h1><p class="section-sub">${t("Crie e gerencie variações de mensagem para cada dia.", "Create and manage message variations for each weekday.")} ${day ? `${t("Filtrado por", "Filtered to")} <strong>${esc(day)}</strong> · <a href="#/library" style="color:var(--accent)">${t("ver todas", "show all")}</a>` : t("Use variáveis para personalizar cada mensagem.", "Use placeholders to personalize each message.")}</p>${groups}`;
};

/* ---------------- Stevo command builder (cmd.stevo.chat parity) ----------------
   Stevo's interactive messages are produced by a CHAT-COMMAND syntax — a single
   text line that Stevo's bot parses and renders into a WhatsApp interactive
   message. Field separator is "|", buttons/items inside a field are separated
   by "/", and the inner "text*id" / "text*desc*id" pair uses "*".

       Reply Buttons  → #bt|Title|Description|Footer|Btn1*id1/Btn2*id2/Btn3*id3
       Interactive List → #List|Title|Description|ButtonText|Opt1*Desc1*id1/Opt2*Desc2*id2
       Carousel       → #carousel|img1|title1|desc1|btn1*id1/btn2*id2||img2|title2|desc2|btn1*id1
       Plain Text     → (no command, just the text)
       Image          → (no command, sent via /send/image with optional caption)

   Constraints come straight from Stevo: 3 buttons max, 10 list items max,
   10 carousel cards max. */
const KINDS = ["text", "button", "list", "carousel", "image"];
const KIND_INFO = (k) => ({
  text: {
    label: t("Texto", "Text"),
    short: t("Mensagem comum", "Plain message"),
    icon: "✉️",
    desc: t(
      "Mensagem de texto simples. Sem botões, sem opções — apenas o corpo da mensagem com variáveis (ex: {{contact.first_name}}).",
      "Plain text message. No buttons, no choices — just the body with placeholders (e.g. {{contact.first_name}})."
    )
  },
  button: {
    label: t("Botões de Resposta", "Reply Buttons"),
    short: t("Até 3 opções rápidas", "Up to 3 quick replies"),
    icon: "🔘",
    desc: t(
      "Mostra até 3 botões de resposta rápida. O cliente toca em uma opção e o ID volta no webhook → você usa pra aplicar uma tag e disparar o workflow nativo do GoHighLevel daquela resposta.",
      "Shows up to 3 quick-reply buttons. The contact taps one option, the ID returns on the webhook → use it to apply a tag and trigger the native GoHighLevel workflow for that response."
    ),
    cmd: "#bt|Título|Descrição|Rodapé|Opção1*ID1/Opção2*ID2/Opção3*ID3"
  },
  list: {
    label: t("Lista", "List"),
    short: t("Até 10 itens em menu", "Up to 10 items in a menu"),
    icon: "📋",
    desc: t(
      "Menu deslizante com até 10 itens. Bom pra catálogo / opções longas. Cada item tem Título, Descrição (opcional) e ID — o ID retorna pelo webhook quando o cliente escolhe.",
      "A scrollable menu of up to 10 items. Good for catalogs or longer choice lists. Each item has Title, Description (optional) and ID — the ID comes back on the webhook on selection."
    ),
    cmd: "#List|Título|Descrição|Texto do botão|Opção*Descrição*ID/Opção2*Descrição2*ID2"
  },
  carousel: {
    label: t("Carrossel", "Carousel"),
    short: t("Até 10 cards com imagem", "Up to 10 image cards"),
    icon: "🖼️",
    desc: t(
      "Carrossel deslizante com até 10 cards. Cada card tem imagem, título, descrição e seus próprios botões (máx 3). Ideal pra vitrine de produtos / planos.",
      "Swipeable carousel with up to 10 cards. Each card has an image, title, description and its own buttons (max 3). Great for product or plan showcases."
    ),
    cmd: "#carousel|imagem1|titulo1|descricao1|botao1*id1/botao2*id2||imagem2|titulo2|descricao2|botao1*id1"
  },
  image: {
    label: t("Imagem", "Image"),
    short: t("Foto com legenda opcional", "Photo with optional caption"),
    icon: "📷",
    desc: t(
      "Envia uma imagem (URL pública) com legenda opcional. Use pra abrir conversa com algo visual antes do conteúdo principal.",
      "Sends an image (public URL) with an optional caption. Use it to open a conversation with something visual before the main content."
    )
  }
})[k] || { label: k, short: "", icon: "•", desc: "" };

function normalizeMsg(m) {
  if (!m.kind) m.kind = "text";
  if (!Array.isArray(m.buttons)) m.buttons = [];
  if (!m.list || typeof m.list !== "object") m.list = { buttonText: "", sections: [{ title: "", rows: [] }] };
  if (!Array.isArray(m.list.sections) || !m.list.sections.length) m.list.sections = [{ title: "", rows: [] }];
  if (!Array.isArray(m.list.sections[0].rows)) m.list.sections[0].rows = [];
  if (!Array.isArray(m.cards)) m.cards = [];
  if (m.header == null) m.header = "";
  if (m.footer == null) m.footer = "";
  if (m.image == null) m.image = "";
  return m;
}

// Serialize a message into Stevo's chat-command string (or plain text for kind:text).
function buildStevoCommand(m, contact) {
  normalizeMsg(m);
  const sub = (s) => renderMessage(s || "", contact || SAMPLE_CONTACT);
  if (m.kind === "button") {
    const buttons = m.buttons.map((b) => `${sub(b.text)}*${b.id || ""}`).join("/");
    return `#bt|${sub(m.header)}|${sub(m.body)}|${sub(m.footer)}|${buttons}`;
  }
  if (m.kind === "list") {
    const rows = m.list.sections[0].rows.map((r) => `${sub(r.title)}*${sub(r.description)}*${r.id || ""}`).join("/");
    return `#List|${sub(m.header)}|${sub(m.body)}|${sub(m.list.buttonText)}|${rows}`;
  }
  if (m.kind === "carousel") {
    return "#carousel|" + m.cards.map((c) => {
      const btns = (c.buttons || []).map((b) => `${sub(b.text)}*${b.id || ""}`).join("/");
      return `${c.image || ""}|${sub(c.title)}|${sub(c.description)}|${btns}`;
    }).join("||");
  }
  // text / image — no command, just the body
  return sub(m.body);
}

// Build the JSON body our /api/stevo/send endpoint accepts.
function buildStevoPayload(m, contact, lastChance) {
  normalizeMsg(m);
  const cmd = buildStevoCommand(m, contact);
  const nudge = lastChance ? "\n\n" + t("Você ainda quer receber essas mensagens? Responda *SIM* pra continuar 👇", "Do you still want these messages? Reply *YES* to continue 👇") : "";
  if (m.kind === "image") return { kind: "image", text: cmd + nudge, image: m.image || "" };
  return { kind: "text", text: cmd + nudge };
}

function previewHTML(m) {
  normalizeMsg(m);
  const txt = esc(renderMessage(m.body || "")).replace(/\n/g, "<br>");
  const head = m.header ? `<div class="wa-head">${esc(m.header)}</div>` : "";
  const foot = m.footer ? `<div class="wa-foot">${esc(m.footer)}</div>` : "";
  const img  = (m.image && (m.kind === "image" || m.kind === "text")) ? `<div class="wa-img"><img src="${esc(m.image)}" alt=""></div>` : "";
  let extras = "";
  if (m.kind === "button") {
    extras = `<div class="wa-buttons">${m.buttons.map((b) => `<div class="wa-btn">${esc(b.text || "")}</div>`).join("")}</div>`;
  } else if (m.kind === "list") {
    const rows = m.list.sections[0].rows;
    extras = `<div class="wa-list">
      <div class="wa-list-btn">📋 ${esc(m.list.buttonText || t("Ver opções", "See options"))}</div>
      ${rows.map((r) => `<div class="wa-list-row"><strong>${esc(r.title || "")}</strong>${r.description ? `<div class="muted" style="font-size:.78rem">${esc(r.description)}</div>` : ""}</div>`).join("")}
    </div>`;
  } else if (m.kind === "carousel") {
    extras = `<div class="wa-carousel">${m.cards.map((c) => `
      <div class="wa-card">
        ${c.image ? `<div class="wa-img"><img src="${esc(c.image)}" alt=""></div>` : ""}
        ${c.title ? `<div class="wa-head">${esc(c.title)}</div>` : ""}
        ${c.description ? `<div class="wa-body">${esc(c.description).replace(/\n/g, "<br>")}</div>` : ""}
        ${(c.buttons || []).length ? `<div class="wa-buttons">${c.buttons.map((b) => `<div class="wa-btn">${esc(b.text || "")}</div>`).join("")}</div>` : ""}
      </div>`).join("")}</div>`;
  }
  return `<div class="wa-bubble">${img}${head}<div class="wa-body">${txt || `<span class="muted">${esc(t("(sem texto)", "(no text)"))}</span>`}</div>${foot}${extras}</div>`;
}

function buttonsEditor(m) {
  const rows = m.buttons.map((b, i) => `
    <div class="builder-row" data-bi="${i}">
      <input class="input" data-b="text" placeholder="${esc(t("Texto do botão", "Button text"))}" value="${esc(b.text || "")}">
      <input class="input" data-b="id" placeholder="ID (ex: quero_plano_a)" value="${esc(b.id || "")}">
      <button class="btn btn--ghost btn--sm" data-bx="${i}" aria-label="remove">✕</button>
    </div>`).join("");
  const full = m.buttons.length >= 3;
  return `<div class="builder">
    <div class="builder__title">${t("Botões", "Buttons")} <span class="muted">${m.buttons.length}/3</span></div>
    ${rows || `<p class="muted" style="font-size:.84rem">${t("Nenhum botão ainda. Adicione até 3.", "No buttons yet. Add up to 3.")}</p>`}
    <button class="btn btn--soft btn--sm" id="b-add" ${full ? "disabled" : ""}>+ ${t("Adicionar botão", "Add button")}</button>
  </div>`;
}

function listEditor(m) {
  const rows = m.list.sections[0].rows.map((r, i) => `
    <div class="builder-row builder-row--list" data-li="${i}">
      <input class="input" data-l="title" placeholder="${esc(t("Título do item", "Item title"))}" value="${esc(r.title || "")}">
      <input class="input" data-l="id" placeholder="ID" value="${esc(r.id || "")}">
      <input class="input" data-l="description" placeholder="${esc(t("Descrição (opcional)", "Description (optional)"))}" value="${esc(r.description || "")}">
      <button class="btn btn--ghost btn--sm" data-lx="${i}" aria-label="remove">✕</button>
    </div>`).join("");
  const full = m.list.sections[0].rows.length >= 10;
  return `<div class="builder">
    <div class="field"><label>${t("Texto do botão da lista", "List button label")}</label>
      <input class="input" id="ed-listbtn" value="${esc(m.list.buttonText || "")}" placeholder="${esc(t("Ex: Ver opções", "E.g. See options"))}"></div>
    <div class="builder__title">${t("Itens da Lista", "List items")} <span class="muted">${m.list.sections[0].rows.length}/10</span></div>
    ${rows || `<p class="muted" style="font-size:.84rem">${t("Nenhum item ainda. Adicione até 10.", "No items yet. Add up to 10.")}</p>`}
    <button class="btn btn--soft btn--sm" id="l-add" ${full ? "disabled" : ""}>+ ${t("Adicionar item", "Add item")}</button>
  </div>`;
}

function carouselEditor(m) {
  const cards = m.cards.map((c, i) => `
    <div class="builder-card" data-ci="${i}">
      <div class="row between"><strong>${t("Card", "Card")} ${i + 1}</strong>
        <button class="btn btn--ghost btn--sm" data-cx="${i}">✕ ${t("remover", "remove")}</button></div>
      <div class="field"><label>${t("Imagem (URL)", "Image (URL)")}</label><input class="input" data-c="image" value="${esc(c.image || "")}" placeholder="https://..."></div>
      <div class="field"><label>${t("Título", "Title")}</label><input class="input" data-c="title" value="${esc(c.title || "")}"></div>
      <div class="field"><label>${t("Descrição", "Description")}</label><textarea class="textarea" data-c="description" rows="2">${esc(c.description || "")}</textarea></div>
      <div class="muted" style="font-size:.78rem;margin-bottom:4px">${t("Botões do card", "Card buttons")} <span class="muted">${(c.buttons || []).length}/3</span></div>
      ${(c.buttons || []).map((b, j) => `
        <div class="builder-row">
          <input class="input" data-cb="${j}" data-cbf="text" placeholder="${esc(t("Texto", "Text"))}" value="${esc(b.text || "")}">
          <input class="input" data-cb="${j}" data-cbf="id" placeholder="ID" value="${esc(b.id || "")}">
          <button class="btn btn--ghost btn--sm" data-cbx="${j}" aria-label="remove">✕</button>
        </div>`).join("")}
      <button class="btn btn--soft btn--sm" data-cba ${((c.buttons || []).length >= 3) ? "disabled" : ""}>+ ${t("Botão", "Button")}</button>
    </div>`).join("");
  const full = m.cards.length >= 10;
  return `<div class="builder">
    <div class="builder__title">${t("Cards", "Cards")} <span class="muted">${m.cards.length}/10</span></div>
    ${cards || `<p class="muted" style="font-size:.84rem">${t("Nenhum card ainda. Adicione até 10.", "No cards yet. Add up to 10.")}</p>`}
    <button class="btn btn--soft btn--sm" id="c-add" ${full ? "disabled" : ""}>+ ${t("Adicionar card", "Add card")}</button>
  </div>`;
}

function kindPicker(currentKind) {
  return `<div class="kind-picker" role="tablist">
    ${KINDS.map((k) => {
      const info = KIND_INFO(k);
      return `<button type="button" class="kind-chip ${k === currentKind ? "is-active" : ""}" data-kind="${k}" role="tab" aria-selected="${k === currentKind}">
        <span class="kind-chip__ico" aria-hidden="true">${info.icon}</span>
        <span class="kind-chip__main">
          <strong>${esc(info.label)}</strong>
          <span class="kind-chip__sub">${esc(info.short)}</span>
        </span>
      </button>`;
    }).join("")}
  </div>`;
}

function messageEditor(id) {
  const m = state.messages.find((x) => x.id === id);
  if (!m) return `<p class="muted">${t("Mensagem não encontrada.", "Message not found.")} <a href="#/library" style="color:var(--accent)">${t("Voltar", "Back")}</a></p>`;
  normalizeMsg(m);
  const def = DAY_DEFS.find((d) => d.day === m.day);
  const vars = VARIABLES.map((v) => `<button class="var-chip" data-var="${esc(v)}">${esc(v)}</button>`).join("");
  const info = KIND_INFO(m.kind);
  const showHeaderFooter = m.kind === "button" || m.kind === "list";
  const showImageField = m.kind === "image";
  const extra = m.kind === "button" ? buttonsEditor(m)
              : m.kind === "list" ? listEditor(m)
              : m.kind === "carousel" ? carouselEditor(m) : "";
  return `
    <div class="row between mb">
      <h1 class="section-title" style="margin:0">${t("Configurar Comando", "Configure Command")}</h1>
      <a class="btn btn--ghost btn--sm" href="#/library?day=${m.day}">← ${t("Biblioteca", "Library")}</a>
    </div>

    <div class="card kind-card mb">
      <div class="field" style="margin-bottom:8px"><label>${t("Tipo do Comando", "Command Type")}</label></div>
      ${kindPicker(m.kind)}
      <div class="kind-info">
        <div class="kind-info__head"><span>${info.icon}</span><strong>${esc(info.label)}</strong></div>
        <p>${esc(info.desc)}</p>
        ${info.cmd ? `<div class="kind-info__cmd"><span class="muted">${t("Formato Stevo", "Stevo format")}:</span><code>${esc(info.cmd)}</code></div>` : ""}
      </div>
    </div>

    <div class="split split--editor">
      <div class="card">
        <div class="panel-title">${t("Configurar campos", "Configure fields")}</div>
        <div class="field"><label>${t("Título interno", "Internal title")}</label><input class="input" id="ed-title" value="${esc(m.title)}"></div>
        <div class="row" style="gap:12px">
          <div class="field" style="flex:1"><label>${t("Dia", "Weekday")}</label>
            <select class="select" id="ed-day">${DAY_DEFS.map((d) => `<option ${d.day === m.day ? "selected" : ""}>${d.day}</option>`).join("")}</select></div>
          <div class="field" style="flex:1"><label>${t("Canal", "Channel")}</label>
            <select class="select" id="ed-channel">${["WhatsApp", "SMS", "Email"].map((c) => `<option ${c === m.channel ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field" style="flex:1"><label>${t("Status", "Status")}</label>
            <select class="select" id="ed-status">${["draft", "ready", "scheduled", "paused"].map((s) => `<option ${s === m.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        </div>
        ${showHeaderFooter ? `
          <div class="row" style="gap:12px">
            <div class="field" style="flex:1"><label>${t("Título", "Title")}</label><input class="input" id="ed-header" value="${esc(m.header)}"></div>
            <div class="field" style="flex:1"><label>${t("Rodapé", "Footer")}</label><input class="input" id="ed-footer" value="${esc(m.footer)}"></div>
          </div>` : ""}
        ${showImageField ? `
          <div class="field"><label>${t("URL da imagem", "Image URL")}</label>
            <input class="input" id="ed-image" placeholder="https://..." value="${esc(m.image || "")}"></div>` : ""}
        <label class="field" style="margin-bottom:4px"><span style="font-size:.78rem;font-weight:600;color:var(--muted)">${t("Inserir variável", "Insert variable")}</span></label>
        <div class="var-row">${vars}</div>
        <div class="field"><label>${m.kind === "image" ? t("Legenda (opcional)", "Caption (optional)") : t("Descrição (corpo)", "Description (body)")}</label>
          <textarea class="textarea" id="ed-body" rows="6">${esc(m.body || "")}</textarea></div>
        ${extra}
        <div class="row mt" style="gap:10px;flex-wrap:wrap">
          <button class="btn btn--primary" id="ed-save">${t("Salvar", "Save")}</button>
          <span class="muted" style="font-size:.8rem">${esc(def ? dayTheme(def) : "")} · v${m.version} · ${fmtDate(m.edited)}</span>
        </div>
      </div>

      <div class="card card--glass">
        <div class="panel-title">${t("Comando Gerado", "Generated Command")}</div>
        <div class="cmd-box">
          <pre id="ed-command" class="cmd-pre">${esc(buildStevoCommand(m))}</pre>
          <button class="btn btn--soft btn--sm cmd-copy" id="ed-copy">📋 ${t("Copiar Comando", "Copy Command")}</button>
        </div>
        <p class="muted" style="font-size:.78rem;margin-top:8px">${t("Este é o texto exato enviado ao Stevo — o bot dele converte em mensagem interativa no WhatsApp.", "This is the exact text sent to Stevo — the bot turns it into the interactive WhatsApp message.")}</p>

        <div class="panel-title mt">${t("Como aparece no WhatsApp", "How it looks on WhatsApp")}</div>
        <div class="wa-preview" id="ed-preview">${previewHTML(m)}</div>
        <p class="muted" style="font-size:.78rem;margin-top:6px">${t("Preview com contato de exemplo. Variáveis são resolvidas no envio.", "Preview uses a sample contact. Variables resolve at send time.")}</p>
      </div>
    </div>`;
}

/* ---- D) Audience Builder ---- */
function currentFilters() {
  return state.dispatch.filters || { tag: "", withoutTag: "", field: "", fieldValue: "", pipeline: "", contactStatus: "", source: "", excludeOptout: true, excludePaused: true };
}
screens.audience = () => {
  const f = currentFilters();
  const opt = (arr, v) => `<option value=""></option>` + arr.map((x) => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("");
  const optF = (arr, v) => `<option value=""></option>` + arr.map((x) => `<option value="${esc(x.key)}" ${x.key === v ? "selected" : ""}>${esc(x.name)}</option>`).join("");
  return `
    <h1 class="section-title">Audience Builder</h1><p class="section-sub">Segment the GoHighLevel contact base${state.live ? " (live)" : ""}. Safety exclusions are always applied. Save a segment to reuse it in the Dispatch Center.</p>
    <div class="split">
      <div class="card">
        <div class="filter-row">
          <div class="field" style="margin:0"><label>Has tag</label><select class="select" id="f-tag">${opt(state.tags, f.tag)}</select></div>
          <div class="field" style="margin:0"><label>Without tag</label><select class="select" id="f-withoutTag">${opt(state.tags, f.withoutTag)}</select></div>
          <span></span>
        </div>
        <div class="filter-row">
          <div class="field" style="margin:0"><label>Custom field</label><select class="select" id="f-field">${optF(state.customFields, f.field)}</select></div>
          <div class="field" style="margin:0"><label>Field value equals</label><input class="input" id="f-fieldValue" value="${esc(f.fieldValue)}" placeholder="e.g. Português / active"></div>
          <span></span>
        </div>
        <div class="filter-row">
          <div class="field" style="margin:0"><label>Pipeline stage</label><select class="select" id="f-pipeline">${opt(["Lead", "Onboarding", "Active Client", "Renewal"], f.pipeline)}</select></div>
          <div class="field" style="margin:0"><label>Source</label><select class="select" id="f-source">${opt(["Instagram", "Referral", "Ad", "Organic"], f.source)}</select></div>
          <span></span>
        </div>
        <div class="checkline"><input type="checkbox" id="f-optout" ${f.excludeOptout ? "checked" : ""}><label for="f-optout">Exclude opt-out contacts (always on for safety)</label></div>
        <div class="checkline"><input type="checkbox" id="f-paused" ${f.excludePaused ? "checked" : ""}><label for="f-paused">Exclude paused contacts</label></div>
      </div>
      <div class="card card--glass">
        <div class="panel-title">Estimated audience</div>
        <div class="audience-count" id="aud-count">—</div>
        <p class="muted" id="aud-summary" style="font-size:.84rem;min-height:34px"></p>
        <div class="row mt" style="gap:10px">
          <button class="btn btn--soft" id="aud-save">Save segment</button>
          <a class="btn btn--primary" id="aud-use" href="#/dispatch">Use in dispatch →</a>
        </div>
        ${state.segments.length ? `<div class="mt"><div class="panel-title">Saved segments</div>${state.segments.map((s) => `<div class="list-item"><div><strong>${esc(s.name)}</strong><div class="muted" style="font-size:.78rem">${esc(filtersSummary(s.filters))}</div></div><button class="btn btn--ghost btn--sm" data-seg="${s.id}">Load</button></div>`).join("")}</div>` : ""}
      </div>
    </div>`;
};

/* ---- Reusable dispatch block: Message (+ quick edit) · Audience · Send ----
   Used both on the Send tab and inline on the Dashboard day panel. */
function dispatchPanels() {
  const msg = state.messages.find((m) => m.id === state.dispatch.messageId);
  const f = currentFilters();
  const count = applyFilters(state.contacts, f).length;
  const offlineWarn = msg && isOffline(msg.day);
  const opt = (arr, v) => `<option value=""></option>` + arr.map((x) => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("");
  const optF = (arr, v) => `<option value=""></option>` + arr.map((x) => `<option value="${esc(x.key)}" ${x.key === v ? "selected" : ""}>${esc(x.name)}</option>`).join("");
  const vars = VARIABLES.map((v) => `<button class="var-chip" data-var="${esc(v)}">${esc(v)}</button>`).join("");
  return `
    <div class="split">
      <div class="card">
        <div class="panel-title">1 · ${t("Mensagem", "Message")}</div>
        <div class="field"><label>${t("Escolha a mensagem", "Choose message")}</label><select class="select" id="d-msg">
          <option value="">— ${t("selecione", "select")} —</option>
          ${state.messages.filter((m) => m.status !== "archived").map((m) => `<option value="${m.id}" ${m.id === state.dispatch.messageId ? "selected" : ""}>${esc(m.day)} · ${esc(m.title)}</option>`).join("")}
        </select></div>
        ${msg ? `<div class="preview-phone"><div class="bubble">${esc(renderMessage(msg.body))}</div><div class="preview-meta">${esc(msg.channel)} · workflow: ${state.settings.workflows[msg.day] || "— (offline)"}</div></div>
          <details class="advanced">
            <summary>${t("Editar esta mensagem", "Edit this message")}</summary>
            <div class="var-row">${vars}</div>
            <textarea class="textarea" id="d-edit" rows="6">${esc(msg.body)}</textarea>
            <button class="btn btn--soft btn--sm mt" id="d-edit-save">${t("Salvar mensagem", "Save message")}</button>
          </details>` : `<p class="muted">${t("Selecione uma mensagem para visualizar.", "Select a message to preview it.")}</p>`}
        <div class="panel-title mt">2 · ${t("Quem recebe", "Who receives it")}</div>
        <div class="presets">${audiencePresets().map((pr, i) => `<button class="preset ${isPresetActive(pr, f) ? "is-active" : ""}" data-preset="${i}">${esc(pr.label)}</button>`).join("")}</div>
        <details class="advanced">
          <summary>${t("Filtros avançados", "Advanced filters")}</summary>
          <div class="filter-row">
            <div class="field" style="margin:0"><label>${t("Com a tag", "Has tag")}</label><select class="select" id="f-tag">${opt(state.tags, f.tag)}</select></div>
            <div class="field" style="margin:0"><label>${t("Sem a tag", "Without tag")}</label><select class="select" id="f-withoutTag">${opt(state.tags, f.withoutTag)}</select></div>
            <span></span>
          </div>
          <div class="filter-row">
            <div class="field" style="margin:0"><label>${t("Campo personalizado", "Custom field")}</label><select class="select" id="f-field">${optF(state.customFields, f.field)}</select></div>
            <div class="field" style="margin:0"><label>${t("Valor do campo igual a", "Field value equals")}</label><input class="input" id="f-fieldValue" value="${esc(f.fieldValue)}" placeholder="${t("ex: Português", "e.g. Português")}"></div>
            <span></span>
          </div>
          <div class="filter-row">
            <div class="field" style="margin:0"><label>${t("Etapa do funil", "Pipeline stage")}</label><select class="select" id="f-pipeline">${opt(["Lead", "Onboarding", "Active Client", "Renewal"], f.pipeline)}</select></div>
            <div class="field" style="margin:0"><label>${t("Origem", "Source")}</label><select class="select" id="f-source">${opt(["Instagram", "Referral", "Ad", "Organic"], f.source)}</select></div>
            <span></span>
          </div>
          <div class="checkline"><input type="checkbox" id="f-optout" ${f.excludeOptout ? "checked" : ""}><label for="f-optout">${t("Excluir quem deu opt-out (sempre ativo)", "Exclude opt-out contacts (always on)")}</label></div>
          <div class="checkline"><input type="checkbox" id="f-paused" ${f.excludePaused ? "checked" : ""}><label for="f-paused">${t("Excluir contatos pausados", "Exclude paused contacts")}</label></div>
        </details>
      </div>
      <div class="card card--glass">
        <div class="panel-title">3 · ${t("Enviar", "Send")}</div>
        <div class="audience-count" id="aud-count">${count}</div>
        <p class="muted" id="aud-summary" style="font-size:.84rem">${t("elegíveis após exclusões de segurança", "eligible after safety exclusions")}</p>
        <div class="drip-note">🩸 ${t("Modo drip (sempre ativo)", "Drip mode (always on)")} · via ${state.settings.channel === "stevo" ? "Stevo WhatsApp" : "GHL workflow"}</div>
        ${state.settings.channel === "stevo" ? `<div class="drip-note" style="margin-top:6px">💬 ${t("Formato com botão (/send/button) — cada mensagem leva o botão", "Button format (/send/button) — every message carries the")} “${t("Quero continuar recebendo", "Keep me subscribed")}”.</div>` : ""}
        <div class="drip-edit row" style="gap:10px;margin-top:8px">
          <div class="field" style="flex:1"><label>${t("Mensagens por lote", "Messages per batch")}</label><input class="input" type="number" min="1" id="d-drip-batch" value="${dripCfg().batch}"></div>
          <div class="field" style="flex:1"><label>${t("Segundos entre lotes", "Seconds between batches")}</label><input class="input" type="number" min="1" id="d-drip-every" value="${dripCfg().everySec}"></div>
        </div>
        <div id="d-warn"></div>
        <div class="row mt" style="gap:10px">
          <button class="btn btn--soft" id="d-test" ${!msg ? "disabled" : ""}>${t("Testar", "Send test")}</button>
          <button class="btn btn--ghost" id="d-schedule" ${!msg ? "disabled" : ""}>${t("Agendar", "Schedule")}</button>
          <button class="btn btn--primary" id="d-send" ${!msg || offlineWarn ? "disabled" : ""}>${t("Enviar agora", "Send now")}</button>
        </div>
        <p class="muted mt" style="font-size:.78rem">${t("Teste envia para", "Test sends to")}: ${esc(state.settings.testContact)}</p>
      </div>
    </div>`;
}

/* ---- Send tab ---- */
screens.dispatch = (params) => {
  const day = params.get("day");
  if (day) {
    const m = state.messages.find((x) => x.day === day && x.status !== "archived");
    if (m) state.dispatch.messageId = m.id;
  }
  return `<h1 class="section-title">${t("Enviar", "Send")}</h1><p class="section-sub">${t("Escolha a mensagem, defina quem recebe e envie ou agende. Tudo fica registrado.", "Choose the message, pick who receives it, then send now or schedule. Every dispatch is logged.")}</p>${dispatchPanels()}`;
};

/* ---- F) Logs ---- */
screens.logs = () => {
  const rows = state.logs.map((l) => `
    <tr>
      <td><strong>${esc(l.id)}</strong></td><td>${esc(l.day)}</td>
      <td class="wrap">${esc(l.title)}</td>
      <td class="wrap muted">${esc(l.filters)}</td>
      <td>${l.estimated}</td><td>${l.sent}</td><td>${l.failed}</td><td>${l.skipped}</td>
      <td>${fmtDT(l.when)}</td><td>${esc(l.user)}</td>
      <td><span class="pill ${statusClass(l.status)}">${l.status}</span></td>
    </tr>`).join("");
  const nr = nonResponders();
  return `
    ${nr.length ? `<div class="card mb">
      <div class="panel-title">⚑ ${t("Não-respondentes (auto-flag)", "Non-responders auto-flagged")} <span class="pill pill--warn">${nr.length}</span></div>
      <p class="muted mb" style="font-size:.82rem">${t(`Receberam ${engCfg().flagAfter}+ mensagens sem responder — foram marcados com`, `Received ${engCfg().flagAfter}+ messages without replying — tagged`)} <strong>${esc(engCfg().flagTag)}</strong> ${t("e são excluídos automaticamente dos envios (anti-spam).", "and automatically excluded from sends to avoid spam.")}</p>
      <div class="row" style="gap:6px;flex-wrap:wrap">${nr.slice(0, 24).map((c) => `<span class="pill pill--muted">${esc(c.full_name || c.first_name || c.id)}</span>`).join("")}${nr.length > 24 ? `<span class="pill pill--muted">+${nr.length - 24} ${t("mais", "more")}</span>` : ""}</div>
    </div>` : ""}
    <div class="row between mb"><div><h1 class="section-title" style="margin:0">${t("Histórico de envios", "Dispatch Logs")}</h1><p class="muted" style="font-size:.9rem">${t("Toda ação fica registrada para auditoria.", "Every action is recorded for auditing.")}</p></div>
      <div class="row" style="gap:8px">
        <select class="select" id="log-status" style="width:auto"><option value="">All statuses</option>${["draft", "scheduled", "processing", "sent", "partially sent", "failed", "cancelled"].map((s) => `<option>${s}</option>`).join("")}</select>
        <button class="btn btn--soft btn--sm" id="log-export">Export CSV</button>
      </div></div>
    <div class="table-wrap"><table class="tbl"><thead><tr>
      <th>Dispatch ID</th><th>Day</th><th>Message</th><th>Filters</th><th>Est.</th><th>Sent</th><th>Failed</th><th>Skipped</th><th>Date/Time</th><th>User</th><th>Status</th>
    </tr></thead><tbody id="log-body">${rows}</tbody></table></div>`;
};

/* ---- G) Settings ---- */
screens.settings = () => {
  const s = state.settings;
  const wf = Object.entries(s.workflows).map(([day, w]) => `
    <div class="field"><label>${day}${day === "Saturday" ? " (offline — usually none)" : ""}</label>
    <input class="input" data-wf="${day}" value="${esc(w || "")}" placeholder="${day === "Saturday" ? "no workflow" : "WF_..."}"></div>`).join("");
  const times = Object.entries(s.defaultTimes).map(([day, t]) => `
    <div class="field"><label>${day}</label><input class="input" type="time" data-time="${day}" value="${esc(t)}"></div>`).join("");
  const fields = Object.entries(s.fieldMap).map(([k, v]) => `
    <div class="field"><label>${k}</label><input class="input" data-fm="${k}" value="${esc(v)}"></div>`).join("");
  return `
    <h1 class="section-title">${t("Configurações", "Settings")}</h1><p class="section-sub">${t("Workflows por dia, horários, canal de envio, drip, tags excluídas e contato de teste. As credenciais ficam no servidor — nunca no navegador.", "Map weekday workflows, default times, sending channel, drip, excluded tags and the test contact. API credentials live on the backend — never in this frontend.")}</p>
    <div class="split">
      <div class="card">
        <div class="panel-title">Workflow / webhook mapping</div>
        <p class="muted mb" style="font-size:.82rem">Each weekday triggers its GoHighLevel workflow on dispatch.</p>
        ${wf}
        <button class="btn btn--primary mt" id="set-save-wf">Save workflow map</button>
      </div>
      <div class="card">
        <div class="panel-title">Default send time</div>
        ${times}
      </div>
      <div class="card">
        <div class="panel-title">Sending channel</div>
        <p class="muted mb" style="font-size:.82rem">Stevo (WhatsApp) supports buttons & media and the "keep receiving" opt-in. GHL triggers the weekday workflow.</p>
        <div class="field" style="margin-bottom:0"><select class="select" id="set-channel">
          <option value="stevo" ${(s.channel || "stevo") === "stevo" ? "selected" : ""}>Stevo · WhatsApp (buttons)</option>
          <option value="ghl" ${s.channel === "ghl" ? "selected" : ""}>GoHighLevel · workflow</option>
        </select></div>
      </div>
      <div class="card">
        <div class="panel-title">Drip mode <span class="pill pill--accent">always on</span></div>
        <p class="muted mb" style="font-size:.82rem">Dispatches always go out gradually, never all at once — protects deliverability and avoids spam flags.</p>
        <div class="row" style="gap:12px">
          <div class="field" style="flex:1"><label>${t("Mensagens por lote", "Messages per batch")}</label><input class="input" type="number" min="1" id="set-drip-batch" value="${(s.drip || { batch: 2 }).batch}"></div>
          <div class="field" style="flex:1"><label>${t("Segundos entre lotes", "Seconds between batches")}</label><input class="input" type="number" min="1" id="set-drip-every" value="${(s.drip || { everySec: 60 }).everySec}"></div>
        </div>
        <div class="field" style="margin-bottom:0"><label>Flag non-responders after N sends (auto-excludes them)</label><input class="input" type="number" min="1" id="set-flagafter" value="${(s.engagement || { flagAfter: 3 }).flagAfter}"></div>
      </div>
      <div class="card">
        <div class="panel-title">Excluded tags (safety)</div>
        ${state.tags.map((t) => `<div class="checkline"><input type="checkbox" data-extag="${esc(t)}" ${s.excludedTags.includes(t) ? "checked" : ""}><label>${esc(t)}</label></div>`).join("")}
        <div class="field mt"><label>Test contact (email/phone)</label><input class="input" id="set-test" value="${esc(s.testContact)}"></div>
      </div>
      <div class="card">
        <div class="panel-title">Custom field mapping</div>
        <p class="muted mb" style="font-size:.82rem">Hub fields updated after each send.</p>
        ${fields}
        <button class="btn btn--soft mt" id="set-save-all">Save all settings</button>
      </div>
    </div>`;
};

/* ============================================================
   EVENT WIRING per screen
   ============================================================ */
function wire(route, params) {
  const root = $("#screen");

  // dashboard / generic day pause-resume
  root.querySelectorAll("[data-act='pause'],[data-act='resume']").forEach((b) => b.onclick = () => {
    const day = b.dataset.day;
    state.dayState[day].status = b.dataset.act === "pause" ? "paused" : "scheduled";
    persist(); toast(`${day} ${b.dataset.act === "pause" ? "paused" : "resumed"}.`); render();
  });

  // dashboard: enable an offline-by-default day (e.g. Saturday) so it becomes configurable
  root.querySelectorAll("[data-act='enable-day']").forEach((b) => b.onclick = () => {
    const day = b.dataset.day;
    state.dayState[day].enabled = true;
    state.dayState[day].status = "scheduled";
    if (!state.settings.defaultTimes[day]) state.settings.defaultTimes[day] = "10:00";
    // make sure there is a message to send on this day
    if (!state.messages.some((m) => m.day === day && m.status !== "archived")) {
      state.messages.push({ id: uid("msg"), day, title: t(`${day} — Nova mensagem`, `${day} — New message`), channel: "WhatsApp", status: "draft", version: 1, created: new Date().toISOString(), edited: new Date().toISOString(), body: t("Oi {{contact.first_name}}!", "Hi {{contact.first_name}}!") });
    }
    persist(); toast(t(`${day} ativado.`, `${day} enabled.`)); render();
  });

  // dashboard: turn an enabled offline day back off
  root.querySelectorAll("[data-act='disable-day']").forEach((b) => b.onclick = () => {
    const day = b.dataset.day;
    state.dayState[day].enabled = false;
    state.dayState[day].status = "paused";
    if (state.ui.dayOpen === day) state.ui.dayOpen = null;
    persist(); toast(t(`${day} desativado (offline).`, `${day} disabled (offline).`)); render();
  });

  // dashboard: open a day's full management panel inline
  root.querySelectorAll("[data-open-day]").forEach((b) => b.onclick = () => {
    const day = b.dataset.openDay;
    const m = state.messages.find((x) => x.day === day && x.status !== "archived");
    state.dispatch.messageId = m ? m.id : null;
    state.ui.dayOpen = day; render();
    // let the panel paint + start its open animation, then glide it under the fixed bar
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelector(".daypanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  });
  const closeDay = root.querySelector("[data-close-day]");
  closeDay && (closeDay.onclick = () => { state.ui.dayOpen = null; render(); });

  // dashboard automation card: edit drip pacing inline
  const saveAutoDrip = () => {
    const b = parseInt($("#auto-drip-batch").value, 10), e = parseInt($("#auto-drip-every").value, 10);
    state.settings.drip = { batch: b > 0 ? b : 2, everySec: e > 0 ? e : 60 };
    persist(); toast(t("Drip atualizado.", "Drip updated."));
  };
  $("#auto-drip-batch") && $("#auto-drip-batch").addEventListener("change", saveAutoDrip);
  $("#auto-drip-every") && $("#auto-drip-every").addEventListener("change", saveAutoDrip);

  if (route === "library") {
    root.querySelectorAll("[data-act='new']").forEach((b) => b.onclick = () => {
      const day = b.dataset.day;
      const m = { id: uid("msg"), day, title: `${day} — New message`, channel: "WhatsApp", status: "draft", version: 1, created: new Date().toISOString(), edited: new Date().toISOString(), body: "Hi {{contact.first_name}}!" };
      state.messages.push(m); persist(); location.hash = `#/library?edit=${m.id}`;
    });
    root.querySelectorAll("[data-act='duplicate']").forEach((b) => b.onclick = () => {
      const m = state.messages.find((x) => x.id === b.dataset.id);
      const copy = { ...m, id: uid("msg"), title: m.title + " (copy)", status: "draft", version: 1, created: new Date().toISOString(), edited: new Date().toISOString() };
      state.messages.push(copy); persist(); toast("Message duplicated."); render();
    });
    root.querySelectorAll("[data-act='archive']").forEach((b) => b.onclick = () => {
      modal({ title: "Archive message?", body: "It will be hidden from the library and dispatch options.", confirmLabel: "Archive", danger: true, onConfirm: () => {
        const m = state.messages.find((x) => x.id === b.dataset.id); m.status = "archived"; persist(); toast("Message archived."); render();
      }});
    });
    root.querySelectorAll("[data-act='usedispatch']").forEach((b) => b.onclick = () => {
      state.dispatch.messageId = b.dataset.id; toast("Loaded into Dispatch Center."); location.hash = "#/dispatch";
    });

    // editor — Stevo command builder (cmd.stevo.chat parity)
    if (params.get("edit")) {
      const id = params.get("edit");
      const m = state.messages.find((x) => x.id === id);
      if (!m) return;
      normalizeMsg(m);
      const refresh = () => {
        const p = $("#ed-preview"); if (p) p.innerHTML = previewHTML(m);
        const c = $("#ed-command"); if (c) c.textContent = buildStevoCommand(m);
      };
      const bindInput = (sel, key) => { const el = $(sel); el && el.addEventListener("input", () => { m[key] = el.value; persist(); refresh(); }); };
      bindInput("#ed-title", "title"); bindInput("#ed-body", "body");
      bindInput("#ed-header", "header"); bindInput("#ed-footer", "footer"); bindInput("#ed-image", "image");
      const selectMap = { "ed-day": "day", "ed-channel": "channel", "ed-status": "status" };
      Object.keys(selectMap).forEach((id2) => { const el = $("#" + id2); el && el.addEventListener("change", () => { m[selectMap[id2]] = el.value; persist(); refresh(); }); });
      // command type chips — switching re-renders so the per-kind editor appears
      root.querySelectorAll(".kind-chip[data-kind]").forEach((chip) => chip.onclick = () => {
        if (chip.dataset.kind === m.kind) return;
        m.kind = chip.dataset.kind; persist(); render();
      });
      // variable chips
      root.querySelectorAll(".var-chip").forEach((c) => c.onclick = () => {
        const v = c.dataset.var, body = $("#ed-body"); if (!body) return;
        const s = body.selectionStart ?? body.value.length;
        body.value = body.value.slice(0, s) + v + body.value.slice(s); body.focus();
        body.dispatchEvent(new Event("input"));
      });
      // ---- per-kind editors ----
      if (m.kind === "button") {
        root.querySelectorAll("[data-bi]").forEach((row) => {
          const i = +row.dataset.bi;
          row.querySelectorAll("input[data-b]").forEach((inp) => inp.addEventListener("input", () => { m.buttons[i][inp.dataset.b] = inp.value; persist(); refresh(); }));
          const x = row.querySelector("[data-bx]"); x && (x.onclick = () => { m.buttons.splice(i, 1); persist(); render(); });
        });
        const add = $("#b-add"); add && (add.onclick = () => { if (m.buttons.length >= 3) return; m.buttons.push({ id: "", text: "" }); persist(); render(); });
      }
      if (m.kind === "list") {
        const lb = $("#ed-listbtn"); lb && lb.addEventListener("input", () => { m.list.buttonText = lb.value; persist(); refresh(); });
        root.querySelectorAll("[data-li]").forEach((row) => {
          const i = +row.dataset.li;
          row.querySelectorAll("input[data-l]").forEach((inp) => inp.addEventListener("input", () => { m.list.sections[0].rows[i][inp.dataset.l] = inp.value; persist(); refresh(); }));
          const x = row.querySelector("[data-lx]"); x && (x.onclick = () => { m.list.sections[0].rows.splice(i, 1); persist(); render(); });
        });
        const add = $("#l-add"); add && (add.onclick = () => { const rs = m.list.sections[0].rows; if (rs.length >= 10) return; rs.push({ id: "", title: "", description: "" }); persist(); render(); });
      }
      if (m.kind === "carousel") {
        root.querySelectorAll("[data-ci]").forEach((card) => {
          const i = +card.dataset.ci;
          card.querySelectorAll("[data-c]").forEach((inp) => inp.addEventListener("input", () => { m.cards[i][inp.dataset.c] = inp.value; persist(); refresh(); }));
          const cx = card.querySelector("[data-cx]"); cx && (cx.onclick = () => { m.cards.splice(i, 1); persist(); render(); });
          card.querySelectorAll("[data-cb]").forEach((inp) => {
            const j = +inp.dataset.cb, f = inp.dataset.cbf;
            inp.addEventListener("input", () => { m.cards[i].buttons = m.cards[i].buttons || []; m.cards[i].buttons[j] = m.cards[i].buttons[j] || { id: "", text: "" }; m.cards[i].buttons[j][f] = inp.value; persist(); refresh(); });
          });
          card.querySelectorAll("[data-cbx]").forEach((btn) => {
            const j = +btn.dataset.cbx;
            btn.onclick = () => { m.cards[i].buttons.splice(j, 1); persist(); render(); };
          });
          const cba = card.querySelector("[data-cba]");
          cba && (cba.onclick = () => { m.cards[i].buttons = m.cards[i].buttons || []; if (m.cards[i].buttons.length >= 3) return; m.cards[i].buttons.push({ id: "", text: "" }); persist(); render(); });
        });
        const add = $("#c-add"); add && (add.onclick = () => { if (m.cards.length >= 10) return; m.cards.push({ image: "", title: "", description: "", buttons: [] }); persist(); render(); });
      }
      // save + copy command
      $("#ed-save").onclick = () => { m.version += 1; m.edited = new Date().toISOString(); persist(); toast(t("Mensagem salva (v", "Message saved (v") + m.version + ")."); location.hash = `#/library?day=${m.day}`; };
      $("#ed-copy").onclick = async () => {
        const txt = buildStevoCommand(m);
        try { await navigator.clipboard.writeText(txt); toast(t("Comando copiado.", "Command copied.")); }
        catch {
          // fallback: select the <pre> contents so the user can copy manually
          const el = $("#ed-command"); if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
          toast(t("Selecionei o comando — pressione Ctrl+C.", "I selected the command — press Ctrl+C."), true);
        }
      };
    }
  }

  if (route === "audience") {
    const ids = ["tag", "withoutTag", "field", "fieldValue", "pipeline", "source"];
    const read = () => ({
      tag: $("#f-tag").value, withoutTag: $("#f-withoutTag").value, field: $("#f-field").value,
      fieldValue: $("#f-fieldValue").value.trim(), pipeline: $("#f-pipeline").value, source: $("#f-source").value,
      contactStatus: "", excludeOptout: $("#f-optout").checked, excludePaused: $("#f-paused").checked
    });
    const recount = () => {
      const f = read(); state.dispatch.filters = f;
      const n = applyFilters(state.contacts, f).length;
      $("#aud-count").textContent = n;
      $("#aud-summary").textContent = filtersSummary(f) + " · " + n + " eligible after safety exclusions";
    };
    ids.forEach((i) => { const el = $("#f-" + i); el && el.addEventListener("input", recount); });
    $("#f-optout").addEventListener("change", recount); $("#f-paused").addEventListener("change", recount);
    recount();
    $("#aud-save").onclick = () => {
      const name = prompt("Segment name:", "weekly-active");
      if (!name) return;
      state.segments.push({ id: uid("seg"), name, filters: read() }); persist(); toast("Segment saved."); render();
    };
    $("#aud-use").onclick = () => { state.dispatch.filters = read(); };
    root.querySelectorAll("[data-seg]").forEach((b) => b.onclick = () => {
      const s = state.segments.find((x) => x.id === b.dataset.seg); state.dispatch.filters = { ...s.filters }; toast("Segment loaded."); render();
    });
  }

  function wireDispatch() {
    const msgSel = $("#d-msg");
    msgSel && (msgSel.onchange = () => { state.dispatch.messageId = msgSel.value || null; render(); });
    const msg = state.messages.find((m) => m.id === state.dispatch.messageId);

    // read the inline audience filters live
    const readFilters = () => ({
      tag: $("#f-tag").value, withoutTag: $("#f-withoutTag").value, field: $("#f-field").value,
      fieldValue: $("#f-fieldValue").value.trim(), pipeline: $("#f-pipeline").value, source: $("#f-source").value,
      contactStatus: "", excludeOptout: $("#f-optout").checked, excludePaused: $("#f-paused").checked
    });
    const eligibleNow = () => applyFilters(state.contacts, readFilters());
    const recount = () => {
      const f = readFilters(); state.dispatch.filters = f;
      const n = applyFilters(state.contacts, f).length;
      $("#aud-count").textContent = n;
      $("#aud-summary").textContent = filtersSummary(f) + " · " + n + " eligible after safety exclusions";
      const wfId = msg ? state.settings.workflows[msg.day] : null;
      const warn = (!msg) ? "" :
        (isOffline(msg.day)) ? t("Dia offline — nenhuma mensagem é enviada.", "Offline day — no message sent.") :
        (!wfId) ? "No workflow mapped for this day (set it in Settings)." :
        (n > 250) ? `High volume (${n}). Double-check before sending.` :
        (!f.tag && !f.field && !f.pipeline && !f.source) ? "No filter — this targets the whole eligible base." : "";
      $("#d-warn").innerHTML = warn ? `<div class="modal__warn mt">${esc(warn)}</div>` : "";
    };
    ["tag", "withoutTag", "field", "fieldValue", "pipeline", "source"].forEach((i) => { const el = $("#f-" + i); el && el.addEventListener("input", recount); });
    $("#f-optout") && $("#f-optout").addEventListener("change", recount);
    $("#f-paused") && $("#f-paused").addEventListener("change", recount);
    recount();
    // editable drip pacing (persists to settings, used by the dispatch automation)
    const saveDrip = () => {
      const b = parseInt($("#d-drip-batch").value, 10), e = parseInt($("#d-drip-every").value, 10);
      state.settings.drip = { batch: b > 0 ? b : 2, everySec: e > 0 ? e : 60 };
      persist();
    };
    $("#d-drip-batch") && $("#d-drip-batch").addEventListener("change", saveDrip);
    $("#d-drip-every") && $("#d-drip-every").addEventListener("change", saveDrip);
    // one-click audience presets
    root.querySelectorAll("[data-preset]").forEach((b) => b.onclick = () => {
      const pr = audiencePresets()[+b.dataset.preset];
      state.dispatch.filters = { ...pr.filters, excludeOptout: true, excludePaused: true };
      render();
    });
    if (!msg) return;

    // quick inline message edit (same as the Messages tab)
    const editArea = $("#d-edit");
    if (editArea) {
      const bubble = root.querySelector(".preview-phone .bubble");
      const upd = () => { if (bubble) bubble.textContent = renderMessage(editArea.value); };
      editArea.addEventListener("input", upd);
      root.querySelectorAll(".var-chip").forEach((c) => c.onclick = () => {
        const v = c.dataset.var, s = editArea.selectionStart ?? editArea.value.length;
        editArea.value = editArea.value.slice(0, s) + v + editArea.value.slice(s); editArea.focus(); upd();
      });
      $("#d-edit-save") && ($("#d-edit-save").onclick = () => {
        msg.body = editArea.value; msg.version += 1; msg.edited = new Date().toISOString();
        persist(); toast("Message saved."); render();
      });
    }

    const logDispatch = (status, res, f, eligible) => {
      state.logs.unshift({
        id: res.dispatchId || uid("DSP"), day: msg.day, title: msg.title, filters: filtersSummary(f),
        estimated: eligible.length, sent: res.sent || 0, failed: res.failed || 0, skipped: res.skipped || 0,
        when: new Date().toISOString(), user: "Isabela", status, notes: "Workflow " + (state.settings.workflows[msg.day] || "—")
      });
      if (status === "sent" || status === "partially sent") { state.dayState[msg.day].status = "sent"; state.dayState[msg.day].lastSent = new Date().toISOString(); }
      else if (status === "scheduled") { state.dayState[msg.day].status = "scheduled"; }
      persist();
    };
    const test = $("#d-test"); test && (test.onclick = async () => {
      test.disabled = true;
      let res;
      if ((state.settings.channel || "stevo") === "stevo") {
        // mirror the live format: build payload from the message's authored kind
        const payload = buildStevoPayload(msg, SAMPLE_CONTACT, false);
        payload.number = state.settings.testContact;
        if (state.settings.locationId) payload.locationId = state.settings.locationId;
        res = await api.stevoSend(payload);
      } else {
        res = await api.dispatchTest({ contactId: state.settings.testContact, channel: msg.channel, message: renderMessage(msg.body) });
      }
      test.disabled = false;
      if (res && res.error) toast("Test failed: " + res.error, true);
      else if (res && res.pending) toast(t("Stevo pronto — falta o número conectado para enviar de verdade.", "Stevo ready — connect a number to actually send."), true);
      else toast(res && res.mock ? "Test (mock) ok — connect backend to really send." : t("Teste enviado.", "Test sent."));
    });
    const sched = $("#d-schedule"); sched && (sched.onclick = () => {
      const f = readFilters(), eligible = eligibleNow();
      modal({ title: "Schedule dispatch", body: `Schedule <strong>${esc(msg.title)}</strong> for <strong>${eligible.length}</strong> contacts using ${esc(filtersSummary(f))}.`, confirmLabel: "Schedule", onConfirm: async () => {
        const res = await api.dispatchSchedule({ day: msg.day, when: state.settings.defaultTimes[msg.day], count: eligible.length });
        logDispatch("scheduled", res || {}, f, eligible); toast("Dispatch scheduled."); render();
      }});
    });
    const drip = dripCfg();
    const send = $("#d-send"); send && (send.onclick = () => {
      const f = readFilters(), eligible = eligibleNow(), wfId = state.settings.workflows[msg.day];
      modal({
        title: "Confirm dispatch (drip mode)",
        warn: !wfId ? "No workflow mapped for this day (set it in Settings)." : (!f.tag && !f.field && !f.pipeline && !f.source ? "No filter selected — entire eligible base." : ""),
        body: `You are about to send <strong>${esc(msg.title)}</strong> to <strong>${eligible.length}</strong> contacts via <strong>${esc(wfId || "—")}</strong>.<br><br>Drip mode is always on: messages go out in batches of <strong>${drip.batch}</strong> every <strong>${drip.everySec}s</strong> to protect deliverability.<br>This cannot be undone. Confirm?`,
        confirmLabel: "Start drip", onConfirm: async () => {
          await dripSend({ msg, wfId, eligible, f, logDispatch, button: send });
        }
      });
    });
  }

  if (route === "logs") {
    const sel = $("#log-status");
    sel && (sel.onchange = () => {
      const v = sel.value; const body = $("#log-body");
      body.querySelectorAll("tr").forEach((tr) => {
        const st = tr.querySelector(".pill")?.textContent.trim();
        tr.style.display = !v || st === v ? "" : "none";
      });
    });
    $("#log-export") && ($("#log-export").onclick = () => {
      const head = ["id", "day", "title", "filters", "estimated", "sent", "failed", "skipped", "when", "user", "status"];
      const csv = [head.join(",")].concat(state.logs.map((l) => head.map((k) => `"${String(l[k]).replace(/"/g, '""')}"`).join(","))).join("\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "isabela-dispatch-logs.csv"; a.click(); toast("CSV exported.");
    });
  }

  if (route === "settings") {
    const saveWf = $("#set-save-wf");
    saveWf && (saveWf.onclick = async () => {
      root.querySelectorAll("[data-wf]").forEach((i) => state.settings.workflows[i.dataset.wf] = i.value.trim() || null);
      await api.saveWorkflows(state.settings.workflows); persist(); toast("Workflow map saved.");
    });
    const saveAll = $("#set-save-all");
    saveAll && (saveAll.onclick = () => {
      root.querySelectorAll("[data-time]").forEach((i) => state.settings.defaultTimes[i.dataset.time] = i.value);
      root.querySelectorAll("[data-fm]").forEach((i) => state.settings.fieldMap[i.dataset.fm] = i.value.trim());
      state.settings.excludedTags = [...root.querySelectorAll("[data-extag]:checked")].map((i) => i.dataset.extag);
      state.settings.testContact = $("#set-test").value.trim();
      const batch = parseInt($("#set-drip-batch").value, 10), every = parseInt($("#set-drip-every").value, 10);
      state.settings.drip = { batch: batch > 0 ? batch : 2, everySec: every > 0 ? every : 60 };
      const flagAfter = parseInt($("#set-flagafter").value, 10);
      state.settings.engagement = { flagAfter: flagAfter > 0 ? flagAfter : 3, flagTag: engCfg().flagTag };
      const ch = $("#set-channel"); if (ch) state.settings.channel = ch.value;
      persist(); toast("Settings saved."); render();
    });
  }

  // the dispatch block lives on both the Send tab and the Dashboard day panel
  if ($("#d-msg")) wireDispatch();
}

/* ============================================================
   ROUTER
   ============================================================ */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "") || "dashboard";
  const [path, query] = h.split("?");
  return { route: path || "dashboard", params: new URLSearchParams(query || "") };
}
let _lastRoute = null, _lastDay = undefined;
function render() {
  const { route, params } = parseHash();
  $("#modalRoot").innerHTML = "";
  const view = screens[route] || screens.dashboard;
  const sc = $("#screen");
  const routeChanged = route !== _lastRoute;
  sc.innerHTML = view(params);
  // Animate the screen only on an actual route change — not on in-screen re-renders
  // (preset clicks, opening a day, etc.) so the app feels stable, not flickery.
  sc.classList.remove("is-enter");
  if (routeChanged) { void sc.offsetWidth; sc.classList.add("is-enter"); }
  // Animate a day panel only when a day is newly opened.
  const dayOpen = state.ui.dayOpen;
  if (dayOpen && dayOpen !== _lastDay) {
    const dp = sc.querySelector(".daypanel");
    if (dp) { dp.classList.remove("is-enter"); void dp.offsetWidth; dp.classList.add("is-enter"); }
  }
  _lastRoute = route; _lastDay = dayOpen;
  $("#nav").innerHTML = NAV().map((n) => `<a href="#/${n.id}" data-route="${n.id}" class="${n.id === route ? "is-active" : ""}">${n.ic}<span>${n.label}</span></a>`).join("");
  $("#langToggle") && $("#langToggle").querySelectorAll("[data-l]").forEach((s) => s.classList.toggle("on", s.dataset.l === LANG));
  if (routeChanged) window.scrollTo(0, 0);
  wire(route, params);
}

/* ---------------- init ---------------- */
function init() {
  // build nav
  const lt = $("#langToggle");
  lt && (lt.onclick = () => { LANG = LANG === "en" ? "pt" : "en"; localStorage.setItem("iwh_lang", LANG); render(); });
  window.addEventListener("hashchange", render);
  render();                                  // instant paint (seed data)
  loadLive().then(render);                   // refresh with real GoHighLevel data
}
init();
