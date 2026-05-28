// Multi-tenant config resolver — server-side only (never reaches the browser).
//
// Onboard a new company/location by adding an entry to the TENANTS env var.
// TENANTS is a JSON object keyed by the company's GoHighLevel locationId:
//
//   TENANTS = {
//     "<ghlLocationId>": {
//       "name": "Empresa X",
//       "ghlPit": "pit-...",                       // location Private Integration Token
//       "stevoApiBase": "https://api.suaempresa.stevo.chat",
//       "stevoApiKey": "...",
//       "stevoReady": true,                         // flip on once a number is connected
//       "routes": {                                 // button id -> segment tag
//         "quero_plano_a": "plano-a",
//         "quero_plano_b": "plano-b",
//         "so_info":       "lead-frio"
//       },
//       "chainMessages": {                          // msg-id -> Stevo command string
//         "msg-abc123": "#bt|Próximo passo|Qual sua escolha?|.|Mensal*plano_mensal_a/Anual*plano_anual_a"
//       }
//     }
//   }
//
// The native GoHighLevel workflow in each location is triggered by "tag added"
// (e.g. tag "plano-a") and sends the response-specific message. The hub only
// dispatches the initial button message and applies the routed tag on reply.
//
// Backward compatibility: if TENANTS has no entry for the legacy single-location
// env vars (GHL_LOCATION_ID / GHL_PIT / STEVO_*), a tenant is synthesized from
// them so the existing Vida Bela location keeps working untouched.

let CACHE;

function all() {
  if (CACHE) return CACHE;
  let map = {};
  try { map = JSON.parse(process.env.TENANTS || "{}"); } catch { map = {}; }
  const legacyLoc = process.env.GHL_LOCATION_ID;
  if (legacyLoc && !map[legacyLoc]) {
    map[legacyLoc] = {
      name: "default",
      ghlPit: process.env.GHL_PIT,
      stevoApiBase: process.env.STEVO_API_BASE,
      stevoApiKey: process.env.STEVO_APIKEY,
      stevoReady: process.env.STEVO_READY === "1",
      routes: {},
      chainMessages: {}
    };
  }
  CACHE = map;
  return map;
}

function tenant(locationId) {
  if (!locationId) return null;
  const t = all()[locationId];
  if (!t) return null;
  return {
    locationId,
    name: t.name || locationId,
    ghlPit: t.ghlPit || "",
    stevoApiBase: (t.stevoApiBase || "").replace(/\/$/, ""),
    stevoApiKey: t.stevoApiKey || "",
    stevoReady: Boolean(t.stevoReady),
    routes: t.routes || {},
    chainMessages: t.chainMessages || {}
  };
}

module.exports = { tenant, all };
