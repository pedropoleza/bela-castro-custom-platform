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
      lastActivity: "2026-05-" + (10 + (i % 18))
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
const STORE_VER = "3";
try {
  if (localStorage.getItem("iwh_ver") !== STORE_VER) {
    ["messages", "dayState", "logs"].forEach((k) => localStorage.removeItem("iwh_" + k));
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

/* ---------------- audience logic ---------------- */
function applyFilters(contacts, f) {
  const ex = state.settings.excludedTags;
  return contacts.filter((c) => {
    // hard safety exclusions always
    if (c.status === "unsubscribed") return false;
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

/* ---------------- preview substitution ---------------- */
function renderMessage(body, contact = SAMPLE_CONTACT) {
  return body
    .replace(/\{\{contact\.first_name\}\}/g, contact.first_name)
    .replace(/\{\{contact\.full_name\}\}/g, contact.full_name)
    .replace(/\{\{contact\.email\}\}/g, contact.email)
    .replace(/\{\{contact\.phone\}\}/g, contact.phone)
    .replace(/\{\{custom_field\.goal\}\}/g, contact.goal)
    .replace(/\{\{custom_field\.program_status\}\}/g, contact.program_status);
}

/* ---------------- toast + modal ---------------- */
function toast(msg, bad = false) {
  const t = document.createElement("div");
  t.className = "toast" + (bad ? " toast--bad" : "");
  t.textContent = msg;
  $("#toastRoot").appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; t.style.transition = "all .3s"; setTimeout(() => t.remove(), 300); }, 3200);
}
function modal({ title, body, warn, confirmLabel = "Confirm", danger, onConfirm }) {
  const root = $("#modalRoot");
  root.innerHTML = `
    <div class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal">
        <h3>${esc(title)}</h3>
        ${warn ? `<div class="modal__warn">${esc(warn)}</div>` : ""}
        <p>${body}</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" data-x>Cancel</button>
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
const NAV = [
  { id: "dashboard", label: "Dashboard", ic: icon('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>') },
  { id: "calendar", label: "Weekly Calendar", ic: icon('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>') },
  { id: "library", label: "Message Library", ic: icon('<path d="M4 5h16M4 12h16M4 19h10"/>') },
  { id: "audience", label: "Audience Builder", ic: icon('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2"/><path d="M15 20c0-2 1.5-3.5 4-3.5"/>') },
  { id: "dispatch", label: "Dispatch Center", ic: icon('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>') },
  { id: "logs", label: "Logs", ic: icon('<path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01"/>') },
  { id: "settings", label: "Settings", ic: icon('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z"/>') }
];

const screens = {};

/* ---- A) Dashboard ---- */
screens.dashboard = () => {
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  const today = DAY_DEFS[todayIdx];
  const activeContacts = state.contacts.filter((c) => c.status === "active").length;
  const scheduled = state.logs.filter((l) => l.status === "scheduled").length;
  const cards = DAY_DEFS.map((d) => dayCard(d)).join("");
  return `
    <h1 class="section-title">This week</h1>
    <p class="section-sub">Pick a day to review its message, choose who receives it and send.</p>
    <div class="stat-row">
      <div class="card stat"><div class="stat__label">Today</div><div class="stat__value" style="font-size:1.2rem">${today.theme}</div><div class="stat__hint">${today.day}${today.offline ? " · rest day" : ""}</div></div>
      <div class="card stat"><div class="stat__label">Contacts</div><div class="stat__value">${activeContacts}</div><div class="stat__hint">able to receive</div></div>
      <div class="card stat"><div class="stat__label">Scheduled</div><div class="stat__value">${scheduled}</div><div class="stat__hint">this week</div></div>
    </div>
    <div class="day-grid">${cards}</div>`;
};

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
          <div class="row" style="gap:8px"><strong>${esc(m.title)}</strong><span class="pill ${statusClass(m.status)}">${m.status}</span></div>
          <div class="muted" style="font-size:.8rem">${m.channel} · v${m.version} · edited ${fmtDate(m.edited)}</div>
        </div>
        <div class="row" style="gap:6px">
          <a class="btn btn--soft btn--sm" href="#/library?edit=${m.id}">Edit</a>
          <button class="btn btn--ghost btn--sm" data-act="duplicate" data-id="${m.id}">Duplicate</button>
          <button class="btn btn--ghost btn--sm" data-act="usedispatch" data-id="${m.id}">Use in dispatch</button>
          <button class="btn btn--ghost btn--sm" data-act="archive" data-id="${m.id}">Archive</button>
        </div>
      </div>`).join("") : `<p class="muted mb">No messages yet for ${dn}.</p>`;
    return `<div class="card mb">
      <div class="row between mb"><div><h3 style="font-family:var(--display)">${dn} — ${esc(def.theme)}</h3><span class="muted" style="font-size:.82rem">${esc(def.objective)}</span></div>
      ${def.offline ? `<span class="pill pill--muted">Offline day</span>` : `<button class="btn btn--soft btn--sm" data-act="new" data-day="${dn}">+ New message</button>`}</div>
      ${rows}</div>`;
  }).join("");
  return `<h1 class="section-title">Message Library</h1><p class="section-sub">Create and manage message variations for each weekday. ${day ? `Filtered to <strong>${esc(day)}</strong> · <a href="#/library" style="color:var(--accent)">show all</a>` : "Use placeholders to personalize each message."}</p>${groups}`;
};

function messageEditor(id) {
  const m = state.messages.find((x) => x.id === id);
  if (!m) return `<p class="muted">Message not found. <a href="#/library" style="color:var(--accent)">Back to library</a></p>`;
  const def = DAY_DEFS.find((d) => d.day === m.day);
  const vars = VARIABLES.map((v) => `<button class="var-chip" data-var="${esc(v)}">${esc(v)}</button>`).join("");
  return `
    <div class="row between mb"><h1 class="section-title" style="margin:0">Message Editor</h1><a class="btn btn--ghost btn--sm" href="#/library?day=${m.day}">← Library</a></div>
    <div class="split split--editor">
      <div class="card">
        <div class="field"><label>Title</label><input class="input" id="ed-title" value="${esc(m.title)}"></div>
        <div class="row" style="gap:12px">
          <div class="field" style="flex:1"><label>Weekday</label>
            <select class="select" id="ed-day">${DAY_DEFS.map((d) => `<option ${d.day === m.day ? "selected" : ""}>${d.day}</option>`).join("")}</select></div>
          <div class="field" style="flex:1"><label>Channel</label>
            <select class="select" id="ed-channel">${["WhatsApp", "SMS", "Email"].map((c) => `<option ${c === m.channel ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field" style="flex:1"><label>Status</label>
            <select class="select" id="ed-status">${["draft", "ready", "scheduled", "paused"].map((s) => `<option ${s === m.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        </div>
        <div class="field" style="margin-bottom:6px"><label>Theme · ${esc(def.theme)}</label>
          <input class="input" id="ed-obj" value="${esc(def.objective)}" readonly style="opacity:.7"></div>
        <label class="field" style="margin-bottom:4px"><span style="font-size:.78rem;font-weight:600;color:var(--muted)">Insert variable</span></label>
        <div class="var-row">${vars}</div>
        <div class="field"><label>Message body</label><textarea class="textarea" id="ed-body" rows="9">${esc(m.body)}</textarea></div>
        <div class="row" style="gap:10px">
          <button class="btn btn--primary" id="ed-save">Save message</button>
          <span class="muted" style="font-size:.8rem">v${m.version} · created ${fmtDate(m.created)} · edited ${fmtDate(m.edited)}</span>
        </div>
      </div>
      <div class="card card--glass">
        <div class="panel-title">Preview <span class="pill pill--muted">sample: ${esc(SAMPLE_CONTACT.first_name)}</span></div>
        <div class="preview-phone"><div class="bubble" id="ed-preview">${esc(renderMessage(m.body))}</div>
        <div class="preview-meta">${esc(m.channel)} · to ${esc(SAMPLE_CONTACT.full_name)} · ${esc(SAMPLE_CONTACT.phone)}</div></div>
        <p class="muted mt" style="font-size:.8rem">Variables resolve per contact at send time. This preview uses a sample contact.</p>
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

/* ---- E) Dispatch Center ---- */
screens.dispatch = (params) => {
  const day = params.get("day");
  if (day && !state.dispatch.messageId) {
    const m = state.messages.find((x) => x.day === day && x.status !== "archived");
    if (m) state.dispatch.messageId = m.id;
  }
  const msg = state.messages.find((m) => m.id === state.dispatch.messageId);
  const f = currentFilters();
  const eligible = applyFilters(state.contacts, f);
  const count = eligible.length;
  const offlineWarn = msg && msg.day === "Saturday";
  const noFilter = !f.tag && !f.withoutTag && !f.field && !f.pipeline && !f.source;
  return `
    <h1 class="section-title">Dispatch Center</h1><p class="section-sub">Confirm the message and audience, run a test, then send now or schedule. Every dispatch is logged.</p>
    <div class="split">
      <div class="card">
        <div class="panel-title">1 · Message</div>
        <div class="field"><label>Choose message</label><select class="select" id="d-msg">
          <option value="">— select —</option>
          ${state.messages.filter((m) => m.status !== "archived").map((m) => `<option value="${m.id}" ${m.id === state.dispatch.messageId ? "selected" : ""}>${esc(m.day)} · ${esc(m.title)}</option>`).join("")}
        </select></div>
        ${msg ? `<div class="preview-phone"><div class="bubble">${esc(renderMessage(msg.body))}</div><div class="preview-meta">${esc(msg.channel)} · workflow: ${state.settings.workflows[msg.day] || "— (offline)"}</div></div>` : `<p class="muted">Select a message to preview it.</p>`}
        <div class="panel-title mt">2 · Audience</div>
        <p class="muted" style="font-size:.84rem">${esc(filtersSummary(f))}</p>
        <a class="btn btn--ghost btn--sm" href="#/audience">Edit audience →</a>
      </div>
      <div class="card card--glass">
        <div class="panel-title">3 · Send</div>
        <div class="audience-count">${count}</div>
        <p class="muted" style="font-size:.84rem">eligible contacts after safety exclusions</p>
        ${offlineWarn ? `<div class="modal__warn mt">Saturday is an Offline Presence Day — no workflow is triggered by default.</div>` : ""}
        ${noFilter ? `<div class="modal__warn mt">No audience filter selected — this targets the entire eligible base.</div>` : ""}
        ${count > 250 ? `<div class="modal__warn mt">High audience volume (${count}). Double-check before sending.</div>` : ""}
        <div class="row mt" style="gap:10px">
          <button class="btn btn--soft" id="d-test" ${!msg ? "disabled" : ""}>Send test</button>
          <button class="btn btn--ghost" id="d-schedule" ${!msg ? "disabled" : ""}>Schedule</button>
          <button class="btn btn--primary" id="d-send" ${!msg || offlineWarn ? "disabled" : ""}>Send now</button>
        </div>
        <p class="muted mt" style="font-size:.78rem">Test sends to: ${esc(state.settings.testContact)}</p>
      </div>
    </div>`;
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
  return `
    <div class="row between mb"><div><h1 class="section-title" style="margin:0">Dispatch Logs</h1><p class="muted" style="font-size:.9rem">Every action is recorded for auditing.</p></div>
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
    <h1 class="section-title">Settings</h1><p class="section-sub">Map weekday workflows, default times, excluded tags, custom fields and the test contact. API credentials live on the backend — never in this frontend.</p>
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
    state.dayState[day].status = b.dataset.act === "pause" ? "paused" : "ready";
    persist(); toast(`${day} ${b.dataset.act === "pause" ? "paused" : "resumed"}.`); render();
  });

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

    // editor
    if (params.get("edit")) {
      const id = params.get("edit");
      const body = $("#ed-body"), prev = $("#ed-preview");
      const upd = () => prev.textContent = renderMessage(body.value);
      body && body.addEventListener("input", upd);
      root.querySelectorAll(".var-chip").forEach((c) => c.onclick = () => {
        const v = c.dataset.var; const s = body.selectionStart ?? body.value.length;
        body.value = body.value.slice(0, s) + v + body.value.slice(s); body.focus(); upd();
      });
      $("#ed-save").onclick = () => {
        const m = state.messages.find((x) => x.id === id);
        m.title = $("#ed-title").value.trim() || m.title;
        m.day = $("#ed-day").value; m.channel = $("#ed-channel").value; m.status = $("#ed-status").value;
        m.body = body.value; m.version += 1; m.edited = new Date().toISOString();
        persist(); toast("Message saved (v" + m.version + ")."); location.hash = `#/library?day=${m.day}`;
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

  if (route === "dispatch") {
    const msgSel = $("#d-msg");
    msgSel && (msgSel.onchange = () => { state.dispatch.messageId = msgSel.value || null; render(); });
    const f = currentFilters();
    const eligible = applyFilters(state.contacts, f);
    const msg = state.messages.find((m) => m.id === state.dispatch.messageId);
    const logDispatch = (status, res) => {
      state.logs.unshift({
        id: res.dispatchId || uid("DSP"), day: msg.day, title: msg.title, filters: filtersSummary(f),
        estimated: eligible.length, sent: res.sent || 0, failed: res.failed || 0, skipped: res.skipped || 0,
        when: new Date().toISOString(), user: "Isabela", status, notes: "Workflow " + (state.settings.workflows[msg.day] || "—")
      });
      // update day + contact metadata (mock CRM sync)
      if (status === "sent" || status === "partially sent") {
        state.dayState[msg.day].status = "sent"; state.dayState[msg.day].lastSent = new Date().toISOString();
      } else if (status === "scheduled") {
        state.dayState[msg.day].status = "scheduled";
      }
      persist();
    };
    const wfId = state.settings.workflows[msg.day]; // mapped GHL workflow id/name
    const test = $("#d-test"); test && (test.onclick = async () => {
      test.disabled = true;
      const res = await api.dispatchTest({ contactId: state.settings.testContact, channel: msg.channel, message: renderMessage(msg.body) });
      test.disabled = false;
      if (res && res.error) toast("Test failed: " + res.error, true);
      else toast(res && res.mock ? "Test (mock) ok — connect backend to really send." : "Test sent.");
    });
    const sched = $("#d-schedule"); sched && (sched.onclick = () => {
      modal({ title: "Schedule dispatch", body: `Schedule <strong>${esc(msg.title)}</strong> for <strong>${eligible.length}</strong> contacts using ${esc(filtersSummary(f))}.`, confirmLabel: "Schedule", onConfirm: async () => {
        const res = await api.dispatchSchedule({ day: msg.day, when: state.settings.defaultTimes[msg.day], count: eligible.length });
        logDispatch("scheduled", res || {}); toast("Dispatch scheduled."); render();
      }});
    });
    const send = $("#d-send"); send && (send.onclick = () => {
      modal({
        title: "Confirm dispatch",
        warn: !wfId ? "No workflow mapped for this day (set it in Settings)." : (eligible.length > 250 ? `High volume: ${eligible.length} contacts.` : (!f.tag && !f.field && !f.pipeline && !f.source ? "No filter selected — entire eligible base." : "")),
        body: `You are about to send <strong>${esc(msg.title)}</strong> to <strong>${eligible.length}</strong> contacts via <strong>${esc(wfId || "—")}</strong>.<br>This action cannot be undone. Confirm dispatch?`,
        confirmLabel: "Send now", onConfirm: async () => {
          send.disabled = true;
          const res = await api.dispatchSend({ workflowId: wfId, contactIds: eligible.map((c) => c.id), day: msg.day });
          send.disabled = false;
          if (res && res.error) { toast("Dispatch failed: " + res.error, true); logDispatch("failed", { sent: 0, failed: eligible.length }); render(); return; }
          const sent = res && res.mock ? eligible.length : (res.sent || 0);
          const failed = (res && res.failed) || 0;
          logDispatch(failed > 0 ? "partially sent" : "sent", { dispatchId: res.dispatchId, sent, failed, skipped: 0 });
          toast(`Dispatched: ${sent} sent, ${failed} failed.`); location.hash = "#/logs";
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
      if (!state.settings.excludedTags.includes("weekly-messages-optout")) state.settings.excludedTags.push("weekly-messages-optout");
      state.settings.testContact = $("#set-test").value.trim();
      persist(); toast("Settings saved."); render();
    });
  }
}

/* ============================================================
   ROUTER
   ============================================================ */
function parseHash() {
  const h = location.hash.replace(/^#\/?/, "") || "dashboard";
  const [path, query] = h.split("?");
  return { route: path || "dashboard", params: new URLSearchParams(query || "") };
}
function render() {
  const { route, params } = parseHash();
  $("#modalRoot").innerHTML = "";
  const view = screens[route] || screens.dashboard;
  $("#screen").innerHTML = view(params);
  $("#nav").querySelectorAll("a").forEach((a) => a.classList.toggle("is-active", a.dataset.route === route));
  window.scrollTo(0, 0);
  wire(route, params);
}

/* ---------------- init ---------------- */
function init() {
  // build nav
  $("#nav").innerHTML = NAV.map((n) => `<a href="#/${n.id}" data-route="${n.id}">${n.ic}<span>${n.label}</span></a>`).join("");
  window.addEventListener("hashchange", render);
  render();                                  // instant paint (seed data)
  loadLive().then(render);                   // refresh with real GoHighLevel data
}
init();
