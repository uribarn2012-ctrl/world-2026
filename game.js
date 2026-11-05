/* עולם 2026 — real-time grand strategy. Original game. */
(function () {
'use strict';

/* ================= constants ================= */
const VERSION = 2;
const SAVE_KEY = 'world2026_save_v2';
const OLD_SAVE_KEYS = ['world2026_save_v1'];
const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAY_MS = 86400000, START_MS = Date.UTC(2026, 0, 1), DPM = 30.44;
const SPEEDS = [0, 1, 2, 4, 8, 16, 32];
/* military inventory: power points per unit (troops / reserves in thousands) */
const INV_KEYS = ['troops', 'tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'carriers', 'msl'];
const W8 = { troops: 0.5, tanks: 0.1, afv: 0.02, art: 0.04, air: 0.5, heli: 0.15, ships: 2, subs: 3, carriers: 25, msl: 0.02 };
const INV_HE = { troops: 'חיילים בסדיר', res: 'מילואים', tanks: 'טנקים', afv: 'נגמ״שים ורק״מ', art: 'תותחים וארטילריה', air: 'מטוסי קרב',
  heli: 'מסוקי קרב', ships: 'ספינות קרב', subs: 'צוללות', carriers: 'נושאות מטוסים', msl: 'טילים בליסטיים ושיוט' };
/* purchase packages: n units for cost (bn USD), delivered after days; upkeep = yearly share of the price */
const BUY = {
  troops: { n: 10, cost: 0.3, days: 91, he: 'גיוס 10,000 חיילים', unit: 'חיילים', sub: 'אימון 3 חודשים' },
  tanks: { n: 10, cost: 0.05, days: 183, he: '10 טנקים', unit: 'טנקים', sub: '$5M לטנק · 6 חודשים' },
  afv: { n: 20, cost: 0.04, days: 152, he: '20 נגמ״שים', unit: 'נגמ״שים', sub: '$2M ליחידה · 5 חודשים' },
  art: { n: 10, cost: 0.03, days: 152, he: '10 תותחים', unit: 'תותחים', sub: '$3M לתותח · 5 חודשים' },
  air: { n: 4, cost: 0.32, days: 365, he: '4 מטוסי קרב', unit: 'מטוסי קרב', sub: '$80M למטוס · 12 חודשים' },
  heli: { n: 4, cost: 0.12, days: 274, he: '4 מסוקי קרב', unit: 'מסוקי קרב', sub: '$30M למסוק · 9 חודשים' },
  ships: { n: 1, cost: 0.6, days: 730, he: 'פריגטה', unit: 'ספינות קרב', sub: '$600M · 24 חודשים' },
  subs: { n: 1, cost: 1, days: 913, he: 'צוללת', unit: 'צוללות', sub: '$1B · 30 חודשים' },
  carriers: { n: 1, cost: 13, days: 1461, he: 'נושאת מטוסים', unit: 'נושאות מטוסים', sub: '$13B · 4 שנים', minGdp: 600 },
  msl: { n: 25, cost: 0.06, days: 183, he: '25 טילים', unit: 'טילים', sub: '$2.4M לטיל · 6 חודשים', needMl: 1 }
};
const UPKEEP_RATE = { tanks: 0.08, afv: 0.08, art: 0.06, air: 0.1, heli: 0.1, ships: 0.07, subs: 0.07, carriers: 0.07, msl: 0.02 };
const LVL_HE = ['אין', 'בסיסית', 'מתקדמת', 'עולמית'];
const MIS_RANGE = [0, 300, 2500, 13000];
const AIR_RANGE = 2500; // combat radius with aerial refuelling
/* domestic projects: cost as share of yearly GDP, build time in days */
const PROJ = {
  hosp: { he: 'בתי חולים', cost: 0.004, days: 365, ap: 3, g: 0, rep: 0, d: 'העם +3 לתמיד, האוכלוסייה בריאה יותר' },
  school: { he: 'בתי ספר ואוניברסיטאות', cost: 0.004, days: 548, ap: 2, g: 0.003, rep: 0, d: 'העם +2, צמיחה +0.3% בשנה' },
  infra: { he: 'כבישים, רכבות ונמלים', cost: 0.008, days: 730, ap: 1, g: 0.006, rep: 0, d: 'צמיחה +0.6% בשנה, העם +1' },
  house: { he: 'דיור בר-השגה', cost: 0.006, days: 365, ap: 4, g: 0, rep: 0, d: 'העם +4 לתמיד' },
  green: { he: 'אנרגיה מתחדשת', cost: 0.006, days: 548, ap: 1, g: 0.003, rep: 5, d: 'צמיחה +0.3%, העולם +5, העם +1' },
  police: { he: 'משטרה ויחידות סדר', cost: 0.0015, days: 61, ap: 0, g: 0, rep: 0, d: 'מאפשר לפזר הפגנות בכוח (שקט זמני, פוגע במוניטין)', max: 1 },
  propa: { he: 'מכונת תעמולה', cost: 0.002, days: 91, ap: 4, g: 0, rep: -3, d: 'העם +4, העולם −3. רק למשטרים לא דמוקרטיים', nondem: true }
};
const BLOC_HE = { NATO:'נאט״ו', EU:'האיחוד האירופי', CSTO:'CSTO (ברית רוסיה)', SCO:'ארגון שנגחאי', BRICS:'BRICS',
  ArabLeague:'הליגה הערבית', GCC:'מועצת המפרץ', AU:'האיחוד האפריקאי', ASEAN:'ASEAN', AUKUS:'AUKUS', QUAD:'הקוואד', CIS:'חבר העמים' };
const BLOC_W = { NATO:35, EU:25, CSTO:30, GCC:25, ArabLeague:10, SCO:10, BRICS:8, AU:5, ASEAN:10, AUKUS:30, QUAD:15, CIS:8 };
// rough defaults for map shapes that have no ISO code (marked as estimated in the UI)
const NOID_DATA = {
  '383': { en:'Kosovo', he:'קוסובו', pop:1.6, gdp:11, def:0.15, mil:5, nukes:0, gov:'democracy', blocs:[], approval:50 },
  SML: { en:'Somaliland', he:'סומלילנד', pop:5.7, gdp:7.5, def:0.1, mil:30, nukes:0, gov:'hybrid', blocs:[], approval:50 }
};
const GOV_HE = { democracy:'דמוקרטיה', authoritarian:'משטר סמכותני', hybrid:'משטר היברידי' };
const DEPS = {
  '840':['316','016','630','850','580'],
  '826':['239','086','654','612','660','238','136','060','092','796','500','832','831','833'],
  '528':['533','531','534'], '250':['666','876','663','652','258','540','260'], '246':['248'],
  '208':['304','234'], '156':['446','344'], '036':['334','574','IOT'], '554':['570','184'], '356':['SIA']
};
const NOID = { 'Somaliland':'SML', 'Kosovo':'383', 'N. Cyprus':'NCY', 'Indian Ocean Ter.':'IOT', 'Siachen Glacier':'SIA' };
const HE_EXTRA = { SML:'סומלילנד', '383':'קוסובו', NCY:'צפון קפריסין', '732':'סהרה המערבית', '010':'אנטארקטיקה' };
const UNPLAYABLE = new Set(['010','732','NCY']);
const HIDDEN = new Set(['010']);
const OIL = new Set(['682','643','364','368','784','414','634','578','566','862','012','434','398','124','512','048','024']);
const COL = { me:'#f5b301', ally:'#2f7bff', war:'#e5383b', neutral:'#3a4250', none:'#22272e' };

/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const R = Math.random;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const pick = arr => arr[Math.floor(R() * arr.length)];
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
function money(bn, short) {
  const neg = bn < 0, v = Math.abs(bn);
  let s, w = '';
  if (short) s = v >= 1000 ? (v / 1000).toFixed(1) + 'T' : v >= 10 ? Math.round(v) + 'B' : v >= 1 ? v.toFixed(1) + 'B' : Math.round(v * 1000) + 'M';
  else if (v >= 1000) { s = (v / 1000).toFixed(2); w = ' טריליון'; }
  else if (v >= 1) { s = v >= 10 ? Math.round(v) : v.toFixed(1); w = ' מיליארד'; }
  else { s = Math.round(v * 1000); w = ' מיליון'; }
  // number stays LTR, the Hebrew unit word sits outside it so the phrase reads naturally right-to-left
  return '<span class="nw"><span class="num" dir="ltr">' + (neg ? '-' : '') + '$' + s + '</span>' + w + '</span>';
}
const num = (v, d) => '<span class="num" dir="ltr">' + (d ? v.toFixed(d) : Math.round(v).toLocaleString('en-US')) + '</span>';
const pct = v => '<span class="num" dir="ltr">' + Math.round(v) + '%</span>';
function popTxt(m) { return m >= 1 ? num(m, m < 10 ? 1 : 0) + ' מיליון' : num(m * 1000) + ' אלף'; }
// month index -> "מרץ 2027"
function dateTxt(t) { return MONTHS[((t % 12) + 12) % 12] + ' ' + (2026 + Math.floor(t / 12)); }
function dParts(day) { const d = new Date(START_MS + Math.floor(day) * DAY_MS); return { d: d.getUTCDate(), m: d.getUTCMonth(), y: d.getUTCFullYear() }; }
function dayTxt(day) { const q = dParts(day); return q.d + ' ב' + MONTHS[q.m] + ' ' + q.y; }
// same, with the numbers isolated so the date never gets scrambled in right-to-left text
function dayHtml(day) { const q = dParts(day); return '<span class="num">' + q.d + '</span> ב' + MONTHS[q.m] + ' <span class="num">' + q.y + '</span>'; }
function monthOf(day) { const q = dParts(day); return (q.y - 2026) * 12 + q.m; }
function daysTxt(d) { d = Math.max(1, Math.ceil(d)); return d >= 60 ? num(Math.round(d / DPM)) + ' חודשים' : d === 1 ? 'יום אחד' : num(d) + ' ימים'; }
// troops / reserves are kept in thousands
function troopsTxt(k) { const v = k * 1000; return v >= 1e6 ? num(v / 1e6, 2) + ' מיליון' : v >= 1e4 ? num(v / 1000) + ' אלף' : num(Math.round(v / 10) * 10); }
// wrap signed numbers / percents inside Hebrew text so they keep their left-to-right shape
const isoNums = t => String(t).replace(/(?:(?<![א-ת])[+−-])?\$?\d[\d.,]*(?::\d[\d.,]*)?(?:%|[BMTK](?![A-Za-z]))?/g, m => '<span class="num" dir="ltr">' + m + '</span>');
const cnt = v => num(Math.max(0, Math.floor(v + 1e-6)));
// signed number for effect lines: +3 / −12
function sgn(v) { const a = Math.abs(v); return '<span class="num" dir="ltr">' + (v > 0 ? '+' : v < 0 ? '−' : '±') + (a >= 1 || a === 0 ? Math.round(a) : a.toFixed(1)) + '</span>'; }

/* ================= geometry ================= */
let TERR = {}, TIDS = [], FEATS = [];
function initGeo() {
  const topo = window.WORLD_TOPO;
  const geoms = topo.objects.countries.geometries;
  const fc = topojson.feature(topo, topo.objects.countries).features;
  const nb = topojson.neighbors(geoms);
  fc.forEach((f, i) => {
    f.properties = f.properties || {};
    const name = f.properties.name || '?';
    const tid = (f.id != null && f.id !== '') ? String(f.id) : (NOID[name] || ('X' + i));
    f.properties.tid = tid;
    let T = TERR[tid];
    if (!T) { T = TERR[tid] = { tid, name, feats: [], nb: new Set(), area: 0, best: null, bestA: 0 }; TIDS.push(tid); }
    T.feats.push(f);
    const g = f.geometry; if (!g) return;
    const polys = g.type === 'MultiPolygon' ? g.coordinates : g.type === 'Polygon' ? [g.coordinates] : [];
    polys.forEach(p => {
      const poly = { type: 'Polygon', coordinates: p };
      let a = d3.geoArea(poly); if (a > 2 * Math.PI) a = 4 * Math.PI - a;
      T.area += a; if (a > T.bestA) { T.bestA = a; T.best = poly; }
    });
  });
  fc.forEach((f, i) => nb[i].forEach(j => {
    const a = f.properties.tid, b = fc[j].properties.tid;
    if (a !== b) { TERR[a].nb.add(b); TERR[b].nb.add(a); }
  }));
  TIDS.forEach(t => { const T = TERR[t]; T.c = T.best ? d3.geoCentroid(T.best) : [0, 0]; T.km2 = T.area * 6371 * 6371; });
  FEATS = fc;
}

/* ================= state ================= */
let S = null;
let OWN = {}; const ADJ = new Map(), DIST = new Map(), BASE = new Map(); let START_REL = new Map();
function rebuildOwn() {
  OWN = {};
  for (const t in S.owner) { const o = S.owner[t]; if (o) (OWN[o] = OWN[o] || []).push(t); }
  ADJ.clear(); DIST.clear(); CBY = null; CLT = null;
}
const tidsOf = c => OWN[c] || [];
// land ceded in a peace treaty: S.cl[cityId] = the country that now owns that city and the land around it
// (its part of the map is the city's Voronoi cell inside the old country's shape)
const landOf = x => (S.cl && S.cl[x.id]) || S.owner[x.tid] || null;
var CLT = null; // tid -> all cities on it, only for territories that have ceded land
function clIdx() {
  if (CLT) return CLT; CLT = {};
  if (S && S.cl) for (const id in S.cl) { const x = CITYI[id]; if (x && !CLT[x.tid]) CLT[x.tid] = CITY.filter(y => y.tid === x.tid && isFinite(y.fx)); }
  // a city's land reaches at most CL_KM from it (so one city never takes most of a big country); mr = that radius on the map
  for (const t in CLT) CLT[t].forEach(x => { const q = FLATP && FLATP([x.lon, Math.min(89, x.lat + 1)]); x.mr = q ? Math.hypot(q[0] - x.fx, q[1] - x.fy) * CL_KM / 111.2 : 1e9; });
  return CLT;
}
const CL_KM = 500;
// who owns this point of territory t (the nearest city on the map decides inside a split country)
function ptOwner(t, lon, lat) {
  const o = S.owner[t] || null; if (!o || !S.cl) return o;
  const l = clIdx()[t]; if (!l || !l.length || !FLATP) return o;
  const p = FLATP([lon, lat]); if (!p) return o;
  let best = null, bd = 1e18;
  for (const x of l) { const dx = x.fx - p[0], dy = x.fy - p[1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = x; } }
  return best && bd <= best.mr * best.mr ? landOf(best) : o;
}
// drop entries that no longer mean anything (the land's owner got it back, the city is gone); follow annexations
function clNorm() {
  if (!S || !S.cl || typeof S.cl !== 'object') { if (S) S.cl = {}; return; }
  for (const id in S.cl) {
    const x = CITYI[id]; let o = S.cl[id], n = 0;
    while (o && S.c[o] && !S.c[o].alive && S.c[o].annexedBy && n++ < 9) o = S.c[o].annexedBy;
    if (!x || !o || !S.c[o] || !S.c[o].alive || o === S.owner[x.tid]) delete S.cl[id]; else S.cl[id] = o;
  }
  CLT = null; CBY = null;
}
const alive = () => Object.keys(S.c).filter(id => S.c[id].alive);
const P = () => S.c[S.player];
const nm = id => (S.c[id] && S.c[id].he) || HE_EXTRA[id] || (TERR[id] && TERR[id].name) || id;

function dataFor(tid, name) {
  const D = window.COUNTRY_DATA || {};
  if (D[tid]) return D[tid];
  if (NOID_DATA[tid]) { const e = Object.assign({}, NOID_DATA[tid]); e._est = true; return e; }
  const low = String(name).toLowerCase();
  for (const k in D) { const e = D[k]; if (e && e.en && String(e.en).toLowerCase() === low) return e; }
  return null;
}
function makeCountry(tid, d, T) {
  const km2 = T ? T.km2 : 50000;
  const def = d || {};
  const pop = +def.pop > 0 ? +def.pop : clamp(km2 / 1e6 * 20, 0.05, 40);
  const gdp = +def.gdp > 0 ? +def.gdp : Math.max(0.5, pop * 6);
  const dbud = +def.def > 0 ? +def.def : gdp * 0.015;
  const mil = +def.mil > 0 ? +def.mil : Math.max(1, pop * 1.5);
  const c = {
    id: tid, he: def.he || HE_EXTRA[tid] || (T && T.name) || tid, en: def.en || (T && T.name) || tid,
    pop, gdp, gdp0: gdp, def: dbud, def0: dbud, defPct: clamp(dbud / gdp, 0.003, 0.15),
    nukes: Math.max(0, Math.round(+def.nukes || 0)), gov: GOV_HE[def.gov] ? def.gov : 'hybrid',
    blocs: Array.isArray(def.blocs) ? def.blocs.slice() : [], approval: clamp(+def.approval || 50, 5, 95),
    alive: true, generated: !d || !!def._est
  };
  makeInv(c, def, dbud, mil);
  return c;
}
// real equipment counts from the data; anything missing is estimated from budget and troops
function makeInv(c, d, dbud, mil) {
  const has = k => d[k] != null && d[k] !== '' && isFinite(+d[k]);
  const v = (k, est) => has(k) ? Math.max(0, +d[k]) : Math.max(0, Math.round(est));
  const inv = { troops: mil };
  inv.tanks = v('tanks', mil * 0.9 + dbud * 2);
  inv.afv = v('afv', inv.tanks * 2.2);
  inv.art = v('art', mil * 0.8 + dbud * 1.5);
  inv.air = v('air', dbud * 1.6 + mil * 0.05);
  inv.heli = v('heli', inv.air * 0.3);
  inv.ships = v('ships', dbud * 0.25 + mil * 0.01);
  inv.subs = v('subs', dbud > 3 ? dbud * 0.05 : 0);
  inv.carriers = Math.min(inv.ships, v('carriers', dbud > 200 ? 1 : 0));
  c.mlv = has('missiles') ? clamp(Math.round(+d.missiles), 0, 3) : dbud > 50 ? 2 : dbud > 5 ? 1 : 0;
  c.adv = has('airdef') ? clamp(Math.round(+d.airdef), 0, 3) : dbud > 30 ? 2 : dbud > 3 ? 1 : 0;
  inv.msl = Math.round([0, 30 + dbud * 1.5, 120 + dbud * 4, 400 + dbud * 5][c.mlv]);
  c.res = v('res', mil * 1.2);
  c.inv = inv; c.inv0 = Object.assign({}, inv);
  // quality of the force: how much money stands behind each soldier (modern jets vs. old rifles)
  c.q = clamp(Math.pow(dbud * 1e6 / Math.max(1, mil * 1000) / 200, 0.3), 0.6, 1.6);
  c.mob = 0;
}
const rawPower = inv => { let s = 0; for (const k of INV_KEYS) s += (inv[k] || 0) * W8[k]; return s; };
const power = c => c ? Math.max(1, rawPower(c.inv) * (c.q || 1) * (c.tm || 1)) : 0;
// scale a whole inventory (losses, nuclear damage, ceded land)
function hurtInv(c, f, kinds) {
  const ks = kinds || INV_KEYS;
  ks.forEach(k => { c.inv[k] = Math.max(0, (c.inv[k] || 0) * (1 - f)); });
  if (!kinds) c.res = Math.max(0, c.res * (1 - f * 0.5));
}
// target inventory the defence budget can sustain (plus what the player bought)
function invTarget(c, k) {
  const r = Math.pow(Math.max(0.05, c.def / Math.max(0.01, c.def0)), 0.85);
  return c.inv0[k] * r + ((c.bought && c.bought[k]) || 0) + (k === 'troops' ? c.mob || 0 : 0);
}

function newGame(playerId) {
  S = { v: VERSION, day: 0, turn: 0, speed: 1, player: playerId, c: {}, owner: {}, rd: {}, pacts: {}, sanc: {}, wars: [], news: [], pending: [],
    recession: 0, wid: 1, over: null, won: {}, p: null, worldGdp0: 0, units: [], uid: 0, uc: {} };
  BASE.clear();
  const depOwner = {};
  for (const o in DEPS) DEPS[o].forEach(t => depOwner[t] = o);
  const D = window.COUNTRY_DATA || {};
  for (const t in D) if (D[t] && D[t].owner && String(D[t].owner) !== t) depOwner[t] = String(D[t].owner);
  TIDS.forEach(t => {
    if (depOwner[t]) return;
    if (UNPLAYABLE.has(t)) { S.owner[t] = null; return; }
    const T = TERR[t];
    S.c[t] = makeCountry(t, dataFor(t, T.name), T);
    S.owner[t] = t;
  });
  TIDS.forEach(t => { if (depOwner[t]) S.owner[t] = S.c[depOwner[t]] ? depOwner[t] : null; });
  rebuildOwn();
  // initial sanctions from very hostile starting relations
  START_REL.forEach((v, k) => {
    if (v > -60) return;
    const [a, b] = k.split('|');
    if (!S.c[a] || !S.c[b]) return;
    if (S.c[a].gov === 'democracy') S.sanc[a + '>' + b] = 1;
    if (S.c[b].gov === 'democracy') S.sanc[b + '>' + a] = 1;
  });
  // real mutual-defence treaties outside NATO / CSTO (US–Japan, US–South Korea, US–Philippines, ANZUS, Russia–North Korea 2024)
  [['840', '392'], ['840', '410'], ['840', '608'], ['840', '036'], ['036', '554'], ['643', '408']].forEach(([a, b]) => { if (S.c[a] && S.c[b]) setPact(a, b, 'alliance', true); });
  (window.STARTING_WARS || []).forEach(pr => {
    const a = String(pr[0]), b = String(pr[1]);
    if (!S.c[a] || !S.c[b] || a === b) return;
    const w = declareWar(a, b, { silent: true, noJoin: true });
    if (w) { w.f = (a === '643' && b === '804') ? 18 : 6; w.start = -24; w.startDay = -730; }
  });
  S.worldGdp0 = worldGdp();
  ensureCityState();
  if (playerId) setupPlayer(playerId);
  return S;
}
function setupPlayer(id) {
  S.player = id;
  const c = S.c[id];
  S.p = { tax: clamp(Math.round((0.15 + 0.11 + clamp(c.defPct, 0.005, 0.12) - 0.005) * 100) / 100, 0.15, 0.5), welfare: 0.15, defPct: clamp(c.defPct, 0.005, 0.12), defPct0: clamp(c.defPct, 0.005, 0.12),
    treasury: c.gdp * 0.04, unrest: 0, shock: 0, lowTurns: 0, annexed: [], gdpHist: [c.gdp], budget: null,
    nprog: null, cas: 0, casTotal: 0, startGdp: c.gdp, startPop: c.pop, startShare: c.gdp / worldGdp(), bankrupt: false,
    cd: {}, griev: {}, queue: [], proj: [], built: {}, apBonus: 0, growthBonus: 0, bm: null, mStart: null, crack: 0, gov: newGov(), tm: [], tg: [] };
  S.ev = { nx: 18, cd: {}, ld: 14, n: 0, dn: 0 }; // a calm first few weeks
  // world reputation starts from how the world already sees this country
  let avg = 0, n = 0; alive().forEach(o => { if (o !== id) { avg += rel(o, id); n++; } }); avg /= n || 1;
  S.p.rep = clamp(Math.round({ democracy: 58, hybrid: 48, authoritarian: 40 }[c.gov] + avg * 0.5), 10, 90);
  S.p.rep0 = S.p.rep;
  c.bought = {};
  S.p.mStart = { tr: S.p.treasury, ap: c.approval, rep: S.p.rep };
  addNews('ממשלה חדשה נכנסה לתפקיד ב' + c.he + '. העם מצפה לשינוי.', 'good');
  initUnits();
  worldSnap();
}

/* ================= relations / pacts ================= */
function baseRel(a, b) {
  const k = key(a, b);
  if (BASE.has(k)) return BASE.get(k);
  let v = 0;
  if (START_REL.has(k)) v = START_REL.get(k);
  else {
    const A = S.c[a], B = S.c[b];
    if (A && B) {
      const shared = A.blocs.filter(x => B.blocs.includes(x));
      for (const x of shared) v += BLOC_W[x] || 5;
      v = Math.min(v, 70);
      const opp = (x, y) => (A.blocs.includes(x) && B.blocs.includes(y) && !A.blocs.includes(y)) || (A.blocs.includes(y) && B.blocs.includes(x) && !B.blocs.includes(y));
      if (opp('NATO', 'CSTO')) v -= 35; else if (opp('NATO', 'SCO')) v -= 12;
      if (A.gov === 'democracy' && B.gov === 'democracy') v += 10;
      else if (A.gov !== B.gov && (A.gov === 'democracy' || B.gov === 'democracy')) v -= 5;
    }
  }
  v = clamp(v, -100, 100); BASE.set(k, v); return v;
}
function rel(a, b) { if (a === b) return 100; return clamp(baseRel(a, b) + (S.rd[key(a, b)] || 0), -100, 100); }
function addRel(a, b, d) {
  if (a === b || !a || !b) return;
  const k = key(a, b), base = baseRel(a, b);
  const cur = clamp(base + (S.rd[k] || 0), -100, 100);
  S.rd[k] = clamp(cur + d, -100, 100) - base;
}
const pact = (a, b) => S.pacts[key(a, b)] || null;
function setPact(a, b, type, on) {
  const k = key(a, b); const p = S.pacts[k] || (S.pacts[k] = {});
  if (on) p[type] = 1; else delete p[type];
  if (S.player && (a === S.player || b === S.player)) needMapRecolor = true;
  if (!Object.keys(p).length) delete S.pacts[k];
}
const hasPact = (a, b, t) => !!(pact(a, b) && pact(a, b)[t]);
function isAlly(a, b) {
  if (a === b || !S.c[a] || !S.c[b]) return false;
  if (hasPact(a, b, 'alliance')) return true;
  const A = S.c[a].blocs, B = S.c[b].blocs;
  return (A.includes('NATO') && B.includes('NATO')) || (A.includes('CSTO') && B.includes('CSTO'));
}
const sanctions = (a, b) => !!S.sanc[a + '>' + b];
// sum of the economies sanctioning each country, worked out once per game day
let SHC = { t: null, m: null };
function sanctionHit(b) {
  const tk = S.day + ':' + S.wid;
  if (SHC.t !== tk || SHC.s !== S.sanc) {
    const m = {};
    for (const k in S.sanc) { const i = k.indexOf('>'), a = k.slice(0, i), t = k.slice(i + 1); if (S.c[a] && S.c[a].alive) m[t] = (m[t] || 0) + S.c[a].gdp; }
    SHC = { t: tk, s: S.sanc, m };
  }
  return Math.min(0.3, (SHC.m[b] || 0) / worldGdp() * 0.35);
}
const sancDirty = () => { SHC.t = null; };
let WG_CACHE = { t: -1, v: 1 };
function worldGdp() {
  if (WG_CACHE.t === (S ? S.day + ':' + S.wid : 0)) return WG_CACHE.v;
  let s = 0; for (const id in S.c) if (S.c[id].alive) s += S.c[id].gdp;
  WG_CACHE = { t: S.day + ':' + S.wid, v: s || 1 }; return WG_CACHE.v;
}
// how the rest of the world sees a country: average relation towards it (cached per day)
let WV = { t: -1, m: {} };
function worldView(x) {
  if (WV.t !== S.day) WV = { t: S.day, m: {} };
  if (WV.m[x] != null) return WV.m[x];
  let s = 0, n = 0; alive().forEach(c => { if (c !== x && c !== S.player) { s += rel(c, x); n++; } });
  return (WV.m[x] = n ? s / n : 0);
}
// a country most of the world dislikes, or one that attacked us / our allies in the last year
const hated = x => worldView(x) < -12 || (S.c[x] && S.c[x].gov === 'authoritarian' && worldView(x) < -5);
const provoked = x => S.p && S.p.griev[x] != null && S.day - S.p.griev[x] < 365;
const justified = x => hated(x) || provoked(x);
function noteGrievance(att, victim) {
  if (!S.p || att === S.player) return;
  if (victim === S.player || isAlly(victim, S.player)) S.p.griev[att] = S.day;
}
/* ---- cooldowns (in game days) ---- */
const cdLeft = k => S.p && S.p.cd[k] ? Math.max(0, S.p.cd[k] - S.day) : 0;
const setCd = (k, days) => { S.p.cd[k] = S.day + days; };
/* ---- effects of actions: approval (העם), world reputation (העולם) and relations ---- */
function applyFx(e) {
  const c = P(), out = [];
  if (e.ap) { c.approval = clamp(c.approval + e.ap, 0, 100); out.push('העם ' + sgnT(e.ap)); }
  if (e.rep) { S.p.rep = clamp(S.p.rep + e.rep, 0, 100); out.push('העולם ' + sgnT(e.rep)); }
  if (e.rel) for (const id in e.rel) { if (!S.c[id] || id === S.player) continue; addRel(id, S.player, e.rel[id]); out.push(shortNm(id) + ' ' + sgnT(e.rel[id])); }
  if (e.relAll) out.push(e.relAll);
  needMapRecolor = true;
  return out;
}
// plain-text signed number, isolated left-to-right so "−12" never flips in Hebrew text
const sgnT = v => { const r = Math.round(v); return '\u2066' + (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r) + '\u2069'; };
const troopsPlain = k => { const v = k * 1000; return v >= 1e6 ? '\u2066' + (v / 1e6).toFixed(2) + '\u2069 מיליון' : v >= 1e4 ? '\u2066' + Math.round(v / 1000) + '\u2069 אלף' : '\u2066' + Math.round(v).toLocaleString('en-US') + '\u2069'; };
const SHORT = { '840': 'ארה״ב', '826': 'בריטניה', '643': 'רוסיה' };
const shortNm = id => SHORT[id] || nm(id);
// effect preview shown on buttons before acting
function fxLine(e) {
  const p = [];
  if (e.cost) p.push(money(e.cost));
  if (e.ap) p.push('העם ' + sgn(e.ap));
  if (e.rep) p.push('העולם ' + sgn(e.rep));
  if (e.rel) for (const id in e.rel) p.push(esc(shortNm(id)) + ' ' + sgn(e.rel[id]));
  if (e.note) p.push(e.note);
  return p.join(' · ');
}
// floating toast with the effects of an action
function fxToast(title, e, bad) {
  const parts = applyFx(e);
  toast((title ? title + (parts.length ? ': ' : '') : '') + parts.join(' · '), bad);
}

/* ================= distances ================= */
function adjacent(a, b) {
  const k = key(a, b); if (ADJ.has(k)) return ADJ.get(k);
  let r = false;
  outer: for (const t of tidsOf(a)) for (const n of TERR[t].nb) if (S.owner[n] === b) { r = true; break outer; }
  ADJ.set(k, r); return r;
}
function dist(a, b) {
  const k = key(a, b); if (DIST.has(k)) return DIST.get(k);
  let m = 1e9;
  for (const t of tidsOf(a)) for (const u of tidsOf(b)) {
    const d = d3.geoDistance(TERR[t].c, TERR[u].c) * 6371; if (d < m) m = d;
  }
  DIST.set(k, m); return m;
}
function proj(a, b) {
  if (adjacent(a, b)) return 1;
  const d = dist(a, b), pw = power(S.c[a]);
  const reach = pw / (pw + 1500);
  let p = reach * 1.5 * 1500 / (1500 + Math.max(0, d - 300));
  if (d < 700) p = Math.max(p, 0.7);
  return clamp(p, 0.04, 0.85);
}
// allies fight from the defended country's soil, so they need less reach
function allyProj(m, leader, enemy) { return m === leader ? proj(m, enemy) : Math.max(proj(m, enemy), 0.6 * proj(leader, enemy)); }
function neighborsOf(a) {
  const s = new Set();
  for (const t of tidsOf(a)) for (const n of TERR[t].nb) { const o = S.owner[n]; if (o && o !== a) s.add(o); }
  return [...s];
}

/* ================= news ================= */
function addNews(txt, k) { S.news.unshift({ t: S.day, txt, k: k || 'event' }); if (S.news.length > 200) S.news.length = 200; }

/* ================= casualties & statistics ================= */
// one side's losses: soldiers killed / wounded, civilians killed / wounded, equipment lost, missiles fired, money spent, economic damage
const EQ_K = ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'carriers', 'msl'];
const EQ_HE1 = { tanks: 'טנק', afv: 'נגמ״ש', art: 'תותח', air: 'מטוס קרב', heli: 'מסוק', ships: 'ספינה', subs: 'צוללת', carriers: 'נושאת מטוסים', msl: 'טיל' }, EQ_F1 = { ships: 1, subs: 1, carriers: 1 };
const EQ_HE = { tanks: 'טנקים', afv: 'נגמ״שים', art: 'תותחים', air: 'מטוסי קרב', heli: 'מסוקים', ships: 'ספינות', subs: 'צוללות', carriers: 'נושאות מטוסים', msl: 'טילים' };
const newCas = () => ({ sk: 0, sw: 0, ck: 0, cw: 0, eq: {}, mu: 0, sp: 0, dm: 0, pw: 0 });
function addCas(a, b) {
  if (!a || !b) return a;
  a.sk += b.sk || 0; a.sw += b.sw || 0; a.ck += b.ck || 0; a.cw += b.cw || 0; a.mu += b.mu || 0; a.sp += b.sp || 0; a.dm += b.dm || 0;
  if (b.pw) a.pw = (a.pw || 0) + b.pw;
  for (const k in b.eq || {}) a.eq[k] = (a.eq[k] || 0) + b.eq[k];
  return a;
}
const killed = x => x ? (x.sk || 0) + (x.ck || 0) : 0;
const SOLD_WR = 2.5; // wounded soldiers per soldier killed
// soldiers taken out of action (thousands) = killed + wounded
function troopCas(lostK, o) { const n = Math.max(0, lostK) * 1000, k = n / (1 + SOLD_WR); o.sk += k; o.sw += n - k; }
// people per km² (civilian casualties depend on how crowded the target is)
function density(id) { const c = S.c[id]; if (!c) return 50; let a = 0; tidsOf(id).forEach(t => { if (TERR[t]) a += TERR[t].km2; }); return c.pop * 1e6 / Math.max(500, a); }
const densF = id => clamp(Math.sqrt(density(id) / 100), 0.15, 4);
const invSnap = c => { const o = { gdp: c.gdp, pop: c.pop }; for (const k of INV_KEYS) o[k] = c.inv[k] || 0; return o; };
// what a country lost since a snapshot (the same numbers that came off its inventory)
function lossFrom(c, b) {
  const o = newCas();
  troopCas(b.troops - (c.inv.troops || 0), o);
  let val = 0;
  for (const k of EQ_K) { const d = b[k] - (c.inv[k] || 0); if (d > 1e-6) { o.eq[k] = d; val += d * unitPrice(k); } }
  o.dm = Math.max(0, b.gdp - c.gdp) + val;
  return o;
}
function civCas(o, n, wr) { n = Math.max(0, n); o.ck += n; o.cw += n * (wr || 3); }
function PS() {
  if (!S.ps) S.ps = { suf: newCas(), cau: newCas(), strikes: 0, struck: 0, done: [], log: [], sp: { def: 0, war: 0, buy: 0, strike: 0 } };
  return S.ps;
}
const WST = () => S.wst || (S.wst = newCas()); // everything lost in the world since the game started
function warSt(w) { return w.st || (w.st = { A: newCas(), B: newCas(), h: [], lg: [], wk: [0, 0] }); }
function warLog(w, txt) { const st = warSt(w); st.lg.unshift({ d: S.day, t: txt }); if (st.lg.length > 14) st.lg.length = 14; }
// add one day's (or one strike's) losses to a war, the world totals and the player's totals
function recordWar(w, lA, lB) {
  const st = warSt(w);
  addCas(st.A, lA); addCas(st.B, lB); addCas(WST(), lA); addCas(WST(), lB);
  st.wk[0] += killed(lA); st.wk[1] += killed(lB);
  if (S.player && inWar(w, S.player)) {
    const mine = w.A.includes(S.player);
    addCas(PS().cau, mine ? lB : lA);
  }
}
// sample the war for the charts (occupation and dead over time)
function warSample(w) {
  const st = warSt(w);
  st.h.push([S.day, Math.round(w.f), Math.round(killed(st.A)), Math.round(killed(st.B))]);
  if (st.h.length > 120) st.h = st.h.filter((x, i) => i % 2 === 0 || i === st.h.length - 1);
}
// a line in the battle log once a week while there is fighting
function weekLog(w) {
  const st = warSt(w), a = st.wk[0], b = st.wk[1]; st.wk = [0, 0];
  if (a + b < 1 || !S.player || !inWar(w, S.player)) return;
  const meA = w.A.includes(S.player), my = meA ? a : b, th = meA ? b : a;
  warLog(w, 'שבוע של קרבות: ' + nT(my) + ' הרוגים בצד שלנו, ' + nT(th) + ' בצד האויב');
}
// one day of fighting with its losses counted: inventory before and after, civilians where the fighting is
function countedBattle(w, fn) {
  const A = w.A.slice(), B = w.B.slice();
  const parts = A.concat(B).filter(m => S.c[m] && S.c[m].alive);
  const snaps = parts.map(m => invSnap(S.c[m]));
  const fA = w.f;
  POWQ = {};
  fn();
  const lA = newCas(), lB = newCas();
  let mine = null;
  parts.forEach((m, i) => {
    const l = lossFrom(S.c[m], snaps[i]);
    // soldiers who surrendered are prisoners, not dead or wounded
    const q = POWQ[m] || 0, out = l.sk + l.sw;
    if (q > 0 && out > 0) { const pw = Math.min(out, q * 1000), f = 1 - pw / out; l.sk *= f; l.sw *= f; l.pw = pw; }
    addCas(A.includes(m) ? lA : lB, l);
    if (m === S.player) mine = l;
  });
  // civilians are caught in the fighting on the land being fought over
  const sk = lA.sk + lB.sk; if (sk <= 0) return;
  const ru = w.ru && (w.a === S.player || w.b === S.player) ? w.ru : null;
  let onA = fA < 0 ? 1 : fA > 0 ? 0 : 0.5;
  if (ru) { const me = w.A.includes(S.player), inE = ru.aE > 0 || ((me ? w.f : -w.f) > 0), inP = ru.aP > 0 || ((me ? w.f : -w.f) < 0); const tE = inE ? 1 : 0, tP = inP ? 1 : 0; if (tE + tP) onA = (me ? tP : tE) / (tE + tP); }
  const civ = (side, share) => { if (share <= 0) return 0; const lead = side === 'A' ? w.a : w.b; const n = sk * 0.3 * share * densF(lead) * (0.6 + R() * 0.8); civCas(side === 'A' ? lA : lB, n, 3); return n; };
  const cA = civ('A', onA), cB = civ('B', 1 - onA);
  recordWar(w, lA, lB);
  battleFloat(w, killed(lA) + killed(lB));
  if (S.player && inWar(w, S.player)) {
    const meA = w.A.includes(S.player), myCiv = meA ? cA : cB, theirCiv = meA ? cB : cA, lead = w.a === S.player || w.b === S.player;
    if (mine) addCas(PS().suf, mine);
    POWQ = {};
    if (lead) {
      // our own civilians only count where the fighting is on our soil (allies' civilians are theirs)
      const civMe = (meA ? onA : 1 - onA) > 0 ? myCiv : 0;
      civCas(PS().suf, civMe, 3); S.p.civLost = (S.p.civLost || 0) + civMe;
      S.p.civKill = (S.p.civKill || 0) + theirCiv;
    }
    if (mine) { const mc = monthCas(); mc.sk += mine.sk; mc.ck += lead ? myCiv : 0; }
  }
}
const monthCas = () => S.p.mc || (S.p.mc = { sk: 0, ck: 0, ap: 0, rep: 0 });
// a strike (air, missiles, nuclear) with everything it did: kept for the result card, the stats screen and the war log
function strikeRecord(o) {
  const r = Object.assign({ d: S.day, cas: newCas(), own: newCas(), fx: [] }, o);
  const pl = S.player;
  if (r.by === pl) { PS().strikes++; addCas(PS().cau, r.cas); addCas(PS().suf, r.own); PS().sp.strike += r.own.sp || 0; }
  if (r.at === pl) { PS().struck++; addCas(PS().suf, r.cas); }
  addCas(WST(), r.cas); addCas(WST(), r.own);
  const w = S.wars.find(x => (x.A.includes(r.by) && x.B.includes(r.at)) || (x.B.includes(r.by) && x.A.includes(r.at)));
  if (w) {
    const st = warSt(w), byA = w.A.includes(r.by);
    addCas(byA ? st.B : st.A, r.cas); addCas(byA ? st.A : st.B, r.own);
    warLog(w, strikeLine(r));
  }
  if (r.by === pl || r.at === pl) { const L = PS().log; L.unshift(r); if (L.length > 25) L.length = 25; }
  return r;
}
const KIND_HE = { air: 'תקיפה אווירית', mis: 'מטח טילים', nuke: 'תקיפה גרעינית', fac: 'תקיפה על מתקני הגרעין' };
const nT = v => '⁦' + Math.round(v).toLocaleString('en-US') + '⁩';
function eqTxt(eq, max) {
  return EQ_K.filter(k => (eq[k] || 0) >= 0.5).sort((a, b) => eq[b] * unitPrice(b) - eq[a] * unitPrice(a)).slice(0, max || 9).map(k => Math.round(eq[k]) === 1 ? EQ_HE1[k] + (EQ_F1[k] ? ' אחת' : ' אחד') : nT(eq[k]) + ' ' + EQ_HE[k]).join(', ');
}
function strikeLine(r) {
  return (r.by === S.player ? '' : nm(r.by) + ': ') + KIND_HE[r.k] + (r.by === S.player ? ' שלנו' : '') + ' על ' + (r.cn ? r.cn + ' (' + nm(r.at) + ')' : nm(r.at)) + ' — ' + nT(killed(r.cas)) + ' הרוגים' + (eqTxt(r.cas.eq, 2) ? ', הושמדו ' + eqTxt(r.cas.eq, 2) : '');
}
// archive a war the player fought in, for the stats screen
function archiveWar(w, res) {
  if (!S.player || !inWar(w, S.player) || w._arch) return;
  w._arch = 1;
  const st = warSt(w), meA = w.A.includes(S.player);
  PS().done.push({ en: enemyLeaderFor(w, S.player), s: w.startDay, e: S.day, res, my: st[meA ? 'A' : 'B'], th: st[meA ? 'B' : 'A'] });
}

/* ================= wars ================= */
const inWar = (w, x) => w.A.includes(x) || w.B.includes(x);
function atWar(x, y) { return S.wars.some(w => (w.A.includes(x) && w.B.includes(y)) || (w.B.includes(x) && w.A.includes(y))); }
const warsOf = x => S.wars.filter(w => inWar(w, x));
const involvesPlayer = w => inWar(w, S.player);
const enemyLeaderFor = (w, x) => w.A.includes(x) ? w.b : w.a;
const mySideFront = (w, x) => w.A.includes(x) ? w.f : -w.f; // >0 => my side occupies the enemy leader
function commit(x, w) { const n = warsOf(x).length || 1; return ((w.a === x || w.b === x) ? 1 : 0.35) / n; }
function likelyJoiners(att, def) {
  return alive().filter(c => c !== att && c !== def && isAlly(c, def) && !isAlly(c, att) && !atWar(c, def));
}
function declareWar(att, def, opt) {
  opt = opt || {};
  if (!S.c[att] || !S.c[def] || atWar(att, def)) return null;
  const w = { id: S.wid++, a: att, b: def, A: [att], B: [def], f: 0, start: S.turn, startDay: S.day, pause: 0, stance: 'attack', last: 0, ms: 0 };
  S.wars.push(w);
  warSample(w);
  needMapRecolor = true;
  if (!opt.provoked) noteGrievance(att, def);
  if (def === S.player && S.p && !opt.silent) {
    // rally around the flag: an attacked nation unites behind its leader — but not when we struck first
    if (!opt.noRally) S.p.shock += 6;
    S.pending.push({ type: 'attacked', wid: w.id, from: att, noRally: !!opt.noRally });
  }
  const breakNap = hasPact(att, def, 'nap');
  ['nap', 'trade', 'alliance'].forEach(t => setPact(att, def, t, false));
  addRel(att, def, -200);
  if (!opt.silent && !opt.provoked) {
    // world reaction to aggression
    alive().forEach(c => {
      if (c === att || c === def) return;
      let d = -4; if (S.c[c].gov === 'democracy') d -= 6; if (isAlly(c, def)) d -= 30; if (breakNap) d -= 10;
      addRel(c, att, d);
    });
  }
  const joined = [];
  if (!opt.noJoin) {
    likelyJoiners(att, def).forEach(c => {
      const pr = hasPact(c, def, 'alliance') ? 0.85 : (S.c[c].blocs.includes('NATO') ? 0.95 : 0.7);
      if (c === S.player) { S.pending.push({ type: 'ally', wid: w.id, ally: def }); return; }
      if (R() < pr) { w.B.push(c); joined.push(c); addRel(c, att, -40); }
    });
    alive().forEach(c => {
      if (c === att || c === def || c === S.player || w.B.includes(c)) return;
      const pr = opt.joinAtt && isAlly(c, att) ? 0.8 : hasPact(c, att, 'alliance') && !isAlly(c, def) ? 0.3 : 0;
      if (pr && !isAlly(c, def) && R() < pr) { w.A.push(c); joined.push(c); }
    });
  }
  if (!opt.silent) {
    const pl = att === S.player || def === S.player;
    addNews((att === S.player ? 'הכרזת מלחמה על ' + nm(def) : nm(att) + ' הכריזה מלחמה על ' + nm(def)) +
      (joined.length ? '. הצטרפו ללחימה: ' + joined.slice(0, 6).map(nm).join(', ') + (joined.length > 6 ? ' ועוד ' + (joined.length - 6) : '') : '') + '.', pl ? 'war' : 'world');
  }
  return w;
}
function endWar(w, res) {
  if (S.player && inWar(w, S.player)) { const fp = mySideFront(w, S.player); archiveWar(w, res || (fp >= 40 ? 'won' : fp <= -40 ? 'lost' : 'peace')); }
  S.wars = S.wars.filter(x => x !== w);
  addRel(w.a, w.b, 60); // from -100 back to hostile
  S.pending = S.pending.filter(p => !p.wid || p.wid !== w.id || p.type === 'attacked');
  needMapRecolor = true;
  reconcileCities();
}
function aidFor(side, enemy, w) {
  let s = 0, n = 0;
  const list = alive().filter(c => !inWar(w, c) && rel(c, side) > 40 && rel(c, enemy) < -20).sort((x, y) => power(S.c[y]) - power(S.c[x]));
  for (const c of list) { s += power(S.c[c]) * 0.05; if (++n >= 15) break; }
  return s;
}
// one day of fighting (the old monthly model divided by ~30 days)
function battle(w) {
  if (w.pause > 0) {
    w.pause--;
    if (w.pause <= 0) {
      w.pause = 0;
      if (!involvesPlayer(w) || R() < 0.5) { addNews('הפסקת האש בין ' + nm(w.a) + ' ל' + nm(w.b) + ' הפכה להסכם שלום.', involvesPlayer(w) ? 'good' : 'world'); endWar(w); }
      else addNews('הפסקת האש עם ' + nm(enemyLeaderFor(w, S.player)) + ' קרסה — הלחימה התחדשה!', 'war');
    }
    return;
  }
  // the player's own wars are fought by the units on the map
  if (S.player && S.units && (w.a === S.player || w.b === S.player)) return unitBattle(w);
  const eff = (side, leader, enemy) => { let e = 0; for (const m of side) { const c = S.c[m]; if (c && c.alive) e += power(c) * commit(m, w) * allyProj(m, leader, enemy); } return e; };
  let eA = eff(w.A, w.a, w.b) + aidFor(w.a, w.b, w) * 0.5, eB = eff(w.B, w.b, w.a) + aidFor(w.b, w.a, w);
  let lmA = 1, lmB = 1;
  const pSide = w.A.includes(S.player) ? 'A' : w.B.includes(S.player) ? 'B' : null;
  if (pSide) {
    const home = mySideFront(w, S.player) <= 0;
    let m, l;
    if (w.stance === 'attack') { m = 1.2; l = 1.5; } else { m = home ? 1.15 : 0.85; l = 0.7; }
    if (pSide === 'A') { eA *= m; lmA = l; } else { eB *= m; lmB = l; }
  }
  eA *= 1 - Math.max(0, -w.f) / 200; eB *= 1 - Math.max(0, w.f) / 200;
  if (w.f > 0) eB *= 1.3 + w.f / 250; else if (w.f < 0) eA *= 1.3 - w.f / 250;
  const r = eA / (eA + eB + 1e-9);
  // how lopsided it is: a far stronger side breaks the weaker one and advances much faster
  const rho = Math.max(eA, eB) / Math.max(0.5, Math.min(eA, eB)); w.rho = rho; w.rr = r;
  // big countries take longer to occupy
  const occupied = r >= 0.5 ? S.c[w.b] : S.c[w.a];
  const size = clamp(Math.sqrt(15 / Math.max(0.5, occupied ? occupied.pop : 15)), 0.3, 0.75);
  let shift = ((r - 0.5) * 32 / DPM * pushMul(rho) + (R() - 0.5) * 0.55) * size * (pSide ? 1 : 0.6);
  // the deeper the occupation, the stronger the local resistance (insurgency, cities, supply lines)
  if (shift * w.f > 0) shift *= 1 - 0.5 * Math.abs(w.f) / 100;
  // invading across the sea (no shared border) is much slower than a land offensive
  if (!adjacent(w.a, w.b)) shift *= 0.55;
  const f0 = w.f;
  w.f = clamp(w.f + shift, -100, 100); w.last = shift; w.ms = (w.ms || 0) + shift;
  if (pSide && Math.sign(f0) !== Math.sign(w.f)) needMapRecolor = true;
  // the weaker side of a lopsided war loses its committed forces much faster, and many surrender
  const cm = 1 + 15 * routLoss(rho), su = surShare(rho);
  const lossA = 0.006 * (1 - r) * 2 * lmA / DPM * (r < 0.5 ? cm : 1), lossB = 0.006 * r * 2 * lmB / DPM * (r >= 0.5 ? cm : 1);
  const hurt = (side, loss, weak) => side.forEach(m => {
    const c = S.c[m]; if (!c || !c.alive) return;
    const k = Math.min(0.05, commit(m, w) * loss), dead = c.inv.troops * Math.min(0.5, k);
    hurtInv(c, k, ['troops', 'tanks', 'afv', 'art']);
    hurtInv(c, k * 0.5, ['air', 'heli']);
    hurtInv(c, k * 0.25, ['ships', 'subs', 'msl']);
    if (weak && su > 0) POWQ[m] = (POWQ[m] || 0) + dead * su;
    if (m === S.player) S.p.cas += dead * (weak ? 1 - su * 0.7 : 1);
  });
  hurt(w.A, lossA, r < 0.5); hurt(w.B, lossB, r >= 0.5);
  checkWarEnd(w);
}
// monthly front report for the player's wars
function frontNews(w) {
  const pSide = w.A.includes(S.player) ? 'A' : w.B.includes(S.player) ? 'B' : null;
  const s = w.ms || 0; w.ms = 0;
  if (!pSide || w.pause > 0) return;
  const me = mySideFront(w, S.player), en = enemyLeaderFor(w, S.player);
  const myShift = pSide === 'A' ? s : -s;
  if (Math.abs(myShift) >= 1) addNews('חזית ' + nm(en) + ': ' + (myShift > 0 ? 'כוחותינו התקדמו' : 'האויב התקדם') + ' (' + (me >= 0 ? 'אנחנו מחזיקים ' + Math.round(me) + '% משטחם' : 'האויב מחזיק ' + Math.round(-me) + '% משטחנו') + ').', myShift > 0 ? 'good' : 'bad');
  if (myShift > 5) S.p.shock += 0.6;
}
// a heads-up when one of our wars is almost won or close to being lost (once each way)
function warAlerts() {
  if (!S.player) return;
  warsOf(S.player).forEach(w => {
    if (w.pause > 0 || !(w.a === S.player || w.b === S.player)) return;
    const fp = mySideFront(w, S.player), en = enemyLeaderFor(w, S.player), cap = S.ct ? capOf(S.player) : null, cs = cap ? cst(cap) : null;
    const al = w.al || (w.al = {});
    if (fp >= 75 && !al.win) { al.win = 1; const t = 'כמעט ניצחנו: אנחנו מחזיקים ' + Math.round(fp) + '% מ' + nm(en) + '. עוד מעט היא תיפול — או שתציע שלום בתנאים טובים.'; toast(t); addNews(t, 'good'); warLog(w, 'כמעט ניצחון'); }
    if ((fp <= -55 || (cs && ((cs.s > 0 && cs.b === en) || cs.o === en))) && !al.lose) { al.lose = 1; const t = 'סכנה! ' + (fp <= -55 ? nm(en) + ' מחזיקה ' + Math.round(-fp) + '% משטחנו' : 'הבירה שלנו בסכנה') + ' — כדאי להחזיר כוחות הביתה, לגייס מילואים או להציע הפסקת אש.'; toast(t, true); addNews(t, 'bad'); warLog(w, 'המלחמה הולכת רע'); }
    if (fp < 50 && al.win) al.win = 0; if (fp > -35 && al.lose && !(cs && (cs.s > 0 || cs.o !== S.player))) al.lose = 0;
  });
}
function checkWarEnd(w) {
  if (!S.wars.includes(w)) return;
  if (w.f >= 100) annex(w.a, w.b);
  else if (w.f <= -100) annex(w.b, w.a);
}
function annex(win, lose) {
  const W = S.c[win], L = S.c[lose];
  if (!W || !L || !L.alive) return;
  L.tids0 = tidsOf(lose).slice(); L.annexDay = S.day;
  tidsOf(lose).slice().forEach(t => S.owner[t] = win);
  L.alive = false; L.annexedBy = win;
  // land the loser had received in earlier treaties goes with it
  if (S.cl) { for (const id in S.cl) if (S.cl[id] === lose) S.cl[id] = win; clNorm(); }
  S.wars.forEach(w => { if ((w.a === lose || w.b === lose) && S.player && inWar(w, S.player)) archiveWar(w, inWar(w, win) && (w.A.includes(win) === w.A.includes(S.player)) ? 'won' : 'lost'); });
  W.pop += L.pop * 0.85; W.gdp += L.gdp * 0.5; W.nukes += Math.floor(L.nukes * 0.5); W.inv.troops += L.inv.troops * 0.05;
  S.wars.filter(w => w.a === lose || w.b === lose).forEach(w => S.wars = S.wars.filter(x => x !== w));
  S.wars.forEach(w => { w.A = w.A.filter(x => x !== lose); w.B = w.B.filter(x => x !== lose); });
  for (const k in S.pacts) if (k.split('|').includes(lose)) delete S.pacts[k];
  for (const k in S.sanc) if (k.split('>').includes(lose)) delete S.sanc[k];
  S.pending = S.pending.filter(p => !p.wid || S.wars.some(w => w.id === p.wid));
  rebuildOwn();
  // every city the loser held (on its own land or captured elsewhere) goes to the winner or back to its land's owner
  if (S.ct) { CITY.forEach(x => { const st = cst(x); if (st.o === lose) { st.o = landOf(x) === win ? win : (landOf(x) || null); delete st.s; delete st.b; delete st.lg; } }); reconcileCities(); }
  alive().forEach(c => { if (c !== win) addRel(c, win, S.c[c].gov === 'democracy' ? -15 : -8); });
  if (lose === S.player) {
    gameOver('annexed', nm(win) + ' כבשה את ' + L.he + ' כולה וסיפחה אותה. המדינה שלך כבר לא קיימת.');
  } else if (win === S.player) {
    S.p.annexed.push(lose); S.p.shock += 5; S.p.unrest += 5;
    S.p.rep = clamp(S.p.rep - (justified(lose) ? 4 : 10), 0, 100);
    setTimeout(() => toast('סיפוח ' + L.he + ': העם +5 · העולם ' + sgnT(-(justified(lose) ? 4 : 10))), 0);
    addNews('ניצחון! ' + L.he + ' נכבשה וסופחה ל' + W.he + '. ההמונים חוגגים, אבל השליטה בשטח הכבוש תהיה יקרה.', 'good');
  } else {
    addNews(nm(win) + ' השלימה את כיבוש ' + L.he + ' וסיפחה אותה. העולם בהלם.', 'world');
  }
  needMapRecolor = true;
}
// which of the loser's cities go to the winner: first those the winner holds, then the nearest to the winner,
// the capital only for a very large share — until their population is about the share agreed
function pickCede(win, lose, share) {
  if (!S.ct || !CITY.length) return [];
  const list = citiesOfT(lose); if (!list.length) return [];
  const tot = list.reduce((a, x) => a + x.pop, 0), want = clamp(share, 0.02, 0.5) * tot, out = []; let got = 0;
  const held = list.filter(x => cst(x).o === win).map(x => [x, distToC(win, cityPt(x))]).sort((a, b) => a[1] - b[1]).map(r => r[0]);
  const add = x => { out.push(x); got += x.pop; };
  for (const x of held) { if (got >= want * 0.9) break; if (out.length && got + x.pop > want + tot * 0.08) continue; add(x); }
  const capOk = x => !(x.cap && x.c === lose) || share >= 0.5;
  const rest = list.filter(x => !out.includes(x) && capOk(x)).map(x => ({ x, d: distToC(win, cityPt(x)) }));
  while (got < want * 0.9 && rest.length) {
    // nearest to the winner's land or to a city already handed over (so the new land is one piece)
    let bi = -1, bd = 1e18;
    rest.forEach((r, i) => { let d = r.d; for (const y of out) { const k = km(cityPt(r.x), cityPt(y)); if (k < d) d = k; } r.e = d; if (d < bd) { bd = d; bi = i; } });
    const r = rest.splice(bi, 1)[0];
    if (out.length && got + r.x.pop > want + tot * 0.08) continue;
    add(r.x);
  }
  return out;
}
// the real share of the loser's people that those cities are (what the dialogs show and the deal moves)
const cedeShare = (lose, l, dflt) => { const tot = citiesOfT(lose).reduce((a, x) => a + x.pop, 0); return l.length && tot > 0 ? clamp(l.reduce((a, x) => a + x.pop, 0) / tot, 0.02, 0.5) : dflt; };
const cedeNames = l => { const n = l.slice().sort((a, b) => b.pop - a.pop).map(cityName); return n.slice(0, 6).join(', ') + (n.length > 6 ? ' ועוד ' + (n.length - 6) : ''); };
// the winner gets the land for good: those cities (and the land around them on the map) are now part of its country
function cede(win, lose, share, cities) {
  const W = S.c[win], L = S.c[lose];
  const l = cities || pickCede(win, lose, share);
  if (l.length) {
    const tot = citiesOfT(lose).reduce((a, x) => a + x.pop, 0);
    share = tot > 0 ? l.reduce((a, x) => a + x.pop, 0) / tot : share;
    if (!S.cl || typeof S.cl !== 'object') S.cl = {};
    l.forEach(x => { const st = cst(x); delete st.lg; delete st.s; delete st.b; st.o = win; if (S.owner[x.tid] === win) delete S.cl[x.id]; else S.cl[x.id] = win; });
    CBY = null; CLT = null; citiesDirty = true; needMapRecolor = true;
    if (S.units) S.units.forEach(u => { if (u.tid && u.at === lose) u.at = ptOwner(u.tid, u.lon, u.lat); });
  }
  share = clamp(share, 0.02, 0.5);
  W.pop += L.pop * share; W.gdp += L.gdp * share * 0.6;
  L.pop *= 1 - share; L.gdp *= 1 - share; hurtInv(L, share * 0.5, ['troops']); hurtInv(L, share * 0.3, ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'msl']);
  if (win === S.player) { S.p.shock += 3; S.p.unrest += 2; }
  if (lose === S.player) S.p.shock -= 8;
  return l;
}

/* ================= economy (daily) ================= */
const DPY = 365.25;
const activeWars = id => warsOf(id).filter(w => w.pause === 0).length;
// yearly cost of one thousand soldiers (bn USD), from what the country really spends per soldier
const soldierCost = c => clamp(0.3 * c.def0 * 1e9 / Math.max(1, c.inv0.troops * 1000), 1500, 150000) * 1000 / 1e9;
const unitPrice = k => BUY[k].cost / BUY[k].n;
// yearly upkeep of everything bought or called up beyond the original army
function extraUpkeep(c) {
  let s = 0; const b = c.bought || {};
  for (const k in b) if (b[k] > 0) s += k === 'troops' ? b[k] * soldierCost(c) : b[k] * unitPrice(k) * (UPKEEP_RATE[k] || 0.07);
  s += (c.mob || 0) * soldierCost(c) * 0.8;
  return s;
}
function budgetDay() {
  const c = P(), p = S.p;
  c.def = c.gdp * p.defPct;
  const d = c.gdp / DPY;
  const b = { income: d * p.tax, welfare: d * p.welfare, admin: d * 0.11, defense: c.def / DPY, war: 0, interest: 0, upkeep: extraUpkeep(c) / DPY, nuke: 0, gov: govSal() / DPY };
  warsOf(S.player).forEach(w => { if (w.pause > 0) return; const en = enemyLeaderFor(w, S.player); b.war += 0.002 * power(c) * commit(S.player, w) / Math.sqrt(proj(S.player, en)) / DPM; });
  if (p.treasury < 0) b.interest = -p.treasury * (p.bankrupt ? 0.009 : 0.0035) / DPM;
  if (p.nprog && !p.nprog.done) b.nuke = nukeCost(c) / DPM;
  b.net = b.income - b.welfare - b.admin - b.defense - b.war - b.interest - b.upkeep - b.nuke - b.gov;
  return b;
}
function casMonthToast() {
  const mc = S.p.mc; S.p.mc = null; if (!mc) return;
  if (mc.sk >= 1 || mc.ck >= 1) {
    const t = 'אבדות החודש: ' + nT(mc.sk) + ' חיילים' + (mc.ck >= 1 ? ' ו-' + nT(mc.ck) + ' אזרחים' : '') + ' שלנו נהרגו' + (mc.ap >= 0.5 ? ' · העם ' + sgnT(-mc.ap) : '');
    toast(t, true); addNews(t + '.', 'bad');
  }
  if (mc.rep >= 0.5) { const t = 'אזרחים שנהרגו מהאש שלנו: העולם ' + sgnT(-mc.rep); toast(t, true); }
}
function playerEconomy() {
  const c = P(), p = S.p;
  const b = budgetDay();
  p.treasury += b.net; p.lastDay = b;
  const sp = PS().sp; sp.def += b.defense + b.upkeep + b.nuke; sp.war += b.war;
  warsOf(S.player).forEach(w => { if (w.pause > 0) return; const en = enemyLeaderFor(w, S.player); warSt(w)[w.A.includes(S.player) ? 'A' : 'B'].sp += 0.002 * power(c) * commit(S.player, w) / Math.sqrt(proj(S.player, en)) / DPM; });
  const bm = p.bm || (p.bm = {});
  for (const k in b) bm[k] = (bm[k] || 0) + b[k];
  // growth (yearly rate applied daily)
  const wars = activeWars(S.player);
  let g = 0.026 + (R() - 0.5) * 0.012 - (p.tax - 0.30) * 0.08 + (p.welfare - 0.15) * 0.03 - sanctionHit(S.player) * 0.05 - wars * 0.012 - (S.recession > 0 ? 0.03 : 0) + (p.growthBonus || 0) + sectorG();
  let tr = 0; for (const k in S.pacts) if (S.pacts[k].trade && k.split('|').includes(S.player)) tr++;
  g += Math.min(0.02, tr * 0.004);
  // events that change growth for a while, and a skilled finance minister
  g += tmSum(p.tg);
  const fm = minOf('fin'); if (fm) g += (mSk(fm) - 3) * 0.0015;
  if (c.mob > 0) g -= c.mob / Math.max(1, c.pop * 500) * 1.5; // reservists are away from their jobs
  const debtRatio = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  if (debtRatio > 0.6) g -= (debtRatio - 0.6) * 0.05;
  if (p.bankrupt) g -= 0.03;
  g -= dmgDrag(S.player); // bombed cities slow the economy until they are rebuilt
  c.gdp *= 1 + g / DPY;
  c.pop *= 1 + 0.008 / DPY;
  equipStep(c);
  if (!p.bankrupt && debtRatio > 1.0) { p.bankrupt = true; p.shock -= 10; addNews('פשיטת רגל! ' + c.he + ' לא עומדת בתשלומי החוב. הריבית מזנקת והעם זועם.', 'bad'); }
  else if (p.bankrupt && debtRatio < 0.8) { p.bankrupt = false; addNews('המשבר הפיננסי מאחורינו — דירוג האשראי שוקם.', 'good'); }
}
// losses are slowly replaced (≈3% of the gap a month); a smaller budget slowly shrinks the army
function equipStep(c) {
  const atw = warsOf(c.id).some(w => w.pause === 0);
  const up = atw ? 0.0011 : 0.0008;
  for (const k of INV_KEYS) {
    const t = invTarget(c, k), v = c.inv[k] || 0;
    if (v < t) c.inv[k] = v + (t - v) * up;
    else if (v > t * 1.02) c.inv[k] = v - (v - t) * 0.0006;
  }
}
function aiEconomy() {
  const rec = S.recession > 0 ? 0.03 : 0;
  alive().forEach(id => {
    if (id === S.player) return;
    const c = S.c[id];
    const wars = activeWars(id);
    // poorer countries grow faster; recessions, booms and national projects move it up or down
    const pc = c.gdp / Math.max(0.01, c.pop), base = 0.017 + 0.022 * clamp(1 - pc / 60, 0, 1);
    const cy = c.cy ? (c.cy.k === 'rec' ? -0.035 : 0.02) : 0;
    const g = base + (R() - 0.5) * 0.02 - sanctionHit(id) * 0.05 - wars * 0.015 - rec + cy + (c.gb || 0) - dmgDrag(id);
    c.gdp *= 1 + g / DPY; c.pop *= 1 + 0.008 / DPY;
    c.def = c.gdp * c.defPct * (wars ? 1.5 : 1);
    equipStep(c);
    c.approval = clamp(c.approval + (50 - c.approval) * 0.001 + (R() - 0.5) * 0.73 - wars * 0.01, 5, 95);
  });
}

/* ================= approval & reputation ================= */
function warWeariness() {
  let s = 0;
  warsOf(S.player).forEach(w => { if (w.pause > 0) return; s += 3.5 + Math.min(6, Math.max(0, S.turn - w.start) * 0.15); });
  return s;
}
function approvalTarget() {
  const c = P(), p = S.p;
  const wars = activeWars(S.player);
  let T = 62 - (p.tax - 0.30) * 120 + (p.welfare - 0.15) * 150 - warWeariness() + (p.apBonus || 0) + govAp() + tmSum(p.tm) + factionAp();
  if (!wars) T -= Math.max(0, p.defPct - 0.05) * 100 * 1.2;
  if (c.mob > 0) T -= Math.min(8, c.mob / Math.max(1, c.pop * 10) * 4);
  const debtRatio = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  if (debtRatio > 0.6) T -= (debtRatio - 0.6) * 30;
  if (p.bankrupt) T -= 15;
  T -= sanctionHit(S.player) * 40;
  T -= p.unrest;
  const h = p.gdpHist; if (h.length >= 13 && h[h.length - 1] / h[0] > 1.02) T += 3;
  const sens = c.gov === 'authoritarian' ? 0.7 : c.gov === 'hybrid' ? 0.85 : 1;
  return clamp(50 + (T - 50) * sens, 0, 100);
}
function approvalStep() {
  const c = P(), p = S.p;
  const casK = p.cas; p.casTotal += casK; p.cas = 0;
  const mc = monthCas();
  if (casK > 0) { const d = Math.min(0.4, 25 * casK / Math.max(0.5, c.pop)); p.shock -= d; mc.ap += d; }
  // our civilians killed hurt even more than soldiers; civilians we kill hurt our standing in the world
  if (p.civLost > 0) { const d = Math.min(0.6, 60 * p.civLost / 1000 / Math.max(0.5, c.pop)); p.shock -= d; mc.ap += d; p.civLost = 0; }
  if (p.civKill > 0) { const d = Math.min(0.3, p.civKill / 4000); p.rep = clamp(p.rep - d, 0, 100); mc.rep += d; p.civKill = 0; }
  const T = approvalTarget();
  c.approval = clamp(c.approval + (T - c.approval) * 0.12 / DPM + p.shock, 0, 100);
  p.shock = 0; p.unrest = Math.max(0, p.unrest - 0.01);
  if (p.crack > 0) p.crack--;
  // world reputation slowly returns to the country's usual standing; aggressive wars keep it down
  let base = 50 + (p.rep0 - 50) * 0.6;
  S.wars.forEach(w => { if (w.a === S.player && w.pause === 0 && !w.just) base -= 8; });
  p.rep = clamp(p.rep + (clamp(base, 5, 95) - p.rep) * 0.0015, 0, 100);
}
// once a month: protests, revolution, coups and elections
function approvalMonthly() {
  const c = P(), p = S.p;
  const thr = { democracy: 15, hybrid: 12, authoritarian: 10 }[c.gov], need = c.gov === 'authoritarian' ? 4 : 3;
  const protestAt = c.gov === 'authoritarian' ? 25 : 30;
  if (c.approval < protestAt) {
    if (p.crack > 0) addNews('המשטרה מפזרת את ההפגנות בכוח. השקט ברחובות מתוח.', 'bad');
    else {
      c.gdp *= 0.997;
      p.unrest += 1; // months of protests build up anger: ignoring the street eventually topples any regime
      addNews(pick(['מאות אלפים מפגינים ברחובות נגד הממשלה.', 'שביתה כללית משביתה את המשק — העם דורש שינוי.', 'הפגנות סוערות מול משרדי הממשלה; המשטרה בכוננות.']), 'bad');
    }
  }
  if (c.approval < thr) {
    p.lowTurns++;
    if (p.lowTurns === 1) { addNews('אזהרה: המדינה על סף מהפכה. אם תמיכת העם לא תעלה — הממשלה תיפול.', 'bad'); S.pending.push({ type: 'revwarn' }); }
    if (p.lowTurns >= need) return gameOver('revolution', 'תמיכת העם קרסה ל-' + Math.round(c.approval) + '%. ' + (c.gov === 'democracy' ? 'הממשלה נפלה, והבחירות הוקדמו — אתה בחוץ.' : 'מהפכה עממית הפילה את השלטון.'));
  } else p.lowTurns = 0;
  if (c.gov !== 'democracy' && c.approval < 25 && p.defPct < p.defPct0 * 0.6 && R() < 0.06)
    return gameOver('coup', 'הצבא, שתקציבו קוצץ והעם שנגדך, ביצע הפיכה צבאית.');
  if (c.gov === 'democracy' && S.turn % 48 === 33) {
    if (c.approval >= 45) { p.shock += 4; addNews('ניצחת בבחירות! העם נתן לך מנדט חדש.', 'good'); }
    else { p.shock -= 4; addNews('הבחירות הסתיימו בתיקו מתיש. הקואליציה שלך שברירית.', 'bad'); }
  }
}

/* ================= AI ================= */
function aiDiplomacy() {
  // relations drift
  for (const k in S.rd) {
    const [a, b] = k.split('|');
    if (atWar(a, b)) continue;
    S.rd[k] *= 0.985; if (Math.abs(S.rd[k]) < 0.5) delete S.rd[k];
  }
  const ids = alive();
  // reactions toward the player — a bad world reputation means more sanctions, a good one opens doors
  const rp = S.p.rep, sancMul = rp < 20 ? 3 : rp < 35 ? 2 : rp > 70 ? 0.4 : 1;
  const sancAt = rp < 25 ? -40 : -55;
  ids.forEach(c => {
    if (c === S.player) return;
    const r = rel(c, S.player), C = S.c[c];
    if (!atWar(c, S.player) && !isAlly(c, S.player)) addRel(c, S.player, (rp - 50) / 50 * (C.gov === 'democracy' ? 0.3 : 0.15));
    const sKey = c + '>' + S.player;
    if (!S.sanc[sKey] && r < sancAt && C.gov !== 'authoritarian' && C.gdp > 50 && R() < 0.08 * sancMul && !atWar(c, S.player)) {
      S.sanc[sKey] = 1; S.p.shock -= 0.5;
      addNews(C.he + ' הטילה סנקציות כלכליות על ' + P().he + (rp < 35 ? ' — המוניטין שלנו בעולם בשפל.' : '.'), 'bad');
    } else if (S.sanc[sKey] && r > (rp > 60 ? -35 : -20) && R() < 0.15) {
      delete S.sanc[sKey]; addNews(C.he + ' הסירה את הסנקציות נגדנו.', 'good');
    }
  });
  // a few world diplomacy events
  for (let i = 0; i < 3; i++) {
    const a = pick(ids), nbs = neighborsOf(a); if (!nbs.length || a === S.player) continue;
    const b = pick(nbs); if (b === S.player || !S.c[b] || !S.c[b].alive) continue;
    const r = rel(a, b), roll = R();
    if (roll < 0.04 && r > 35 && !hasPact(a, b, 'trade')) { setPact(a, b, 'trade', true); addRel(a, b, 8); addNews(nm(a) + ' ו' + nm(b) + ' חתמו על הסכם סחר.', 'world'); }
    else if (roll < 0.06 && r < -40 && !atWar(a, b)) { addRel(a, b, -8); addNews('מתיחות בגבול ' + nm(a) + '–' + nm(b) + ': חילופי האשמות ותרגילים צבאיים.', 'world'); }
    else if (roll < 0.08 && r > 0 && r < 60) { addRel(a, b, 6); addNews('פסגה מדינית: ראשי ' + nm(a) + ' ו' + nm(b) + ' נפגשו לשיחות.', 'world'); }
    else addRel(a, b, (R() - 0.5) * 6);
  }
  worldDiplomacy(ids);
}
function aiWars() {
  const ids = alive();
  const aiWarsN = S.wars.filter(w => !involvesPlayer(w)).length;
  for (let i = 0; i < 14; i++) {
    const a = pick(ids); if (a === S.player) continue;
    const A = S.c[a]; if (warsOf(a).length) continue;
    for (const b of neighborsOf(a)) {
      const B = S.c[b]; if (!B || !B.alive) continue;
      if (rel(a, b) > -45 || isAlly(a, b) || hasPact(a, b, 'nap')) continue;
      let def = power(B) * 1.3;
      ids.forEach(c => { if (c !== a && c !== b && isAlly(c, b) && !isAlly(c, a)) def += power(S.c[c]) * 0.35 * allyProj(c, b, a); });
      const ratio = power(A) * proj(a, b) / (def + 1);
      const isP = b === S.player;
      const g = A.gov === 'authoritarian' ? 1.5 : A.gov === 'hybrid' ? 1 : 0.3;
      // a hated player (low world reputation) is a target: others feel free to attack
      const repK = isP ? (S.p.rep < 20 ? 2.5 : S.p.rep < 35 ? 1.6 : 1) : 1;
      let pr = isP ? (ratio > 1.6 / Math.sqrt(repK) && rel(a, b) < -70 / Math.sqrt(repK) ? 0.04 * g * repK : 0) : (ratio > 2 && aiWarsN < 6 ? 0.045 * g : 0);
      if (!isP && pr) {
        // nuclear powers almost never fight each other; nobody without the bomb attacks one that has it
        if (B.nukes > 0 && !A.nukes) continue;
        if (B.nukes > 0 && A.nukes > 0) pr *= 0.05;
        // a calm world: not more than a few new wars a year
        const y = Math.floor(S.day / 365.25); if (!S.wy || S.wy.y !== y) S.wy = { y, n: 0 };
        if (S.wy.n >= 2) pr *= 0.2;
      }
      if (R() < pr) { const w = declareWar(a, b); if (w && !isP && S.wy) S.wy.n++; return; }
    }
  }
  // AI wars ending
  S.wars.slice().forEach(w => {
    if (involvesPlayer(w) || !S.wars.includes(w) || w.pause > 0) return;
    const age = S.turn - w.start, f = w.f, lop = (w.rho || 1) >= 6 && ((w.rr || 0.5) >= 0.5) === (f > 0);
    // a side that is being crushed gives up sooner
    if (Math.abs(f) >= (lop ? 30 : 50) && R() < (lop ? 0.35 : 0.12)) {
      const win = f > 0 ? w.a : w.b, lose = f > 0 ? w.b : w.a;
      const cl = cede(win, lose, Math.abs(f) / 200);
      addNews(nm(lose) + ' נכנעה ל' + nm(win) + ' וויתרה על חלק משטחה בהסכם שלום' + (cl.length ? ': ' + cedeNames(cl) + ' עברו ל' + nm(win) : '') + '.', 'world'); endWar(w);
    } else if (age > 18 && Math.abs(f) < 30 && R() < 0.012) {
      w.pause = 183; addNews('הפסקת אש בין ' + nm(w.a) + ' ל' + nm(w.b) + ' בתיווך בינלאומי.', 'world');
    } else if (age > 30 && Math.abs(f) < 50 && R() < 0.03) {
      addNews('אחרי ' + Math.round(age / 12) + ' שנות לחימה: ' + nm(w.a) + ' ו' + nm(w.b) + ' חתמו על הסכם שלום.', 'world'); endWar(w);
    }
  });
  // AI offers to the player
  warsOf(S.player).forEach(w => {
    if (w.pause > 0 || S.pending.some(p => p.wid === w.id)) return;
    const lead = w.a === S.player || w.b === S.player; if (!lead) return;
    const en = enemyLeaderFor(w, S.player), fp = mySideFront(w, S.player), age = S.turn - w.start;
    const capT = S.ct && capHeldBy(en, S.player);
    if ((fp > 40 || (capT && fp > 20)) && R() < (capT ? 0.5 : 0.25)) S.pending.push({ type: 'peace', wid: w.id, from: en, kind: fp > 70 ? 'terr' : 'repar', share: fp / 200 });
    else if (fp < -35 && R() < 0.2) S.pending.push({ type: 'demand', wid: w.id, from: en, share: -fp / 200 });
    else if (age > 12 && Math.abs(fp) < 15 && R() < 0.08) S.pending.push({ type: 'peace', wid: w.id, from: en, kind: 'white' });
  });
  // AI nuclear desperation
  S.wars.slice().forEach(w => {
    [[w.b, w.a, w.f], [w.a, w.b, -w.f]].forEach(([victim, att, occ]) => {
      const V = S.c[victim]; if (!V || !V.alive || V.nukes <= 0 || occ < 85 || victim === S.player) return;
      if (!S.wars.includes(w) || R() > 0.3) return;
      V.nukes--; nukeImpact(victim, att, true);
      if (S.wars.includes(w)) { if (w.a === victim) w.f += 40; else w.f -= 40; w.f = clamp(w.f, -100, 100); }
    });
  });
}

/* ================= events ================= */
function randomEvents() {
  const ids = alive(), me = P();
  // (oil shocks, recessions, pandemics, scandals and good news at home now live in the event table)
  if (R() < 0.14) {
    const id = pick(ids.filter(x => x !== S.player)), c = S.c[id], hit = 0.01 + R() * 0.02;
    const kind = pick(['רעידת אדמה', 'שיטפונות קשים', 'סופת הוריקן', 'בצורת חמורה', 'שריפות ענק']);
    c.gdp *= 1 - hit; tag(c, 'disaster', 150);
    addNews(kind + ' ב' + c.he + ': נזק כבד ואלפי עקורים.', 'world');
    // the stricken country asks the world (and us) for help
    if (!atWar(id, S.player) && rel(id, S.player) > -60 && R() < 0.7) pushAid(id, kind, hit);
  }
  // refugees from a war zone knock on our door
  if (R() < 0.05) {
    const torn = S.wars.filter(w => w.pause === 0 && !involvesPlayer(w)).map(w => w.f >= 0 ? w.b : w.a).filter(x => S.c[x] && S.c[x].alive);
    if (torn.length) S.pending.push({ type: 'refugees', from: pick(torn) });
  }
  const unhappy = ids.filter(i => i !== S.player && S.c[i].approval < 20);
  if (unhappy.length && R() < 0.15) { const u = pick(unhappy); tag(S.c[u], 'protest', 45); addNews('מחאות המוניות ב' + nm(u) + ' נגד השלטון.', 'world'); }
}
function nukeProgram() {
  const p = S.p, c = P(), np = p.nprog; if (!np) return;
  if (!np.done) {
    np.m++;
    if (!np.disc && R() < 0.03) {
      np.disc = true;
      addNews('חשיפה: מודיעין זר חשף את תוכנית הגרעין הסודית של ' + c.he + '! העולם דורש לעצור.', 'bad');
      alive().forEach(id => { if (id === S.player) return; const C = S.c[id]; const d = C.gov === 'democracy' ? -30 : -12; addRel(id, S.player, d);
        if (C.gov === 'democracy' && (C.blocs.includes('NATO') || C.blocs.includes('EU')) && !isAlly(id, S.player)) S.sanc[id + '>' + S.player] = 1; });
    }
    if (np.disc && R() < 0.04) {
      const strikers = ['840', '376'].filter(s => S.c[s] && S.c[s].alive && s !== S.player && !isAlly(s, S.player));
      if (strikers.length) {
        const s = pick(strikers), b0 = invSnap(c); np.m = Math.max(0, np.m - 8); hurtInv(c, 0.03, ['air', 'msl']); hurtInv(c, 0.002, ['troops']); p.shock += 2; noteGrievance(s, S.player);
        const loss = lossFrom(c, b0); civCas(loss, Math.round(5 + R() * 40), 3);
        const r = strikeRecord({ k: 'fac', by: s, at: S.player, cas: loss, own: newCas(), war: atWar(s, S.player), used: 24 });
        addNews(nm(s) + ' תקפה מהאוויר את מתקני הגרעין שלנו! התוכנית נסוגה ב-8 חודשים.', 'bad');
        const lp = launchPt(s, 'air', S.player); fxStrike('air', lp, targetPt(S.player, lp), 24, r);
      }
    }
    if (np.m >= 36) {
      np.done = true; np.since = S.turn; c.nukes += 3;
      addNews(c.he + ' ביצעה ניסוי גרעיני תת-קרקעי. מעכשיו — מעצמה גרעינית.', 'war');
      alive().forEach(id => { if (id !== S.player) addRel(id, S.player, -20); });
    }
  } else if ((S.turn - np.since) % 6 === 5 && c.nukes < 60) c.nukes++;
}

/* ================= names (Hebrew transliteration, a small pool per region) ================= */
const NAMES = {
  he: { m: ['יוסי', 'אבי', 'דני', 'איתן', 'עמית', 'משה', 'רון', 'אורי'], f: ['מיכל', 'נועה', 'רונית', 'שרה', 'גלית', 'תמר', 'יעל', 'אורית'], l: ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'אברהם', 'פרידמן', 'שפירא', 'גולן', 'אזולאי', 'רוזן', 'דהן'] },
  ar: { m: ['מוחמד', 'אחמד', 'חאלד', 'עומר', 'יוסף', 'סמיר', 'כרים', 'האני'], f: ['פאטמה', 'לילה', 'נאדיה', 'ראניה', 'סלמה', 'מונא'], l: ['אל-חסן', 'חדאד', 'נסר', 'סאלח', 'אל-עלי', 'מנסור', 'חמדאן', 'עבדאללה', 'קאסם', 'אל-רשיד', 'ח׳ורי', 'זיידאן'] },
  fa: { m: ['עלי', 'רזא', 'מהדי', 'חוסיין', 'דאריוש', 'כאמראן'], f: ['פרשתה', 'נסרין', 'סארה', 'לאלה', 'מרים', 'שירין'], l: ['אחמדי', 'רזאיי', 'מוסוי', 'חוסייני', 'כרימי', 'תהראני', 'ג׳עפרי', 'נורי', 'סאדקי', 'פרהאדי'] },
  tr: { m: ['מהמט', 'אמרה', 'בוראק', 'מוראט', 'קאאן', 'אחמט'], f: ['אייסה', 'זיינפ', 'אליף', 'סלין', 'דניז', 'אמינה'], l: ['יילמז', 'קאיה', 'דמיר', 'שאהין', 'צ׳ליק', 'אוזטורק', 'אידין', 'ארסלאן', 'קוצ׳', 'דוגאן'] },
  zh: { lf: 1, m: ['וויי', 'מינג', 'האו', 'פנג', 'צ׳יאנג', 'ג׳ון'], f: ['ג׳ינג', 'שיאו-לין', 'יון', 'לי-נה', 'ג׳יה', 'מיי'], l: ['ליו', 'צ׳ן', 'ואנג', 'ג׳אנג', 'לי', 'יאנג', 'הואנג', 'ג׳או', 'וו', 'סון', 'גאו', 'לין'] },
  ja: { lf: 1, m: ['הירושי', 'קנג׳י', 'אקירה', 'טאקשי', 'ריו', 'נאוקי'], f: ['יוקו', 'מאיקו', 'הארוקה', 'אמי', 'סאקורה', 'נאומי'], l: ['סאטו', 'סוזוקי', 'טקהאשי', 'טנאקה', 'ואטאנבה', 'איטו', 'יאמאמוטו', 'נקאמורה', 'קובאיאשי', 'קאטו'] },
  ko: { lf: 1, m: ['מין-ג׳ון', 'ג׳י-הו', 'דונג-היון', 'סונג-מין', 'ג׳ה-וון', 'הייון-וו'], f: ['סו-יון', 'הא-און', 'יון-אה', 'ג׳י-מין', 'סו-ג׳ין', 'מין-סו'], l: ['קים', 'לי', 'פארק', 'צ׳וי', 'ג׳ונג', 'קאנג', 'צ׳ו', 'יון', 'האן', 'סונג'] },
  ru: { fem: 1, m: ['איוון', 'אלכסיי', 'דמיטרי', 'סרגיי', 'ניקולאי', 'פאבל', 'איגור', 'ויקטור'], f: ['אנה', 'אולגה', 'מרינה', 'טטיאנה', 'אירינה', 'נטליה'], l: ['איבנוב', 'פטרוב', 'סמירנוב', 'קוזנצוב', 'פופוב', 'סוקולוב', 'מורוזוב', 'וולקוב', 'נוביקוב', 'פדורוב', 'אורלוב', 'בונדרנקו', 'שבצ׳נקו'] },
  en: { m: ['ג׳יימס', 'מייקל', 'דייוויד', 'רוברט', 'תומס', 'דניאל', 'אנדרו', 'מארק'], f: ['שרה', 'אמילי', 'ג׳ניפר', 'קתרין', 'לורה', 'רייצ׳ל', 'הלן'], l: ['סמית׳', 'ג׳ונסון', 'בראון', 'טיילור', 'מילר', 'דייוויס', 'קלארק', 'ווקר', 'הול', 'אלן', 'רייט', 'מרפי'] },
  es: { m: ['חוזה', 'קרלוס', 'חואן', 'לואיס', 'מיגל', 'חורחה', 'דייגו'], f: ['מריה', 'אנה', 'לוסיה', 'קרמן', 'סופיה', 'איזבל'], l: ['גרסיה', 'רודריגס', 'מרטינס', 'לופס', 'גונסאלס', 'פרס', 'סאנצ׳ס', 'רמירס', 'טורס', 'פלורס', 'מוראלס', 'ורגס'] },
  pt: { m: ['ז׳ואאו', 'פדרו', 'לוקאס', 'רפאל', 'גבריאל', 'מרסלו'], f: ['אנה', 'ז׳וליאנה', 'מריאנה', 'פרננדה', 'קמילה', 'ביאטריס'], l: ['סילבה', 'סנטוס', 'אוליביירה', 'סוזה', 'פריירה', 'קוסטה', 'אלמיידה', 'קרבליו', 'גומש', 'ריביירו'] },
  fr: { m: ['פייר', 'ז׳אן', 'לוק', 'פרנסואה', 'אנטואן', 'ניקולא'], f: ['מארי', 'סופי', 'קמיל', 'איזבל', 'קלואה', 'נטלי'], l: ['מרטן', 'ברנאר', 'דובואה', 'תומא', 'רובר', 'פטי', 'דוראן', 'לפבר', 'מורו', 'לורן'] },
  de: { m: ['תומאס', 'מיכאל', 'שטפן', 'אנדראס', 'יורגן', 'קלאוס'], f: ['אנה', 'קטרינה', 'זבינה', 'מוניקה', 'יוליה', 'אורסולה'], l: ['מילר', 'שמידט', 'שניידר', 'פישר', 'ובר', 'מאייר', 'וגנר', 'בקר', 'שולץ', 'הופמן'] },
  it: { m: ['מרקו', 'ג׳וזפה', 'אלסנדרו', 'לוקה', 'פרנצ׳סקו', 'אנדראה'], f: ['ג׳וליה', 'פרנצ׳סקה', 'קיארה', 'אלנה', 'סרה', 'מרטינה'], l: ['רוסי', 'רוסו', 'פרארי', 'אספוזיטו', 'ביאנקי', 'רומאנו', 'קולומבו', 'ריצ׳י', 'מרינו', 'גרקו'] },
  eu: { m: ['יאן', 'פטר', 'מרטין', 'טומאש', 'אנדריי', 'לוקאש', 'ניקוס', 'לארס'], f: ['אנה', 'קטז׳ינה', 'מרתה', 'אווה', 'יאנה', 'מריה', 'אלני'], l: ['נובאק', 'קובאלסקי', 'הורבאט', 'קובאץ׳', 'ניימן', 'ויסניבסקי', 'פופסקו', 'יוהנסון', 'ניילסן', 'האנסן', 'לינדברג', 'פאפאדופולוס'] },
  in: { m: ['ראג׳', 'אמיט', 'ויג׳אי', 'ראהול', 'סנג׳אי', 'עימראן'], f: ['פרייה', 'אנג׳לי', 'סוניה', 'קאוויטה', 'מירה', 'עאישה'], l: ['שארמה', 'פאטל', 'סינג', 'גופטה', 'קומאר', 'ראו', 'ח׳אן', 'רדי', 'נאיר', 'ג׳ושי'] },
  af: { m: ['קוואמה', 'אמדו', 'ג׳ומו', 'סיפו', 'אובינה', 'מוסה'], f: ['אמינאטה', 'צ׳יפו', 'נומסה', 'אדג׳ואה', 'פאטו', 'זאינבו'], l: ['אוקונקוו', 'מנסה', 'דיאלו', 'קמארה', 'אוקפור', 'נדלובו', 'מוואנגי', 'טראורה', 'באנדה', 'אסאנטה'] },
  sea: { m: ['בודי', 'סומצ׳אי', 'רמון', 'האדי', 'תאן', 'ארי'], f: ['סרי', 'מריה', 'דוי', 'מאליה', 'רינה', 'לין'], l: ['סנטוסו', 'ויג׳איה', 'צ׳אי', 'רייס', 'נגוין', 'טראן', 'רחמן', 'ליים', 'בונג', 'קוסומה'] }
};
const RG_ID = { '376': 'he', '364': 'fa', '004': 'fa', '762': 'fa', '792': 'tr', '031': 'tr', '795': 'tr', '156': 'zh', '158': 'zh', '702': 'zh', '392': 'ja', '410': 'ko', '408': 'ko',
  '643': 'ru', '804': 'ru', '112': 'ru', '398': 'ru', '860': 'ru', '417': 'ru', '498': 'ru', '051': 'ru', '268': 'ru', '496': 'ru',
  '840': 'en', '826': 'en', '124': 'en', '036': 'en', '554': 'en', '372': 'en', '250': 'fr', '056': 'fr', '442': 'fr', '756': 'de', '276': 'de', '040': 'de', '380': 'it',
  '724': 'es', '620': 'pt', '076': 'pt', '024': 'pt', '508': 'pt', '356': 'in', '586': 'in', '050': 'in', '144': 'in', '524': 'in' };
function regionOf(id) {
  if (RG_ID[id]) return RG_ID[id];
  const c = S.c[id], b = c ? c.blocs : [];
  if (b.includes('ArabLeague') || b.includes('GCC')) return 'ar';
  if (b.includes('CSTO') || b.includes('CIS')) return 'ru';
  const t = mainTid(id), p = t && TERR[t] ? TERR[t].c : [0, 0];
  if (p[0] < -30) return 'es';
  if (p[1] < 20 && p[0] > -20 && p[0] < 55) return 'af';
  if (p[1] > 35 && p[0] > -25 && p[0] < 45) return 'eu';
  if (p[0] >= 90 && p[0] < 150 && p[1] < 25) return 'sea';
  if (p[0] >= 60 && p[0] < 92 && p[1] < 36) return 'in';
  if (p[0] > 150 || p[1] < -10) return 'en';
  return 'eu';
}
function genName(id, g) {
  const N = NAMES[regionOf(id)] || NAMES.en;
  g = g || (R() < 0.3 ? 'f' : 'm');
  const f = pick(N[g]); let l = pick(N.l);
  if (N.fem && g === 'f' && /(וב|ין)$/.test(l)) l += 'ה';
  return { n: N.lf ? l + ' ' + f : f + ' ' + l, g };
}

/* ================= government: ministers who act on their own ================= */
const MIN_R = {
  def: { he: 'שר הביטחון', hf: 'שרת הביטחון', sh: 'ביטחון', per: 2, off: 0, d: 'מנהל את הצבא: מגן על הגבולות, שולח כוחות לחזיתות, מחזיר יחידות פגועות ושומר כוח בבית. אף פעם לא מכריז מלחמה בעצמו.' },
  fin: { he: 'שר האוצר', hf: 'שרת האוצר', sh: 'אוצר', per: 15, off: 3, d: 'קובע את המס והרווחה כדי לשמור על הקופה, החוב ואהבת העם — לפי היעד שבחרת.' },
  int: { he: 'שר הבינוי והפנים', hf: 'שרת הבינוי והפנים', sh: 'בינוי', per: 10, off: 5, d: 'בונה פרויקטים לאומיים (בתי חולים, דיור, תשתיות) מכסף פנוי בקופה.' },
  fo: { he: 'שר החוץ', hf: 'שרת החוץ', sh: 'חוץ', per: 7, off: 1, d: 'חותם על הסכמי סחר, שולח סיוע באסונות, משפר יחסים כשהמוניטין נמוך ומציע שלום כשמלחמה הולכת רע.' }
};
const MIN_ORDER = ['def', 'fin', 'int', 'fo'];
const MIN_POL0 = { def: { st: 'bal', buy: 1, mob: 1 }, fin: { goal: 'bal' }, int: { pri: 'people' }, fo: { rep: 65, peace: 1 } };
const TRAITS = {
  careful: { he: 'זהיר', d: 'נמנע מסיכונים', ap: 0, sc: 0.5 },
  aggr: { he: 'תוקפני', d: 'מעדיף כוח ולחץ', ap: 0, sc: 1 },
  frugal: { he: 'חסכן', d: 'חוסך כסף, שכר נמוך', ap: -0.5, sc: 0.6, sal: 0.7 },
  popul: { he: 'פופוליסט', d: 'מרצה את העם, פחות אכפת לו מהקופה', ap: 2, sc: 1.2 },
  corrupt: { he: 'מושחת', d: 'גונב קצת מהקופה — סכנת שערורייה', ap: 0, sc: 4, steal: 1 },
  dipl: { he: 'דיפלומט', d: 'מצוין ביחסים עם העולם', ap: 0.5, sc: 0.6 },
  pro: { he: 'מקצוען', d: 'עובד היטב (מיומנות +1)', ap: 0.5, sc: 0.5, sk: 1, sal: 1.2 },
  char: { he: 'כריזמטי', d: 'העם אוהב אותו', ap: 1.5, sc: 1 }
};
const G = () => S.p.gov || (S.p.gov = newGov());
const newGov = () => ({ m: {}, log: [], ovr: {}, no: {}, pt: {}, tc: {}, cand: {} });
const minOf = r => (S && S.p && S.p.gov && S.p.gov.m[r]) || null;
const minOn = r => { const m = minOf(r); return m && m.auto ? m : null; };
const mSk = m => clamp(m.sk + (TRAITS[m.tr].sk || 0), 1, 6);
const mTitle = (r, m) => m && m.g === 'f' ? MIN_R[r].hf : MIN_R[r].he;
const govN = () => MIN_ORDER.filter(minOf).length;
function minSal(sk, tr) { return Math.max(0.002, P().gdp * 0.00008) * (0.6 + 0.25 * sk) * (TRAITS[tr].sal || 1); }
function mkCand(r) {
  const sk = clamp(1 + Math.floor(R() * 5), 1, 5), tr = pick(Object.keys(TRAITS)), n = genName(S.player);
  return { n: n.n, g: n.g, sk, tr, sal: minSal(sk, tr), auto: true, pol: Object.assign({}, MIN_POL0[r]), pop: clamp(Math.round(45 + (TRAITS[tr].ap || 0) * 6 + (R() - 0.5) * 20), 20, 80), d0: S.day };
}
// three people to choose from (kept for a while, so reopening the dialog shows the same faces)
function candsFor(r) {
  const g = G(), c = g.cand[r];
  if (c && c.d > S.day && c.l.length) return c.l;
  const l = [mkCand(r), mkCand(r), mkCand(r)];
  if (!l.some(x => x.sk >= 3)) l[0].sk = 3, l[0].sal = minSal(3, l[0].tr);
  // three different faces
  for (let i = 1; i < 3; i++) for (let t = 0; t < 8 && l.slice(0, i).some(x => x.n.split(' ')[0] === l[i].n.split(' ')[0] || x.n.split(' ').pop() === l[i].n.split(' ').pop()); t++) { const n = genName(S.player); l[i].n = n.n; l[i].g = n.g; }
  g.cand[r] = { d: S.day + 90, l }; return l;
}
const minAp = m => (TRAITS[m.tr].ap || 0) + (m.sk - 3) * 0.3 + (m.pop - 50) / 40;
function govAp() { const g = S.p && S.p.gov; if (!g) return 0; let s = 0; for (const r in g.m) if (g.m[r]) s += minAp(g.m[r]); return clamp(s, -6, 8); }
function govSal() { const g = S.p && S.p.gov; if (!g) return 0; let s = 0; for (const r in g.m) if (g.m[r]) s += g.m[r].sal; return s; }
const pctT = v => '⁦' + Math.round(v * 100) + '%⁩';
// a minister's report: kept in the log, and shown as a small toast (not more than one every ~1.6 s)
function logMin(r, txt, fx, bad, quiet) {
  const g = G(), m = g.m[r];
  g.log.unshift({ d: S.day, r, t: txt, fx: fx || '', bad: !!bad }); if (g.log.length > 40) g.log.length = 40;
  if (quiet) return;
  const now = performance.now();
  if (now - (logMin.t || 0) > 1600) { logMin.t = now; toast(mTitle(r, m) + ': ' + txt + (fx ? ' · ' + fx : ''), bad); }
}
function hireMin(r, cand) {
  const g = G(), old = g.m[r];
  g.m[r] = Object.assign({}, cand, { d0: S.day });
  if (old) g.m[r].pol = Object.assign({}, old.pol);
  delete g.cand[r];
  addNews(mTitle(r, g.m[r]) + ' חדש' + (g.m[r].g === 'f' ? 'ה' : '') + ' מונה' + (g.m[r].g === 'f' ? 'תה' : '') + ': ' + cand.n + ' (' + TRAITS[cand.tr].he + ').', 'good');
}
// fire (or lose) a minister; a corrupt one leaving is good news, a popular one leaving hurts
function fireMin(r, quiet, resigned) {
  const g = G(), m = g.m[r]; if (!m) return;
  g.m[r] = null;
  const e = { ap: m.tr === 'corrupt' ? 1 : m.pop > 62 ? -1 : 0 };
  if (!resigned) S.p.treasury -= m.sal * 0.5;
  if (!quiet) { fxToast((resigned ? 'התפטר' + (m.g === 'f' ? 'ה' : '') : 'פוטר' + (m.g === 'f' ? 'ה' : '')) + ': ' + m.n, e, e.ap < 0); addNews(mTitle(r, m) + ' ' + m.n + ' פוטר' + (m.g === 'f' ? 'ה' : '') + '.', 'event'); }
  else applyFx(e);
}
function govDay() {
  const g = S.p && S.p.gov; if (!g || S.over) return;
  for (const r of MIN_ORDER) {
    const m = g.m[r]; if (!m || !m.auto) continue;
    const D = MIN_R[r];
    if ((S.day + D.off) % D.per !== 0) continue;
    MIN_FN[r](m);
    if (S.over) return;
  }
}
// once a month: popularity drifts with the government's, corrupt ministers take their share
function govMonth() {
  const g = S.p && S.p.gov; if (!g) return;
  // the finance minister's budget envelopes for the coming month
  const e = setEnvelopes();
  if (minOn('fin')) logMin('fin', 'תקציב לחודש הבא: ביטחון ⁦' + moneyTxt(e.def) + '⁩ · בינוי ⁦' + moneyTxt(e.int) + '⁩ · חוץ ⁦' + moneyTxt(e.fo) + '⁩' + (e.why ? ' (' + e.why + ')' : ''), '', S.p.treasury < 0, true);
  for (const r of MIN_ORDER) {
    const m = g.m[r]; if (!m) continue;
    m.pop = clamp(m.pop + (R() - 0.5) * 6 + (P().approval - 50) * 0.03 + (TRAITS[m.tr].ap || 0) * 0.3, 5, 95);
    if (TRAITS[m.tr].steal) { const s = P().gdp * 0.00012 * (0.5 + R()); S.p.treasury -= s; m.st = (m.st || 0) + s; }
  }
}
/* ---- money discipline: the finance minister's monthly envelopes; nobody spends money we don't have ---- */
const ENV_R = ['def', 'int', 'fo'];
// the debt above which nobody spends, even in an emergency (lower for poor countries)
const safeDebt = () => { const c = P(), pc = c.gdp / Math.max(0.01, c.pop); return c.gdp * (pc < 5 ? 0.3 : pc < 15 ? 0.45 : 0.6); };
// our homeland or capital under attack: the only case where the defence minister may still spend while in debt
function homeEmergency() {
  const me = S.player; if (!S.units) return false;
  if (S.units.some(u => u.o !== me && u.at === me && domOf(u) === 'land' && atWar(u.o, me))) return true;
  return !!(S.ct && citiesOfT(me).some(x => { const st = cst(x); return (st.s > 0 && st.b && atWar(st.b, me)) || (st.o && st.o !== me && atWar(st.o, me)); }));
}
// the finance minister (or, with no finance minister, a plain rule) splits what the country can afford this month
function setEnvelopes() {
  const g = G(), p = S.p, c = P(), fm = minOf('fin');
  const bd = budgetDay(), net = bd.net * DPM, reserve = c.gdp * (fm && fm.tr === 'frugal' ? 0.04 : 0.02);
  const atw = activeWars(S.player) > 0, losing = warsOf(S.player).some(w => w.pause === 0 && mySideFront(w, S.player) < -5);
  const debt = p.treasury < 0;
  const why = [];
  let pool = 0;
  if (p.bankrupt) why.push('פשיטת רגל — אין הוצאות');
  else if (debt) why.push('הקופה במינוס — אין הוצאות חדשות');
  else {
    pool = Math.max(0, p.treasury - reserve) * 0.35 + Math.max(0, net) * 0.6;
    if (net < 0) pool = Math.max(0, pool + net); // a deficit eats into what can be spent
    if (fm) pool *= 1 + (mSk(fm) - 3) * 0.05;
  }
  let sh = atw ? { def: 0.75, int: 0.08, fo: 0.17 } : { def: 0.3, int: 0.45, fo: 0.25 };
  if (atw) why.push(losing ? 'מלחמה שהולכת רע — ביטחון קודם' : 'מלחמה — ביטחון קודם');
  if (c.approval < 38 && !losing) { sh.int += 0.15; sh.def -= atw ? 0.1 : 0.05; sh.fo -= atw ? 0.05 : 0.1; why.push('העם כועס — יותר לפרויקטים'); }
  if (p.rep < 35) { sh.fo += 0.08; sh.int -= 0.08; why.push('מוניטין נמוך — יותר לשר החוץ'); }
  if (!debt && net < 0 && !atw) { sh.int *= 0.5; why.push('גירעון — פחות פרויקטים'); }
  const tot = sh.def + sh.int + sh.fo, old = g.env;
  g.env = { d: S.day, pool, why: why.join(' · '), used: { def: 0, int: 0, fo: 0 } };
  // what a minister did not spend is saved for him (up to 6 months' worth), so a big project can be afforded — but never while in debt
  ENV_R.forEach(r => { const base = pool * Math.max(0, sh[r]) / tot, left = old && !debt && !p.bankrupt ? Math.max(0, (old[r] || 0) - (old.used[r] || 0)) : 0; g.env[r] = base + Math.min(left, base * 5); });
  return g.env;
}
const envOf = () => { const g = G(); return g.env && S.day - g.env.d < 30 ? g.env : setEnvelopes(); };
const envLeft = r => { const e = envOf(); return Math.max(0, (e[r] || 0) - (e.used[r] || 0)); };
// why a minister may not spend this right now ('' = may spend)
function noMoney(r, cost, emergency) {
  const p = S.p; if (p.bankrupt) return 'פשיטת רגל';
  if (emergency) return p.treasury - cost < -safeDebt() ? 'החוב גבוה מדי, גם בחירום' : '';
  if (p.treasury - cost < 0) return p.treasury < 0 ? 'הקופה במינוס' : 'אין מספיק כסף בקופה';
  if (ENV_R.includes(r) && cost > envLeft(r) + 1e-9) return 'מעבר לתקציב שקבע האוצר';
  return '';
}
// every shekel a minister spends goes through here (and is counted)
function minSpend(r, cost, emergency) {
  if (noMoney(r, cost, emergency)) return false;
  if (ENV_R.includes(r)) { const e = envOf(); e.used[r] = (e.used[r] || 0) + cost; }
  const g = G(); g.spent = (g.spent || 0) + cost; (g.spR || (g.spR = {}))[r] = (g.spR[r] || 0) + cost;
  return true;
}
// a "didn't do it, because..." line, at most once a month for the same reason
function minWhyNot(r, k, txt) { const g = G(), nr = g.nr || (g.nr = {}), key = r + ':' + k; if ((nr[key] || 0) > S.day) return; nr[key] = S.day + 30; logMin(r, txt, '', true); }
/* ---- the defence minister: runs the army ---- */
function minDef(m) {
  const me = S.player, M = P(), pol = m.pol, g = G(), st = pol.st, tr = m.tr, es = mSk(m);
  const mine = unitsOf(me); if (!mine.length) return;
  const free = u => !u.dest && !(u.man > S.day) && S.units.includes(u);
  const said = [];
  // a) badly damaged units come home to refit
  const lim = { def: 0.5, bal: 0.4, atk: 0.3 }[st] + (tr === 'careful' ? 0.08 : tr === 'aggr' ? -0.08 : 0);
  let back = 0;
  mine.forEach(u => {
    const s = uStr(u);
    if (atHome(u)) { u.pk = s; return; }
    if (!u.pk || s > u.pk) u.pk = s;
    if (domOf(u) === 'land' && free(u) && u.at && u.at !== me && atWar(u.at, me) && s < u.pk * lim) { sendHome(u, true); back++; }
  });
  if (back) said.push(back === 1 ? 'יחידה פגועה הוחזרה הביתה' : back + ' יחידות פגועות הוחזרו הביתה');
  const wars = warsOf(me).filter(w => w.pause === 0 && (w.a === me || w.b === me));
  if (warsOf(me).some(w => w.pause === 0)) S.p.lastWar = S.day;
  // b) invaders in our land: enough force at home, units move towards them, call back troops if needed
  const intr = S.units.filter(u => u.o !== me && u.at === me && domOf(u) === 'land');
  const I = intr.reduce((s, u) => s + uStr(u), 0);
  const homeF = () => mine.filter(u => S.units.includes(u) && domOf(u) !== 'sea' && u.at === me).reduce((s, u) => s + uStr(u), 0);
  let H = homeF();
  // our cities under siege or in enemy hands (the capital first), and the capital when invaders come near it
  if (S.ct) {
    const capM = capOf(me);
    const thr = citiesOfT(me).filter(x => { const st = cst(x); return (st.o === me && st.s > 0 && st.b && atWar(st.b, me)) || (st.o && st.o !== me && atWar(st.o, me)) ||
      (x === capM && intr.some(u => km([u.lon, u.lat], cityPt(x)) < 250)); }).sort((a, b) => (b.cap - a.cap) || (b.pop - a.pop));
    const tc = thr[0];
    if (tc) {
      const near = mine.filter(u => S.units.includes(u) && domOf(u) === 'land' && km([u.lon, u.lat], cityPt(tc)) <= CR_KM).length;
      const want = tc.cap ? 3 : 2; let sent = 0;
      mine.filter(u => free(u) && domOf(u) === 'land' && u.at === me && km([u.lon, u.lat], cityPt(tc)) > CR_KM).sort((a, b) => km([a.lon, a.lat], cityPt(tc)) - km([b.lon, b.lat], cityPt(tc))).forEach(u => {
        if (near + sent >= want) return;
        const r = planMove(u, cityStand(tc), cst(tc).o === me ? 'def' : 'atk'); if (r.err || r.needWar) return; r.cty = tc.id; commitMove(u, r, true); sent++;
      });
      if (sent) said.push((cst(tc).o === me ? 'הגנה על ' : 'לשחרר את ') + cityName(tc) + ': ' + (sent === 1 ? 'יחידה אחת נשלחה' : sent + ' יחידות נשלחו'));
    }
  }
  if (I > 0) {
    const need = I * ({ def: 1.8, bal: 1.5, atk: 1.25 }[st]);
    const tgt = intr.slice().sort((a, b) => uStr(b) - uStr(a))[0];
    let moved = 0, rec = 0;
    mine.filter(u => free(u) && domOf(u) === 'land' && u.at === me && km([u.lon, u.lat], [tgt.lon, tgt.lat]) > 80).slice(0, 4).forEach(u => {
      const p = nearIn(me, [tgt.lon + (R() - 0.5) * 0.4, tgt.lat + (R() - 0.5) * 0.4]); if (!p) return;
      const r = planMove(u, p, 'def'); if (!r.err && !r.needWar) { commitMove(u, r, true); moved++; }
    });
    if (H < need) mine.filter(u => free(u) && domOf(u) !== 'sea' && u.at && u.at !== me).sort((a, b) => uStr(b) - uStr(a)).forEach(u => { if (H >= need) return; sendHome(u, true); H += uStr(u); rec++; });
    if (H < need && pol.mob && M.res >= 1 && !cdLeft('mob') && !(M.mob > 0)) {
      const nm_ = noMoney('def', 0, true);
      if (!nm_) { mobilize(true); said.push('גיוס מילואים — פלישה לשטחנו'); } else minWhyNot('def', 'mob', 'לא גייסתי מילואים — ' + nm_);
    }
    if (moved || rec) said.push('הגנה על הבית: ' + [moved ? moved + ' יחידות נעו מול הפולשים' : '', rec ? rec + ' הוחזרו מהחזית' : ''].filter(Boolean).join(', '));
  }
  // c) take the fight to the enemy, one front per order (the weakest neighbour first), never a new war
  if (I <= 0 || H >= I * 2) {
    // concentrate on one front: where our force would count most (best ratio), weighted by what is at stake there
    const homePool = mine.filter(u => S.units.includes(u) && domOf(u) === 'land' && u.at === me && !u.dest).reduce((s, u) => s + uStr(u), 0);
    const fronts = wars.map(w => ({ w, E: enemyLeaderFor(w, me) })).filter(x => S.c[x.E] && S.c[x.E].alive).map(x => {
      const Ec = S.c[x.E], inE = forcesIn(me, x.E, Ec.adv), dE = (hasUnits(x.E) ? defStr(forcesIn(x.E, x.E, M.adv)) : power(Ec) * 0.6) * 1.3;
      x.est = (atkStr(inE) + homePool * 0.6) / (dE + 1); x.val = x.est * (adjacent(x.E, me) ? 1.5 : 1) * (1 + Math.min(1, Math.max(0, mySideFront(x.w, me)) / 60)); return x;
    }).sort((a, b) => b.val - a.val);
    for (const { w, E } of fronts) {
      const Ec = S.c[E];
      const totLand = mine.filter(u => S.units.includes(u) && domOf(u) === 'land').reduce((s, u) => s + uStr(u), 0);
      let avail = mine.filter(u => S.units.includes(u) && domOf(u) === 'land' && u.at === me && !u.dest).reduce((s, u) => s + uStr(u), 0) - totLand * ({ def: 0.6, bal: 0.35, atk: 0.2 }[st]);
      const inE = forcesIn(me, E, Ec.adv);
      const dE = (hasUnits(E) ? defStr(forcesIn(E, E, M.adv)) : power(Ec) * 0.6) * (1.3 + Math.max(0, mySideFront(w, me)) / 250);
      // never into a hopeless fight: a good minister wants a clear edge, even a poor one at least 1.2:1
      const thr = Math.max(es >= 3 ? 1.4 : 1.2, { def: 2.2, bal: 1.6, atk: 1.4 }[st] * (tr === 'aggr' ? 0.9 : tr === 'careful' ? 1.2 : 1) * (1 + (R() - 0.5) * (6 - es) * 0.08));
      let l = inE.l, s = inE.s;
      const ratio = () => atkStr({ l, s }) / (dE + 1);
      // the capital is never left empty: the unit closest to it stays when nobody else guards it
      const capM = S.ct ? capOf(me) : null, guard = capM ? mine.filter(u => S.units.includes(u) && domOf(u) === 'land' && u.at === me && km([u.lon, u.lat], cityPt(capM)) < 200) : [];
      const keep = capM && guard.length <= 1 ? mine.filter(u => S.units.includes(u) && domOf(u) === 'land' && u.at === me).sort((a, b) => km([a.lon, a.lat], cityPt(capM)) - km([b.lon, b.lat], cityPt(capM)))[0] : null;
      const pool = mine.filter(u => free(u) && domOf(u) === 'land' && u.at === me && u !== keep).sort((a, b) => uStr(b) - uStr(a));
      const sent = [];
      // the objective: the most important enemy city within reach (big, the capital, close to us)
      const tcity = S.ct ? warCityTarget(E, me, pool[0] ? [pool[0].lon, pool[0].lat] : (TERR[mainTid(me)] || {}).c) : null;
      // units already inside their land but not at a city: on to the objective
      let re = 0;
      // (one unit stays behind in a city we took while enemy troops are around, so it is not lost again at once)
      const kept = new Set();
      if (S.ct) mine.filter(u => free(u) && domOf(u) === 'land' && u.at === E).sort((a, b) => uStr(a) - uStr(b)).forEach(u => {
        const held = citiesNear([u.lon, u.lat], CR_KM).find(x => cst(x).o === me && landOf(x) === E);
        if (!held || kept.has(held.id)) return;
        if (S.units.some(e => e.o === E && domOf(e) === 'land' && km([e.lon, e.lat], cityPt(held)) < 250)) { kept.add(held.id); u.gar = held.id; }
      });
      if (S.ct) mine.filter(u => free(u) && domOf(u) === 'land' && u.at === E && !(u.gar && kept.has(u.gar)) && !citiesNear([u.lon, u.lat], CR_KM).some(x => { const o = cst(x).o; return o && !sideOf(o, me); })).forEach(u => {
        const t = warCityTarget(E, me, [u.lon, u.lat]); if (!t) return;
        const r = planMove(u, cityStand(t), 'atk'); if (r.err || r.needWar) return; r.cty = t.id; commitMove(u, r, true); re++;
      });
      if (re) said.push((re === 1 ? 'יחידה אחת ממשיכה' : re + ' יחידות ממשיכות') + ' לעבר ערי ' + nm(E));
      if (ratio() < thr * 1.1 && avail > 0 && pool.length) {
        let L2 = l, S2 = s, A = avail;
        for (const u of pool) { if (A <= 0) break; const pw = uPow(u, Ec.adv); L2 += pw.l; S2 += pw.s; A -= uStr(u); }
        if (atkStr({ l: L2, s: S2 }) / (dE + 1) >= thr) {
          for (const u of pool) {
            if (avail <= 0 || ratio() >= thr * 1.15) break;
            const p = tcity ? cityStand(tcity) : nearIn(E, [u.lon, u.lat]); if (!p) break;
            const r = planMove(u, p, 'atk'); if (r.err || r.needWar) continue;
            r.cty = tcity ? tcity.id : null; commitMove(u, r, true); u.pk = uStr(u);
            const pw = uPow(u, Ec.adv); l += pw.l; s += pw.s; avail -= uStr(u); sent.push(u);
          }
        } else if (!(g.sg && g.sg[E] > S.day)) {
          (g.sg || (g.sg = {}))[E] = S.day + 90;
          logMin('def', 'אין מספיק כוח כדי לפלוש ל' + nm(E) + ' — הכוחות נשארים להגן. כדאי לשקול רכש או בעלות ברית', '', true);
        }
      }
      if (sent.length) said.push((sent.length === 1 ? uName(sent[0]) + ' נשלחה' : 'ריכזתי ' + sent.length + ' יחידות') + (tcity ? ' לכבוש את ' + cityName(tcity) : ' מול ' + nm(E)) + ' — יחס ⁦' + ratioTxt(atkStr({ l, s }), dE) + '⁩');
      // air and missile strikes on their army first (before and during the ground assault)
      if (wars.length && (sent.length || l > 0 || ratio() < thr * 1.1)) { const t = minStrike(m, E); if (t) said.push(t); }
      // air cover over our troops in their land
      if (l > 0 && !mine.some(u => domOf(u) === 'air' && S.units.includes(u) && (u.at === E || (u.dest && u.mode === 'atk')))) {
        const air = mine.find(u => domOf(u) === 'air' && u.at === me && free(u));
        const p = air && nearIn(E, [air.lon, air.lat]), r = p && planMove(air, p, 'atk');
        if (r && !r.err && !r.needWar) { commitMove(air, r, true); said.push(uName(air) + ' לסיוע אווירי'); }
      }
      // across the sea: first a fleet off their coast, so ground forces can cross
      if (!adjacent(me, E) && l === 0 && !sent.length && pool.length && !navyNear(me, E, 600).n && !mine.some(u => domOf(u) === 'sea' && u.dest && distToC(E, u.dest) < 700)) {
        const fl = mine.find(u => domOf(u) === 'sea' && free(u) && (u.m.ships || 0) >= 1);
        const p0 = fl && nearIn(E, [fl.lon, fl.lat]), p = p0 && snapSea(p0);
        const r = p && planMove(fl, p, 'atk');
        if (r && !r.err) { commitMove(fl, r, true); said.push(uName(fl) + ' יצא לחופי ' + nm(E)); }
      }
      if (sent.length) break;
    }
  }
  // d) reserves: called up when the war goes badly, sent home after the peace
  if (pol.mob && wars.length && !(M.mob > 0) && M.res >= 1 && !cdLeft('mob') && wars.some(w => mySideFront(w, me) < -8)) {
    // the enemy holds part of our land: an emergency, so even in debt (up to a safe limit)
    const nm_ = noMoney('def', 0, true);
    if (!nm_) { mobilize(true); said.push('גיוס מילואים — האויב בשטחנו'); } else minWhyNot('def', 'mob', 'לא גייסתי מילואים — ' + nm_);
  }
  if (!wars.length && M.mob > 0 && S.day - (S.p.lastWar || 0) > 30) { demobilize(true); said.push('המילואימניקים שוחררו הביתה'); }
  // e) once a month: the defence budget follows the wars (unless the player set it himself), and purchases
  if (S.day - (g.lb || -99) >= 30) {
    g.lb = S.day;
    const p = S.p;
    if (!(g.ovr.def > S.day)) {
      const emg = homeEmergency(), cant = p.treasury < 0 && !emg;
      if (wars.length && st !== 'def' && p.defPct < Math.min(0.12, p.defPct0 * 1.5) && cant) minWhyNot('def', 'defpct', 'לא הגדלתי את תקציב הביטחון — הקופה במינוס');
      else if (wars.length && st !== 'def' && p.defPct < Math.min(0.12, p.defPct0 * 1.5) && (!emg || !noMoney('def', 0, true))) { p.defPct = Math.min(0.12, Math.round((p.defPct + 0.005) * 1000) / 1000); said.push('תקציב הביטחון הוגדל ל-' + '⁦' + (p.defPct * 100).toFixed(1) + '%⁩'); }
      else if (!wars.length && S.day - (p.lastWar || -999) > 90 && p.defPct > p.defPct0 * 1.05 && st !== 'atk') { p.defPct = Math.max(p.defPct0, Math.round((p.defPct - 0.003) * 1000) / 1000); said.push('תקציב הביטחון הוחזר ל-' + '⁦' + (p.defPct * 100).toFixed(1) + '%⁩'); }
    }
    if (pol.buy) { const b = minBuy(m); if (b) said.push(b); }
    // in debt, the army shrinks back to its normal budget once there is no war
    if (!(g.ovr.def > S.day) && !wars.length && p.treasury < 0 && p.defPct > p.defPct0 + 0.001) { p.defPct = Math.max(p.defPct0, Math.round((p.defPct - 0.005) * 1000) / 1000); said.push('קיצצתי בתקציב הביטחון ל-⁦' + (p.defPct * 100).toFixed(1) + '%⁩ — הקופה במינוס'); }
    // the minister may suggest a war, but never starts one
    if (st !== 'def' && !wars.length && !(g.sw > S.day) && R() < 0.3) {
      const t = neighborsOf(me).filter(x => S.c[x] && S.c[x].alive && justified(x) && rel(x, me) < -50 && power(M) > power(S.c[x]) * 2.5 && !isAlly(x, me))[0];
      if (t) { g.sw = S.day + 240; logMin('def', 'המלצה: ' + nm(t) + ' עוינת וחלשה מאיתנו. ההחלטה אם לצאת למלחמה — שלך בלבד', '', false); }
    }
  }
  if (said.length) logMin('def', said.join(' · '));
}
// weapons the defence minister orders on his own, within his share of the treasury
function minBuy(m) {
  const c = P(), p = S.p;
  const atw = activeWars(S.player) > 0;
  const nm0 = noMoney('def', 0); if (nm0) { minWhyNot('def', 'buy', 'לא קניתי נשק — ' + nm0); return null; }
  // his envelope from the finance minister; a modest policy uses only part of it
  const budget = envLeft('def') * (m.pol.buy === 2 ? 1 : 0.6) * (m.tr === 'frugal' ? 0.7 : 1);
  if (budget <= 0) { minWhyNot('def', 'buy', 'לא קניתי נשק — תקציב הביטחון של החודש נוצל'); return null; }
  // count what is already ordered and on its way, so he does not re-order the same thing every month
  const onWay = {}; (p.queue || []).forEach(q => { if (BUY[q.k]) onWay[q.k] = (onWay[q.k] || 0) + q.n; });
  const ratio = k => ((c.inv[k] || 0) + (onWay[k] || 0) + 1) / ((c.inv0[k] || 0) + 1);
  const cap = atw ? 1.6 : 1.25;
  const keys = ['tanks', 'air', 'art', 'heli', 'afv'].concat(c.mlv ? ['msl'] : [], c.inv0.ships > 0 ? ['ships'] : [], atw ? ['troops'] : []).filter(k => ratio(k) < cap);
  if (!keys.length) return null;
  const k = keys.sort((a, b) => ratio(a) - ratio(b))[0];
  const room = Math.max(1, Math.ceil(((c.inv0[k] || 0) * cap - (c.inv[k] || 0) - (onWay[k] || 0)) / BUY[k].n));
  const B = BUY[k], mul = Math.min(20, room, Math.floor(budget / B.cost)); if (mul < 1) return null;
  if (!minSpend('def', B.cost * mul) || !buyPkg(k, mul, true)) return null;
  return 'רכש: ' + (k === 'troops' ? troopsPlain(B.n * mul) + ' חיילים' : '⁦' + B.n * mul + '⁩ ' + B.unit) + ' (' + '⁦' + moneyTxt(B.cost * mul) + '⁩)';
}
// an air or missile strike on the enemy's army (never on a city) before and during a ground assault
function minStrike(m, E) {
  if (m._st === S.day) return ''; m._st = S.day;
  const me = P(), w = S.wars.find(x => inWar(x, E) && inWar(x, S.player)); if (!w || w.pause > 0) return '';
  const opts = [];
  unitsOf(S.player).forEach(u => {
    if (u.dest) return;
    if ((u.m.air || 0) >= 4 && distToC(E, [u.lon, u.lat]) <= AIR_RANGE && !cdLeft('air:' + E + ':' + u.id)) opts.push({ u, k: 'air' });
    if (u.t === 'msl' && me.mlv > 0 && (u.m.msl || 0) >= 5 && distToC(E, [u.lon, u.lat]) <= MIS_RANGE[me.mlv] && !cdLeft('mis:' + E + ':' + u.id)) opts.push({ u, k: 'mis' });
  });
  const o = opts.find(x => x.k === 'air') || opts[0]; if (!o) return '';
  const cost = strikeCost(o.k), why = noMoney('def', cost);
  if (why) { minWhyNot('def', 'strike', 'לא תקפתי מהאוויר — ' + why); return ''; }
  const t0 = PS().strikes; strike(E, o.k, o.u.id, null, true);
  if (PS().strikes === t0) return '';
  minSpend('def', cost);
  return (o.k === 'air' ? 'תקיפה אווירית' : 'מטח טילים') + ' על צבא ' + nm(E) + ' לפני ההסתערות';
}
/* ---- the finance minister: tax and welfare ---- */
function minFin(m) {
  const g = G(); if (g.ovr.fin > S.day) return;
  const p = S.p, c = P(), bd = budgetDay(), debt = p.treasury < 0 ? -p.treasury / c.gdp : 0, ap = c.approval;
  const netY = bd.net * DPY / c.gdp, goal = m.pol.goal, tr = m.tr;
  const lim = { grow: 0.45, bal: 0.2, wel: 0.4 }[goal] + (tr === 'popul' ? 0.15 : tr === 'frugal' ? -0.1 : 0);
  const res = c.gdp * (tr === 'frugal' ? 0.06 : 0.03);
  let k = null, d = 0, why = '';
  if (p.bankrupt || debt > lim + 0.2 || (debt > lim && netY < 0.003)) {
    why = p.bankrupt ? 'פשיטת רגל' : 'החוב גבוה';
    if ((goal === 'wel' || tr === 'popul') && p.tax < 0.45) { k = 'tax'; d = 0.01; }
    else if (p.welfare > 0.09 && ap > 38) { k = 'welfare'; d = -0.01; } else if (p.tax < 0.5) { k = 'tax'; d = 0.01; }
  } else if (ap < 34 && debt < lim + 0.3) {
    why = 'העם כועס';
    if (p.treasury < 0 && netY < 0) { if (!(g.nr && g.nr['fin:ang'] > S.day)) minWhyNot('fin', 'ang', 'העם כועס, אבל הקופה במינוס — לא מוריד מסים ולא מגדיל רווחה'); return; }
    if (goal === 'wel' && p.welfare < 0.3) { k = 'welfare'; d = 0.01; } else if (p.tax > 0.16) { k = 'tax'; d = -0.01; }
  } else if (netY > 0.004 && p.treasury > res) {
    why = 'עודף בקופה';
    if (goal === 'grow' && p.tax > 0.18) { k = 'tax'; d = -0.01; }
    else if (goal === 'wel' && p.welfare < 0.28 && p.treasury > 0) { k = 'welfare'; d = 0.01; }
    else if (goal === 'bal' && (ap < 52 || p.treasury > c.gdp * 0.08) && p.tax > 0.2) { k = 'tax'; d = -0.01; }
  } else if (netY < ({ grow: -0.025, bal: -0.006, wel: -0.02 }[goal] - (tr === 'popul' ? 0.01 : 0)) && (goal === 'bal' || debt > 0.1)) {
    why = 'גירעון';
    if ((goal === 'grow' || tr === 'frugal') && p.welfare > 0.1 && ap > 40) { k = 'welfare'; d = -0.01; } else if (p.tax < 0.5) { k = 'tax'; d = 0.01; }
  }
  if (!k) return;
  if (R() < (5 - mSk(m)) * 0.07) return; // a weak minister sometimes hesitates
  const T0 = approvalTarget();
  p[k] = Math.round((p[k] + d) * 100) / 100;
  const dd = approvalTarget() - T0;
  const what = k === 'tax' ? (d > 0 ? 'מס ההכנסה הועלה ל-' : 'מס ההכנסה הורד ל-') : (d > 0 ? 'תקציב הרווחה הוגדל ל-' : 'תקציב הרווחה קוצץ ל-');
  logMin('fin', what + pctT(p[k]) + ' (' + why + ')', Math.abs(dd) >= 0.5 ? 'העם ' + sgnT(dd) + ' בהדרגה' : '', dd < -0.5);
}
/* ---- the construction minister: national projects from spare money ---- */
const INT_ORD = { people: ['hosp', 'house', 'school', 'infra', 'green'], growth: ['infra', 'school', 'green', 'hosp', 'house'], green: ['green', 'infra', 'school', 'hosp', 'house'] };
function minInt(m) {
  const p = S.p, c = P();
  const nm0 = noMoney('int', 0); if (nm0) { minWhyNot('int', 'build', 'לא התחלתי פרויקט — ' + nm0); return; }
  const reserve = c.gdp * (m.tr === 'frugal' ? 0.05 : m.tr === 'popul' ? 0.01 : 0.025);
  const free = Math.min(p.treasury - reserve, envLeft('int') * (m.tr === 'popul' ? 1.3 : 1));
  if (free <= 0) { minWhyNot('int', 'build', 'לא התחלתי פרויקט — ' + (p.treasury <= reserve ? 'צריך להשאיר רזרבה בקופה' : 'תקציב הבינוי של החודש נוצל')); return; }
  if (p.proj.length >= (m.tr === 'careful' || m.tr === 'frugal' ? 1 : 2)) return;
  // angry people: projects that raise approval first
  const ord = (INT_ORD[m.pol.pri] || INT_ORD.people).slice();
  if (c.approval < 38) ord.sort((a, b) => (PROJ[b].ap || 0) - (PROJ[a].ap || 0));
  let tooBig = null;
  for (const k of ord) {
    if (p.proj.some(q => q.k === k) || (p.built[k] || 0) >= projMax(k)) continue;
    const cost = projCost(k); if (cost > free) { tooBig = tooBig || k; continue; }
    if (!minSpend('int', cost) || !startProj(k, true)) return;
    const D = PROJ[k];
    logMin('int', 'התחלת בנייה: ' + D.he + ' (' + '⁦' + moneyTxt(cost) + '⁩, ' + Math.round(D.days / DPM) + ' חודשים)' + (c.approval < 38 && D.ap ? ' — העם כועס, אז קודם מה שמשפר את מצב הרוח' : ''), D.ap ? 'העם +' + D.ap + ' בסיום' : '');
    return;
  }
  if (tooBig) minWhyNot('int', 'big', 'חוסך ל' + PROJ[tooBig].he + ' — עוד אין מספיק בתקציב הבינוי');
}
/* ---- the foreign minister: trade, aid, relations, peace ---- */
function minFo(m) {
  const g = G(), me = S.player, es = mSk(m);
  // 1) a war that goes badly: propose a cease-fire or peace
  if (m.pol.peace) for (const w of warsOf(me)) {
    if (w.pause > 0 || !(w.a === me || w.b === me)) continue;
    const fp = mySideFront(w, me), age = S.day - (w.startDay || 0);
    const lim = m.tr === 'aggr' ? -30 : m.tr === 'careful' ? -6 : -15;
    if (!(fp < lim || (age > 300 && fp < 5)) || (g.pt[w.id] || 0) > S.day) continue;
    g.pt[w.id] = S.day + 45;
    const k = fp < -25 ? 'cease' : 'white', en = enemyLeaderFor(w, me);
    if (peaceW(w) + (m.tr === 'dipl' ? 10 : 0) + (es - 3) * 4 > { cease: 0, white: 10 }[k]) {
      applyPeace(w, k, me, en, 0);
      logMin('fo', (k === 'cease' ? 'הושגה הפסקת אש עם ' : 'נחתם הסכם שלום עם ') + nm(en), '');
    } else logMin('fo', nm(en) + ' דחתה את הצעת ה' + (k === 'cease' ? 'הפסקת אש' : 'שלום') + ' שלנו', '', true);
    return;
  }
  // 2) about once a month: a new trade deal with a big economy that likes us
  if (S.day - (g.lt || -99) >= (m.tr === 'dipl' ? 21 : 30)) {
    g.lt = S.day;
    const l = alive().filter(o => o !== me && !hasPact(o, me, 'trade') && !atWar(o, me) && !sanctions(o, me) && !sanctions(me, o) && rel(o, me) > 10 &&
      !(g.no['trade:' + o] > S.day) && !(g.tc[o] > S.day)).sort((a, b) => S.c[b].gdp - S.c[a].gdp).slice(0, 6);
    const o = l.length ? pick(l) : null;
    if (o) {
      if (aiScore('trade', o).ok) { setPact(o, me, 'trade', true); const parts = applyFx({ rep: 2, rel: { [o]: 8 } }); addNews('נחתם הסכם סחר בין ' + P().he + ' ל' + nm(o) + '.', 'good'); logMin('fo', 'הסכם סחר עם ' + nm(o), parts.join(' · ')); }
      else { g.tc[o] = S.day + 150; addRel(o, me, -1); }
    }
  }
  // 3) reputation below the target: aid and gestures to countries that matter
  if (S.p.rep < m.pol.rep && S.day - (g.lg || -99) >= (m.tr === 'frugal' ? 60 : 30)) {
    g.lg = S.day;
    const why = noMoney('fo', giftAmt());
    if (why) {
      // no money: cheap gestures instead (a summit, a visit) — a small gain with a friendly country
      const l = alive().filter(o => o !== me && !atWar(o, me) && rel(o, me) > -20 && rel(o, me) < 60).sort((a, b) => S.c[b].gdp - S.c[a].gdp).slice(0, 6), o = l.length ? pick(l) : null;
      if (o) { const parts = applyFx({ rel: { [o]: 3 + Math.round(es / 2) } }); logMin('fo', 'ביקור מדיני ב' + nm(o) + ' במקום סיוע — ' + why, parts.join(' · ')); }
      return;
    }
    const l = alive().filter(o => o !== me && !atWar(o, me) && rel(o, me) > -40 && rel(o, me) < 70 && !cdLeft('gift:' + o)).sort((a, b) => giftRep(b) - giftRep(a) || S.c[b].gdp - S.c[a].gdp).slice(0, 8);
    const o = l.length ? pick(l) : null, amt = giftAmt();
    if (o && minSpend('fo', amt) && spend(amt)) {
      setCd('gift:' + o, 30);
      const parts = applyFx({ rep: giftRep(o), rel: { [o]: giftRel(o) } });
      addNews('שלחנו סיוע הומניטרי ל' + nm(o) + '.', 'dip');
      logMin('fo', 'סיוע ל' + nm(o) + ' (' + '⁦' + moneyTxt(amt) + '⁩)', parts.join(' · '));
    }
  }
}
const MIN_FN = { def: minDef, fin: minFin, int: minInt, fo: minFo };
// a disaster abroad: the foreign minister answers on his own, otherwise the player is asked
function pushAid(id, kind, size) {
  const m = minOn('fo');
  if (!m) { S.pending.push({ type: 'aid', from: id, kind, size }); return; }
  const C = S.c[id]; if (!C) return;
  const big = Math.max(0.01, Math.min(P().gdp * 0.002, C.gdp * size * 0.5 + 0.02));
  const goBig = S.p.rep < m.pol.rep && m.tr !== 'frugal' && S.p.treasury > big * 4 && !noMoney('fo', big);
  const amt = goBig ? big : big * 0.25, e = goBig ? { ap: 1, rep: 6, rel: { [id]: 18 } } : { rep: 3, rel: { [id]: 8 } };
  const why = noMoney('fo', amt);
  if (why) { applyFx({ rel: { [id]: 2 } }); logMin('fo', 'שלחנו ל' + C.he + ' מכתב תנחומים בלי כסף — ' + why, '', true); return; }
  if (!minSpend('fo', amt) || !spend(amt)) return;
  const parts = applyFx(e);
  addNews((goBig ? 'שלחנו משלחת סיוע גדולה ל' : 'צוותי חילוץ שלנו נחתו ב') + C.he + ' אחרי ה' + kind + '.', 'good');
  logMin('fo', (goBig ? 'משלחת סיוע ל' : 'צוותי חילוץ ל') + C.he + ' (' + kind + ')', parts.join(' · '));
}

/* ================= living world: other countries grow, arm, vote, rebel ================= */
const TAG_HE = { army: 'מגדילה את הצבא', rec: 'במיתון', boom: 'בצמיחה מהירה', elec: 'לקראת בחירות', coup: 'אחרי הפיכה צבאית', build: 'משקיעה בתשתיות', protest: 'מחאות נגד השלטון',
  ally: 'חתמה על ברית', disaster: 'מתאוששת מאסון', newgov: 'ממשלה חדשה', rebel: 'נלחמת על עצמאותה', sanc: 'מטילה סנקציות', revo: 'אחרי מהפכה' };
const TAG_CLS = { army: 'orange', rec: 'bad', boom: 'ok', elec: 'blue', coup: 'red', build: 'teal', protest: 'orange', ally: 'blue', disaster: 'orange', newgov: 'teal', rebel: 'red', sanc: 'orange', revo: 'teal' };
function tag(c, k, days) { if (c) (c.tg || (c.tg = {}))[k] = Math.round(S.day + days); }
const hasTag = (c, k) => !!(c && c.tg && c.tg[k] > S.day);
const wnews = t => addNews(t, 'world');
const wcount = k => { const o = S.wc || (S.wc = {}); o[k] = (o[k] || 0) + 1; };
let BIG = { t: -1, s: new Set() };
function bigSet() { if (BIG.t !== S.turn || !BIG.s.size) BIG = { t: S.turn, s: new Set(alive().sort((a, b) => S.c[b].gdp - S.c[a].gdp).slice(0, 20)) }; return BIG.s; }
// countries the player cares about: big economies, neighbours, allies, enemies
function notable(id) { if (!S.player || !S.c[S.player] || !S.c[S.player].alive) return bigSet().has(id); return bigSet().has(id) || adjacent(id, S.player) || isAlly(id, S.player) || atWar(id, S.player) || rel(id, S.player) < -45; }
const hashId = id => { let h = 7; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return Math.abs(h); };
function aiInit(c) {
  if (c.ld) return;
  const n = genName(c.id); c.ld = n.n; c.lg = n.g; c.dp0 = c.defPct; c.gm = c.gdp; c.g = 0.025;
  if (c.gov !== 'authoritarian') c.el = S.day + 30 + Math.floor(R() * (c.gov === 'democracy' ? 1430 : 1800));
}
const vg = (c, m, f) => c && c.lg === 'f' ? f : m;
// each country gets its monthly turn on its own day, so the work is spread over the month
function worldDay() {
  if (!S.player) return;
  const d = S.day % 30;
  for (const id in S.c) { const c = S.c[id]; if (!c.alive || id === S.player) continue; if ((c.hd == null ? (c.hd = hashId(id) % 30) : c.hd) !== d) continue; aiMonth(c); }
}
function aiMonth(c) {
  aiInit(c);
  const id = c.id, wars = activeWars(id), nt = notable(id);
  // yearly growth, smoothed so one-off shocks don't look like a boom or a crash
  c.g = (c.g == null ? 0.025 : c.g) * 0.8 + (c.gdp / (c.gm || c.gdp) - 1) * 12 * 0.2; c.gm = c.gdp;
  // business cycle: recessions and booms come and go
  if (c.cy && S.day >= c.cy.u) { if (nt && c.cy.k === 'rec') wnews(c.he + ' יצאה מהמיתון — הכלכלה חוזרת לצמוח.'); c.cy = null; }
  else if (!c.cy) {
    const pr = 0.006 + wars * 0.02 + sanctionHit(id) * 0.15 + (S.recession > 0 ? 0.04 : 0) + (c.approval < 25 ? 0.01 : 0);
    if (R() < pr) { wcount('rec'); c.cy = { k: 'rec', u: S.day + 200 + Math.floor(R() * 400) }; tag(c, 'rec', c.cy.u - S.day); if (nt) wnews('מיתון ב' + c.he + ': ' + pick(['האבטלה מזנקת והבורסה צונחת.', 'המפעלים מפטרים עובדים.', 'הצריכה נעצרת והמטבע נחלש.'])); }
    else if (!wars && R() < 0.006) { wcount('boom'); c.cy = { k: 'boom', u: S.day + 300 + Math.floor(R() * 500) }; tag(c, 'boom', c.cy.u - S.day); if (nt) wnews('פריחה כלכלית ב' + c.he + ': ' + pick(['השקעות זרות זורמות לשם.', 'הייצוא שובר שיאים.', 'תעשיית הטכנולוגיה מזנקת.'])); }
  }
  if (c.cy) c.approval = clamp(c.approval + (c.cy.k === 'rec' ? -2 : 1.2), 5, 95);
  if (c.approval < 25) tag(c, 'protest', 40);
  armsMonth(c, nt, wars);
  // domestic projects: roads, ports, hospitals
  if (!wars && c.cy && c.cy.k === 'rec' ? false : !wars && R() < 0.035) {
    wcount('build'); c.gb = Math.min(0.008, (c.gb || 0) + 0.002); c.approval = clamp(c.approval + 2, 5, 95); tag(c, 'build', 365);
    if (nt && bigSet().has(id) && R() < 0.4) wnews(c.he + ' ' + pick(['משיקה תוכנית תשתיות לאומית ענקית.', 'בונה רשת רכבות מהירות חדשה.', 'משקיעה מיליארדים בבתי חולים ובתי ספר.', 'מקימה נמל ושדה תעופה חדשים.']));
  }
  c.gb = (c.gb || 0) * 0.992;
  politicsMonth(c, nt);
  if (c.bought) for (const k in c.bought) { c.bought[k] *= 0.996; if (c.bought[k] < 0.5) delete c.bought[k]; }
}
// arms build-up: threatened or fighting countries raise the budget and buy equipment
function armsMonth(c, nt, wars) {
  const id = c.id; let thr = 0;
  for (const n of neighborsOf(id)) { const N = S.c[n]; if (N && N.alive && rel(id, n) < -40) thr = Math.max(thr, power(N) / power(c)); }
  const t = (c.dp0 || c.defPct) * (wars ? 1.35 : thr > 0.7 ? 1.2 : 1);
  c.defPct = clamp(c.defPct + (t - c.defPct) * 0.06, 0.003, 0.15);
  if ((wars || thr > 0.6) && R() < 0.2 && c.def > 0.3) {
    const k = c.def > 20 ? pick(['air', 'tanks', 'ships', 'msl', 'air', 'heli']) : pick(['tanks', 'art', 'afv', 'heli']);
    if ((k === 'ships' && !(c.inv0.ships > 0)) || (k === 'msl' && !c.mlv)) return;
    const B = BUY[k], n = Math.max(B.n, Math.round(Math.min(c.def * 0.06 / unitPrice(k), (c.inv0[k] || 0) * 0.08 + B.n) / B.n) * B.n);
    (c.bought || (c.bought = {}))[k] = (c.bought[k] || 0) + n;
    tag(c, 'army', 240); wcount('arms');
    if (nt) wnews(c.he + ' ' + pick(['הזמינה', 'רוכשת', 'חתמה על עסקה לרכישת']) + ' ' + n.toLocaleString('en-US') + ' ' + B.unit + (wars ? ' לקראת המשך הלחימה.' : ' על רקע המתיחות עם שכנותיה.'));
  }
}
function politicsMonth(c, nt) {
  if (c.gov !== 'authoritarian' && c.el) {
    if (c.el > S.day && c.el - S.day < 45) tag(c, 'elec', c.el - S.day + 2);
    if (S.day >= c.el) return election(c, nt);
  }
  if (c.gov !== 'democracy' && c.approval < 20 && R() < (c.gov === 'authoritarian' ? 0.02 : 0.03)) return worldCoup(c.id);
  if (c.gov === 'democracy' && c.approval < 12 && c.gdp / c.pop < 8 && R() < 0.01) return worldCoup(c.id);
  if (c.gov === 'authoritarian' && c.approval < 12 && R() < 0.012) return revolution(c);
}
function election(c, nt) {
  const keep = c.approval + (R() - 0.5) * 30 + (c.gov === 'hybrid' ? 25 : 0) > 48;
  c.el = S.day + (c.gov === 'democracy' ? 1461 : 1826) + Math.floor((R() - 0.5) * 120);
  wcount(keep ? 'reelect' : 'newleader');
  if (keep) { c.approval = clamp(c.approval + 5, 5, 95); if (nt) wnews('בחירות ב' + c.he + ': ' + c.ld + ' ' + vg(c, 'נבחר', 'נבחרה') + ' לכהונה נוספת.'); return; }
  const old = c.ld, n = genName(c.id); c.ld = n.n; c.lg = n.g; c.approval = 55 + R() * 12; tag(c, 'newgov', 180);
  // a new government brings a new foreign policy
  if (S.player && S.player !== c.id) addRel(c.id, S.player, Math.round((R() - 0.5) * 24));
  neighborsOf(c.id).slice(0, 4).forEach(x => addRel(c.id, x, Math.round((R() - 0.5) * 16)));
  if (nt || bigSet().has(c.id)) wnews('מהפך בבחירות ב' + c.he + ': ' + n.n + ' ' + vg(c, 'ינהיג', 'תנהיג') + ' את המדינה במקום ' + old + '.');
}
// the army takes power; democracies are angry
function worldCoup(id) {
  const c = S.c[id]; if (!c || !c.alive || id === S.player) return;
  aiInit(c);
  const old = c.ld, n = genName(id, 'm'), was = c.gov;
  wcount('coup'); c.ld = 'הגנרל ' + n.n; c.lg = 'm'; c.gov = 'authoritarian'; c.approval = 45; delete c.el; tag(c, 'coup', 365);
  if (was !== c.gov) BASE.clear();
  alive().forEach(d => { const D = S.c[d]; if (d === id || D.gov !== 'democracy') return; addRel(d, id, -12); if (d !== S.player && D.gdp > 200 && R() < 0.3) { S.sanc[d + '>' + id] = 1; tag(D, 'sanc', 180); } });
  wnews('הפיכה צבאית ב' + c.he + ': הצבא הדיח את ' + old + ', והגנרל ' + n.n + ' תפס את השלטון.');
  needMapRecolor = true;
}
function revolution(c) {
  wcount('revo'); const old = c.ld, n = genName(c.id); c.ld = n.n; c.lg = n.g;
  c.gov = R() < 0.35 ? 'democracy' : 'hybrid'; c.approval = 65; c.el = S.day + 365 + Math.floor(R() * 365); tag(c, 'revo', 365);
  BASE.clear();
  for (const k in S.sanc) if (k.endsWith('>' + c.id) && S.c[k.split('>')[0]] && S.c[k.split('>')[0]].gov === 'democracy') delete S.sanc[k];
  alive().forEach(d => { if (d !== c.id && S.c[d].gov === 'democracy') addRel(d, c.id, 10); });
  wnews('מהפכה ב' + c.he + ': ההמונים הפילו את ' + old + '. ' + n.n + ' ' + vg(c, 'עומד', 'עומדת') + ' בראש ממשלת מעבר ומבטיח' + vg(c, '', 'ה') + ' בחירות.');
}
// diplomacy between other countries: alliances form and break, trade deals end, sanctions come and go
function worldDiplomacy(ids) {
  for (let i = 0; i < 2; i++) {
    const a = pick(ids); if (!a || a === S.player) continue;
    const cands = neighborsOf(a).concat([...bigSet()]).filter(b => b !== a && b !== S.player && S.c[b] && S.c[b].alive);
    const b = cands.length ? pick(cands) : null; if (!b) continue;
    if (rel(a, b) > 45 && !isAlly(a, b) && !atWar(a, b) && !warsOf(a).length && !warsOf(b).length && R() < 0.3) {
      wcount('ally'); setPact(a, b, 'alliance', true); addRel(a, b, 10); tag(S.c[a], 'ally', 180); tag(S.c[b], 'ally', 180);
      wnews('ברית צבאית חדשה: ' + nm(a) + ' ו' + nm(b) + ' חתמו על הסכם הגנה הדדית.');
    }
  }
  for (const k in S.pacts) {
    const [a, b] = k.split('|'); if (a === S.player || b === S.player) continue;
    const p = S.pacts[k]; if (!p) continue; const r = rel(a, b);
    if (p.alliance && r < 10 && R() < 0.3) { wcount('allyx'); setPact(a, b, 'alliance', false); wnews('הברית בין ' + nm(a) + ' ל' + nm(b) + ' התפרקה אחרי חודשים של מתיחות.'); }
    else if (p.trade && r < -15 && R() < 0.3) { setPact(a, b, 'trade', false); if (notable(a) || notable(b)) wnews(nm(a) + ' ביטלה את הסכם הסחר עם ' + nm(b) + '.'); }
  }
  const a = pick(ids.filter(x => x !== S.player && S.c[x].gov === 'democracy' && S.c[x].gdp > 150));
  if (a) {
    const l = ids.filter(b => b !== a && b !== S.player && rel(a, b) < -45 && !S.sanc[a + '>' + b]);
    const b = l.length ? pick(l) : null;
    if (b && R() < 0.35) { wcount('sanc'); S.sanc[a + '>' + b] = 1; tag(S.c[a], 'sanc', 180); if (notable(a) || notable(b)) wnews(nm(a) + ' הטילה סנקציות כלכליות על ' + nm(b) + '.'); }
  }
  for (const k in S.sanc) {
    const [x, y] = k.split('>'); if (x === S.player || y === S.player || !S.c[x] || !S.c[y]) continue;
    if (rel(x, y) > -25 && R() < 0.15) { delete S.sanc[k]; if (notable(x) || notable(y)) wnews(nm(x) + ' הסירה את הסנקציות על ' + nm(y) + '.'); }
  }
}
// once a month: annexed lands may rise up
function worldRebels() {
  for (const id in S.c) {
    const L = S.c[id]; if (L.alive || !L.annexedBy || !L.tids0 || S.day - (L.annexDay || 0) < 365) continue;
    const W = S.c[L.annexedBy]; if (!W || !W.alive) continue;
    const pr = 0.004 * (W.gov === 'authoritarian' ? 1.5 : 1) * (W.approval < 40 ? 2 : 1) * (L.annexedBy === S.player ? 1.5 : 1);
    if (R() < pr) rebel(L);
  }
}
function rebel(L) {
  const wid = L.annexedBy, W = S.c[wid];
  const tids = (L.tids0 || []).filter(t => S.owner[t] === wid); if (!W || !tids.length) return;
  wcount('rebel'); tids.forEach(t => S.owner[t] = L.id);
  L.alive = true; delete L.annexedBy;
  L.gdp *= 0.6; W.gdp = Math.max(W.gdp * 0.5, W.gdp - L.gdp * 0.6); W.pop = Math.max(W.pop * 0.5, W.pop - L.pop * 0.85);
  for (const k of INV_KEYS) L.inv[k] = (L.inv0[k] || 0) * (k === 'troops' ? 0.5 : 0.25);
  L.bought = {}; L.nukes = 0; L.mob = 0; L.approval = 75; L.def = L.def0 * 0.5; L.cy = null;
  const n = genName(L.id); L.ld = n.n; L.lg = n.g; tag(L, 'rebel', 365);
  if (wid === S.player) { S.p.annexed = S.p.annexed.filter(x => x !== L.id); S.p.shock -= 3; }
  rebuildOwn(); WG_CACHE.t = -1;
  if (S.ct) citiesOfT(L.id).forEach(x => { const st = cst(x); if (st.o === wid) { st.o = L.id; delete st.s; delete st.b; delete st.lg; citiesDirty = true; } });
  const w = declareWar(L.id, wid, { noJoin: true, provoked: true, silent: wid !== S.player, noRally: true });
  if (w) { w.f = 0; w.startDay = S.day; }
  addNews('מרד ב' + L.he + ': המורדים הכריזו עצמאות מ' + W.he + ' והשתלטו על ' + (tids.length > 1 ? 'רוב השטח' : 'השטח') + '. ' + n.n + ' ' + vg(L, 'עומד', 'עומדת') + ' בראשם.', wid === S.player ? 'war' : 'world');
  needMapRecolor = true;
}
// a sanctions wave against a pariah: many democracies join in
function sanctionWave(o) {
  let n = 0;
  alive().forEach(d => { const D = S.c[d]; if (d === o || d === S.player || D.gov !== 'democracy' || D.gdp < 50 || S.sanc[d + '>' + o]) return; if (rel(d, o) < 10 && R() < 0.6) { S.sanc[d + '>' + o] = 1; n++; } });
  if (n) tag(S.c[o], 'sanc', 1);
  return n;
}
const oilShock = dir => () => alive().forEach(id => { if (id !== S.player) S.c[id].gdp *= OIL.has(id) ? 1 + 0.02 * dir : 1 - 0.004 * dir; });
// world reputation of any country (the player's is kept separately)
function repOf(id) { if (id === S.player) return S.p.rep; return clamp(50 + worldView(id) * 0.8 - (S.wars.some(w => w.a === id && w.pause === 0) ? 10 : 0), 0, 100); }
let RKC = { d: -1 };
function ranks() {
  if (RKC.d === S.day && RKC.w === S.wid) return RKC;
  const ids = alive(), by = f => ids.map(id => [id, f(id)]).sort((a, b) => b[1] - a[1]).slice(0, 40).map(x => x[0]);
  RKC = { d: S.day, w: S.wid, g: by(id => S.c[id].gdp), p: by(id => power(S.c[id])), r: by(repOf) };
  return RKC;
}
// every three months: remember the rankings, so the world view can show who rises and who falls
function worldSnap() {
  RKC.d = -1; const r = ranks(), cur = { g: r.g.slice(), p: r.p.slice(), r: r.r.slice(), d: S.day };
  const h = (S.wh && Array.isArray(S.wh.h)) ? S.wh.h : (S.wh && S.wh.cur ? [S.wh.cur] : []);
  h.push(cur); while (h.length > 5) h.shift();
  S.wh = { h, prev: h[0], cur }; // prev = about a year ago
}

/* ================= random events: a data table ================= */
// effects: ap/rep (now), m (money as a share of GDP: − = cost), cash (bn), gdp (share), gv+gd (growth per year for gd days),
// at+ad (approval target for ad days), ro/ro2 (relations with the other country), rd (relations with all democracies),
// un (anger in the street), mil {kind: share lost}, pop (share). A choice may also have f(ctx) and need(ctx).
const fnv = (v, c) => typeof v === 'function' ? v(c) : v;
const C_ = (l, e, o) => Object.assign({ l, e: e || {} }, o || {});
const notMe = x => x !== S.player && S.c[x] && S.c[x].alive;
const pk = l => l && l.length ? pick(l) : null;
// how the other country of an event is chosen
const EVO = {
  nb: () => pk(neighborsOf(S.player).filter(x => notMe(x) && !atWar(x, S.player))),
  nbh: () => pk(neighborsOf(S.player).filter(x => notMe(x) && !atWar(x, S.player) && rel(x, S.player) < 0)),
  riv: () => pk(alive().filter(x => notMe(x) && S.c[x].gdp > 5 && rel(x, S.player) < -25 && !atWar(x, S.player)).sort((a, b) => rel(a, S.player) - rel(b, S.player)).slice(0, 8)),
  fr: () => pk(alive().filter(x => notMe(x) && rel(x, S.player) > 30 && !atWar(x, S.player))),
  frna: () => pk(alive().filter(x => notMe(x) && rel(x, S.player) > 40 && !isAlly(x, S.player) && !atWar(x, S.player) && !warsOf(x).length && S.c[x].gdp > 20)),
  big: () => pk([...bigSet()].filter(x => notMe(x) && !atWar(x, S.player))),
  bigtr: () => pk([...bigSet()].filter(x => notMe(x) && !atWar(x, S.player) && rel(x, S.player) < 30)),
  any: () => pk(alive().filter(x => notMe(x) && S.c[x].gdp > 5)),
  authbig: () => pk(alive().filter(x => notMe(x) && S.c[x].gov === 'authoritarian' && S.c[x].gdp > 300 && !atWar(x, S.player))),
  weak: () => pk(alive().filter(x => notMe(x) && S.c[x].gov !== 'democracy' && S.c[x].approval < 40 && !atWar(x, S.player))),
  poorany: () => pk(alive().filter(x => notMe(x) && S.c[x].gdp / S.c[x].pop < 4)),
  poorfr: () => pk(alive().filter(x => notMe(x) && S.c[x].gdp / S.c[x].pop < 8 && rel(x, S.player) > 10 && !atWar(x, S.player))),
  torn: () => pk(S.wars.filter(w => w.pause === 0 && !involvesPlayer(w)).map(w => w.f >= 0 ? w.b : w.a).filter(notMe)),
  pariah: () => pk(alive().filter(x => notMe(x) && S.c[x].gdp > 20 && !atWar(x, S.player) && (hated(x) || (S.c[x].gov === 'authoritarian' && worldView(x) < 0)))),
  buyer: () => pk(alive().filter(x => notMe(x) && rel(x, S.player) > 15 && S.c[x].gdp > 10 && !atWar(x, S.player))),
  seller: () => pk([...bigSet()].filter(x => notMe(x) && rel(x, S.player) > 0 && S.c[x].inv.air > 200)),
  risky: () => pk(alive().filter(x => notMe(x) && (S.c[x].gdp / S.c[x].pop < 4 || rel(x, S.player) < -30) && !atWar(x, S.player))),
  nukeauth: () => pk(alive().filter(x => notMe(x) && S.c[x].nukes > 0 && S.c[x].gov !== 'democracy')),
  aiwar: () => { const w = pk(S.wars.filter(w => w.pause === 0 && !involvesPlayer(w))); return w ? [w.a, w.b] : null; },
  aipair: () => { for (let i = 0; i < 6; i++) { const a = pk(alive().filter(notMe)); const b = a && pk(neighborsOf(a).filter(x => notMe(x) && rel(a, x) < -10 && !atWar(a, x))); if (b) return [a, b]; } return null; },
  pw2: () => { const l = alive().filter(notMe).sort((a, b) => power(S.c[b]) - power(S.c[a])).slice(0, 8); if (l.length < 2) return null; const a = pick(l); return [a, pick(l.filter(x => x !== a))]; }
};
const anyCorrupt = () => MIN_ORDER.some(r => minOf(r) && minOf(r).tr === 'corrupt');
const EV = [
  /* ---------- at home: strikes and protests ---------- */
  { id: 'strike_gen', c: 'dom', w: 3, r: 'fin', t: 'שביתה כללית', x: c => 'ההסתדרויות הכריזו על שביתה כללית ב' + c.he + ': נמלים, רכבות ומשרדי ממשלה סגורים. הן דורשות העלאת שכר במגזר הציבורי.',
    ch: [C_('לתת את ההעלאה', { m: -0.002, ap: 3 }), C_('פשרה: חצי מהדרישה', { m: -0.001, ap: 1 }), C_('לשבור את השביתה', { ap: -4, un: 1, gdp: -0.002 })] },
  { id: 'strike_doc', c: 'dom', w: 2, r: 'fin', t: 'שביתת רופאים', x: 'רופאי בתי החולים שובתים בגלל עומס ומחסור בתקנים. ניתוחים נדחים והתורים מתארכים.',
    ch: [C_('להוסיף תקנים ותקציב', { m: -0.0012, ap: 2 }), C_('צו ריתוק לרופאים', { ap: -2, rep: -1 }), C_('לחכות שזה יעבור', { ap: -2, at: -2, ad: 120 })] },
  { id: 'strike_port', c: 'dom', w: 2, r: 'fin', ok: c => c.sea, t: 'שביתה בנמלים', x: 'עובדי הנמלים השביתו את הייצוא והייבוא. מכולות נערמות והמחירים בחנויות עולים.',
    ch: [C_('להיענות לדרישות', { m: -0.0006, ap: 1 }), C_('להפריט את הנמלים', { m: 0.002, ap: -3, gv: 0.002, gd: 730 }), C_('לסרב', { gdp: -0.003, ap: -1 })] },
  { id: 'strike_teach', c: 'dom', w: 2, r: 'fin', t: 'שביתת מורים', x: 'המורים לא נכנסים לכיתות עד שיקבלו העלאת שכר. ההורים זועמים — על כולם.',
    ch: [C_('העלאת שכר למורים', { m: -0.001, ap: 2, gv: 0.001, gd: 1095 }), C_('קיצור חופשות במקום כסף', { ap: -1 }), C_('לסרב', { ap: -3 })] },
  { id: 'prot_cost', c: 'dom', w: c => (c.rec || S.p.tax > 0.32 ? 4 : 1.5), r: 'fin', t: 'מחאת יוקר המחיה', x: 'מאות אלפים יצאו לרחובות נגד מחירי הדיור, המזון והדלק. "אי אפשר לגמור את החודש".',
    ch: [C_('להוריד מע״מ על מזון', { m: -0.003, ap: 4 }), C_('סבסוד ממוקד למשפחות', { m: -0.0012, ap: 2 }), C_('להתעלם', { ap: -3, un: 1 })] },
  { id: 'prot_judic', c: 'dom', w: 2, ok: c => c.dem, t: 'מחאה נגד רפורמה משפטית', x: 'הצעת חוק לצמצום סמכויות בית המשפט העליון הוציאה מאות אלפים להפגין. כלכלנים מזהירים מבריחת משקיעים.',
    ch: [C_('להקפיא את הרפורמה', { ap: 2, rep: 1 }), C_('להמשיך בכל הכוח', { ap: -4, un: 1, rep: -3, gv: -0.003, gd: 365 }), C_('להציע משאל עם', { m: -0.0002, ap: 1 })] },
  { id: 'prot_climate', c: 'dom', w: c => c.rich ? 2.5 : 1, r: 'int', t: 'מחאת אקלים', x: 'צעירים חוסמים כבישים ודורשים מהממשלה לסגור את תחנות הכוח המזהמות.',
    ch: [C_('תוכנית אנרגיה ירוקה', { m: -0.002, ap: 2, rep: 3 }), C_('הבטחה לוועדה', { ap: 1 }), C_('לפנות את החסימות', { ap: -1, rep: -1 })] },
  { id: 'prot_stud', c: 'dom', w: 1.5, r: 'int', t: 'מחאת סטודנטים', x: 'סטודנטים השתלטו על הקמפוסים בדרישה לבטל את שכר הלימוד.',
    ch: [C_('לימודים חינם', { m: -0.0015, ap: 3, gv: 0.002, gd: 1095 }), C_('מלגות לנזקקים', { m: -0.0005, ap: 1 }), C_('לסרב', { ap: -2 })] },
  { id: 'prot_minor', c: 'dom', w: 1.5, t: 'מחאת מיעוטים', x: 'בני מיעוט במדינה מפגינים נגד אפליה בתקציבים ובשיטור. התמונות מגיעות לעיתונות העולמית.',
    ch: [C_('להיענות לדרישות', { m: -0.0008, ap: -1, rep: 3 }), C_('דיאלוג וועדה ציבורית', { rep: 1 }), C_('יד קשה של המשטרה', { ap: 1, rep: -4, un: 1 })] },
  { id: 'prot_farm', c: 'dom', w: 1.5, r: 'fin', t: 'מחאת החקלאים', x: 'טרקטורים חוסמים את הכניסות לבירה: החקלאים דורשים הגנה מפני ייבוא זול.',
    ch: [C_('סובסידיות לחקלאים', { m: -0.0008, ap: 2 }), C_('מכסים על ייבוא', { ap: 1, gv: -0.001, gd: 365 }), C_('לפתוח את השוק', { ap: -2, gv: 0.002, gd: 730 })] },
  { id: 'prot_vets', c: 'dom', w: c => (S.p.casTotal > 1 || c.war ? 2.5 : 0), r: 'def', t: 'מחאת הלוחמים המשוחררים', x: 'לוחמים פצועים ומשפחות שכולות מפגינים מול משרד הביטחון: "הפקרתם אותנו".',
    ch: [C_('מענק ותוכנית שיקום', { m: -0.001, ap: 3 }), C_('להבטיח בדיקה', { ap: -1 }), C_('להתעלם', { ap: -3 })] },
  /* ---------- politics and scandals ---------- */
  { id: 'scan_pm', c: 'dom', w: 2, t: 'חקירה בלשכה', x: 'עוזר בכיר בלשכתך נחקר בחשד לקבלת שוחד מאיל הון. העיתונים שואלים מה ידעת.',
    ch: [C_('לפטר את העוזר מיד', { ap: -1 }), C_('להכחיש ולתקוף את התקשורת', { ap: -2, at: -2, ad: 120, rep: -1 }), C_('ועדת חקירה עצמאית', { m: -0.0002, ap: 1, rep: 1 })] },
  { id: 'scan_arms', c: 'dom', w: 1.5, r: 'def', t: 'שחיתות בעסקת נשק', x: 'תחקיר חושף: קצינים קיבלו עמלות סודיות מיצרנית נשק זרה.',
    ch: [C_('לבטל את העסקה', { m: 0.0005, ap: 2, mil: { air: 0.01 } }), C_('להשאיר את העסקה ולפטר את הקצינים', { ap: 1 }), C_('לטשטש', { ap: -3, rep: -2 })] },
  { id: 'coal_crisis', c: 'dom', w: c => c.dem ? 2 : 0, t: 'משבר קואליציוני', x: 'מפלגה שותפה מאיימת לפרק את הממשלה אם לא תקבל תקציב למגזר שלה.',
    ch: [C_('לתת את התקציב', { m: -0.001, ap: -1 }), C_('לקרוא לבלוף', { ap: -2, un: 0.5 }), C_('להחליף שותפים', { ap: 1, at: -1, ad: 90 })] },
  { id: 'early_elec', c: 'dom', w: c => (c.dem && c.ap > 52 ? 1.5 : 0), cd: 900, t: 'בחירות מוקדמות?', x: 'הסקרים מחייכים אליך. היועצים ממליצים להקדים את הבחירות ולקבל מנדט חזק.',
    ch: [C_('להקדים בחירות', { m: -0.0003, at: 3, ad: 365 }), C_('לא עכשיו', {})] },
  { id: 'media_law', c: 'dom', w: c => c.dem ? 0.5 : 2, t: 'עיתונאי ביקורתי נעצר', x: 'עיתונאי שחשף שחיתות נעצר באשמת "פגיעה בביטחון". ארגוני זכויות בעולם מוחים.',
    ch: [C_('לשחרר אותו', { rep: 3, ap: -1 }), C_('להעמיד לדין', { rep: -4, ap: 1 }), C_('לגרש אותו מהמדינה', { rep: -1 })] },
  { id: 'relig', c: 'dom', w: 1.5, t: 'מתיחות דתית', x: 'עימותים סביב מקום קדוש מאיימים להצית אלימות בין קהילות.',
    ch: [C_('להגביל את הגישה', { ap: 1, rep: -2 }), C_('פסגת מנהיגי דת', { rep: 2, ap: -1 }), C_('לפרוס כוחות משטרה', { m: -0.0003, ap: 1, un: 0.5 })] },
  { id: 'pension', c: 'dom', w: 1.5, r: 'fin', t: 'רפורמת פנסיה', x: 'קרנות הפנסיה בגירעון. משרד האוצר מציע להעלות את גיל הפרישה.',
    ch: [C_('להעלות את גיל הפרישה', { m: 0.003, ap: -4 }), C_('רפורמה מתונה', { m: 0.001, ap: -1 }), C_('לא לגעת', { gv: -0.002, gd: 730 })] },
  { id: 'surplus', c: 'dom', w: c => (c.tr > c.gdp * 0.06 ? 3 : 0), r: 'fin', t: 'עודף בקופה', x: c => 'הקופה מלאה: ' + moneyTxt(S.p.treasury) + '. מה עושים עם הכסף?',
    ch: [C_('החזר מס לאזרחים', { m: -0.004, ap: 4 }), C_('קרן תשתיות', { m: -0.004, gv: 0.004, gd: 1095 }), C_('לשמור לימים קשים', { rep: 1 })] },
  { id: 'downgrade', c: 'dom', w: c => (c.debt > 0.4 ? 3 : 0), r: 'fin', t: 'הורדת דירוג אשראי', x: 'סוכנויות הדירוג הורידו את דירוג החוב שלנו. הריבית על ההלוואות קופצת.',
    ch: [C_('תוכנית קיצוצים', { m: 0.004, ap: -4 }), C_('להעלות מסים זמנית', { m: 0.003, ap: -2, gv: -0.002, gd: 365 }), C_('להתעלם', { gv: -0.006, gd: 365 })] },
  { id: 'coup_plot', c: 'dom', w: c => (!c.dem && c.ap < 40 ? 3 : c.ap < 30 ? 1 : 0), r: 'def', t: 'מזימת הפיכה נחשפה', x: 'המודיעין חשף קבוצת קצינים שתכננה להפיל את השלטון.',
    ch: [C_('טיהור בצבא', { mil: { troops: 0.02 }, ap: 1, rep: -2 }), C_('העלאת שכר לקצינים', { m: -0.0015 }), C_('משפט פומבי', { ap: 2, rep: -1, un: 0.5 })] },
  { id: 'assass', c: 'dom', w: 1.2, o: 'riv', oOpt: 1, t: 'ניסיון התנקשות', x: c => 'המאבטחים סיכלו ניסיון להתנקש בחייך באירוע פומבי. ' + (c.o ? 'החשד: ידה של ' + c.on + '.' : 'המניע לא ברור.'),
    ch: [C_('נאום אחדות לאומית', { ap: 4 }), C_('מצב חירום וסמכויות מיוחדות', { ap: 2, rep: -3, un: 0.5 }), C_(c => c.o ? 'להאשים את ' + c.on : 'להאשים את האופוזיציה', { ap: 3, ro: -15, un: 0.5 })] },
  /* ---------- security ---------- */
  { id: 'terror', c: 'dom', w: c => c.war ? 3 : 1.5, r: 'def', t: 'פיגוע טרור', x: 'פיגוע בלב העיר: עשרות הרוגים ופצועים. המדינה בהלם והציבור דורש תגובה.', b: { ap: -1 },
    ch: [C_('הידוק האבטחה בכל הארץ', { m: -0.001, ap: 2, gv: -0.001, gd: 180 }), C_('לשמור על השגרה', { rep: 1, ap: -1 }), C_('עוצר ומעצרים המוניים', { ap: 1, rep: -3, un: 0.5 })] },
  { id: 'cyber_dom', c: 'dom', w: 2, r: 'def', o: 'riv', oOpt: 1, t: 'מתקפת סייבר', x: c => 'האקרים השביתו את מערכות הבנקים ובתי החולים' + (c.o ? '. העקבות מובילים ל' + c.on + '.' : '.'),
    ch: [C_('לשלם כופר', { m: -0.0004, rep: -1 }), C_('לבנות מחדש את המערכות', { m: -0.0015, gdp: -0.001 }), C_('תקיפת סייבר נגדית', { ap: 2, ro: -12 }, { need: c => !!c.o })] },
  { id: 'mil_acc', c: 'dom', w: 1.5, r: 'def', t: 'תאונה צבאית', x: 'מסוק צבאי התרסק באימון לילה. הצוות נהרג, ומשפחות שואלות על תחזוקה כושלת.', b: { mil: { heli: 0.01, troops: 0.0002 } },
    ch: [C_('ועדת חקירה וקרקוע הצי', { ap: 1, m: -0.0002 }), C_('להחליף את מפקד חיל האוויר', { ap: 1 }), C_('להמשיך כרגיל', { ap: -2 })] },
  { id: 'spy', c: 'dom', w: 1.5, r: 'fo', o: 'riv', t: 'מרגל נתפס', x: c => 'שירות הביטחון עצר מרגל שעבד עבור ' + c.on + ' ומסר סודות צבאיים.',
    ch: [C_('לגרש את הדיפלומטים שלהם', { ro: -10, ap: 2 }), C_('עסקת חילופים שקטה', { ro: 4, ap: -1 }), C_('משפט ראווה', { ro: -15, ap: 3, rep: 1 })] },
  { id: 'defect', c: 'dom', w: 1.2, r: 'def', o: 'riv', t: 'עריק מבקש מקלט', x: c => 'קצין בכיר מצבא ' + c.on + ' ערק אלינו עם מסמכים סודיים.',
    ch: [C_('להעניק מקלט', { ro: -12, ap: 1 }), C_('להחזיר אותו', { ro: 8, ap: -2, rep: -2 })] },
  { id: 'border_inc', c: 'dom', w: 2, r: 'def', o: 'nbh', t: 'תקרית ירי בגבול', x: c => 'חיילים שלנו וחיילים של ' + c.on + ' החליפו אש בגבול. יש נפגעים לשני הצדדים.', b: { mil: { troops: 0.0001 } },
    ch: [C_('תגובה צבאית חריפה', { ro: -15, ap: 2 }), C_('מחאה דיפלומטית', { ap: -1 }), C_('פגישת מפקדים להרגעה', { ro: 6, rep: 2, ap: -1 })] },
  { id: 'water', c: 'dom', w: 1.2, r: 'fo', o: 'nb', t: 'סכסוך מים', x: c => c.on + ' בונה סכר שיקטין את המים שזורמים אלינו.',
    ch: [C_('הסכם חלוקת מים', { ro: 10, ap: -1 }), C_('איום צבאי', { ro: -18, ap: 2 }), C_('בוררות בינלאומית', { rep: 2, m: -0.0002 })] },
  { id: 'hostage', c: 'intl', w: 1.2, r: 'def', o: 'risky', t: 'משבר חטופים', x: c => 'אזרחים שלנו נחטפו ב' + c.on + ' על ידי קבוצה חמושה שדורשת כופר.',
    ch: [C_('לשלם בשקט', { m: -0.0004, ap: 2, rep: -1 }), C_('מבצע חילוץ', { ap: 4, ro: -12, mil: { troops: 0.0002 } }), C_('משא ומתן ארוך', { ap: -2, rep: 1 })] },
  { id: 'embassy', c: 'intl', w: 1.2, r: 'fo', o: 'riv', t: 'השגרירות שלנו הותקפה', x: c => 'המון זועם פרץ לשגרירות שלנו ב' + c.on + '. הדיפלומטים פונו בבהלה.',
    ch: [C_('לדרוש התנצלות', { ro: -8, ap: 1 }), C_('לנתק יחסים', { ro: -25, ap: 2, rep: -1 }), C_('להרגיע ולחזור', { ap: -1, rep: 1 })] },
  { id: 'piracy', c: 'intl', w: c => c.sea ? 1.5 : 0, r: 'def', t: 'פיראטים חטפו ספינה', x: 'פיראטים השתלטו על ספינת משא שלנו עם 20 אנשי צוות.',
    ch: [C_('הצי יחלץ אותם', { ap: 3, rep: 1, mil: { ships: 0.002 } }, { need: () => P().inv.ships >= 1 }), C_('לשלם כופר', { m: -0.0003, ap: -1 }), C_('משא ומתן דרך מתווכים', { ap: -2, rep: 1 })] },
  /* ---------- disasters and health ---------- */
  { id: 'quake', c: 'dom', w: 1.2, r: 'int', t: 'רעידת אדמה', x: 'רעידת אדמה חזקה פגעה בעיר גדולה. בניינים קרסו ואלפים נותרו בלי בית.', b: { gdp: -0.006 },
    ch: [C_('שיקום מלא ומהיר', { m: -0.004, ap: 3 }), C_('שיקום בסיסי', { m: -0.0015, ap: -1 }), C_('לבקש סיוע מהעולם', { m: 0.001, ap: -2, rep: -1 })] },
  { id: 'flood', c: 'dom', w: 1.5, r: 'int', t: 'שיטפונות', x: 'גשמים חסרי תקדים הציפו כפרים ושכונות שלמות.', b: { gdp: -0.003 },
    ch: [C_('פיצוי מלא לנפגעים', { m: -0.002, ap: 2 }), C_('לבנות סוללות הגנה', { m: -0.0025, gv: 0.001, gd: 1095 }), C_('מינימום הכרחי', { ap: -2 })] },
  { id: 'fire', c: 'dom', w: 1.5, r: 'int', t: 'שריפת ענק', x: 'שריפה עצומה משתוללת ביערות ומתקרבת לערים.', b: { gdp: -0.002 },
    ch: [C_('לקנות מטוסי כיבוי', { m: -0.0008, ap: 2 }), C_('לבקש מטוסים ממדינות שכנות', { rep: -1, ap: 1 }), C_('להסתדר עם מה שיש', { ap: -3, gdp: -0.002 })] },
  { id: 'drought', c: 'dom', w: 1.2, r: 'int', t: 'בצורת', x: 'שנה שלישית ללא גשם. המאגרים ריקים והחקלאות קורסת.',
    ch: [C_('מתקני התפלה', { m: -0.003, gv: 0.001, gd: 1095, ap: 1 }), C_('קיצוב מים', { ap: -2, gv: -0.003, gd: 365 }), C_('לייבא מזון ומים', { m: -0.001 })] },
  { id: 'storm', c: 'dom', w: 1.2, r: 'int', t: 'סופה הרסנית', x: 'סופה עוצמתית הרסה גגות, קווי חשמל וכבישים.', b: { gdp: -0.002 },
    ch: [C_('קרן חירום', { m: -0.0015, ap: 2 }), C_('ביטוח ממשלתי חדש', { m: -0.0006, at: 1, ad: 180 }), C_('שהעיריות יטפלו', { ap: -2 })] },
  { id: 'epid', c: 'dom', w: 1.2, r: 'int', t: 'התפרצות מגפה', x: 'נגיף חדש מתפשט בבתי הספר ובבתי האבות.',
    ch: [C_('סגר כללי', { gv: -0.01, gd: 120, ap: -2, rep: 1 }), C_('חיסונים ובדיקות', { m: -0.0015, ap: 1 }), C_('להמשיך כרגיל', { ap: -3, at: -2, ad: 90, pop: -0.0003 })] },
  { id: 'locust', c: 'dom', w: c => c.poor ? 1.5 : 0, t: 'ארבה', x: 'נחילי ארבה השמידו חלק גדול מהיבול.', b: { gdp: -0.004 },
    ch: [C_('ריסוס מהאוויר', { m: -0.0008, ap: 1 }), C_('לבקש סיוע מזון', { m: 0.0006, rep: -1 }), C_('לחכות', { ap: -3 })] },
  { id: 'nucleak', c: 'dom', w: c => (c.rich || c.nukes ? 0.8 : 0), r: 'int', t: 'דליפה בכור', x: 'תקלה בכור גרעיני אזרחי גרמה לדליפת קרינה קטנה.',
    ch: [C_('פינוי והודעה לעולם', { m: -0.0015, rep: 1, ap: -1 }), C_('להצניע את האירוע', { rep: -3, ap: -1 }), C_('לסגור את הכור לצמיתות', { m: -0.002, gv: -0.001, gd: 730, ap: 1, rep: 2 })] },
  { id: 'oilspill', c: 'dom', w: c => c.sea ? 1 : 0, t: 'זיהום ים', x: 'מכלית נפט דלפה מול החופים. החופים שחורים מזפת.',
    ch: [C_('ניקוי ממלכתי', { m: -0.001, ap: 1, rep: 1 }), C_('לתבוע את חברת הספנות', { m: 0.0005, ap: -1 }), C_('מתנדבים בלבד', { ap: -2, rep: -1 })] },
  { id: 'datal', c: 'dom', w: 1.2, r: 'int', t: 'דליפת מידע ענקית', x: 'הפרטים האישיים של מיליוני אזרחים דלפו לרשת ממאגר ממשלתי.',
    ch: [C_('פיצוי לאזרחים ושדרוג אבטחה', { m: -0.0008, ap: 1 }), C_('להאשים את ההאקרים', { ap: -2 }), C_('לפטר את ראש המערך', { ap: 1, rep: 0 })] },
  /* ---------- economy and society ---------- */
  { id: 'inflation', c: 'dom', w: c => (c.rec ? 1 : 2), r: 'fin', t: 'האינפלציה מזנקת', x: 'המחירים עלו ב-8% בחצי שנה. הבנק המרכזי מתלבט.',
    ch: [C_('להעלות ריבית', { gv: -0.006, gd: 365, ap: -1 }), C_('פיקוח מחירים', { ap: 2, gv: -0.004, gd: 365, rep: -1 }), C_('קיצוץ בהוצאות', { m: 0.002, ap: -3 })] },
  { id: 'crash', c: 'dom', w: 1.2, r: 'fin', t: 'קריסה בבורסה', x: 'הבורסה צנחה ב-20% ביום אחד. משקיעים בורחים.',
    ch: [C_('חבילת חילוץ', { m: -0.004, ap: -1, gdp: 0.002 }), C_('לתת לשוק לתקן את עצמו', { gdp: -0.005, ap: -2 }), C_('לעצור את המסחר לשבוע', { gdp: -0.002, rep: -1 })] },
  { id: 'bank', c: 'dom', w: 1, r: 'fin', t: 'בנק גדול קורס', x: 'אחד הבנקים הגדולים על סף פשיטת רגל. מיליוני חוסכים מודאגים.',
    ch: [C_('הלאמה וחילוץ', { m: -0.003, ap: 1 }), C_('ערבות לחוסכים בלבד', { m: -0.001, gdp: -0.002 }), C_('לתת לו ליפול', { gdp: -0.005, ap: -3 })] },
  { id: 'currency', c: 'dom', w: c => (c.poor || c.debt > 0.5 ? 2 : 0), r: 'fin', t: 'המטבע קורס', x: 'המטבע המקומי איבד שליש מערכו. היבוא מתייקר.',
    ch: [C_('הלוואה מקרן המטבע', { m: 0.01, ap: -3, rep: -1, gv: -0.003, gd: 365 }), C_('להדפיס כסף', { ap: 1, gv: -0.006, gd: 365 }), C_('פיקוח על הון', { rep: -2, gdp: -0.002 })] },
  { id: 'housing', c: 'dom', w: 2, r: 'int', t: 'משבר הדיור', x: 'מחירי הדירות הכפילו את עצמם. זוגות צעירים לא מצליחים לקנות בית.',
    ch: [C_('בנייה ממשלתית מאסיבית', { m: -0.0025, ap: 3 }), C_('פיקוח על שכר הדירה', { ap: 2, gv: -0.002, gd: 365 }), C_('לא להתערב', { ap: -3, un: 0.5 })] },
  { id: 'blackout', c: 'dom', w: 1.5, r: 'int', t: 'הפסקת חשמל ארצית', x: 'רשת החשמל קרסה ל-30 שעות. מפעלים נעצרו ומעליות נתקעו.', b: { gdp: -0.001 },
    ch: [C_('לחדש את רשת החשמל', { m: -0.002, ap: 1, gv: 0.001, gd: 1095 }), C_('תיקון זמני', { ap: -2, at: -1, ad: 120 }), C_('להפריט את חברת החשמל', { m: 0.002, ap: -2 })] },
  { id: 'crime', c: 'dom', w: 1.5, r: 'int', t: 'גל פשיעה', x: 'ירי ברחובות, סחיטה וגניבות: ארגוני הפשיעה מתחזקים.',
    ch: [C_('עוד שוטרים ברחובות', { m: -0.001, ap: 2 }), C_('חוקים מחמירים', { ap: 1, rep: -2 }), C_('תוכניות חברתיות בשכונות', { m: -0.0012, at: 2, ad: 365 })] },
  { id: 'braindrain', c: 'dom', w: 1.2, r: 'fin', t: 'בריחת מוחות', x: 'אלפי מהנדסים ורופאים עוזבים לחו״ל בגלל שכר נמוך.',
    ch: [C_('מענקים לחוזרים', { m: -0.001, gv: 0.002, gd: 730 }), C_('הטבות מס לחברות טכנולוגיה', { m: -0.0006, gv: 0.0015, gd: 730 }), C_('לא לעשות כלום', { gv: -0.003, gd: 730 })] },
  { id: 'immig', c: 'dom', w: 1.5, t: 'גל הגירה', x: 'עשרות אלפי מהגרים מבקשים להיכנס למדינה לעבודה.',
    ch: [C_('לקלוט ולשלב', { m: -0.001, ap: -1, rep: 2, gv: 0.003, gd: 1095, pop: 0.003 }), C_('מכסות מוגבלות', { ap: 1, gv: 0.001, gd: 730, pop: 0.001 }), C_('לסגור את הגבולות', { ap: 2, rep: -3 })] },
  { id: 'labor', c: 'dom', w: c => c.rich ? 1.5 : 0.5, r: 'fin', t: 'מחסור בעובדים', x: 'מפעלים ובתי חולים לא מוצאים עובדים. הייצור נפגע.',
    ch: [C_('לייבא עובדים זרים', { gv: 0.003, gd: 730, ap: -1 }), C_('סבסוד רובוטים ואוטומציה', { m: -0.001, gv: 0.002, gd: 730 }), C_('להעלות שכר במגזר הציבורי', { m: -0.0012, ap: 2 })] },
  { id: 'ai_jobs', c: 'dom', w: c => c.rich ? 1.5 : 0.6, r: 'fin', t: 'אוטומציה מחליפה עובדים', x: 'בינה מלאכותית מחליפה עשרות אלפי עובדי משרד. הם דורשים הגנה.',
    ch: [C_('הסבה מקצועית במימון המדינה', { m: -0.0015, ap: 2, gv: 0.001, gd: 730 }), C_('מס על רובוטים', { m: 0.001, gv: -0.002, gd: 730 }), C_('לא להתערב', { ap: -2, gv: 0.002, gd: 730 })] },
  { id: 'invest', c: 'dom', w: 1.5, r: 'fin', t: 'ענקית טכנולוגיה רוצה מפעל', x: 'חברה בינלאומית מציעה לבנות מפעל שבבים ענק — אם תקבל פטור ממס.',
    ch: [C_('לתת פטור', { m: -0.001, gv: 0.004, gd: 1095, ap: 1 }), C_('לנהל משא ומתן', { gv: 0.002, gd: 1095 }), C_('לסרב', { ap: -1 })] },
  { id: 'gas', c: 'dom', w: c => c.sea ? 1.2 : 0.4, r: 'fin', cd: 900, t: 'תגלית גז גדולה', x: 'נמצא מאגר גז טבעי ענק. מי יפיק אותו?',
    ch: [C_('חברה ממשלתית', { m: -0.003, gv: 0.006, gd: 1095, ap: 2 }), C_('מכירת זיכיון לזרים', { m: 0.005, gv: 0.003, gd: 1095, ap: -1 }), C_('להשאיר באדמה (סביבה)', { rep: 3, ap: -1 })] },
  { id: 'minerals', c: 'dom', w: 1, r: 'fin', o: 'big', cd: 900, t: 'מרבצי ליתיום', x: 'גיאולוגים מצאו מרבצי ליתיום ומתכות נדירות. כל המעצמות מתעניינות.',
    ch: [C_(c => 'עסקה עם ' + c.on, { m: 0.004, ro: 15, gv: 0.003, gd: 1095 }), C_('לפתח לבד', { m: -0.002, gv: 0.005, gd: 1460 }), C_('מכרז פתוח לכולם', { m: 0.002, gv: 0.003, gd: 1095, rep: 1 })] },
  { id: 'tech', c: 'dom', w: 1.2, r: 'int', t: 'פריצת דרך מדעית', x: 'חוקרים במדינה פיתחו טיפול חדשני שמושך תשומת לב עולמית.',
    ch: [C_('מעבדה לאומית', { m: -0.0015, gv: 0.003, gd: 1095, ap: 1 }), C_('למכור את הפטנט', { m: 0.002 }), C_('לשתף חינם עם העולם', { rep: 4, ap: 1 })] },
  { id: 'host', c: 'dom', w: c => (c.gdp > 300 ? 1 : 0), cd: 1500, r: 'int', t: 'לארח את המשחקים האולימפיים?', x: 'הוועד האולימפי מציע לנו לארח את המשחקים. יוקרה עצומה — ומחיר עצום.',
    ch: [C_('להגיש מועמדות', { m: -0.004, ap: 3, rep: 3, gv: 0.002, gd: 730 }), C_('לוותר', {})] },
  { id: 'sell_arms', c: 'intl', w: c => (power(P()) > 150 ? 1.5 : 0), r: 'def', o: 'buyer', t: 'בקשה לקנות נשק', x: c => c.on + ' מבקשת לקנות מאיתנו מערכות נשק מתקדמות.',
    ch: [C_('למכור', { m: 0.002, ro: 10, rep: -2 }), C_('למכור רק נשק הגנתי', { m: 0.0008, ro: 5 }), C_('לסרב', { ro: -5, rep: 1 })] },
  { id: 'arms_offer', c: 'intl', w: 1.5, r: 'def', o: 'seller', t: 'הצעת רכש בהנחה', x: c => c.on + ' מציעה לנו 12 מטוסי קרב בהנחה של 30% — מסירה תוך 8 חודשים.',
    ch: [C_('לקנות', { cash: -0.67, ro: 8 }, { f: () => { S.p.queue.push({ k: 'air', n: 12, start: S.day, due: S.day + 243 }); PS().sp.buy += 0.67; }, need: () => !S.p.bankrupt }), C_('לסרב בנימוס', { ro: -2 })] },
  /* ---------- good news at home (news only) ---------- */
  { id: 'olymp', c: 'dom', w: 1.5, t: 'מדליית זהב אולימפית', n: c => 'מדליית זהב היסטורית ל' + c.he + ' באולימפיאדה! המדינה חוגגת.', e: { ap: 2 }, k: 'good' },
  { id: 'wcup', c: 'dom', w: 1.2, t: 'הנבחרת בחצי הגמר', n: 'נבחרת הכדורגל הגיעה לחצי גמר המונדיאל. מיליונים חוגגים ברחובות.', e: { ap: 3, at: 1, ad: 60 }, k: 'good' },
  { id: 'song', c: 'dom', w: 1, t: 'זכייה בתחרות שירים', n: c => 'זמרת מ' + c.he + ' זכתה בתחרות שירים בינלאומית. התיירות מזנקת.', e: { ap: 1, rep: 1 }, k: 'good' },
  { id: 'nobel', c: 'dom', w: 0.8, t: 'פרס נובל', n: c => 'חוקרת מ' + c.he + ' זכתה בפרס נובל לכימיה.', e: { rep: 2, ap: 1 }, k: 'good' },
  { id: 'tour', c: 'dom', w: 1.2, t: 'שיא בתיירות', n: 'שנת שיא בתיירות: המלונות מלאים והמסעדות עמוסות.', e: { gdp: 0.002 }, k: 'good' },
  { id: 'bourse', c: 'dom', w: 1.2, t: 'הבורסה בשיא', n: 'הבורסה המקומית שוברת שיאים. הכנסות המדינה ממסים עולות.', e: { m: 0.0008, gdp: 0.002 }, k: 'good' },
  { id: 'harvest', c: 'dom', w: 1, t: 'יבול שיא', n: 'שנת יבול שיא לחקלאות. מחירי המזון יורדים.', e: { ap: 1, gdp: 0.001 }, k: 'good' },
  { id: 'oilfind', c: 'dom', w: 0.6, cd: 1500, t: 'נמצא נפט', n: 'נמצא שדה נפט חדש. חברות זרות עומדות בתור.', e: { gdp: 0.006, m: 0.001 }, k: 'good' },
  { id: 'celeb', c: 'dom', w: 1, t: 'סערת סלבריטאים', n: 'כוכב קולנוע מקומי נעצר אחרי מסיבה פרועה. הרשתות לא מדברות על שום דבר אחר.', k: 'event' },
  { id: 'viral', c: 'dom', w: 1, t: 'המטבח שלנו הפך ללהיט', n: c => 'המטבח של ' + c.he + ' הפך ללהיט ברשתות בעולם. מסעדות נפתחות בכל הבירות.', e: { rep: 1 }, k: 'good' },
  { id: 'space_dom', c: 'dom', w: c => c.gdp > 400 ? 1 : 0, t: 'לוויין לאומי שוגר', n: c => c.he + ' שיגרה בהצלחה לוויין תקשורת מתוצרת מקומית.', e: { ap: 2, rep: 1 }, k: 'good' },
  { id: 'parade', c: 'dom', w: c => c.dem ? 0 : 1, t: 'מצעד צבאי', n: 'מצעד צבאי ענק בבירה: טנקים, טילים ומטוסים מעל ההמונים.', e: { ap: 2, rep: -1, m: -0.0002 }, k: 'event' },
  { id: 'birth', c: 'dom', w: 0.8, t: 'שיא ילודה', n: 'שיא ילודה: חדרי הלידה מלאים, והממשלה מבטיחה עוד גני ילדים.', e: { pop: 0.002 }, k: 'good' },
  { id: 'heat', c: 'dom', w: 1, t: 'גל חום קיצוני', n: 'גל חום קיצוני: מערכת החשמל קורסת ובתי החולים מלאים.', e: { gdp: -0.001, ap: -1 }, k: 'bad' },
  { id: 'bridge', c: 'dom', w: 1, t: 'גשר קרס', n: 'גשר מרכזי קרס בשעת עומס. התקשורת מאשימה הזנחה של שנים.', e: { ap: -1, gdp: -0.0005 }, k: 'bad' },
  { id: 'acc_road', c: 'dom', w: 0.8, t: 'אסון דרכים', n: 'תאונת אוטובוס קשה גבתה חיי עשרות נוסעים. אבל לאומי.', e: { ap: -1 }, k: 'bad' },
  { id: 'gen_resign', c: 'dom', w: c => c.war ? 1 : 0.4, t: 'הרמטכ״ל התפטר', n: 'הרמטכ״ל התפטר בעקבות מחלוקת עם הממשלה על ניהול הצבא.', e: { ap: -1 }, k: 'bad' },
  /* ---------- the world ---------- */
  { id: 'coup_ab', c: 'intl', w: 1.6, r: 'fo', o: 'weak', t: c => 'הפיכה ב' + c.on, go: c => worldCoup(c.o), x: c => 'הצבא ב' + c.on + ' הדיח את הממשלה ותפס את השלטון. העולם צריך להחליט איך להגיב.',
    ch: [C_('להכיר בשלטון החדש', { ro: 10, rep: -2, rd: -2 }), C_('לגנות', { ro: -10, rep: 2 }), C_('להטיל סנקציות', { ro: -25, rep: 3, m: -0.0003 }, { f: c => { S.sanc[S.player + '>' + c.o] = 1; } })] },
  { id: 'oil_up', c: 'intl', w: 1.5, r: 'fin', ok: c => !c.oil, t: 'מחירי הנפט זינקו', go: oilShock(1), x: 'מחירי הנפט זינקו ב-40% אחרי מתיחות במפרץ. הדלק מתייקר בכל העולם.',
    ch: [C_('לשחרר את מאגרי החירום', { m: -0.001, ap: 1 }), C_('לסבסד את הדלק', { m: -0.002, ap: 2 }), C_('לגלגל לצרכנים', { ap: -3, gv: -0.003, gd: 180 })] },
  { id: 'oil_upx', c: 'intl', w: 1.5, ok: c => c.oil, t: 'מחירי הנפט זינקו', go: oilShock(1), n: 'מחירי הנפט זינקו ב-40%. הקופה שלנו מתמלאת.', e: { m: 0.003, gdp: 0.005 }, k: 'good' },
  { id: 'oil_dn', c: 'intl', w: 1.2, t: 'מחירי הנפט צנחו', go: oilShock(-1), n: c => 'מחירי הנפט צנחו בחדות. ' + (c.oil ? 'ההכנסות שלנו מהנפט נחתכות.' : 'הדלק זול יותר — טוב למשק שלנו.'), e: c => c.oil ? { gdp: -0.008, m: -0.002 } : { gdp: 0.002 }, k: c => c.oil ? 'bad' : 'good' },
  { id: 'g_rec', c: 'intl', w: c => (S.recession ? 0 : 1), cd: 900, r: 'fin', t: 'מיתון עולמי', go: () => { S.recession = 8; }, x: 'בנק ענק קרס, הבורסות צונחות והסחר העולמי מתכווץ.', b: { gdp: -0.004 },
    ch: [C_('חבילת תמריצים', { m: -0.006, ap: 2, gv: 0.01, gd: 240 }), C_('צנע וקיצוצים', { m: 0.002, ap: -3 }), C_('לחכות שזה יעבור', { ap: -1 })] },
  { id: 'pandemic', c: 'intl', w: 0.6, cd: 1500, r: 'int', t: 'מגפה עולמית', go: () => { alive().forEach(id => { if (id !== S.player) S.c[id].gdp *= 0.985; }); S.recession = Math.max(S.recession, 4); }, x: 'נגיף חדש מתפשט בכל היבשות. ארגון הבריאות מכריז על מגפה עולמית.',
    ch: [C_('סגר וסגירת גבולות', { gv: -0.015, gd: 180, ap: -1, rep: 1 }), C_('לקנות חיסונים מוקדם', { m: -0.003, ap: 2 }), C_('להשאיר את המשק פתוח', { ap: -2, pop: -0.001, rep: -2 })] },
  { id: 'cyberwar', c: 'intl', w: 1, r: 'def', o: 'pw2', t: 'מלחמת סייבר בין מעצמות', go: c => addRel(c.o, c.o2, -10), x: c => c.on + ' ו' + c.on2 + ' תוקפות זו את זו ברשת. גם המערכות שלנו נפגעות בדרך.', b: { gdp: -0.001 },
    ch: [C_('להשקיע בהגנת סייבר', { m: -0.001, ap: 1 }), C_(c => 'להצטרף להגנה של ' + c.on, { ro: 8, ro2: -10 }), C_('להישאר מחוץ לזה', {})] },
  { id: 'refugee', c: 'intl', w: 1.5, r: 'fo', o: 'torn', t: c => 'משבר פליטים: ' + c.on, x: c => 'משבר הומניטרי ב' + c.on + ': מאות אלפים בורחים, והאו״ם מבקש מכל מדינה לקלוט.',
    ch: [C_('לקלוט פליטים', { m: -0.001, ap: -2, rep: 5, ro: 6, pop: 0.001 }), C_('לממן מחנות באזור', { m: -0.0012, rep: 2 }), C_('לסגור את הגבול', { ap: 1, rep: -3 })] },
  { id: 'terror_ab', c: 'intl', w: 1.2, o: 'any', t: 'פיגוע בחו״ל', x: c => 'פיגוע טרור ב' + c.on + ' — בין ההרוגים גם תיירים מ' + c.he + '.',
    ch: [C_('מטוס חילוץ ומשלחת רפואית', { m: -0.0002, ap: 2, ro: 4 }), C_('הודעת תנחומים', { ap: -1 })] },
  { id: 'space_prog', c: 'intl', w: c => c.gdp > 1000 ? 1 : 0, cd: 1500, r: 'int', t: 'תוכנית חלל לאומית', x: 'המדענים מציעים לשלוח משימה לירח תוך חמש שנים. מירוץ החלל חזר.',
    ch: [C_('לאשר', { m: -0.003, rep: 3, ap: 2, gv: 0.002, gd: 1095 }), C_('לוותר', {})] },
  { id: 'climate', c: 'intl', w: 1.5, cd: 600, r: 'fo', t: 'פסגת האקלים', x: 'מנהיגי העולם מתכנסים לפסגת אקלים ודורשים התחייבות לקיצוץ בפליטות.',
    ch: [C_('התחייבות לקיצוץ גדול', { gv: -0.002, gd: 1095, rep: 5, rd: 3 }), C_('התחייבות סמלית', { rep: 1 }), C_('לעזוב את הפסגה', { rep: -4, ap: 1 })] },
  { id: 'sancwave', c: 'intl', w: 1.2, r: 'fo', o: 'pariah', go: c => sanctionWave(c.o), t: c => 'גל סנקציות על ' + c.on, x: c => 'הדמוקרטיות מטילות סנקציות על ' + c.on + '. גם מאיתנו מבקשים להצטרף.',
    ch: [C_('להצטרף לסנקציות', { ro: -15, rd: 4, m: -0.001 }, { f: c => { S.sanc[S.player + '>' + c.o] = 1; } }), C_('להישאר בחוץ', { rd: -3, m: 0.0005 })] },
  { id: 'ally_req', c: 'intl', w: 1, cd: 500, o: 'frna', t: c => 'הצעת ברית מ' + c.on, x: c => c.on + ' מציעה ברית הגנה הדדית: אם מישהו יתקוף צד אחד — השני יגן עליו.',
    ch: [C_('לחתום על הברית', { ro: 15, rep: 1 }, { f: c => { setPact(c.o, S.player, 'alliance', true); addNews('נחתמה ברית הגנה בין ' + P().he + ' ל' + c.on + '.', 'good'); } }), C_('לסרב בנימוס', { ro: -6 })] },
  { id: 'un_vote', c: 'intl', w: 1.5, r: 'fo', o: 'pariah', t: 'הצבעה באו״ם', x: c => 'העצרת הכללית מצביעה על החלטה שמגנה את ' + c.on + '.',
    ch: [C_('להצביע בעד', { ro: -8, rep: 2, rd: 2 }), C_('להימנע', {}), C_('להצביע נגד', { ro: 8, rep: -2, rd: -3 })] },
  { id: 'tariffs', c: 'intl', w: 1.2, r: 'fin', o: 'bigtr', t: c => 'מכסים מ' + c.on, x: c => c.on + ' הטילה מכסים של 25% על הסחורות שלנו.',
    ch: [C_('מכסים נגדיים', { ro: -12, ap: 2, gv: -0.002, gd: 365 }), C_('משא ומתן', { ro: 3, m: -0.0005 }), C_('לבלוע את זה', { gv: -0.003, gd: 365, ap: -1 })] },
  { id: 'loan_req', c: 'intl', w: 1.2, r: 'fo', o: 'poorfr', t: c => c.on + ' מבקשת הלוואה', x: c => 'ממשלת ' + c.on + ' על סף קריסה כלכלית ומבקשת מאיתנו הלוואה בתנאים נוחים.',
    ch: [C_('לתת הלוואה', { m: -0.0015, ro: 15, rep: 2 }), C_('הלוואה קטנה', { m: -0.0005, ro: 6 }), C_('לסרב', { ro: -5 })] },
  { id: 'meddle', c: 'intl', w: c => c.dem ? 1.2 : 0, r: 'fo', o: 'riv', t: 'התערבות בבחירות', x: c => 'הוכחות מצטברות: ' + c.on + ' הפעילה רשתות בוטים כדי להשפיע על הבחירות אצלנו.',
    ch: [C_('לגרש דיפלומטים ולהטיל סנקציות', { ro: -18, ap: 2 }, { f: c => { S.sanc[S.player + '>' + c.o] = 1; } }), C_('חקירה שקטה', { m: -0.0002, ap: 1 }), C_('להתעלם', { ap: -2 })] },
  { id: 'mediate', c: 'intl', w: c => S.wars.some(w => !involvesPlayer(w) && w.pause === 0) ? 1.5 : 0, r: 'fo', o: 'aiwar', t: 'בקשה לתווך', x: c => c.on + ' ו' + c.on2 + ' במלחמה. מבקשים מאיתנו לתווך ביניהן.',
    ch: [C_('לתווך', { m: -0.0003, rep: 3 }, { f: c => { const w = S.wars.find(v => inWar(v, c.o) && inWar(v, c.o2) && v.pause === 0); if (w && R() < 0.45) { w.pause = 183; addNews('בתיווך ' + P().he + ': הפסקת אש בין ' + nm(w.a) + ' ל' + nm(w.b) + '!', 'good'); fxToast('התיווך הצליח', { rep: 3 }); } else addNews('ניסיון התיווך שלנו בין ' + c.on + ' ל' + c.on2 + ' נכשל.', 'dip'); } }), C_('לא להתערב', {})] },
  { id: 'chipban', c: 'intl', w: 1, r: 'fin', o: 'big', t: c => c.on + ' חוסמת ייצוא שבבים', x: c => c.on + ' אסרה למכור לנו שבבים מתקדמים.',
    ch: [C_('לפתח תעשייה מקומית', { m: -0.003, gv: 0.002, gd: 1460 }), C_('לשדל ולהתחייב', { ro: 6, gv: -0.001, gd: 365 }), C_('להבריח דרך מדינה שלישית', { rep: -3, ro: -8 })] },
  { id: 'boats', c: 'intl', w: c => c.sea ? 1.2 : 0, r: 'fo', t: 'סירות מהגרים', x: 'סירות עמוסות מהגרים מתקרבות לחופים שלנו. חלקן טובעות.',
    ch: [C_('הצלה וקליטה', { rep: 3, m: -0.0005, ap: -1 }), C_('להחזיר אותן לים', { rep: -4, ap: 1 }), C_('הסכם עם מדינות המוצא', { m: -0.0008, rep: 1 })] },
  { id: 'ai_treaty', c: 'intl', w: 0.8, cd: 1200, r: 'fo', t: 'אמנת בינה מלאכותית', x: 'מדינות העולם מציעות אמנה שמגבילה פיתוח של בינה מלאכותית מסוכנת.',
    ch: [C_('לחתום', { rep: 3, gv: -0.001, gd: 730 }), C_('לסרב', { rep: -2, gv: 0.001, gd: 730 })] },
  { id: 'net5g', c: 'intl', w: 1, r: 'fin', o: 'authbig', t: 'תשתית תקשורת זולה', x: c => 'חברה מ' + c.on + ' מציעה לבנות לנו רשת תקשורת בחצי מחיר. הדמוקרטיות מזהירות מריגול.',
    ch: [C_('לקבל את ההצעה', { m: 0.001, ro: 10, rd: -5 }), C_('לסרב', { ro: -8, rd: 3, m: -0.001 })] },
  { id: 'aid_offer', c: 'intl', w: c => c.poor ? 1.5 : 0, r: 'fo', o: 'big', t: c => 'סיוע מ' + c.on, x: c => c.on + ' מציעה חבילת סיוע לפיתוח — בתמורה לבסיס צבאי קטן אצלנו.',
    ch: [C_('לקבל', { m: 0.004, ro: 12, rep: -1 }), C_('רק סיוע, בלי בסיס', { m: 0.001, ro: 2 }), C_('לסרב', { ro: -6, ap: 1 })] },
  /* ---------- the world (news only) ---------- */
  { id: 'tradewar', c: 'intl', w: 1.2, o: 'pw2', t: 'מלחמת סחר', go: c => { addRel(c.o, c.o2, -12); S.c[c.o].gdp *= 0.995; S.c[c.o2].gdp *= 0.995; }, n: c => 'מלחמת סחר: ' + c.on + ' ו' + c.on2 + ' מטילות מכסים זו על זו. השווקים בעולם נבהלים.', e: { gdp: -0.001 }, k: 'world' },
  { id: 'nuke_test', c: 'intl', w: 0.8, o: 'nukeauth', t: 'ניסוי גרעיני', go: c => alive().forEach(x => { if (x !== c.o) addRel(x, c.o, -4); }), n: c => c.on + ' ביצעה ניסוי גרעיני תת-קרקעי. העולם מגנה.', k: 'world' },
  { id: 'w_bord', c: 'intl', w: 1.5, o: 'aipair', go: c => addRel(c.o, c.o2, -8), n: c => 'תקרית ירי בגבול ' + c.on + '–' + c.on2 + '. שתי המדינות מאשימות זו את זו.', k: 'world' },
  { id: 'w_summit', c: 'intl', w: 1.2, o: 'pw2', go: c => addRel(c.o, c.o2, 8), n: c => 'פסגה היסטורית: ראשי ' + c.on + ' ו' + c.on2 + ' נפגשו והסכימו להוריד את המתיחות.', k: 'world' },
  { id: 'w_space', c: 'intl', w: 1, o: 'big', n: c => pick([c.on + ' הנחיתה רובוט על הירח.', c.on + ' שיגרה תחנת חלל חדשה.', 'אסטרונאוטים מ' + c.on + ' יצאו להליכת חלל ראשונה.']), k: 'world' },
  { id: 'w_ship', c: 'intl', w: 1, t: 'תעלה חסומה', go: () => alive().forEach(x => { S.c[x].gdp *= 0.999; }), n: 'ספינת מכולות ענקית נתקעה בתעלה מרכזית. הסחר העולמי משתבש.', e: { gdp: -0.0005 }, k: 'world' },
  { id: 'w_food', c: 'intl', w: 1, t: 'מחירי המזון בעולם עולים', go: () => alive().forEach(x => { const c = S.c[x]; if (x !== S.player && c.gdp / c.pop < 5) c.approval = clamp(c.approval - 4, 5, 95); }), n: 'מחירי החיטה והאורז בעולם זינקו. מחאות פרצו במדינות עניות.', e: c => c.poor ? { ap: -2 } : {}, k: 'world' },
  { id: 'w_expo', c: 'intl', w: 0.8, o: 'big', n: c => 'תערוכת העולם נפתחה ב' + c.on + ' עם ביתנים מ-150 מדינות.', k: 'world' },
  { id: 'w_meteor', c: 'intl', w: 0.4, o: 'any', n: c => 'מטאוריט התפוצץ בשמי ' + c.on + '. אין נפגעים, אבל הסרטונים מציפים את הרשת.', k: 'world' },
  { id: 'w_arms', c: 'intl', w: 1.2, o: 'pw2', go: c => [c.o, c.o2].forEach(x => { const X = S.c[x]; X.defPct = Math.min(0.12, X.defPct * 1.08); tag(X, 'army', 300); }), n: c => 'מירוץ חימוש: ' + c.on + ' ו' + c.on2 + ' מגדילות את תקציבי הביטחון.', k: 'world' },
  { id: 'w_cyber', c: 'intl', w: 1, o: 'any', go: c => { S.c[c.o].gdp *= 0.998; }, n: c => 'מתקפת כופרה השביתה את הנמלים של ' + c.on + ' לשלושה ימים.', k: 'world' },
  { id: 'w_plague', c: 'intl', w: 0.8, o: 'poorany', go: c => { S.c[c.o].gdp *= 0.99; tag(S.c[c.o], 'disaster', 120); }, n: c => 'התפרצות כולרה ב' + c.on + '. ארגוני הסיוע מזהירים מאסון.', k: 'world' },
  { id: 'w_protest', c: 'intl', w: 1.5, o: 'weak', go: c => { tag(S.c[c.o], 'protest', 60); S.c[c.o].approval = clamp(S.c[c.o].approval - 3, 5, 95); }, n: c => 'מחאות המוניות ב' + c.on + ' נגד השלטון. ' + pick(['המשטרה ירתה גז מדמיע.', 'האופוזיציה קוראת לשביתה כללית.', 'השלטון חסם את האינטרנט.']), k: 'world' },
  { id: 'w_quake', c: 'intl', w: 1.5, o: 'any', go: c => { S.c[c.o].gdp *= 0.99; tag(S.c[c.o], 'disaster', 180); if (!atWar(c.o, S.player) && rel(c.o, S.player) > -60 && R() < 0.6) pushAid(c.o, 'רעידת האדמה', 0.01); }, n: c => 'רעידת אדמה קטלנית ב' + c.on + '. מאות הרוגים ואלפי עקורים.', k: 'world' },
  /* ---------- the government itself ---------- */
  { id: 'm_scandal', c: 'dom', o: 'min', w: () => govN() ? (anyCorrupt() ? 4 : 0.8) : 0, t: c => 'שערורייה: ' + c.mt, x: c => 'תחקיר עיתונאי חושף: ' + c.mt + ' ' + c.mn + (c.mc ? c.v(' לקח כספים מהקופה הציבורית.', ' לקחה כספים מהקופה הציבורית.') : c.v(' העסיק', ' העסיקה') + ' קרובי משפחה בלשכה.'),
    ch: [C_(c => 'לפטר את ' + c.mn, { ap: 2 }, { f: c => fireMin(c.mr, true) }), C_(c => 'לגבות את ' + c.mn, { ap: -3, rep: -1 }), C_('ועדת בדיקה', { m: -0.0001, ap: -1 }, { f: c => { if (c.mc && R() < 0.6) { fireMin(c.mr, true); addNews('ועדת הבדיקה מצאה אשמה: ' + c.mn + ' ' + c.v('פוטר', 'פוטרה') + '.', 'bad'); } } })] },
  { id: 'm_resign', c: 'dom', o: 'min', cd: 600, w: () => govN() ? 0.45 : 0, t: c => c.mt + ' ' + c.v('התפטר', 'התפטרה'), go: c => fireMin(c.mr, true, true),
    n: c => c.mt + ' ' + c.mn + ' ' + c.v('הודיע', 'הודיעה') + ' על התפטרות ' + pick(['מסיבות אישיות.', 'בעקבות מחלוקת עם ראש הממשלה.', 'כדי להתמודד בבחירות.']) + ' התפקיד פנוי — אפשר למנות מחליף בלשונית ממשלה.', e: { ap: -1 }, k: 'bad' },
  { id: 'm_pop', c: 'dom', o: 'min', w: () => govN() ? 1.2 : 0, t: c => c.mt + ' ' + c.v('אהוב', 'אהובה') + ' על הציבור', go: c => { const m = minOf(c.mr); if (m) m.pop = clamp(m.pop + 15, 5, 95); }, n: c => c.mt + ' ' + c.mn + ' ' + c.v('זוכה', 'זוכה') + ' לשבחים בסקרים. הממשלה נהנית מזה.', e: { ap: 2 }, k: 'good' },
  { id: 'm_clash', c: 'dom', o: 'min2', w: () => govN() >= 2 ? 1 : 0, t: 'ריב בממשלה', x: c => c.mt + ' ו' + c.mt2 + ' תוקפים זה את זה בתקשורת. הממשלה נראית מפולגת.',
    ch: [C_(c => 'לגבות את ' + c.mt, { ap: -1 }, { f: c => fireMin(c.mr2, true) }), C_(c => 'לגבות את ' + c.mt2, { ap: -1 }, { f: c => fireMin(c.mr, true) }), C_('להשכין שלום ביניהם', { ap: -2 })] }
];
/* ================= COUNTRY_EV: special events of specific countries, blocs and regions =================
   cc: the player's country must be one of these ids · bl(ctx): bloc / region test · they come from their own slot
   (about one every 1–2 months, see eventsDay) and always reach the leader. rl: {id: change} relations with named
   countries · wr: shows "risk of war" (the real risk is evWar in f) · a choice's nx: [event id, days] = a follow-up. */
const evInv = (k, f) => { const c = P(); c.inv[k] = Math.max(0, Math.round((c.inv[k] || 0) * (1 + f))); if (S.units) syncAllUnits(); };
const IL = ['376'], KR = ['410'], US = ['840'], CNL = ['156'], RU = ['643'], UA = ['804'], IR = ['364'], TW = ['158'], IN = ['356'], PK = ['586'], KP = ['408'];
const SAHEL = ['466', '854', '562', '148'], PACIFIC = ['242', '598', '090', '548', '882', '776', '296', '798', '584', '583', '585', '520'];
const COUNTRY_EV = [
  /* ---------- Israel ---------- */
  { id: 'il_hate', cc: IL, c: 'intl', w: 1.5, cd: 420, r: 'fo', t: 'גל עוינות נגד ישראלים בחו״ל', x: 'בכמה ערים באירופה ובאמריקה הותקפו ישראלים ויהודים, בתי כנסת קיבלו איומים ותיירים מתבקשים להסתיר סימנים מזהים. ההורים של סטודנטים בחו״ל מודאגים.',
    ch: [C_('אבטחה ומימון לקהילות', { m: -0.0008, ap: 3 }), C_('קמפיין עלייה וקליטה', { m: -0.0006, pop: 0.002, ap: 2 }), C_('לדרוש מהממשלות לפעול', { ap: 2, rd: -2 }), C_('אזהרת מסע ודיפלומטיה שקטה', { ap: -2, rep: 1 })] },
  { id: 'il_bds', cc: IL, c: 'intl', w: 1.2, cd: 540, r: 'fin', t: 'קמפיין חרם על ישראל', x: 'רשתות שיווק, קרנות השקעה ואוניברסיטאות במערב מצטרפות לקמפיין חרם (BDS) על מוצרים ישראליים ועל שיתופי פעולה אקדמיים.',
    ch: [C_('מאבק משפטי והסברה', { m: -0.0005, rep: 1, ap: 1 }), C_('לגוון שווקים לאסיה', { gv: -0.001, gd: 365, rl: { '356': 6, '392': 4 } }), C_('להתעלם', { gv: -0.002, gd: 365 })] },
  { id: 'il_un', cc: IL, c: 'intl', w: 1.3, cd: 480, r: 'fo', t: 'החלטה נגדנו באו״ם ובהאג', x: 'העצרת הכללית מצביעה על החלטה חריפה נגד ישראל, ובית הדין הבינלאומי בהאג דן בתביעה נגדה. בעולם מחכים לראות איך נגיב.',
    ch: [C_('לשתף פעולה עם בית הדין', { rep: 3, ap: -2 }), C_('לבקש וטו אמריקאי', { rl: { '840': -3 }, rep: -1, ap: 1 }), C_('להחרים את הדיון', { rep: -4, ap: 2 })] },
  { id: 'il_euro', cc: IL, c: 'intl', w: 1, cd: 600, r: 'int', t: 'סערה סביב האירוויזיון', x: 'כמה מדינות מאיימות להחרים את האירוויזיון ותחרויות ספורט אם ישראל תשתתף. הנציגה שלנו מקבלת איומים, ומפגינים מחכים לה בעיר המארחת.',
    ch: [C_('להשתתף בגאווה', { ap: 3, rep: -1 }), C_('להשתתף עם אבטחה ופרופיל נמוך', { m: -0.0001, ap: 1 }), C_('לפרוש מהתחרות', { ap: -4, rep: 1 })] },
  { id: 'il_resv', cc: IL, c: 'dom', w: c => c.war ? 2.5 : 0.8, cd: 400, r: 'def', t: 'עייפות המילואים', x: 'אנשי מילואים אחרי מאות ימי שירות: עסקים קורסים, סטודנטים מפסידים לימודים ומשפחות מתפרקות. "אנחנו לא יכולים יותר".',
    ch: [C_('מענקים והטבות גדולות', { m: -0.0015, ap: 3 }), C_('לקצר את סבבי המילואים', { ap: 2, mil: { troops: 0.02 } }), C_('לבקש עוד סבלנות', { ap: -3, at: -2, ad: 120 })] },
  { id: 'il_jud', cc: IL, c: 'dom', w: c => c.dem ? 1.2 : 0, cd: 720, r: 'int', t: 'מחאת המונים על מערכת המשפט', x: 'הממשלה מקדמת שינוי בשיטת בחירת השופטים. מאות אלפים מפגינים כל מוצאי שבת, וטייסי מילואים מאיימים שלא להתייצב.',
    ch: [C_('להעביר את החוק בכל מחיר', { ap: -3, un: 2, rd: -3, gdp: -0.002 }, { nx: ['il_jud2', 25] }), C_('פשרה רחבה עם האופוזיציה', { ap: 1, rep: 1 }), C_('להקפיא ולפתוח בהידברות', { ap: 2 })] },
  { id: 'il_jud2', cc: IL, c: 'dom', w: 0, cd: 60, r: 'fin', t: 'שביתה כללית נגד החקיקה', x: 'ההסתדרות, ראשי ערים וחברות הייטק הכריזו על שביתה כללית עד שהחקיקה תיעצר. נתב״ג סגור והשקל נחלש.',
    ch: [C_('לעצור את החקיקה', { ap: 3, gdp: 0.001 }), C_('להמשיך בכל זאת', { ap: -4, un: 2, gdp: -0.004, rep: -2 })] },
  { id: 'il_draft', cc: IL, c: 'dom', w: 1.2, cd: 540, r: 'def', t: 'מחלוקת על גיוס חרדים', x: 'בית המשפט העליון קבע שאין בסיס חוקי לפטור תלמידי ישיבות מגיוס. המפלגות החרדיות מאיימות לפרק את הקואליציה, והמילואימניקים דורשים שוויון בנטל.',
    ch: [C_('גיוס הדרגתי עם מכסות', { ap: 2, at: 1, ad: 180 }, { f: () => evInv('troops', 0.01) }), C_('סנקציות כלכליות על משתמטים', { ap: 1, m: 0.0002, un: 1 }), C_('חוק פטור חדש', { ap: -3, un: 1 })] },
  { id: 'il_rockets', cc: IL, c: 'dom', w: c => c.war ? 2 : 1.2, cd: 360, r: 'def', t: 'ירי רקטות מעזה ומלבנון', x: 'חמאס וחיזבאללה שיגרו מאות רקטות לעבר ערים בצפון ובדרום. כיפת ברזל מיירטת את רובן, אבל מאות אלפים במקלטים.',
    ch: [C_('תגובה צבאית חריפה', { ap: 3, rep: -3, rl: { '422': -10 }, mil: { msl: 0.01 }, wr: 1 }, { f: () => evWar('422', 0.1, 'אחרי התקיפה שלנו') }),
      C_('יירוט ותגובה מדודה', { m: -0.0006, ap: 1 }), C_('הפסקת אש בתיווך מצרים וקטאר', { ap: -2, rep: 2, rl: { '818': 5, '634': 5 } })] },
  { id: 'il_iran', cc: IL, c: 'intl', w: c => evAl('364') ? 1 : 0, cd: 600, r: 'def', t: 'איומים מאיראן', x: 'בטהרן מכריזים שוב שישראל "תימחק", ותוכנית הגרעין האיראנית מתקרבת לסף. ראש המוסד מציג לממשלה אפשרויות.',
    ch: [C_('תקיפה מקדימה במתקני הגרעין', { ap: 4, rep: -4, rl: { '364': -25, '840': -3 }, mil: { air: 0.01 }, wr: 1 }, { f: () => evWar('364', 0.15, 'אחרי התקיפה במתקני הגרעין') }),
      C_('מבצעים חשאיים וסייבר', { m: -0.0006, rl: { '364': -8 } }), C_('ללחוץ על המעצמות לסנקציות', { rep: 2, rl: { '840': 3 } })] },
  { id: 'il_usaid', cc: IL, c: 'intl', w: c => evAl('840') ? 1.2 : 0, cd: 540, r: 'fo', t: 'הצבעה על הסיוע האמריקאי', x: 'הקונגרס בוושינגטון מצביע על חבילת סיוע ביטחוני לישראל. חלק מהמחוקקים דורשים להצמיד אליה תנאים.',
    ch: [C_('להסכים לתנאים', { m: 0.004, rep: 2, ap: -1, rl: { '840': 5 } }), C_('לובי חזק בלי ויתורים', { m: 0.003, rl: { '840': -4 }, ap: 1 }), C_('לוותר ולהתבסס על עצמנו', { ap: 2, rl: { '840': -2 }, gv: -0.001, gd: 365 })] },
  { id: 'il_saudi', cc: IL, c: 'intl', w: c => evAl('682') && rel('682', S.player) > -40 ? 1 : 0, cd: 900, r: 'fo', t: 'הצעת נורמליזציה עם ערב הסעודית', x: 'ריאד מוכנה לחתום על הסכם שלום ולפתוח את השמיים והשווקים, אבל דורשת התחייבות לדרך מדינית מול הפלסטינים.',
    ch: [C_('לחתום ולהתחייב', { rl: { '682': 25, '840': 5 }, rep: 5, ap: -2, gv: 0.002, gd: 1095 }, { f: () => { if (evAl('682')) { setPact('682', S.player, 'trade', true); addNews('נחתם הסכם שלום וסחר בין ' + P().he + ' לערב הסעודית.', 'good'); } } }),
      C_('הסכם כלכלי בלבד', { rl: { '682': 8 }, gv: 0.001, gd: 730 }), C_('לדחות את ההצעה', { rl: { '682': -8 }, ap: 1 })] },
  { id: 'il_exit', cc: IL, c: 'dom', w: 1.1, cd: 480, r: 'fin', t: 'אקזיט ענק בהייטק', x: 'חברת סטארט-אפ ישראלית נמכרה לענקית טכנולוגיה בעשרות מיליארדי דולרים. מיליארדים במסים נכנסים לקופה.',
    ch: [C_('להשקיע במו״פ ובחינוך', { m: 0.002, gv: 0.002, gd: 1095, ap: 1 }), C_('לסגור את הגירעון', { m: 0.004 }), C_('הורדת מסים לכולם', { m: 0.001, ap: 3 })] },
  { id: 'il_hostage', cc: IL, c: 'intl', w: c => c.war ? 1.5 : 0.6, cd: 600, r: 'def', t: 'משא ומתן על החטופים', x: 'מתווכים מקטאר וממצרים מציגים עסקה: חזרת חטופים תמורת שחרור אסירים והפסקת אש ממושכת. המשפחות מפגינות מול משרד ראש הממשלה.',
    ch: [C_('לקבל את העסקה', { ap: 5, rep: 3, rl: { '634': 5, '818': 5 } }), C_('לדרוש תנאים טובים יותר', { ap: -1 }, { nx: ['il_hostage2', 30] }), C_('להמשיך בלחץ צבאי', { ap: -2, rep: -2 })] },
  { id: 'il_hostage2', cc: IL, c: 'intl', w: 0, cd: 60, r: 'def', t: 'עסקה משופרת על השולחן', x: 'אחרי חודש של מגעים המתווכים חוזרים עם הצעה משופרת — אבל הזמן אוזל, והמשפחות מאבדות סבלנות.',
    ch: [C_('לחתום', { ap: 4, rep: 2, rl: { '634': 4, '818': 4 } }), C_('לסרב', { ap: -4, un: 1 })] },

  /* ---------- South Korea ---------- */
  { id: 'kr_martial', cc: KR, c: 'dom', w: c => c.dem ? 1.2 : 0, cd: 1500, r: 'int', t: 'הצעה להכריז על משטר צבאי', x: 'האופוזיציה חוסמת כל חוק ותקציב. יועצים בכירים בלשכת הנשיא מציעים להכריז הלילה על משטר צבאי, לסגור את הפרלמנט ולהשתיק את התקשורת. "רק כך נחזיר סדר".',
    ch: [C_('להכריז על משטר צבאי', { ap: -8, rep: -8, rd: -6, un: 3, rl: { '840': -8 } }, { nx: ['kr_martial2', 3] }), C_('לסרב ולפטר את היועצים', { ap: 2, rep: 1 }), C_('ללכת לבחירות מוקדמות', { ap: 1, m: -0.0003 })] },
  { id: 'kr_martial2', cc: KR, c: 'dom', w: 0, cd: 60, r: 'int', t: 'הפרלמנט נגד המשטר הצבאי', x: 'מאות אלפים בכיכרות עם נרות. חברי פרלמנט טיפסו מעל הגדרות והצביעו פה אחד לבטל את המשטר הצבאי. החיילים מהססים.',
    ch: [C_('לבטל ולהתנצל', { ap: -2, rep: 2, un: -1 }, { nx: ['kr_impeach', 20] }), C_('לפזר את הפרלמנט בכוח', { ap: -12, rep: -12, rd: -10, un: 4, gdp: -0.01 }, { nx: ['kr_impeach', 10] })] },
  { id: 'kr_impeach', cc: KR, c: 'dom', w: 0, cd: 60, r: 'int', t: 'הליך הדחה', x: 'הפרלמנט הצביע להדיח את הנשיא, ובית המשפט החוקתי יכריע. הבורסה רועדת והממשלה משותקת.',
    ch: [C_('לכבד את בית המשפט', { ap: 4, rep: 4, rd: 3, un: -1 }), C_('להיאבק בכל דרך משפטית', { ap: -3, un: 1, gdp: -0.002 })] },
  { id: 'kr_candles', cc: KR, c: 'dom', w: c => c.ap < 50 ? 1.5 : 0.8, cd: 540, r: 'int', t: 'מחאת הנרות', x: 'מאות אלפים מחזיקים נרות בכיכר המרכזית בסיאול, בדרישה שהממשלה תתפטר בגלל שערוריית שחיתות בלשכה.',
    ch: [C_('חוקר עצמאי לפרשה', { ap: 2, m: -0.0001 }), C_('להחליף את ראש הלשכה', { ap: 1 }), C_('לפזר את ההפגנות בכוח', { ap: -5, rep: -3, un: 2 })] },
  { id: 'kr_chaebol', cc: KR, c: 'dom', w: 1.2, cd: 540, r: 'fin', t: 'שחיתות בתאגיד ענק', x: 'היורש של אחד התאגידים המשפחתיים הגדולים (״צ׳ֶבּוֹל״) נחשד בשוחד לפקידים בכירים. התאגיד אחראי לחמישית מהייצוא.',
    ch: [C_('משפט מלא ומאסר', { ap: 4, rep: 2, gdp: -0.002 }), C_('קנס כבד בלי מאסר', { m: 0.001, ap: -1 }), C_('חנינה "למען הכלכלה"', { ap: -4, gv: 0.001, gd: 365 })] },
  { id: 'kr_nk', cc: KR, c: 'intl', w: c => evAl('408') ? 1.5 : 0, cd: 360, r: 'def', t: 'פרובוקציה של צפון קוריאה', x: 'צפון קוריאה שיגרה טילים לים, ובלונים עם אשפה נחתו ברחובות סיאול. ליד האזור המפורז נשמעו יריות.',
    ch: [C_('תרגיל גדול עם ארה״ב', { m: -0.0005, ap: 2, rl: { '408': -10, '840': 4 } }), C_('רמקולי תעמולה בגבול', { ap: 1, rl: { '408': -8 }, wr: 1 }, { f: () => evWar('408', 0.04, 'אחרי מלחמת הרמקולים בגבול') }), C_('להציע ערוץ שיחות', { rl: { '408': 6 }, ap: -1, rep: 2 })] },
  { id: 'kr_birth', cc: KR, c: 'dom', w: 1.1, cd: 600, r: 'fin', t: 'משבר הילודה', x: 'שיעור הילודה אצלנו הוא הנמוך בעולם: פחות מילד אחד לאישה. בתי ספר נסגרים והצבא מתקשה לגייס.',
    ch: [C_('מענקים להורים ודיור זול', { m: -0.002, pop: 0.002, ap: 2 }), C_('לפתוח את השערים להגירה', { pop: 0.004, ap: -2, gv: 0.001, gd: 1095 }), C_('להשקיע באוטומציה ורובוטים', { m: -0.001, gv: 0.001, gd: 1095 })] },
  { id: 'kr_ustroops', cc: KR, c: 'intl', w: c => evAl('840') ? 1 : 0, cd: 720, r: 'fo', t: 'מחיר החיילים האמריקאים', x: 'וושינגטון דורשת שנשלם פי כמה על החזקת כ-28 אלף החיילים האמריקאים אצלנו — אחרת תשקול לצמצם אותם.',
    ch: [C_('לשלם את הדרישה', { m: -0.002, rl: { '840': 8 }, ap: -2 }), C_('פשרה: תוספת מתונה', { m: -0.0008, rl: { '840': 2 } }), C_('לסרב ולחזק את הצבא שלנו', { m: -0.0012, rl: { '840': -8 }, ap: 2 })] },
  { id: 'kr_kpop', cc: KR, c: 'intl', w: 1, cd: 540, r: 'int', t: 'הגל הקוריאני כובש את העולם', x: 'להקת קיי-פופ, סדרה וסרט קוריאני שוברים שיאי צפייה בעולם. הביקוש לטיסות לסיאול מזנק.',
    ch: [C_('להשקיע בתרבות ובתיירות', { m: -0.0005, rep: 4, gv: 0.001, gd: 730 }), C_('פטור משירות צבאי לכוכבים', { rep: 2, ap: -2 }), C_('ליהנות בשקט', { rep: 2 })] },
  { id: 'kr_japan', cc: KR, c: 'intl', w: c => evAl('392') ? 1 : 0, cd: 600, r: 'fo', t: 'מחלוקת היסטורית עם יפן', x: 'בית משפט בסיאול חייב חברות יפניות לפצות עובדי כפייה מתקופת הכיבוש. טוקיו מגיבה בהגבלות על חומרים לתעשיית השבבים.',
    ch: [C_('קרן פיצוי משותפת ופיוס', { rl: { '392': 10, '840': 3 }, ap: -2 }), C_('לבקש תיווך אמריקאי', { rl: { '392': 3, '840': 2 } }), C_('לעמוד על פסק הדין', { rl: { '392': -10 }, ap: 3, gv: -0.001, gd: 365 })] },
  { id: 'kr_defect', cc: KR, c: 'intl', w: c => evAl('408') ? 0.8 : 0, cd: 600, r: 'fo', t: 'עריקים מהצפון בסירה', x: 'סירת דייגים עם משפחה מצפון קוריאה חצתה את הגבול הימי. פיונגיאנג דורשת להחזיר אותם מיד.',
    ch: [C_('לתת להם מקלט', { ap: 2, rep: 3, rl: { '408': -6 } }), C_('להחזיר אותם בשקט', { ap: -4, rep: -4, rl: { '408': 4 } })] },

  /* ---------- USA ---------- */
  { id: 'us_elec', cc: US, c: 'dom', w: c => c.dem ? 1.2 : 0, cd: 720, r: 'int', t: 'בחירות מקוטבות', x: 'המדינה מפולגת כמו שלא הייתה מזמן. צד אחד טוען להונאה בבחירות האמצע, ותומכים מתכנסים מול בתי המחוקקים במדינות.',
    ch: [C_('ספירה חוזרת שקופה', { m: -0.0001, ap: 1, rep: 2 }), C_('נאום פיוס לאומי', { ap: 2 }), C_('להכריז על התוצאות ולהמשיך', { ap: -1, un: 1 })] },
  { id: 'us_shutdown', cc: US, c: 'dom', w: 1.2, cd: 540, r: 'fin', t: 'השבתת הממשל', x: 'הקונגרס לא העלה את תקרת החוב. מאות אלפי עובדי מדינה יצאו לחופשה כפויה, והפארקים הלאומיים סגורים.',
    ch: [C_('להסכים לקיצוצים', { m: 0.001, ap: -2 }), C_('פשרה זמנית לשלושה חודשים', { ap: 1 }), C_('לחכות שהצד השני יישבר', { gdp: -0.002, ap: -2 })] },
  { id: 'us_guns', cc: US, c: 'dom', w: 1, cd: 540, r: 'int', t: 'ירי המוני והוויכוח על הנשק', x: 'ירי בבית ספר גבה חיים רבים. הורים דורשים חוקי נשק מחמירים, ולובי הנשק מזהיר מפגיעה בחוקה.',
    ch: [C_('חוק בדיקות רקע מחמיר', { ap: 2, un: 1 }), C_('אבטחה בבתי הספר', { m: -0.0004, ap: 1 }), C_('תנחומים בלבד', { ap: -3 })] },
  { id: 'us_china', cc: US, c: 'intl', w: c => evAl('156') ? 1.3 : 0, cd: 540, r: 'fin', t: 'מלחמת סחר עם סין', x: 'הממשל שוקל מכסים של 60% על סחורות מסין. בייג׳ינג מאיימת לעצור את ייצוא המתכות הנדירות.',
    ch: [C_('מכסים מלאים', { rl: { '156': -15 }, ap: 2, gv: -0.002, gd: 365 }), C_('מכסים רק על טכנולוגיה', { rl: { '156': -6 }, rep: 1 }), C_('הסכם סחר חלקי', { rl: { '156': 4 }, gv: 0.001, gd: 365 })] },
  { id: 'us_border', cc: US, c: 'dom', w: 1.2, cd: 540, r: 'int', t: 'משבר בגבול הדרומי', x: 'מספר חוצי הגבול שובר שיאים. ערים מתלוננות על עומס, ומושלים שולחים את המשמר הלאומי לגבול.',
    ch: [C_('חומה וגירושים', { m: -0.001, ap: 2, rl: { '484': -10 }, rep: -2 }), C_('הסכם אכיפה עם מקסיקו', { rl: { '484': 6 }, m: -0.0005 }), C_('רפורמה ואשרות עבודה', { ap: -2, gv: 0.001, gd: 1095, pop: 0.002 })] },
  { id: 'us_nato', cc: US, c: 'intl', w: 1, cd: 600, r: 'fo', t: 'מחלוקת על הנטל בנאט״ו', x: 'הממשל מאיים שלא יגן על בעלות ברית שלא מוציאות מספיק על ביטחון. באירופה חוששים שארה״ב תעזוב.',
    ch: [C_('לעמוד על הדרישה', { ap: 2, rd: -4 }), C_('להרגיע את בעלות הברית', { rd: 3, ap: -1 }), C_('לצמצם כוחות באירופה', { m: 0.001, rd: -6, rl: { '643': 5 } })] },
  { id: 'us_fed', cc: US, c: 'dom', w: 1, cd: 480, r: 'fin', t: 'הבנק המרכזי והריבית', x: 'האינפלציה עולה שוב. הבנק המרכזי שוקל להעלות את הריבית, ובממשל לוחצים עליו להוריד אותה לפני הבחירות.',
    ch: [C_('לכבד את עצמאות הבנק', { gv: -0.001, gd: 365, rep: 1 }), C_('ללחוץ להוריד ריבית', { gv: 0.002, gd: 365, rep: -2, at: -2, ad: 365 })] },

  /* ---------- China ---------- */
  { id: 'cn_taiwan', cc: CNL, c: 'intl', w: c => evAl('158') ? 1.4 : 0, cd: 480, r: 'def', t: 'מתיחות במצר טייוואן', x: 'משלחת של חברי קונגרס אמריקאים מבקרת בטייוואן. בצבא מציעים תרגיל אש חי סביב האי.',
    ch: [C_('תרגיל מצור רחב', { rl: { '158': -15, '840': -8 }, ap: 3, rep: -3 }), C_('גינוי וסנקציות על חברות', { rl: { '158': -5, '840': -3 }, ap: 1 }), C_('איפוק', { ap: -2, rep: 1 })] },
  { id: 'cn_hk', cc: CNL, c: 'dom', w: 1, cd: 600, r: 'int', t: 'מחאות בהונג קונג', x: 'צעירים בהונג קונג מפגינים נגד חוק ביטחון חדש. העולם צופה, והבורסה המקומית צונחת.',
    ch: [C_('מעצרים ודיכוי', { ap: 1, rep: -5, rd: -4, un: -1 }), C_('דיאלוג עם המפגינים', { rep: 2, ap: -1, un: 1 }), C_('לדחות את החוק', { ap: -2, rep: 3 })] },
  { id: 'cn_prop', cc: CNL, c: 'dom', w: 1.2, cd: 600, r: 'fin', t: 'קריסת ענקית נדל״ן', x: 'חברת נדל״ן ענקית לא עומדת בתשלומים. מיליוני דירות לא גמורות, ומשפחות ששילמו מראש מפגינות.',
    ch: [C_('חילוץ ממשלתי', { m: -0.003, ap: 2 }), C_('לחייב בנקים להשלים בנייה', { gv: -0.001, gd: 730, ap: 1 }), C_('לתת לה לקרוס', { gdp: -0.006, ap: -3, un: 1 })] },
  { id: 'cn_xj', cc: CNL, c: 'intl', w: 1, cd: 600, r: 'fo', t: 'סנקציות בגלל שינג׳יאנג וטיבט', x: 'מדינות המערב מטילות סנקציות על פקידים וחברות בגלל דיווחים על מחנות מעצר ופגיעה בזכויות אדם בשינג׳יאנג ובטיבט.',
    ch: [C_('סנקציות נגדיות', { rd: -5, ap: 2 }), C_('ביקור מוגבל של משקיפים', { rep: 3, rd: 2, ap: -1 }), C_('להכחיש ולהתעלם', { rep: -2, gv: -0.001, gd: 365 })] },
  { id: 'cn_chips', cc: CNL, c: 'intl', w: c => evAl('840') ? 1.2 : 0, cd: 540, r: 'fin', t: 'אמברגו שבבים אמריקאי', x: 'וושינגטון אסרה למכור לנו שבבים מתקדמים ומכונות לייצור שבבים, ולוחצת על בעלות בריתה להצטרף.',
    ch: [C_('תוכנית לאומית לשבבים', { m: -0.003, gv: 0.001, gd: 1095 }), C_('לעצור ייצוא מתכות נדירות', { rl: { '840': -10 }, gv: -0.001, gd: 365, ap: 2 }), C_('לקנות דרך מדינות שלישיות', { rep: -2, m: -0.0005 })] },
  { id: 'cn_lock', cc: CNL, c: 'dom', w: 0.8, cd: 900, r: 'int', t: 'התפרצות נגיף בעיר ענק', x: 'נגיף חדש התגלה בעיר של 20 מיליון תושבים. בבייג׳ינג מתלבטים: סגר מלא או סיכון.',
    ch: [C_('סגר הרמטי', { gdp: -0.005, ap: -2, un: 1 }), C_('בדיקות ובידוד ממוקד', { m: -0.001, ap: 1 }), C_('לפתוח הכול', { ap: -2, pop: -0.0005, gv: 0.001, gd: 180 })] },
  { id: 'cn_bri', cc: CNL, c: 'intl', w: 1, cd: 600, r: 'fin', t: 'חובות "החגורה והדרך"', x: 'כמה מדינות שקיבלו מאיתנו הלוואות לנמלים ולמסילות לא מצליחות להחזיר. אחת מהן מציעה לנו את הנמל במקום.',
    ch: [C_('לקחת את הנמל', { m: 0.001, rep: -3 }), C_('למחוק חלק מהחוב', { m: -0.002, rep: 4 }), C_('לדחות את התשלומים', { rep: 1 })] },
  { id: 'cn_youth', cc: CNL, c: 'dom', w: 1, cd: 600, r: 'fin', t: 'אבטלת צעירים', x: 'אחד מכל חמישה צעירים בערים מובטל. ברשתות מדברים על "לשכב שטוח" — לוותר על המרוץ לקריירה.',
    ch: [C_('תוכנית תעסוקה ממשלתית', { m: -0.0015, ap: 2 }), C_('הקלות להייטק ולסטארט-אפים', { gv: 0.001, gd: 730, ap: 1 }), C_('לשלוח צעירים לכפרים', { ap: -2, un: 1 })] },

  /* ---------- Russia ---------- */
  { id: 'ru_sanc', cc: RU, c: 'intl', w: 1.3, cd: 480, r: 'fin', t: 'גל סנקציות חדש', x: 'המערב הוסיף מאות בנקים, חברות ומכליות לרשימת הסנקציות ומנתק אותם ממערכת התשלומים העולמית.',
    ch: [C_('להפנות סחר לסין ולהודו', { rl: { '156': 5, '356': 3 }, gv: -0.001, gd: 365 }), C_('להלאים חברות מערביות', { ap: 2, gdp: -0.002, rd: -3 }), C_('לרמוז על נכונות לשיחות', { rd: 3, ap: -2 })] },
  { id: 'ru_mob', cc: RU, c: 'dom', w: c => c.war ? 1.5 : 0.5, cd: 600, r: 'def', t: 'מחאות נגד הגיוס', x: 'צו גיוס חלקי עורר מחאות, ותורים ארוכים של צעירים בורחים נמתחים במעברי הגבול.',
    ch: [C_('לסגור גבולות ולעצור מפגינים', { ap: -3, rep: -3, un: 1 }, { f: () => evInv('troops', 0.03) }), C_('מתנדבים בשכר גבוה', { m: -0.002, ap: 1 }, { f: () => evInv('troops', 0.015) }), C_('לבטל את הצו', { ap: 2 })] },
  { id: 'ru_mutiny', cc: RU, c: 'dom', w: c => c.war ? 1 : 0.4, cd: 1500, r: 'def', t: 'מרד של צבא שכירים', x: 'מפקד של ארגון שכירים חמוש הורה לאנשיו לצעוד על הבירה, בטענה שהפיקוד הצבאי בוגד בלוחמים. שיירות טנקים בכביש הראשי.',
    ch: [C_('לשלוח את הצבא לעצור אותם', { mil: { troops: 0.01, tanks: 0.01 }, ap: 2, un: -1 }), C_('עסקה: גלות למפקד', { ap: -2, rep: -1 }), C_('להיענות לחלק מהדרישות', { ap: -4, un: 1 })] },
  { id: 'ru_oilcap', cc: RU, c: 'intl', w: 1, cd: 540, r: 'fin', t: 'תקרת מחיר על הנפט', x: 'המדינות העשירות קבעו מחיר מקסימלי לנפט שלנו ומאיימות על חברות ספנות שיובילו אותו ביותר.',
    ch: [C_('צי מכליות צל', { m: 0.001, rep: -2 }), C_('למכור בהנחה לאסיה', { m: -0.001, rl: { '356': 4, '156': 4 } }), C_('לקצץ הפקה עם אופ״ק', { gdp: -0.002, rl: { '682': 4 } })] },
  { id: 'ru_assets', cc: RU, c: 'intl', w: 0.9, cd: 600, r: 'fin', t: 'הנכסים המוקפאים', x: 'אירופה שוקלת להשתמש במאות מיליארדי דולרים של הבנק המרכזי שלנו, שהוקפאו, כדי לממן את אוקראינה.',
    ch: [C_('לאיים להחרים נכסים מערביים', { ap: 2, rd: -4 }), C_('תביעה בבית דין בינלאומי', { m: -0.0002, rep: 1 }), C_('להציע עסקה', { rd: 3, ap: -2 })] },
  { id: 'ru_arctic', cc: RU, c: 'intl', w: 0.8, cd: 720, r: 'fin', t: 'המירוץ לארקטי', x: 'הקרח הנמס פותח את נתיב הים הצפוני לספינות ולקידוחים. גם סין וארה״ב מתעניינות.',
    ch: [C_('בסיסים ושוברי קרח', { m: -0.002, ap: 2, gv: 0.001, gd: 1095 }), C_('שותפות עם סין', { rl: { '156': 8 }, gv: 0.001, gd: 730, rd: -2 }), C_('לחכות', {})] },

  /* ---------- Ukraine ---------- */
  { id: 'ua_aid', cc: UA, c: 'intl', w: 1.4, cd: 420, r: 'fo', t: 'הצבעה על הסיוע המערבי', x: 'בוושינגטון ובבריסל מתווכחים על חבילת סיוע צבאי חדשה. חלק מהמחוקקים דורשים לפתוח במשא ומתן עם רוסיה.',
    ch: [C_('מסע שכנוע בבירות', { m: 0.003, rd: 3, ap: 1 }), C_('לקבל פיקוח על הכסף', { m: 0.004, ap: -1, rep: 2 }), C_('להתבסס על ייצור מקומי', { m: -0.001, ap: 2 }, { f: () => evInv('msl', 0.05) })] },
  { id: 'ua_grid', cc: UA, c: 'dom', w: c => c.war ? 1.5 : 0.6, cd: 360, r: 'int', t: 'מתקפה על רשת החשמל', x: 'גל של טילים ורחפנים פגע בתחנות כוח. מיליונים בלי חשמל וחימום באמצע החורף.', b: { gdp: -0.002 },
    ch: [C_('לבקש הגנה אווירית מהמערב', { rd: 2, ap: 1 }), C_('גנרטורים ונקודות חימום', { m: -0.001, ap: 2 }), C_('לתקוף מתקני נפט ברוסיה', { rl: { '643': -10 }, ap: 3, rep: -1 })] },
  { id: 'ua_mob', cc: UA, c: 'dom', w: c => c.war ? 1.3 : 0.5, cd: 540, r: 'def', t: 'חוק הגיוס', x: 'הצבא צריך עוד לוחמים. הצעת חוק מורידה את גיל הגיוס ומחמירה עונשים על מי שמשתמט.',
    ch: [C_('להעביר את החוק', { ap: -3, un: 1 }, { f: () => evInv('troops', 0.05) }), C_('גרסה מרוככת', { ap: -1 }, { f: () => evInv('troops', 0.02) }), C_('לדחות את ההצבעה', { ap: 1 })] },
  { id: 'ua_eu', cc: UA, c: 'intl', w: 1, cd: 720, r: 'fo', t: 'צעד לקראת האיחוד האירופי', x: 'בריסל מוכנה לפתוח את שיחות ההצטרפות — בתנאי רפורמות במערכת המשפט ומאבק בשחיתות.',
    ch: [C_('רפורמות מלאות', { ap: -1, rd: 4, gv: 0.002, gd: 1095 }), C_('רפורמות חלקיות', { rd: 1 }), C_('לדחות לאחרי המלחמה', { rd: -2, ap: 1 })] },
  { id: 'ua_corr', cc: UA, c: 'dom', w: 1, cd: 600, r: 'def', t: 'שחיתות ברכש הצבאי', x: 'עיתונאים חשפו פקידים שקנו מזון וציוד לצבא במחירים מנופחים. התורמים במערב שואלים שאלות.',
    ch: [C_('לפטר ולהעמיד לדין', { ap: 3, rd: 2 }), C_('חקירה שקטה', { ap: -2 }), C_('לדחות עד אחרי המלחמה', { ap: -1, rd: -3 })] },
  { id: 'ua_grain', cc: UA, c: 'intl', w: 1, cd: 540, r: 'fin', t: 'מסדרון התבואה', x: 'הנמלים בים השחור בסכנה. מדינות באפריקה ובמזרח התיכון מחכות לחיטה שלנו.',
    ch: [C_('נתיב ימי בליווי', { m: 0.002, rep: 3, rl: { '643': -5 } }), C_('הסכם בתיווך טורקיה', { m: 0.0015, rl: { '792': 6 } }), C_('ייצוא ברכבות דרך אירופה', { m: 0.0008, rl: { '616': -3 } })] },

  /* ---------- Iran ---------- */
  { id: 'ir_hijab', cc: IR, c: 'dom', w: 1.3, cd: 540, r: 'int', t: 'מחאת החיג׳אב', x: 'מותה של צעירה במעצר משטרת המוסר הצית מחאה ארצית. נשים מסירות את כיסוי הראש ברחובות, וסטודנטים שובתים.',
    ch: [C_('לפרק את משטרת המוסר', { ap: 4, rep: 3 }), C_('ועדת חקירה וחסימת אינטרנט', { ap: -1, rep: -2 }), C_('דיכוי ומעצרים', { ap: -3, rep: -5, rd: -4, un: 1 })] },
  { id: 'ir_rial', cc: IR, c: 'dom', w: 1.2, cd: 480, r: 'fin', t: 'קריסת הריאל', x: 'הסנקציות הפילו את המטבע לשפל חדש. מחירי המזון הוכפלו בתוך שנה ובשווקים יש כעס.',
    ch: [C_('סובסידיות לסל מזון', { m: -0.002, ap: 2 }), C_('נפט לסין בהנחה', { rl: { '156': 6 }, m: 0.001 }), C_('להדפיס כסף', { m: 0.001, ap: -2, gv: -0.001, gd: 365 })] },
  { id: 'ir_iaea', cc: IR, c: 'intl', w: 1.1, cd: 600, r: 'fo', t: 'פקחי הגרעין', x: 'הסוכנות הבינלאומית לאנרגיה אטומית דורשת גישה מלאה לאתרים. אירופה מציעה הקלה בסנקציות בתמורה.',
    ch: [C_('לאפשר פיקוח מלא', { rep: 5, rd: 4, gv: 0.002, gd: 730, ap: -1 }), C_('פיקוח חלקי', { rep: 1 }), C_('לגרש את הפקחים', { rep: -6, rd: -5, ap: 2 })] },
  { id: 'ir_covert', cc: IR, c: 'dom', w: c => evAl('376') ? 1 : 0, cd: 600, r: 'def', t: 'פיצוץ מסתורי במתקן גרעיני', x: 'פיצוץ במתקן גרעיני ומדען בכיר נהרג. כל האצבעות מצביעות על ישראל.',
    ch: [C_('מתקפת טילים על ישראל', { rl: { '376': -20 }, ap: 3, rep: -3, mil: { msl: 0.02 }, wr: 1 }, { f: () => evWar('376', 0.2, 'אחרי מתקפת הטילים שלנו') }),
      C_('תגובה דרך ארגונים בעלי ברית', { rl: { '376': -8 }, rep: -2 }), C_('להבליג ולחזק אבטחה', { m: -0.0005, ap: -2 })] },
  { id: 'ir_hormuz', cc: IR, c: 'intl', w: 1, cd: 540, r: 'def', t: 'מכלית במצר הורמוז', x: 'משמרות המהפכה עצרו מכלית זרה במצר הורמוז. מחירי הנפט קופצים והעולם מחכה להחלטה שלנו.',
    ch: [C_('לשחרר אחרי בדיקה', { rep: 1 }), C_('להחזיק בה כקלף מיקוח', { m: 0.0005, rep: -3, rl: { '826': -8, '840': -5 } }), C_('לאיים לסגור את המצר', { rep: -6, ap: 2, rl: { '840': -10, '682': -8 }, wr: 1 }, { f: () => evWar('840', 0.05, 'אחרי האיום לסגור את מצר הורמוז') })] },
  { id: 'ir_proxy', cc: IR, c: 'intl', w: 1, cd: 540, r: 'fin', t: 'כסף לארגונים בעלי ברית', x: 'ארגונים בלבנון, בתימן ובעיראק מבקשים עוד כסף ונשק. בבית אנשים שואלים למה הכסף לא נשאר כאן.',
    ch: [C_('להגדיל את המימון', { m: -0.002, ap: -2, rl: { '422': 5, '887': 5 } }), C_('רק נשק, בלי כסף', { m: -0.0006 }), C_('לקצץ ולהשקיע בבית', { ap: 3, m: 0.001 })] },

  /* ---------- Taiwan ---------- */
  { id: 'tw_drill', cc: TW, c: 'intl', w: c => evAl('156') ? 1.5 : 0, cd: 360, r: 'def', t: 'תרגיל סיני סביב האי', x: 'ספינות ומטוסים סיניים מקיפים את האי בתרגיל של "מצור". מטוסי קרב חוצים את קו האמצע במצר.',
    ch: [C_('כוננות מלאה והצגת כוח', { m: -0.0006, ap: 3, rl: { '156': -5 } }), C_('פנייה לבעלות הברית', { rd: 3, rl: { '840': 3 } }), C_('איפוק ושקט', { ap: -2, rl: { '156': 2 } })] },
  { id: 'tw_tsmc', cc: TW, c: 'intl', w: 1.1, cd: 600, r: 'fin', t: 'דיפלומטיית השבבים', x: 'ארה״ב, יפן ואירופה מבקשות שיצרנית השבבים הגדולה שלנו תבנה אצלן מפעלים. יש חשש שזה יחליש את "מגן הסיליקון".',
    ch: [C_('לבנות מפעלים בחו״ל', { rl: { '840': 8, '392': 5 }, rd: 3, gv: -0.001, gd: 1095 }), C_('רק מפעלים ישנים בחו״ל', { rl: { '840': 2 } }), C_('לשמור הכול בבית', { ap: 2, rl: { '840': -5 }, gv: 0.001, gd: 730 })] },
  { id: 'tw_arms', cc: TW, c: 'intl', w: c => evAl('840') ? 1.1 : 0, cd: 540, r: 'def', t: 'עסקת נשק אמריקאית', x: 'וושינגטון אישרה למכור לנו טילים ומערכות הגנה. בייג׳ינג מאיימת בסנקציות על כל מי שמעורב.',
    ch: [C_('לקנות את כל החבילה', { m: -0.003, ap: 2, rl: { '840': 6, '156': -10 } }, { f: () => evInv('msl', 0.15) }), C_('רק חלק מהחבילה', { m: -0.001, rl: { '840': 2, '156': -4 } }, { f: () => evInv('msl', 0.05) }), C_('לוותר כדי להרגיע', { rl: { '156': 3, '840': -6 }, ap: -3 })] },
  { id: 'tw_recall', cc: TW, c: 'dom', w: c => c.dem ? 1 : 0, cd: 720, r: 'int', t: 'גל הצבעות להדחת מחוקקים', x: 'מאות אלפי חתימות נאספו כדי להדיח חברי פרלמנט מהאופוזיציה, שמואשמים בקרבה לבייג׳ינג. האווירה טעונה.',
    ch: [C_('לתמוך בהדחה', { ap: -1, un: 1 }, { f: () => { if (R() < 0.5) { P().approval = clamp(P().approval + 4, 0, 100); addNews('ההצבעות להדחה הצליחו — הקואליציה התחזקה.', 'good'); } else addNews('ההצבעות להדחה נכשלו. האופוזיציה חוגגת.', 'bad'); } }),
      C_('להישאר מעל המחלוקת', { ap: 1 }), C_('ועדה משותפת לביטחון', { ap: 1, rep: 1 })] },
  { id: 'tw_block', cc: TW, c: 'intl', w: c => evAl('156') ? 0.9 : 0, cd: 720, r: 'def', t: 'איום מצור ימי', x: 'סין מודיעה על "בדיקות מכס" לכל ספינה שנכנסת לנמלים שלנו. מחירי הביטוח הימי מזנקים.',
    ch: [C_('ליווי ימי עם בעלות ברית', { m: -0.001, rl: { '156': -10, '840': 4 }, wr: 1 }, { f: () => evWar('156', 0.03, 'אחרי עימות ימי') }), C_('מאגרי חירום ושקט', { m: -0.0015, gdp: -0.002 }), C_('ערוץ שיחות סודי', { rl: { '156': 4 }, ap: -2 })] },

  /* ---------- India ---------- */
  { id: 'in_kashmir', cc: IN, c: 'intl', w: c => evAl('586') ? 1.4 : 0, cd: 480, r: 'def', t: 'פיגוע בקשמיר', x: 'חמושים תקפו תיירים בקשמיר. הממשלה מאשימה ארגונים שפועלים משטח פקיסטן.',
    ch: [C_('תקיפה מעבר לקו', { ap: 4, rl: { '586': -15 }, rep: -2, wr: 1 }, { f: () => evWar('586', 0.08, 'אחרי התקיפה בקשמיר') }), C_('השעיית אמנת המים', { rl: { '586': -10 }, ap: 2 }), C_('חקירה משותפת', { rl: { '586': 3 }, ap: -3, rep: 2 })] },
  { id: 'in_monsoon', cc: IN, c: 'dom', w: 1, cd: 360, r: 'int', t: 'מונסון קטלני', x: 'גשמי המונסון הציפו מדינות שלמות בצפון ובמזרח. מיליונים פונו מבתיהם.', b: { gdp: -0.002 },
    ch: [C_('הצבא לחילוץ וקרן שיקום', { m: -0.0015, ap: 2 }), C_('לקבל סיוע בינלאומי', { rep: 1, ap: -1 }), C_('להשאיר למדינות המקומיות', { ap: -2 })] },
  { id: 'in_cricket', cc: IN, c: 'intl', w: c => evAl('586') ? 0.9 : 0, cd: 600, r: 'fo', t: 'קריקט מול פקיסטן', x: 'נבחרות הקריקט של הודו ופקיסטן נפגשות בטורניר עולמי. מאות מיליונים יצפו, והמשחק הפך לשאלה מדינית.',
    ch: [C_('לשחק ולהזמין את ראש ממשלת פקיסטן', { rl: { '586': 8 }, ap: -1, rep: 2 }), C_('לשחק בלי טקסים', { ap: 1 }), C_('להחרים את המשחק', { rl: { '586': -6 }, ap: 2, rep: -1 })] },
  { id: 'in_elec', cc: IN, c: 'dom', w: c => c.dem ? 1 : 0, cd: 1200, r: 'int', t: 'הבחירות הגדולות בעולם', x: 'כמעט מיליארד בעלי זכות בחירה ושישה שבועות של הצבעה. האופוזיציה טוענת שמכונות ההצבעה לא אמינות.',
    ch: [C_('שקיפות ופיקוח עצמאי', { rep: 3, ap: 1, m: -0.0002 }), C_('הטבות לפני הבחירות', { m: -0.002, ap: 4 }), C_('להתעלם מהטענות', { ap: -1 })] },
  { id: 'in_comm', cc: IN, c: 'dom', w: 1, cd: 540, r: 'int', t: 'מתיחות בין הינדים למוסלמים', x: 'עימותים בעיר בצפון סביב מקום קדוש לשתי הדתות. בתים וחנויות נשרפו, והרשתות מתלהטות.',
    ch: [C_('כוחות להפרדה ושיקום', { m: -0.0005, ap: 1, rep: 2 }), C_('כנס של ראשי הדתות', { ap: 1, rep: 1 }), C_('להשאיר למשטרה המקומית', { ap: -2, un: 1, rep: -2 })] },

  /* ---------- Pakistan ---------- */
  { id: 'pk_imf', cc: PK, c: 'intl', w: 1.3, cd: 540, r: 'fin', t: 'חילוץ מקרן המטבע', x: 'יתרות המטבע מספיקות לשבועות ספורים. קרן המטבע הבינלאומית מוכנה להלוות — בתנאי קיצוץ בסובסידיות לדלק ולחשמל.',
    ch: [C_('לקבל את התנאים', { m: 0.004, ap: -4, gv: 0.001, gd: 730 }), C_('הלוואה מסין ומהמפרץ', { m: 0.002, rl: { '156': 5, '682': 5 }, rep: -1 }), C_('לסרב', { gdp: -0.005, ap: 1 })] },
  { id: 'pk_army', cc: PK, c: 'dom', w: 1.2, cd: 600, r: 'int', t: 'הצבא והפוליטיקה', x: 'ראש האופוזיציה נעצר אחרי שתקף בפומבי את הפיקוד הצבאי. תומכיו מציפים את הרחובות ותוקפים מתקני צבא.',
    ch: [C_('לשחרר אותו ולכבד את בתי המשפט', { ap: 2, rep: 2 }), C_('הסכם על בחירות מוקדמות', { ap: 1, m: -0.0002 }), C_('לגבות את הצבא', { ap: -3, un: 2, rep: -2 })] },
  { id: 'pk_kashmir', cc: PK, c: 'intl', w: c => evAl('356') ? 1.3 : 0, cd: 480, r: 'def', t: 'מתיחות בקו השליטה בקשמיר', x: 'הודו מאשימה אותנו בפיגוע בקשמיר ומאיימת בתגובה צבאית. בגבול נשמעות הפגזות.',
    ch: [C_('להכחיש ולהציע חקירה', { rl: { '356': 3 }, rep: 2, ap: -1 }), C_('כוננות מלאה בגבול', { m: -0.0006, ap: 3, rl: { '356': -8 }, wr: 1 }, { f: () => evWar('356', 0.05, 'אחרי עימות בקו השליטה') }), C_('לפנות לסין ולאו״ם', { rl: { '156': 4 }, rep: 1 })] },
  { id: 'pk_flood', cc: PK, c: 'dom', w: 1, cd: 600, r: 'int', t: 'השיטפון הגדול', x: 'חלק עצום מהמדינה מוצף ומיליונים איבדו את בתיהם. מדענים מקשרים את זה לשינויי האקלים.', b: { gdp: -0.004 },
    ch: [C_('לדרוש פיצוי מהמדינות המזהמות', { rep: 2, m: 0.001 }), C_('שיקום בכסף שלנו', { m: -0.002, ap: 2 }), C_('לקבל כל סיוע שמוצע', { m: 0.001, ap: 1 })] },
  { id: 'pk_cpec', cc: PK, c: 'intl', w: c => evAl('156') ? 0.9 : 0, cd: 600, r: 'def', t: 'התקפה על עובדים סינים', x: 'עובדים סינים בפרויקט כבישים ונמלים בבלוצ׳יסטן הותקפו. בייג׳ינג דורשת אבטחה טובה יותר.',
    ch: [C_('יחידה מיוחדת לפרויקטים', { m: -0.0008, rl: { '156': 6 } }), C_('לאפשר אבטחה סינית', { rl: { '156': 8 }, ap: -3 }), C_('להאט את הפרויקטים', { rl: { '156': -6 }, ap: 1 })] },

  /* ---------- North Korea ---------- */
  { id: 'kp_famine', cc: KP, c: 'dom', w: 1.2, cd: 480, r: 'fin', t: 'רעב בכפרים', x: 'היבול נכשל והחורף קשה. בכפרים יש רעב, וחיילים לוקחים אוכל מחקלאים.',
    ch: [C_('לבקש סיוע מזון מהאו״ם', { rep: 2, ap: 1, m: 0.0005 }), C_('לפתוח את מחסני הצבא', { ap: 3, mil: { troops: 0.02 } }), C_('להכחיש ולהגביר תעמולה', { ap: -3, pop: -0.001 })] },
  { id: 'kp_succ', cc: KP, c: 'dom', w: 0.9, cd: 900, r: 'int', t: 'שאלת הירושה', x: 'שמועות על בריאות המנהיג מתפשטות. גנרלים ובני משפחה מתחילים לבחור צדדים.',
    ch: [C_('להציג יורשת בפומבי', { ap: 2, un: -1 }), C_('לטהר גנרלים חשודים', { ap: -1, mil: { troops: 0.01 }, rep: -2 }), C_('לשתוק', { un: 1 })] },
  { id: 'kp_test', cc: KP, c: 'intl', w: 1.2, cd: 420, r: 'def', t: 'ניסוי טיל בין-יבשתי', x: 'המדענים מוכנים לשגר טיל חדש שיכול להגיע עד ארה״ב.',
    ch: [C_('לשגר מעל יפן', { ap: 3, rep: -5, rl: { '392': -12, '840': -8, '410': -8 } }, { f: () => { const c = P(); c.mlv = Math.min(3, (c.mlv || 0) + (R() < 0.3 ? 1 : 0)); } }), C_('לשגר לים', { ap: 2, rep: -2, rl: { '410': -3 } }), C_('לדחות תמורת סיוע מזון', { rep: 3, m: 0.0008, ap: -1 })] },
  { id: 'kp_defect', cc: KP, c: 'intl', w: 0.8, cd: 600, r: 'fo', t: 'דיפלומט ערק', x: 'דיפלומט בכיר בשגרירות שלנו באירופה ערק לדרום יחד עם משפחתו.',
    ch: [C_('להחליף את כל הדיפלומטים', { m: -0.0001, rep: -1 }), C_('להכחיש בשקט', { ap: -1 }), C_('להעניש את קרובי משפחתו', { rep: -4, ap: 1 })] },
  { id: 'kp_russia', cc: KP, c: 'intl', w: c => evAl('643') ? 1.2 : 0, cd: 540, r: 'def', t: 'עסקת נשק עם רוסיה', x: 'מוסקבה מבקשת פגזים, טילים וחיילים. בתמורה: נפט, מזון וטכנולוגיה צבאית.',
    ch: [C_('לשלוח פגזים וחיילים', { rl: { '643': 15, '410': -8 }, m: 0.002, mil: { troops: 0.01 }, rep: -3 }), C_('רק פגזים', { rl: { '643': 6 }, m: 0.001 }), C_('לסרב', { rl: { '643': -6 } })] },

  /* ---------- Japan ---------- */
  { id: 'jp_senkaku', cc: ['392'], c: 'intl', w: c => evAl('156') ? 1.2 : 0, cd: 480, r: 'def', t: 'ספינות סיניות ליד איי סנקאקו', x: 'ספינות של משמר החופים הסיני נכנסות שוב ושוב למים של האיים שבמחלוקת. הדייגים שלנו מפחדים לצאת.',
    ch: [C_('לתגבר את משמר החופים', { m: -0.0006, ap: 2, rl: { '156': -6 } }), C_('מחאה דיפלומטית', { rl: { '156': -2 } }), C_('סיור משותף עם ארה״ב', { rl: { '156': -10, '840': 5 }, ap: 1 })] },
  { id: 'jp_defense', cc: ['392'], c: 'dom', w: 1, cd: 720, r: 'def', t: 'להכפיל את תקציב הביטחון?', x: 'בגלל המתיחות באזור הממשלה מציעה להכפיל את תקציב הביטחון. רבים חוששים לפגוע במסורת השלום שאחרי המלחמה.',
    ch: [C_('להכפיל', { m: -0.002, ap: -1, rl: { '840': 5, '156': -5 } }, { f: () => evInv('air', 0.05) }), C_('תוספת מתונה', { m: -0.0008 }), C_('להשאיר כמו שהוא', { ap: 1, rl: { '840': -3 } })] },
  { id: 'jp_aging', cc: ['392'], c: 'dom', w: 1, cd: 600, r: 'fin', t: 'החברה המזדקנת', x: 'כמעט שליש מהתושבים מעל גיל 65. כפרים מתרוקנים ואין מספיק עובדים בבתי אבות ובמפעלים.',
    ch: [C_('לפתוח להגירת עובדים', { pop: 0.003, ap: -2, gv: 0.001, gd: 1095 }), C_('רובוטים וטיפול אוטומטי', { m: -0.001, gv: 0.001, gd: 1095 }), C_('להעלות את גיל הפרישה', { ap: -3, m: 0.001 })] },

  /* ---------- Germany ---------- */
  { id: 'de_energy', cc: ['276'], c: 'dom', w: 1.1, cd: 600, r: 'fin', t: 'משבר האנרגיה והתעשייה', x: 'בלי הגז הרוסי הזול מפעלי כימיה ופלדה סוגרים קווים ועוברים לחו״ל.',
    ch: [C_('סבסוד חשמל לתעשייה', { m: -0.002, ap: 1 }), C_('האצת אנרגיה ירוקה', { m: -0.0015, rep: 2, gv: 0.001, gd: 1095 }), C_('לתת לשוק להחליט', { gdp: -0.003, ap: -2 })] },
  { id: 'de_far', cc: ['276'], c: 'dom', w: 1, cd: 720, r: 'int', t: 'עליית הימין הקיצוני', x: 'מפלגה קיצונית מובילה בסקרים בכמה מדינות במזרח. מפלגות המרכז מתווכחות אם להחרים אותה.',
    ch: [C_('לבקש לבדוק אם לפסול אותה', { ap: -1, un: 1, rep: 1 }), C_('לטפל בהגירה וביוקר המחיה', { m: -0.001, ap: 2 }), C_('להתעלם', { ap: -2 })] },
  { id: 'de_debt', cc: ['276'], c: 'dom', w: 1, cd: 720, r: 'fin', t: '"בלם החוב"', x: 'החוקה מגבילה גירעון, אבל הכבישים, הגשרים והצבא זקוקים להשקעה ענקית.',
    ch: [C_('לשנות את החוקה ולהשקיע', { m: 0.003, gv: 0.001, gd: 1095, ap: -1 }), C_('לקצץ בתקציבים אחרים', { ap: -2 }), C_('קרן מיוחדת לצבא בלבד', { m: 0.001 }, { f: () => evInv('tanks', 0.05) })] },

  /* ---------- France ---------- */
  { id: 'fr_pens', cc: ['250'], c: 'dom', w: 1.2, cd: 600, r: 'fin', t: 'מחאת גיל הפרישה', x: 'הממשלה רוצה להעלות את גיל הפרישה. האיגודים משביתים את הרכבות והפחים נערמים ברחובות פריז.',
    ch: [C_('להעביר בצו בלי הצבעה', { m: 0.002, ap: -4, un: 2 }), C_('פשרה עם האיגודים', { m: 0.0008, ap: -1 }), C_('לגנוז את הרפורמה', { ap: 2, m: -0.001 })] },
  { id: 'fr_riots', cc: ['250'], c: 'dom', w: 1, cd: 600, r: 'int', t: 'מהומות בפרברים', x: 'נער נהרג מירי שוטר בבדיקה בכביש. בפרברים שורפים מכוניות ומבני ציבור כבר שלושה לילות.',
    ch: [C_('עוצר וכוחות תגבור', { ap: 1, un: -1, rep: -1 }), C_('חקירה עצמאית ותוכנית לפרברים', { m: -0.0008, ap: 1 }), C_('לחכות שיירגע', { ap: -3, un: 1 })] },
  { id: 'fr_farm', cc: ['250'], c: 'dom', w: 1, cd: 540, r: 'fin', t: 'החקלאים חוסמים כבישים', x: 'חקלאים עם טרקטורים חוסמים את הכבישים לפריז, נגד רגולציה של האיחוד האירופי ונגד מזון זול מיובא.',
    ch: [C_('הקלות וסובסידיות', { m: -0.001, ap: 2 }), C_('להתנגד להסכם הסחר עם דרום אמריקה', { ap: 2, rl: { '076': -5 } }), C_('לפנות את החסימות', { ap: -2, un: 1 })] },

  /* ---------- United Kingdom ---------- */
  { id: 'uk_eu', cc: ['826'], c: 'intl', w: 1, cd: 720, r: 'fo', t: 'לחזור קרוב יותר לאירופה?', x: 'סקרים מראים שרוב הציבור מתחרט על הברקזיט. בבריסל מוכנים לדבר על שוק משותף למזון ולסטודנטים.',
    ch: [C_('הסכם קרבה עם האיחוד', { rd: 3, gv: 0.001, gd: 1095, ap: -1 }), C_('צעדים קטנים בלבד', { rd: 1 }), C_('להתמקד בהסכמים מחוץ לאירופה', { rl: { '840': 3, '356': 3 }, rd: -2 })] },
  { id: 'uk_nhs', cc: ['826'], c: 'dom', w: 1.1, cd: 540, r: 'fin', t: 'מערכת הבריאות קורסת', x: 'רשימות ההמתנה בבתי החולים שוברות שיאים, ואחיות ורופאים צעירים שובתים.',
    ch: [C_('תוספת תקציב גדולה', { m: -0.002, ap: 3 }), C_('לשלב רפואה פרטית', { ap: -2, m: 0.0005 }), C_('הסכם שכר מצומצם', { m: -0.0006, ap: 1 })] },
  { id: 'uk_scot', cc: ['826'], c: 'dom', w: 0.8, cd: 1200, r: 'int', t: 'קריאה למשאל עם בסקוטלנד', x: 'ממשלת סקוטלנד דורשת משאל עם חדש על עצמאות. בסקרים כמעט תיקו.',
    ch: [C_('לסרב למשאל', { ap: -1, un: 1 }), C_('יותר סמכויות לסקוטלנד', { ap: 1, m: -0.0005 }), C_('לאשר משאל עם', { ap: -1, rep: 2 })] },

  /* ---------- Turkey ---------- */
  { id: 'tr_lira', cc: ['792'], c: 'dom', w: 1.2, cd: 480, r: 'fin', t: 'הלירה צונחת', x: 'האינפלציה עברה 50% והלירה מאבדת ערך כל שבוע. אנשים קונים דולרים וזהב.',
    ch: [C_('להעלות ריבית בחדות', { gv: -0.002, gd: 365, rep: 2 }), C_('להעלות שכר מינימום', { ap: 3, m: -0.001, gv: -0.001, gd: 365 }), C_('להוריד ריבית ולקוות', { ap: 1, gdp: -0.003 })] },
  { id: 'tr_kurd', cc: ['792'], c: 'dom', w: 0.9, cd: 900, r: 'int', t: 'הצעת שלום מהמחתרת הכורדית', x: 'המחתרת הכורדית (PKK) מציעה להניח את הנשק ולהתפרק, בתמורה לזכויות פוליטיות ותרבותיות.',
    ch: [C_('לקבל ולפתוח בתהליך', { ap: -1, rep: 4, un: -1 }), C_('לדרוש פירוק בלי תנאים', { ap: 2 }), C_('להמשיך במבצעים צבאיים', { ap: 1, rep: -2, mil: { troops: 0.002 } })] },
  { id: 'tr_nato', cc: ['792'], c: 'intl', w: 1, cd: 720, r: 'fo', t: 'קלף הווטו בנאט״ו', x: 'מדינה אירופית מבקשת להצטרף לנאט״ו וצריכה את ההסכמה שלנו. זה הרגע לבקש משהו בתמורה.',
    ch: [C_('לאשר תמורת מטוסי קרב', { rd: 3, rl: { '840': 5 } }, { f: () => evInv('air', 0.04) }), C_('לאשר מיד', { rd: 4, rep: 2, ap: -1 }), C_('לחסום', { rd: -5, ap: 2, rl: { '643': 4 } })] },

  /* ---------- Saudi Arabia ---------- */
  { id: 'sa_vision', cc: ['682'], c: 'dom', w: 1, cd: 720, r: 'fin', t: 'עיר עתיד במדבר', x: 'פרויקט הענק של עיר עתידנית במדבר חורג מהתקציב בעשרות מיליארדים. המשקיעים הזרים מהססים.',
    ch: [C_('להמשיך במלוא הכוח', { m: -0.003, gv: 0.001, gd: 1095, rep: 1 }), C_('לצמצם את הפרויקט', { m: -0.001 }), C_('להשקיע בתיירות ובספורט', { m: -0.0015, rep: 3 })] },
  { id: 'sa_israel', cc: ['682'], c: 'intl', w: c => evAl('376') ? 1 : 0, cd: 900, r: 'fo', t: 'נורמליזציה עם ישראל?', x: 'ארה״ב מציעה ברית הגנה וכור גרעיני אזרחי — בתמורה להסכם שלום עם ישראל.',
    ch: [C_('לחתום בתנאי צעדים לפלסטינים', { rl: { '376': 20, '840': 10 }, rep: 3, ap: -2 }), C_('רק שיתוף כלכלי שקט', { rl: { '376': 6, '840': 3 } }), C_('לסרב', { rl: { '840': -4 }, ap: 2 })] },
  { id: 'sa_yemen', cc: ['682'], c: 'intl', w: 0.9, cd: 600, r: 'def', t: 'רחפנים מתימן', x: 'החות׳ים שיגרו רחפנים ומטוסים בלי טייס על מתקני נפט בדרום. אחד הצינורות עולה באש.', b: { gdp: -0.001 },
    ch: [C_('תקיפות אוויר בתימן', { ap: 2, rep: -3, mil: { air: 0.005 } }), C_('שיחות שלום בתיווך עומאן', { rep: 3, ap: -1 }), C_('לקנות עוד הגנה אווירית', { m: -0.001 })] },

  /* ---------- Egypt ---------- */
  { id: 'eg_nile', cc: ['818'], c: 'intl', w: c => evAl('231') ? 1.2 : 0, cd: 600, r: 'fo', t: 'סכר הנהדה על הנילוס', x: 'אתיופיה ממלאת את הסכר הענק על הנילוס הכחול. החקלאים שלנו חוששים שהמים לא יספיקו.',
    ch: [C_('לפנות לאו״ם ולארה״ב', { rep: 2, rl: { '231': -3 } }), C_('איום צבאי גלוי', { ap: 3, rep: -3, rl: { '231': -15 }, wr: 1 }, { f: () => evWar('231', 0.04, 'אחרי האיום על הסכר') }), C_('הסכם חלוקת מים', { rl: { '231': 8 }, ap: -2 })] },
  { id: 'eg_debt', cc: ['818'], c: 'dom', w: 1.2, cd: 480, r: 'fin', t: 'החוב והפיחות', x: 'הלירה המצרית איבדה חצי מערכה, ומחיר הלחם המסובסד עלה. קרן המטבע מציעה הלוואה בתנאים.',
    ch: [C_('הלוואה מקרן המטבע', { m: 0.003, ap: -3 }), C_('השקעה מהמפרץ בתמורה לקרקעות', { m: 0.004, ap: -1, rl: { '784': 6 } }), C_('להמשיך לסבסד לחם', { m: -0.002, ap: 2 })] },
  { id: 'eg_suez', cc: ['818'], c: 'intl', w: 1, cd: 600, r: 'fin', t: 'ספינות עוקפות את תעלת סואץ', x: 'בגלל התקפות בים האדום חברות ספנות מעדיפות להקיף את אפריקה. ההכנסות מהתעלה צנחו בחצי.', b: { m: -0.001 },
    ch: [C_('הנחות במעבר', { m: -0.0005, rep: 1 }), C_('להצטרף לכוח ימי בינלאומי', { rl: { '840': 4 }, ap: -1, mil: { ships: 0.02 } }), C_('לחכות', {})] },

  /* ---------- Brazil ---------- */
  { id: 'br_amazon', cc: ['076'], c: 'intl', w: 1.1, cd: 600, r: 'int', t: 'כריתת יערות האמזונס', x: 'תמונות לוויין מראות קפיצה בכריתת יער. אירופה מאיימת לעצור את הסכם הסחר.',
    ch: [C_('אכיפה חזקה וקרן יער', { m: -0.0008, rep: 4, ap: -1 }), C_('לבקש כסף מהמדינות העשירות', { rep: 1, m: 0.0005 }), C_('לתמוך בחקלאים ובכורים', { ap: 2, rep: -4, gv: 0.001, gd: 365 })] },
  { id: 'br_polar', cc: ['076'], c: 'dom', w: 1, cd: 720, r: 'int', t: 'תומכים מסתערים על המוסדות', x: 'אחרי בחירות צמודות, אלפי תומכים של המחנה המפסיד פרצו לבנייני הממשל בבירה.',
    ch: [C_('מעצרים ומשפטים', { ap: 1, rep: 2, un: -1 }), C_('חנינה כללית לפיוס', { ap: -1, un: 1 }), C_('ועדת חקירה לאומית', { ap: 1, m: -0.0001 })] },
  { id: 'br_brics', cc: ['076'], c: 'intl', w: 0.9, cd: 720, r: 'fo', t: 'בין ארה״ב ל-BRICS', x: 'מדינות BRICS מציעות לסחור במטבעות מקומיים במקום בדולר. וושינגטון מזהירה ממכסים.',
    ch: [C_('להצטרף ליוזמה', { rl: { '156': 6, '840': -8 }, gv: 0.001, gd: 365 }), C_('להישאר ניטרליים', { rep: 1 }), C_('לדחות את ההצעה', { rl: { '840': 4, '156': -3 } })] },

  /* ---------- Mexico ---------- */
  { id: 'mx_cartel', cc: ['484'], c: 'dom', w: 1.3, cd: 480, r: 'def', t: 'מלחמת הקרטלים', x: 'קרטל סמים חסם כבישים ושרף משאיות אחרי מעצר של מנהיג. בעיר שלמה אנשים מסתגרים בבתים.',
    ch: [C_('לשלוח את הצבא', { ap: 2, mil: { troops: 0.002 }, un: -1 }), C_('לבקש עזרה מארה״ב', { rl: { '840': 5 }, ap: -2 }), C_('"חיבוקים, לא כדורים" — תוכניות לנוער', { m: -0.0006, ap: -1 })] },
  { id: 'mx_us', cc: ['484'], c: 'intl', w: c => evAl('840') ? 1.2 : 0, cd: 540, r: 'fin', t: 'איום מכסים מהצפון', x: 'וושינגטון מאיימת במכסים של 25% אם לא נעצור את המהגרים ואת הפנטניל בגבול.',
    ch: [C_('לשלוח חיילים לגבול', { rl: { '840': 6 }, ap: -1, m: -0.0005 }), C_('מכסים נגדיים', { rl: { '840': -8 }, ap: 3, gv: -0.002, gd: 365 }), C_('משא ומתן שקט', { rl: { '840': 2 } })] },
  { id: 'mx_jud', cc: ['484'], c: 'dom', w: 0.9, cd: 900, r: 'int', t: 'שופטים נבחרים בבחירות', x: 'רפורמה חדשה קובעת שהציבור יבחר את השופטים. המשקיעים והאופוזיציה חוששים לעצמאות בתי המשפט.',
    ch: [C_('להעביר את הרפורמה', { ap: 2, rep: -2, gv: -0.001, gd: 365 }), C_('לרכך אותה', { ap: -1 }), C_('לגנוז', { ap: -2, rep: 1 })] },

  /* ---------- Venezuela ---------- */
  { id: 've_elec', cc: ['862'], c: 'dom', w: 1.2, cd: 720, r: 'int', t: 'בחירות שנויות במחלוקת', x: 'האופוזיציה מציגה תוצאות מהקלפיות שלפיהן ניצחה. ועדת הבחירות מכריזה על ניצחון השלטון.',
    ch: [C_('לפרסם את כל התוצאות', { rep: 4, ap: 1, un: -1 }), C_('לעצור את ראשי האופוזיציה', { ap: -3, rep: -5, rd: -4, un: 2 }), C_('לפתוח בשיחות בתיווך', { rep: 2, ap: -1 })] },
  { id: 've_exodus', cc: ['862'], c: 'dom', w: 1, cd: 600, r: 'fin', t: 'גל ההגירה', x: 'מיליונים כבר עזבו, ובכל חודש עוד עשרות אלפים חוצים לקולומביה ולברזיל. רופאים ומהנדסים נעלמים.',
    ch: [C_('להקל על הכלכלה', { m: -0.001, ap: 2, pop: 0.001 }), C_('לסגור את הגבולות', { ap: -2, rep: -2 }), C_('להתעלם', { pop: -0.003 })] },
  { id: 've_esse', cc: ['862'], c: 'intl', w: c => evAl('328') ? 0.9 : 0, cd: 900, r: 'fo', t: 'מחלוקת אסקיבו', x: 'משאל עם אצלנו תמך בסיפוח אזור אסקיבו של גיאנה, העשיר בנפט. גיאנה פונה לבית הדין בהאג.',
    ch: [C_('להציב כוחות בגבול', { ap: 3, rep: -4, rl: { '328': -20, '840': -5 } }), C_('לכבד את בית הדין', { rep: 3, ap: -2 }), C_('לדרוש משא ומתן', { rl: { '328': -3 } })] },

  /* ---------- Syria ---------- */
  { id: 'sy_rebuild', cc: ['760'], c: 'dom', w: 1.2, cd: 600, r: 'fin', t: 'שיקום אחרי המלחמה', x: 'ערים שלמות הרוסות. מדינות המפרץ וטורקיה מציעות כסף לשיקום — כל אחת עם תנאים.',
    ch: [C_('לקבל כסף מהמפרץ', { m: 0.003, rl: { '682': 6, '784': 6 } }), C_('חברות טורקיות לבנייה', { m: 0.002, rl: { '792': 6 }, ap: -1 }), C_('לשקם לאט בכוחות עצמנו', { m: -0.001, ap: 1 })] },
  { id: 'sy_sanc', cc: ['760'], c: 'intl', w: 1, cd: 720, r: 'fo', t: 'הסרת הסנקציות', x: 'ארה״ב ואירופה מוכנות להסיר סנקציות — בתנאי שנשמור על המיעוטים ונגרש לוחמים זרים.',
    ch: [C_('להתחייב לתנאים', { rd: 5, gv: 0.002, gd: 1095, ap: -1 }), C_('להתחייב חלקית', { rd: 2 }), C_('לסרב', { rd: -3, ap: 1 })] },
  { id: 'sy_kurd', cc: ['760'], c: 'dom', w: 1, cd: 720, r: 'def', t: 'הכורדים בצפון-מזרח', x: 'הכוחות הכורדיים שולטים בשדות הנפט בצפון-מזרח. הם מוכנים להשתלב בצבא — תמורת אוטונומיה.',
    ch: [C_('הסכם אוטונומיה', { ap: -1, m: 0.001, rl: { '792': -6 } }), C_('שילוב בלי אוטונומיה', { ap: 1, un: 1 }), C_('לשלוח את הצבא', { ap: 1, mil: { troops: 0.01 }, rep: -2 })] },

  /* ---------- Lebanon ---------- */
  { id: 'lb_bank', cc: ['422'], c: 'dom', w: 1.2, cd: 540, r: 'fin', t: 'החסכונות הנעולים בבנקים', x: 'הבנקים לא מחזירים לחוסכים את כספם כבר שנים. מפקיד זועם החזיק סניף בכוח ודרש את החסכונות של אמו.',
    ch: [C_('רפורמת בנקים עם קרן המטבע', { m: 0.002, ap: 2, rep: 2 }), C_('להחזיר לחוסכים הקטנים', { m: -0.001, ap: 3 }), C_('להגן על הבנקים', { ap: -3, un: 1 })] },
  { id: 'lb_hez', cc: ['422'], c: 'dom', w: 1, cd: 720, r: 'def', t: 'פירוק הנשק של חיזבאללה', x: 'ארה״ב וצרפת מציעות סיוע ענק לצבא — בתנאי שרק הצבא יחזיק נשק בדרום המדינה.',
    ch: [C_('לקבל ולפרוס את הצבא בדרום', { rd: 5, rl: { '364': -8, '376': 5 }, ap: -1, un: 1 }), C_('פירוק הדרגתי בהסכמה', { rd: 2 }), C_('לסרב', { rd: -4, rl: { '364': 4 } })] },
  { id: 'lb_port', cc: ['422'], c: 'dom', w: 0.9, cd: 720, r: 'int', t: 'חקירת הפיצוץ בנמל', x: 'שנים אחרי הפיצוץ הענק בנמל ביירות, השופט החוקר מזמן שרים לשעבר. משפחות ההרוגים דורשות צדק.',
    ch: [C_('לתת לשופט לעבוד', { ap: 3, rep: 2, un: 1 }), C_('להעביר את התיק לשופט אחר', { ap: -3 }), C_('להציע פיצויים למשפחות', { m: -0.0005, ap: 1 })] },

  /* ---------- Poland ---------- */
  { id: 'pl_border', cc: ['616'], c: 'intl', w: c => evAl('112') ? 1 : 0, cd: 540, r: 'def', t: 'לחץ מהגרים בגבול בלארוס', x: 'בלארוס מביאה מהגרים לגבול ודוחפת אותם לחצות. חיילים שלנו הותקפו באבנים.',
    ch: [C_('חומה וחיילים', { m: -0.0008, ap: 2, rep: -1, rl: { '112': -6 } }), C_('לקלוט ולבדוק בקשות', { ap: -2, rep: 2 }), C_('לסגור את מעברי הגבול', { ap: 1, gv: -0.001, gd: 365, rl: { '112': -8 } })] },
  { id: 'pl_army', cc: ['616'], c: 'dom', w: 1, cd: 720, r: 'def', t: 'הצבא החזק באירופה', x: 'הממשלה רוצה להגיע ל-4.5% מהתמ״ג לביטחון: טנקים מקוריאה ומטוסים מארה״ב.',
    ch: [C_('לקנות בגדול', { m: -0.002, ap: 1, rl: { '840': 4, '410': 4 } }, { f: () => evInv('tanks', 0.1) }), C_('לבנות תעשייה מקומית', { m: -0.0012, gv: 0.001, gd: 1095 }), C_('להאט', { ap: -1, rl: { '840': -2 } })] },
  { id: 'pl_grain', cc: ['616'], c: 'intl', w: c => evAl('804') ? 1 : 0, cd: 600, r: 'fin', t: 'חקלאים נגד החיטה מאוקראינה', x: 'חיטה זולה מאוקראינה מציפה את השוק. החקלאים חוסמים את מעברי הגבול.',
    ch: [C_('לאסור ייבוא', { ap: 3, rl: { '804': -8 }, rd: -1 }), C_('פיצוי לחקלאים', { m: -0.0008, ap: 1 }), C_('להמשיך בסחר חופשי', { ap: -3, rl: { '804': 5 } })] },

  /* ---------- Hungary ---------- */
  { id: 'hu_funds', cc: ['348'], c: 'intl', w: 1.1, cd: 600, r: 'fin', t: 'כספי האיחוד מוקפאים', x: 'בריסל הקפיאה מיליארדי אירו בגלל חשש לעצמאות בתי המשפט ולשחיתות במכרזים.',
    ch: [C_('רפורמות כדי לשחרר את הכסף', { m: 0.003, rd: 3, ap: -1 }), C_('להשתמש בווטו כקלף', { m: 0.001, rd: -4, ap: 1 }), C_('להתעלם ולפנות לסין', { rl: { '156': 6 }, rd: -3 })] },
  { id: 'hu_veto', cc: ['348'], c: 'intl', w: c => evAl('804') ? 1 : 0, cd: 600, r: 'fo', t: 'וטו על הסיוע לאוקראינה', x: 'כל האיחוד מחכה להסכמה שלנו לחבילת סיוע לאוקראינה. מוסקבה מעודדת אותנו לחסום.',
    ch: [C_('להטיל וטו', { rd: -6, rl: { '643': 6, '804': -10 }, ap: 1 }), C_('לצאת מהחדר ולאפשר', { rd: 2 }), C_('לתמוך בגלוי', { rd: 5, rl: { '643': -6 }, ap: -1 })] },
  { id: 'hu_media', cc: ['348'], c: 'dom', w: 0.9, cd: 720, r: 'int', t: 'חופש העיתונות', x: 'אחד מכלי התקשורת העצמאיים האחרונים נקנה על ידי איש עסקים מקורב לשלטון. עיתונאים מפגינים.',
    ch: [C_('לחזק את הרגולטור העצמאי', { rep: 3, ap: -1 }), C_('לא להתערב', { rep: -2 }), C_('לסגור את התחקירים', { rep: -4, ap: 1, rd: -2 })] },

  /* ---------- Nigeria ---------- */
  { id: 'ng_fuel', cc: ['566'], c: 'dom', w: 1.2, cd: 540, r: 'fin', t: 'ביטול סבסוד הדלק', x: 'סבסוד הדלק עולה מיליארדים בשנה. ביטול שלו יחסוך הרבה — אבל מחיר התחבורה והאוכל יזנק.',
    ch: [C_('לבטל בבת אחת', { m: 0.003, ap: -4, un: 2 }), C_('לבטל בהדרגה עם מענקים', { m: 0.001, ap: -1 }), C_('להשאיר', { m: -0.001, ap: 1 })] },
  { id: 'ng_kidnap', cc: ['566'], c: 'dom', w: 1.1, cd: 480, r: 'def', t: 'חטיפת תלמידים', x: 'חמושים חטפו מאות תלמידים מבית ספר בצפון. ההורים חוסמים כבישים ודורשים פעולה.',
    ch: [C_('מבצע חילוץ', { ap: 3, mil: { troops: 0.001 } }), C_('לשלם כופר בשקט', { m: -0.0002, ap: 1, rep: -1 }), C_('משא ומתן עם ראשי השבטים', { ap: 1 })] },
  { id: 'ng_oil', cc: ['566'], c: 'dom', w: 0.9, cd: 600, r: 'fin', t: 'גניבת נפט בדלתה', x: 'כנופיות קודחות בצינורות ומוכרות נפט בשוק השחור. ההפקה הרשמית צנחה.',
    ch: [C_('צבא לשמירה על הצינורות', { m: -0.0008, gv: 0.001, gd: 730 }), C_('חוזים לקהילות המקומיות', { m: -0.0005, ap: 1, gv: 0.001, gd: 365 }), C_('להתעלם', { gv: -0.002, gd: 365 })] },

  /* ---------- South Africa ---------- */
  { id: 'za_power', cc: ['710'], c: 'dom', w: 1.2, cd: 480, r: 'fin', t: 'הפסקות חשמל יומיות', x: 'חברת החשמל הלאומית לא עומדת בביקוש. כל יום יש שעות בלי חשמל, ועסקים קטנים קורסים.',
    ch: [C_('לפתוח לחברות פרטיות', { gv: 0.002, gd: 1095, ap: -1 }), C_('חילוץ לחברת החשמל', { m: -0.002, ap: 1 }), C_('סולארי על כל גג', { m: -0.001, rep: 2, gv: 0.001, gd: 730 })] },
  { id: 'za_crime', cc: ['710'], c: 'dom', w: 1, cd: 540, r: 'int', t: 'גל פשיעה', x: 'שיעור הרצח שובר שיאים, ושכונות שלמות מעסיקות שומרים פרטיים.',
    ch: [C_('הצבא לרחובות', { ap: 2, rep: -1 }), C_('עוד שוטרים ותעסוקה לצעירים', { m: -0.001, ap: 1 }), C_('לחכות', { ap: -2 })] },
  { id: 'za_icj', cc: ['710'], c: 'intl', w: c => evAl('376') ? 0.8 : 0, cd: 900, r: 'fo', t: 'תביעה בהאג', x: 'פעילים דורשים שנגיש תביעה נגד ישראל בבית הדין הבינלאומי. וושינגטון מזהירה שזה יפגע ביחסים.',
    ch: [C_('להגיש את התביעה', { rl: { '376': -15, '840': -5 }, ap: 2, rep: 1 }), C_('להצטרף לתביעה של אחרים', { rl: { '376': -6 } }), C_('לא להגיש', { ap: -1, rl: { '840': 2 } })] },

  /* ---------- Indonesia ---------- */
  { id: 'id_capital', cc: ['360'], c: 'dom', w: 1, cd: 900, r: 'fin', t: 'עיר הבירה החדשה', x: 'ג׳קרטה שוקעת לים, ובבורנאו בונים בירה חדשה. הפרויקט חורג מהתקציב והמשקיעים מהססים.',
    ch: [C_('להאיץ את הבנייה', { m: -0.002, ap: 1, gv: 0.001, gd: 1095 }), C_('להאט ולחכות למשקיעים', { ap: -1 }), C_('להזמין חברות סיניות', { m: -0.0005, rl: { '156': 6 }, rd: -1 })] },
  { id: 'id_nickel', cc: ['360'], c: 'intl', w: 1, cd: 720, r: 'fin', t: 'מלחמת הניקל', x: 'אסרנו לייצא ניקל גולמי כדי שהמפעלים לסוללות ייבנו אצלנו. האיחוד האירופי תובע אותנו.',
    ch: [C_('לעמוד על האיסור', { gv: 0.002, gd: 1095, rd: -2 }), C_('פשרה עם אירופה', { rd: 2, gv: 0.001, gd: 730 }), C_('לבטל את האיסור', { m: 0.001, ap: -2 })] },
  { id: 'id_natuna', cc: ['360'], c: 'intl', w: c => evAl('156') ? 1 : 0, cd: 600, r: 'def', t: 'ספינות סיניות ליד נטונה', x: 'ספינות דיג סיניות בליווי משמר החופים נכנסו למים הכלכליים שלנו ליד איי נטונה.',
    ch: [C_('לשלוח את הצי', { ap: 2, rl: { '156': -6 }, m: -0.0003 }), C_('מחאה דיפלומטית', { rl: { '156': -2 } }), C_('להתעלם', { ap: -2 })] },

  /* ---------- Australia ---------- */
  { id: 'au_china', cc: ['036'], c: 'intl', w: c => evAl('156') ? 1 : 0, cd: 600, r: 'fin', t: 'סין עוצרת סחורות', x: 'סין הטילה מכסים על היין, השעורה והפחם שלנו אחרי שדרשנו חקירה בינלאומית.',
    ch: [C_('לעמוד על שלנו', { ap: 2, rl: { '156': -5 }, gv: -0.001, gd: 365 }), C_('לחפש שווקים בהודו', { rl: { '356': 6 }, m: -0.0003 }), C_('להתפייס', { rl: { '156': 6 }, ap: -2 })] },
  { id: 'au_aukus', cc: ['036'], c: 'intl', w: 0.9, cd: 900, r: 'def', t: 'הצוללות של AUKUS', x: 'עסקת הצוללות הגרעיניות עם ארה״ב ובריטניה תעלה מאות מיליארדים לאורך שנים. יש מי שרוצה לבטל.',
    ch: [C_('להמשיך בעסקה', { m: -0.002, rl: { '840': 5, '826': 5 } }, { f: () => evInv('subs', 0.2) }), C_('לבקש לדחות תשלומים', { rl: { '840': -2 } }), C_('לבטל', { m: 0.001, rl: { '840': -10, '826': -6 }, ap: 1 })] },
  { id: 'au_fire', cc: ['036'], c: 'dom', w: 1, cd: 480, r: 'int', t: 'עונת השריפות', x: 'שריפות ענק משתוללות בדרום-מזרח. עשן מכסה את סידני, וכפרים שלמים מפונים.', b: { gdp: -0.002 },
    ch: [C_('הצבא ומטוסי כיבוי', { m: -0.001, ap: 2 }), C_('תוכנית אקלים לאומית', { m: -0.0008, rep: 3 }), C_('להשאיר למדינות', { ap: -2 })] },

  /* ---------- Canada ---------- */
  { id: 'ca_us', cc: ['124'], c: 'intl', w: c => evAl('840') ? 1.2 : 0, cd: 540, r: 'fin', t: 'מכסים מהשכן הדרומי', x: 'ארה״ב הטילה מכסים על פלדה, אלומיניום ועץ מקנדה. בחנויות מחרימים מוצרים אמריקאיים.',
    ch: [C_('מכסים נגדיים', { ap: 3, rl: { '840': -8 }, gv: -0.002, gd: 365 }), C_('לגוון סחר לאירופה ולאסיה', { rd: 2, gv: -0.001, gd: 365 }), C_('משא ומתן', { rl: { '840': 2 }, ap: -1 })] },
  { id: 'ca_india', cc: ['124'], c: 'intl', w: c => evAl('356') ? 0.8 : 0, cd: 900, r: 'fo', t: 'משבר דיפלומטי עם הודו', x: 'המשטרה חושדת שסוכנים זרים היו מעורבים ברצח פעיל סיקי אצלנו. הודו מכחישה בתוקף.',
    ch: [C_('לגרש דיפלומטים', { ap: 2, rl: { '356': -15 } }), C_('חקירה שקטה', { rl: { '356': -3 } }), C_('לסגור את הנושא', { ap: -2, rl: { '356': 4 } })] },
  { id: 'ca_fire', cc: ['124'], c: 'dom', w: 1, cd: 480, r: 'int', t: 'עשן השריפות', x: 'מאות שריפות בוערות ביערות הצפון. העשן מגיע עד ניו יורק, ועיירות שלמות פונו.', b: { gdp: -0.002 },
    ch: [C_('כבאים מחו״ל וצבא', { m: -0.001, ap: 2 }), C_('קרן לשיקום ולהגנה', { m: -0.0008, ap: 1 }), C_('להשאיר לפרובינציות', { ap: -2 })] },

  /* ---------- Greece / Cyprus ---------- */
  { id: 'gr_aegean', cc: ['300'], c: 'intl', w: c => evAl('792') ? 1 : 0, cd: 600, r: 'def', t: 'מתיחות בים האגאי', x: 'מטוסים טורקיים חודרים למרחב האווירי שלנו, וספינת מחקר טורקית מחפשת גז ליד אחד האיים.',
    ch: [C_('יירוט וכוננות', { m: -0.0004, ap: 2, rl: { '792': -6 } }), C_('לפנות לאיחוד ולנאט״ו', { rd: 2 }), C_('פגישת פיוס', { rl: { '792': 6 }, ap: -1 })] },
  { id: 'gr_migr', cc: ['300'], c: 'dom', w: 1, cd: 540, r: 'int', t: 'סירות מהגרים באיים', x: 'אלפי מהגרים מגיעים בסירות לאיים. המחנות מלאים, והאיחוד מבקש שנשמור טוב יותר על הגבול.',
    ch: [C_('לחזק את משמר החופים', { m: -0.0005, ap: 1, rep: -1 }), C_('לדרוש חלוקה בין מדינות האיחוד', { rd: -1, ap: 1 }), C_('לשפר את המחנות', { m: -0.0005, rep: 2 })] },
  { id: 'gr_debt', cc: ['300'], c: 'dom', w: 0.9, cd: 720, r: 'fin', t: 'החוב הישן', x: 'החוב עדיין גבוה מאוד. הבנקים באירופה מציעים מחזור חוב בריבית נמוכה — בתנאי רפורמות.',
    ch: [C_('לקבל ולבצע רפורמות', { m: 0.002, ap: -2, gv: 0.001, gd: 1095 }), C_('לסרב', { ap: 1 })] },
  { id: 'cy_unif', cc: ['196'], c: 'intl', w: 1, cd: 900, r: 'fo', t: 'שיחות על איחוד האי', x: 'האו״ם מזמין לסבב שיחות חדש על איחוד קפריסין עם הצפון. טורקיה דורשת שתי מדינות.',
    ch: [C_('להגיע עם הצעה נדיבה', { rep: 4, ap: -2, rl: { '792': 4 } }), C_('להגיע בלי ויתורים', { ap: 1 }), C_('להחרים את השיחות', { rep: -2, rl: { '792': -4 } })] },
  { id: 'cy_gas', cc: ['196'], c: 'intl', w: 1, cd: 720, r: 'fin', t: 'גז בים', x: 'נמצא מאגר גז גדול במים שלנו. טורקיה מזהירה מקידוחים בלי הסכמת הצפון.',
    ch: [C_('לקדוח עם חברות מערביות', { m: 0.002, gv: 0.001, gd: 1095, rl: { '792': -8 } }), C_('צינור משותף עם ישראל ויוון', { m: -0.001, rl: { '376': 6, '300': 6, '792': -5 } }), C_('להמתין', {})] },
  { id: 'cy_rus', cc: ['196'], c: 'intl', w: 0.8, cd: 720, r: 'fin', t: 'כסף רוסי בבנקים', x: 'ארה״ב חושפת חברות אצלנו שעוזרות לאוליגרכים רוסים לעקוף סנקציות.',
    ch: [C_('לסגור את החברות', { rd: 4, m: -0.0008, rl: { '643': -6 } }), C_('חקירה איטית', { rd: -1 }), C_('להגן על המגזר', { rd: -4, m: 0.0005 })] },

  /* ---------- Armenia / Azerbaijan ---------- */
  { id: 'am_csto', cc: ['051'], c: 'intl', w: c => evAl('643') ? 1 : 0, cd: 900, r: 'fo', t: 'לעזוב את הברית עם רוסיה?', x: 'רוסיה לא עזרה לנו במלחמה האחרונה. רבים רוצים לעזוב את הברית ולהתקרב למערב.',
    ch: [C_('להקפיא את החברות', { rl: { '643': -12 }, rd: 4, ap: 2 }), C_('להתקרב לאירופה בשקט', { rd: 2, rl: { '643': -3 } }), C_('להישאר נאמנים', { rl: { '643': 6 }, ap: -2 })] },
  { id: 'am_refug', cc: ['051'], c: 'dom', w: 1, cd: 720, r: 'int', t: 'פליטים מקרבאך', x: 'יותר ממאה אלף ארמנים ברחו מנגורנו קרבאך. הם צריכים בתים, עבודה ובתי ספר.',
    ch: [C_('תוכנית דיור לאומית', { m: -0.002, ap: 3, pop: 0.002 }), C_('לבקש סיוע בינלאומי', { rep: 2, m: 0.0005 }), C_('מענק חד-פעמי', { m: -0.0005 })] },
  { id: 'am_peace', cc: ['051'], c: 'intl', w: c => evAl('031') ? 1 : 0, cd: 900, r: 'fo', t: 'הסכם שלום עם אזרבייג׳ן', x: 'בוושינגטון מציעים הסכם שלום שכולל דרך מעבר דרך שטחנו. האופוזיציה קוראת לזה כניעה.',
    ch: [C_('לחתום', { rl: { '031': 15, '840': 5 }, ap: -3, rep: 4, gv: 0.001, gd: 1095 }), C_('לחתום בלי מסדרון', { rl: { '031': 4 } }), C_('לסרב', { ap: 2, rl: { '031': -6 } })] },
  { id: 'az_peace', cc: ['031'], c: 'intl', w: c => evAl('051') ? 1 : 0, cd: 900, r: 'fo', t: 'הסכם שלום עם ארמניה', x: 'בוושינגטון מציעים הסכם שלום שכולל דרך מעבר לנחיצ׳בן. ארמניה דורשת שנוותר על תביעות נוספות.',
    ch: [C_('לחתום', { rl: { '051': 15, '840': 5 }, rep: 4, gv: 0.001, gd: 1095 }), C_('ללחוץ עוד', { rl: { '051': -4 }, ap: 2 }), C_('לסרב', { rl: { '051': -8 }, rep: -2 })] },
  { id: 'az_gas', cc: ['031'], c: 'intl', w: 1, cd: 720, r: 'fin', t: 'גז לאירופה', x: 'אירופה מחפשת גז במקום הגז הרוסי ומבקשת להכפיל את מה שמגיע דרך הצינור שלנו.',
    ch: [C_('להכפיל את הייצוא', { m: 0.002, rd: 3, rl: { '643': -4 } }), C_('תוספת קטנה', { m: 0.001 }), C_('להעדיף שותפים אחרים', { rl: { '643': 3 } })] },
  { id: 'az_cop', cc: ['031'], c: 'intl', w: 0.8, cd: 900, r: 'fo', t: 'ביקורת על זכויות אדם', x: 'ארגוני זכויות אדם מתלוננים על מעצר עיתונאים, ודורשים מאירופה לעצור את עסקאות הגז.',
    ch: [C_('לשחרר עיתונאים', { rep: 4, rd: 2, ap: -1 }), C_('להתעלם', { rep: -2 }), C_('לגרש ארגונים זרים', { rep: -4, ap: 1 })] },

  /* ---------- Ethiopia / Sudan ---------- */
  { id: 'et_dam', cc: ['231'], c: 'intl', w: c => evAl('818') ? 1.1 : 0, cd: 720, r: 'fo', t: 'הסכר הגדול והמים של מצרים', x: 'סכר הנהדה מוכן להפיק חשמל לכל המדינה. מצרים מזהירה שזה מאיים על החיים שלה.',
    ch: [C_('למלא מהר', { gv: 0.002, gd: 1095, rl: { '818': -12 }, wr: 1 }, { f: () => evWar('818', 0.03, 'בגלל מילוי הסכר') }), C_('הסכם מילוי איטי', { gv: 0.001, gd: 1095, rl: { '818': 6 } }), C_('תיווך של האיחוד האפריקאי', { rep: 2 })] },
  { id: 'et_sea', cc: ['231'], c: 'intl', w: 0.9, cd: 900, r: 'fo', t: 'יציאה לים', x: 'אנחנו מהמדינות הגדולות בעולם בלי חוף. ממשלת סומלילנד מציעה לנו נמל בתמורה להכרה.',
    ch: [C_('לחתום ולהכיר', { m: -0.0005, gv: 0.001, gd: 1095, rl: { '706': -12 }, rep: -2 }), C_('לשכור נמל בג׳יבוטי', { m: -0.001, rl: { '262': 6 } }), C_('לוותר', {})] },
  { id: 'et_ethnic', cc: ['231'], c: 'dom', w: 1, cd: 600, r: 'def', t: 'מרד מיליציות במחוזות', x: 'מיליציות אזוריות מסרבות להתפרק ותוקפות תחנות משטרה. מחוז שלם מנותק.',
    ch: [C_('מבצע צבאי', { ap: 1, rep: -2, mil: { troops: 0.004 } }), C_('שיחות שלום מקומיות', { ap: -1, rep: 2 }), C_('מצב חירום', { rep: -3, un: 1 })] },
  { id: 'sd_war', cc: ['729'], c: 'dom', w: 1.2, cd: 480, r: 'def', t: 'מלחמת הגנרלים', x: 'הצבא ומיליציה חזקה נלחמים על השליטה בבירה ובמחוזות המערב. מיליונים עקורים.',
    ch: [C_('שיחות בתיווך סעודי', { rep: 3, rl: { '682': 6 }, ap: -1 }), C_('להתקפה גדולה', { ap: 2, mil: { troops: 0.01, tanks: 0.01 } }), C_('לבקש נשק מבעלי ברית', { m: -0.001, rep: -2 }, { f: () => evInv('msl', 0.1) })] },
  { id: 'sd_famine', cc: ['729'], c: 'dom', w: 1.1, cd: 480, r: 'int', t: 'רעב במחנות', x: 'ארגוני הסיוע מזהירים מרעב בהיקף ענק. משאיות המזון תקועות במחסומים.',
    ch: [C_('לפתוח מעברים לסיוע', { rep: 4, ap: 2 }), C_('רק דרך הממשלה', { rep: -2 }), C_('לחסום כדי ללחוץ על האויב', { rep: -6, ap: -2 })] },
  { id: 'sd_gold', cc: ['729'], c: 'intl', w: 0.9, cd: 600, r: 'fin', t: 'הזהב שבורח', x: 'זהב ממכרות שבשליטת מיליציות מוברח מחוץ למדינה ומממן את המלחמה.',
    ch: [C_('לבקש סנקציות על הקונים', { rep: 2, rl: { '784': -5 } }), C_('הסכם עם המברחים', { m: 0.001, rep: -2 }), C_('צבא למכרות', { mil: { troops: 0.002 }, m: 0.0005 })] },

  /* ---------- blocs and regions ---------- */
  { id: 'bl_eu_budget', bl: c => c.bl.includes('EU'), c: 'intl', w: 0.6, cd: 720, r: 'fin', t: 'ריב על תקציב האיחוד', x: 'האיחוד האירופי מתווכח על התקציב הבא: יותר לביטחון ולחקלאות, או יותר לירוק ולמדינות העניות?',
    ch: [C_('להגדיל את התרומה שלנו', { m: -0.0008, rd: 3, rep: 1 }), C_('לדרוש הנחה', { m: 0.0005, rd: -2 }), C_('לתמוך בקרן ביטחון משותפת', { m: -0.0005, rd: 2 })] },
  { id: 'bl_eu_rule', bl: c => c.bl.includes('EU'), c: 'intl', w: 0.5, cd: 900, r: 'fo', t: 'משבר שלטון החוק באיחוד', x: 'מדינה חברה נחשדת בפגיעה בעצמאות בתי המשפט. בבריסל מצביעים אם להקפיא לה כספים.',
    ch: [C_('להצביע בעד הקפאה', { rd: 2, rep: 1, rl: { '348': -5 } }), C_('להימנע', {}), C_('להצביע נגד', { rd: -2, rl: { '348': 5 } })] },
  { id: 'bl_eu_migr', bl: c => c.bl.includes('EU'), c: 'intl', w: 0.5, cd: 720, r: 'int', t: 'הסכם ההגירה האירופי', x: 'האיחוד מציע לחלק את מבקשי המקלט בין כל המדינות — מי שמסרבת משלמת קנס.',
    ch: [C_('לקלוט את החלק שלנו', { ap: -2, rep: 2, pop: 0.001 }), C_('לשלם במקום לקלוט', { m: -0.0005 }), C_('להתנגד להסכם', { ap: 2, rd: -2 })] },
  { id: 'bl_nato_summit', bl: c => c.bl.includes('NATO') && c.id !== '840', c: 'intl', w: 0.7, cd: 720, r: 'def', t: 'פסגת נאט״ו: יותר לביטחון', x: 'בפסגת נאט״ו ארה״ב דורשת מכל החברות להגיע ל-5% מהתמ״ג לביטחון, אחרת "אולי לא נבוא לעזור".',
    ch: [C_('להתחייב ל-5%', { m: -0.002, rl: { '840': 8 }, rd: 2, ap: -1 }, { f: () => evInv('troops', 0.02) }), C_('להתחייב לעלייה הדרגתית', { m: -0.0008, rl: { '840': 3 } }), C_('לסרב', { rl: { '840': -8 }, ap: 1 })] },
  { id: 'bl_nato_east', bl: c => c.bl.includes('NATO') && c.id !== '643', c: 'intl', w: 0.5, cd: 720, r: 'def', t: 'רחפנים מעל מזרח הברית', x: 'רחפנים לא מזוהים חדרו למרחב האווירי של מדינות במזרח נאט״ו. הברית מבקשת שנשלח מטוסים לסיור.',
    ch: [C_('לשלוח מטוסים', { m: -0.0004, rd: 3, rl: { '643': -4 } }), C_('לשלוח מערכת הגנה אווירית', { m: -0.0008, rd: 4 }), C_('לא הפעם', { rd: -2 })] },
  { id: 'bl_gulf_opec', bl: c => c.bl.includes('GCC'), c: 'intl', w: 0.8, cd: 600, r: 'fin', t: 'מכסות הנפט של אופ״ק+', x: 'אופ״ק+ מתכנסת. ריאד רוצה לקצץ בהפקה כדי להעלות מחירים, וארה״ב מבקשת להגדיל.',
    ch: [C_('להצטרף לקיצוץ', { m: 0.001, gv: -0.001, gd: 365, rl: { '682': 5, '840': -5 } }), C_('להגדיל הפקה', { m: 0.0015, rl: { '682': -6, '840': 5 } }), C_('להישאר באותה כמות', {})] },
  { id: 'bl_sahel_jihad', cc: SAHEL, c: 'dom', w: 1.3, cd: 420, r: 'def', t: 'התקפת ג׳יהאדיסטים', x: 'ארגונים ג׳יהאדיסטים תקפו בסיס צבאי וכפרים בצפון. אלפים בורחים לבירה.',
    ch: [C_('שכירים רוסים', { m: -0.001, rl: { '643': 6, '250': -6 }, rep: -2 }, { f: () => evInv('troops', 0.03) }), C_('לבקש עזרה מהשכנות', { rep: 1 }), C_('מבצע צבאי שלנו', { ap: 2, mil: { troops: 0.01 } })] },
  { id: 'bl_sahel_coup', cc: SAHEL, c: 'dom', w: 0.8, cd: 900, r: 'int', t: 'קצינים זוממים הפיכה', x: 'המודיעין מדווח שקבוצת קצינים צעירים מתכננת להשתלט על הטלוויזיה ועל ארמון הנשיאות.',
    ch: [C_('לעצור אותם מיד', { ap: -1, un: 1 }), C_('להעלות שכר לצבא', { m: -0.001, ap: 1 }), C_('להבטיח בחירות בקרוב', { ap: 2, rep: 2 })] },
  { id: 'bl_sahel_gold', cc: SAHEL, c: 'intl', w: 0.8, cd: 720, r: 'fin', t: 'מכרות הזהב והאורניום', x: 'חברה מערבית שמפעילה מכרה ענק מסרבת לשלם מסים חדשים. חברות מרוסיה ומטורקיה מציעות להחליף אותה.',
    ch: [C_('להלאים את המכרה', { m: 0.002, rep: -3, rl: { '250': -8 } }), C_('לתת לחברה הרוסית', { m: 0.001, rl: { '643': 8, '250': -5 } }), C_('הסכם חדש עם החברה', { m: 0.0008, rep: 1 })] },
  { id: 'bl_pac_sea', cc: PACIFIC, c: 'intl', w: 1.3, cd: 420, r: 'int', t: 'הים עולה', x: 'גאות שיא הציפה כפרים, ומי ים נכנסים לבארות מי השתייה. חלק מהאיים עלולים להיעלם.',
    ch: [C_('לדרוש מימון אקלים בעולם', { rep: 3, m: 0.001 }), C_('חומות ים ומאגרי מים', { m: -0.002, ap: 2 }), C_('הסכם הגירה עם אוסטרליה', { pop: -0.002, rl: { '036': 6 }, ap: -1 })] },
  { id: 'bl_pac_china', cc: PACIFIC, c: 'intl', w: c => evAl('156') ? 1 : 0, cd: 720, r: 'fo', t: 'הסכם ביטחון עם סין?', x: 'סין מציעה לבנות לנו נמל ומשטרה מודרנית — בתמורה להסכם ביטחון. אוסטרליה וארה״ב מודאגות.',
    ch: [C_('לחתום עם סין', { m: 0.002, rl: { '156': 12, '036': -10, '840': -8 } }), C_('לקבל הצעה נגדית מאוסטרליה', { m: 0.0015, rl: { '036': 8, '156': -4 } }), C_('להישאר ניטרליים', { rep: 1 })] },
  { id: 'bl_pac_fish', cc: PACIFIC, c: 'intl', w: 0.8, cd: 600, r: 'fin', t: 'צי דיג זר', x: 'עשרות ספינות דיג זרות דגות טונה במים שלנו בלי רישיון. הדייגים המקומיים מתלוננים.',
    ch: [C_('לבקש סיורי ים מבעלי ברית', { rl: { '036': 4 } }), C_('למכור רישיונות ביוקר', { m: 0.001 }), C_('לסגור אזורים לדיג', { ap: 1, rep: 2 })] }
];
EV.push(...COUNTRY_EV);
EV.forEach(e => { if (e.cc || e.bl) e.sp = 1; });
const EVI = {}; EV.forEach(e => { EVI[e.id] = e; });
// everything an event needs to know about the player's situation
function evCtx(x) {
  const c = P(), p = S.p, debt = p.treasury < 0 ? -p.treasury / c.gdp : 0, pc = c.gdp / Math.max(0.01, c.pop);
  const t = mainTid(S.player);
  const ctx = { he: c.he, gdp: c.gdp, dem: c.gov === 'democracy', auth: c.gov === 'authoritarian', war: activeWars(S.player) > 0, debt, rec: S.recession > 0, oil: OIL.has(S.player),
    rich: pc > 30, poor: pc < 6, sea: t ? tp(t).sea.length > 0 : true, nukes: c.nukes > 0, ap: c.approval, rep: p.rep, tr: p.treasury,
    id: S.player, hyb: c.gov === 'hybrid', bl: c.blocs || [] };
  Object.assign(ctx, x || {});
  ctx.on = ctx.o ? nm(ctx.o) : ''; ctx.on2 = ctx.o2 ? nm(ctx.o2) : '';
  if (ctx.mr) { const m = minOf(ctx.mr); ctx.mn = m ? m.n : ''; ctx.mt = mTitle(ctx.mr, m); ctx.mg = m ? m.g : 'm'; ctx.mc = !!(m && m.tr === 'corrupt'); }
  if (ctx.mr2) { const m = minOf(ctx.mr2); ctx.mt2 = mTitle(ctx.mr2, m); }
  ctx.v = (a, b) => ctx.mg === 'f' ? b : a;
  return ctx;
}
function effAdd(a, b) {
  const o = Object.assign({}, a || {});
  for (const k in b || {}) { if (k === 'mil') o.mil = Object.assign({}, o.mil || {}, b.mil); else if (typeof b[k] === 'number') o[k] = (o[k] || 0) + b[k]; else o[k] = b[k]; }
  return o;
}
const sgnPct = v => '⁦' + (v > 0 ? '+' : '−') + (Math.abs(v) * 100).toFixed(Math.abs(v) >= 0.01 ? 0 : 1) + '%⁩';
const durTxt = d => d >= 60 ? '⁦' + Math.round(d / DPM) + '⁩ חודשים' : '⁦' + d + '⁩ ימים';
// the preview line of a choice (shown on its button)
function evPrev(e, c) {
  const me = P(), o = { ap: e.ap, rep: e.rep, rel: {} }, notes = [];
  const money_ = (e.m || 0) * me.gdp + (e.cash || 0);
  if (money_ < 0) o.cost = -money_; else if (money_ > 0) notes.push('קופה +' + money(money_));
  if (e.ro && c.o) o.rel[c.o] = e.ro; if (e.ro2 && c.o2) o.rel[c.o2] = e.ro2;
  if (e.rl) for (const id in e.rl) if (evAl(id)) o.rel[id] = (o.rel[id] || 0) + e.rl[id];
  if (e.gdp) notes.push('כלכלה ' + isoNums(sgnPct(e.gdp)));
  if (e.gv) notes.push('צמיחה ' + isoNums(sgnPct(e.gv)) + ' לשנה, ' + isoNums(durTxt(e.gd || 365)));
  if (e.at) notes.push('העם ' + sgn(e.at) + ' בהדרגה');
  if (e.rd) notes.push('הדמוקרטיות ' + sgn(e.rd));
  if (e.un > 0) notes.push('כעס ברחוב');
  if (e.wr) notes.push('סיכון למלחמה');
  if (e.mil) notes.push('אבדות בצבא');
  if (e.pop > 0) notes.push('אוכלוסייה גדלה');
  o.note = notes.join(' · ');
  return o;
}
function evApply(e, c) {
  const me = P(), p = S.p, out = [];
  const money_ = (e.m || 0) * me.gdp + (e.cash || 0);
  if (money_) { p.treasury += money_; out.push('קופה ' + '⁦' + (money_ >= 0 ? '+' : '−') + moneyTxt(Math.abs(money_)) + '⁩'); }
  if (e.gdp) { me.gdp *= 1 + e.gdp; out.push('כלכלה ' + sgnPct(e.gdp)); }
  if (e.gv) { (p.tg || (p.tg = [])).push({ v: e.gv, u: S.day + (e.gd || 365) }); out.push('צמיחה ' + sgnPct(e.gv)); }
  if (e.at) { (p.tm || (p.tm = [])).push({ v: e.at, u: S.day + (e.ad || 180) }); out.push('העם ' + sgnT(e.at) + ' בהדרגה'); }
  if (e.un) p.unrest = Math.max(0, p.unrest + e.un);
  if (e.mil) { for (const k in e.mil) hurtInv(me, e.mil[k], [k]); if (S.units) syncAllUnits(); out.push('אבדות בצבא'); }
  if (e.pop) me.pop *= 1 + e.pop;
  if (e.rd) { alive().forEach(id => { if (id !== S.player && id !== c.o && S.c[id].gov === 'democracy') addRel(id, S.player, e.rd); }); out.push('הדמוקרטיות ' + sgnT(e.rd)); }
  const rl = {}; if (e.ro && c.o && S.c[c.o]) rl[c.o] = e.ro; if (e.ro2 && c.o2 && S.c[c.o2]) rl[c.o2] = e.ro2;
  if (e.rl) for (const id in e.rl) if (evAl(id)) rl[id] = (rl[id] || 0) + e.rl[id];
  return applyFx({ ap: e.ap, rep: e.rep, rel: Object.keys(rl).length ? rl : null }).concat(out);
}
const evOk = (ch, c) => !ch.need || ch.need(c);
// a minister picks the choice that suits his character (skill adds or removes noise)
function evMinPick(m, e, c) {
  const tr = m.tr, es = mSk(m), gdp = P().gdp;
  const Wap = tr === 'popul' || tr === 'char' ? 2 : 1, Wrep = tr === 'dipl' ? 1.5 : 0.6, Wm = tr === 'frugal' ? 1.8 : tr === 'popul' ? 0.5 : 0.9;
  let best = -1, bs = -1e9;
  e.ch.forEach((ch, i) => {
    if (!evOk(ch, c)) return;
    const x = effAdd(e.b, ch.e), mon = ((x.m || 0) + (x.cash || 0) / gdp) * 1000;
    // a choice that costs money we don't have is off the table (unless every choice costs)
    const cost = -((x.m || 0) * gdp + (x.cash || 0));
    let s = (x.ap || 0) * Wap + (x.rep || 0) * Wrep + (x.at || 0) * Math.min(1, (x.ad || 180) / 180) * Wap + mon * Wm + (x.gdp || 0) * 1000 * Wm +
      (x.gv || 0) * (x.gd || 365) / 365 * 1000 * Wm + (x.ro || 0) * 0.05 + evRlSum(x.rl) * 0.05 + (x.rd || 0) * 0.15 - (x.un || 0) * 2 - (x.wr ? 4 : 0) - (x.mil ? (tr === 'careful' ? 3 : 1) : 0);
    if (tr === 'aggr') s -= (x.ro || 0) * 0.12;
    if (tr === 'corrupt') s += mon * 0.5;
    s += (R() - 0.5) * (6 - es) * 1.5;
    // no money: a costly choice is off the table — and when every choice costs, the cheapest one wins
    if (cost > 0 && noMoney(e.r || 'fin', cost)) s -= 1e6 + cost / gdp * 1e6;
    if (s > bs) { bs = s; best = i; }
  });
  return best < 0 ? e.ch.length - 1 : best;
}
function evChoose(e, i, c, how) {
  const ch = e.ch[i]; if (!ch) return;
  const parts = evApply(effAdd(e.b, ch.e), c);
  if (ch.f) ch.f(c);
  if (ch.nx) evLater(ch.nx[0], ch.nx[1], c);
  const title = fnv(e.t, c), lbl = fnv(ch.l, c);
  const neg = parts.some(t => /[−-]\d/.test(plainT(t))) && !parts.some(t => /\+\d/.test(plainT(t)));
  if (how && how.m) {
    logMin(how.r, 'החלטה בנושא "' + title + '": ' + lbl, parts.join(' · '), neg);
    addNews(title + ': ' + mTitle(how.r, how.m) + ' ' + (how.m.g === 'f' ? 'החליטה' : 'החליט') + ' — ' + lbl + '.', 'event');
  } else {
    addNews(title + ': ' + (how ? 'הממשלה ' : '') + lbl + '.', 'event');
    toast((how ? title + ' — ' : '') + lbl + (parts.length ? ': ' + parts.join(' · ') : ''), neg);
  }
}
function evNews(e, c) {
  const eff = fnv(e.e, c), parts = eff ? evApply(eff, c) : [];
  const k = fnv(e.k, c) || 'world';
  addNews(fnv(e.n || e.t, c), k);
  if (parts.length) toast(fnv(e.t || e.n, c) + ': ' + parts.join(' · '), k === 'bad');
}
function pickMinRole(corruptFirst) {
  const rs = MIN_ORDER.filter(minOf); if (!rs.length) return null;
  const cr = rs.filter(r => minOf(r).tr === 'corrupt');
  return corruptFirst && cr.length && R() < 0.75 ? pick(cr) : pick(rs);
}
// one event slot every 3–8 days: about every second one is a decision (at least 11 days apart), the rest are news
function eventsDay() {
  if (!S.player || !S.p || S.over) return;
  const E = S.ev || (S.ev = { nx: S.day + 4, cd: {}, ld: S.day, n: 0, dn: 0 });
  if (E.cx == null) E.cx = S.day + 20 + Math.floor(R() * 25);
  // follow-ups of earlier choices (chains) come first, on their day — only for the country that chose them
  if (E.q && E.q.length) {
    const due = E.q.find(q => q.d <= S.day);
    if (due) { E.q.splice(E.q.indexOf(due), 1); const e = EVI[due.id]; if (e && (!e.cc || e.cc.includes(S.player)) && due.pl === S.player) { evFire(e, due.x || {}); return; } }
  }
  if (S.day < E.nx) return;
  E.nx = S.day + 3 + Math.floor(R() * 6);
  const decOk = S.day - E.ld >= 11;
  const base = evCtx();
  // a special event of the player's own country (or bloc / region) roughly every 1–2 months
  if (S.day >= E.cx) {
    const sp = []; let sw = 0;
    for (const e of EV) {
      if (!e.sp || (e.cc && !e.cc.includes(S.player)) || (e.bl && !e.bl(base)) || (E.cd[e.id] || 0) > S.day) continue;
      if (e.ch && !decOk) continue;
      if (e.ok && !e.ok(base)) continue;
      const w = fnv(e.w, base) || 0; if (w <= 0) continue;
      sp.push([e, w]); sw += w;
    }
    if (sp.length) {
      let x = R() * sw, e = sp[0][0];
      for (const [q, w] of sp) { x -= w; if (x <= 0) { e = q; break; } }
      E.cx = S.day + 30 + Math.floor(R() * 31);
      const ex = evExtra(e); if (ex) { evFire(e, ex); return; }
    } else if (decOk) E.cx = S.day + 15;
  }
  const dec = decOk && R() < 0.6;
  const pool = []; let tw = 0;
  for (const e of EV) {
    if (e.sp || !!e.ch !== dec || (E.cd[e.id] || 0) > S.day) continue;
    if (e.ok && !e.ok(base)) continue;
    const w = fnv(e.w, base) || 0; if (w <= 0) continue;
    pool.push([e, w]); tw += w;
  }
  if (!pool.length) return;
  let x = R() * tw, e = pool[0][0];
  for (const [q, w] of pool) { x -= w; if (x <= 0) { e = q; break; } }
  const extra = evExtra(e); if (!extra) return;
  evFire(e, extra);
}
// the other side of an event (a country or a minister); null = the event can't happen now
function evExtra(e) {
  const extra = {};
  if (e.o === 'min' || e.o === 'min2') {
    extra.mr = pickMinRole(e.id === 'm_scandal'); if (!extra.mr) return null;
    if (e.o === 'min2') { const o2 = MIN_ORDER.filter(r => minOf(r) && r !== extra.mr); if (!o2.length) return null; extra.mr2 = pick(o2); }
  } else if (e.o) {
    const v = EVO[e.o](); if (Array.isArray(v)) { extra.o = v[0]; extra.o2 = v[1]; } else extra.o = v || null;
    if (!extra.o && !e.oOpt) return null;
  }
  return extra;
}
// a follow-up event `days` from now (a chain)
function evLater(id, days, c) {
  const E = S.ev || (S.ev = { nx: S.day + 4, cd: {}, ld: S.day, n: 0, dn: 0 });
  (E.q || (E.q = [])).push({ id, d: S.day + days, pl: S.player, x: c && c.o ? { o: c.o, o2: c.o2 } : {} });
}
// a country that can take part in an event (alive and not the player)
const evAl = id => !!(S.c[id] && S.c[id].alive && id !== S.player);
const evRlSum = rl => { let s = 0; if (rl) for (const k in rl) if (evAl(k)) s += rl[k]; return s; };
// war risk: an angry country may open fire
function evWar(id, p, why) {
  if (!evAl(id) || atWar(id, S.player) || R() >= p) return false;
  const w = declareWar(id, S.player, { provoked: true });
  if (w) addNews(nm(id) + ' פתחה במלחמה נגדנו' + (why ? ' ' + why : '') + '.', 'war');
  return !!w;
}
function evFire(e, extra) {
  const E = S.ev;
  const ctx = evCtx(extra);
  E.cd[e.id] = S.day + (e.cd || 300); E.n++;
  if (e.go) e.go(ctx);
  if (!e.ch) { evNews(e, ctx); return; }
  E.ld = S.day; E.dn++;
  // a special event of our country always reaches the leader (a minister on autopilot only recommends)
  const m = !e.sp && e.r && minOn(e.r);
  if (m) {
    const i = evMinPick(m, e, ctx), x = effAdd(e.b, (e.ch[i] || {}).e), cost = -((x.m || 0) * P().gdp + (x.cash || 0));
    if (cost > 0) { const g = G(); g.spent = (g.spent || 0) + cost; g.spEv = (g.spEv || 0) + cost; (g.spR || (g.spR = {}))[e.r] = (g.spR[e.r] || 0) + cost; if (ENV_R.includes(e.r)) { const v = envOf(); v.used[e.r] = (v.used[e.r] || 0) + cost; } }
    evChoose(e, i, ctx, { m, r: e.r }); return;
  }
  // too many dialogs waiting: the cautious default happens and it becomes news
  if (S.pending.some(p => p.type === 'ev') || S.pending.length >= 2) { evChoose(e, e.ch.length - 1, ctx, { auto: 1 }); return; }
  S.pending.push({ type: 'ev', id: e.id, x: extra });
}
// the dialog of a decision event
function evDialog(p, after) {
  const e = EVI[p.id]; if (!e) return false;
  const ctx = evCtx(p.x);
  if ((p.x.o && !(S.c[p.x.o] && S.c[p.x.o].alive)) || (p.x.mr && !minOf(p.x.mr))) return false;
  const m = e.r && minOf(e.r);
  const rec = m ? '<p class="sub">' + esc(mTitle(e.r, m)) + ' ' + esc(m.n) + ' ' + (m.g === 'f' ? 'ממליצה' : 'ממליץ') + ': <b>' + esc(fnv(e.ch[evMinPick(m, e, ctx)].l, ctx)) + '</b></p>' : '';
  modal({ title: esc(fnv(e.t, ctx)), col: 1, html: '<div class="chips">' + (e.c === 'intl' ? chip('בעולם', 'blue') : chip('בבית', 'teal')) + (e.sp ? chip(e.cc ? 'מיוחד ל' + esc(P().he) : 'אירוע אזורי', 'orange') : '') + '</div><p>' + esc(fnv(e.x, ctx)) + '</p>' + rec,
    buttons: e.ch.map((ch, i) => {
      const ok = evOk(ch, ctx);
      if (!ok) return { label: fxBtn(esc(fnv(ch.l, ctx)), { note: 'לא אפשרי עכשיו' }), cls: 'off', keep: true, fn: () => toast('האפשרות הזו לא זמינה עכשיו', true) };
      return { label: fxBtn(esc(fnv(ch.l, ctx)), evPrev(effAdd(e.b, ch.e), ctx)), fn: () => { evChoose(e, i, evCtx(p.x)); after(); } };
    }) });
  return true;
}
// temporary effects from events (approval target and growth for a while)
const tmSum = a => { let s = 0; if (a) for (const x of a) if (x.u > S.day) s += x.v; return s; };

/* ================= time ================= */
let needMapRecolor = false;
// one game day: money, fighting, mood and deliveries; a new month also runs the slower world logic
function dayTick() {
  if (!S || S.over) return;
  playerEconomy();
  aiEconomy();
  if (S.units && !S.over) syncAllUnits();
  S.wars.slice().forEach(w => { if (S.wars.includes(w) && !S.over) countedBattle(w, () => battle(w)); });
  if (S.day % 7 === 0) S.wars.slice().forEach(w => { warSample(w); weekLog(w); if (S.ct) aiCityFlip(w); });
  if (!S.over) unitsDay();
  if (!S.over) cityDay();
  if (!S.over) warAlerts();
  if (!S.over) approvalStep();
  if (!S.over) deliveries();
  if (!S.over) worldDay();
  if (!S.over) govDay();
  if (!S.over) eventsDay();
  S.day++;
  const m = monthOf(S.day);
  if (m !== S.turn && !S.over) monthTick(m);
}
function monthTick(m) {
  const p = S.p, c = P();
  S.wars.forEach(frontNews);
  casMonthToast();
  if (S.recession > 0) S.recession--;
  if (S.scorch && S.scorch.some(x => x.d <= S.day)) { S.scorch = S.scorch.filter(x => x.d > S.day); scorchDirty = true; }
  aiDiplomacy();
  if (!S.over) aiWars();
  if (!S.over) randomEvents();
  if (!S.over) nukeProgram();
  if (!S.over) approvalMonthly();
  if (!S.over && S.p) { econMonthly(); factionsMonthly(); unMonthly(); }
  if (!S.over) { govMonth(); worldRebels(); reconcileCities(); }
  if (p.tm) p.tm = p.tm.filter(x => x.u > S.day);
  if (p.tg) p.tg = p.tg.filter(x => x.u > S.day);
  if (m % 3 === 0) worldSnap();
  S.turn = m;
  p.budget = p.bm; p.bm = null;
  p.gdpHist.push(c.gdp); if (p.gdpHist.length > 13) p.gdpHist.shift();
  const ms = p.mStart || { tr: p.treasury, ap: c.approval, rep: p.rep };
  if (!S.over) addNews('סיכום ' + dateTxt(m - 1) + ': קופה ' + (p.treasury - ms.tr >= 0 ? '+' : '−') + moneyTxt(Math.abs(p.treasury - ms.tr)) +
    ' · העם ' + sgnT(c.approval - ms.ap) + ' (' + Math.round(c.approval) + '%) · העולם ' + sgnT(p.rep - ms.rep) + ' (' + Math.round(p.rep) + ')', 'month');
  p.mStart = { tr: p.treasury, ap: c.approval, rep: p.rep };
  if (!S.over) checkWin();
  needMapRecolor = true;
}
const moneyTxt = bn => bn >= 1000 ? '$' + (bn / 1000).toFixed(1) + 'T' : bn >= 1 ? '$' + (bn >= 10 ? Math.round(bn) : bn.toFixed(1)) + 'B' : '$' + Math.round(bn * 1000) + 'M';
// production queue (weapons, soldiers, upgrades) and domestic projects
function deliveries() {
  const p = S.p, c = P();
  if (p.queue.length) p.queue = p.queue.filter(q => {
    if (S.day + 1 < q.due) return true;
    if (q.k === 'mobarrive') {
      c.mob = (c.mob || 0) + q.n; c.inv.troops += q.n;
      const t = troopsPlain(q.n) + ' אנשי מילואים התייצבו ביחידות'; addNews(t + '.', 'war'); toast(t);
    } else if (q.k === 'mlv' || q.k === 'adv') {
      c[q.k] = Math.min(3, (c[q.k] || 0) + 1);
      const t = q.k === 'mlv' ? 'תוכנית הטילים שודרגה לרמה ' + LVL_HE[c.mlv] + ' (טווח ' + MIS_RANGE[c.mlv].toLocaleString('en-US') + ' ק״מ)' : 'מערך ההגנה האווירית שודרג לרמה ' + LVL_HE[c.adv];
      addNews(t + '.', 'good'); toast(t);
    } else if (q.k === 'cfort' || q.k === 'cad') {
      const x = CITYI[q.ci];
      if (x && S.ct) {
        const st = cst(x); if (q.k === 'cfort') st.f = Math.min(3, (st.f || 0) + 1); else st.a = 1;
        const t = (q.k === 'cfort' ? 'ביצורים חדשים הושלמו ב' : 'מערך הגנה אווירית הוצב ב') + cityName(x); addNews(t + '.', 'good'); toast(t); citiesDirty = true;
      }
    } else {
      c.inv[q.k] = (c.inv[q.k] || 0) + q.n; c.bought[q.k] = (c.bought[q.k] || 0) + q.n;
      const t = q.k === 'troops' ? 'סיימו אימון: ' + num(q.n * 1000).replace(/<[^>]+>/g, '') + ' חיילים חדשים' : 'נמסרו לצבא: ' + q.n + ' ' + BUY[q.k].unit;
      addNews(t + '.', 'good'); toast(t);
      (p.dl || (p.dl = [])).push({ d: S.day, t }); if (p.dl.length > 8) p.dl.shift();
    }
    return false;
  });
  if (p.proj.length) p.proj = p.proj.filter(q => {
    if (S.day + 1 < q.due) return true;
    const D = PROJ[q.k];
    p.built[q.k] = (p.built[q.k] || 0) + 1;
    p.apBonus = (p.apBonus || 0) + D.ap; p.growthBonus = (p.growthBonus || 0) + D.g;
    const e = { ap: D.ap ? Math.ceil(D.ap / 2) : 0, rep: D.rep };
    addNews('הפרויקט "' + D.he + '" הושלם.', 'good');
    fxToast('הושלם: ' + D.he, e);
    return false;
  });
  peaceDaily(); techDaily(); if (S.day % 7 === 0) { missionsCheck(); tensionWeekly(); }
}

/* ================= peaceful play: diplomacy and development without war ================= */
// country actions (on another country, at peace). cost = share of OUR GDP
const PZ = {
  visit:  { he: 'ביקור מדיני', d: 'נשיא/ראש הממשלה טס לביקור רשמי. משפר יחסים.', c: 0.0004, cd: 60, rel: 10, rep: 1, ap: 1 },
  culture:{ he: 'חילופי תרבות וסטודנטים', d: 'סטודנטים, אמנים וספורטאים עוברים בין המדינות.', c: 0.0008, cd: 120, rel: 7, rep: 2 },
  visa:   { he: 'ביטול אשרות כניסה', d: 'תיירים ואנשי עסקים נכנסים בלי ויזה. פעם אחת לכל מדינה.', c: 0, once: 1, rel: 6, ap: 1, g: 0.0004 },
  invest: { he: 'השקעה בכלכלה שלהם', d: 'חברות שלנו בונות שם מפעלים. הכלכלה של שניכם גדלה.', c: 0.003, cd: 180, rel: 12, rep: 1, g: 0.0006, their: 0.004 },
  loan:   { he: 'הלוואה בריבית', d: 'מלווים להם כסף. אחרי שנה מקבלים בחזרה עם 8% ריבית.', c: 0.004, cd: 365, rel: 10, rep: 1 },
  arms:   { he: 'מכירת נשק', d: 'מוכרים להם ציוד צבאי. כסף ליחסים — אבל העולם פחות אוהב סוחרי נשק.', c: -0.002, cd: 180, rel: 9, rep: -2, needDef: 1 },
  drill:  { he: 'תרגיל צבאי משותף', d: 'הצבאות מתאמנים יחד. מקרב — ומרגיז את היריבים שלהם.', c: 0.0005, cd: 180, rel: 9 },
  mediate:{ he: 'תיווך שלום', d: 'מנסים לסיים את המלחמה שלהם. הצלחה = כבוד עולמי גדול.', c: 0.0005, cd: 90, needWar: 1 },
};
// national initiatives (Home tab). share of GDP, days until done, effects when done
const INI = {
  research: { he: 'מחקר ופיתוח', d: 'מעבדות, אוניברסיטאות והייטק. אפשר לבנות עד 5 שלבים.', c: 0.005, days: 270, max: 5, g: 0.003, ap: 1, rep: 1 },
  space:    { he: 'תוכנית חלל', d: 'לוויינים, ואולי אדם על הירח. גאווה לאומית וכבוד בעולם.', c: 0.01, days: 540, max: 2, g: 0.002, ap: 4, rep: 6 },
  olymp:    { he: 'מועמדות לאולימפיאדה', d: 'אם נבחר — חגיגה לאומית ותיירות. הסיכוי עולה עם המוניטין.', c: 0.012, days: 720, max: 1, bid: 1 },
  peacek:   { he: 'כוחות שלום של האו״ם', d: 'שולחים חיילים לשמור על שקט באזורי סכסוך.', c: 0.002, days: 180, max: 9, rep: 6, ap: 1 },
  climate:  { he: 'ברית אקלים', d: 'מחויבות לאנרגיה נקייה. העולם מעריך, התעשייה פחות.', c: 0.004, days: 365, max: 1, rep: 6, ap: 1, g: -0.001 },
  tourism:  { he: 'קמפיין תיירות', d: 'פרסום בעולם. עובד טוב יותר כשהמוניטין גבוה.', c: 0.002, days: 180, max: 4, g: 0.002, tour: 1 },
  soft:     { he: 'מעצמה רכה', d: 'סדרות, מוזיקה, ספורט ואוכל שלנו כובשים את העולם.', c: 0.003, days: 365, max: 3, rep: 5, relAll: 3, ap: 1 },
  fund:     { he: 'קרן עושר לאומית', d: 'משקיעים בעולם ומקבלים רווחים כל שנה.', c: 0.02, days: 365, max: 2, g: 0.0035 },
  summit:   { he: 'אירוח פסגה עולמית', d: 'מנהיגי העולם מגיעים אלינו. יחסים טובים עם המעצמות.', c: 0.003, days: 90, max: 9, rep: 7, relTop: 5 },
  develop:  { he: 'סיוע לעולם המתפתח', d: 'בתי ספר, מים וחשמל במדינות עניות. כל אפריקה זוכרת.', c: 0.005, days: 120, max: 9, rep: 6, relAU: 7 },
  reconcile:{ he: 'יוזמת פיוס עם יריבים', d: 'מושיטים יד לכל מי שכועס עלינו. חלק מהעם יגיד שזו חולשה.', c: 0.001, days: 30, max: 9, rep: 4, ap: -1, relBad: 10 },
};
const pzCost = k => Math.max(0, PZ[k].c) * P().gdp;
const iniCost = k => INI[k].c * P().gdp;
function pzFx(k, o) {
  const D = PZ[k], e = { cost: pzCost(k) || 0, rel: { [o]: D.rel || 0 } };
  if (D.rep) e.rep = D.rep; if (D.ap) e.ap = D.ap;
  if (k === 'arms') e.note = 'רווח ' + money(-D.c * P().gdp);
  if (k === 'loan') e.note = 'החזר ' + money(pzCost(k) * 1.08) + ' בעוד שנה';
  if (k === 'mediate') e.note = 'סיכוי ' + pct(mediateChance(o) * 100);
  if (D.g) e.note = (e.note ? e.note + ' · ' : '') + 'צמיחה ' + isoNums('+' + (D.g * 100).toFixed(2) + '%');
  return e;
}
function aiWarOf(o) { return S.wars.find(w => inWar(w, o) && !inWar(w, S.player)); }
function mediateChance(o) { const w = aiWarOf(o); if (!w) return 0; return clamp(0.15 + S.p.rep / 250 + (rel(o, S.player) + 100) / 600 + Math.min(0.2, (S.day - (w.start || S.day)) / 3000), 0.05, 0.85); }
function peaceButtons(o) {
  const p = S.p; p.visa = p.visa || {};
  let h = '<h3>שלום ושיתוף פעולה</h3><div class="btns">';
  for (const k in PZ) {
    const D = PZ[k];
    if (D.needWar && !aiWarOf(o)) continue;
    if (D.needDef && (P().def || 0) < 1) continue;
    if (D.once && p.visa[o]) continue;
    const cd = cdLeft('pz' + k + ':' + o);
    h += cd ? '<button class="b" disabled>' + D.he + cdNote(cd) + '</button>' : fbtn('pz', D.he, pzFx(k, o), 'good', false, ' data-k="' + k + '" title="' + esc(D.d) + '"');
  }
  return h + '</div>';
}
function doPz(k) {
  const o = selOwner(), C = S.c[o], D = PZ[k]; if (!C || !D || atWar(o, S.player) || cdLeft('pz' + k + ':' + o)) return;
  const cost = pzCost(k); if (cost && !spend(cost)) return;
  if (D.cd) setCd('pz' + k + ':' + o, D.cd);
  const e = { rel: { [o]: D.rel || 0 } }; if (D.rep) e.rep = D.rep; if (D.ap) e.ap = D.ap;
  if (D.g) S.p.growthBonus = (S.p.growthBonus || 0) + D.g;
  if (k === 'visa') S.p.visa[o] = 1;
  if (k === 'invest') C.gdp *= 1 + D.their;
  if (k === 'loan') (S.p.loans = S.p.loans || []).push({ o, amt: cost * 1.08, due: S.day + 365 });
  if (k === 'arms') { S.p.treasury += -D.c * P().gdp; addInv(C, 0.03); }
  if (k === 'drill') alive().forEach(id => { if (id !== o && id !== S.player && rel(id, o) < -40) addRel(id, S.player, -3); });
  if (k === 'mediate') {
    const w = aiWarOf(o);
    if (w && R() < mediateChance(o)) {
      const a = w.A[0], b = w.B[0];
      addNews('בתיווך ' + P().he + ' נחתם הסכם שלום בין ' + nm(a) + ' ל' + nm(b) + '!', 'good');
      applyPeace(w, 'white', a, b);
      fxToast('התיווך הצליח! השלום נחתם', { rep: 10, ap: 3, rel: { [a]: 12, [b]: 12 } });
    } else fxToast('התיווך נכשל — הצדדים עוד לא מוכנים', { rep: 1, rel: { [o]: 2 } });
    renderAll(); return;
  }
  fxToast(D.he + ' עם ' + C.he, e);
  addNews(D.he + ' עם ' + C.he + '.', 'dip');
  renderAll();
}
/* ================= military technology ================= */
const TECH = {
  drones:  { he: 'רחפנים ומל״טים', d: 'סיור ותקיפה בלי לסכן טייסים.', c: 0.004, days: 240, max: 3, pw: 0.06 },
  airdef:  { he: 'הגנה אווירית מתקדמת', d: 'יירוט טילים ומטוסים.', c: 0.005, days: 300, max: 3, pw: 0.04 },
  cyber:   { he: 'יחידת סייבר', d: 'פריצה למחשבים של האויב. מעלה את הסיכוי של מבצעים חשאיים.', c: 0.003, days: 210, max: 3, pw: 0.03 },
  ai:      { he: 'בינה מלאכותית בפיקוד', d: 'החלטות מהירות יותר בשדה הקרב.', c: 0.006, days: 360, max: 3, pw: 0.07 },
  stealth: { he: 'מטוסי חמקן', d: 'מטוסים שהמכ״ם לא רואה.', c: 0.008, days: 420, max: 2, pw: 0.08 },
  hyper:   { he: 'טילים היפרסוניים', d: 'טילים מהירים שקשה מאוד ליירט.', c: 0.007, days: 420, max: 2, pw: 0.06 },
  armor:   { he: 'שריון ומיגון חדשים', d: 'טנקים ונגמ״שים שמגינים טוב יותר על החיילים.', c: 0.004, days: 270, max: 3, pw: 0.05 },
};
const techLvl = k => (S.p.tech && S.p.tech[k]) || 0;
const techCost = k => TECH[k].c * P().gdp * (1 + techLvl(k) * 0.5);
function techSection() {
  const p = S.p; p.tech = p.tech || {}; p.tq = p.tq || [];
  let h = '<h3>טכנולוגיה צבאית</h3><p class="sub">כל שלב מחזק את כל הצבא — ככה אפשר לנצח גם מדינות גדולות יותר. מכפיל עוצמה עכשיו: ' + isoNums('×' + (P().tm || 1).toFixed(2)) + '</p>';
  for (const k in TECH) {
    const D = TECH[k], lvl = techLvl(k), run = p.tq.find(q => q.k === k);
    h += '<div class="card"><b>' + D.he + '</b>' + (lvl ? ' ' + chip('שלב ' + lvl + '/' + D.max, 'teal') : '') + '<div class="sub">' + D.d + '</div>';
    if (run) { const done = clamp((S.day - run.start) / (run.due - run.start), 0, 1); h += '<div class="fl"><div class="prog g"><div style="width:' + (done * 100).toFixed(1) + '%"></div></div> <small>עוד ' + daysTxt(run.due - S.day) + '</small></div>'; }
    else if (lvl >= D.max) h += '<div class="sub ok">הושלם</div>';
    else h += '<div class="btns">' + fbtn('tech', 'פתח · ' + daysTxt(D.days), { cost: techCost(k), note: 'עוצמה ' + isoNums('+' + Math.round(D.pw * 100) + '%') }, 'good', p.tq.length >= 2, ' data-k="' + k + '"') + '</div>';
    h += '</div>';
  }
  if (p.tq.length >= 2) h += '<p class="sub">אפשר לפתח עד 2 טכנולוגיות בבת אחת.</p>';
  return h;
}
function startTech(k) {
  const D = TECH[k], p = S.p; p.tech = p.tech || {}; p.tq = p.tq || [];
  if (!D || p.tq.length >= 2 || p.tq.some(q => q.k === k) || techLvl(k) >= D.max) return;
  if (!spend(techCost(k))) return;
  p.tq.push({ k, start: S.day, due: S.day + D.days });
  toast('התחלנו לפתח: ' + D.he); renderAll();
}
function techDaily() {
  const p = S.p; if (!p || !p.tq || !p.tq.length) return;
  p.tq = p.tq.filter(q => {
    if (S.day < q.due) return true;
    const D = TECH[q.k]; p.tech[q.k] = techLvl(q.k) + 1;
    const c = P(); c.tm = (c.tm || 1) + D.pw;
    fxToast('פיתוח הושלם: ' + D.he + ' (שלב ' + p.tech[q.k] + ')', { ap: 1 });
    addNews('הצבא קיבל טכנולוגיה חדשה: ' + D.he + '.', 'good');
    return false;
  });
}

/* ================= covert ops and heating things up (without declaring war) ================= */
const COV = {
  spynet: { he: 'בניית רשת ריגול', d: 'סוכנים אצלם. כל רשת מעלה את הסיכוי של המבצעים הבאים.', c: 0.0008, cd: 90 },
  sabot:  { he: 'חבלה בתעשייה הצבאית', d: 'פיצוצים "מסתוריים" במפעלי נשק. הצבא שלהם נחלש.', c: 0.0015, cd: 120 },
  cyberx: { he: 'מתקפת סייבר', d: 'משביתים בנקים וחשמל. הכלכלה שלהם נפגעת.', c: 0.001, cd: 120 },
  steal:  { he: 'גניבת טכנולוגיה', d: 'גונבים סודות. הצבא והכלכלה שלנו מתחזקים.', c: 0.0012, cd: 180 },
  oppos:  { he: 'מימון האופוזיציה', d: 'כסף למתנגדי השלטון. אם העם שם כועס — אולי הפיכה.', c: 0.002, cd: 180 },
  rebels: { he: 'חימוש מורדים', d: 'נשק לקבוצות חמושות אצלם. מחליש אותם מבפנים.', c: 0.0015, cd: 150 },
};
const PROVO = {
  rhet:    { he: 'הצהרות תקיפות', d: 'נאומים חריפים נגדם בטלוויזיה ובאו״ם.', ten: 12, rel: -8, ap: 2, rep: 0, cd: 30 },
  amb:     { he: 'גירוש השגריר', d: 'מסלקים את הדיפלומטים שלהם מהמדינה.', ten: 18, rel: -15, ap: 1, rep: -1, cd: 120 },
  border:  { he: 'תמרון צבאי ליד הגבול', d: 'טנקים ומטוסים מתאמנים קרוב אליהם.', ten: 22, rel: -12, ap: 1, rep: -1, cd: 60 },
  flights: { he: 'טיסות ביון מעל השטח שלהם', d: 'מל״טים וטיסות צילום. הם עלולים לירות עליהם.', ten: 25, rel: -10, ap: 0, rep: -1, cd: 45 },
  navy:    { he: 'עצירת ספינות שלהם בים', d: 'עוצרים ובודקים ספינות שלהם. השפלה גלויה.', ten: 30, rel: -18, ap: 2, rep: -2, cd: 90 },
  proxies: { he: 'תקיפת שלוחים שלהם', d: 'פוגעים בקבוצות שהם מממנים — לא בהם עצמם.', ten: 35, rel: -20, ap: 2, rep: -2, cd: 120 },
};
const covCost = k => COV[k].c * P().gdp;
function covChance(o) {
  const p = S.p, c = S.c[o]; p.spy = p.spy || {};
  return clamp(0.35 + techLvl('cyber') * 0.08 + (p.spy[o] || 0) * 0.12 - (c.airdef || 0) * 0.03 - (power(c) > power(P()) * 2 ? 0.08 : 0), 0.1, 0.9);
}
const tensionOf = o => (S.p.ten && S.p.ten[o]) || 0;
function covertButtons(o) {
  if (!S.c[o] || o === S.player) return '';
  const p = S.p; p.spy = p.spy || {};
  let h = '<h3>מבצעים חשאיים <small>(סיכוי הצלחה ' + pct(covChance(o) * 100) + (p.spy[o] ? ' · רשתות ריגול: ' + p.spy[o] : '') + ')</small></h3><p class="sub">אם נתפסים — היחסים והמוניטין נפגעים.</p><div class="btns">';
  for (const k in COV) {
    if (k === 'spynet' && (p.spy[o] || 0) >= 3) continue;
    const cd = cdLeft('cov' + k + ':' + o);
    h += cd ? '<button class="b" disabled>' + COV[k].he + cdNote(cd) + '</button>' : fbtn('cov', COV[k].he, { cost: covCost(k), note: 'אם נתפסים: העולם −6' }, '', false, ' data-k="' + k + '" title="' + esc(COV[k].d) + '"');
  }
  h += '</div>';
  if (!atWar(o, S.player)) {
    const t = tensionOf(o);
    h += '<h3>לחמם את העניינים <small>(מתיחות ' + Math.round(t) + '/100)</small></h3><p class="sub">מעלים את המתיחות בלי להכריז מלחמה. ככה שהמתיחות גבוהה יותר — גדל הסיכוי שהם יתקפו ראשונים. אז יש לך סיבה להילחם, והעולם בצד שלך.</p>' +
      '<div class="prog r"><div style="width:' + t + '%"></div></div><div class="btns">';
    for (const k in PROVO) {
      const D = PROVO[k], cd = cdLeft('pv' + k + ':' + o);
      h += cd ? '<button class="b" disabled>' + D.he + cdNote(cd) + '</button>' : fbtn('provo', D.he, { ap: D.ap, rep: D.rep, rel: { [o]: D.rel }, note: 'מתיחות +' + D.ten }, '', false, ' data-k="' + k + '" title="' + esc(D.d) + '"');
    }
    if (t > 0) h += fbtn('calm', 'להרגיע את המצב', { rel: { [o]: 5 }, note: 'מתיחות −30' }, '');
    h += '</div>';
  }
  return h;
}
function doCovert(k) {
  const o = selOwner(), C = S.c[o], D = COV[k], p = S.p; if (!C || !D || cdLeft('cov' + k + ':' + o)) return;
  if (!spend(covCost(k))) return;
  setCd('cov' + k + ':' + o, D.cd); p.spy = p.spy || {}; p.covOk = p.covOk || 0;
  const ok = R() < covChance(o), caught = !ok && R() < 0.6;
  if (ok) {
    p.covOk++;
    if (k === 'spynet') { p.spy[o] = (p.spy[o] || 0) + 1; toast('רשת ריגול חדשה ב' + C.he + ' (' + p.spy[o] + '/3)'); }
    else if (k === 'sabot') { hurtInv(C, 0.06, ['tanks', 'afv', 'art', 'air', 'heli', 'msl']); toast('החבלה הצליחה: מפעלי הנשק של ' + C.he + ' נפגעו'); addNews('פיצוצים מסתוריים במפעלי נשק ב' + C.he + '.', 'world'); }
    else if (k === 'cyberx') { C.gdp *= 0.985; toast('מתקפת הסייבר הצליחה: הבנקים והחשמל ב' + C.he + ' קרסו לכמה ימים'); addNews('מתקפת סייבר ענקית השביתה את ' + C.he + '. אף אחד לא לקח אחריות.', 'world'); }
    else if (k === 'steal') { P().tm = (P().tm || 1) + 0.02; p.growthBonus = (p.growthBonus || 0) + 0.0008; toast('גנבנו טכנולוגיה מ' + C.he + ': עוצמה +2%, צמיחה +0.08%'); }
    else if (k === 'oppos') { C.approval = Math.max(5, (C.approval || 50) - 10); if (C.approval < 25 && C.gov !== 'democracy' && R() < 0.35) { worldCoup(o); addRel(o, S.player, 40); toast('הפיכה ב' + C.he + '! השלטון החדש חייב לנו'); } else toast('האופוזיציה ב' + C.he + ' מתחזקת (אהבת העם שם: ' + Math.round(C.approval) + '%)'); }
    else if (k === 'rebels') { hurtInv(C, 0.04, ['troops']); C.gdp *= 0.99; C.approval = Math.max(5, (C.approval || 50) - 4); toast('המורדים ב' + C.he + ' תוקפים את הצבא'); addNews('מורדים חמושים תקפו בסיסים ב' + C.he + '.', 'world'); }
  } else if (caught) {
    fxToast('נתפסנו! ' + C.he + ' חשפה את המבצע', { rep: -6, rel: { [o]: -25 } }, true);
    addNews(C.he + ' חשפה מבצע חשאי של ' + P().he + ' ומאשימה אותנו.', 'bad');
    addTension(o, 20);
  } else toast('המבצע נכשל, אבל לא נתפסנו');
  renderAll();
}
function addTension(o, d) { const p = S.p; p.ten = p.ten || {}; p.ten[o] = clamp((p.ten[o] || 0) + d, 0, 100); }
function doProvo(k) {
  const o = selOwner(), C = S.c[o], D = PROVO[k]; if (!C || !D || atWar(o, S.player) || cdLeft('pv' + k + ':' + o)) return;
  setCd('pv' + k + ':' + o, D.cd); addTension(o, D.ten);
  fxToast(D.he + ' נגד ' + C.he, { ap: D.ap, rep: D.rep, rel: { [o]: D.rel } });
  addNews(P().he + ': ' + D.he + ' נגד ' + C.he + '. המתיחות עולה.', 'dip');
  renderAll();
}
function doCalm() { const o = selOwner(); if (!S.c[o]) return; addTension(o, -30); fxToast('ניסינו להרגיע את ' + S.c[o].he, { rel: { [o]: 5 } }); renderAll(); }
// every week: high tension may make them attack us first (then we have a reason, and the world is on our side)
function tensionWeekly() {
  const p = S.p; if (!p || !p.ten) return;
  for (const o in p.ten) {
    const t = p.ten[o], C = S.c[o];
    if (!C || !C.alive || atWar(o, S.player)) { delete p.ten[o]; continue; }
    p.ten[o] = Math.max(0, t - 1.5);   // cools down slowly by itself
    if (t < 30) continue;
    const bold = clamp(power(C) / Math.max(1, power(P())), 0.2, 2.5), hostile = rel(o, S.player) < -40 ? 1.4 : 1;
    const ch = Math.pow((t - 25) / 75, 2) * 0.12 * (0.5 + bold * 0.5) * hostile * (C.gov === 'democracy' ? 0.5 : 1);
    if (R() < ch) {
      if (R() < 0.55) {   // a border incident: they fire first, which gives us a reason
        noteGrievance(o, S.player); p.ten[o] = Math.max(0, t - 25);
        const civ = Math.round(5 + R() * 60);
        fxToast(C.he + ' ירתה עלינו ראשונה! (' + civ + ' נפגעים)', { ap: 3 }, true);
        addNews(C.he + ' פתחה באש על כוחותינו ליד הגבול. ' + civ + ' נפגעים. העולם מגנה את ' + C.he + ' — עכשיו יש לנו סיבה להגיב.', 'war');
        alive().forEach(id => { if (id !== o && id !== S.player && S.c[id].gov === 'democracy') addRel(id, o, -4); });
      } else {
        addNews(C.he + ' הכריזה עלינו מלחמה אחרי חודשים של מתיחות.', 'war');
        declareWar(o, S.player, {});
        delete p.ten[o];
      }
      needMapRecolor = true;
    }
  }
}

/* ================= goals with rewards ================= */
const sumV = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
const MISS = [
  { id: 'gdp', he: 'להגדיל את הכלכלה ב-20%', ok: m => P().gdp >= m.b * 1.2, set: m => { m.b = P().gdp; }, rw: { cash: 0.01, ap: 3 } },
  { id: 'rep', he: 'להגיע למוניטין 70', ok: () => S.p.rep >= 70, rw: { cash: 0.008, ap: 2 } },
  { id: 'ap', he: 'להגיע לאהבת העם 70%', ok: () => P().approval >= 70, rw: { cash: 0.006, rep: 3 } },
  { id: 'allies', he: 'לחתום על 3 בריתות', ok: () => alive().filter(id => hasPact(id, S.player, 'alliance')).length >= 3, rw: { cash: 0.01, rep: 3 } },
  { id: 'trade', he: 'לחתום על 5 הסכמי סחר', ok: () => alive().filter(id => hasPact(id, S.player, 'trade')).length >= 5, rw: { cash: 0.012, ap: 2 } },
  { id: 'tech', he: 'לפתח 3 שלבי טכנולוגיה צבאית', ok: m => sumV(S.p.tech) >= m.b + 3, set: m => { m.b = sumV(S.p.tech); }, rw: { cash: 0.01, tm: 0.03 } },
  { id: 'ini', he: 'להשלים 3 יוזמות שלום ופיתוח', ok: m => sumV(S.p.iniL) >= m.b + 3, set: m => { m.b = sumV(S.p.iniL); }, rw: { cash: 0.01, rep: 4 } },
  { id: 'cov', he: 'להצליח ב-3 מבצעים חשאיים', ok: m => (S.p.covOk || 0) >= m.b + 3, set: m => { m.b = S.p.covOk || 0; }, rw: { cash: 0.008, tm: 0.02 } },
  { id: 'friends', he: 'יחסים מעל 60 עם 10 מדינות', ok: () => alive().filter(id => id !== S.player && rel(id, S.player) > 60).length >= 10, rw: { cash: 0.01, rep: 3 } },
  { id: 'power', he: 'להגדיל את העוצמה הצבאית ב-25%', ok: m => power(P()) >= m.b * 1.25, set: m => { m.b = power(P()); }, rw: { cash: 0.01, ap: 2 } },
  { id: 'cash', he: 'לצבור קופה של 5% מהתמ״ג', ok: () => S.p.treasury >= P().gdp * 0.05, rw: { rep: 2, ap: 3, tm: 0.02 } },
  { id: 'proj', he: 'לבנות 3 פרויקטים לאומיים', ok: m => sumV(S.p.built) >= m.b + 3, set: m => { m.b = sumV(S.p.built); }, rw: { cash: 0.008, ap: 3 } },
];
function missionsFill() {
  const p = S.p; p.ms = p.ms || []; p.msDone = p.msDone || {};
  const pool = MISS.filter(M => !p.ms.some(m => m.id === M.id) && (p.msDone[M.id] || 0) < 3);
  while (p.ms.length < 3 && pool.length) { const M = pool.splice(Math.floor(R() * pool.length), 1)[0], m = { id: M.id, done: 0 }; if (M.set) M.set(m); p.ms.push(m); }
}
function missionsCheck() {
  const p = S.p; if (!p) return; missionsFill();
  p.ms.forEach(m => { const M = MISS.find(x => x.id === m.id); if (M && !m.done && M.ok(m)) { m.done = 1; toast('🎯 משימה הושלמה: ' + M.he + ' — קבל את הפרס בלשונית "בית"'); } });
}
const rwTxt = r => [r.cash ? money(r.cash * P().gdp) : '', r.ap ? 'העם +' + r.ap : '', r.rep ? 'העולם +' + r.rep : '', r.tm ? 'עוצמה +' + Math.round(r.tm * 100) + '%' : ''].filter(Boolean).join(' · ');
function missionSection() {
  missionsFill();
  let h = '<h3>משימות</h3><p class="sub">מטרות שנותנות כיוון ופרסים. כשמשימה מושלמת — מקבלים פרס ומשימה חדשה.</p>';
  S.p.ms.forEach((m, i) => { const M = MISS.find(x => x.id === m.id); if (!M) return;
    h += '<div class="card"><b>' + (m.done ? '✅ ' : '🎯 ') + M.he + '</b><div class="sub">פרס: ' + isoNums(rwTxt(M.rw)) + '</div>' + (m.done ? '<div class="btns">' + btn('mclaim', 'קבל פרס', 'good', ' data-k="' + i + '"') + '</div>' : '') + '</div>'; });
  return h;
}
function claimMission(i) {
  const p = S.p, m = p.ms[i]; if (!m || !m.done) return; const M = MISS.find(x => x.id === m.id), r = M.rw;
  if (r.cash) p.treasury += r.cash * P().gdp; if (r.tm) P().tm = (P().tm || 1) + r.tm;
  fxToast('פרס: ' + M.he, { ap: r.ap || 0, rep: r.rep || 0 });
  p.msDone[m.id] = (p.msDone[m.id] || 0) + 1; p.ms.splice(i, 1); missionsFill(); renderAll();
}

/* ================= economy sectors: invest, grow, earn every month ================= */
const SECT = {
  tech:    { he: 'הייטק', ic: '💻', d: 'סטארטאפים ותוכנה. צמיחה מהירה ומושך צעירים.', g: 0.0035 },
  energy:  { he: 'אנרגיה', ic: '⚡', d: 'נפט, גז ושמש. הכנסה מייצוא, ומגן מפני משברי נפט.', g: 0.002, cash: 0.0009 },
  industry:{ he: 'תעשייה', ic: '🏭', d: 'מפעלים. מייצרים ציוד צבאי בחינם כל חודש ומעסיקים עובדים.', g: 0.0025 },
  agri:    { he: 'חקלאות', ic: '🌾', d: 'אוכל לעם. מגן מפני רעב ובצורת, והחקלאים מרוצים.', g: 0.001 },
  tourism: { he: 'תיירות', ic: '🏖️', d: 'מלונות וחופים. מכניס יותר כסף ככה שהמוניטין גבוה יותר.', g: 0.0015 },
  finance: { he: 'בנקים ופיננסים', ic: '🏦', d: 'בורסה ובנקים. מקטין את הריבית על החוב.', g: 0.002 },
  arms:    { he: 'תעשייה ביטחונית', ic: '🛡️', d: 'פיתוח וייצוא נשק. כסף מייצוא ועוצמה לצבא.', g: 0.0015, cash: 0.0007 },
};
function secInit() {
  const p = S.p, c = P(); if (p.sec) return;
  const rich = c.gdp / Math.max(0.1, c.pop) > 25;
  p.sec = { tech: rich ? 2 : 1, energy: 1, industry: 1, agri: rich ? 1 : 2, tourism: 1, finance: rich ? 2 : 1, arms: (c.def || 0) > 10 ? 2 : 1 };
  p.secQ = []; p.secM = 0;
}
const secCost = k => 0.006 * P().gdp * (1 + (S.p.sec[k] || 0) * 0.6);
const sectorG = () => { const p = S.p; if (!p || !p.sec) return 0; let g = 0; for (const k in SECT) g += SECT[k].g * ((p.sec[k] || 0) - 1); return g; };
// money the sectors bring in this month (bn)
function secIncome() {
  const p = S.p, c = P(); if (!p.sec) return 0;
  let m = 0; for (const k in SECT) if (SECT[k].cash) m += SECT[k].cash * p.sec[k] * c.gdp / 12;
  m += 0.0012 * p.sec.tourism * (p.rep / 100) * c.gdp / 12;
  let tr = 0; for (const key in S.pacts) if (S.pacts[key].trade && key.split('|').includes(S.player)) tr++;
  m += tr * 0.00025 * (p.sec.industry + p.sec.tech + p.sec.agri) * c.gdp / 12;   // exports to trade partners
  return m;
}
function econSection() {
  secInit(); const p = S.p;
  let h = '<h3>ענפי הכלכלה</h3><p class="sub">משקיעים בענף → הוא גדל → כל חודש הוא מכניס כסף, מעלה צמיחה ומשמח קבוצות בעם. החודש הענפים והייצוא הכניסו ' + money(p.secM || 0) + '.</p>';
  for (const k in SECT) {
    const D = SECT[k], lvl = p.sec[k] || 0, run = p.secQ.find(q => q.k === k);
    h += '<div class="card"><b>' + D.ic + ' ' + D.he + '</b> ' + chip('רמה ' + lvl + '/6', 'teal') + '<div class="sub">' + D.d + '</div>';
    if (run) { const done = clamp((S.day - run.start) / (run.due - run.start), 0, 1); h += '<div class="fl"><div class="prog g"><div style="width:' + (done * 100).toFixed(1) + '%"></div></div> <small>עוד ' + daysTxt(run.due - S.day) + '</small></div>'; }
    else if (lvl >= 6) h += '<div class="sub ok">ברמה הגבוהה ביותר</div>';
    else h += '<div class="btns">' + fbtn('sect', 'השקע · ' + daysTxt(150 + lvl * 30), { cost: secCost(k), note: 'צמיחה ' + isoNums('+' + (D.g * 100).toFixed(2) + '%') }, 'good', p.secQ.length >= 2, ' data-k="' + k + '"') + '</div>';
    h += '</div>';
  }
  return h;
}
function startSect(k) {
  secInit(); const p = S.p; if (!SECT[k] || p.secQ.length >= 2 || p.secQ.some(q => q.k === k) || p.sec[k] >= 6) return;
  if (!spend(secCost(k))) return;
  p.secQ.push({ k, start: S.day, due: S.day + 150 + p.sec[k] * 30 });
  toast('התחלנו להשקיע ב' + SECT[k].he); renderAll();
}
function econMonthly() {
  secInit(); const p = S.p, c = P();
  p.secQ = p.secQ.filter(q => { if (S.day < q.due) return true; p.sec[q.k]++; fxToast(SECT[q.k].ic + ' ענף ' + SECT[q.k].he + ' עלה לרמה ' + p.sec[q.k], { ap: 1 }); addNews('ענף ה' + SECT[q.k].he + ' שלנו מתרחב.', 'good'); return false; });
  const m = secIncome(); p.secM = m; p.treasury += m;
  if (p.sec.industry > 1) addInv(c, 0.002 * (p.sec.industry - 1));
  if (p.sec.arms > 1) c.tm = Math.min(3, (c.tm || 1) + 0.002 * (p.sec.arms - 1));
}

/* ================= groups in the population, each with its own wishes ================= */
const FAC = {
  army:  { he: 'הצבא', ic: '🎖️' },
  biz:   { he: 'אנשי עסקים', ic: '💼' },
  work:  { he: 'עובדים', ic: '👷' },
  relig: { he: 'דתיים ומסורתיים', ic: '🕌' },
  youth: { he: 'צעירים', ic: '🎓' },
  farm:  { he: 'חקלאים ופריפריה', ic: '🚜' },
};
function facInit() { const p = S.p; if (!p.fac) { p.fac = {}; for (const k in FAC) p.fac[k] = 55; p.facCd = 0; } }
function facTarget(k) {
  const p = S.p, c = P(), wars = activeWars(S.player), sec = p.sec || {};
  const g = (p.gdpHist && p.gdpHist.length > 12) ? p.gdpHist[p.gdpHist.length - 1] / p.gdpHist[p.gdpHist.length - 13] - 1 : 0.02;
  switch (k) {
    case 'army': return 45 + (p.defPct - 0.03) * 500 + (sec.arms || 0) * 3 + (wars ? 5 : 0) + ((P().tm || 1) - 1) * 40;
    case 'biz': return 70 - (p.tax - 0.25) * 200 + (sec.finance || 0) * 3 + (sec.tech || 0) * 2 + g * 300 - sanctionHit(S.player) * 100;
    case 'work': return 35 + (p.welfare - 0.1) * 250 + (sec.industry || 0) * 4 + g * 200;
    case 'relig': return 60 - (sec.tourism || 0) * 2 - (p.unrest || 0) * 2 + ((p.built && p.built.school) || 0) * 2 - (S.p.rep > 70 ? 3 : 0);
    case 'youth': return 40 + (sec.tech || 0) * 5 + ((p.built && p.built.house) || 0) * 5 + ((p.built && p.built.school) || 0) * 3 - wars * 10 - (c.mob > 0 ? 10 : 0);
    case 'farm': return 40 + (sec.agri || 0) * 6 + ((p.built && p.built.infra) || 0) * 3 - (p.tax - 0.3) * 80;
  }
  return 50;
}
// how the groups move the people's love (added to the approval target)
const factionAp = () => { const p = S.p; if (!p || !p.fac) return 0; let s = 0; for (const k in FAC) s += (p.fac[k] - 50); return s / 6 * 0.25; };
function facAdd(k, d) { facInit(); S.p.fac[k] = clamp(S.p.fac[k] + d, 0, 100); }
// what each group asks for when it is unhappy
const DEMANDS = {
  army: { t: 'הצבא דורש תקציב', x: 'הרמטכ״ל אומר שהצבא חלש מדי ומבקש עוד כסף לציוד.', o: [
    ['להגדיל את התקציב', () => { S.p.defPct = Math.min(0.12, S.p.defPct + 0.01); facAdd('army', 18); facAdd('work', -4); }, 'תקציב ביטחון +1% · הצבא +18'],
    ['לקנות ציוד חדש בבת אחת', () => { if (spend(P().gdp * 0.004)) { addInv(P(), 0.03); facAdd('army', 12); } }, () => money(P().gdp * 0.004) + ' · הצבא +12'],
    ['לסרב', () => { facAdd('army', -12); }, 'הצבא −12'] ] },
  biz: { t: 'אנשי העסקים רוצים פחות מסים', x: 'ראשי החברות הגדולות מאיימים להעביר את המפעלים לחו״ל.', o: [
    ['להוריד מס חברות', () => { S.p.tax = Math.max(0.1, S.p.tax - 0.02); facAdd('biz', 18); facAdd('work', -5); }, 'מסים −2% · עסקים +18'],
    ['להשקיע בענף הפיננסים', () => { secInit(); if (spend(P().gdp * 0.003)) { S.p.sec.finance = Math.min(6, S.p.sec.finance + 1); facAdd('biz', 10); } }, () => money(P().gdp * 0.003) + ' · עסקים +10'],
    ['לסרב', () => { facAdd('biz', -12); }, 'עסקים −12'] ] },
  work: { t: 'העובדים מאיימים בשביתה', x: 'האיגודים דורשים העלאת שכר מינימום ותנאים טובים יותר.', o: [
    ['להעלות שכר מינימום', () => { S.p.welfare = Math.min(0.35, S.p.welfare + 0.015); facAdd('work', 20); facAdd('biz', -8); }, 'רווחה +1.5% · עובדים +20 · עסקים −8'],
    ['מענק חד-פעמי', () => { if (spend(P().gdp * 0.002)) facAdd('work', 12); }, () => money(P().gdp * 0.002) + ' · עובדים +12'],
    ['לסרב — שישבתו', () => { facAdd('work', -15); S.p.growthBonus = (S.p.growthBonus || 0) - 0.002; }, 'עובדים −15 · צמיחה −0.2%'] ] },
  relig: { t: 'הדתיים מוחים', x: 'מנהיגי הקהילות הדתיות מרגישים שהממשלה מתעלמת מהם ומהמסורת.', o: [
    ['תקציב למוסדות דת וחינוך', () => { if (spend(P().gdp * 0.002)) facAdd('relig', 16); facAdd('youth', -4); }, () => money(P().gdp * 0.002) + ' · דתיים +16 · צעירים −4'],
    ['פגישה עם המנהיגים', () => { facAdd('relig', 7); }, 'דתיים +7'],
    ['להתעלם', () => { facAdd('relig', -12); S.p.unrest = (S.p.unrest || 0) + 1; }, 'דתיים −12'] ] },
  youth: { t: 'הצעירים יוצאים לרחובות', x: 'אין דירות ואין עבודה טובה. הצעירים מאיימים לעזוב את המדינה.', o: [
    ['מבצע דיור לצעירים', () => { if (spend(P().gdp * 0.003)) facAdd('youth', 18); }, () => money(P().gdp * 0.003) + ' · צעירים +18'],
    ['להשקיע בהייטק', () => { secInit(); if (spend(P().gdp * 0.003)) { S.p.sec.tech = Math.min(6, S.p.sec.tech + 1); facAdd('youth', 12); } }, () => money(P().gdp * 0.003) + ' · צעירים +12 · הייטק +1'],
    ['להתעלם', () => { facAdd('youth', -12); S.p.growthBonus = (S.p.growthBonus || 0) - 0.001; }, 'צעירים −12 · בריחת מוחות'] ] },
  farm: { t: 'החקלאים חוסמים כבישים', x: 'החקלאים והפריפריה דורשים סבסוד ומים.', o: [
    ['סבסוד לחקלאות', () => { if (spend(P().gdp * 0.0015)) facAdd('farm', 18); }, () => money(P().gdp * 0.0015) + ' · חקלאים +18'],
    ['כבישים ומים לפריפריה', () => { if (spend(P().gdp * 0.003)) { facAdd('farm', 12); S.p.growthBonus = (S.p.growthBonus || 0) + 0.0005; } }, () => money(P().gdp * 0.003) + ' · חקלאים +12'],
    ['לסרב', () => { facAdd('farm', -12); }, 'חקלאים −12'] ] },
};
function factionsMonthly() {
  facInit(); const p = S.p, c = P();
  for (const k in FAC) p.fac[k] = clamp(p.fac[k] + (clamp(facTarget(k), 0, 100) - p.fac[k]) * 0.15, 0, 100);
  if (p.facCd > 0) { p.facCd--; return; }
  const low = Object.keys(FAC).sort((a, b) => p.fac[a] - p.fac[b])[0];
  if (p.fac[low] < 46 && R() < 0.6) {
    const D = DEMANDS[low]; p.facCd = 2;
    modal({ title: FAC[low].ic + ' ' + D.t, html: '<p>' + D.x + '</p><p class="sub">שביעות רצון: ' + Math.round(p.fac[low]) + '/100</p>',
      buttons: D.o.map(([l, fn, fx]) => ({ label: l + '<small class="cost">' + isoNums(typeof fx === 'function' ? fx() : fx) + '</small>', fn: () => { fn(); renderAll(); } })) });
  }
  if (low === 'army' && p.fac.army < 12 && c.gov !== 'democracy' && R() < 0.1) { addNews('קצינים כועסים מדברים על הפיכה! הצבא לא מרוצה.', 'bad'); p.unrest = (p.unrest || 0) + 3; }
}
function factionSection() {
  facInit(); const p = S.p;
  let h = '<h3>קבוצות בעם</h3><p class="sub">כל קבוצה רוצה משהו אחר. הממוצע שלהן משפיע על אהבת העם (' + sgn(factionAp()) + '). קבוצה לא מרוצה תבוא עם דרישות.</p><div class="grid">';
  for (const k in FAC) { const v = p.fac[k], T = clamp(facTarget(k), 0, 100);
    h += '<div><small>' + FAC[k].ic + ' ' + FAC[k].he + '</small><span class="' + (v < 30 ? 'bad' : v < 45 ? 'warn' : 'ok') + '">' + Math.round(v) + '</span> <small>' + (T > v + 2 ? '↑' : T < v - 2 ? '↓' : '') + '</small></div>'; }
  return h + '</div>';
}

/* ================= the UN: votes and our own resolutions ================= */
const UNR = [
  { t: c => 'גינוי ' + c.he + ' על הפרת זכויות אדם', bad: 1 },
  { t: c => 'סנקציות על ' + c.he + ' בגלל תוכנית הנשק שלה', bad: 1 },
  { t: c => 'קרן סיוע בינלאומית ל' + c.he + ' אחרי אסון', bad: 0 },
  { t: c => 'הכרה בזכותה של ' + c.he + ' לגבולות בטוחים', bad: 0 },
];
function unMonthly() {
  const p = S.p; if (p.unCd > 0) { p.unCd--; return; } p.unCd = 3 + Math.floor(R() * 3);
  const others = alive().filter(id => id !== S.player && S.c[id].gdp > 20);
  const o = others[Math.floor(R() * others.length)]; if (!o) return;
  const C = S.c[o], hated = worldView(o) < -8, R_ = UNR.filter(r => hated ? r.bad : !r.bad), r = R_[Math.floor(R() * R_.length)];
  const friends = alive().filter(id => id !== o && id !== S.player && rel(id, o) > 40).slice(0, 4), foes = alive().filter(id => id !== o && id !== S.player && rel(id, o) < -40).slice(0, 4);
  const yes = r.bad ? foes : friends, no = r.bad ? friends : foes;
  const vote = (dir) => () => {
    const sg = r.bad ? -1 : 1, e = { rel: {} };
    if (dir === 1) { e.rel[o] = 12 * sg; yes.forEach(id => e.rel[id] = 4); no.forEach(id => e.rel[id] = -4); e.rep = r.bad ? 2 : 1; }
    else if (dir === -1) { e.rel[o] = -12 * sg; yes.forEach(id => e.rel[id] = -4); no.forEach(id => e.rel[id] = 4); e.rep = r.bad ? -2 : -1; }
    else { e.rel[o] = 0; }
    fxToast('הצבענו באו״ם', e); addNews('עצרת האו״ם הצביעה על: ' + r.t(C) + '.', 'dip'); renderAll();
  };
  modal({ title: '🇺🇳 הצבעה באו״ם', html: '<p><b>' + r.t(C) + '</b></p><p class="sub">בעד: ' + (yes.map(nm).join(', ') || '—') + '<br>נגד: ' + (no.map(nm).join(', ') || '—') + '</p>',
    buttons: [{ label: 'בעד', fn: vote(1) }, { label: 'נגד', fn: vote(-1) }, { label: 'להימנע', fn: vote(0) }] });
}
const unChance = o => clamp(0.15 + S.p.rep / 140 - worldView(o) / 60 - (S.c[o].nukes > 0 ? 0.1 : 0), 0.05, 0.85);
function unButton(o) {
  if (!S.c[o] || o === S.player) return '';
  const cd = cdLeft('unres:' + o);
  return '<h3>האו״ם</h3><div class="btns">' + (cd ? '<button class="b" disabled>הצעת החלטה נגדם' + cdNote(cd) + '</button>' :
    fbtn('unres', 'להציע החלטה נגדם באו״ם', { note: 'סיכוי ' + pct(unChance(o) * 100) + ' · הצלחה: סנקציות עולמיות עליהם' }, '')) + '</div>';
}
function doUnRes() {
  const o = selOwner(), C = S.c[o]; if (!C || cdLeft('unres:' + o)) return; setCd('unres:' + o, 180);
  if (R() < unChance(o)) {
    let n = 0; alive().forEach(id => { if (id !== o && id !== S.player && rel(id, o) < 20 && S.c[id].gdp > 30) { S.sanc[id + '>' + o] = 1; n++; } });
    noteGrievance(o, S.player);
    fxToast('ההחלטה עברה! ' + n + ' מדינות מטילות סנקציות על ' + C.he, { rep: 3, rel: { [o]: -20 } });
    addNews('האו״ם קיבל את ההצעה של ' + P().he + ': סנקציות על ' + C.he + '.', 'good');
  } else { fxToast('ההצעה נדחתה באו״ם', { rep: -2, rel: { [o]: -10 } }, true); addNews('האו״ם דחה את ההצעה של ' + P().he + ' נגד ' + C.he + '.', 'bad'); }
  renderAll();
}

function addInv(c, f) { if (!c.inv) return; ['troops', 'tanks', 'afv', 'art', 'air', 'heli'].forEach(k => { if (c.inv[k]) c.inv[k] *= 1 + f; }); }
function iniSection() {
  const p = S.p; p.ini = p.ini || []; p.iniL = p.iniL || {};
  let h = '<h3>יוזמות שלום ופיתוח</h3><p class="sub">דרכים להתחזק בלי מלחמה: כלכלה, מדע, תרבות ודיפלומטיה.</p>';
  for (const k in INI) {
    const D = INI[k], lvl = p.iniL[k] || 0, run = p.ini.find(q => q.k === k);
    h += '<div class="card"><b>' + D.he + '</b>' + (lvl ? ' ' + chip('×' + lvl, 'teal') : '') + '<div class="sub">' + esc(D.d) + '</div>';
    if (run) { const done = clamp((S.day - run.start) / (run.due - run.start), 0, 1); h += '<div class="fl"><div class="prog g"><div style="width:' + (done * 100).toFixed(1) + '%"></div></div> <small>עוד ' + daysTxt(run.due - S.day) + '</small></div>'; }
    else if (lvl >= D.max) h += '<div class="sub ok">הושלם</div>';
    else {
      const note = [D.g ? 'צמיחה ' + isoNums((D.g > 0 ? '+' : '') + (D.g * 100).toFixed(2) + '%') : '', D.bid ? 'סיכוי ' + pct(olympChance() * 100) : '', D.relAll ? 'כל המדינות ' + sgn(D.relAll) : '', D.relTop ? 'המעצמות ' + sgn(D.relTop) : '', D.relAU ? 'אפריקה ' + sgn(D.relAU) : '', D.relBad ? 'יריבים ' + sgn(D.relBad) : ''].filter(Boolean).join(' · ');
      h += '<div class="btns">' + fbtn('ini', 'התחל · ' + daysTxt(D.days), { cost: iniCost(k), ap: D.ap, rep: D.rep, note }, 'good', false, ' data-k="' + k + '"') + '</div>';
    }
    h += '</div>';
  }
  return h;
}
const olympChance = () => clamp(0.1 + S.p.rep / 130 + P().gdp / 30000, 0.05, 0.8);
function startIni(k) {
  const D = INI[k], p = S.p; p.ini = p.ini || []; p.iniL = p.iniL || {};
  if (!D || p.ini.some(q => q.k === k) || (p.iniL[k] || 0) >= D.max) return;
  if (!spend(iniCost(k))) return;
  p.ini.push({ k, start: S.day, due: S.day + D.days });
  toast('היוזמה "' + D.he + '" התחילה · תסתיים בעוד ' + daysTxt(D.days));
  addNews('הממשלה השיקה יוזמה: ' + D.he + '.', 'good'); renderAll();
}
function peaceDaily() {
  const p = S.p; if (!p) return;
  if (p.loans && p.loans.length) p.loans = p.loans.filter(l => {
    if (S.day < l.due) return true;
    if (S.c[l.o] && S.c[l.o].alive) { p.treasury += l.amt; fxToast(nm(l.o) + ' החזירה את ההלוואה: ' + money(l.amt), { rel: { [l.o]: 3 } }); }
    else addNews('ההלוואה ל' + nm(l.o) + ' אבדה — המדינה כבר לא קיימת.', 'bad');
    return false;
  });
  if (p.ini && p.ini.length) p.ini = p.ini.filter(q => {
    if (S.day < q.due) return true;
    const D = INI[q.k]; p.iniL = p.iniL || {}; p.iniL[q.k] = (p.iniL[q.k] || 0) + 1;
    const e = {}; if (D.ap) e.ap = D.ap; if (D.rep) e.rep = D.rep;
    let g = D.g || 0; if (D.tour && p.rep < 40) g /= 2;
    if (D.bid) {
      if (R() < olympChance()) { e.ap = 8; e.rep = 8; g = 0.004; addNews('ניצחנו! האולימפיאדה תתקיים אצלנו. חגיגות ברחובות.', 'good'); }
      else { e.ap = -2; p.treasury += iniCost(q.k) * 0.4; p.iniL[q.k] = 0; addNews('המועמדות לאולימפיאדה הפסידה. חלק מהכסף חזר.', 'bad'); }
    }
    if (g) p.growthBonus = (p.growthBonus || 0) + g;
    const others = alive().filter(id => id !== S.player);
    if (D.relAll) others.forEach(id => addRel(id, S.player, D.relAll));
    if (D.relTop) others.sort((a, b) => S.c[b].gdp - S.c[a].gdp).slice(0, 10).forEach(id => addRel(id, S.player, D.relTop));
    if (D.relAU) others.filter(id => (S.c[id].blocs || []).includes('AU')).forEach(id => addRel(id, S.player, D.relAU));
    if (D.relBad) others.filter(id => rel(id, S.player) < -30).forEach(id => addRel(id, S.player, D.relBad));
    fxToast('הושלם: ' + D.he, e);
    if (!D.bid) addNews('היוזמה "' + D.he + '" הושלמה.', 'good');
    return false;
  });
}
function checkWin() {
  const share = P().gdp / worldGdp();
  if (!S.won.gdp && share >= 0.35) { S.won.gdp = 1; S.pending.push({ type: 'win', txt: 'ניצחון כלכלי! ' + P().he + ' שולטת ב-' + Math.round(share * 100) + '% מהכלכלה העולמית.' }); }
  if (!S.won.time && S.turn >= 120) { S.won.time = 1; S.pending.push({ type: 'win', txt: 'שרדת עשר שנים בשלטון — עד 2036!' }); }
}
function score() {
  if (!S || !S.player) return 0;
  const c = P();
  return Math.max(0, Math.round(c.gdp / worldGdp() * 10000 + c.approval * 10 + S.p.annexed.length * 500 + S.turn * 5 + Math.min(500, power(c) / 10)));
}
function gameOver(reason, txt) { S.over = { reason, txt }; addNews('סוף המשחק: ' + txt, 'bad'); }

/* ================= nuclear ================= */
// people killed by one nuclear strike on a country's biggest city: tens of thousands in a small country, up to ~1.5 million in a giant one
function nukeDead(T) { return Math.round(Math.min(T.pop * 0.3, clamp(T.pop * 0.004 + 0.03, 0.01, 1.5) * (0.7 + R() * 0.6)) * 1e6); }
function nukeHit(att, tgt, ci) {
  const T = S.c[tgt], before = invSnap(T), x = (ci && CITYI[ci]) || (S.ct ? nukeTargetCity(tgt) : null);
  const dead = x ? nukeCityDead(T, x) : nukeDead(T);
  const share = x ? clamp(x.pop / Math.max(0.05, T.pop), 0, 0.6) : 0.1;
  T.pop = Math.max(0.01, T.pop - dead / 1e6); T.gdp *= x ? 1 - clamp(0.15 + share * 1.2, 0.2, 0.5) : 0.65;
  hurtInv(T, Math.min(0.3, 150 / Math.max(1, T.inv.troops)), ['troops']); hurtInv(T, 0.5, ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'msl']);
  const loss = lossFrom(T, before); civCas(loss, dead, 1.6);
  const lp = launchPt(att, 'mis', tgt), pt = x ? cityPt(x) : nukePt(tgt);
  if (x) { const st = cst(x); st.d = Math.max(st.d || 0, 90); delete st.s; delete st.b; citiesDirty = true; }
  S.scorch = (S.scorch || []).filter(s => s.d > S.day).slice(-11); S.scorch.push({ p: pt, d: S.day + (x ? 720 : 240) }); scorchDirty = true;
  const r = strikeRecord({ k: 'nuke', by: att, at: tgt, cas: loss, own: newCas(), ci: x ? x.id : null, cn: x ? cityName(x) : null, cd: x ? 90 : 0 });
  r._lp = lp; r._pt = pt;
  return r;
}
function nukeImpact(att, tgt, ai, ci) {
  const T = S.c[tgt], A = S.c[att];
  const r = nukeHit(att, tgt, ci);
  T.approval = clamp(T.approval - 20, 0, 100);
  noteGrievance(att, tgt);
  if (att !== S.player && S.p) S.pending.push({ type: 'nukealert', att, tgt, dead: r.cas.ck, cn: r.cn });
  addNews('☢ ' + A.he + ' שיגרה נשק גרעיני על ' + (r.cn ? r.cn + ' (' + T.he + ')' : T.he) + ': ' + nT(r.cas.ck) + ' אזרחים ו-' + nT(r.cas.sk) + ' חיילים נהרגו. העולם בהלם.', 'war');
  fxNuke(r._lp, r._pt, r);
  alive().forEach(id => {
    if (id === att) return;
    addRel(id, att, (isAlly(id, tgt) || id === tgt) ? -70 : -45);
    const C = S.c[id];
    if (C.gov !== 'authoritarian' || rel(id, att) < -50) S.sanc[id + '>' + att] = 1;
  });
  // retaliation
  const ret = alive().filter(id => id !== att && S.c[id].nukes > 0 && (id === tgt || isAlly(id, tgt)));
  if (ret.length && R() < (ret.includes(tgt) ? 0.95 : 0.75)) {
    const rr = ret.includes(tgt) ? tgt : pick(ret);
    S.c[rr].nukes--;
    const r2 = nukeHit(rr, att);
    hurtInv(A, 0.1, ['tanks', 'afv', 'art']);
    if (att === S.player) S.p.shock -= 35;
    addNews('☢ תגובה גרעינית: ' + nm(rr) + ' השיבה במכה גרעינית על ' + A.he + ': ' + nT(r2.cas.ck) + ' אזרחים נהרגו.', 'war');
    setTimeout(() => fxNuke(r2._lp, r2._pt, r2), 2600);
  }
  if (att === S.player) S.p.shock -= 20;
  if (tgt === S.player) S.p.shock -= 15;
  needMapRecolor = true;
  return r;
}

/* ================= save / load ================= */
let WIPED = false;
function save() { if (!S || !S.player || WIPED) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
let OLD_SAVE_FOUND = false, UNITS_MIGRATED = false, GOV_MIGRATED = false;
function load() {
  // saves from the old turn-based version can't be continued: drop them and start fresh
  try { OLD_SAVE_KEYS.forEach(k => { if (localStorage.getItem(k)) { OLD_SAVE_FOUND = true; localStorage.removeItem(k); } }); } catch (e) { /* ignore */ }
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; const o = JSON.parse(s);
    if (!o || o.v !== VERSION || !o.player || !o.c || !o.c[o.player] || !o.c[o.player].inv || !o.p || o.day == null) { OLD_SAVE_FOUND = true; localStorage.removeItem(SAVE_KEY); return false; }
    S = o; BASE.clear(); rebuildOwn();
    // saves from before units existed: build the units from the inventory
    if (!Array.isArray(S.units)) { initUnits(); UNITS_MIGRATED = true; }
    // saves from before the government and the living world: an empty government, fresh event clock
    if (!S.p.gov) { S.p.gov = newGov(); GOV_MIGRATED = true; }
    const g = S.p.gov; ['m', 'ovr', 'no', 'pt', 'tc', 'cand'].forEach(k => { if (!g[k] || typeof g[k] !== 'object') g[k] = {}; }); if (!Array.isArray(g.log)) g.log = [];
    if (!Array.isArray(S.p.tm)) S.p.tm = []; if (!Array.isArray(S.p.tg)) S.p.tg = [];
    if (!S.ev || typeof S.ev !== 'object') S.ev = { nx: S.day + 5, cd: {}, ld: S.day, n: 0, dn: 0 };
    if (!S.wh) worldSnap();
    ensureCityState(); // older saves: cities start from the data
    clNorm(); // older saves: no ceded land
    return true;
  } catch (e) { return false; }
}
function wipe() { WIPED = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

/* ================= land raster: sea or land, and which territory, at any point ================= */
const RW = 1440, RH = 720; // 0.25° per pixel
let RAS = null; const TLIST = [null], TIDX = {};
function initRaster() {
  TIDS.forEach(t => { TIDX[t] = TLIST.length; TLIST.push(t); });
  try {
    const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const pr = d3.geoEquirectangular().scale(RW / (2 * Math.PI)).translate([RW / 2, RH / 2]).precision(0.3);
    const pg = d3.geoPath(pr, ctx);
    FEATS.forEach(f => {
      const i = TIDX[f.properties.tid]; if (!i || !f.geometry) return;
      // id in red+green, a checksum in blue: blended border pixels fail the checksum
      ctx.fillStyle = 'rgb(' + (i & 255) + ',' + ((i >> 8) & 255) + ',' + ((i * 97 + 13) & 255) + ')';
      ctx.beginPath(); pg(f); ctx.fill();
    });
    RAS = ctx.getImageData(0, 0, RW, RH).data;
  } catch (e) { RAS = null; }
}
function rasOff(lon, lat) {
  let x = Math.floor((lon + 180) / 360 * RW), y = Math.floor((90 - lat) / 180 * RH);
  x = ((x % RW) + RW) % RW; y = clamp(y, 0, RH - 1);
  return (y * RW + x) * 4;
}
function rasTid(o) {
  if (RAS[o + 3] < 90) return null;
  const i = RAS[o] | (RAS[o + 1] << 8);
  return (((i * 97 + 13) & 255) === RAS[o + 2] && TLIST[i]) ? TLIST[i] : undefined;
}
let FB = null; // feature bounds for the slow, exact fallback
function geoTidAt(p) {
  if (!FB) FB = FEATS.map(f => ({ f, b: d3.geoBounds(f) }));
  for (const { f, b } of FB) {
    const [[x0, y0], [x1, y1]] = b;
    if (p[1] < y0 || p[1] > y1) continue;
    if (x0 <= x1 ? (p[0] < x0 || p[0] > x1) : (p[0] < x0 && p[0] > x1)) continue;
    if (d3.geoContains(f, p)) return f.properties.tid;
  }
  return null;
}
// territory id at a point (null = sea)
function tidAt(lon, lat) {
  if (!RAS) return geoTidAt([lon, lat]);
  // trust the raster only well inside one territory (or open sea); near any border use the exact shapes
  const t = rasTid(rasOff(lon, lat));
  if (t !== undefined) {
    let same = true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      if (rasTid(rasOff(lon + dx * 0.25, lat + dy * 0.25)) !== t) { same = false; break; }
    }
    if (same) return t;
  }
  return geoTidAt([lon, lat]);
}
const ownerAt = (lon, lat) => { const t = tidAt(lon, lat); return t ? ptOwner(t, lon, lat) : null; };
const isSeaAt = p => RAS ? RAS[rasOff(p[0], p[1]) + 3] < 60 : !geoTidAt(p);
// nearest sea point (for ships), searching outward on the raster
function snapSea(p) {
  if (isSeaAt(p) || !RAS) return p;
  const cx = Math.floor((p[0] + 180) / 360 * RW), cy = Math.floor((90 - p[1]) / 180 * RH);
  for (let r = 1; r <= 60; r++) {
    let best = null, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const y = cy + dy; if (y < 0 || y >= RH) continue;
      const x = ((cx + dx) % RW + RW) % RW;
      if (RAS[(y * RW + x) * 4 + 3] < 60) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [x, y]; } }
    }
    if (best) {
      // one more pixel out to sea so the ship doesn't sit on the coastline
      const q = [(best[0] + 0.5) / RW * 360 - 180, 90 - (best[1] + 0.5) / RH * 180];
      const ang = Math.atan2(best[1] - cy, best[0] - cx), q2 = [q[0] + Math.cos(ang) * 0.3, q[1] - Math.sin(ang) * 0.3];
      return isSeaAt(q2) ? q2 : q;
    }
  }
  return null;
}
const km = (a, b) => d3.geoDistance(a, b) * 6371;
/* ---- sea routes: ships sail around continents instead of across them ---- */
const GW = 720, GH = 360; // 0.5 degree cells
let SEA = null;
function seaGrid() {
  if (SEA || !RAS) return SEA;
  SEA = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    let sea = 0;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) if (RAS[((y * 2 + j) * RW + x * 2 + i) * 4 + 3] < 60) sea = 1;
    SEA[y * GW + x] = sea;
  }
  // canals and narrow straits the coarse grid would close: Suez, Panama, Bosporus + Dardanelles, Gibraltar, Oresund
  [[[32.3, 31.4], [32.5, 29.8]], [[-79.9, 9.4], [-79.5, 8.8]], [[29.0, 41.3], [26.3, 40.0]], [[-5.8, 35.95], [-5.3, 35.95]], [[12.7, 56.1], [12.6, 55.5]]].forEach(([a, b]) => {
    for (let f = 0; f <= 1.0001; f += 0.02) SEA[gCell([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])] = 1;
  });
  return SEA;
}
function gCell(p) { const x = ((Math.floor((p[0] + 180) * 2) % GW) + GW) % GW, y = clamp(Math.floor((90 - p[1]) * 2), 0, GH - 1); return y * GW + x; }
const gPt = c => [(c % GW) / 2 - 180 + 0.25, 90 - Math.floor(c / GW) / 2 - 0.25];
function gNearSea(c) {
  if (SEA[c]) return c;
  const cx = c % GW, cy = Math.floor(c / GW);
  for (let r = 1; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const y = cy + dy; if (y < 0 || y >= GH) continue;
    const n = y * GW + ((cx + dx) % GW + GW) % GW; if (SEA[n]) return n;
  }
  return -1;
}
// open water all the way between two points?
function seaLine(a, b) {
  const d = km(a, b), n = Math.max(2, Math.ceil(d / 25)), it = d3.geoInterpolate(a, b);
  for (let i = 1; i < n; i++) if (!SEA[gCell(it(i / n))]) return false;
  return true;
}
// waypoints (ending at b) for a ship, or null when there is no way by sea
function seaRoute(a, b) {
  if (!seaGrid()) return [b];
  if (seaLine(a, b)) return [b];
  const s = gNearSea(gCell(a)), t = gNearSea(gCell(b)); if (s < 0 || t < 0) return null;
  const N = GW * GH, g = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const tx = t % GW, ty = Math.floor(t / GW);
  const cosY = y => Math.max(0.05, Math.cos((90 - y / 2 - 0.25) * Math.PI / 180));
  const h = c => { const x = c % GW, y = Math.floor(c / GW); let dx = Math.abs(x - tx); dx = Math.min(dx, GW - dx); return Math.hypot(dx * cosY((y + ty) / 2), y - ty); };
  const hf = [], hc = [];
  const push = (f, c) => { let i = hf.length; hf.push(f); hc.push(c); while (i > 0) { const q = (i - 1) >> 1; if (hf[q] <= f) break; hf[i] = hf[q]; hc[i] = hc[q]; i = q; } hf[i] = f; hc[i] = c; };
  const pop = () => {
    const top = hc[0], lf = hf.pop(), lc = hc.pop();
    if (hf.length) {
      let i = 0; const n = hf.length;
      for (;;) { let m = -1, mf = lf; const l = 2 * i + 1, r = l + 1; if (l < n && hf[l] < mf) { m = l; mf = hf[l]; } if (r < n && hf[r] < mf) { m = r; mf = hf[r]; } if (m < 0) break; hf[i] = hf[m]; hc[i] = hc[m]; i = m; }
      hf[i] = lf; hc[i] = lc;
    }
    return top;
  };
  g[s] = 0; push(h(s), s); let found = false;
  while (hf.length) {
    const c = pop(); if (done[c]) continue; done[c] = 1;
    if (c === t) { found = true; break; }
    const x = c % GW, y = Math.floor(c / GW), cy = cosY(y);
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy; if (ny < 0 || ny >= GH) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const n = ny * GW + ((x + dx) % GW + GW) % GW; if (!SEA[n] || done[n]) continue;
        const ng = g[c] + Math.hypot(dx * cy, dy); if (ng < g[n]) { g[n] = ng; from[n] = c; push(ng + h(n), n); }
      }
    }
  }
  if (!found) return null;
  const cells = []; for (let c = t; c !== -1; c = from[c]) cells.push(c); cells.reverse();
  // pull the string tight: keep only the turns that are needed
  const pts = [a].concat(cells.map(gPt), [b]), out = [];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !seaLine(pts[i], pts[j])) j--;
    out.push(pts[j]); i = j;
  }
  return out;
}
const routeKm = (p, via, dest) => { let d = 0, q = p; for (const w of (via || [])) { d += km(q, w); q = w; } return d + km(q, dest); };
// sample points of a territory: inside, on the border, and in the sea just off the coast
const TPC = {};
function tp(tid) {
  if (TPC[tid]) return TPC[tid];
  const T = TERR[tid], res = { in: [], edge: [], sea: [] };
  TPC[tid] = res;
  if (!T || !T.best) { res.in.push(T ? T.c : [0, 0]); return res; }
  const poly = T.best, inv = d3.geoArea(poly) > 2 * Math.PI;
  const inside = p => d3.geoContains(poly, p) !== inv;
  const b = d3.geoBounds(poly); let [x0, y0] = b[0], [x1, y1] = b[1]; if (x1 < x0) x1 += 360;
  for (let i = 0; i < 600 && res.in.length < 40; i++) {
    let lon = x0 + R() * (x1 - x0); const lat = y0 + R() * (y1 - y0); if (lon > 180) lon -= 360;
    if (inside([lon, lat])) res.in.push([lon, lat]);
  }
  if (!res.in.length) res.in.push(T.c);
  const ring = poly.coordinates[0], step = Math.max(1, Math.floor(ring.length / 70));
  for (let i = 0; i < ring.length; i += step) res.edge.push(ring[i]);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
  for (let i = 0; i < ring.length; i += step) {
    const v = ring[i];
    outer: for (const off of [0.45, 0.9]) for (const [dx, dy] of DIRS) {
      const p = [v[0] + dx * off, v[1] + dy * off];
      if (isSeaAt(p) && isSeaAt([p[0] + dx * 0.3, p[1] + dy * 0.3]) && !tidAt(p[0], p[1])) { res.sea.push(p); break outer; }
    }
  }
  return res;
}
const mainTid = cid => (TERR[cid] && S.owner[cid] === cid) ? cid : tidsOf(cid).slice().sort((a, b) => TERR[b].area - TERR[a].area)[0];
function inPts(cid) { const t = mainTid(cid); return t ? tp(t).in : []; }
// distance (km) from a point to the nearest part of a country
function distToC(cid, p) {
  let m = 1e9;
  for (const t of tidsOf(cid)) { const q = tp(t); for (const a of q.edge) { const d = km(a, p); if (d < m) m = d; } for (const a of q.in) { const d = km(a, p); if (d < m) m = d; } }
  return m;
}
function nearIn(cid, p) {
  let best = null, bd = 1e9;
  for (const t of tidsOf(cid)) for (const a of tp(t).in) { const d = km(a, p); if (d < bd) { bd = d; best = a; } }
  return best;
}
// spread n points far from each other (farthest-point sampling)
function spread(pts, n) {
  if (!pts.length) return [];
  const out = [pts[Math.floor(R() * pts.length)]];
  while (out.length < n) {
    let best = null, bd = -1;
    for (const p of pts) { let d = 1e9; for (const q of out) d = Math.min(d, km(p, q)); if (d > bd) { bd = d; best = p; } }
    if (bd < 1) { out.push(out[out.length % out.length]); continue; }
    out.push(best);
  }
  return out;
}

/* ================= military units on the map ================= */
// every unit carries a share of the country's real inventory (c.inv); the sum of all units always equals c.inv
const UT = {
  inf: { he: 'קורפוס חי״ר', dom: 'land', spd: 30, ic: 'inf' },
  arm: { he: 'אוגדת שריון', dom: 'land', spd: 40, ic: 'arm' },
  art: { he: 'חטיבת ארטילריה', dom: 'land', spd: 30, ic: 'art' },
  msl: { he: 'סוללת טילים', dom: 'land', spd: 35, ic: 'msl' },
  air: { he: 'כנף אוויר', dom: 'air', spd: 2500, ic: 'air', range: AIR_RANGE },
  heli: { he: 'להק מסוקים', dom: 'air', spd: 700, ic: 'heli', range: 700 },
  fleet: { he: 'צי', dom: 'sea', spd: 500, ic: 'fleet' },
  sub: { he: 'שייטת צוללות', dom: 'sea', spd: 420, ic: 'sub' }
};
const KEY_UT = { troops: 'inf', tanks: 'arm', afv: 'arm', art: 'art', msl: 'msl', air: 'air', heli: 'heli', ships: 'fleet', carriers: 'fleet', subs: 'sub' };
const MINNEW = { troops: 2, tanks: 5, afv: 10, art: 5, air: 4, heli: 4, ships: 1, carriers: 1, subs: 1, msl: 10 };
const LAND_K = { troops: 1, tanks: 1, afv: 1, art: 1, msl: 1 }, AIR_K = { air: 1, heli: 1 };
const domOf = u => UT[u.t].dom;
const unitById = id => S.units.find(u => u.id === id) || null;
const unitsOf = o => S.units.filter(u => u.o === o);
const hasUnits = o => S.units.some(u => u.o === o);
function newUnit(o, t, p, m) {
  S.uc = S.uc || {}; const ck = o + ':' + t; S.uc[ck] = (S.uc[ck] || 0) + 1;
  const u = { id: S.uid = (S.uid || 0) + 1, o, t, n: S.uc[ck], m: m || {}, lon: p[0], lat: p[1], px: p[0], py: p[1], hb: [p[0], p[1]], dest: null, mode: null, slow: 1, at: null };
  placeAt(u);
  S.units.push(u); return u;
}
// remember which territory a unit stands on; its owner (u.at) follows annexations automatically
function placeAt(u) { u.tid = UT[u.t].dom === 'sea' ? null : tidAt(u.lon, u.lat); u.at = u.tid ? ptOwner(u.tid, u.lon, u.lat) : null; }
const uName = u => UT[u.t].he + ' ' + u.n;
// home base for a new unit of this kind
function basePt(cid, dom) {
  const t = mainTid(cid); if (!t) return [0, 0];
  const q = tp(t);
  if (dom === 'sea') return q.sea.length ? pick(q.sea) : (snapSea(TERR[t].c) || TERR[t].c);
  return pick(q.in);
}
// split a country's inventory into a sensible number of units and station them at home
function genUnits(cid) {
  const c = S.c[cid]; if (!c || !c.alive) return;
  const I = c.inv, groups = [];
  const g = (t, n, keys) => { n = Math.max(1, n); for (let i = 0; i < n; i++) { const m = {}; keys.forEach(k => { if ((I[k] || 0) > 0) m[k] = I[k] / n; }); if (Object.keys(m).length) groups.push({ t, m }); } };
  const small = power(c) < 80;
  if (small) {
    // small armies: a handful of mixed units
    if (I.troops > 0 || I.afv > 0 || I.art > 0) g('inf', I.troops > 60 ? 2 : 1, I.tanks >= 20 ? ['troops', 'afv', 'art'] : ['troops', 'afv', 'art', 'tanks']);
    if (I.tanks >= 20) g('arm', 1, ['tanks']);
    if (I.air >= 1 || I.heli >= 1) g('air', 1, ['air', 'heli']);
    if (I.ships >= 1 || I.subs >= 1 || I.carriers >= 1) g('fleet', 1, ['ships', 'subs', 'carriers']);
    if (I.msl >= 1) g('msl', 1, ['msl']);
  } else {
    g('inf', clamp(Math.ceil(I.troops / 150), 1, 5), ['troops']);
    if (I.tanks + I.afv > 0) g('arm', clamp(Math.ceil(I.tanks / 800), 1, 3), ['tanks', 'afv']);
    if (I.art > 0) g('art', clamp(Math.ceil(I.art / 2500), 1, 2), ['art']);
    if (I.air > 0) g('air', clamp(Math.ceil(I.air / 300), 1, 3), ['air']);
    if (I.heli > 0) g('heli', 1, ['heli']);
    if (I.ships + I.carriers > 0) g('fleet', clamp(Math.ceil(I.ships / 60), 1, 3), ['ships', 'carriers']);
    if (I.subs > 0) g('sub', 1, ['subs']);
    if (I.msl > 0) g('msl', 1, ['msl']);
  }
  // carriers can't be split in fractions across fleets: give whole carriers to the first fleets
  const fl = groups.filter(x => x.m.carriers != null);
  if (fl.length > 1) { let left = I.carriers; fl.forEach((x, i) => { const n = i === fl.length - 1 ? left : Math.min(left, Math.ceil(I.carriers / fl.length)); x.m.carriers = n; left -= n; if (!n) delete x.m.carriers; }); }
  const t = mainTid(cid); if (!t) return;
  const q = tp(t);
  const landG = groups.filter(x => UT[x.t].dom !== 'sea'), seaG = groups.filter(x => UT[x.t].dom === 'sea');
  const lp = spread(q.in, landG.length), sp = q.sea.length ? spread(q.sea, seaG.length) : [];
  landG.forEach((x, i) => newUnit(cid, x.t, lp[i] || q.in[0], x.m));
  seaG.forEach((x, i) => newUnit(cid, x.t, sp[i] || snapSea(TERR[t].c) || TERR[t].c, x.m));
}
// unit power: ground force, support (artillery, air, missiles: they multiply ground forces) and naval force
function uPow(u, foeAdv) {
  const m = u.m, q = (S.c[u.o] && S.c[u.o].q) || 1, a = foeAdv || 0;
  return {
    l: ((m.troops || 0) * W8.troops + (m.tanks || 0) * W8.tanks + (m.afv || 0) * W8.afv) * q,
    s: ((m.art || 0) * W8.art + (m.msl || 0) * W8.msl * 0.5 + (m.air || 0) * W8.air * (1 - 0.2 * a) + (m.heli || 0) * W8.heli * (1 - 0.12 * a)) * q,
    n: ((m.ships || 0) * W8.ships + (m.subs || 0) * W8.subs + (m.carriers || 0) * W8.carriers) * q
  };
}
const uStr = u => { const p = uPow(u, 0); return p.l + p.s + p.n; };
const uEmpty = u => Object.keys(u.m).every(k => (u.m[k] || 0) < 0.5);
// keep the units equal to the inventory: losses come off proportionally, new equipment goes to units at home
function atHome(u) {
  if (u.dest) return false;
  // a fleet is at home near its base, or anchored at any of our ports (there it gets repairs and new ships)
  return domOf(u) === 'sea' ? km([u.lon, u.lat], u.hb) < 400 || nearOwnPort(u.o, [u.lon, u.lat], 150) : u.at === u.o;
}
function depotFor(cid, us, k, d) {
  const home = us.filter(atHome);
  return home.find(u => u.t === KEY_UT[k] && u.m[k] > 0) || home.find(u => u.m[k] > 0) ||
    (d >= MINNEW[k] ? null : (us.find(u => u.m[k] > 0) || home.find(u => (domOf(u) === 'land') === !!LAND_K[k] && (domOf(u) === 'air') === !!AIR_K[k]) || us[0] || null));
}
function syncUnits(cid) {
  const c = S.c[cid]; if (!c) return;
  let us = unitsOf(cid);
  for (const k of INV_KEYS) {
    let sum = 0; for (const u of us) sum += u.m[k] || 0;
    const inv = Math.max(0, c.inv[k] || 0), d = inv - sum;
    if (Math.abs(d) < 1e-7) continue;
    if (d < 0) { const f = sum > 0 ? inv / sum : 0; for (const u of us) if (u.m[k]) u.m[k] *= f; }
    else if (d < MINNEW[k] && sum > 0) {
      // small daily replacements reach every unit that has this kind of equipment, front-line units included
      const f = inv / sum; for (const u of us) if (u.m[k]) u.m[k] *= f;
    } else {
      let dep = depotFor(cid, us, k, d);
      if (!dep) {
        const t = KEY_UT[k], dom = UT[t].dom;
        if (cid === S.player && d >= MINNEW[k] * 2) { const ty = UT[t].he; setTimeout(() => toast('יחידה חדשה הוקמה: ' + ty), 0); }
        dep = newUnit(cid, t, basePt(cid, dom)); us.push(dep);
      }
      dep.m[k] = (dep.m[k] || 0) + d;
    }
  }
  // remove empty units: whatever is left goes to a sister unit (or off the books)
  us.filter(uEmpty).forEach(u => {
    if (us.length <= 1) return;
    const rest = us.filter(x => x !== u && !uEmpty(x));
    if (!rest.length) return;
    for (const k in u.m) {
      const v = u.m[k] || 0; if (!v) continue;
      const to = rest.find(x => x.t === u.t && x.m[k] > 0) || rest.find(x => x.m[k] > 0);
      if (to) to.m[k] += v; else c.inv[k] = Math.max(0, (c.inv[k] || 0) - v);
    }
    S.units = S.units.filter(x => x !== u); us = us.filter(x => x !== u);
    if (selUnit === u.id) { selUnit = null; if (tab === 'unit') openTab(null); }
    if (cid === S.player) addNews(uName(u) + ' הושמדה / פורקה.', 'bad');
    if (S.player && cid !== S.player) { const w = S.wars.find(v => inWar(v, cid) && inWar(v, S.player)); if (w) warLog(w, 'השמדנו את ' + uName(u) + ' של ' + nm(cid)); } else if (cid === S.player) { const w = S.wars.find(v => v.pause === 0 && inWar(v, S.player)); if (w) warLog(w, uName(u) + ' שלנו הושמדה'); }
    if (uFought(u)) { fxBoom([u.lon, u.lat], 15 * fxZ(), { one: 1, dur: 1000 }); fxAdd({ k: 'spark', one: 1, p: [u.lon, u.lat], a: R() * 6, dur: 400 }); }
  });
  for (const u of us) for (const k in u.m) if (!(u.m[k] > 1e-9)) delete u.m[k];
}
// which countries get units on the map: the player and the countries fighting the player nearby
function neededOwners() {
  const s = new Set(); if (!S.player || !S.c[S.player] || !S.c[S.player].alive) return s;
  s.add(S.player);
  const near = [];
  warsOf(S.player).forEach(w => {
    const foes = w.A.includes(S.player) ? w.B : w.A, lead = w.a === S.player || w.b === S.player;
    if (lead) s.add(enemyLeaderFor(w, S.player));
    foes.forEach(f => { if (!s.has(f) && S.c[f] && S.c[f].alive && (adjacent(f, S.player) || dist(f, S.player) < 1200)) near.push(f); });
  });
  near.sort((a, b) => dist(a, S.player) - dist(b, S.player)).slice(0, 3).forEach(f => s.add(f));
  return s;
}
function refreshOwners() {
  const need = neededOwners();
  const had = new Set(S.units.map(u => u.o));
  S.units = S.units.filter(u => need.has(u.o) && S.c[u.o] && S.c[u.o].alive);
  need.forEach(o => { if (!had.has(o)) { genUnits(o); if (o !== S.player) deployExisting(o); } });
  if (selUnit && !unitById(selUnit)) { selUnit = null; if (tab === 'unit') openTab(null); }
}
function syncAllUnits() {
  if (!S || !S.player || !S.units) return;
  refreshOwners();
  new Set(S.units.map(u => u.o)).forEach(syncUnits);
  unitsDirty = true;
}
// a war that was already running when units appeared: put part of the occupier's army on the front
function deployFront(att, cid, share) {
  const land = unitsOf(att).filter(u => domOf(u) === 'land').sort((a, b) => uStr(b) - uStr(a));
  const tot = land.reduce((s, u) => s + uStr(u), 0); let sent = 0;
  const pts = []; tidsOf(cid).forEach(t => tp(t).in.forEach(p => pts.push(p)));
  pts.sort((a, b) => distToC(att, a) - distToC(att, b));
  const front = pts.slice(0, Math.max(3, Math.ceil(pts.length / 3)));
  for (const u of land) {
    if (sent >= tot * share) break; const p = front[Math.floor(R() * front.length)]; if (!p) break;
    u.lon = u.px = p[0]; u.lat = u.py = p[1]; placeAt(u); sent += uStr(u);
    if (att !== S.player) { u.ai = 'atk'; u.s0 = uStr(u); }
  }
}
function deployExisting(o) {
  warsOf(S.player).forEach(w => {
    if (!(w.a === S.player || w.b === S.player) || enemyLeaderFor(w, S.player) !== o) return;
    const fp = mySideFront(w, S.player);
    if (fp > 3 && !unitsOf(S.player).some(u => u.at === o)) deployFront(S.player, o, 0.75);
    if (fp < -3) deployFront(o, S.player, 0.5);
  });
}
function initUnits() {
  S.units = []; S.uid = 0; S.uc = {};
  genUnits(S.player);
  refreshOwners();
}
/* ---- reach & movement ---- */
const passable = n => n === S.player || isAlly(n, S.player) || atWar(n, S.player);
function landReach(from, to) {
  if (!from || !to) return false;
  if (from === to) return true;
  const seen = new Set([from]); let fr = [from];
  for (let d = 0; d < 6 && fr.length; d++) {
    const nx = [];
    for (const c of fr) for (const n of neighborsOf(c)) { if (seen.has(n)) continue; if (n === to) return true; seen.add(n); if (passable(n)) nx.push(n); }
    fr = nx;
  }
  return false;
}
const FLEET_AREA = 700;
const friendlyFleetNear = (p, r) => S.units.find(u => u.o === S.player && domOf(u) === 'sea' && (u.m.ships || 0) + (u.m.carriers || 0) >= 1 && km([u.lon, u.lat], p) <= r) || null;
function airOk(p, range) {
  if (distToC(S.player, p) <= range) return true;
  if (S.units.some(u => u.o === S.player && (u.m.carriers || 0) >= 1 && km([u.lon, u.lat], p) <= range)) return true;
  return alive().some(a => { if (!isAlly(a, S.player)) return false; const t = mainTid(a); return t && km(TERR[t].c, p) < range + 1500 && distToC(a, p) <= range; });
}
// check a move order; returns { dest, days, slow, needWar } or { err }
function planMove(u, p, mode) {
  const ty = UT[u.t]; let dest = [p[0], p[1]], slow = 1, ferry = null, via = null;
  let destTid = tidAt(dest[0], dest[1]), destC = destTid ? (S.owner[destTid] || null) : null;
  if (ty.dom === 'sea') {
    if (destTid || !isSeaAt(dest)) { dest = snapSea(dest); if (!dest) return { err: 'אין ים קרוב לנקודה הזו' }; }
    destC = null;
    const rt = seaRoute([u.lon, u.lat], dest); if (!rt) return { err: 'אין דרך בים לשם — הים הזה סגור' };
    via = rt.slice(0, -1);
  } else if (ty.dom === 'land') {
    if (!destTid) return { err: 'כוחות יבשה לא עוצרים בים — בחר נקודה ביבשה' };
    const from = u.at || S.player;
    if (mode !== 'ret' && !landReach(from, destC || from)) {
      ferry = friendlyFleetNear(dest, FLEET_AREA);
      if (!ferry) return { err: 'אין דרך ביבשה לשם. כדי לחצות ים צריך צי שלך באזור (עד ' + FLEET_AREA + ' ק״מ מהיעד)' };
    } else if (mode === 'ret' && !landReach(from, S.player)) slow = 0.7;
  } else if (!airOk(dest, ty.range)) return { err: 'מחוץ לטווח: עד ' + ty.range.toLocaleString('en-US') + ' ק״מ מבסיס שלך, של בעלת ברית או מנושאת מטוסים' };
  const needWar = destC && destC !== S.player && !isAlly(destC, S.player) && !atWar(destC, S.player) ? destC : null;
  const d = via && via.length ? routeKm([u.lon, u.lat], via, dest) : km([u.lon, u.lat], dest);
  if (ferry) {
    // march to the fleet, board (2 days) and cross at transport speed: slower than a land march of the same distance
    const fp = [ferry.lon, ferry.lat], days = km([u.lon, u.lat], fp) / ty.spd + km(fp, dest) / 150 + 2;
    slow = clamp(d / Math.max(1, days * ty.spd), 0.05, 0.9);
  }
  return { dest, via: via && via.length ? via : null, slow, needWar, km: d, days: Math.max(ty.spd >= 2000 ? 0.5 : 1, Math.ceil(d / (ty.spd * slow))), mode: mode || 'move' };
}
function commitMove(u, r, quiet) {
  if (!S.units.includes(u)) return;
  u.dest = r.dest; u.via = r.via || null; u.slow = r.slow; u.mode = r.mode; u.cty = r.cty || null;
  if (u.o === S.player && !quiet) toast(uName(u) + ' בדרך · ' + (r.days < 1 ? 'מגיעה תוך פחות מיום' : 'עוד ' + daysTxt(r.days).replace(/<[^>]+>/g, '')));
  unitsDirty = true;
}
const etaDays = u => u.dest ? routeKm([u.lon, u.lat], u.via, u.dest) / (UT[u.t].spd * (u.slow || 1)) : 0;
function unitsMove() {
  const arrived = [];
  for (const u of S.units) {
    u.px = u.lon; u.py = u.lat;
    if (!u.dest) { if (u.tid !== undefined) u.at = u.tid ? ptOwner(u.tid, u.lon, u.lat) : null; else placeAt(u); continue; }
    let left = UT[u.t].spd * (u.slow || 1);
    if (u.via && domOf(u) !== 'sea') u.via = null;
    while (left > 0 && u.via && u.via.length) {
      const w = u.via[0], dw = km([u.lon, u.lat], w);
      if (dw <= left) { u.lon = w[0]; u.lat = w[1]; left -= dw; u.via.shift(); }
      else { const q = d3.geoInterpolate([u.lon, u.lat], w)(left / dw); u.lon = q[0]; u.lat = q[1]; left = 0; }
    }
    if (u.via && !u.via.length) u.via = null;
    if (left <= 0) { placeAt(u); continue; }
    const d = km([u.lon, u.lat], u.dest);
    if (d <= left) {
      u.lon = u.dest[0]; u.lat = u.dest[1]; u.dest = null; u.via = null; u.slow = 1; u.mode = null;
      if (u.o === S.player) arrived.push(u);
    } else { const q = d3.geoInterpolate([u.lon, u.lat], u.dest)(left / d); u.lon = q[0]; u.lat = q[1]; }
    placeAt(u);
  }
  if (arrived.length) {
    const where = arrived[0].at ? ' ל' + nm(arrived[0].at) : ' ליעד';
    toast(arrived.length === 1 ? uName(arrived[0]) + ' הגיעה' + where : arrived.length + ' יחידות הגיעו ליעד');
  }
}
function sendHome(u, quiet) {
  const r = planMove(u, u.hb, 'ret');
  if (r.err) { r.dest = u.hb; r.slow = 0.7; r.days = Math.ceil(km([u.lon, u.lat], u.hb) / (UT[u.t].spd * 0.7)); }
  commitMove(u, r, quiet);
}
/* ---- combat helpers ---- */
function forcesIn(owner, cid, foeAdv) {
  let l = 0, s = 0; const list = [];
  for (const u of S.units) { if (u.o !== owner || u.at !== cid || domOf(u) === 'sea') continue; const p = uPow(u, foeAdv); l += p.l; s += p.s; list.push(u); }
  return { l, s, list };
}
function navyNear(owner, cid, r) {
  let n = 0; const list = [];
  for (const u of S.units) { if (u.o !== owner || domOf(u) !== 'sea') continue; if (distToC(cid, [u.lon, u.lat]) <= r) { n += uPow(u, 0).n; list.push(u); } }
  return { n, list };
}
const atkStr = f => f.l > 0 ? f.l + Math.min(f.s, f.l * 2) : 0;
const defStr = f => f.l + Math.min(f.s, f.l * 2 + 5);
/* ---- lopsided fights: the bigger the force ratio, the faster the weaker side breaks ---- */
// 0 up to 2:1, rising on a log scale to 1 at 100:1
const crushF = rho => clamp((Math.log10(Math.max(1, rho)) - 0.301) / 1.699, 0, 1);
// extra share of the weaker force lost each day (3:1 ≈ 3%, 10:1 ≈ 26%, 30:1 ≈ 57%, 100:1 = all of it)
const routLoss = rho => Math.pow(crushF(rho), 1.5);
// share of the weaker side's losses who surrender instead of dying (prisoners)
const surShare = rho => clamp((Math.log10(Math.max(1, rho)) - 0.7) / 1.3, 0, 0.85);
// ground is taken (and cities fall) faster when the defender has almost nothing left
const pushMul = rho => 1 + 3 * Math.pow(crushF(rho), 1.2);
const NORM_L = 0.012 / DPM;
// days until the weaker side of a fight is broken (≈95% of it gone)
function breakDays(rho) {
  if (!(rho > 0)) return Infinity;
  const r = rho / (rho + 1), q = Math.min(1, NORM_L * r + routLoss(rho));
  return q >= 0.999 ? 1 : Math.max(1, Math.ceil(Math.log(0.05) / Math.log(1 - q)));
}
// "330:1" (ours first), and a short forecast in plain Hebrew
function ratioTxt(a, d) {
  if (!(a > 0) && !(d > 0)) return '—';
  const big = Math.max(a, d) / Math.max(0.01, Math.min(a, d)), v = big >= 9.5 ? Math.round(big) : Math.round(big * 10) / 10;
  return a >= d ? v + ':1' : '1:' + v;
}
function forecastTxt(a, d) {
  if (!(a > 0) || !(d > 0)) return a > 0 ? 'אין מולנו כוח — ניצחון מהיר' : d > 0 ? 'אין לנו כוח בשטח' : '';
  const rho = a >= d ? a / d : d / a;
  if (rho < 1.6) return 'כוחות שקולים — קרב ממושך';
  const n = breakDays(rho), t = n > 300 ? 'קרב ארוך' : (a >= d ? 'ניצחון צפוי' : 'תבוסה צפויה') + ' תוך ~' + (n === 1 ? 'יום-יומיים' : n + ' ימים');
  return n > 300 ? (a >= d ? 'יתרון לנו — אבל ' : 'יתרון להם — ') + t : t;
}
// captured soldiers waiting to be counted (thousands, by owner) — the battle that took them moves them into the statistics
let POWQ = {};
// losses come off the units that are actually fighting (and off the inventory with them)
function hurtUnit(u, k, foeAdv, rout, sur) {
  const c = S.c[u.o]; if (!c) return 0;
  let dead = 0; rout = rout || 0;
  for (const key in u.m) {
    const f = key === 'msl' ? k * 0.25 : LAND_K[key] ? k : AIR_K[key] ? k * 0.5 * (1 + 0.5 * (foeAdv || 0)) : k * 0.25;
    // a broken force: ground troops and their gear go fast, aircraft and ships mostly get away
    const rk = rout * (LAND_K[key] ? 1 : AIR_K[key] ? 0.35 : 0.15);
    const lost = (u.m[key] || 0) * clamp(clamp(f, 0, 0.5) + rk, 0, 1);
    u.m[key] -= lost; c.inv[key] = Math.max(0, (c.inv[key] || 0) - lost);
    if (key === 'troops') dead += lost;
  }
  if (sur > 0 && dead > 0) POWQ[u.o] = (POWQ[u.o] || 0) + dead * sur;
  if (u.o === S.player) S.p.cas += dead * (1 - (sur || 0) * 0.7);
  if (dead > 0.0004) markHit(u);
  return dead;
}
// the player's war, fought by the units on the map
function unitBattle(w) {
  const me = S.player, E = enemyLeaderFor(w, me), pA = w.A.includes(me);
  const Ec = S.c[E], M = P(); if (!Ec || !Ec.alive) return;
  const mine = pA ? w.A : w.B, theirs = pA ? w.B : w.A;
  const fp = mySideFront(w, me);
  // allies without units on the map still help, as in the old abstract model
  let allyMe = aidFor(me, E, w) * 0.5, allyEn = aidFor(E, me, w);
  mine.forEach(m => { if (m !== me && S.c[m] && S.c[m].alive && !hasUnits(m)) allyMe += power(S.c[m]) * commit(m, w) * allyProj(m, me, E); });
  theirs.forEach(m => { if (m !== E && S.c[m] && S.c[m].alive && !hasUnits(m)) allyEn += power(S.c[m]) * commit(m, w) * allyProj(m, E, me); });
  allyMe *= 0.6; allyEn *= 0.6;
  // theatre 1: the enemy's land
  const myInE = forcesIn(me, E, Ec.adv), enInE = forcesIn(E, E, M.adv);
  const sea = !adjacent(me, E);
  const myNav = navyNear(me, E, 600), enNav = navyNear(E, E, 600);
  // navy off their coast: fire support and blockade, in proportion to the size of the landing force
  const navShare = myNav.n / (myNav.n + enNav.n + 1), navW = Math.min(1, myNav.n / (0.15 * Math.max(1, myInE.l)));
  let aE = atkStr(myInE);
  if (aE > 0) {
    aE += allyMe;
    aE *= 1 + 0.6 * navShare * navW;
    if (sea && myNav.n <= 0) aE *= 0.5; // cut off across the sea without a fleet
  }
  let dE = hasUnits(E) ? defStr(enInE) : power(Ec) * 0.6;
  dE += allyEn;
  if (sea) dE *= (1 + 0.2 * enNav.n / (myNav.n + enNav.n + 1)) * (1 - 0.25 * clamp((navShare - 0.5) * 2, 0, 1) * navW);
  // theatre 2: our land
  const enInMe = forcesIn(E, me, M.adv), myInMe = forcesIn(me, me, Ec.adv);
  let aP = atkStr(enInMe); if (aP > 0) aP += allyEn * 0.5;
  let dP = defStr(myInMe) + allyMe;
  let lm = 1;
  if (w.stance === 'attack') { aE *= 1.2; lm = 1.5; } else { aE *= 0.85; dP *= 1.15; lm = 0.7; }
  // a skilled defence minister fights better (and a poor one worse)
  const dm = minOf('def'); if (dm) { const k = 1 + (mSk(dm) - 3) * 0.04; aE *= k; dP *= k; }
  dE *= 1.3 + Math.max(0, fp) / 250; dP *= 1.3 + Math.max(0, -fp) / 250;
  aE *= 1 - Math.max(0, -fp) / 200; aP *= 1 - Math.max(0, fp) / 200;
  const rE = aE > 0 ? aE / (aE + dE + 1e-9) : 0, rP = aP > 0 ? aP / (aP + dP + 1e-9) : 0;
  const actE = fp > 0 || aE > 0, actP = fp < 0 || aP > 0;
  // force ratios (stronger : weaker) in each theatre
  const rhoE = aE > 0 ? Math.max(aE, dE) / Math.max(0.5, Math.min(aE, dE)) : 1, rhoP = aP > 0 ? Math.max(aP, dP) / Math.max(0.5, Math.min(aP, dP)) : 1;
  w.ru = { aE: Math.round(aE), dE: Math.round(dE), aP: Math.round(aP), dP: Math.round(dP), rE, rP, xE: aE, yE: dE, xP: aP, yP: dP };
  let shift = 0;
  if (actE || actP) {
    const K = 32 / DPM;
    shift = (actE ? (rE - 0.5) * K * (aE > 0 ? pushMul(rhoE) : 1) : 0) - (actP ? (rP - 0.5) * K * (aP > 0 ? pushMul(rhoP) : 1) : 0) + (R() - 0.5) * 0.55;
    const occ = fp >= 0 ? Ec : M;
    shift *= clamp(Math.sqrt(15 / Math.max(0.5, occ ? occ.pop : 15)), 0.3, 0.75);
    if (shift * fp > 0) shift *= 1 - 0.5 * Math.abs(fp) / 100;
    if (sea) shift *= 0.55;
  }
  let nf = clamp(fp + shift, -100, 100);
  if (fp >= 0 && nf < 0 && !(aP > 0 && rP > 0.5)) nf = 0;
  if (fp <= 0 && nf > 0 && !(aE > 0 && rE > 0.5)) nf = 0;
  // cities held count towards the occupation, by population
  if (S.ct) {
    const hE = heldShare(E, me) * 80, hP = heldShare(me, E) * 80;
    if (hE > 0 && nf < hE && hE >= hP) nf = Math.min(hE, nf + Math.max(0.12, (hE - nf) * 0.05));
    if (hP > 0 && -nf < hP && hP > hE) nf = Math.max(-hP, nf - Math.max(0.12, (hP + nf) * 0.05));
  }
  const f0 = w.f;
  w.f = pA ? nf : -nf; w.last = w.f - f0; w.ms = (w.ms || 0) + (w.f - f0);
  if (Math.sign(f0) !== Math.sign(w.f)) needMapRecolor = true;
  // losses
  const L = NORM_L;
  // the weaker side of a lopsided fight breaks: heavy losses, many surrender, attackers fall back
  const wkE = aE >= dE ? 'd' : 'a', wkP = aP >= dP ? 'd' : 'a';
  const roE = routLoss(rhoE), roP = routLoss(rhoP), suE = surShare(rhoE), suP = surShare(rhoP);
  if (aE > 0) {
    myInE.list.forEach(u => hurtUnit(u, L * (1 - rE) * lm, Ec.adv, wkE === 'a' ? roE : 0, wkE === 'a' ? suE : 0));
    enInE.list.forEach(u => hurtUnit(u, L * rE, M.adv, wkE === 'd' ? roE : 0, wkE === 'd' ? suE : 0));
    myNav.list.forEach(u => hurtUnit(u, L * (1 - rE) * 0.5, 0)); enNav.list.forEach(u => hurtUnit(u, L * rE * 0.5, 0));
  }
  if (aP > 0) {
    enInMe.list.forEach(u => hurtUnit(u, L * (1 - rP), M.adv, wkP === 'a' ? roP : 0, wkP === 'a' ? suP : 0));
    myInMe.list.forEach(u => hurtUnit(u, L * rP * lm, Ec.adv, wkP === 'd' ? roP : 0, wkP === 'd' ? suP : 0));
  }
  // hopeless attacks are called off: the attacker pulls back home (counting our reinforcements already on the way)
  if (aE > 0 && wkE === 'a') {
    const coming = S.units.filter(u => u.o === me && u.dest && u.mode === 'atk' && domOf(u) === 'land' && ownerAt(u.dest[0], u.dest[1]) === E).reduce((s, u) => s + uStr(u), 0);
    if (dE >= (aE + coming * 1.2) * 6) {
      const out = myInE.list.filter(u => domOf(u) === 'land' && !u.dest);
      out.forEach(u => sendHome(u, true));
      if (out.length) { const t = (out.length === 1 ? uName(out[0]) + ' נסוגה' : out.length + ' יחידות נסוגו') + ' מ' + nm(E) + ' — יחס כוחות ' + ratioTxt(aE, dE); toast(t, true); addNews(t + '.', 'bad'); warLog(w, t); }
    }
  }
  if (aP > 0 && wkP === 'a' && dP >= aP * 6) {
    const out = enInMe.list.filter(u => domOf(u) === 'land' && !(u.dest && u.mode === 'ret'));
    out.forEach(u => { sendHome(u, true); u.mode = 'ret'; u.ai = null; });
    if (out.length) { addNews('כוחות ' + nm(E) + ' נשברו ונסוגים מהשטח שלנו (יחס כוחות ' + ratioTxt(dP, aP) + ').', 'good'); warLog(w, 'כוחות האויב נסוגו מהשטח שלנו'); }
  }
  if (aE > 0 || aP > 0) {
    const r = aE > 0 ? rE : 1 - rP;
    mine.forEach(m => { if (m !== me && S.c[m] && !hasUnits(m)) { const k = commit(m, w) * L * (1 - r) * 0.5; hurtInv(S.c[m], k, ['troops', 'tanks', 'afv', 'art']); } });
    theirs.forEach(m => { if (m !== E && S.c[m] && !hasUnits(m)) { const k = commit(m, w) * L * r * 0.5; hurtInv(S.c[m], k, ['troops', 'tanks', 'afv', 'art']); } });
  }
  checkWarEnd(w);
}
// fights in other enemy countries where our units stand (no ground gained, but both sides bleed)
function skirmishes() {
  const lead = new Set(warsOf(S.player).filter(w => w.pause === 0 && (w.a === S.player || w.b === S.player)).map(w => enemyLeaderFor(w, S.player)));
  const M = P();
  new Set(S.units.filter(u => u.o === S.player && u.at && u.at !== S.player && domOf(u) !== 'sea').map(u => u.at)).forEach(x => {
    if (lead.has(x) || !atWar(x, S.player) || !S.c[x]) return;
    const X = S.c[x], a = forcesIn(S.player, x, X.adv), d = hasUnits(x) ? forcesIn(x, x, M.adv) : null;
    const A = atkStr(a); if (!A) return;
    const D = (d ? defStr(d) : power(X) * 0.5) * 1.3, r = A / (A + D + 1e-9), L = 0.012 / DPM;
    const w = S.wars.find(v => (v.A.includes(x) && v.B.includes(S.player)) || (v.B.includes(x) && v.A.includes(S.player)));
    const go = () => {
      a.list.forEach(u => hurtUnit(u, L * (1 - r), X.adv));
      if (d) d.list.forEach(u => hurtUnit(u, L * r, M.adv)); else hurtInv(X, L * r * 0.5, ['troops', 'tanks', 'afv', 'art']);
    };
    if (w) countedBattle(w, go); else go();
  });
}
/* ---- enemy behaviour: defend, gather against invaders, sometimes counter-attack ---- */
function aiUnits() {
  warsOf(S.player).forEach(w => {
    if (!(w.a === S.player || w.b === S.player)) return;
    const E = enemyLeaderFor(w, S.player), Ec = S.c[E]; if (!Ec || !Ec.alive) return;
    const eu = unitsOf(E), fighters = eu.filter(u => domOf(u) !== 'sea');
    if (w.pause > 0) { fighters.forEach(u => { if (u.at !== E && !u.dest) sendHome(u, true); u.ai = null; }); return; }
    // beaten attackers fall back
    fighters.forEach(u => { if (u.ai === 'atk' && u.at === S.player && !u.dest && uStr(u) < (u.s0 || 0) * 0.45) { sendHome(u, true); u.ai = null; addNews('כוחות ' + nm(E) + ' נסוגים מהשטח שלנו.', 'good'); } });
    const intruders = S.units.filter(u => u.o === S.player && domOf(u) === 'land' && u.at === E);
    // first the invaders who took (or besiege) one of their cities
    const atCity = S.ct ? intruders.filter(u => citiesNear([u.lon, u.lat], CR_KM).some(x => landOf(x) === E)) : [];
    if (intruders.length && S.day % 9 === 0) fighters.forEach(u => {
      if (domOf(u) !== 'land' || u.at !== E || u.dest || u.ai === 'atk' || R() > 0.5) return;
      const tg = pick(atCity.length && R() < 0.75 ? atCity : intruders), p = tidAt(tg.lon, tg.lat) && ownerAt(tg.lon, tg.lat) === E ? [tg.lon, tg.lat] : nearIn(E, [tg.lon, tg.lat]);
      if (p && km(p, [u.lon, u.lat]) > 60) { u.dest = p; u.mode = 'move'; u.slow = 1; }
    });
    if (S.day % 7 !== 0 || !adjacent(E, S.player)) return;
    const busy = fighters.filter(u => u.ai === 'atk' && (u.at === S.player || u.dest));
    const home = fighters.filter(u => u.at === E && !u.dest && u.ai !== 'atk');
    const theirs = home.reduce((s, u) => s + uStr(u), 0);
    const myHome = S.units.filter(u => u.o === S.player && u.at === S.player && domOf(u) !== 'sea').reduce((s, u) => s + uStr(u), 0);
    let pr = busy.length ? (w.ru && w.ru.rP < 0.55 && theirs > myHome ? 0.12 : 0) : theirs * 0.45 > myHome ? 0.35 : theirs > myHome * 1.3 ? 0.12 : 0;
    if (Ec.gov === 'authoritarian') pr *= 1.3;
    if (!pr || R() > pr) return;
    let sent = 0; const go = [];
    home.sort((a, b) => uStr(b) - uStr(a)).forEach(u => { if (sent < theirs * (busy.length ? 0.25 : 0.45) && (domOf(u) === 'land' || (domOf(u) === 'air' && go.length))) { go.push(u); sent += uStr(u); } });
    if (!go.length) return;
    // the invasion heads for one of our cities: the nearest one worth taking
    const g0 = go[0], tcity = S.ct ? warCityTarget(S.player, E, [g0.lon, g0.lat]) : null;
    go.forEach(u => { const p = tcity && km([u.lon, u.lat], cityPt(tcity)) < 900 ? cityStand(tcity) : nearIn(S.player, [u.lon, u.lat]); if (!p) return; u.dest = p; u.mode = 'move'; u.slow = 1; u.ai = 'atk'; u.s0 = uStr(u); u.cty = tcity ? tcity.id : null; });
    addNews('כוחות ' + nm(E) + ' חצו את הגבול ופלשו לשטחנו!', 'war'); warLog(w, 'כוחות ' + nm(E) + ' פלשו לשטחנו');
    S.pending.push({ type: 'invaded', wid: w.id, from: E, uid: go[0].id });
  });
}
// enemies at war with us strike our bases and cities from the air and with missiles now and then
function aiStrikes() {
  warsOf(S.player).forEach(w => {
    if (w.pause > 0 || !(w.a === S.player || w.b === S.player)) return;
    const E = enemyLeaderFor(w, S.player), Ec = S.c[E]; if (!Ec || !Ec.alive) return;
    const d = adjacent(E, S.player) ? 0 : dist(E, S.player);
    const mis = Ec.mlv > 0 && Ec.inv.msl >= 10 && d <= MIS_RANGE[Ec.mlv], air = Ec.inv.air >= 8 && (d <= AIR_RANGE || Ec.inv.carriers >= 1);
    if (!mis && !air) return;
    if (R() > 0.012 * (Ec.gov === 'authoritarian' ? 1.4 : 1)) return;
    enemyStrike(E, mis && (!air || R() < 0.55) ? 'mis' : 'air');
  });
}
// a city of ours for the enemy to hit (bigger cities more likely)
function myTargetCity() {
  const l = S.ct ? citiesOfT(S.player).filter(x => cst(x).o === S.player) : []; if (!l.length) return null;
  let t = 0; for (const x of l) t += Math.sqrt(x.pop); let r = R() * t;
  for (const x of l) { r -= Math.sqrt(x.pop); if (r <= 0) return x; }
  return l[0];
}
function enemyStrike(E, kind, ci) {
  const Ec = S.c[E], me = P(); if (!Ec || !Ec.alive || !me) return null;
  const before = invSnap(me), dens = densF(S.player);
  // now and then they aim at a city (more often for harsh regimes)
  const cx = ci && CITYI[ci] ? CITYI[ci] : R() < (Ec.gov === 'authoritarian' ? 0.45 : 0.3) ? myTargetCity() : null, cS = cx ? cst(cx) : null;
  let used, frac, lost = 0, civ, cdInc = 0;
  if (kind === 'air') {
    used = clamp(Math.round(Ec.inv.air * 0.06), 4, 80);
    frac = clamp(used * (Ec.q || 1) / (me.inv.air * 0.5 + me.inv.tanks * 0.03 + 40) * 0.1, 0.003, 0.08) * (1 - 0.15 * me.adv) * (cx ? 0.3 : 1);
    lost = Math.round(used * [0.003, 0.01, 0.025, 0.05][me.adv] * (0.5 + R()) * (cx && cS.a ? 1.6 : 1)); Ec.inv.air = Math.max(0, Ec.inv.air - lost);
    hurtInv(me, frac, ['air', 'heli', 'tanks', 'art', 'msl']); hurtInv(me, frac * 0.4, ['ships', 'afv']); hurtInv(me, frac * 0.15, ['troops']);
    me.gdp *= 1 - frac * 0.04;
    civ = cx ? cityCiv(cx, 'air', used, cS.a) * (0.7 + R() * 0.6) : used * 0.35 * dens * (0.4 + R() * 0.8);
    if (cx) cdInc = cityHit(cx, cityDmgInc('air', used, cS.a));
  } else {
    used = clamp(Math.round(Ec.inv.msl * 0.08), 5, 150); Ec.inv.msl = Math.max(0, Ec.inv.msl - used);
    const hits = used * (1 - [0, 0.25, 0.5, 0.75][me.adv]);
    frac = clamp(hits / (hits + 300) * 0.2, 0.002, 0.05) * (cx ? 0.3 : 1);
    hurtInv(me, frac, ['air', 'art', 'msl', 'ships']); hurtInv(me, frac * 0.5, ['tanks']); hurtInv(me, frac * 0.2, ['troops']);
    me.gdp *= 1 - frac * 0.08;
    civ = cx ? cityCiv(cx, 'mis', hits, cS.a) * (0.7 + R() * 0.6) : hits * 0.8 * dens * (0.4 + R() * 0.8);
    if (cx) cdInc = cityHit(cx, cityDmgInc('mis', hits, cS.a));
  }
  const loss = lossFrom(me, before); civCas(loss, Math.round(civ), 2.5 + R());
  me.pop = Math.max(0.01, me.pop - loss.ck / 1e6);
  S.p.cas += Math.max(0, before.troops - me.inv.troops);
  const own = newCas(); if (kind === 'air') { if (lost) own.eq.air = lost; } else own.mu = used;
  // dead civilians at home shake the public
  const fx = applyFx({ ap: -Math.min(cx ? 8 : 4, 0.5 + Math.sqrt(loss.ck) / (cx ? 10 : 12)) });
  const r = strikeRecord({ k: kind, by: E, at: S.player, cas: loss, own, fx, war: true, used, lost, ci: cx ? cx.id : null, cn: cx ? cityName(cx) : null, cd: cdInc });
  addNews('אזעקה! ' + strikeLine(r) + '.', 'war');
  const lp = launchPt(E, kind, S.player), pt = cx ? cityPt(cx) : targetPt(S.player, lp);
  fxStrike(kind, lp, pt, used, r);
  if (S.units) syncAllUnits();
  return r;
}
// once a day: move, fight, keep units equal to the inventory
function unitsDay() {
  if (!S.units) return;
  unitsMove();
  // after peace our units leave the former enemy's land
  S.units.forEach(u => { if (u.o === S.player && !u.dest && u.at && u.at !== S.player && !atWar(u.at, S.player) && !isAlly(u.at, S.player)) sendHome(u); });
  skirmishes();
  aiUnits();
  aiStrikes();
  syncAllUnits();
}

/* ================= cities: real cities, objectives in war, targets for strikes ================= */
// the fixed list comes from cities.js (or the sample, or a capital generated at the heart of each country);
// what changes during the game lives in S.ct[id]: o = who controls it, d = damage %, s = siege progress, b = besieger,
// f = fortifications (0–3), a = air defence, lg = economy lost while occupied, al = day of the last siege alert
let CITY = [], CITYI = {}, CBY = null, DMGS = {};
const CGRID = new Map(), CR_KM = 45;
const cgk = (x, y) => x + ',' + y;
function addCity(x) {
  x.i = CITY.length; CITY.push(x); CITYI[x.id] = x;
  const k = cgk(Math.floor(x.lon), Math.floor(x.lat)); let a = CGRID.get(k); if (!a) CGRID.set(k, a = []); a.push(x);
  if (MAP_PROJ) { const p = MAP_PROJ([x.lon, x.lat]); x.mx = p ? p[0] : NaN; x.my = p ? p[1] : NaN; }
  if (FLATP) { const p = FLATP([x.lon, x.lat]); x.fx = p ? p[0] : NaN; x.fy = p ? p[1] : NaN; }
}
function initCities() {
  CITY = []; CITYI = {}; CGRID.clear(); CBY = null;
  (Array.isArray(window.CITIES) ? window.CITIES : []).forEach(d => {
    if (!d || d.id == null || !isFinite(+d.lat) || !isFinite(+d.lon)) return;
    const id = String(d.id); if (CITYI[id]) return;
    const c = d.c != null ? String(d.c) : '';
    const tid = TERR[c] && !HIDDEN.has(c) ? c : tidAt(+d.lon, +d.lat);
    if (!tid || !TERR[tid] || HIDDEN.has(tid)) return;
    addCity({ id, c: c || tid, he: String(d.he || d.en || id), en: String(d.en || ''), lat: +d.lat, lon: +d.lon, pop: clamp(+d.pop || 0.05, 0.01, 60), cap: d.cap ? 1 : 0, port: d.port ? 1 : 0, tid });
  });
}
// a place inside the country as close as possible to its centre (always the same point)
function genCapPt(t) {
  const T = TERR[t], c = T.c;
  if (tidAt(c[0], c[1]) === t) return c;
  const [[x0, y0], [x1, y1]] = d3.geoBounds(T.best), X1 = x1 < x0 ? x1 + 360 : x1;
  let best = c, bd = 1e9;
  for (let i = 1; i < 9; i++) for (let j = 1; j < 9; j++) {
    let lon = x0 + (X1 - x0) * i / 9; if (lon > 180) lon -= 360; const lat = y0 + (y1 - y0) * j / 9;
    if (tidAt(lon, lat) !== t) continue; const d = km([lon, lat], c); if (d < bd) { bd = d; best = [lon, lat]; }
  }
  return best;
}
// city state for this game: fresh games and old saves get it from the data
function ensureCityState() {
  if (!S) return;
  const has = new Set(); CITY.forEach(x => { if (x.cap) has.add(x.c); });
  Object.keys(S.c).sort().forEach(id => {
    if (has.has(id) || CITYI['g-' + id] || !TERR[id] || !TERR[id].best || UNPLAYABLE.has(id) || HIDDEN.has(id)) return;
    const p = genCapPt(id);
    addCity({ id: 'g-' + id, c: id, he: '', en: '', lat: p[1], lon: p[0], pop: clamp(S.c[id].pop * 0.12, 0.03, 8), cap: 1, port: 0, tid: id, gen: 1 });
  });
  const fresh = !S.ct || typeof S.ct !== 'object';
  if (fresh) S.ct = {};
  for (const k in S.ct) if (!CITYI[k]) delete S.ct[k];
  CITY.forEach(x => { if (!S.ct[x.id] || typeof S.ct[x.id] !== 'object') S.ct[x.id] = { o: landOf(x) || null }; });
  CBY = null;
  // wars already running when the game starts (or before cities existed): the occupier holds the nearest cities
  if (fresh) S.wars.forEach(w => aiCityFlip(w, true));
  reconcileCities(); citiesDirty = true;
}
const cst = x => S.ct[x.id] || (S.ct[x.id] = { o: landOf(x) || null });
const cityPt = x => [x.lon, x.lat];
// where land units stand at a city: the city itself, or the nearest land of its country (coastal cities sit on the shore)
function cityStand(x) {
  if (x.sp) return x.sp;
  let p = cityPt(x);
  if (tidAt(p[0], p[1]) !== x.tid) {
    const c = TERR[x.tid].c, it = d3.geoInterpolate(p, c), d = km(p, c);
    for (let i = 1; i <= 30; i++) { const q = it(Math.min(1, i * 4 / Math.max(4, d))); if (tidAt(q[0], q[1]) === x.tid) { p = q; break; } }
  }
  return (x.sp = p);
}
const cityName = x => x.he || ('בירת ' + nm(x.c));
function citiesNear(p, r) {
  const out = [], dy = Math.ceil(r / 111), dx = Math.min(8, Math.ceil(r / (111 * Math.max(0.15, Math.cos(p[1] * Math.PI / 180)))));
  const gx = Math.floor(p[0]), gy = Math.floor(p[1]);
  for (let y = gy - dy; y <= gy + dy; y++) for (let x = gx - dx; x <= gx + dx; x++) {
    const a = CGRID.get(cgk(((x + 180) % 360 + 360) % 360 - 180, y)); if (!a) continue;
    for (const c of a) if (Math.abs(c.lat - p[1]) * 111 <= r && km(p, [c.lon, c.lat]) <= r) out.push(c);
  }
  return out;
}
// cities on a country's land (whoever controls them now)
function citiesOfT(cid) {
  if (!CBY) { CBY = {}; for (const x of CITY) { const o = landOf(x); if (o) (CBY[o] || (CBY[o] = [])).push(x); } }
  return CBY[cid] || [];
}
function capOf(cid) { const l = citiesOfT(cid); return l.find(x => x.cap && x.c === cid) || l.find(x => x.cap) || l.reduce((a, b) => !a || b.pop > a.pop ? b : a, null); }
const sideOf = (a, b) => a === b || (isAlly(a, b) && !atWar(a, b));
// share of a country's city population held by the other side
function heldShare(terr, side) {
  let t = 0, h = 0;
  for (const x of citiesOfT(terr)) { t += x.pop; const o = cst(x).o; if (o && o !== terr && sideOf(o, side)) h += x.pop; }
  return t ? h / t : 0;
}
const capHeldBy = (cid, side) => { const c = capOf(cid); if (!c) return false; const o = cst(c).o; return !!o && o !== cid && sideOf(o, side); };
// the city's own defenders, besides the units standing in it (in unit strength points)
function garrison(x, st) {
  const C = S.c[st.o]; if (!C) return 0;
  return (1.5 + x.pop * 2.5) * (1 + 0.6 * (st.f || 0)) * (st.o === landOf(x) ? 1 : 0.5) * (C.q || 1) * (x.cap ? 1.3 : 1);
}
const siegeDays = (x, st) => clamp(5 + 3 * Math.sqrt(x.pop) + 4 * (st.f || 0), 5, 40) * (x.cap ? 1.3 : 1);
// siege progress a day (%): a tiny garrison against a huge army falls within a day or two
const siegeRate = (x, st, aS, dS) => { const rho = aS / Math.max(0.1, dS); return 100 / siegeDays(x, st) * clamp(rho / 1.5, 1, 2) * (1 + 15 * Math.pow(crushF(rho), 1.5)); };
// attackers and defenders at a city right now (the same count the siege uses)
function siegeForces(x) {
  const st = cst(x), C = st.o, Cc = S.c[C], D = { l: 0, s: 0 }, A = { l: 0, s: 0 }; if (!Cc || !S.units) return { aS: 0, dS: 0 };
  for (const u of S.units) {
    const dom = domOf(u); if (dom === 'sea' || u.dest || km([u.lon, u.lat], cityPt(x)) > (dom === 'air' ? 120 : CR_KM)) continue;
    const land = dom === 'land';
    if (u.o === C || (isAlly(u.o, C) && !atWar(u.o, C))) { if (land) { const p = uPow(u, 0); D.l += p.l; D.s += p.s; } }
    else if (atWar(u.o, C)) { const p = uPow(u, Cc.adv); if (land) A.l += p.l; A.s += p.s; }
  }
  return { aS: atkStr(A), dS: defStr(D) + garrison(x, st) };
}
const dmgDrag = id => DMGS[id] && S.c[id] ? Math.min(0.05, DMGS[id] / Math.max(0.05, S.c[id].pop) * 0.3) : 0;
// once a day: damaged cities slowly rebuild, armies standing at cities besiege them
function cityDay() {
  if (!S.ct) return;
  const dm = {};
  for (const x of CITY) {
    const st = S.ct[x.id]; if (!st || !st.d) continue;
    const d0 = st.d; st.d = d0 > 0.5 ? d0 * 0.997 - 0.02 : 0;
    if (st.d <= 0) { delete st.d; continue; }
    if (d0 >= 15 && st.d < 15) citiesDirty = true;
    const o = landOf(x); if (o) dm[o] = (dm[o] || 0) + x.pop * st.d / 100;
  }
  DMGS = dm;
  if (!S.units) return;
  const touch = new Map();
  for (const u of S.units) {
    const dom = domOf(u); if (dom === 'sea' || u.dest) continue;
    for (const x of citiesNear([u.lon, u.lat], dom === 'air' ? 120 : CR_KM)) { let a = touch.get(x); if (!a) touch.set(x, a = []); a.push(u); }
  }
  for (const x of CITY) { const st = S.ct[x.id]; if (st && st.s > 0 && !touch.has(x)) { st.s = Math.max(0, st.s - 20); if (!st.s) { delete st.s; delete st.b; citiesDirty = true; } } }
  touch.forEach((us, x) => siegeStep(x, us));
}
// land units at a city: with enough superiority (×1.5 over defenders and garrison) the siege advances; at 100% the city falls
function siegeStep(x, us) {
  const st = cst(x), C = st.o; if (!C || !S.c[C] || !S.c[C].alive) return;
  const Cc = S.c[C], D = { l: 0, s: 0 }, A = { l: 0, s: 0 }, by = {};
  for (const u of us) {
    const land = domOf(u) === 'land';
    if (u.o === C || (isAlly(u.o, C) && !atWar(u.o, C))) { if (land) { const p = uPow(u, 0); D.l += p.l; D.s += p.s; } }
    else if (atWar(u.o, C)) { const p = uPow(u, Cc.adv); if (land) { A.l += p.l; by[u.o] = (by[u.o] || 0) + p.l; } A.s += p.s; }
  }
  const aS = atkStr(A), dS = defStr(D) + garrison(x, st), was = st.s || 0;
  if (aS <= 0) { if (was) { st.s = Math.max(0, was - 15); if (!st.s) { delete st.s; delete st.b; } citiesDirty = true; } return; }
  const b = Object.keys(by).sort((p, q) => by[q] - by[p])[0];
  if (aS >= dS * 1.5) {
    st.s = was + siegeRate(x, st, aS, dS); st.b = b; st.ra = Math.round(aS / Math.max(0.1, dS) * 10) / 10;
    if (!was) { citiesDirty = true; siegeStarted(x, st, b); }
    if (st.s >= 100) captureCity(x, b);
  } else if (was) { st.s = Math.max(0, was - 2); st.b = b; if (!st.s) { delete st.s; delete st.b; citiesDirty = true; } }
}
const cityPopT = x => x.pop >= 1 ? '⁦' + (x.pop >= 10 ? Math.round(x.pop) : x.pop.toFixed(1)) + '⁩ מיליון' : '⁦' + Math.round(x.pop * 1000) + '⁩ אלף';
function siegeStarted(x, st, b) {
  const me = S.player; if (!me) return;
  if (st.o === me) {
    addNews(cityName(x) + ' במצור! כוחות ' + nm(b) + ' מקיפים את העיר.', 'war');
    if ((x.cap || x.pop >= 0.25 || citiesOfT(me).length <= 4) && S.day - (st.al == null ? -999 : st.al) > 45 && S.day - (S.p.sal == null ? -999 : S.p.sal) > 7) { st.al = S.day; S.p.sal = S.day; S.pending.push({ type: 'siege', ci: x.id, from: b }); }
  } else if (b === me) {
    addNews('כוחותינו פתחו במצור על ' + cityName(x) + ' (' + nm(st.o) + ').', 'war');
    const sf = siegeForces(x), n = Math.max(1, Math.ceil(100 / Math.max(0.1, siegeRate(x, st, sf.aS, sf.dS))));
    toast('מצור על ' + cityName(x) + ' · יחס ⁦' + ratioTxt(sf.aS, sf.dS) + '⁩ · כיבוש בעוד ' + (n === 1 ? 'כיום אחד' : 'כ-⁦' + n + '⁩ ימים'));
  }
}
// a city changes hands; quiet = a war between other countries (only the map changes)
function captureCity(x, by, quiet) {
  const st = cst(x), from = st.o, terr = landOf(x) || null, me = S.player, T = S.c[terr];
  if (terr && by && by !== terr && sideOf(by, terr)) by = terr; // a friend frees our city: it is ours again
  if (!by || by === from) return;
  st.o = by; delete st.s; delete st.b; st.d = Math.min(100, (st.d || 0) + (quiet ? 2 : 6)); citiesDirty = true;
  if (quiet) return;
  const share = T ? clamp(x.pop / Math.max(0.05, T.pop), 0, 0.6) : 0, nmC = cityName(x);
  // the land's own country loses the city's economy while it is occupied (most of it comes back on liberation)
  if (T) { if (by === terr) { if (st.lg) { T.gdp += st.lg * 0.7; delete st.lg; } } else if (from === terr) { const lost = T.gdp * share * 0.5; T.gdp -= lost; st.lg = lost; } }
  const L = S.c[from];
  if (L && from !== me) L.approval = clamp(L.approval - (x.cap ? 12 : 1 + share * 20), 5, 95);
  const w = S.wars.find(v => (v.A.includes(by) && v.B.includes(from)) || (v.B.includes(by) && v.A.includes(from)));
  // the capital falling shakes the whole war
  if (w && x.cap && from === terr) { w.f = clamp(w.f + (w.A.includes(by) ? 12 : -12), -100, 100); needMapRecolor = true; }
  if (w) warLog(w, (by === me ? (terr === me ? 'שחררנו את ' : 'כבשנו את ') : from === me ? 'איבדנו את ' : nm(by) + ' כבשה את ') + nmC);
  if (me && from === me) {
    const d = Math.min(14, 1.5 + share * 30) + (x.cap ? 8 : 0); S.p.shock -= d;
    toast('העיר ' + nmC + ' נפלה לידי ' + nm(by) + ' · העם ' + sgnT(-d), true);
    addNews('מכה קשה: ' + nmC + (x.cap ? ', עיר הבירה,' : '') + ' נכבשה בידי ' + nm(by) + '.', 'bad');
    if (x.cap) S.pending.push({ type: 'caplost', ci: x.id, from: by });
  } else if (me && by === me) {
    const d = Math.min(5, 0.5 + share * 12) + (x.cap ? 4 : 0); S.p.shock += d;
    toast((terr === me ? 'שחררנו את ' : 'כבשנו את ') + nmC + ' · העם ' + sgnT(d));
    addNews((terr === me ? 'שוחררה: ' : 'ניצחון: כוחותינו כבשו את ') + nmC + (x.cap && terr !== me ? ' — עיר הבירה של ' + nm(terr) + '!' : '.'), 'good');
  } else if (me && terr === me) addNews(nmC + ' עברה לשליטת ' + nm(by) + '.', 'bad');
  if (w) checkWarEnd(w);
}
// a captured city goes back to the country whose land it is once the two are no longer at war
function reconcileCities() {
  if (!S || !S.ct) return;
  for (const x of CITY) {
    const st = cst(x), terr = landOf(x) || null, o = st.o;
    if (o !== terr && (!o || !S.c[o] || !S.c[o].alive || !terr || !atWar(o, terr))) {
      if (st.lg && terr && S.c[terr]) S.c[terr].gdp += st.lg * 0.7;
      delete st.lg; st.o = terr; delete st.s; delete st.b; citiesDirty = true;
    }
    if (st.b && (!S.c[st.b] || !S.c[st.b].alive || !st.o || !atWar(st.b, st.o))) { delete st.b; delete st.s; citiesDirty = true; }
  }
}
// wars fought without units on the map: the occupier holds cities in proportion to the occupation, nearest to its border first
function aiCityFlip(w, init) {
  if (!init && S.player && S.units && (w.a === S.player || w.b === S.player)) return;
  [[w.a, w.b, w.f, w.A], [w.b, w.a, -w.f, w.B]].forEach(([att, def, f, side]) => {
    const list = citiesOfT(def); if (!list.length || !S.c[att] || !S.c[att].alive) return;
    let tot = 0, held = 0;
    for (const x of list) { tot += x.pop; const o = cst(x).o; if (o !== def && side.includes(o)) held += x.pop; }
    const want = Math.max(0, f) / 100 * tot * 0.85;
    if (held < want - 1e-6) {
      const cand = list.filter(x => cst(x).o === def && (!x.cap || f > 80)).map(x => [x, distToC(att, cityPt(x))]).sort((a, b) => a[1] - b[1]);
      for (const [x] of cand) { if (held >= want) break; if (held + x.pop > want + tot * 0.06) continue; captureCity(x, att, true); held += x.pop; }
    } else if (held > want + tot * 0.1) {
      const back = list.filter(x => { const o = cst(x).o; return o !== def && side.includes(o); }).map(x => [x, distToC(att, cityPt(x))]).sort((a, b) => b[1] - a[1]);
      for (const [x] of back) { if (held <= want + tot * 0.03) break; captureCity(x, def, true); held -= x.pop; }
    }
  });
}
// the city most worth taking in an enemy country: big, important and close
function warCityTarget(E, me, from) {
  let best = null, bs = 1e18;
  for (const x of citiesOfT(E)) {
    const o = cst(x).o; if (!o || sideOf(o, me)) continue;
    const d = from ? km(from, cityPt(x)) : 0, s = (d + 30) / (Math.pow(x.pop, 0.35) * (x.cap ? 1.6 : 1));
    if (s < bs) { bs = s; best = x; }
  }
  return best;
}
// a strike on a city: civilians killed per plane / per missile that gets through (grows with the city's size)
function cityCiv(x, kind, n, ad) { return n * (kind === 'air' ? 8 + 14 * Math.sqrt(x.pop) : 10 + 16 * Math.sqrt(x.pop)) * (ad ? 0.5 : 1); }
function cityDmgInc(kind, n, ad) { return clamp(kind === 'air' ? n * 0.5 : n * 0.35, 2, kind === 'air' ? 30 : 35) * (ad ? 0.6 : 1); }
// damage to a city: its share of the economy suffers
function cityHit(x, inc) {
  const st = cst(x), T = S.c[landOf(x)]; const d0 = st.d || 0;
  st.d = Math.min(100, d0 + inc); citiesDirty = true;
  if (T) T.gdp *= 1 - clamp(x.pop / Math.max(0.05, T.pop), 0, 0.6) * (st.d - d0) / 100 * 0.5;
  return st.d - d0;
}
const nearOwnPort = (o, p, r) => citiesNear(p, r).some(x => x.port && S.ct && cst(x).o === o);
// a nuclear strike hits the capital (or the biggest city when the capital is small)
function nukeTargetCity(tgt) {
  const l = citiesOfT(tgt).filter(x => cst(x).o === tgt); if (!l.length) return null;
  const big = l.reduce((a, b) => b.pop > a.pop ? b : a), cap = l.find(x => x.cap && x.c === tgt);
  return cap && cap.pop >= big.pop * 0.4 ? cap : big;
}
// people killed by a nuclear blast on a city: a large share of a small city, a smaller share (but more people) of a giant one
function nukeCityDead(T, x) { const P = x.pop; return Math.round(Math.min(T.pop * 0.3, P * clamp(0.22 / (1 + P / 8), 0.06, 0.25) * (0.8 + R() * 0.4), 2.6) * 1e6); }

/* ================= desktop: mouse and keyboard (wide screens only; the phone layout is unchanged) ================= */
const isDesk = () => innerWidth >= 1024;
const PW = 420;
function hideTip() { const t = $('#tip'); if (t) t.classList.remove('on'); }
function relWordD(o) { const r = rel(S.player, o); return r >= 50 ? 'ידידותי' : r >= 15 ? 'חיובי' : r > -15 ? 'ניטרלי' : r > -50 ? 'מתוח' : 'עוין'; }
function tipHtml(el) {
  if (!S || !S.c) return '';
  const uk = el.closest('[data-k]');
  if (uk) {
    const k = uk.getAttribute('data-k'), ids = k[0] === 'c' ? k.slice(1).split(',').map(Number) : [+k];
    const us = ids.map(unitById).filter(Boolean); if (!us.length) return '';
    if (us.length > 1) return '<b>' + num(us.length) + ' יחידות</b><div class="tm">' + esc(nm(us[0].o)) + '</div><div class="th">קליק לפרטים</div>';
    const u = us[0];
    return '<b>' + esc(uName(u)) + '</b><div class="tm">' + esc(nm(u.o)) + ' · כוח: ' + esc(uLabel(u)) + '</div><div class="tm">' + esc(uStateTxt(u)) + '</div>' +
      (u.o === S.player ? '<div class="th">קליק לבחירה · אחר כך קליק ימני על היעד</div>' : '');
  }
  const ci = el.closest('[data-ci]');
  if (ci && CITYI[ci.getAttribute('data-ci')]) {
    const x = CITYI[ci.getAttribute('data-ci')], o = S.ct ? cst(x).o : landOf(x);
    return '<b>' + esc(cityName(x)) + '</b><div class="tm">אוכלוסייה: ' + popTxt(x.pop) + '</div><div class="tm">בשליטת: ' + esc(o ? nm(o) : '—') + '</div>';
  }
  const t = el.getAttribute && el.getAttribute('data-t'), o = t && S.owner[t];
  if (!o || !S.c[o]) return '';
  if (!S.player) return '<b>' + esc(nm(o)) + '</b><div class="th">קליק כדי לבחור</div>';
  if (o === S.player) return '<b>' + esc(nm(o)) + '</b><div class="tm">המדינה שלך</div>';
  return '<b>' + esc(nm(o)) + '</b><div class="tm">יחסים: ' + relWordD(o) + ' (' + num(Math.round(rel(S.player, o))) + ')</div>' + (atWar(S.player, o) ? '<div class="tm" style="color:#ff9d9d">במלחמה איתך</div>' : '');
}
function deskMapHooks() {
  document.body.classList.toggle('desk', isDesk());
  svg.on('mousemove.desk', ev => {
    if (!isDesk() || zooming) { hideTip(); return; }
    const h = tipHtml(ev.target), tip = $('#tip'); if (!h) { hideTip(); return; }
    tip.innerHTML = h; tip.classList.add('on');
    const w = tip.offsetWidth, hh = tip.offsetHeight;
    let x = ev.clientX + 16, y = ev.clientY + 18;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 12;
    if (y + hh > innerHeight - 8) y = ev.clientY - hh - 12;
    tip.style.transform = 'translate(' + Math.max(4, x) + 'px,' + Math.max(4, y) + 'px)';
  }).on('mouseleave.desk', hideTip);
  // right-click with one of my units selected = move / attack there (same logic as tapping the map in move mode)
  svg.on('contextmenu.desk', ev => {
    if (!isDesk()) return;
    ev.preventDefault(); hideTip();
    if (!S || !S.player) return;
    if (!uMode) { const u = selUnit != null && unitById(selUnit); if (!u || u.o !== S.player) return; setMode('move', u.id); }
    const uk = ev.target.closest && ev.target.closest('[data-k]'), ci = ev.target.closest && ev.target.closest('[data-ci]');
    if (uk) { onUnitTap(uk.getAttribute('data-k')); return; }
    if (ci && CITYI[ci.getAttribute('data-ci')]) { cityModeTap(CITYI[ci.getAttribute('data-ci')]); return; }
    const ll = evLonLat(ev); if (!ll) return;
    modeTap(ll, ev.target.getAttribute && ev.target.getAttribute('data-t'));
  });
}
function zoomBy(f) { if (GP) { globeTo(gC, curK * f, 250, true); return; } if (svg) svg.transition().duration(250).call(zoom.scaleBy, f); }
function showKeys() {
  const r = (k, t) => '<tr><td>' + k + '</td><td>' + t + '</td></tr>';
  modal({ title: 'קיצורי מקלדת ועכבר', html: '<table class="keys">' +
    r('<kbd>רווח</kbd>', 'עצור / המשך') + r('<kbd>1</kbd>–<kbd>6</kbd>', 'מהירות ×1 / ×2 / ×4 / ×8 / ×16 / ×32') +
    r('<kbd>Esc</kbd>', 'ביטול בחירת יעד / סגירת חלון') + r('<kbd>+</kbd> <kbd>-</kbd>', 'זום') +
    r('<kbd>Home</kbd>', 'מרכז על המדינה שלי') + r('<kbd>?</kbd>', 'הרשימה הזו') +
    r('<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / חיצים', 'הזזת המפה (עם <kbd>Shift</kbd> — מהר)') + r('<kbd>Q</kbd> <kbd>E</kbd>', 'זום החוצה / פנימה') +
    r('<kbd>P</kbd>', 'עצור / המשך') + r('<kbd>U</kbd> / <kbd>Tab</kbd>', 'היחידה הבאה שלי (קודם הפנויות; <kbd>Shift</kbd> — הקודמת)') +
    r('<kbd>V</kbd>', 'הזז את היחידה שנבחרה (ואז קליק על היעד)') + r('<kbd>F</kbd>', 'מרכז על היחידה שנבחרה') + r('<kbd>X</kbd>', 'ביטול בחירה וסגירת הלוח') +
    r('<kbd>C</kbd> <kbd>B</kbd> <kbd>H</kbd> <kbd>G</kbd> <kbd>M</kbd> <kbd>R</kbd> <kbd>N</kbd>', 'לשוניות: מדינה, כלכלה, בית, ממשלה, צבא, מלחמות, חדשות') +
    r('<kbd>T</kbd> <kbd>I</kbd> <kbd>L</kbd> <kbd>Y</kbd>', 'העולם, מה דחוף, רשימת יחידות, סטטיסטיקות') +
    r('דאבל־קליק', 'זום פנימה') +
    r('גלגלת', 'זום סביב העכבר') + r('ריחוף', 'פרטים על מדינה, עיר או יחידה') +
    r('קליק ימני', 'כשיחידה שלך נבחרה — הזזה או תקיפה לשם') + '</table>', buttons: [{ label: 'סגור' }] });
}
// letter keys by physical key (ev.code), so they work with a Hebrew keyboard layout too
const KEY_TABS = { KeyC: 'country', KeyB: 'eco', KeyH: 'home', KeyG: 'gov', KeyM: 'mil', KeyR: 'wars', KeyN: 'news', KeyT: 'world', KeyI: 'urgent', KeyL: 'ulist', KeyY: 'stats' };
const PAN = { KeyW: [0, 1], ArrowUp: [0, 1], KeyS: [0, -1], ArrowDown: [0, -1], KeyA: [1, 0], ArrowLeft: [1, 0], KeyD: [-1, 0], ArrowRight: [-1, 0] };
// smooth keyboard panning: held keys move the map every frame, with a short ease-in
const panKeys = new Set(); let panRaf = 0, panT = 0, panFast = false, panV = 0;
function panStep(t) {
  if (!panKeys.size || !svg) { panRaf = 0; panV = 0; if (svg) { if (GP) gEnd(); else { zooming = false; drawCities(); } } return; }
  const dt = panT ? Math.min(0.05, (t - panT) / 1000) : 1 / 60; panT = t;
  panV = Math.min(1, panV + dt * 6);   // reaches full speed in ~0.17s
  let dx = 0, dy = 0; panKeys.forEach(c => { dx += PAN[c][0]; dy += PAN[c][1]; });
  const n = Math.hypot(dx, dy) || 1, sp = (panFast ? 1500 : 650) * panV * dt / curK;
  if (GP) { const f = sp * DEG / GR; gStop(); zooming = true; hideTip(); gC = [gC[0] - dx / n * f / Math.max(0.35, Math.cos(gC[1] / DEG)), clamp(gC[1] + dy / n * f, -85, 85)]; gReq(); }
  else svg.call(zoom.translateBy, dx / n * sp, dy / n * sp);
  panRaf = requestAnimationFrame(panStep);
}
document.addEventListener('keyup', ev => { panKeys.delete(ev.code); panFast = ev.shiftKey; });
window.addEventListener('blur', () => panKeys.clear());
function myUnits() { return (S.units || []).filter(u => u.o === S.player); }
function deskKey(ev) {
  const c = ev.code;
  if (PAN[c]) { ev.preventDefault(); panKeys.add(c); panFast = ev.shiftKey; if (!panRaf) { panT = 0; panRaf = requestAnimationFrame(panStep); } return true; }
  if (c === 'KeyE') { zoomBy(1.5); return true; }
  if (c === 'KeyQ') { zoomBy(1 / 1.5); return true; }
  if (c === 'KeyP') { setSpeed(S.speed ? 0 : (S.lastSpeed || 1)); return true; }
  if (KEY_TABS[c]) { openTabFresh(KEY_TABS[c]); return true; }
  if (c === 'KeyU' || c === 'Tab') {   // next / previous of my units (idle ones first)
    ev.preventDefault();
    const all = myUnits(); if (!all.length) return true;
    const idle = all.filter(u => !u.dest), list = idle.length ? idle : all;
    let i = list.findIndex(u => u.id === selUnit); i = (i + (ev.shiftKey ? -1 : 1) + list.length) % list.length;
    selectUnit(list[i].id, true); return true;
  }
  if (c === 'KeyF') { const u = selUnit != null && unitById(selUnit); if (u) focusUnit(u, true); return true; }
  if (c === 'KeyV' && selUnit != null) { const u = unitById(selUnit); if (u && u.o === S.player) { setMode('move', u.id); return true; } }
  if (c === 'KeyX') { if (uMode) ACT.mvcancel(); selUnit = null; selected = null; openTab(null); recolor(); unitsDirty = true; drawUnits(); return true; }
  return false;
}
document.addEventListener('keydown', ev => {
  const tg = ev.target, tn = tg && tg.tagName;
  if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || (tg && tg.isContentEditable) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const k = ev.key, mOpen = $('#modal').classList.contains('open');
  if (k === 'Escape') {
    if (mOpen) { const b = [...document.querySelectorAll('#m-foot button')].find(b => /^(סגור|ביטול)$/.test(b.textContent.trim())); if (b) b.click(); }
    else if (uMode) ACT.mvcancel();
    else if ($('#sheet').classList.contains('open')) openTab(null);
    hideTip(); return;
  }
  if (k === '?') { if (!mOpen) showKeys(); ev.preventDefault(); return; }
  if (mOpen || !S || !S.player) return;
  if (k === ' ') { ev.preventDefault(); setSpeed(S.speed ? 0 : (S.lastSpeed || 1)); }
  else if (k >= '1' && k <= '6') setSpeed([1, 2, 4, 8, 16, 32][+k - 1]);
  else if (k === '+' || k === '=') zoomBy(1.5);
  else if (k === '-' || k === '_') zoomBy(1 / 1.5);
  else if (k === 'Home') { ev.preventDefault(); ACT.centerme(); }
  else if (!deskKey(ev)) return;
  if (tn === 'BUTTON') tg.blur();
});

/* ================= map ================= */
let svg, gRoot, gLand, gMarks, zoom, pathGen, curK = 1, W = 0, H = 0, selected = null;
const pathByTid = {};
function initMap() {
  const box = $('#map');
  W = box.clientWidth || 360; H = box.clientHeight || 500;
  svg = d3.select('#map').append('svg').attr('id', 'mapsvg').attr('viewBox', [0, 0, W, H].join(' ')).attr('preserveAspectRatio', 'xMidYMid meet');
  gRoot = svg.append('g');
  let projection = d3.geoNaturalEarth1();
  const visible = { type: 'FeatureCollection', features: FEATS.filter(f => !HIDDEN.has(f.properties.tid)) };
  const DK = isDesk(), topPad = DK ? 72 : 98, botPad = DK ? 14 : 72;
  projection.fitExtent([[6, topPad], [W - 6, H - botPad]], visible);
  FLATP = projection;
  // the 3D globe (default) - if anything goes wrong on this device, the flat map still works
  GP = null; GF = [];
  if (GLOBE) { try { projection = globeProj(projection.scale()); } catch (e) { GLOBE = false; GP = null; projection = d3.geoNaturalEarth1().fitExtent([[6, topPad], [W - 6, H - botPad]], visible); } }
  $('#map').classList.toggle('globe', !!GP); gStars(); document.querySelectorAll('.gtg').forEach(b => { b.textContent = GP ? '🗺️' : '🌍'; });
  pathGen = d3.geoPath(projection); if (pathGen.digits) pathGen.digits(1);
  if (GP) globeBack();
  else gRoot.append('path').datum({ type: 'Sphere' }).attr('class', 'sphere').attr('d', pathGen);
  gGrat = gRoot.append('path').datum(d3.geoGraticule10()).attr('class', 'grat').attr('d', GP ? null : pathGen).node();
  gLand = gRoot.append('g').attr('class', 'land');
  visible.features.forEach(f => {
    const t = f.properties.tid;
    const el = gLand.append('path').attr('d', GP ? null : pathGen(f)).attr('data-t', t).node();
    (pathByTid[t] = pathByTid[t] || []).push(el);
    if (GP) GF.push(gFeat(f, el));
  });
  gCeded = gRoot.append('g').attr('class', 'ceded').node(); drawCeded.k = null;
  d3.select(gCeded).on('click', ev => {
    if (uMode) return; const el = ev.target.closest && ev.target.closest('[data-cw]'); if (!el) return;
    ev.stopPropagation();
    const o = el.getAttribute('data-cw'), x = CITYI[el.getAttribute('data-ci')], from = x && S.owner[x.tid];
    if (!S.player) { if (o) startPick(o); return; }
    const t = mainTid(o); if (!t) return;
    try { keepSelVisible.p = evLonLat(ev); keepSelVisible.t = t; } catch (e) { keepSelVisible.p = null; }
    toast('שטח שנמסר ל' + nm(o) + ' בהסכם שלום' + (from && S.c[from] ? ' (לשעבר של ' + nm(from) + ')' : ''));
    onMapTap(t);
  });
  gScorch = gRoot.append('g').attr('class', 'scorch'); scorchDirty = true;
  decoInit();
  gMarks = gRoot.append('g').attr('class', 'marks');
  // cities: their own screen-space layer under the units (taps: units first, then cities, then the country)
  gCities = svg.append('g').attr('class', 'cities').node(); cityT0 = null; citiesDirty = true; CEL.clear();
  // units: their own layer on top, not scaled with the map, so icons keep the same size on screen
  gUnits = svg.append('g').attr('class', 'units');
  gRoutes = gUnits.append('g').attr('class', 'routes').node();
  gIcons = gUnits.append('g').attr('class', 'icons').node();
  UEL.clear(); RTEL.clear(); curT = d3.zoomIdentity;
  gLand.on('click', ev => { if (uMode) return; const t = ev.target && ev.target.getAttribute('data-t'); if (t) { try { keepSelVisible.p = evLonLat(ev); keepSelVisible.t = t; } catch (e) { keepSelVisible.p = null; } onMapTap(t); } });
  // a tap anywhere (land or sea) while choosing a destination for a unit
  svg.on('click.units', ev => {
    if (!uMode) { if (fanIds) { fanIds = null; drawUnits(); } return; }
    const t = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-t');
    modeTap(evLonLat(ev), t);
  });
  d3.select(gCities).on('click', ev => {
    const g = ev.target.closest && ev.target.closest('[data-ci]'); if (!g) return;
    ev.stopPropagation();
    onCityTap(g.getAttribute('data-ci'));
  });
  d3.select(gIcons).on('click', ev => {
    const g = ev.target.closest && ev.target.closest('[data-k]'); if (!g) return;
    ev.stopPropagation();
    onUnitTap(g.getAttribute('data-k'));
  });
  zoom = d3.zoom().scaleExtent([0.8, 60]).translateExtent([[-W, -H], [W * 2, H * 2]])
    .on('start', () => { zooming = true; hideTip(); })
    .on('zoom', ev => { gRoot.attr('transform', ev.transform); curT = ev.transform; if (Math.abs(ev.transform.k - curK) > 0.01) { curK = ev.transform.k; scaleMarks(); if (fanIds && Math.abs(curK / fanK - 1) > 0.25) fanIds = null; } drawUnits(); cityFollow(); moveCountryNames(); })
    .on('end', () => { if (panRaf) return; zooming = false; if (Math.abs(curK - (drawDeco.k || 0)) > 0.01) drawDeco(); if (!cityT0 || cityT0.x !== curT.x || cityT0.y !== curT.y || cityT0.k !== curT.k) drawCities(); });
  if (GP) { MAP_PROJ = globeWrap(GP); globeHooks(); }
  else { svg.call(zoom).on('dblclick.zoom', null); MAP_PROJ = projection; }
  deskMapHooks();
  projCities();
  initFx();
  if (GP) globeStartView();
  else if (!(S && S.player) && W < 900) svg.call(zoom.transform, d3.zoomIdentity.translate(0, H * 0.22 - (topPad + H - botPad) / 2));
  drawDeco();
}
let MAP_PROJ = null, FLATP = null;
/* ---- 3D globe (default view): orthographic projection; drag rotates, pinch / wheel zooms ----
   The map keeps the same coordinate system as the flat map: projection points (map units) inside gRoot,
   which is scaled by curK. Panning becomes a rotation of the globe, so after each move everything is re-projected. */
let GLOBE = (() => { try { return localStorage.getItem('world2026_globe') !== '0'; } catch (e) { return true; } })();
let CLOUDS = (() => { try { return localStorage.getItem('world2026_clouds') !== '0'; } catch (e) { return true; } })();
let gLastType = '', GP = null, GR = 100, gC = [35, 28], gSX = 0, gSY = 0, gKmin = 0.5, gKfit = 1, gKeep = 0, gAnim = 0, gRaf = 0, gInert = 0, gDrag = null, gSupT = 0, gLastTap = null, GF = [], gGrat = null, gDeco = null, gWheelT = 0;
const gPtr = new Map(), DEG = 180 / Math.PI, GRAT = d3.geoGraticule().step([15, 15]).precision(3)();
let gCos = [0, 1, 0];
function gSetC() { gCos = [Math.sin(gC[1] / DEG), Math.cos(gC[1] / DEG), gC[0] / DEG]; }
// cosine of the angle between a point and the middle of the view (> 0 = on the side facing us)
function gFront(p) { const f = p[1] / DEG; return gCos[0] * Math.sin(f) + gCos[1] * Math.cos(f) * Math.cos(p[0] / DEG - gCos[2]); }
function globeProj(flatScale) {
  GR = flatScale;
  GP = d3.geoOrthographic().scale(GR).translate([W / 2, H / 2]).clipAngle(90).precision(0.6);
  gKfit = Math.min(W, H) * 0.46 / GR; gKmin = gKfit * 0.5;
  if (S && S.player && !gKeep) { const t = mainTid(S.player); if (t && TERR[t]) gC = [TERR[t].c[0], clamp(TERR[t].c[1], -70, 70)]; }
  curK = clamp(gKeep || gKfit, gKmin, 60); gSX = W / 2; gSY = H / 2;
  gSetC(); GP.rotate([-gC[0], -gC[1]]);
  return GP;
}
function globeWrap(gp) {
  const f = p => (p && gFront(p) > 0.004) ? gp(p) : null;
  f.invert = q => (q && Math.hypot(q[0] - W / 2, q[1] - H / 2) < GR * 0.999) ? gp.invert(q) : null;
  return f;
}
// one record per country shape, split into its polygons: each has its centre and size on the sphere, so a polygon
// out of view is skipped, one fully on our side is projected by a fast direct formula, and only those crossing the
// edge of the globe go through d3's clipping
function gFeat(f, el) {
  const g = f.geometry, polys = !g ? [] : g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  const P = polys.map(rings => {
    const c = d3.geoCentroid({ type: 'Polygon', coordinates: rings }); let r = 0;
    for (const q of rings[0]) { const d = d3.geoDistance(c, q); if (d > r) r = d; }
    return { rings, c, r: r + 0.004, fr: null, sr: null, sg: null };
  });
  const c = d3.geoCentroid(f); let r = 0; P.forEach(q => { r = Math.max(r, d3.geoDistance(c, q.c) + q.r); });
  return { f, el, P, c, r, d: null };
}
// each point as sin/cos of its longitude and latitude, so projecting needs no trigonometry per point
const gPack = rings => rings.map(rg => { const a = new Float64Array(rg.length * 4); rg.forEach((q, i) => { const f = q[1] / DEG, l = q[0] / DEG; a[i * 4] = Math.sin(l); a[i * 4 + 1] = Math.cos(l); a[i * 4 + 2] = Math.sin(f); a[i * 4 + 3] = Math.cos(f); }); return a; });
function gSimpRings(rings, eps) {
  const ring = r => {
    if (r.length <= 10) return r;
    const o = [r[0]]; let l = r[0];
    for (let i = 1; i < r.length - 1; i++) { const q = r[i]; if (Math.abs(q[0] - l[0]) + Math.abs(q[1] - l[1]) > eps) { o.push(q); l = q; } }
    o.push(r[r.length - 1]);
    if (o.length >= 5) return o;
    const n = r.length; return [r[0], r[Math.floor(n / 3)], r[Math.floor(2 * n / 3)], r[0]];
  };
  const out = rings.map(ring);
  // a ring that turned inside out would paint the whole globe: keep the full shape then
  try { const a0 = d3.geoArea({ type: 'Polygon', coordinates: rings }), a1 = d3.geoArea({ type: 'Polygon', coordinates: out }); if (!(Math.abs(a1 - a0) < a0 * 0.4 + 2e-5)) return rings; } catch (e) { return rings; }
  return out;
}
// orthographic projection done by hand (same result as d3's for points on our side), dropping points closer than tol
// a round area of the sphere (the night side) on the globe, worked out directly: its edge circle in 3D,
// with the part behind the globe laid along the globe's edge
function gCap(ctr, deg) {
  const vec = p => { const f = p[1] / DEG, dl = p[0] / DEG - gCos[2], cp = Math.cos(f), cd = Math.cos(dl); return [cp * Math.sin(dl), gCos[1] * Math.sin(f) - gCos[0] * cp * cd, gCos[0] * Math.sin(f) + gCos[1] * cp * cd]; };
  const a = vec(ctr), cr = Math.cos(deg / DEG), sr = Math.sin(deg / DEG);
  let u = [a[1], -a[0], 0]; let m = Math.hypot(u[0], u[1]); if (m < 1e-6) { u = [1, 0, 0]; m = 1; } u = [u[0] / m, u[1] / m, 0];
  const v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]];
  let d = '', front = 0; const R = GR, cx = W / 2, cy = H / 2;
  for (let i = 0; i < 96; i++) {
    const t = i / 96 * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
    let x = a[0] * cr + sr * (u[0] * c + v[0] * s), y = a[1] * cr + sr * (u[1] * c + v[1] * s); const z = a[2] * cr + sr * (u[2] * c + v[2] * s);
    if (z < 0) { const n = Math.hypot(x, y) || 1; x /= n; y /= n; } else front++;
    d += (i ? 'L' : 'M') + (cx + R * x).toFixed(1) + ',' + (cy - R * y).toFixed(1);
  }
  if (!front && a[2] < 0) return '';
  return d + 'Z';
}
// lines (the graticule): only the parts on our side
let GRATP = null;
function gFastLines(q) {
  if (!GRATP) GRATP = gPack(GRAT.coordinates);
  const l0 = gCos[2], sl0 = Math.sin(l0), cl0 = Math.cos(l0), s0 = gCos[0], c0 = gCos[1], R = GR, cx = W / 2, cy = H / 2; let out = '';
  for (const a of GRATP) {
    let pen = false;
    for (let i = 0; i < a.length; i += 4) {
      const cp = a[i + 3], sp = a[i + 2], cd = a[i + 1] * cl0 + a[i] * sl0, sd = a[i] * cl0 - a[i + 1] * sl0;
      if (s0 * sp + c0 * cp * cd < 0) { pen = false; continue; }
      out += (pen ? 'L' : 'M') + Math.round((cx + R * cp * sd) * q) / q + ',' + Math.round((cy - R * (c0 * sp - s0 * cp * cd)) * q) / q; pen = true;
    }
  }
  return out;
}
// clamp: points behind the globe are pushed out to its edge (a quick stand-in for real clipping while dragging)
// far outside the screen much bigger steps are fine (nothing there is seen)
let gVR = [-1e9, -1e9, 1e9, 1e9], gTolOff = 0;
function gFast(rings, tol, q, clamp) {
  const l0 = gCos[2], sl0 = Math.sin(l0), cl0 = Math.cos(l0), s0 = gCos[0], c0 = gCos[1], R = GR, cx = W / 2, cy = H / 2, [rx0, ry0, rx1, ry1] = gVR, to = Math.max(tol, gTolOff); let out = '';
  for (const a of rings) {
    let lx = 1e9, ly = 1e9, n = 0, s = '', lo = false; const N = a.length - 4;
    for (let i = 0; i <= N; i += 4) {
      const cp = a[i + 3], sp = a[i + 2], cd = a[i + 1] * cl0 + a[i] * sl0;
      let px = cp * (a[i] * cl0 - a[i + 1] * sl0), py = c0 * sp - s0 * cp * cd;
      if (clamp && s0 * sp + c0 * cp * cd < 0) { const m = Math.hypot(px, py) || 1; px /= m; py /= m; }
      const x = cx + R * px, y = cy - R * py, out_ = x < rx0 || x > rx1 || y < ry0 || y > ry1;
      if (i && i < N && Math.abs(x - lx) + Math.abs(y - ly) < (out_ && lo ? to : tol)) continue;
      s += (n ? 'L' : 'M') + Math.round(x * q) / q + ',' + Math.round(y * q) / q; lx = x; ly = y; lo = out_; n++;
    }
    if (n >= 3) out += s + 'Z';
  }
  return out;
}
// ocean, atmosphere glow and the shading of the edge (they never move: the sphere is always the same circle)
function globeBack() {
  const sv = svg.node(), defs = sEl('defs', {}, null); sv.insertBefore(defs, sv.firstChild);
  defs.innerHTML = '<radialGradient id="gOcean" cx="44%" cy="38%" r="66%"><stop offset="0" stop-color="#1f5585"/><stop offset=".55" stop-color="#123a5e"/><stop offset="1" stop-color="#07182a"/></radialGradient>' +
    '<radialGradient id="gGlow" r="50%"><stop offset=".86" stop-color="#6cc4ff" stop-opacity=".0"/><stop offset=".885" stop-color="#7fd0ff" stop-opacity=".55"/><stop offset=".93" stop-color="#3f8fd8" stop-opacity=".18"/><stop offset="1" stop-color="#1b4f8a" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="gLimb" cx="42%" cy="36%" r="64%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".82" stop-color="#000814" stop-opacity=".22"/><stop offset="1" stop-color="#000814" stop-opacity=".6"/></radialGradient>' +
    '<radialGradient id="gShine" cx="36%" cy="30%" r="40%"><stop offset="0" stop-color="#bfe3ff" stop-opacity=".10"/><stop offset="1" stop-color="#bfe3ff" stop-opacity="0"/></radialGradient>';
  const g = gRoot.node();
  sEl('circle', { class: 'gglow', cx: W / 2, cy: H / 2, r: GR * 1.12, fill: 'url(#gGlow)' }, g);
  sEl('circle', { class: 'sphere gsph', cx: W / 2, cy: H / 2, r: GR, style: 'fill:url(#gOcean)' }, g);
}
// layers drawn over the land: clouds, the night side, city lights, the edge shading
function decoInit() {
  const g = gRoot.append('g').attr('class', 'deco').node();
  gDeco = {
    c1: sEl('path', { class: 'cld1' }, g), c2: sEl('path', { class: 'cld2' }, g),
    n1: sEl('path', { class: 'night' }, g), n2: sEl('path', { class: 'night' }, g),
    l1: sEl('path', { class: 'lit1' }, g), l2: sEl('path', { class: 'lit2' }, g)
  };
  if (GP) { gDeco.limb = sEl('circle', { class: 'glimb', cx: W / 2, cy: H / 2, r: GR, fill: 'url(#gLimb)' }, g); sEl('circle', { class: 'glimb', cx: W / 2, cy: H / 2, r: GR, fill: 'url(#gShine)' }, g); }
}
// the sun: its latitude follows the game's season; it goes round the world slowly (≈24 real minutes, a bit faster while time runs)
let gSunLon = (() => { const n = new Date(); return 180 - (n.getUTCHours() + n.getUTCMinutes() / 60) * 15; })(), LIGHTS = null, CLD = null;
function sunPt() {
  const day = S ? S.day + clamp(acc || 0, 0, 1) : 0;
  return [((gSunLon % 360) + 540) % 360 - 180, -23.44 * Math.cos(2 * Math.PI * ((day % 365.25) + 10) / 365.25)];
}
function cloudsInit() {
  CLD = []; let sd = 20261;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const lat = (rnd() * 2 - 1) * (rnd() < 0.5 ? 62 : 35), parts = [], n = 3 + Math.floor(rnd() * 4), len = 6 + rnd() * 16;
    for (let j = 0; j < n; j++) parts.push([(j / (n - 1) - 0.5) * len + (rnd() - 0.5) * 3, (rnd() - 0.5) * 5, 2.2 + rnd() * 4.5]);
    CLD.push({ lon: rnd() * 360 - 180, lat, parts, sp: 0.5 + rnd() * 0.7 });
  }
}
const circD = (x, y, r) => 'M' + (x - r).toFixed(2) + ',' + y.toFixed(2) + 'a' + r.toFixed(2) + ',' + r.toFixed(2) + ' 0 1,0 ' + (2 * r).toFixed(2) + ',0a' + r.toFixed(2) + ',' + r.toFixed(2) + ' 0 1,0 ' + (-2 * r).toFixed(2) + ',0';
function drawDeco() {
  if (!gDeco || !pathGen || !gDeco.n1.isConnected) return;
  drawDeco.k = curK;
  const sp = sunPt(), anti = [sp[0] + 180, -sp[1]];
  gDeco.n1.setAttribute('d', GP ? gCap(anti, 90) : pathGen(d3.geoCircle().center(anti).radius(90).precision(2)()) || '');
  gDeco.n2.setAttribute('d', GP ? gCap(anti, 81) : pathGen(d3.geoCircle().center(anti).radius(81).precision(2)()) || '');
  // city lights on the night side, bigger for bigger cities
  let a = '', b = '';
  if (FXMODE !== 'off' && CITY.length) {
    if (!LIGHTS || LIGHTS.n !== CITY.length) { LIGHTS = CITY.slice().sort((p, q) => (q.pop || 0) - (p.pop || 0)).slice(0, isDesk() ? 480 : 280); LIGHTS.n = CITY.length; }
    const sa = Math.sin(anti[1] / DEG), ca = Math.cos(anti[1] / DEG), la = anti[0] / DEG, z = 1 / curK;
    for (const x of LIGHTS) {
      if (!(x.mx === x.mx)) continue;
      const f = x.lat / DEG, cn = sa * Math.sin(f) + ca * Math.cos(f) * Math.cos(x.lon / DEG - la); if (cn < 0.06) continue;
      const r = (0.9 + Math.sqrt(Math.max(0.05, x.pop || 0.1)) * 0.75) * Math.min(1, cn * 4) * z;
      a += circD(x.mx, x.my, r * 2.8); b += circD(x.mx, x.my, r * 0.75);
    }
  }
  gDeco.l1.setAttribute('d', a); gDeco.l2.setAttribute('d', b);
  // a few soft clouds drifting east (globe only; not with reduced animations)
  let c1 = '', c2 = '';
  if (GP && CLOUDS && FXMODE === 'full') {
    if (!CLD) cloudsInit();
    // the cloud shapes are rebuilt twice a second at most (they drift slowly); turning the globe only re-projects them
    const t = performance.now() / 1000;
    if (!CLD.g || t - CLD.t > 1.5) {
      CLD.t = t; const A = [], B = [], M = [], gc = d3.geoCircle().precision(15);
      for (const cl of CLD) for (const [dx, dy, r] of cl.parts) {
        const c = [cl.lon + dx + t * cl.sp * 0.35, cl.lat + dy];
        A.push(gc.center(c).radius(r * 1.35)().coordinates); B.push(gc.center(c).radius(r)().coordinates); M.push([c, r * 1.35 / DEG, r / DEG]);
      }
      CLD.g = [{ type: 'MultiPolygon', coordinates: A }, { type: 'MultiPolygon', coordinates: B }]; CLD.m = M; CLD.pk = [null, A.map(gPack), B.map(gPack)];
    }
    const H2 = Math.PI / 2 - 0.01, pr = (G, i) => { let d = ''; const back = []; G.coordinates.forEach((P, j) => { const m = CLD.m[j], f = gFront(m[0]); if (f > Math.cos(H2 - m[i])) d += gFast(CLD.pk[i][j], 1.2 / curK, 10); else if (f > -Math.sin(m[i])) d += gFast(CLD.pk[i][j], 1.2 / curK, 10, true); }); return d; };
    c1 = pr(CLD.g[0], 1); c2 = pr(CLD.g[1], 2);
  }
  gDeco.c1.setAttribute('d', c1); gDeco.c2.setAttribute('d', c2);
}
let STARIMG = null;
function gStars() {
  const m = $('#map'); if (!m) return;
  const on = !!GP && FXMODE !== 'off';
  if (on && !STARIMG) {
    try {
      const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
      let sd = 777; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 260; i++) { const r = rnd() < 0.08 ? 1.3 : 0.7; c.globalAlpha = 0.25 + rnd() * 0.6; c.fillStyle = rnd() < 0.15 ? '#ffe7c2' : '#dfe9ff'; c.beginPath(); c.arc(rnd() * 512, rnd() * 512, r, 0, 6.283); c.fill(); }
      STARIMG = cv.toDataURL();
    } catch (e) { STARIMG = ''; }
  }
  m.style.backgroundImage = on && STARIMG ? 'url(' + STARIMG + '), radial-gradient(ellipse at 50% 45%, #0b1626 0%, #03060c 75%)' : (GP ? 'radial-gradient(ellipse at 50% 45%, #0b1626 0%, #03060c 75%)' : '');
  m.style.backgroundSize = on && STARIMG ? '512px 512px, cover' : '';
}
// night side, lights and clouds move on their own: redraw now and then while the map is still
function gTick(t) {
  const dt = gTick.t ? Math.min(0.25, (t - gTick.t) / 1000) : 0; gTick.t = t;
  gSunLon -= dt * 0.25 * (S && S.speed > 0 ? 1.6 : 1);
  if (zooming || t - (gTick.d || 0) < (GP ? 450 : 2500)) return;
  gTick.d = t; drawDeco();
}
/* ---- re-projecting the globe ---- */
function gXf() { const k = curK; curT = d3.zoomIdentity.translate(gSX - k * W / 2, gSY - k * H / 2).scale(k); gRoot.attr('transform', curT); }
function gRender(low) {
  if (!GP || !svg) return;
  gSetC(); GP.rotate([-gC[0], -gC[1]]);
  const k = curK; gXf(); moveCountryNames();
  const m = 30 / k, x0 = -curT.x / k, y0 = -curT.y / k;
  GP.clipExtent([[x0 - m, y0 - m], [x0 + W / k + m, y0 + H / k + m]]);
  if (pathGen.digits) pathGen.digits(k < 4 ? 1 : k < 30 ? 2 : 3);
  // how far from the middle of the view the screen reaches, as an angle on the sphere
  const D = Math.hypot(Math.max(gSX, W - gSX), Math.max(gSY, H - gSY)), ang = D >= GR * k ? Math.PI / 2 : Math.asin(D / (GR * k));
  // while moving: lighter shapes, fewer points and no curve smoothing; full detail when the view settles
  GP.precision(low ? 0 : 0.6);
  const H2 = Math.PI / 2 - 0.006, tol = (low ? 1.7 : 0.45) / k, qd = k < 4 ? 10 : k < 30 ? 100 : 1000, simple = low && k < 8, eps = k < 4 ? 0.6 : 0.3;
  gVR = [x0 - 60 / k, y0 - 60 / k, x0 + (W + 60) / k, y0 + (H + 60) / k]; gTolOff = 45 / k;
 
  for (const g of GF) {
    let d = '';
    if (d3.geoDistance(gC, g.c) - g.r < ang + 0.03) {
      let back = null;
      for (const p of g.P) {
        const dc = Math.acos(clamp(gFront(p.c), -1, 1));
        if (dc - p.r > ang + 0.02 || dc - p.r > H2) continue;
        const sg = simple ? (eps > 0.4 ? p.sg2 || (p.sg2 = gSimpRings(p.rings, 0.6)) : p.sg || (p.sg = gSimpRings(p.rings, 0.3))) : p.rings;
        if (dc + p.r < H2 || (low && p.r < 1.75)) d += gFast(!simple ? p.fr || (p.fr = gPack(p.rings)) : eps > 0.4 ? p.sr2 || (p.sr2 = gPack(sg)) : p.sr || (p.sr = gPack(sg)), tol, qd, dc + p.r >= H2);
        else (back || (back = [])).push(sg);
      }
      if (back) d += pathGen({ type: 'MultiPolygon', coordinates: back }) || '';
    }
    if (g.d !== d) { g.el.setAttribute('d', d); g.d = d; }
  }
  gGrat.setAttribute('d', low ? gFastLines(qd) : pathGen(GRAT) || '');
  projCities();
  drawDeco();
  drawMarks(); drawScorch();
  if (low) { if (gCeded) gCeded.style.display = 'none'; if (gCities) gCities.style.display = 'none'; }
  svg.classed('gmove', !!low);
  if (fanIds && Math.abs(curK / fanK - 1) > 0.25) fanIds = null;
  drawUnits();
}
function gReq() { if (!gRaf) gRaf = requestAnimationFrame(() => { gRaf = 0; gRender(true); }); }
// the view settled: full detail, the land handed over in treaties and the cities come back
function gEnd() {
  if (!GP) return;
  if (gRaf) { cancelAnimationFrame(gRaf); gRaf = 0; }
  gKeep = curK; zooming = false;
  gRender(false);
  if (gCeded) { gCeded.style.display = ''; drawCeded.k = null; }
  recolor();
  if (gCities) gCities.style.display = '';
  drawCities();
}
function gStop() { if (gAnim) { cancelAnimationFrame(gAnim); gAnim = 0; } if (gInert) { cancelAnimationFrame(gInert); gInert = 0; } }
// fly to a place: it ends up in the middle of the part of the map the panels don't cover
function globeTo(ll, k, dur, keepC) {
  if (!GP || !ll || !isFinite(ll[0]) || !isFinite(ll[1])) return;
  gStop();
  const [vx0, vy0, vx1, vy1] = visibleRect();
  const c0 = gC.slice(), c1 = [ll[0], clamp(ll[1], -80, 80)], k0 = curK, k1 = clamp(k || curK, gKmin, 60);
  const s0 = [gSX, gSY], s1 = keepC ? s0 : [(vx0 + vx1) / 2, (vy0 + vy1) / 2];
  const gi = d3.geoInterpolate(c0, c1), dist = d3.geoDistance(c0, c1), t0 = performance.now(); dur = dur || 600;
  const dip = dist > 0.35 && Math.max(k0, k1) > gKfit * 1.6 ? 0.45 : 0;
  zooming = true; hideTip();
  const step = t => {
    const u = Math.min(1, (t - t0) / dur), e = d3.easeCubicInOut(u);
    gC = gi(e); curK = Math.max(gKmin, Math.exp(Math.log(k0) + (Math.log(k1) - Math.log(k0)) * e) * (1 - dip * Math.sin(Math.PI * e)));
    gSX = s0[0] + (s1[0] - s0[0]) * e; gSY = s0[1] + (s1[1] - s0[1]) * e;
    if (u < 1) { gRender(true); gAnim = requestAnimationFrame(step); } else { gAnim = 0; gEnd(); }
  };
  gAnim = requestAnimationFrame(step);
}
function zoomToGeo(ll, k) { if (GP) { globeTo(ll, k, 500); return; } const p = MAP_PROJ && MAP_PROJ(ll); if (p) zoomToMapPt(p, k); }
function gZoomTid(T, maxK) {
  const b = d3.geoBounds(T.best); let w = b[1][0] - b[0][0]; if (w < 0) w += 360;
  const h = b[1][1] - b[0][1], latc = (b[0][1] + b[1][1]) / 2, lonc = b[0][0] + w / 2;
  const [vx0, vy0, vx1, vy1] = visibleRect(), vw = vx1 - vx0, vh = vy1 - vy0;
  const sw = Math.max(0.002, w / DEG * Math.cos(latc / DEG)) * GR, sh = Math.max(0.002, h / DEG) * GR;
  const k = clamp(0.45 / Math.max(sw / vw, sh / vh), gKfit * 0.8, Math.max(maxK || 10, gKfit));
  globeTo([lonc, latc], k, 750);
}
// before the player picks a country: the whole globe, in the part of the screen above the start panel
function globeStartView() {
  if (S && S.player) { gRender(false); return; }
  const [vx0, vy0, vx1, vy1] = visibleRect();
  curK = clamp(Math.min(gKfit, 0.47 * Math.min(vx1 - vx0, vy1 - vy0) / GR), gKmin, 60);
  gSX = (vx0 + vx1) / 2; gSY = (vy0 + vy1) / 2;
  gRender(false);
}
// a line along great circles, broken where it goes behind the globe
function gLine(pts) {
  let d = '', pen = false;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!i) { const s = toScreen(p); if (s) { d += 'M' + s[0].toFixed(1) + ',' + s[1].toFixed(1); pen = true; } continue; }
    const q = pts[i - 1], n = Math.max(1, Math.ceil(d3.geoDistance(q, p) * DEG / 2.5)), gi = n > 1 ? d3.geoInterpolate(q, p) : null;
    for (let j = 1; j <= n; j++) { const s = toScreen(gi ? gi(j / n) : p); if (!s) { pen = false; continue; } d += (pen ? 'L' : 'M') + s[0].toFixed(1) + ',' + s[1].toFixed(1); pen = true; }
  }
  return d;
}
// a missile / shell flying along the great circle, lifted above the surface in the middle
function gArc(c, e, k) {
  const gi = e.gi || (e.gi = d3.geoInterpolate(e.p0, e.p1)), L = Math.max(18, d3.geoDistance(e.p0, e.p1) * GR * curK * e.h), u = 0.6 * k + 0.4 * k * k;
  const o0 = e.o0 || [0, 0], o1 = e.o1 || [0, 0];
  const at = v => { const s = toScreen(gi(v)); return s ? [s[0] + o0[0] * (1 - v) + o1[0] * v, s[1] + o0[1] * (1 - v) + o1[1] * v - L * 2 * v * (1 - v)] : null; };
  if (e.trail) {
    const n = 9, u0 = Math.max(0, u - 0.35); c.lineWidth = e.w * 0.9; c.strokeStyle = '#d9dde3';
    let prev = at(u0);
    for (let j = 1; j <= n; j++) { const q = at(u0 + (u - u0) * j / n); if (prev && q) { c.globalAlpha = 0.5 * j / n; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke(); } prev = q; }
  }
  const h = at(u); if (!h) return;
  c.globalAlpha = 0.35; c.fillStyle = e.col; circ(c, h, e.w * 2.2);
  c.globalAlpha = 1; circ(c, h, e.w);
}
/* ---- touch, mouse and wheel on the globe ---- */
function gEvPt(e) { const r = svg.node().getBoundingClientRect(); return [(e.clientX - r.left) * W / (r.width || W), (e.clientY - r.top) * H / (r.height || H)]; }
const gOnDisc = q => Math.hypot(q[0] - gSX, q[1] - gSY) <= GR * curK;
function globeHooks() {
  const el = svg.node();
  el.addEventListener('pointerdown', e => {
    if (e.button) return;   // right click = move order (desktop)
    gStop(); const q = gEvPt(e); gPtr.set(e.pointerId, q); gLastType = e.pointerType;
    if (gPtr.size === 1) gDrag = { p0: q, c0: gC.slice(), moved: false, last: q, lt: performance.now(), v: [0, 0], type: e.pointerType };
    else if (gPtr.size === 2) { const [a, b] = [...gPtr.values()]; gDrag = { pinch: true, d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, k0: curK, m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c0: gC.slice(), moved: true }; zooming = true; hideTip(); }
  });
  // taps that ended a drag, and taps on empty space around the globe, do nothing
  el.addEventListener('click', e => {
    if (performance.now() - gSupT < 80) { e.stopPropagation(); e.preventDefault(); return; }
    const inUI = e.target.closest && e.target.closest('.units,.cities');
    if (!inUI && !gOnDisc(gEvPt(e))) { e.stopPropagation(); if (fanIds) { fanIds = null; drawUnits(); } }
  }, true);
  el.addEventListener('dblclick', e => {
    if (gDrag || gLastType === 'touch') return;
    const ll = evLonLat(e); if (ll) globeTo(ll, curK * 2, 400);
  });
  el.addEventListener('wheel', e => {
    e.preventDefault(); gStop();
    const q = gEvPt(e), ll0 = gOnDisc(q) ? GP.invert(curT.invert(q)) : null;
    curK = clamp(curK * Math.pow(2, -e.deltaY * (e.deltaMode ? 0.05 : 0.0022)), gKmin, 60); gXf();
    if (ll0) { const ll1 = GP.invert(curT.invert(q)); if (ll1 && isFinite(ll1[0]) && isFinite(ll1[1])) { let dl = ll0[0] - ll1[0]; if (dl > 180) dl -= 360; if (dl < -180) dl += 360; gC = [gC[0] + dl, clamp(gC[1] + ll0[1] - ll1[1], -85, 85)]; } }
    zooming = true; hideTip(); gReq();
    clearTimeout(gWheelT); gWheelT = setTimeout(gEnd, 200);
  }, { passive: false });
  if (globeHooks.win) return; globeHooks.win = true;
  window.addEventListener('pointermove', e => {
    if (!gDrag || !GP || !gPtr.has(e.pointerId)) return;
    const q = gEvPt(e); gPtr.set(e.pointerId, q);
    if (gDrag.pinch) {
      if (gPtr.size < 2) return;
      const [a, b] = [...gPtr.values()], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      curK = clamp(gDrag.k0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / gDrag.d0, gKmin, 60);
      const f = DEG / (GR * curK);
      gC = [gDrag.c0[0] - (m[0] - gDrag.m0[0]) * f / Math.max(0.35, Math.cos(gC[1] / DEG)), clamp(gDrag.c0[1] + (m[1] - gDrag.m0[1]) * f, -85, 85)];
      gReq(); return;
    }
    const dx = q[0] - gDrag.p0[0], dy = q[1] - gDrag.p0[1];
    if (!gDrag.moved) { if (Math.hypot(dx, dy) < 6) return; gDrag.moved = true; zooming = true; hideTip(); }
    const now = performance.now(), dt = Math.max(1, now - gDrag.lt);
    gDrag.v = [0.7 * (q[0] - gDrag.last[0]) / dt + 0.3 * gDrag.v[0], 0.7 * (q[1] - gDrag.last[1]) / dt + 0.3 * gDrag.v[1]]; gDrag.last = q; gDrag.lt = now;
    const f = DEG / (GR * curK);
    gC = [gDrag.c0[0] - dx * f / Math.max(0.35, Math.cos(gDrag.c0[1] / DEG)), clamp(gDrag.c0[1] + dy * f, -85, 85)];
    gReq();
  });
  const up = e => {
    if (!gPtr.has(e.pointerId)) return;
    gPtr.delete(e.pointerId);
    const d = gDrag; if (!d || !GP) { gDrag = null; return; }
    if (d.pinch) {
      if (gPtr.size === 1) { const q = [...gPtr.values()][0]; gDrag = { p0: q, c0: gC.slice(), moved: true, last: q, lt: performance.now(), v: [0, 0] }; return; }
      gDrag = null; gSupT = performance.now(); gEnd(); return;
    }
    gDrag = null;
    if (!d.moved) {
      // double tap (touch) zooms in there
      const q = gEvPt(e), now = performance.now();
      if (e.pointerType === 'touch' && gLastTap && now - gLastTap.t < 320 && Math.hypot(q[0] - gLastTap.p[0], q[1] - gLastTap.p[1]) < 30 && gOnDisc(q)) { gLastTap = null; const ll = GP.invert(curT.invert(q)); if (ll) globeTo(ll, curK * 2, 380); return; }
      gLastTap = { t: now, p: q, type: e.pointerType }; return;
    }
    gSupT = performance.now();
    let v = d.v; const sp = Math.hypot(v[0], v[1]);
    if (sp < 0.15 || performance.now() - d.lt > 90) { gEnd(); return; }
    // keeps turning a little after the finger lets go
    let last = performance.now();
    const step = t => {
      const dt = Math.min(40, t - last); last = t;
      const f = DEG / (GR * curK), dec = Math.exp(-dt / 260);
      v = [v[0] * dec, v[1] * dec];
      gC = [gC[0] - v[0] * dt * f / Math.max(0.35, Math.cos(gC[1] / DEG)), clamp(gC[1] + v[1] * dt * f, -85, 85)];
      gRender(true);
      if (Math.hypot(v[0], v[1]) > 0.03) gInert = requestAnimationFrame(step); else { gInert = 0; gEnd(); }
    };
    gInert = requestAnimationFrame(step);
  };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
}
function rebuildMap() {
  gStop(); gPtr.clear(); gDrag = null;
  d3.select('#mapsvg').remove(); for (const k in pathByTid) delete pathByTid[k];
  if (!GLOBE) curK = 1;
  initMap(); drawMarks.k = null; recolor(); unitsDirty = true; drawUnits(); citiesDirty = true; drawCities();
}
function setGlobe(on) {
  GLOBE = !!on; try { localStorage.setItem('world2026_globe', GLOBE ? '1' : '0'); } catch (e) { /* no storage */ }
  gKeep = 0; rebuildMap();
  if (S && S.player) homeView(10);
  toast(GP ? 'גלובוס תלת־ממדי — גרור כדי לסובב' : 'מפה שטוחה');
}
function visibleRect() {
  // part of the map not covered by bars / panels: [x0, y0, x1, y1]
  const startOpen = $('#start').classList.contains('open'), sheetOpen = $('#sheet').classList.contains('open');
  if (isDesk()) return [0, (S && S.player) ? ($('#top').offsetHeight || 60) + 6 : 70, (startOpen || sheetOpen) ? W - PW - 24 : W, H - 12];
  const top = (S && S.player) ? 98 : 70;
  if (W >= 900) return [0, top, (startOpen || sheetOpen) ? W - 440 : W, H - 80];
  if (startOpen) return [0, top, W, H * 0.42];
  const sh = sheetOpen ? $('#sheet').offsetHeight : 0;
  return [0, top, W, Math.max(top + 120, H - 64 - sh)];
}
function zoomToTid(t, maxK) {
  const T = TERR[t]; if (!T || !T.best || !svg) return;
  if (GP) { gZoomTid(T, maxK); return; }
  const [[x0, y0], [x1, y1]] = pathGen.bounds(T.best);
  const [vx0, vy0, vx1, vy1] = visibleRect(), vw = vx1 - vx0, vh = vy1 - vy0;
  const [[, sy0], [, sy1]] = pathGen.bounds({ type: 'Sphere' });
  // at least tall enough to fill the screen top to bottom (no empty sky on a tall phone screen)
  const k = clamp(Math.max(0.45 / Math.max((x1 - x0) / vw, (y1 - y0) / vh), vh / (sy1 - sy0)), 1.5, Math.max(maxK || 10, vh / (sy1 - sy0)));
  let tx = (vx0 + vx1) / 2 - k * (x0 + x1) / 2, ty = (vy0 + vy1) / 2 - k * (y0 + y1) / 2;
  // don't leave empty sky above the map (or below it) when the map is taller than the view
  if ((sy1 - sy0) * k >= vh - 1) ty = clamp(ty, vy1 - sy1 * k, vy0 - sy0 * k);
  svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
}
// opening view: our country, or the front if we start the game at war
function homeView(maxK) {
  const w = warsOf(S.player).find(w => w.pause === 0 && (w.a === S.player || w.b === S.player));
  const en = w && enemyLeaderFor(w, S.player);
  if (en && S.c[en] && S.c[en].alive && adjacent(en, S.player) && mainTid(en)) zoomToTid(mainTid(en), 5);
  else zoomToTid(S.player, maxK);
}
function relColor(r) {
  if (r >= 0) return d3.interpolateRgb('#3a4250', '#2a5a72')(r / 100);
  return d3.interpolateRgb('#3a4250', '#6a2f36')(-r / 100);
}
function colorFor(t) { return colorOf(S && S.owner[t]); }
function colorOf(o) {
  if (!o) return COL.none;
  if (!S.player) return (selected && S.owner[selected] === o) ? COL.me : relColor(0) ;
  if (o === S.player) return COL.me;
  if (atWar(o, S.player)) return COL.war;
  if (isAlly(o, S.player)) return COL.ally;
  if (warsOf(o).some(w => w.pause === 0)) return '#8a5a24';
  return relColor(rel(o, S.player));
}
let lastRecolor = 0;
function recolor() {
  if (!gLand) return;
  const selOwner = selected ? (S.owner[selected] || selected) : null;
  for (const t in pathByTid) {
    const col = colorFor(t), isSel = selOwner && (S.owner[t] === selOwner || t === selected);
    // only touch the DOM when something actually changed (keeps the phone smooth while time runs)
    pathByTid[t].forEach(el => { if (el.__c !== col) { el.setAttribute('fill', col); el.__c = col; } if (el.__s !== !!isSel) { el.classList.toggle('sel', !!isSel); el.__s = !!isSel; } });
  }
  drawCeded(selOwner);
  const mk = S && S.player ? S.player + ':' + warsOf(S.player).map(w => enemyLeaderFor(w, S.player)).join(',') : '';
  if (mk !== drawMarks.k) { drawMarks.k = mk; drawMarks(); }
  // city colours follow wars and alliances
  const ck = mk + '|' + (S ? S.wars.length + ':' + Object.keys(S.pacts).length : '');
  if (ck !== recolor.ck) { recolor.ck = ck; citiesDirty = true; }
  if (scorchDirty) drawScorch();
  needMapRecolor = false; lastRecolor = performance.now();
}
// a circle as a polygon, and a convex polygon clipped by another convex one (Sutherland–Hodgman)
function circPoly(cx, cy, r) { const out = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return out; }
function clipConvex(sub, clip) {
  let out = sub.slice(); if (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
  const n = clip.length; let ar = 0; for (let i = 0; i < n; i++) { const a = clip[i], b = clip[(i + 1) % n]; ar += a[0] * b[1] - b[0] * a[1]; }
  const sg = ar >= 0 ? 1 : -1;
  for (let i = 0; i < n && out.length; i++) {
    const a = clip[i], b = clip[(i + 1) % n], inp = out; out = [];
    const side = p => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
    const cut = (p, q) => { const x1 = p[0], y1 = p[1], x2 = q[0], y2 = q[1], x3 = a[0], y3 = a[1], x4 = b[0], y4 = b[1];
      const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (!d) return p; const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d; return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]; };
    for (let j = 0; j < inp.length; j++) {
      const p = inp[j], q = inp[(j + 1) % inp.length], pi = side(p), qi = side(q);
      if (pi) { out.push(p); if (!qi) out.push(cut(p, q)); } else if (qi) out.push(cut(p, q));
    }
  }
  return out;
}
// land ceded in peace treaties: the old country's shape is split into the cells of its cities (Voronoi on the map),
// and the cells of the cities handed over are painted in the new owner's colour. Rebuilt only when the land changes.
let gCeded = null;
// a cell drawn on the flat map, as a shape on the globe (edges cut in small steps so they bend right)
function cellGeoD(poly) {
  const ring = [];
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; for (let j = 0; j < 4; j++) { const g = FLATP.invert([a[0] + (b[0] - a[0]) * j / 4, a[1] + (b[1] - a[1]) * j / 4]); if (g && isFinite(g[0]) && isFinite(g[1])) ring.push(g); } }
  if (ring.length < 3) return '';
  ring.push(ring[0]);
  let P = { type: 'Polygon', coordinates: [ring] };
  if (d3.geoArea(P) > 2 * Math.PI) P = { type: 'Polygon', coordinates: [ring.slice().reverse()] };
  return pathGen(P) || '';
}
function drawCeded(selOwner) {
  if (!gCeded || !S) return;
  const cl = S.cl || {}, key = Object.keys(cl).sort().map(k => k + '>' + cl[k]).join(';');
  if (key !== drawCeded.k) {
    drawCeded.k = key; gCeded.innerHTML = '';
    if (key && pathGen && d3.Delaunay) {
      const byT = clIdx(), ns = 'http://www.w3.org/2000/svg';
      const defs = document.createElementNS(ns, 'defs'); gCeded.appendChild(defs);
      for (const t in byT) {
        const l = byT[t], els = pathByTid[t]; if (!l.length || !els) continue;
        const cp = document.createElementNS(ns, 'clipPath'); cp.setAttribute('id', 'cdc-' + t);
        els.forEach(e => { const q = document.createElementNS(ns, 'path'); q.setAttribute('d', e.getAttribute('d')); cp.appendChild(q); });
        defs.appendChild(cp);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        if (GP) { const fp = d3.geoPath(FLATP); GF.forEach(g => { if (g.f.properties.tid !== t) return; const [[a0, b0], [a1, b1]] = fp.bounds(g.f); x0 = Math.min(x0, a0); y0 = Math.min(y0, b0); x1 = Math.max(x1, a1); y1 = Math.max(y1, b1); }); }
        else els.forEach(e => { try { const b = e.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); } catch (er) { /* not rendered */ } });
        if (!(x1 > x0)) { x0 = -W; y0 = -H; x1 = W * 2; y1 = H * 2; }
        const vor = d3.Delaunay.from(l, x => x.fx, x => x.fy).voronoi([x0 - 5, y0 - 5, x1 + 5, y1 + 5]);
        const g = document.createElementNS(ns, 'g'); g.setAttribute('clip-path', 'url(#cdc-' + t + ')');
        l.forEach((x, i) => {
          const o = landOf(x); if (o === S.owner[t]) return;
          let poly = vor.cellPolygon(i); if (!poly) return;
          poly = clipConvex(poly, circPoly(x.fx, x.fy, x.mr)); if (poly.length < 3) return;
          const q = document.createElementNS(ns, 'path');
          if (GP) { const d = cellGeoD(poly); if (!d) return; q.setAttribute('d', d); }
          else q.setAttribute('d', 'M' + poly.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('L') + 'Z');
          q.setAttribute('data-cw', o); q.setAttribute('data-ci', x.id); q.__w = o;
          g.appendChild(q);
        });
        gCeded.appendChild(g);
      }
    }
  }
  gCeded.querySelectorAll('[data-cw]').forEach(el => {
    const col = colorOf(el.__w), sel = !!selOwner && el.__w === selOwner;
    if (el.__c !== col) { el.setAttribute('fill', col); el.__c = col; }
    if (el.__s !== sel) { el.classList.toggle('sel', sel); el.__s = sel; }
  });
}
function drawMarks() {
  if (!gMarks || !MAP_PROJ) return;
  gMarks.selectAll('*').remove();
  if (!S || !S.player) return;
  const labels = new Set([S.player]);
  warsOf(S.player).forEach(w => labels.add(enemyLeaderFor(w, S.player)));
  const pts = [];
  labels.forEach(id => {
    const t = TERR[id] && S.c[id] && S.c[id].alive ? id : tidsOf(id)[0]; if (!t || !TERR[t]) return;
    const p = MAP_PROJ(TERR[t].c); if (p) pts.push({ id, p });
  });
  pts.forEach(({ id, p }) => {
    const isMe = id === S.player;
    // push the label away from the other labelled countries so small neighbours (Israel / Lebanon) don't stack
    let dx = 0, dy = 0;
    pts.forEach(o => { if (o.id === id) return; const vx = p[0] - o.p[0], vy = p[1] - o.p[1], d = Math.hypot(vx, vy) || 1; if (d < 60) { dx += vx / d; dy += vy / d; } });
    const n = Math.hypot(dx, dy); if (n) { dx /= n; dy /= n; }
    if (!isMe) gMarks.append('circle').attr('class', 'pulse').attr('cx', p[0]).attr('cy', p[1]).attr('data-r', 7);
    gMarks.append('text').attr('class', 'lbl' + (isMe ? ' me' : ' en')).attr('data-x', p[0]).attr('data-y', p[1]).attr('data-dx', dx).attr('data-dy', dy).attr('data-fs', 11).text(nm(id));
  });
  scaleMarks();
}
// zoomed in, our country's name (and the enemy's) slides up or down to a spot no unit icon covers
function placeMarkLabels() {
  if (!gMarks || !UBOX) return;
  gMarks.selectAll('text').each(function () {
    const fs = +this.getAttribute('font-size') * curK, x = curT.x + curK * +this.getAttribute('x'), y = curT.y + curK * +this.getAttribute('y'), w = (this.textContent || '').length * fs * 0.62;
    if (!(fs > 0)) return;
    let best = 0;
    for (const dy of [0, -24, 24, -44, 44, -64]) { const b = [x - w / 2, y + dy - fs * 0.6, x + w / 2, y + dy + fs * 0.6]; if (!ovl(b, UBOX)) { best = dy; break; } }
    const tr = best ? 'translate(0,' + (best / curK).toFixed(4) + ')' : '';
    if ((this.getAttribute('transform') || '') !== tr) { if (tr) this.setAttribute('transform', tr); else this.removeAttribute('transform'); }
  });
}
function scaleMarks() {
  if (!gMarks) return;
  gMarks.selectAll('circle').attr('r', function () { return +this.getAttribute('data-r') / curK; }).attr('stroke-width', 2 / curK);
  gMarks.selectAll('text').each(function () {
    const fs = +this.getAttribute('data-fs') / Math.sqrt(curK) / Math.max(1, Math.sqrt(curK) / 1.5);
    const off = fs * 0.9;
    this.setAttribute('font-size', fs); this.setAttribute('stroke-width', 3 / curK);
    this.setAttribute('x', +this.getAttribute('data-x') + +this.getAttribute('data-dx') * off * 1.6);
    this.setAttribute('y', +this.getAttribute('data-y') + +this.getAttribute('data-dy') * off);
  });
}
function onMapTap(t) {
  if (!S) return;
  const o = S.owner[t];
  if (!S.player) { if (o) startPick(o); return; }
  selected = t; if (selUnit || fanIds) { selUnit = null; fanIds = null; unitsDirty = true; } if (selCity) { selCity = null; citiesDirty = true; } recolor();
  openTab('country');
}

/* ---- units layer ---- */
let gUnits = null, gRoutes = null, gIcons = null, curT = d3.zoomIdentity, unitsDirty = true, lastUnitsDraw = 0, selUnit = null, uMode = null, ulistIds = [], fanIds = null, fanK = 1;
const UEL = new Map(), RTEL = new Map(), SVGNS = 'http://www.w3.org/2000/svg';
const sEl = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
function evLonLat(ev) {
  const [x, y] = d3.pointer(ev, svg.node());
  const m = curT.invert([x, y]);
  return MAP_PROJ.invert(m) || null;
}
const uIcon = u => u.t === 'fleet' && (u.m.carriers || 0) >= 0.5 ? 'car' : UT[u.t].ic;
function kTxt(k) { const v = k * 1000; return v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M' : v >= 1000 ? Math.round(v / 1000) + 'K' : String(Math.round(v)); }
const fl = v => Math.max(0, Math.floor((v || 0) + 1e-6));
// short strength label under the icon: "120K", "450", "60✈"
function uLabel(u) {
  const m = u.m;
  switch (u.t) {
    case 'inf': return kTxt(m.troops || 0);
    case 'arm': return m.tanks >= 1 ? String(fl(m.tanks)) : String(fl(m.afv));
    case 'art': return String(fl(m.art));
    case 'msl': return String(fl(m.msl));
    case 'air': return fl(m.air) >= 1 ? fl(m.air) + '✈︎' : String(fl(m.heli));
    case 'heli': return String(fl(m.heli));
    case 'fleet': return String(fl((m.ships || 0) + (m.carriers || 0))) || '0';
    case 'sub': return String(fl(m.subs));
  }
  return '';
}
const uFought = u => !!(S.c[u.o] && warsOf(u.o).length);
function uFighting(u) {
  if (u.dest) return false;
  if (domOf(u) === 'sea') return warsOf(u.o).some(w => { const en = enemyLeaderFor(w, u.o); return w.pause === 0 && S.c[en] && S.c[en].alive && distToC(en, [u.lon, u.lat]) < 600; });
  if (u.at && u.at !== u.o && atWar(u.at, u.o)) return true;
  return u.at === u.o && S.units.some(e => e.o !== u.o && e.at === u.o && domOf(e) !== 'sea');
}
// current position (smoothly between two game days while time runs)
function uPos(u) {
  let lon = u.lon, lat = u.lat;
  if (S.speed > 0 && u.px != null && (u.px !== u.lon || u.py !== u.lat) && Math.abs(u.px - u.lon) < 90) { const f = clamp(acc, 0, 1); lon = u.px + (u.lon - u.px) * f; lat = u.py + (u.lat - u.py) * f; }
  return [lon, lat];
}
function toScreen(p) { const q = MAP_PROJ(p); return q ? [curT.x + curT.k * q[0], curT.y + curT.k * q[1]] : null; }
// group units into display items: whole countries when zoomed out, nearby icons when zoomed in
function buildItems() {
  const items = [], groups = new Map();
  // a stack the player opened: its units sit in a ring around the stack's place
  const fan = fanIds ? fanIds.map(unitById).filter(Boolean) : [];
  if (fan.length) {
    let cx = 0, cy = 0, n = 0; fan.forEach(u => { const s = toScreen(uPos(u)); if (s) { cx += s[0]; cy += s[1]; n++; } });
    if (n) {
      cx /= n; cy /= n;
      const rings = fan.length <= 7 ? [fan] : [fan.slice(0, 7), fan.slice(7)];
      rings.forEach((ring, ri) => {
        const r = ri ? 92 : (ring.length <= 4 ? 40 : 50);
        ring.forEach((u, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / ring.length + ri * 0.4; items.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) * 1.1, us: [u], o: u.o, fan: [cx, cy] }); });
      });
    }
  }
  const inFan = new Set(fan.map(u => u.id));
  for (const u of S.units) {
    if (inFan.has(u.id)) continue;
    const s = toScreen(uPos(u)); if (!s) continue;
    if (u.id === selUnit) { items.push({ x: s[0], y: s[1], us: [u], o: u.o }); continue; }
    const gk = curK < 2.2 ? u.o + '@' + (u.at || ('s' + Math.round(s[0] / 40) + ',' + Math.round(s[1] / 40))) : 'u' + u.id;
    let g = groups.get(gk); if (!g) { g = { x: 0, y: 0, us: [], o: u.o }; groups.set(gk, g); }
    g.us.push(u); g.x += s[0]; g.y += s[1];
  }
  const gl = [...groups.values()]; gl.forEach(g => { g.x /= g.us.length; g.y /= g.us.length; });
  // merge same-side icons that would overlap on screen (badge 30×22 plus the label under it)
  for (let i = 0; i < gl.length; i++) {
    const a = gl[i]; if (!a) continue;
    for (let j = i + 1; j < gl.length; j++) {
      const b = gl[j]; if (!b || b.o !== a.o) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      if (Math.abs(dx) < 40 && Math.abs(dy) < 46) { const n = a.us.length + b.us.length; a.x = (a.x * a.us.length + b.x * b.us.length) / n; a.y = (a.y * a.us.length + b.y * b.us.length) / n; a.us = a.us.concat(b.us); gl[j] = null; j = i; }
    }
  }
  gl.forEach(g => { if (g) items.push(g); });
  // zoomed out, a big stack sits right on its country's middle: step it aside so the country's name and its capital stay readable
  if (curK < 9 && gMarks) {
    const av = [];
    gMarks.selectAll('text').each(function () {
      const fs = +this.getAttribute('font-size') * curK, x = curT.x + curK * +this.getAttribute('x'), y = curT.y + curK * +this.getAttribute('y'), w = (this.textContent || '').length * fs * 0.62;
      if (fs > 0) av.push([x - w / 2 - 2, y - fs * 0.6 - 2, x + w / 2 + 2, y + fs * 0.6 + 2]);
    });
    if (S.ct) [S.player].concat(enemiesAtWar()).forEach(id => { const x = capOf(id); if (!x || !(x.mx === x.mx)) return; const sx = curT.x + curK * x.mx, sy = curT.y + curK * x.my; av.push([sx - 9, sy - 9, sx + 9, sy + 9]); });
    for (const it of items) {
      if (it.fan || it.us[0].id === selUnit) continue;
      const big = it.us.length > 1;
      for (let t = 0; t < 3; t++) {
        const b = big ? [it.x - 30, it.y - 22, it.x + 24, it.y + 39] : [it.x - 16, it.y - 15, it.x + 16, it.y + 24];
        const hit = av.find(q => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]); if (!hit) break;
        // below the label when there is room, otherwise above it
        const down = hit[3] + (big ? 23 : 16), up = hit[1] - (big ? 40 : 25);
        it.y = down + 40 < H ? down : up;
      }
    }
  }
  // push apart icons of different sides that sit on top of each other
  for (let it = 0; it < 3; it++) for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]; if (a.fan || b.fan || (a.o === b.o && a.us[0].id !== selUnit && b.us[0].id !== selUnit)) continue;
    let dx = a.x - b.x, dy = a.y - b.y; const d = Math.hypot(dx, dy);
    if (d < 36) { if (d < 0.01) { dx = 1; dy = 0; } const k = (36 - d) / 2 / (d || 1); a.x += dx * k; a.y += dy * k; b.x -= dx * k; b.y -= dy * k; }
  }
  return items;
}
function mkIcon(key) {
  const g = sEl('g', { 'data-k': key, class: 'ui' });
  g.__p = {
    hit: sEl('rect', { class: 'hit', x: -20, y: -17, width: 40, height: 44 }, g),
    s2: sEl('rect', { class: 'stk', x: -9, y: -19, width: 30, height: 22, rx: 6 }, g),
    s1: sEl('rect', { class: 'stk', x: -12, y: -16, width: 30, height: 22, rx: 6 }, g),
    ring: sEl('circle', { class: 'ring', r: 21 }, g),
    bg: sEl('rect', { class: 'bg', x: -15, y: -13, width: 30, height: 22, rx: 6 }, g),
    use: sEl('use', { x: -10, y: -11.5, width: 20, height: 19 }, g),
    lb: sEl('text', { class: 'lb', y: 18 }, g),
    fx: sEl('circle', { class: 'fx', cx: -14, cy: -12, r: 4 }, g),
    cnt: sEl('g', { class: 'cnt' }, g),
    mini: sEl('g', { class: 'mini' }, g)
  };
  // a stack also shows small icons of the other kinds of units inside it
  g.__p.mu = [0, 1, 2, 3].map(() => { const m = sEl('g', {}, g.__p.mini); sEl('rect', { x: -6.5, y: -5.5, width: 13, height: 12, rx: 3 }, m); m.__u = sEl('use', { x: -5, y: -4.5, width: 10, height: 10 }, m); return m; });
  sEl('circle', { cx: 14, cy: -13, r: 8 }, g.__p.cnt); g.__p.ct = sEl('text', { x: 14, y: -12.5 }, g.__p.cnt);
  gIcons.appendChild(g);
  return g;
}
const setA = (e, k, v) => { v = String(v); if (e.getAttribute(k) !== v) e.setAttribute(k, v); };
const showE = (e, on) => { const v = on ? '' : 'none'; if (e.style.display !== v) e.style.display = v; };
function drawUnits() {
  if (!gIcons || !S || !S.units || !MAP_PROJ) return;
  unitsDirty = false; lastUnitsDraw = performance.now(); const now = lastUnitsDraw;
  // while choosing a destination our own icons let taps through to the map (enemy icons stay tappable as targets)
  gUnits.classed('picking', !!uMode);
  const items = buildItems(), seen = new Set();
  UBOX = [];
  for (const it of items) {
    const multi = it.us.length > 1;
    const key = multi ? 'c' + it.us.map(u => u.id).sort((a, b) => a - b).join(',') : String(it.us[0].id);
    seen.add(key);
    const off = it.x < -60 || it.y < -60 || it.x > W + 60 || it.y > H + 60;
    let g = UEL.get(key);
    if (off) { if (g) showE(g, false); continue; }
    UBOX.push(multi ? [it.x - 30, it.y - 22, it.x + 24, it.y + 39] : [it.x - 16, it.y - 15, it.x + 16, it.y + 24]);
    if (!g) { g = mkIcon(key); UEL.set(key, g); }
    showE(g, true);
    // a stack shows infantry (with the total soldiers) when it has any, otherwise its strongest unit
    const P_ = g.__p, lead = multi ? (it.us.filter(u => (u.m.troops || 0) >= 1).sort((a, b) => b.m.troops - a.m.troops)[0] || it.us.slice().sort((a, b) => uStr(b) - uStr(a))[0]) : it.us[0];
    setA(g, 'transform', 'translate(' + it.x.toFixed(1) + ',' + it.y.toFixed(1) + ')');
    const hit = hitUntil > now && it.us.some(u => (HIT.get(u.id) || 0) > now);
    setA(g, 'class', 'ui ' + (it.o === S.player ? 'me' : 'en') + (!multi && lead.id === selUnit ? ' sel' : '') + (hit ? ' hit' : ''));
    setA(P_.use, 'href', '#ui-' + uIcon(lead));
    let lbl = uLabel(lead);
    if (multi) { const tr = it.us.reduce((s, u) => s + (u.m.troops || 0), 0); if (tr >= 1) lbl = kTxt(tr); }
    if (P_.lb.textContent !== lbl) P_.lb.textContent = lbl;
    showE(P_.s1, multi); showE(P_.s2, multi && it.us.length > 2); showE(P_.cnt, multi);
    showE(P_.ring, !multi && lead.id === selUnit);
    if (multi && P_.ct.textContent !== String(it.us.length)) P_.ct.textContent = String(it.us.length);
    showE(P_.fx, it.us.some(uFighting));
    const kinds = multi ? [...new Set(it.us.map(uIcon))].filter(k => k !== uIcon(lead)).slice(0, 4) : [];
    showE(P_.mini, kinds.length > 0);
    P_.mu.forEach((m, i) => {
      showE(m, i < kinds.length); if (i >= kinds.length) return;
      setA(m.__u, 'href', '#ui-' + kinds[i]); setA(m, 'transform', 'translate(' + ((i - (kinds.length - 1) / 2) * 14).toFixed(1) + ',31)');
    });
  }
  UEL.forEach((g, k) => { if (!seen.has(k)) { g.remove(); UEL.delete(k); } });
  placeMarkLabels();
  // dashed routes with arrival time for moving units, and battle markers of other wars
  const rs = new Set();
  for (const it of items) if (it.fan) {
    const k = 'f' + it.us[0].id; rs.add(k);
    let r = RTEL.get(k); if (!r) { r = sEl('g', { class: 'fanl' }, gRoutes); r.__l = sEl('path', {}, r); RTEL.set(k, r); }
    setA(r.__l, 'd', 'M' + it.fan[0].toFixed(1) + ',' + it.fan[1].toFixed(1) + 'L' + it.x.toFixed(1) + ',' + it.y.toFixed(1));
  }
  // arrival-time labels must not cover unit icons or each other
  const taken = items.map(it => [it.x, it.y + 6, 22, 26]);
  const free = (x, y) => !taken.some(([tx, ty, rx, ry]) => Math.abs(x - tx) < rx + 20 && Math.abs(y - ty) < ry + 8);
  const order = S.units.filter(u => u.dest).sort((a, b) => (b.id === selUnit) - (a.id === selUnit));
  for (const u of order) {
    if (!u.dest || (u.o !== S.player && u.id !== selUnit && u.ai !== 'atk')) continue;
    const a = toScreen(uPos(u)), b = toScreen(u.dest); if (GP ? !a && !b : !a || !b) continue;
    const k = 'r' + u.id; rs.add(k);
    let r = RTEL.get(k);
    if (!r) { r = sEl('g', {}, gRoutes); r.__l = sEl('path', {}, r); r.__c = sEl('circle', { r: 3.5 }, r); r.__t = sEl('text', {}, r); RTEL.set(k, r); }
    setA(r.__l, 'class', u.o === S.player ? '' : 'en');
    let dd;
    if (GP) dd = gLine([uPos(u)].concat(u.via || [], [u.dest]));
    else { dd = 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1); let prev = a;
      for (const q of (u.via || []).map(toScreen).concat([b])) { if (!q) continue; dd += (Math.abs(q[0] - prev[0]) > W * curK * 0.45 ? 'M' : 'L') + q[0].toFixed(1) + ',' + q[1].toFixed(1); prev = q; } }
    setA(r.__l, 'd', dd);
    if (!b || !a) { showE(r.__c, !!b && u.o === S.player); showE(r.__t, false); if (b) { setA(r.__c, 'cx', b[0].toFixed(1)); setA(r.__c, 'cy', b[1].toFixed(1)); } continue; }
    setA(r.__c, 'cx', b[0].toFixed(1)); setA(r.__c, 'cy', b[1].toFixed(1));
    // arrival time only where there is room for it (and always for the selected unit)
    let long = Math.hypot(b[0] - a[0], b[1] - a[1]) > 70 || u.id === selUnit;
    if (long && u.o === S.player) { if (u.id === selUnit || free(b[0], b[1] - 12)) taken.push([b[0], b[1] - 12, 20, 8]); else long = false; }
    showE(r.__c, u.o === S.player); showE(r.__t, u.o === S.player && long);
    if (u.o === S.player && long) { const d = etaDays(u), t = d < 1 ? '< יום' : Math.ceil(d) + ' ימים'; if (r.__t.textContent !== t) r.__t.textContent = t; setA(r.__t, 'x', b[0].toFixed(1)); setA(r.__t, 'y', (b[1] - 8).toFixed(1)); }
  }
  S.wars.forEach(w => {
    if (w.pause > 0 || involvesPlayer(w)) return;
    const mk = warMark(w); if (!mk) return;
    const s = toScreen(mk); if (!s) return;
    const k = 'w' + w.id; rs.add(k);
    let r = RTEL.get(k);
    if (!r) { r = sEl('g', {}, gRoutes); r.__t = sEl('text', { class: 'bt' }, r); r.__t.textContent = '⚔'; RTEL.set(k, r); }
    setA(r.__t, 'x', s[0].toFixed(1)); setA(r.__t, 'y', (s[1] + 5).toFixed(1));
  });
  RTEL.forEach((r, k) => { if (!rs.has(k)) { r.remove(); RTEL.delete(k); } });
}
// where to draw the ⚔ of a war between two other countries: on the border between them
function warMark(w) {
  if (w.mk && w.mk.k === w.a + w.b) return w.mk.p;
  const ta = mainTid(w.a), tb = mainTid(w.b); if (!ta || !tb) return null;
  let best = null, bd = 1e9;
  for (const a of tp(ta).edge) for (const b of tp(tb).edge) { const d = km(a, b); if (d < bd) { bd = d; best = [a, b]; } }
  const p = best ? d3.geoInterpolate(best[0], best[1])(0.5) : TERR[tb].c;
  w.mk = { k: w.a + w.b, p }; return p;
}
function onUnitTap(key) {
  if (uMode) { // tapping a unit while choosing a destination: go to where it stands
    const ids = key[0] === 'c' ? key.slice(1).split(',').map(Number) : [+key];
    const u = unitById(ids[0]); if (u) modeTap([u.lon, u.lat], null);
    return;
  }
  if (key[0] === 'c') {
    const us = key.slice(1).split(',').map(Number).map(unitById).filter(Boolean);
    if (!us.length) return;
    let spreadPx = 0; const ps = us.map(u => MAP_PROJ([u.lon, u.lat]));
    ps.forEach(a => ps.forEach(b => { spreadPx = Math.max(spreadPx, Math.hypot(a[0] - b[0], a[1] - b[1]) * curK); }));
    const spreadMap = spreadPx / curK, newK = Math.min(40, Math.max(curK * 3, 2.6, 60 / Math.max(0.01, spreadMap)));
    const cx = ps.reduce((s, p) => s + p[0], 0) / ps.length, cy = ps.reduce((s, p) => s + p[1], 0) / ps.length;
    if (spreadMap * newK >= 45 && newK > curK * 1.2) zoomToMapPt([cx, cy], newK); // zooming in separates them
    else if (us.length <= 14) { fanIds = us.map(u => u.id); fanK = curK; drawUnits(); } // too close together: fan them out
    else { ulistIds = us.map(u => u.id); selUnit = null; openTab('ulist'); }
    return;
  }
  selectUnit(+key);
}
function selectUnit(id, zoomIn) {
  const u = unitById(id); if (!u) return;
  selUnit = id; selected = null; recolor(); unitsDirty = true;
  openTab('unit'); const b = $('#sheet-body'); if (b) b.scrollTop = 0;
  drawUnits();
  setTimeout(() => focusUnit(u, zoomIn), 30);
}
function zoomToMapPt(p, k) {
  if (!p) return;
  if (GP) { globeTo(GP.invert(p), k, 500); return; }
  const [vx0, vy0, vx1, vy1] = visibleRect();
  const tr = d3.zoomIdentity.translate((vx0 + vx1) / 2, (vy0 + vy1) / 2).scale(k).translate(-p[0], -p[1]);
  svg.transition().duration(500).call(zoom.transform, tr);
}
// keep the selected unit in the part of the map that the panel doesn't cover
function focusUnit(u, zoomIn) {
  if (!u || !S.units.includes(u)) return;
  if (GP) { const s = toScreen([u.lon, u.lat]), [vx0, vy0, vx1, vy1] = visibleRect(), m = 36; if (zoomIn || !s || s[0] < vx0 + m || s[0] > vx1 - m || s[1] < vy0 + m || s[1] > vy1 - m) globeTo([u.lon, u.lat], zoomIn ? Math.max(curK, zoomIn) : curK, 500); return; }
  const p = MAP_PROJ([u.lon, u.lat]); if (!p) return;
  const s = [curT.x + curT.k * p[0], curT.y + curT.k * p[1]];
  const [vx0, vy0, vx1, vy1] = visibleRect(), m = 36;
  if (zoomIn || s[0] < vx0 + m || s[0] > vx1 - m || s[1] < vy0 + m || s[1] > vy1 - m) zoomToMapPt(p, zoomIn ? Math.max(curK, zoomIn) : curK);
}
/* ---- cities layer: dots, stars and names in screen space; redrawn only when the view settles or something changes ---- */
let gCities = null, citiesDirty = true, lastCityDraw = 0, cityT0 = null, selCity = null, zooming = false, UBOX = [], TWC = null;
const CEL = new Map();
function projCities() {
  if (!MAP_PROJ) return;
  if (FLATP && projCities.f !== FLATP) { projCities.f = FLATP; CLT = null; for (const x of CITY) { const p = FLATP([x.lon, x.lat]); x.fx = p ? p[0] : NaN; x.fy = p ? p[1] : NaN; } }
  for (const x of CITY) { const p = MAP_PROJ([x.lon, x.lat]); x.mx = p ? p[0] : NaN; x.my = p ? p[1] : NaN; }
  citiesDirty = true;
}
// during a pan / pinch the whole layer simply follows the map
function cityFollow() {
  if (!gCities || !cityT0) return;
  const r = curT.k / cityT0.k;
  gCities.setAttribute('transform', 'translate(' + (curT.x - r * cityT0.x).toFixed(1) + ',' + (curT.y - r * cityT0.y).toFixed(1) + ') scale(' + r.toFixed(4) + ')');
}
function textW(t, cap) {
  if (!TWC) { const cv = document.createElement('canvas'); TWC = { c: cv.getContext('2d'), m: new Map() }; }
  const k = (cap ? 'b' : 'n') + t; let w = TWC.m.get(k); if (w != null) return w;
  if (!TWC.c) return t.length * (cap ? 6.6 : 6);
  TWC.c.font = (cap ? '800 11.5px ' : '700 10.5px ') + '"Segoe UI","Noto Sans Hebrew",Arial,sans-serif';
  w = TWC.c.measureText(t).width; TWC.m.set(k, w); return w;
}
// colour by who controls the city, as seen from the player
function cityCls(st) {
  const me = S.player, o = st.o;
  return !o ? 'no' : !me ? 'ne' : o === me ? 'me' : atWar(o, me) ? 'en' : isAlly(o, me) ? 'al' : 'ne';
}
const ovl = (b, list) => { for (const q of list) if (b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]) return true; return false; };
let gCNames = null;
function drawCountryNames() {
  if (!gCNames) gCNames = d3.select(svg.node()).append('g').attr('class', 'cnames').style('pointer-events', 'none');
  gCNames.selectAll('*').remove(); NAMEL = [];
  const me = S.player, occ = [], list = alive().map(id => ({ id, c: S.c[id] })).sort((a, b) => b.c.pop - a.c.pop);
  for (const { id, c } of list) {
    const t = mainTid(id); if (!t || !TERR[t]) continue;
    const p = TERR[t].c; if (GLOBE && gFront(p) < 0.15) continue;
    const s = toScreen(p); if (!s || !(s[0] > 0 && s[1] > 40 && s[0] < W && s[1] < H - 30)) continue;
    const fs = clamp(8 + Math.log10(c.pop + 1) * 4.2, 9, 19) * (id === me ? 1.15 : 1), w = c.he.length * fs * 0.55, h = fs * 1.1;
    const box = [s[0] - w / 2, s[1] - h / 2, s[0] + w / 2, s[1] + h / 2];
    if (id !== me && occ.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    occ.push(box);
    const el = gCNames.append('text').attr('x', s[0]).attr('y', s[1]).attr('font-size', fs)
      .attr('class', id === me ? 'me' : me && atWar(id, me) ? 'en' : '').text(c.he).node();
    NAMEL.push({ p, el });
  }
  cnLK = curK;
}
// every frame while the map moves: slide the names with it (cheap — no re-layout until it stops)
let NAMEL = [], cnLK = 0;
function moveCountryNames() {
  if (!NAMEL.length || !gCNames) return;
  const far = GLOBE ? curK < gKfit * 2.4 : curT.k < 2.4;
  if (!far) { gCNames.selectAll('*').remove(); NAMEL = []; return; }
  const sc = Math.sqrt(curK / (cnLK || curK));
  for (const n of NAMEL) {
    if (GLOBE && gFront(n.p) < 0.1) { n.el.style.display = 'none'; continue; }
    const s = toScreen(n.p); if (!s) { n.el.style.display = 'none'; continue; }
    n.el.style.display = ''; n.el.setAttribute('x', s[0]); n.el.setAttribute('y', s[1]);
    n.el.style.transform = sc !== 1 ? 'scale(' + sc + ')' : ''; n.el.style.transformOrigin = s[0] + 'px ' + s[1] + 'px';
  }
}
function drawCities() {
  if (!gCities || !S || !MAP_PROJ) return;
  citiesDirty = false; lastCityDraw = performance.now();
  cityT0 = { x: curT.x, y: curT.y, k: curT.k }; gCities.removeAttribute('transform');
  if (!S.ct || !CITY.length) { CEL.forEach(g => g.remove()); CEL.clear(); return; }
  // far away: no cities at all, only big country names
  const far = GLOBE ? curK < gKfit * 2.4 : curT.k < 2.4;
  if (gMarks) gMarks.selectAll('text').style('display', far ? 'none' : null);
  if (far) { CEL.forEach(g => g.remove()); CEL.clear(); drawCountryNames(); return; }
  if (gCNames) { gCNames.selectAll('*').remove(); NAMEL = []; }
  const me = S.player, k = curT.k;
  // level of detail: world view = capitals of big countries (and ours); zooming in brings smaller cities
  const minP = k < 1.6 ? 1e9 : k < 2.6 ? 5 : k < 4.5 ? 1.8 : k < 8 ? 0.7 : k < 14 ? 0.3 : k < 24 ? 0.12 : 0;
  const cand = [];
  for (const x of CITY) {
    const sx = curT.x + k * x.mx, sy = curT.y + k * x.my;
    if (!(sx > -10 && sy > 30 && sx < W + 10 && sy < H - 20)) continue;
    const st = S.ct[x.id]; if (!st) continue;
    const terr = landOf(x), tc = S.c[terr];
    const mine = !!me && (terr === me || st.o === me), hot = !!me && (st.s > 0 || (!!st.o && st.o !== terr) || (!!terr && atWar(terr, me)));
    let pr;
    if (x.id === selCity) pr = 9e6;
    else if (mine && x.cap && terr === me) pr = 8e6;
    else if (x.cap && (k >= 1.6 || mine || hot || (tc && tc.pop >= 45))) pr = 4e6 + (hot ? 5e5 : 0) + x.pop * 1000 + (tc ? tc.pop : 0);
    else if (x.pop >= minP * (mine || hot ? 0.35 : 1)) pr = (mine ? 2e6 : hot ? 1.5e6 : 1e6) + x.pop * 1000;
    else continue;
    cand.push({ x, st, sx, sy, pr, imp: x.cap || mine || hot });
  }
  cand.sort((a, b) => b.pr - a.pr);
  // what must not be covered: unit icons and the country names
  const occ = [], MB = [];
  if (gMarks) gMarks.selectAll('text').each(function () {
    const tf = this.getAttribute('transform'), fs = +this.getAttribute('font-size') * k, x = curT.x + k * +this.getAttribute('x'), y = curT.y + k * (+this.getAttribute('y') + (tf ? parseFloat(tf.split(',')[1]) || 0 : 0)), w = (this.textContent || '').length * fs * 0.62;
    MB.push([x - w / 2, y - fs * 0.6, x + w / 2, y + fs * 0.6]);
  });
  const max = W < 600 ? 90 : 170, labels = k >= 1.2, seen = new Set(); let n = 0;
  for (const c of cand) {
    if (n >= max) break;
    const x = c.x, r = x.cap ? 6.5 : 3.5, force = c.pr >= 8e6;
    const db = [c.sx - r - 1.5, c.sy - r - 1.5, c.sx + r + 1.5, c.sy + r + 1.5];
    // important cities may sit partly under a unit icon (units stay on top); others make room for the units
    if (!force && (ovl(db, occ) || (!c.imp && (ovl(db, UBOX) || ovl(db, MB))))) continue;
    occ.push(db); n++;
    const name = cityName(x), tw = textW(name, x.cap) + 4, th = x.cap ? 15 : 13, anc = x.port && k >= 3, ax = anc ? 7 : 0;
    let lb = null;
    if (labels) for (const [dx, dy] of [[r + 3 + ax + tw / 2, 0], [-(r + 3 + tw / 2), 0], [0, -(r + 8)], [0, r + 8.5]]) {
      const b = [c.sx + dx - tw / 2, c.sy + dy - th / 2, c.sx + dx + tw / 2, c.sy + dy + th / 2];
      if (b[0] < 2 || b[2] > W - 2 || ovl(b, occ) || ovl(b, UBOX) || ovl(b, MB)) continue;
      lb = [dx, dy]; occ.push(b); break;
    }
    const st = c.st, terr = landOf(x), id = x.id;
    const cls = 'ci ' + cityCls(st) + (x.cap ? ' cap' : '') + (id === selCity ? ' sel' : '') + ((st.d || 0) >= 15 ? ' dm' : '');
    let inner = '<circle class="h" r="' + (x.cap ? 14 : 12) + '"/>';
    if (id === selCity) inner += '<circle class="rs" r="' + (r + 5.5) + '"/>';
    if (st.s > 0) inner += '<circle class="sg" r="' + (r + 3.5) + '"/>';
    if (st.o && st.o !== terr) inner += '<circle class="oc" r="' + (r + 2.3) + '"/>';
    inner += x.cap ? '<use href="#ci-star" x="-7.5" y="-7.5" width="15" height="15"/>' : '<circle class="d" r="3.4"/>';
    if (anc) inner += '<use class="anc" href="#ci-anc" x="' + (r - 0.5) + '" y="0" width="8" height="8"/>';
    if (lb) inner += '<text x="' + lb[0].toFixed(1) + '" y="' + lb[1].toFixed(1) + '">' + esc(name) + '</text>';
    let g = CEL.get(id);
    if (!g) { g = sEl('g', { 'data-ci': id }); gCities.appendChild(g); CEL.set(id, g); }
    setA(g, 'class', cls); setA(g, 'transform', 'translate(' + c.sx.toFixed(1) + ',' + c.sy.toFixed(1) + ')');
    if (g.__in !== inner) { g.innerHTML = inner; g.__in = inner; }
    seen.add(id);
  }
  CEL.forEach((g, id) => { if (!seen.has(id)) { g.remove(); CEL.delete(id); } });
}
function onCityTap(id) {
  const x = CITYI[id]; if (!x || !S || !S.ct) return;
  // on the start screen a city simply picks its country
  if (!S.player) { const o = landOf(x); if (o) { startPick(o); zoomToTid(mainTid(o) || o, 8); } return; }
  if (uMode) { cityModeTap(x); return; }
  openCity(id, 0);
}
function openCity(id, k) {
  const x = CITYI[id]; if (!x) return;
  selCity = id; selected = null; if (selUnit || fanIds) { selUnit = null; fanIds = null; unitsDirty = true; }
  recolor(); openTabFresh('city'); drawCities();
  setTimeout(() => {
    const s = toScreen(cityPt(x)), [vx0, vy0, vx1, vy1] = visibleRect();
    if (k > curK || !s || s[0] < vx0 + 30 || s[0] > vx1 - 30 || s[1] < vy0 + 30 || s[1] > vy1 - 30) zoomToGeo(cityPt(x), Math.max(curK, k || 0));
  }, 40);
}
// a city tapped while choosing a destination or a target for a unit
function cityModeTap(x) {
  const u = unitById(uMode.uid); if (!u) { endMode(); return; }
  const kind = uMode.kind, st = cst(x), o = st.o, terr = landOf(x);
  if (kind === 'strike' || kind === 'missile') {
    if (!o || o === S.player || terr === S.player) { toast('בחר עיר של מדינה זרה', true); return; }
    endMode(); unitStrike(u, o, kind === 'strike' ? 'air' : 'mis', x.id); return;
  }
  const enemy = !!o && o !== S.player && !isAlly(o, S.player);
  if (domOf(u) === 'sea') { const p = snapSea(cityPt(x)); if (!p) { toast('אין ים ליד העיר הזו', true); return; } orderTo(u, p, enemy ? 'atk' : 'move'); return; }
  orderTo(u, cityStand(x), enemy || kind === 'attack' ? 'atk' : 'move', x.id);
}
function cityStatus(x, st) {
  const terr = landOf(x);
  if (st.o && terr && st.o !== terr) return { t: 'כבושה בידי ' + nm(st.o), c: st.o === S.player ? 'ok' : terr === S.player ? 'bad' : 'warn' };
  if (st.s > 0 && st.b) return { t: 'במצור של ' + nm(st.b), c: st.o === S.player ? 'bad' : st.b === S.player ? 'ok' : 'warn' };
  if ((st.d || 0) >= 5) return { t: 'נפגעה בהפצצות', c: 'warn' };
  return { t: 'שקטה', c: 'ok' };
}
const sortCities = l => l.slice().sort((a, b) => (b.cap - a.cap) || (b.pop - a.pop));
function cityRows(list, max) {
  if (!list.length) return '';
  return '<div class="ulist">' + list.slice(0, max).map(x => {
    const s = cityStatus(x, cst(x));
    return '<button data-act="selcity" data-ci="' + esc(x.id) + '">' + (x.cap ? '<span class="cstar">★</span>' : '<span class="cdot"></span>') + '<b>' + esc(cityName(x)) + '</b><small>' + popTxt(x.pop) + ' · <span class="' + s.c + '">' + esc(s.t) + '</span>' + ((cst(x).d || 0) >= 5 ? ' · נזק ' + pct(cst(x).d) : '') + '</small></button>';
  }).join('') + '</div>' + (list.length > max ? '<p class="sub">ועוד ' + num(list.length - max) + ' ערים — הגדל את המפה כדי לראות אותן.</p>' : '');
}
// one city's card: who holds it, its state and what we can do there
function cityForces(x) {
  const me = S.player, o = cst(x).o, p = cityPt(x); let my = 0, en = 0, myS = 0, enS = 0;
  for (const u of S.units || []) { if (domOf(u) !== 'land' || u.dest || km([u.lon, u.lat], p) > CR_KM) continue; if (u.o === me) { my++; myS += uStr(u); } else if (o && (u.o === o ? o !== me : atWar(u.o, me))) { en++; enS += uStr(u); } }
  return { my, en, myS, enS };
}
const fortCost = x => Math.max(0.05, P().gdp * 0.0008) * ((cst(x).f || 0) + 1) * (x.cap ? 1.5 : 1);
const cadCost = x => Math.max(0.1, P().gdp * 0.0015) * (x.cap ? 1.3 : 1);
function viewCity() {
  const x = CITYI[selCity]; if (!x || !S.ct) return '<p class="hint">העיר לא נמצאה.</p>';
  const st = cst(x), me = S.player, terr = landOf(x), o = st.o, T = S.c[terr], stt = cityStatus(x, st), F = cityForces(x);
  let h = '<h2>' + (x.cap ? '<span class="cstar">★</span> ' : '') + esc(cityName(x)) + ' <small>' + esc(terr ? nm(terr) : 'שטח ללא שליטה') + (terr === me ? ' · שלך' : '') + '</small></h2>';
  h += '<div class="chips">' + (x.cap ? chip('עיר בירה', 'orange') : '') + (x.port ? chip('⚓ נמל', 'blue') : '') + chip(esc(stt.t), stt.c) + (x.gen ? chip('מיקום משוער') : '') + '</div>';
  const defs = [(st.f ? 'ביצורים ' + num(st.f) + '/3' : ''), (st.a ? 'הגנה אווירית' : '')].filter(Boolean).join(' · ') || 'אין';
  h += '<div class="grid">' +
    '<div><small>תושבים (כולל הפרברים)</small>' + popTxt(x.pop) + '</div>' +
    '<div><small>חלק מאוכלוסיית המדינה</small>' + (T ? pct(Math.min(100, x.pop / Math.max(0.01, T.pop) * 100)) : '—') + '</div>' +
    '<div><small>בשליטת</small>' + esc(o ? nm(o) : '—') + (o === me ? ' (אתה)' : '') + '</div>' +
    '<div><small>נזק מהפצצות</small><span class="' + ((st.d || 0) >= 15 ? 'bad' : '') + '">' + pct(st.d || 0) + '</span></div>' +
    '<div><small>הגנות העיר</small>' + defs + '</div>' +
    '<div><small>כוח מגן מקומי</small>' + num(garrison(x, st)) + '</div>' +
    '<div><small>יחידות שלנו בעיר</small>' + num(F.my) + (F.my ? ' <small>(עוצמה ' + num(F.myS) + ')</small>' : '') + '</div>' +
    '<div><small>יחידות אויב בעיר</small><span class="' + (F.en ? 'bad' : '') + '">' + num(F.en) + '</span>' + (F.en ? ' <small>(עוצמה ' + num(F.enS) + ')</small>' : '') + '</div></div>';
  if (st.s > 0 && st.b) {
    const sf = siegeForces(x), rate = sf.aS >= sf.dS * 1.5 ? siegeRate(x, st, sf.aS, sf.dS) : 100 / siegeDays(x, st);
    const left = Math.max(1, Math.ceil((100 - st.s) / Math.max(0.1, rate)));
    const rr = '<p class="sub">יחס כוחות בעיר: <b>' + '<span class="num" dir="ltr">' + (st.b === me ? ratioTxt(sf.aS, sf.dS) : ratioTxt(sf.dS, sf.aS)) + '</span></b></p>';
    h += '<div class="front"><div class="fl"><small>מצור של ' + esc(nm(st.b)) + '</small><div class="prog ' + (st.b === me ? 'g' : 'r') + '"><div style="width:' + clamp(st.s, 0, 100).toFixed(0) + '%"></div></div>' + pct(st.s) + '</div></div>' +
      '<p class="sub">' + (st.b === me ? 'אם הכוחות שלנו יישארו חזקים מהמגינים (פי <span class="num">1.5</span>) — העיר תיפול בעוד כ-' + (left === 1 ? 'יום אחד' : num(left) + ' ימים') + '.' : 'אם לא נחזק את העיר — היא תיפול בעוד כ-' + (left === 1 ? 'יום אחד' : num(left) + ' ימים') + '.') + '</p>' + rr;
  }
  if (st.lg && terr === me) h += '<p class="sub">הכיבוש עולה לכלכלה שלנו ' + money(st.lg) + ' בשנה. שחרור העיר יחזיר את רובו.</p>';
  h += '<div class="btns">';
  const need = Math.round(1.5 * (F.enS + garrison(x, st)));
  if (o && o !== me && terr !== me) {
    const inW = atWar(o, me), sr = strikeRange(o);
    h += btn('csend', inW ? 'שלח כוחות לכבוש' : 'שלח כוחות (הכרזת מלחמה)', 'danger', ' data-ci="' + esc(x.id) + '"');
    const acd = cdLeft('air:' + o), mcd = cdLeft('mis:' + o);
    h += !sr.air ? '<button class="b" disabled>הפצצת העיר<small class="cost">אין מטוסים בטווח</small></button>' : acd ? '<button class="b" disabled>הפצצת העיר' + cdNote(acd) + '</button>' : fbtn('cair', 'הפצצת העיר מהאוויר', cityStrikeFx(o, 'air', x, inW), 'danger', false, ' data-ci="' + esc(x.id) + '"');
    h += !sr.mis ? '<button class="b" disabled>מטח טילים על העיר<small class="cost">' + (P().mlv ? 'מחוץ לטווח או אין טילים' : 'אין תוכנית טילים') + '</small></button>' : mcd ? '<button class="b" disabled>מטח טילים על העיר' + cdNote(mcd) + '</button>' : fbtn('cmis', 'מטח טילים על העיר', cityStrikeFx(o, 'mis', x, inW), 'danger', false, ' data-ci="' + esc(x.id) + '"');
    if (P().nukes > 0) h += sr.nuke ? '<button class="b nuke" data-act="cnuke" data-ci="' + esc(x.id) + '">פצצה גרעינית על העיר<small class="cost">כ-' + num(nukeCityEst(x)) + ' הרוגים · העולם ' + sgn(-50) + '</small></button>' : '';
  } else if (o && o !== me && terr === me) {
    h += btn('csend', 'שלח כוחות לשחרר את העיר', 'primary', ' data-ci="' + esc(x.id) + '"');
  } else if (o === me) {
    h += btn('csend', terr === me ? 'שלח כוחות להגן' : 'שלח תגבורת לעיר', '', ' data-ci="' + esc(x.id) + '"');
    if (terr === me) {
      const q = S.p.queue, fq = q.some(v => v.k === 'cfort' && v.ci === x.id), aq = q.some(v => v.k === 'cad' && v.ci === x.id);
      h += (st.f || 0) >= 3 ? '<button class="b" disabled>ביצורים<small class="cost">ברמה המרבית</small></button>' : fq ? '<button class="b" disabled>ביצורים<small class="cost">בבנייה</small></button>' :
        fbtn('cfort', 'בנה ביצורים (רמה ' + ((st.f || 0) + 1) + ')', { cost: fortCost(x), note: '2 חודשים · כוח מגן <span class="num" dir="ltr">+60%</span> · מצור איטי יותר' }, '', false, ' data-ci="' + esc(x.id) + '"');
      h += st.a ? '<button class="b" disabled>הגנה אווירית<small class="cost">כבר מוצבת</small></button>' : aq ? '<button class="b" disabled>הגנה אווירית<small class="cost">בהצבה</small></button>' :
        fbtn('cad', 'הצב הגנה אווירית', { cost: cadCost(x), note: '4 חודשים · חצי מההרוגים בתקיפות על העיר' }, '', false, ' data-ci="' + esc(x.id) + '"');
    }
  }
  if (terr && terr !== me) h += btn('cgo', 'המדינה: ' + esc(nm(terr)), '', ' data-ci="' + esc(x.id) + '"');
  h += '</div>';
  if (o && o !== me && terr !== me) h += '<p class="sub">כדי לכבוש: הכנס לעיר כוחות יבשה חזקים פי <span class="num">1.5</span> לפחות מהמגינים (כוח מקומי ' + num(need) + ' + יחידות אויב שבעיר). אז מתחיל מצור, ואחרי כמה ימים העיר נופלת. תקיפה על העיר הורגת הרבה אזרחים — על מטרות צבאיות (בכרטיס המדינה) הרבה פחות.</p>';
  return h;
}
function cityStrikeFx(o, kind, x, inW) {
  const E = S.c[o], st = cst(x), n = kind === 'air' ? sortie() : salvo() * (1 - [0, 0.25, 0.5, 0.75][E.adv]);
  const civ = cityCiv(x, kind, n, st.a);
  const rep = -clamp(6 + Math.sqrt(civ) / 3, 6, 35) + (inW ? 0 : justified(o) ? -3 : -10);
  const e = { cost: strikeCost(kind), rep: Math.round(rep), ap: P().gov === 'democracy' ? (inW ? -2 : -3) : -1, rel: { [o]: inW ? -20 : -50 }, civ };
  e.note = '<span class="bad">כ-' + num(civ) + ' אזרחים ייהרגו</span>' + (inW ? '' : ' · סיכוי למלחמה: ' + pct(Math.min(0.95, retaliateChance(o) + 0.2) * 100));
  return e;
}
const nukeCityEst = x => { const T = S.c[landOf(x)]; return Math.round(Math.min(T ? T.pop * 0.3 : 1e9, x.pop * clamp(0.22 / (1 + x.pop / 8), 0.06, 0.25), 2.6) * 1e6); };
function cityStrikeDialog(x, kind, u) {
  const st = cst(x), o = st.o;
  if (!o || o === S.player || landOf(x) === S.player) { toast('אי אפשר לתקוף את העיר הזו', true); return; }
  const inW = atWar(o, S.player), e = cityStrikeFx(o, kind, x, inW);
  modal({ title: (kind === 'air' ? 'הפצצת ' : 'מטח טילים על ') + esc(cityName(x)), cls: 'danger', html: '<div class="nukewarn"><p><b>זו תקיפה על עיר מאוכלסת</b> (' + cityPopT(x) + ' תושבים) — לא על מטרות צבאיות.</p><ul class="plain">' +
    '<li class="red">צפויים כ-' + num(e.civ) + ' אזרחים הרוגים, ופי שלושה פצועים' + (st.a ? ' (יש בעיר הגנה אווירית — פחות נפגעים)' : '') + '.</li>' +
    '<li>העיר תיהרס חלקית, והכלכלה של ' + esc(nm(landOf(x))) + ' תיפגע לזמן רב.</li>' +
    '<li class="red">העולם יגנה: המוניטין שלך ' + sgn(e.rep) + (inW ? '' : '. ' + esc(nm(o)) + ' עלולה להכריז עלינו מלחמה') + '.</li>' +
    '<li>לצבא שלהם זה כמעט לא מזיק — תקיפה על מטרות צבאיות (מכרטיס המדינה) פוגעת בצבא הרבה יותר, עם מעט נפגעים אזרחיים.</li></ul></div><div class="box">צפוי: ' + fxLine(e) + '</div>',
    buttons: [{ label: 'תקוף את העיר', cls: 'danger', fn: () => strike(o, kind, u ? u.id : null, x.id) }, { label: 'ביטול', cls: 'primary' }] });
}
// send our units to a city: to take it, free it or defend it
function citySendDialog(x) {
  if (!x) return;
  const st = cst(x), me = S.player, own = st.o === me, p = cityStand(x), mode = own ? 'def' : 'atk';
  const list = unitsOf(me).filter(u => domOf(u) !== 'sea' && km([u.lon, u.lat], cityPt(x)) > CR_KM * 0.6)
    .map(u => ({ u, r: planMove(u, p, mode) })).filter(v => !v.r.err)
    .sort((a, b) => (domOf(a.u) === 'land' ? 0 : 1) - (domOf(b.u) === 'land' ? 0 : 1) || a.r.days - b.r.days).slice(0, 8);
  const F = cityForces(x), need = Math.round(1.5 * (F.enS + garrison(x, st)));
  const h = '<p>' + (own ? 'אילו יחידות לשלוח להגן על ' : 'אילו יחידות לשלוח אל ') + '<b>' + esc(cityName(x)) + '</b>?</p>' +
    (own ? '' : '<p class="sub">כדי לכבוש צריך בעיר כוח יבשה של לפחות ' + num(need) + ' (פי <span class="num">1.5</span> מהמגינים). כרגע יש שם ' + num(F.myS) + ' שלנו. מטוסים ומסוקים בסביבה מחזקים את כוחות היבשה.</p>') +
    (list.length ? '<div class="btns col">' + list.map((v, i) => '<button class="b" data-cu="' + i + '">' + uIc(v.u) + ' ' + esc(uName(v.u)) + ' · ' + esc(uLabel(v.u)) +
      '<small class="cost">עוצמה ' + num(uStr(v.u)) + ' · ' + (v.r.days < 1 ? 'מגיעה תוך פחות מיום' : 'הגעה בעוד ' + daysTxt(v.r.days)) + (v.r.slow < 1 ? ' · דרך הים' : '') + '</small></button>').join('') + '</div>' : '<p class="sub">אין יחידות שיכולות להגיע לשם עכשיו (כוחות יבשה צריכים דרך ביבשה, או צי שלך ליד היעד).</p>');
  const go = sel => {
    const doIt = () => { let n = 0; sel.forEach(v => { if (!S.units.includes(v.u)) return; const r = planMove(v.u, p, mode); if (r.err) return; r.cty = x.id; commitMove(v.u, r, true); v.u.man = S.day + 30; n++; });
      if (n) toast((n === 1 ? uName(sel[0].u) + ' בדרך ל' : n + ' יחידות בדרך ל') + cityName(x)); save(); renderAll(); };
    const nw = sel.map(v => v.r.needWar).find(Boolean);
    if (nw) confirmWar(nw, doIt, 'הכוחות שלנו'); else doIt();
  };
  modal({ title: own ? 'הגנה על ' + esc(cityName(x)) : 'יציאה אל ' + esc(cityName(x)), html: h,
    buttons: (list.length > 1 ? [{ label: 'שלח את כולן', cls: own ? 'primary' : 'danger', fn: () => go(list) }] : []).concat([{ label: 'ביטול' }]), onShow: () => {
      document.querySelectorAll('[data-cu]').forEach(b => b.onclick = () => { const v = list[+b.dataset.cu]; modalQ.shift(); $('#modal').classList.remove('open'); go([v]); setTimeout(showModal, 30); });
    } });
}
function cityBuild(x, k) {
  if (!x || cst(x).o !== S.player || landOf(x) !== S.player) return;
  const st = cst(x); if (k === 'cfort' ? (st.f || 0) >= 3 : st.a) return;
  if (S.p.queue.some(v => v.k === k && v.ci === x.id)) return;
  const cost = k === 'cfort' ? fortCost(x) : cadCost(x); if (!spend(cost)) return;
  PS().sp.buy += cost; S.p.queue.push({ k, ci: x.id, n: 1, start: S.day, due: S.day + (k === 'cfort' ? 61 : 122) });
  toast((k === 'cfort' ? 'בניית ביצורים ב' : 'הצבת הגנה אווירית ב') + cityName(x) + ' התחילה · ' + plainT(moneyTxt(cost))); save(); renderAll();
}

/* ---- choosing a destination / target on the map ---- */
const MODE_TXT = { move: 'הקש על היעד במפה', attack: 'הקש על המדינה לתקוף', strike: 'הקש על מדינה לתקיפה אווירית', missile: 'הקש על מדינה למטח טילים' };
function setMode(kind, uid) {
  const u = unitById(uid); if (!u) return;
  uMode = { kind, uid };
  $('#mv-txt').textContent = uName(u) + ': ' + MODE_TXT[kind] + (isDesk() ? ' (או קליק ימני · Esc לביטול)' : '');
  $('#mvbar').classList.add('on'); document.body.classList.add('mv');
  // close the panel but keep the unit selected, so the whole map is free for choosing
  tab = null; $('#sheet').classList.remove('open');
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('on'));
  unitsDirty = true;
}
function endMode() { uMode = null; $('#mvbar').classList.remove('on'); document.body.classList.remove('mv'); unitsDirty = true; }
function modeTap(p, tid) {
  if (!uMode || !p) return;
  const u = unitById(uMode.uid); if (!u) { endMode(); return; }
  const kind = uMode.kind;
  if (kind === 'strike' || kind === 'missile') {
    const o = tid ? S.owner[tid] : ownerAt(p[0], p[1]);
    if (!o || o === S.player || !S.c[o] || !S.c[o].alive) { toast('בחר מדינה זרה', true); return; }
    endMode(); unitStrike(u, o, kind === 'strike' ? 'air' : 'mis'); return;
  }
  let dest = p;
  if (kind === 'attack') {
    const o = tid ? S.owner[tid] : ownerAt(p[0], p[1]);
    if (!o || o === S.player) { toast('בחר מדינה זרה', true); return; }
    if (domOf(u) !== 'sea') dest = nearIn(o, [u.lon, u.lat]) || p;
  }
  orderTo(u, dest, kind === 'attack' ? 'atk' : 'move');
}
function orderTo(u, dest, mode, cty) {
  const r = planMove(u, dest, mode);
  if (r.err) { toast(r.err, true); return false; }
  r.cty = cty || null;
  endMode();
  // the player's own order: the defence minister leaves this unit alone for a month
  const go = () => { commitMove(u, r); u.man = S.day + 30; save(); if (u.o === S.player) selectUnit(u.id); };
  if (r.needWar) confirmWar(r.needWar, go, uName(u));
  else go();
  return true;
}
function unitStrike(u, o, kind, ci) {
  if (ci && CITYI[ci]) { cityStrikeDialog(CITYI[ci], kind, u); return; }
  const inW = atWar(o, S.player);
  if (inW) { strike(o, kind, u.id); return; }
  const e = strikeFx(o, kind, false);
  modal({ title: (kind === 'air' ? 'תקיפה אווירית' : 'מטח טילים') + ' על ' + esc(nm(o)), cls: 'danger', html: '<p>אנחנו לא במלחמה עם ' + esc(nm(o)) + '. תקיפה בלי מלחמה תרגיז את העולם, ו' + esc(nm(o)) + ' עלולה להכריז עלינו מלחמה.</p><div class="box">צפוי: ' + fxLine(e) + '</div>',
    buttons: [{ label: 'תקוף', cls: 'danger', fn: () => strike(o, kind, u.id) }, { label: 'ביטול' }] });
}

/* ================= animations: strikes, explosions, battles ================= */
// one canvas over the map; effects live in map coordinates (lon/lat) so they follow panning and zooming.
// Nothing is drawn while no effect is running, and battle effects only appear while the clock runs.
let fxCv = null, fxCx = null, fxDpr = 1, FXL = [], fxDirty = false, fxHold = 0, sitesT = 0, SITES = [], scorchDirty = true, gScorch = null, hitUntil = 0;
const HIT = new Map(), FLT = new Map(), FX_MAX = 80;
let FXMODE = (() => {
  try { const v = localStorage.getItem('world2026_fx'); if (v === 'full' || v === 'low' || v === 'off') return v; } catch (e) { /* no storage */ }
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'low' : 'full'; } catch (e) { return 'full'; }
})();
function setFxMode(v) {
  FXMODE = v; try { localStorage.setItem('world2026_fx', v); } catch (e) { /* no storage */ }
  FXL = v === 'off' ? [] : v === 'low' ? FXL.filter(f => f.one) : FXL; fxDirty = true;
  gStars(); drawDeco();
}
function initFx() {
  if (fxCv) fxCv.remove();
  fxCv = document.createElement('canvas'); fxCv.id = 'fxcv'; fxCv.setAttribute('aria-hidden', 'true');
  $('#map').appendChild(fxCv);
  fxDpr = Math.min(2, window.devicePixelRatio || 1);
  fxCv.width = Math.round(W * fxDpr); fxCv.height = Math.round(H * fxDpr);
  fxCx = fxCv.getContext('2d'); fxDirty = true;
}
const fxZ = () => clamp(0.8 + Math.log2(Math.max(1, curK)) * 0.11, 0.8, 1.45);
// add an effect; ambient (battle) effects are dropped when there are already many, one-shot strike effects never are
function fxAdd(e) {
  if (FXMODE === 'off' || !fxCx) return null;
  if (!e.one && (FXMODE !== 'full' || FXL.length > FX_MAX * 0.7)) return null;
  if (FXL.length > FX_MAX * 1.5) { const i = FXL.findIndex(f => !f.one); FXL.splice(i >= 0 ? i : 0, 1); }
  e.t0 = performance.now() + (e.delay || 0);
  FXL.push(e); return e;
}
const jit = s => [(R() - 0.5) * 2 * s, (R() - 0.5) * 2 * s];
const fxBoom = (p, r, o) => fxAdd(Object.assign({ k: 'boom', p, r, dur: 700 + r * 20, sm: r > 7 }, o || {}));
function fxNum(p, n, o) { if (n < 0.5) return; fxAdd(Object.assign({ k: 'num', p, txt: '−' + Math.round(n).toLocaleString('en-US'), dur: 1900, col: '#ff6b6b' }, o || {})); }
function fxPos(e, p) { const s = toScreen(p || e.p); return s ? [s[0] + (e.o ? e.o[0] : 0), s[1] + (e.o ? e.o[1] : 0)] : null; }
// where a strike is launched from: the unit itself, the nearest unit that can do it, or the nearest part of the country
function launchPt(owner, kind, tgt, su) {
  if (su) return [su.lon, su.lat];
  const mt = mainTid(owner), home = mt && TERR[mt] ? TERR[mt].c : [0, 0];
  const ref = nearIn(tgt, home) || home;
  const us = (S.units || []).filter(u => u.o === owner && (kind === 'air' ? (u.m.air || 0) >= 1 || (u.m.carriers || 0) >= 1 : (u.m.msl || 0) >= 1));
  if (us.length) { const u = us.sort((a, b) => km([a.lon, a.lat], ref) - km([b.lon, b.lat], ref))[0]; return [u.lon, u.lat]; }
  return nearIn(owner, ref) || home;
}
// what gets hit: enemy units in their own land if any, otherwise a place inside the country near the launcher
function targetPt(o, lp) {
  const eu = (S.units || []).filter(u => u.o === o && u.at === o && domOf(u) !== 'sea');
  if (eu.length) { const u = eu.sort((a, b) => km([a.lon, a.lat], lp) - km([b.lon, b.lat], lp))[0]; return [u.lon, u.lat]; }
  const pts = []; tidsOf(o).forEach(t => tp(t).in.forEach(p => pts.push(p)));
  if (!pts.length) return TERR[mainTid(o)] ? TERR[mainTid(o)].c : lp;
  pts.sort((a, b) => km(a, lp) - km(b, lp));
  return pick(pts.slice(0, Math.min(6, pts.length)));
}
// the main city: the point of the main territory closest to its centre
function nukePt(o) { const t = mainTid(o); if (!t) return [0, 0]; const c = TERR[t].c; return tp(t).in.slice().sort((a, b) => km(a, c) - km(b, c))[0] || c; }
// bring a strike into view (keeps the zoom when possible) when it would happen off screen
function fxReveal(a, b) {
  if (!svg || uMode || !MAP_PROJ) return;
  const [vx0, vy0, vx1, vy1] = visibleRect(), sb = toScreen(b), m = 30;
  if (sb && sb[0] > vx0 + m && sb[0] < vx1 - m && sb[1] > vy0 + m && sb[1] < vy1 - m) return;
  if (GP) { const ang = d3.geoDistance(a, b); globeTo(d3.geoInterpolate(a, b)(0.5), clamp(Math.min(curK, 0.7 * Math.min(vx1 - vx0, vy1 - vy0) / Math.max(1, ang * GR)), gKfit, 40), 500); return; }
  const pa = MAP_PROJ(a), pb = MAP_PROJ(b); if (!pa || !pb) return;
  const dx = Math.abs(pa[0] - pb[0]), dy = Math.abs(pa[1] - pb[1]);
  const k = clamp(Math.min(curK, 0.7 * (vx1 - vx0) / Math.max(1, dx), 0.7 * (vy1 - vy0) / Math.max(1, dy)), 1.2, 40);
  zoomToMapPt([(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], k);
}
function holdFor(ms) { fxHold = Math.max(fxHold, performance.now() + ms); }
// an air strike or missile salvo, ours or the enemy's, ending with the result card
function fxStrike(kind, lp, tp_, used, r) {
  // (a strike ordered by the defence minister on his own does not grab the screen: it is in his report)
  const show = (r.by === S.player && !r.min) || r.at === S.player;
  const card = d => { if (show) setTimeout(() => showCard(r), d); };
  if (FXMODE === 'off' || !fxCx) { card(0); return; }
  if ((r.by === S.player && !r.min) || performance.now() - (fxStrike.pan || 0) > 25000) { fxStrike.pan = performance.now(); fxReveal(lp, tp_); }
  const z = fxZ(), kd = killed(r.cas), en = r.by !== S.player;
  if (FXMODE === 'low') { fxBoom(tp_, 14 * z, { one: 1, delay: 450 }); fxNum(tp_, kd, { one: 1, delay: 650 }); card(900); if (show) holdFor(1200); return; }
  const delay = 560; // let the camera arrive first
  const a = toScreen(lp), b = toScreen(tp_), dpx = a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 300;
  if (kind === 'air') {
    const nj = clamp(Math.round(used / 12), 2, 4), leg = clamp(dpx / 260, 0.7, 1.6) * 1000, dur = leg * 2 / 0.9;
    for (let i = 0; i < nj; i++) {
      const last = i === nj - 1;
      fxAdd({ k: 'jet', one: 1, p0: lp, p1: tp_, dur, delay: delay + i * 110, o: [(i % 2 ? 1 : -1) * Math.ceil(i / 2) * 9, Math.ceil(i / 2) * 7], en,
        drop: () => { for (let j = 0; j < 3; j++) fxBoom(tp_, (8 + R() * 5) * z, { one: 1, o: jit(16 * z), delay: j * 120 }); if (last) fxNum(tp_, kd, { one: 1, delay: 300 }); } });
    }
    const hit = delay + (nj - 1) * 110 + dur * 0.5;
    card(hit + 900); if (show) holdFor(Math.min(2500, hit + 1000));
  } else {
    const n = clamp(Math.round(used / 10), 2, 6), dur = clamp(dpx / 330, 0.8, 1.8) * 1000;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1, o2 = jit(14 * z);
      fxAdd({ k: 'arc', one: 1, p0: lp, p1: tp_, o0: jit(6), o1: o2, h: 0.32 + R() * 0.12, dur, delay: delay + i * 150, w: 2.4, trail: 1, col: en ? '#ff8a8a' : '#ffe9a8',
        end: () => { fxBoom(tp_, 12 * z, { one: 1, o: o2 }); if (last) fxNum(tp_, kd, { one: 1, o: [0, -8] }); } });
    }
    const hit = delay + (n - 1) * 150 + dur;
    card(hit + 600); if (show) holdFor(Math.min(2500, hit + 800));
  }
}
function fxNuke(lp, pt, r) {
  const show = r.by === S.player || r.at === S.player;
  const card = d => { if (show) setTimeout(() => showCard(r), d); };
  if (FXMODE === 'off' || !fxCx) { card(0); return; }
  fxReveal(lp, pt);
  const boom = () => {
    fxAdd({ k: 'nuke', one: 1, p: pt, dur: 5200 });
    fxNum(pt, killed(r.cas), { one: 1, delay: 900, dur: 2600, big: 1 });
    if (FXMODE === 'full') {
      const f = $('#flash'); if (f) { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
      const m = $('#map'); if (m) { m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake'); }
    }
  };
  if (FXMODE === 'low') { boom(); card(1500); holdFor(2000); return; }
  const a = toScreen(lp), b = toScreen(pt), dpx = a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 300, dur = clamp(dpx / 300, 0.9, 1.8) * 1000;
  fxAdd({ k: 'arc', one: 1, p0: lp, p1: pt, h: 0.45, dur, delay: 560, w: 3.4, trail: 1, col: '#ffffff', end: boom });
  card(560 + dur + 2200); holdFor(560 + dur + 3200);
}
// a unit took losses: its icon shakes and flashes red (at most every 1.2 s)
function markHit(u) {
  if (FXMODE !== 'full') return;
  const now = performance.now(), h = HIT.get(u.id) || 0;
  if (now - h < 1200) return;
  HIT.set(u.id, now + 450); hitUntil = now + 450;
}
// a running count of the dead floats up from the fighting (not more than every ~1.5 s per war)
function battleFloat(w, n) {
  if (FXMODE !== 'full' || !(n > 0) || !MAP_PROJ) return;
  const now = performance.now(), f = FLT.get(w.id) || { t: 0, n: 0 };
  f.n += n; FLT.set(w.id, f);
  const lead = S.player && (w.a === S.player || w.b === S.player);
  if (now - f.t < (lead ? 1500 : 2600) || f.n < 1) return;
  let p = null;
  if (lead) {
    const E = enemyLeaderFor(w, S.player);
    const u = S.units.find(x => x.o === S.player && x.at === E && domOf(x) === 'land') || S.units.find(x => x.o === E && x.at === S.player && domOf(x) === 'land');
    p = u && [u.lon, u.lat];
  } else if (!involvesPlayer(w)) p = warMark(w);
  f.t = now;
  if (!p) return;
  const s = toScreen(p);
  if (s && s[0] > 0 && s[1] > 0 && s[0] < W && s[1] < H) fxNum(p, f.n, { o: [jit(10)[0], -14], col: lead ? '#ff9d9d' : '#ffc58a', sm: 1 });
  f.n = 0;
}
// places where fighting is going on right now (only what is on screen)
function fxSites() {
  SITES = [];
  if (!S.units) return;
  const onScr = p => { const q = toScreen(p); return q && q[0] > -20 && q[1] > -20 && q[0] < W + 20 && q[1] < H + 20; };
  for (const u of S.units) {
    if (SITES.length >= 14) break;
    if (u.dest) continue;
    const p = [u.lon, u.lat];
    if (!onScr(p) || !uFighting(u)) continue;
    if (domOf(u) === 'sea') {
      // where a fleet shoots at: the nearest enemy coast (remembered for a few seconds)
      let c = SHIPT.get(u.id);
      if (!c || c.lon !== u.lon || c.lat !== u.lat || S.day - c.d > 5) {
        const en = warsOf(u.o).filter(w => w.pause === 0).map(w => enemyLeaderFor(w, u.o)).find(x => S.c[x] && S.c[x].alive && distToC(x, p) < 600);
        let best = null, bd = 1e9; if (en) for (const t of tidsOf(en)) for (const q of tp(t).edge) { const d = km(q, p); if (d < bd) { bd = d; best = q; } }
        c = { lon: u.lon, lat: u.lat, d: S.day, tgt: best }; SHIPT.set(u.id, c);
      }
      if (c.tgt) SITES.push({ p, ship: 1, tgt: c.tgt, en: u.o !== S.player });
    } else {
      let foe = null, fd = 1e9;
      for (const e of S.units) { if (e.o === u.o || e.at !== u.at || domOf(e) !== 'land') continue; const d = Math.abs(e.lon - u.lon) + Math.abs(e.lat - u.lat); if (d < fd) { fd = d; foe = e; } }
      SITES.push({ p, art: u.t === 'art' || (u.m.art || 0) >= 20, foe: foe ? [foe.lon, foe.lat] : null, en: u.o !== S.player });
    }
  }
  S.wars.forEach(w => { if (SITES.length >= 14 || w.pause > 0 || involvesPlayer(w)) return; const mk = warMark(w); if (mk && onScr(mk)) SITES.push({ p: mk, ai: 1 }); });
}
const SHIPT = new Map();
function fxAmbient(dt) {
  const z = fxZ(), sp = clamp(0.75 + S.speed * 0.15, 0.9, 2) * dt;
  for (const s of SITES) {
    const rate = s.ai ? 0.8 : 1.5;
    if (R() < rate * sp) fxBoom(s.p, (s.ai ? 4 : 5) * z + R() * 3, { o: jit((s.ai ? 9 : 13) * z), dur: 420 + R() * 300, sm: R() < 0.35 });
    if (R() < (s.ai ? 1.2 : 2.6) * sp) fxAdd({ k: 'spark', p: s.p, o: jit(12 * z), a: R() * 6.283, dur: 230, en: s.en });
    if (s.art && R() < 0.55 * sp) { const o1 = s.foe ? jit(8) : jit(30 * z), t = s.foe || s.p; fxAdd({ k: 'arc', p0: s.p, p1: t, o0: [0, -4], o1, h: 0.5, dur: 650, w: 1.6, col: '#ffd27a', end: () => fxBoom(t, 6 * z, { o: o1, dur: 500 }) }); }
    if (s.ship && R() < 0.5 * sp) { const o1 = jit(8); fxAdd({ k: 'arc', p0: s.p, p1: s.tgt, o1, h: 0.25, dur: 700, w: 1.6, col: '#bfe4ff', end: () => fxBoom(s.tgt, 6 * z, { o: o1, dur: 520 }) }); }
  }
}
function fxFrame(t, dt) {
  if (!fxCx || !S || !S.player) return;
  const run = S.speed > 0 && !modalOpen() && !S.over;
  if (run && FXMODE === 'full') { if (t - sitesT > 450) { sitesT = t; fxSites(); } if (SITES.length) fxAmbient(dt); }
  const trails = run && FXMODE === 'full' && S.units && S.units.some(u => u.dest);
  if (!FXL.length && !trails) {
    if (fxDirty) { fxCx.setTransform(1, 0, 0, 1, 0, 0); fxCx.clearRect(0, 0, fxCv.width, fxCv.height); fxDirty = false; }
    return;
  }
  fxDraw(t, trails); fxDirty = true;
}
const circ = (c, s, r) => { c.beginPath(); c.arc(s[0], s[1], Math.max(0.1, r), 0, 6.2832); c.fill(); };
const ring = (c, s, r) => { c.beginPath(); c.arc(s[0], s[1], Math.max(0.1, r), 0, 6.2832); c.stroke(); };
function qPt(a, m, b, u) { const v = 1 - u; return [v * v * a[0] + 2 * v * u * m[0] + u * u * b[0], v * v * a[1] + 2 * v * u * m[1] + u * u * b[1]]; }
function fxDraw(now, trails) {
  const c = fxCx, z = fxZ();
  c.setTransform(fxDpr, 0, 0, fxDpr, 0, 0); c.clearRect(0, 0, W, H);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.direction = 'ltr';
  if (trails) {
    // a short fading trail behind units on the move
    c.lineWidth = 3;
    for (const u of S.units) {
      if (!u.dest || u.px == null) continue;
      const a = toScreen([u.px, u.py]), b = toScreen(uPos(u)); if (!a || !b) continue;
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 3 || d > 400) continue;
      const g = c.createLinearGradient(a[0], a[1], b[0], b[1]), col = u.o === S.player ? '245,179,1' : '255,107,107';
      g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + col + ',0.55)');
      c.strokeStyle = g; c.globalAlpha = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  }
  // effects added by callbacks during this pass land in the new FXL
  const list = FXL, keep = []; FXL = [];
  for (const e of list) {
    if (now < e.t0) { keep.push(e); continue; }
    const k = (now - e.t0) / e.dur;
    if (k >= 1) { if (e.drop && !e.dropped) { e.dropped = 1; e.drop(); } if (e.end && !e.ended) { e.ended = 1; e.end(); } continue; }
    keep.push(e);
    c.globalAlpha = 1;
    switch (e.k) {
      case 'boom': {
        const s = fxPos(e); if (!s) break; const r = e.r;
        if (k < 0.3) { c.globalAlpha = 1 - k / 0.3; c.fillStyle = '#fff4c4'; circ(c, s, r * (0.55 + k * 1.8)); c.fillStyle = '#ff8c2a'; circ(c, s, r * (0.35 + k)); }
        c.globalAlpha = 0.9 * (1 - k); c.strokeStyle = '#ffc56b'; c.lineWidth = 1.6; ring(c, s, r * (0.4 + 1.6 * k));
        if (e.sm) { c.globalAlpha = 0.5 * (1 - k); c.fillStyle = '#5c6068'; for (let j = -1; j <= 1; j++) circ(c, [s[0] + j * r * 0.45, s[1] - r * (0.3 + 0.9 * k) - Math.abs(j) * r * 0.2], r * (0.3 + 0.45 * k)); }
        break;
      }
      case 'spark': {
        const s = fxPos(e); if (!s) break;
        c.globalAlpha = 1 - k; c.strokeStyle = e.en ? '#ffb3b3' : '#fff0a8'; c.lineWidth = 1.3;
        for (let j = 0; j < 3; j++) { const a = e.a + j * 2.1, l0 = 2 + 9 * k, l1 = l0 + 4; c.beginPath(); c.moveTo(s[0] + Math.cos(a) * l0, s[1] + Math.sin(a) * l0); c.lineTo(s[0] + Math.cos(a) * l1, s[1] + Math.sin(a) * l1); c.stroke(); }
        break;
      }
      case 'arc': {
        if (GP) { gArc(c, e, k); break; }
        let a = toScreen(e.p0), b = toScreen(e.p1); if (!a || !b) break;
        if (e.o0) a = [a[0] + e.o0[0], a[1] + e.o0[1]];
        if (e.o1) b = [b[0] + e.o1[0], b[1] + e.o1[1]];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - Math.max(18, d * e.h)];
        const u = 0.6 * k + 0.4 * k * k; // speeds up on the way down
        if (e.trail) {
          const n = 9, u0 = Math.max(0, u - 0.35);
          c.lineWidth = e.w * 0.9; c.strokeStyle = '#d9dde3';
          let prev = qPt(a, m, b, u0);
          for (let j = 1; j <= n; j++) { const q = qPt(a, m, b, u0 + (u - u0) * j / n); c.globalAlpha = 0.5 * j / n; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke(); prev = q; }
        }
        const h = qPt(a, m, b, u);
        c.globalAlpha = 0.35; c.fillStyle = e.col; circ(c, h, e.w * 2.2);
        c.globalAlpha = 1; circ(c, h, e.w);
        break;
      }
      case 'jet': {
        let a = toScreen(e.p0), b = toScreen(e.p1); if (!a || !b) break;
        a = [a[0] + e.o[0], a[1] + e.o[1]]; b = [b[0] + e.o[0] * 0.6, b[1] + e.o[1] * 0.6];
        const d0 = Math.atan2(b[1] - a[1], b[0] - a[0]);
        let p, dir;
        if (k < 0.45) { const f = k / 0.45; p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; dir = d0; }
        else if (k < 0.55) {
          const f = (k - 0.45) / 0.1, s2 = Math.sin(f * Math.PI) * 10;
          dir = d0 + f * Math.PI; p = [b[0] + Math.cos(d0 + Math.PI / 2) * s2, b[1] + Math.sin(d0 + Math.PI / 2) * s2];
          if (k >= 0.5 && e.drop && !e.dropped) { e.dropped = 1; e.drop(); }
        } else { const f = (k - 0.55) / 0.45; p = [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f]; dir = d0 + Math.PI; }
        c.globalAlpha = k > 0.9 ? (1 - k) / 0.1 : 1;
        c.save(); c.translate(p[0], p[1]); c.rotate(dir); c.scale(z, z);
        c.fillStyle = e.en ? '#ffb0b0' : '#eef3f8'; c.strokeStyle = '#0b0f14'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(9, 0); c.lineTo(1, -2); c.lineTo(-2, -8); c.lineTo(-4, -8); c.lineTo(-3, -2); c.lineTo(-7, -2.5); c.lineTo(-8, -4.5); c.lineTo(-9, -4.5); c.lineTo(-8, 0);
        c.lineTo(-9, 4.5); c.lineTo(-8, 4.5); c.lineTo(-7, 2.5); c.lineTo(-3, 2); c.lineTo(-4, 8); c.lineTo(-2, 8); c.lineTo(1, 2); c.closePath(); c.fill(); c.stroke();
        c.restore();
        break;
      }
      case 'nuke': {
        const s = fxPos(e); if (!s) break; const Rr = 46 * z;
        if (k < 0.1) { c.globalAlpha = 1 - k / 0.1; c.fillStyle = '#ffffff'; circ(c, s, Rr * (0.6 + k * 8)); }
        if (k < 0.55) {
          const f = 1 - k / 0.55;
          c.globalAlpha = f * 0.8; c.strokeStyle = '#ffe1a8'; c.lineWidth = 3 * (1 - k) + 1; ring(c, s, Rr * (0.3 + 4.5 * k));
          c.globalAlpha = f * 0.3; c.lineWidth = 8; ring(c, s, Rr * (0.2 + 4.2 * k));
        }
        const rise = Math.min(1, k / 0.3), fade = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1, top = [s[0], s[1] - Rr * 1.15 * rise];
        c.globalAlpha = 0.9 * fade; c.fillStyle = '#7a5a48';
        c.beginPath(); c.moveTo(s[0] - Rr * 0.12, s[1]); c.lineTo(top[0] - Rr * 0.08, top[1]); c.lineTo(top[0] + Rr * 0.08, top[1]); c.lineTo(s[0] + Rr * 0.12, s[1]); c.closePath(); c.fill();
        c.fillStyle = '#8f7f76'; c.save(); c.translate(s[0], s[1]); c.scale(1, 0.35); circ(c, [0, 0], Rr * (0.35 + 0.4 * rise)); c.restore();
        const cr = Rr * (0.22 + 0.3 * rise);
        c.fillStyle = '#a3633b';
        [[-1, 0.2], [1, 0.2], [0, -0.35], [-0.55, -0.15], [0.55, -0.15]].forEach(([dx, dy]) => circ(c, [top[0] + dx * cr * 0.95, top[1] + dy * cr], cr * 0.75));
        c.fillStyle = k < 0.3 ? '#ffb347' : '#c9805a'; circ(c, [top[0], top[1] - cr * 0.1], cr * 0.6);
        break;
      }
      case 'num': {
        const s = fxPos(e); if (!s) break;
        const fs = (e.big ? 20 : e.sm ? 11.5 : 14) * z;
        c.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        c.font = '800 ' + fs.toFixed(1) + 'px "Segoe UI",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 3.5; c.strokeStyle = '#0b0f14'; const y = s[1] - 16 - 30 * k;
        c.strokeText(e.txt, s[0], y); c.fillStyle = e.col; c.fillText(e.txt, s[0], y);
        break;
      }
    }
  }
  c.globalAlpha = 1;
  FXL = keep.concat(FXL);
}
// lasting burn marks where nuclear weapons hit (drawn on the map itself, so they scale with it)
function drawScorch() {
  if (!gScorch || !MAP_PROJ || !S) return;
  scorchDirty = false;
  gScorch.selectAll('*').remove();
  (S.scorch || []).filter(x => x.d > S.day).forEach(x => {
    const p = MAP_PROJ(x.p), q = MAP_PROJ([x.p[0] + 0.6, x.p[1]]); if (!p || !q) return;
    const r = Math.max(1.5, Math.abs(q[0] - p[0]));
    gScorch.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', r * 1.7).attr('fill', 'url(#scorchG)');
    gScorch.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', r * 0.4).attr('fill', '#1a0d08').attr('opacity', 0.85);
  });
}
/* ---- result card after a strike ---- */
const plainT = t => String(t).replace(/[⁦⁩]/g, '');
function cardHtml(r) {
  const mine = r.by === S.player, C = r.cas;
  const tl = r.k === 'nuke' ? (mine ? '☢ תוצאות התקיפה הגרעינית' : '☢ פיצוץ גרעיני') : mine ? 'תוצאות התקיפה' : r.at === S.player ? 'תקפו אותנו!' : 'תקיפה';
  let h = '<div class="rc-h"><b>' + tl + '</b><button class="ic" data-act="rclose" aria-label="סגור">✕</button></div>';
  h += '<div class="rc-s">' + esc(KIND_HE[r.k]) + (mine ? ' על ' + esc(nm(r.at)) : ' של ' + esc(nm(r.by)) + (r.at === S.player ? '' : ' על ' + esc(nm(r.at)))) +
    (r.unit ? ' · ' + esc(r.unit) : '') + (mine && r.k !== 'nuke' && !r.war ? ' · בלי הכרזת מלחמה' : '') + ' · ' + dayHtml(r.d) + '</div>';
  if (r.k !== 'fac') h += '<div class="rc-l"><b>המטרה:</b> ' + (r.cn ? '<span class="bad">העיר ' + esc(r.cn) + '</span> — אזרחים' + (r.cd >= 0.5 ? ' · נזק לעיר ' + pct(r.cd) : '') : 'בסיסים ומטרות צבאיות') + '</div>';
  h += '<div class="rgrid"><div><small>חיילים הרוגים</small>' + num(C.sk) + '</div><div><small>חיילים פצועים</small>' + num(C.sw) + '</div>' +
    '<div><small>אזרחים הרוגים</small><span class="' + (C.ck >= 1 ? 'bad' : '') + '">' + num(C.ck) + '</span></div><div><small>אזרחים פצועים</small>' + num(C.cw) + '</div></div>';
  const eq = eqTxt(C.eq);
  h += '<div class="rc-l"><b>' + (mine || r.at !== S.player ? 'הושמדו:' : 'נפגעו אצלנו:') + '</b> ' + (eq ? isoNums(plainT(eq)) : 'בסיסים ותשתיות, בלי ציוד משמעותי') + '</div>';
  const o = r.own || {}, bits = [];
  if (r.k === 'mis' && o.mu) bits.push((mine ? 'שוגרו ' : 'הם שיגרו ') + num(o.mu) + ' טילים');
  if (r.k === 'air' && r.used) bits.push((mine ? 'יצאו לתקיפה ' : 'תקפו ') + num(r.used) + ' מטוסים');
  if (o.eq && o.eq.air) bits.push(mine ? '<span class="bad">' + (Math.round(o.eq.air) === 1 ? 'נפל מטוס אחד שלנו' : 'נפלו ' + num(o.eq.air) + ' מטוסים שלנו') + '</span>' : (Math.round(o.eq.air) === 1 ? 'יירטנו מטוס אחד שלהם' : 'יירטנו ' + num(o.eq.air) + ' מטוסים שלהם'));
  if (mine && o.sp) bits.push('עלות ' + money(o.sp));
  if (C.dm >= 0.001) bits.push((r.at === S.player ? 'נזק כלכלי לנו ' : 'נזק כלכלי להם ') + money(C.dm));
  if (bits.length) h += '<div class="rc-l">' + bits.join(' · ') + '</div>';
  if (r.fx && r.fx.length) h += '<div class="chips">' + r.fx.map(t => chip(isoNums(esc(plainT(t))), /[−-]\d/.test(plainT(t)) ? 'bad' : 'ok')).join('') + '</div>';
  if (r.retal) h += '<div class="warnbox">' + esc(nm(r.at)) + ' הגיבה והכריזה עלינו מלחמה!</div>';
  if (r.sanc) h += '<div class="rc-l bad">' + esc(sancTxt(r.sanc)) + '</div>';
  h += '<button class="lnk" data-act="stats">כל הסטטיסטיקות ←</button>';
  return h;
}
function showCard(r) {
  const el = $('#rcard'); if (!el || !S || !S.player) return;
  el.innerHTML = cardHtml(r); el.className = 'on' + (r.at === S.player ? ' bad' : '');
  document.body.classList.add('rc');
  // on a phone with the panel open: the card and one toast under it must both fit above the panel's header
  el.style.maxHeight = '';
  const sh = $('#sheet');
  if (W < 900 && sh && sh.classList.contains('open')) {
    const top = el.getBoundingClientRect().top, room = sh.getBoundingClientRect().top - top - 58;
    if (room < el.offsetHeight) el.style.maxHeight = Math.max(120, room) + 'px';
  }
  document.documentElement.style.setProperty('--rcH', el.offsetHeight + 'px');
  clearTimeout(showCard.t); showCard.t = setTimeout(hideCard, r.k === 'nuke' ? 16000 : 11000);
}
function hideCard() { const el = $('#rcard'); if (el) el.className = ''; document.body.classList.remove('rc'); clearTimeout(showCard.t); }

/* ================= UI ================= */
let tab = null;
function renderAll() {
  if (!S || !S.player) return;
  sancDirty();
  syncAllUnits();
  renderTop(); recolor(); if (tab) renderSheet();
  drawUnits();
}
const setH = (sel, h, cls) => { const e = $(sel); if (!e) return; if (e.__h !== h) { e.innerHTML = h; e.__h = h; } if (cls != null && e.className !== cls) e.className = cls; };
function renderTop() {
  const c = P(); if (!c) return;
  const ap = c.approval, rp = S.p.rep;
  setH('#t-date', dayHtml(S.day));
  setH('#t-money', money(S.p.treasury, true), 'v' + (S.p.treasury < 0 ? ' bad' : ''));
  setH('#t-ap', pct(ap), 'v ' + (ap < 30 ? 'bad' : ap < 45 ? 'warn' : 'ok'));
  setH('#t-rep', num(rp), 'v ' + (rp < 25 ? 'bad' : rp < 45 ? 'warn' : 'ok'));
  setH('#t-army', num(power(c)));
  setH('#t-nuke', num(c.nukes));
  setH('#t-score', num(score()));
  setH('#t-name', esc(c.he));
  { const nb = $('#t-name'); if (nb) nb.classList.toggle('long', c.he.length > 8); }
  document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.v === S.speed));
  const n = S.wars.filter(involvesPlayer).length;
  const b = $('#tabwars'); if (b && b.dataset.badge !== String(n || '')) b.dataset.badge = n || '';
  const ub = $('#urgbtn'); if (ub) { const l = urgentItems(), v = l.length; const sv = v ? String(v) : ''; if (ub.dataset.badge !== sv) ub.dataset.badge = sv; ub.classList.toggle('hot', l.some(x => x.cls === 'bad')); }
  const bh = $('#tabhome'); if (bh) { const v = S.p.proj.length ? String(S.p.proj.length) : ''; if (bh.dataset.badge !== v) bh.dataset.badge = v; }
}
function openTab(t) {
  tab = (tab === t && t !== 'country' && t !== 'unit' && t !== 'ulist' && t !== 'stats' && t !== 'world' && t !== 'city') ? null : t;
  if (tab !== 'unit' && selUnit) { selUnit = null; unitsDirty = true; }
  if (tab !== 'city' && selCity) { selCity = null; citiesDirty = true; }
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === (tab === 'world' ? 'news' : tab)));
  $('#sheet').classList.toggle('open', !!tab);
  if (tab) renderSheet();
  if (tab === 'country' && S && S.player) setTimeout(keepSelVisible, 60);
}
// the panel must not hide the country we are looking at: pan the map (same zoom) so it shows above the panel
function keepSelVisible() {
  if (tab !== 'country' || !MAP_PROJ || uMode) return;
  const t = selected || mainTid(S.player); const T = t && TERR[t]; if (!T) return;
  // where the player tapped (a big country stays put), else the country's middle
  const ll = keepSelVisible.t === t && keepSelVisible.p ? keepSelVisible.p : T.c, q = MAP_PROJ(ll); keepSelVisible.p = null;
  if (GP) { if (gAnim) return; const s = toScreen(ll), [vx0, vy0, vx1, vy1] = visibleRect(), m = 30; if (!s || s[0] < vx0 + m || s[0] > vx1 - m || s[1] < vy0 + m || s[1] > vy1 - m) globeTo(ll, curK, 500); return; }
  if (!q) return;
  const s = [curT.x + curK * q[0], curT.y + curK * q[1]], [vx0, vy0, vx1, vy1] = visibleRect(), m = 30;
  if (s[0] < vx0 + m || s[0] > vx1 - m || s[1] < vy0 + m || s[1] > vy1 - m) zoomToMapPt(q, curK);
}
function renderSheet() {
  const el = $('#sheet-body'); if (!el) return;
  const fn = { urgent: viewUrgent, country: viewCountry, eco: viewEco, home: viewHome, gov: viewGov, mil: viewMil, wars: viewWars, news: viewNews, world: viewWorld, unit: viewUnit, ulist: viewUnitList, stats: viewStats, city: viewCity }[tab];
  const h = fn ? fn() : '';
  if (el.__h !== h) { el.innerHTML = h; el.__h = h; }
}
function openTabFresh(t) { openTab(t); const b = $('#sheet-body'); if (b) b.scrollTop = 0; }
function chip(txt, cls) { return '<span class="chip ' + (cls || '') + '">' + txt + '</span>'; }
function relBar(r) {
  const w = Math.abs(r) / 2;
  return '<div class="relbar"><div class="mid"></div><div class="fill ' + (r >= 0 ? 'pos' : 'neg') + '" style="' + (r >= 0 ? 'right:50%' : 'left:50%') + ';width:' + w + '%"></div></div>' +
    '<div class="rellbl"><span>עוינות</span><b>' + num(r) + '</b><span>ידידות</span></div>';
}
function statGrid(c) {
  return '<div class="grid">' +
    '<div><small>אוכלוסייה</small>' + popTxt(c.pop) + '</div>' +
    '<div><small>תמ״ג שנתי</small>' + money(c.gdp) + '</div>' +
    '<div><small>עוצמה צבאית</small>' + num(power(c)) + '</div>' +
    '<div><small>חיילים בסדיר</small>' + troopsTxt(c.inv.troops) + '</div>' +
    '<div><small>טנקים · מטוסי קרב</small>' + cnt(c.inv.tanks) + ' · ' + cnt(c.inv.air) + '</div>' +
    '<div><small>ספינות · צוללות</small>' + cnt(c.inv.ships) + ' · ' + cnt(c.inv.subs) + '</div>' +
    '<div><small>תקציב ביטחון</small>' + money(c.def) + '</div>' +
    '<div><small>ראשי נפץ גרעיניים</small>' + num(c.nukes) + '</div>' +
    '<div><small>משטר</small>' + GOV_HE[c.gov] + '</div>' +
    '<div><small>תמיכת העם</small>' + pct(c.approval) + '</div>' +
    '</div>' + (c.blocs.length ? '<div class="blocs">' + c.blocs.map(b => chip(BLOC_HE[b] || b)).join('') + '</div>' : '');
}
// a button with an effect preview line under the label
function fbtn(act, label, e, cls, dis, extra) {
  const line = e ? fxLine(e) : '';
  return '<button class="b ' + (cls || '') + '" data-act="' + act + '"' + (extra || '') + (dis ? ' disabled' : '') + '>' + label + (line ? '<small class="cost">' + line + '</small>' : '') + '</button>';
}
const cdNote = d => '<small class="cost">אפשר שוב בעוד ' + daysTxt(d) + '</small>';
function viewCountry() {
  if (!selected) { const c = P(); return '<p class="hint">הקש על מדינה במפה כדי לראות אותה ולנהל איתה יחסים.</p><h2><span class="dot me"></span>' + esc(c.he) + ' <small>(המדינה שלך)</small></h2>' + statGrid(c) + myCitiesHtml(); }
  const o = S.owner[selected];
  if (!o) return '<h2>' + esc(nm(selected)) + '</h2><p class="hint">שטח שנוי במחלוקת / לא מיושב. אי אפשר לשלוט בו.</p>';
  const c = S.c[o];
  let h = '';
  if (o !== selected) h += '<p class="hint">' + esc(TERR[selected] && S.c[selected] ? S.c[selected].he : nm(selected)) + ' — שטח בשליטת ' + esc(c.he) + '.</p>';
  if (o === S.player) {
    h += '<h2><span class="dot me"></span>' + esc(c.he) + ' <small>(המדינה שלך)</small></h2>' + statGrid(c);
    if (S.p.annexed.length) h += '<p>שטחים שסופחו: ' + S.p.annexed.map(nm).join(', ') + '</p>';
    return h + myCitiesHtml();
  }
  const r = rel(o, S.player), war = atWar(o, S.player);
  const st = [];
  if (war) st.push(chip('במלחמה איתך', 'red'));
  if (isAlly(o, S.player)) st.push(chip('בעלת ברית', 'blue'));
  if (hasPact(o, S.player, 'nap')) st.push(chip('אי-תוקפנות', 'teal'));
  if (hasPact(o, S.player, 'trade')) st.push(chip('הסכם סחר', 'teal'));
  if (sanctions(S.player, o)) st.push(chip('אתה מטיל סנקציות'));
  if (sanctions(o, S.player)) st.push(chip('מטילה עליך סנקציות', 'red'));
  if (provoked(o)) st.push(chip('תקפה אותך או בעלות בריתך', 'orange'));
  else if (hated(o)) st.push(chip('מבודדת בעולם', 'orange'));
  const ow = warsOf(o).filter(w => !involvesPlayer(w)); if (ow.length) st.push(chip('במלחמה עם ' + ow.map(w => nm(enemyLeaderFor(w, o))).join(', '), 'orange'));
  const d = adjacent(o, S.player) ? 'שכנה (גבול משותף)' : 'מרחק ' + num(dist(o, S.player)) + ' ק״מ';
  h += '<h2>' + esc(c.he) + (c.generated ? ' <small>(נתונים משוערים)</small>' : '') + '</h2><div class="chips">' + st.join('') + '</div>';
  h += relBar(r) + '<p class="sub">' + d + ' · יחס כוחות: ' + (power(P()) >= power(c) ? num(power(P()) / power(c), 1) + ' : 1 לטובתך' : '1 : ' + num(power(c) / power(P()), 1) + ' לטובתם') + '</p>' + statGrid(c);
  h += aiNowHtml(c);
  if (S.ct) { const cl = sortCities(citiesOfT(o)); if (cl.length) h += '<h3>ערים <small>(' + num(cl.length) + ')</small></h3>' + cityRows(cl, 6); }
  if (!war) {
    h += '<h3>דיפלומטיה</h3><div class="btns">';
    const g = giftAmt(), gcd = cdLeft('gift:' + o);
    h += gcd ? '<button class="b" disabled>שלח סיוע הומניטרי' + cdNote(gcd) + '</button>' : fbtn('gift', 'שלח סיוע הומניטרי', { cost: g, rep: giftRep(o), rel: { [o]: giftRel(o) } });
    const pcd = cdLeft('dip:' + o);
    const tog = (type, on, offL, onL, eOn, eOff) => on ? fbtn(type, offL, eOff, '', false) : (pcd ? '<button class="b" disabled>' + onL + cdNote(pcd) + '</button>' : fbtn(type, onL, Object.assign({ note: 'אם יסכימו' }, eOn)));
    h += tog('trade', hasPact(o, S.player, 'trade'), 'בטל הסכם סחר', 'הצע הסכם סחר', { rep: 2, rel: { [o]: 8 } }, { rep: -1, rel: { [o]: -10 } });
    h += tog('nap', hasPact(o, S.player, 'nap'), 'בטל אי-תוקפנות', 'הסכם אי-תוקפנות', { rep: 1, rel: { [o]: 6 } }, { rep: -3, rel: { [o]: -12 } });
    h += tog('alliance', hasPact(o, S.player, 'alliance'), 'בטל ברית', 'בקש ברית צבאית', { rel: { [o]: 12 } }, { rep: -4, rel: { [o]: -20 } });
    const scd = cdLeft('sanc:' + o);
    h += scd ? '<button class="b" disabled>סנקציות' + cdNote(scd) + '</button>' :
      sanctions(S.player, o) ? fbtn('sanction', 'הסר סנקציות', { rel: { [o]: 6 } }) : fbtn('sanction', 'הטל סנקציות', { rep: sancRep(o), rel: { [o]: -20 } });
    h += fbtn('war', 'הכרז מלחמה', warFx(o), 'danger');
    h += '</div>' + peaceButtons(o) + covertButtons(o) + unButton(o);
    h += strikeSection(o, null);
  } else {
    const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
    h += '<div class="btns"><button class="b" data-act="gotowars">עבור ללשונית מלחמות</button></div>';
    if (w && enemyLeaderFor(w, S.player) === o) h += unitFront(w, o);
    if (w) h += warActions(w, true, o);
    h += covertButtons(o);
  }
  return h;
}
// our cities (biggest first) with their state, and the cities we took
function myCitiesHtml() {
  if (!S.ct) return '';
  const me = S.player, l = sortCities(citiesOfT(me)), took = sortCities(CITY.filter(x => cst(x).o === me && landOf(x) !== me));
  const lost = l.filter(x => cst(x).o !== me).length;
  let h = '<h3>הערים שלך <small>(' + num(l.length) + (lost ? ' · ' + num(lost) + ' בידי האויב' : '') + ')</small></h3>' + cityRows(l, 12);
  if (took.length) h += '<h3>ערים שכבשנו <small>(' + num(took.length) + ')</small></h3>' + cityRows(took, 8);
  return h;
}
const btn = (act, label, cls, extra) => '<button class="b ' + (cls || '') + '" data-act="' + act + '"' + (extra || '') + '>' + label + '</button>';
function giftAmt() { return Math.max(0.01, Math.min(P().gdp * 0.0025, 4)); }
const giftRel = o => Math.round(clamp(4 + 300 * giftAmt() / S.c[o].gdp, 3, 20));
const giftRep = o => S.c[o].gdp / S.c[o].pop < 5 ? 3 : S.c[o].gdp / S.c[o].pop < 15 ? 2 : 1;
const sancRep = o => justified(o) ? 1 : S.c[o].gdp < P().gdp * 0.2 ? -4 : -1;
const nukeCost = c => Math.max(0.05, c.gdp * 0.004);
function warFx(o) {
  const j = justified(o), nap = hasPact(o, S.player, 'nap');
  return { rep: (j ? -5 : -15) - (nap ? 10 : 0), ap: j ? 2 : -2, rel: { [o]: -100 } };
}
/* ---- strikes (with or without war) ---- */
function strikeRange(o) {
  const me = P(), d = adjacent(S.player, o) ? 0 : dist(S.player, o);
  const air = me.inv.air >= 4 && (d <= AIR_RANGE || me.inv.carriers >= 1);
  const mis = me.mlv > 0 && me.inv.msl >= 5 && d <= MIS_RANGE[me.mlv];
  return { d, air, mis, nuke: me.nukes > 0 && (mis || me.mlv > 0 && d <= MIS_RANGE[me.mlv] || air) };
}
const sortie = () => clamp(Math.round(P().inv.air * 0.08), 4, 120);
const salvo = () => clamp(Math.round(P().inv.msl * 0.1), 5, 200);
const strikeCost = kind => kind === 'air' ? sortie() * 0.004 : salvo() * 0.0006;
function strikeFx(o, kind, inWarNow) {
  if (inWarNow) return { cost: strikeCost(kind) };
  const j = justified(o);
  const e = { cost: strikeCost(kind), rep: kind === 'air' ? (j ? -3 : -10) : (j ? -2 : -8), ap: j || rel(o, S.player) < -50 ? 1 : -2, rel: { [o]: kind === 'air' ? -35 : -30 } };
  e.note = 'סיכוי למלחמה: ' + Math.round(retaliateChance(o) * 100) + '%';
  return e;
}
function retaliateChance(o) {
  const T = S.c[o], me = P();
  let pr = 0.25;
  const ratio = power(T) * proj(o, S.player) / (power(me) + 1);
  if (ratio > 0.5) pr = 0.6; else if (ratio > 0.2) pr = 0.4;
  if (likelyJoiners(o, S.player).length === 0 && alive().some(c => isAlly(c, o) && power(S.c[c]) > power(me))) pr += 0.15;
  if (T.gov === 'authoritarian') pr *= 1.2;
  return clamp(pr, 0.1, 0.85);
}
function strikeSection(o, w) {
  const me = P(), sr = strikeRange(o), inW = !!w;
  let h = '<h3>תקיפות' + (inW ? '' : ' <small>(בלי להכריז מלחמה)</small>') + '</h3><div class="btns">';
  const acd = cdLeft('air:' + o), mcd = cdLeft('mis:' + o);
  if (!sr.air) h += '<button class="b" disabled>תקיפה אווירית<small class="cost">' + (me.inv.air < 4 ? 'אין מספיק מטוסי קרב' : 'מחוץ לטווח המטוסים (' + num(AIR_RANGE) + ' ק״מ; נושאת מטוסים מגיעה לכל מקום)') + '</small></button>';
  else if (acd) h += '<button class="b" disabled>תקיפה אווירית' + cdNote(acd) + '</button>';
  else h += fbtn('air', 'תקיפה אווירית · ' + sortie() + ' מטוסים', strikeFx(o, 'air', inW), inW ? '' : 'danger', false, ' data-o="' + o + '"');
  if (!sr.mis) h += '<button class="b" disabled>מטח טילים<small class="cost">' + (me.mlv === 0 ? 'אין לך תוכנית טילים' : me.inv.msl < 5 ? 'אין מספיק טילים במלאי' : 'מחוץ לטווח הטילים (' + num(MIS_RANGE[me.mlv]) + ' ק״מ)') + '</small></button>';
  else if (mcd) h += '<button class="b" disabled>מטח טילים' + cdNote(mcd) + '</button>';
  else h += fbtn('missile', 'מטח טילים · ' + salvo() + ' טילים', strikeFx(o, 'mis', inW), inW ? '' : 'danger', false, ' data-o="' + o + '"');
  if (me.nukes > 0) h += sr.nuke ? '<button class="b nuke" data-act="nuke" data-o="' + o + '">תקיפה גרעינית<small class="cost">העולם ' + sgn(-50) + ' · העם ' + sgn(-20) + '</small></button>' : '<button class="b" disabled>תקיפה גרעינית<small class="cost">אין אמצעי שיגור בטווח</small></button>';
  h += '</div>';
  h += '<p class="sub">התקיפות כאן מכוונות לבסיסים ולמטרות צבאיות. לתקיפת עיר — הקש על העיר במפה (הרבה יותר הרוגים אזרחיים ופגיעה קשה במוניטין).</p>';
  if (!inW) h += '<p class="sub">תקיפה בלי מלחמה פוגעת בצבא ובכלכלה שלהם, אבל העולם כועס, בעלות בריתם מתרגזות, אולי יוטלו עליך סנקציות — ו' + esc(nm(o)) + ' עלולה להכריז עליך מלחמה.' + (justified(o) ? ' <b>הם תקפו אותך / מבודדים בעולם — הנזק למוניטין קטן יותר.</b>' : '') + '</p>';
  return h;
}

/* ---- government: the ministers ---- */
const STARS = n => '<span class="stars" aria-label="מיומנות ' + n + ' מתוך 5">' + '★'.repeat(n) + '<i>' + '★'.repeat(Math.max(0, 5 - n)) + '</i></span>';
const POL_UI = {
  def: [['st', 'גישה', [['def', 'הגנה'], ['bal', 'מאוזן'], ['atk', 'התקפה']]], ['buy', 'רכש נשק לבד', [[0, 'בלי'], [1, 'צנוע'], [2, 'נרחב']]], ['mob', 'מילואים בחירום', [[1, 'לגייס'], [0, 'לא לגייס']]]],
  fin: [['goal', 'היעד', [['grow', 'צמיחה'], ['bal', 'איזון'], ['wel', 'רווחה']]]],
  int: [['pri', 'מה לבנות קודם', [['people', 'העם'], ['growth', 'צמיחה'], ['green', 'ירוק']]]],
  fo: [['rep', 'יעד מוניטין', [[50, '50'], [65, '65'], [80, '80']]], ['peace', 'שלום כשהמלחמה רעה', [[1, 'להציע'], [0, 'לא להציע']]]]
};
function minCard(r) {
  const m = minOf(r), D = MIN_R[r];
  if (!m) return '<div class="card mcard"><div class="mh"><b>' + D.he + '</b>' + chip('התפקיד פנוי') + '</div><div class="sub">' + D.d + '</div><div class="btns">' + btn('gappoint', 'מנה שר', 'primary', ' data-r="' + r + '"') + '</div></div>';
  const T = TRAITS[m.tr], ap = minAp(m), last = G().log.find(x => x.r === r);
  let h = '<div class="card mcard"><div class="mh"><b>' + esc(mTitle(r, m)) + '</b>' + STARS(m.sk) + '</div><div class="mn">' + esc(m.n) + '</div>';
  h += '<div class="chips">' + chip(esc(T.he), m.tr === 'corrupt' ? 'red' : m.tr === 'aggr' || m.tr === 'popul' ? 'orange' : 'teal') + chip('העם ' + sgn(ap), ap >= 0.5 ? 'ok' : ap <= -0.5 ? 'bad' : '') + chip('פופולריות ' + pct(m.pop)) + chip(money(m.sal, true) + ' בשנה') + '</div>';
  h += '<div class="sub">' + esc(T.d) + '. ' + D.d + '</div>';
  h += '<div class="seg sm">' + [['1', 'פועל לבד'], ['0', 'רק ממליץ']].map(([v, l]) => '<button class="' + ((m.auto ? '1' : '0') === v ? 'on' : '') + '" data-act="gauto" data-r="' + r + '" data-v="' + v + '">' + l + '</button>').join('') + '</div>';
  POL_UI[r].forEach(([k, lbl, opts]) => {
    h += '<div class="pl"><small>' + lbl + '</small><div class="seg sm">' + opts.map(([v, l]) => '<button class="' + (String(m.pol[k]) === String(v) ? 'on' : '') + '" data-act="gpol" data-r="' + r + '" data-k="' + k + '" data-v="' + v + '">' + l + '</button>').join('') + '</div></div>';
  });
  if (last) h += '<div class="sub last"><small>' + dayHtml(last.d) + '</small> ' + isoNums(esc(last.t)) + '</div>';
  h += '<div class="btns">' + btn('gappoint', 'החלף', '', ' data-r="' + r + '"') + btn('gfire', 'פטר', 'danger', ' data-r="' + r + '"') + '</div></div>';
  return h;
}
// the monthly budget envelopes: how much each minister may still spend this month
function envHtml() {
  const e = envOf(), fm = minOf('fin');
  const bar = (r, l) => { const tot = e[r] || 0, used = Math.min(tot, e.used[r] || 0), w = tot > 0 ? (tot - used) / tot * 100 : 0; // the bar shows what is left
    return '<div class="fl"><small>' + l + '</small><div class="prog' + (w <= 1 ? ' r' : ' g') + '"><div style="width:' + w.toFixed(0) + '%"></div></div><span class="nw">' + money(Math.max(0, tot - used), true) + '</span></div>'; };
  return '<div class="card env"><h3>תקציב השרים לחודש <small class="hint">' + (fm ? 'קובע: ' + esc(mTitle('fin', fm)) : 'אין שר אוצר — חלוקה קבועה') + '</small></h3>' +
    '<div class="front">' + bar('def', 'ביטחון') + bar('int', 'בינוי') + bar('fo', 'חוץ') + '</div>' +
    '<p class="sub">נשאר לכל שר עד סוף החודש. ' + (e.why ? esc(e.why) + '. ' : '') + 'שר לא מוציא כסף שאין: כשהקופה במינוס — אין רכש, פרויקטים או סיוע (חוץ מגיוס חירום כשפולשים אלינו).</p></div>';
}
function viewGov() {
  const g = G();
  let h = '<h2>ממשלה <small>' + num(govN()) + ' מתוך 4 שרים</small></h2>';
  h += '<p class="sub">שר עם <b>"פועל לבד"</b> עושה את העבודה בעצמו לפי המדיניות שבחרת, ומדווח על כל צעד. החלטה שלך תמיד גוברת: שר לא נוגע במה ששינית בעצמך, ואף שר לא מכריז מלחמה.</p>';
  h += '<div class="grid"><div><small>השפעת השרים על העם</small>' + sgn(govAp()) + '</div><div><small>שכר השרים בשנה</small>' + money(govSal()) + '</div></div>';
  h += envHtml();
  MIN_ORDER.forEach(r => { h += minCard(r); });
  h += '<h3>דיווחי השרים</h3>' + (g.log.length ? '<ul class="news blog">' + g.log.slice(0, 20).map(x => '<li class="' + (x.bad ? 'bad' : 'good') + '"><small>' + dayHtml(x.d) + ' · ' + MIN_R[x.r].sh + '</small> ' + isoNums(esc(x.t)) + (x.fx ? ' <small>(' + isoNums(esc(x.fx)) + ')</small>' : '') + '</li>').join('') + '</ul>' : '<p class="sub">עוד אין דיווחים. מנה שרים כדי שיתחילו לעבוד.</p>');
  return h;
}
function appointDialog(r) {
  const l = candsFor(r), D = MIN_R[r], old = minOf(r);
  const h = '<p class="sub">' + D.d + '</p><div class="btns col">' + l.map((m, i) => '<button class="b cand" data-hc="' + i + '"><span class="mh"><b>' + esc(m.n) + '</b>' + STARS(m.sk) + '</span><small class="cost">' + esc(TRAITS[m.tr].he) + ' — ' + esc(TRAITS[m.tr].d) + '<br>שכר ' + money(m.sal) + ' בשנה · העם ' + sgn(minAp(m)) + '</small></button>').join('') + '</div>' +
    '<p class="sub">מיומנות גבוהה = החלטות טובות יותר ותוצאות טובות יותר (ושכר גבוה יותר). "מושחת" גונב מהקופה ועלול לגרום לשערורייה.' + (old ? ' פיטורי השר הנוכחי עולים חצי שנת שכר.' : '') + '</p>';
  modal({ title: (old ? 'החלפת ' : 'מינוי: ') + D.he, html: h, buttons: [{ label: 'ביטול' }], onShow: () => document.querySelectorAll('[data-hc]').forEach(b => b.onclick = () => {
    const m = l[+b.dataset.hc]; modalQ.shift(); $('#modal').classList.remove('open');
    const pol = old ? Object.assign({}, old.pol) : null;
    if (old) fireMin(r, true);
    hireMin(r, m); if (pol) G().m[r].pol = pol;
    toast(mTitle(r, G().m[r]) + ' ' + (m.g === 'f' ? 'מונתה' : 'מונה') + ': ' + m.n + ' (' + TRAITS[m.tr].he + ')');
    save(); renderAll(); setTimeout(showModal, 30);
  }) });
}
/* ---- the world: rankings, trends and what happens out there ---- */
let wRank = 'g';
const pctSg = v => '<span class="num" dir="ltr">' + (Math.abs(v) < 0.0005 ? '' : v > 0 ? '+' : '−') + Math.abs(v * 100).toFixed(1) + '%</span>';
const monthName = day => { const q = dParts(day); return MONTHS[q.m] + ' ' + q.y; };
function growthOf(id) {
  if (id !== S.player) return S.c[id].g || 0;
  const h = S.p.gdpHist; return h.length > 1 ? Math.pow(h[h.length - 1] / h[0], 12 / (h.length - 1)) - 1 : 0.026;
}
function newsSeg(on) { return '<div class="seg">' + [['news', 'מבזקים', 'gonews'], ['world', 'העולם', 'goworld']].map(([k, l, a]) => '<button class="' + (on === k ? 'on' : '') + '" data-act="' + a + '">' + l + '</button>').join('') + '</div>'; }
function viewWorld() {
  const r = ranks(), base = S.wh && S.wh.prev && S.wh.prev.d < S.day ? S.wh.prev : null, list = r[wRank], me = S.player;
  let h = newsSeg('world') + '<h2>העולם <small>דירוג ומגמות</small></h2>';
  h += '<div class="seg sm">' + [['g', 'כלכלה'], ['p', 'עוצמה צבאית'], ['r', 'מוניטין']].map(([k, l]) => '<button class="' + (wRank === k ? 'on' : '') + '" data-act="wrank" data-v="' + k + '">' + l + '</button>').join('') + '</div>';
  const row = (id, i) => {
    const c = S.c[id], pi = base ? base[wRank].indexOf(id) : -2, d = pi === -2 ? 0 : pi < 0 ? null : pi - i;
    const tr = d == null ? '<span class="tr up">חדש</span>' : d > 0 ? '<span class="tr up">▲' + d + '</span>' : d < 0 ? '<span class="tr down">▼' + -d + '</span>' : '<span class="tr">–</span>';
    const v = wRank === 'g' ? money(c.gdp, true) + ' <small class="' + (growthOf(id) < 0 ? 'down' : 'up') + '">' + pctSg(growthOf(id)) + '</small>' : wRank === 'p' ? num(power(c)) : num(repOf(id));
    return '<button class="rkr' + (id === me ? ' me' : '') + '" data-act="wsel" data-id="' + id + '"><span class="n">' + num(i + 1) + '</span><b>' + (id === me ? '<span class="dot me"></span>' : '') + esc(c.he) + '</b><span class="v">' + v + '</span>' + tr + '</button>';
  };
  h += '<div class="rk">' + list.slice(0, 12).map(row).join('');
  const mi = list.indexOf(me);
  if (mi >= 12) h += row(me, mi); else if (mi < 0 && me) h += '<p class="sub">' + esc(P().he) + ' מחוץ ל-40 הראשונות.</p>';
  h += '</div><p class="sub">▲▼ = שינוי בדירוג מאז ' + (base ? dayHtml(base.d) : 'הדירוג הקודם (מתעדכן כל שלושה חודשים)') + '. הקש על מדינה כדי לראות מה קורה בה.</p>';
  const rec = alive().filter(id => S.c[id].cy && S.c[id].cy.k === 'rec').length;
  h += '<h3>מצב העולם</h3><div class="grid g3"><div><small>מלחמות פעילות</small>' + num(S.wars.filter(w => w.pause === 0).length) + '</div><div><small>מדינות במיתון</small>' + num(rec) + '</div><div><small>הכלכלה העולמית</small>' + (S.recession ? '<span class="bad">מיתון</span>' : '<span class="ok">צומחת</span>') + '</div></div>';
  const el = alive().filter(id => id !== me && S.c[id].el && S.c[id].el > S.day && S.c[id].el - S.day < 150 && notable(id)).sort((a, b) => S.c[a].el - S.c[b].el).slice(0, 5);
  if (el.length) h += '<p class="sub">בחירות בקרוב: ' + el.map(id => esc(nm(id)) + ' (' + monthName(S.c[id].el) + ')').join(' · ') + '</p>';
  const wn = S.news.filter(n => n.k === 'world').slice(0, 15);
  h += '<h3>התפתחויות אחרונות</h3>' + (wn.length ? '<ul class="news blog">' + wn.map(n => '<li class="world"><small>' + dayHtml(n.t) + '</small> ' + esc(n.txt) + '</li>').join('') + '</ul>' : '<p class="sub">עוד אין חדשות מהעולם.</p>');
  return h;
}
// what another country is busy with right now (shown in its card)
function aiNowHtml(c) {
  aiInit(c);
  const tags = Object.keys(c.tg || {}).filter(k => c.tg[k] > S.day && TAG_HE[k]).map(k => chip(TAG_HE[k], TAG_CLS[k]));
  const g = c.g || 0;
  let h = '<h3>מה קורה שם</h3><p class="sub">' + (c.gov === 'authoritarian' ? vg(c, 'שליט', 'שליטה') : vg(c, 'מנהיג', 'מנהיגה')) + ': <b>' + esc(c.ld) + '</b> · צמיחה <span class="' + (g < 0 ? 'bad' : 'ok') + '">' + pctSg(g) + '</span>' +
    (c.el && c.gov !== 'authoritarian' && c.el > S.day ? ' · בחירות ב' + monthName(c.el) : '') + '</p>';
  return h + (tags.length ? '<div class="chips">' + tags.join('') + '</div>' : '<p class="sub">שגרה — אין אירועים מיוחדים.</p>');
}

/* ---- economy ---- */
function viewEco() {
  const c = P(), p = S.p, b = p.budget, bd = budgetDay();
  const sh = sanctionHit(S.player);
  const tr = Object.keys(S.pacts).filter(k => S.pacts[k].trade && k.split('|').includes(S.player)).map(k => nm(k.split('|').find(x => x !== S.player)));
  const sancBy = Object.keys(S.sanc).filter(k => k.endsWith('>' + S.player)).map(k => nm(k.split('>')[0]));
  const debt = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  let h = '<h2>כלכלה</h2><div class="grid">' +
    '<div><small>קופת המדינה</small>' + money(p.treasury) + '</div><div><small>תמ״ג שנתי</small>' + money(c.gdp) + '</div>' +
    '<div><small>מאזן יומי</small><span class="' + (bd.net < 0 ? 'bad' : 'ok') + '">' + money(bd.net) + '</span></div>' +
    '<div><small>מאזן חודשי (צפי)</small><span class="' + (bd.net < 0 ? 'bad' : 'ok') + '">' + money(bd.net * DPM) + '</span></div>' +
    '<div><small>חוב מהתמ״ג</small>' + pct(debt * 100) + (p.bankrupt ? ' ' + chip('פשיטת רגל', 'red') : '') + '</div>' +
    '<div><small>נזק מסנקציות</small>' + pct(sh * 100) + '</div></div>';
  h += slider('tax', 'מס הכנסה', p.tax, 0.10, 0.60, 'יותר מס = יותר כסף, אבל העם כועס והצמיחה יורדת');
  h += slider('welfare', 'רווחה לעם (בריאות, חינוך, קצבאות)', p.welfare, 0, 0.35, 'יותר רווחה = עם מרוצה יותר, אבל עולה כסף');
  h += slider('defPct', 'תקציב ביטחון (מהתמ״ג)', p.defPct, 0.005, 0.12, 'יותר תקציב = הצבא גדל ומשלים אבדות. פחות = הצבא מצטמק לאט. בשלום, תקציב גבוה מרגיז את העם');
  h += '<div class="box"><b>תמיכה צפויה של העם: </b><span id="apt">' + pct(approvalTarget()) + '</span> <small class="hint">(עכשיו ' + pct(c.approval) + ' — זז לאט לכיוון הזה)</small></div>';
  if (b) h += '<h3>החודש שעבר</h3><table class="tbl">' +
    row('הכנסות ממסים', b.income) + row('רווחה', -b.welfare) + row('מנהלה ותשתיות', -b.admin) + row('ביטחון', -b.defense) +
    (b.war ? row('עלות מלחמות', -b.war) : '') + (b.interest ? row('ריבית על חוב', -b.interest) : '') + (b.upkeep ? row('אחזקת כוחות נוספים ומילואים', -b.upkeep) : '') +
    (b.nuke ? row('תוכנית גרעין', -b.nuke) : '') + (b.gov ? row('שכר השרים', -b.gov) : '') + '<tr class="tot"><td>סה״כ</td><td>' + money(b.net) + '</td></tr></table>';
  h += '<p class="sub">הכסף נכנס ויוצא כל יום. הסכמי סחר: ' + (tr.length ? tr.join(', ') : 'אין') + '<br>מטילות עליך סנקציות: ' + (sancBy.length ? sancBy.join(', ') : 'אף אחת') + '</p>';
  return h + econSection();
}
const row = (l, v) => '<tr><td>' + l + '</td><td>' + money(v) + '</td></tr>';
function slider(k, label, v, mn, mx, hint) {
  return '<label class="sl"><span>' + label + ': <b id="sv-' + k + '">' + (v * 100).toFixed(k === 'defPct' ? 1 : 0) + '%</b></span>' +
    '<input type="range" dir="ltr" data-slider="' + k + '" min="' + mn * 1000 + '" max="' + mx * 1000 + '" step="5" value="' + Math.round(v * 1000) + '"><small>' + hint + '</small></label>';
}

/* ---- home: domestic policy ---- */
// a skilled construction minister builds cheaper; a corrupt one takes a cut
const projMul = () => { const m = minOf('int'); return m ? 1 - (mSk(m) - 3) * 0.04 + (m.tr === 'corrupt' ? 0.1 : 0) : 1; };
const projCost = k => PROJ[k].cost * P().gdp * Math.pow(1.5, S.p.built[k] || 0) * projMul();
const projMax = k => PROJ[k].max || 3;
function viewHome() {
  const c = P(), p = S.p, T = approvalTarget();
  let h = '<h2>מדיניות פנים</h2><div class="grid">' +
    '<div><small>אהבת העם (עכשיו ← בעתיד)</small><span class="nw"><span class="' + (c.approval < 30 ? 'bad' : c.approval < 45 ? 'warn' : 'ok') + '">' + pct(c.approval) + '</span> ← ' + pct(T) + '</span></div>' +
    '<div><small>מוניטין עולמי</small><span class="' + (p.rep < 25 ? 'bad' : p.rep < 45 ? 'warn' : 'ok') + '">' + num(p.rep) + '</span> / 100</div></div>';
  const why = [];
  if (p.tax > 0.36) why.push('<li class="red">מסים גבוהים (' + pct(p.tax * 100) + ')</li>'); else if (p.tax < 0.24) why.push('<li>מסים נמוכים — העם מרוצה</li>');
  if (p.welfare > 0.17) why.push('<li>רווחה נדיבה</li>'); else if (p.welfare < 0.12) why.push('<li class="red">קיצוץ ברווחה</li>');
  if (warWeariness() > 0) why.push('<li class="red">עייפות ממלחמה (' + num(warWeariness()) + '−)</li>');
  if (c.mob > 0) why.push('<li class="red">מילואים מגויסים — המשפחות רוצות אותם בבית</li>');
  if (p.apBonus) why.push('<li>פרויקטים שהושלמו (+' + num(p.apBonus) + ')</li>');
  const ga = govAp(); if (Math.abs(ga) >= 0.5) why.push('<li' + (ga < 0 ? ' class="red"' : '') + '>השרים בממשלה (' + sgn(ga) + ')</li>');
  const tm = tmSum(p.tm); if (Math.abs(tm) >= 0.5) why.push('<li' + (tm < 0 ? ' class="red"' : '') + '>אירועים אחרונים (' + sgn(tm) + ')</li>');
  if (p.unrest > 0.5) why.push('<li class="red">כעס מצטבר ברחוב</li>');
  if (sanctionHit(S.player) > 0.01) why.push('<li class="red">סנקציות פוגעות בכיס</li>');
  if (why.length) h += '<ul class="plain">' + why.join('') + '</ul>';
  h += '<h3>פרויקטים לאומיים</h3><p class="sub">משלמים מראש, ההשפעה מגיעה כשהפרויקט מסתיים.</p>';
  for (const k in PROJ) {
    const D = PROJ[k];
    if (D.nondem && c.gov === 'democracy') continue;
    const lvl = p.built[k] || 0, run = p.proj.find(q => q.k === k);
    h += '<div class="card"><b>' + D.he + '</b>' + (lvl ? ' ' + chip('נבנה ×' + lvl, 'teal') : '') + '<div class="sub">' + isoNums(D.d) + '</div>';
    if (run) {
      const tot = run.due - run.start, done = clamp((S.day - run.start) / tot, 0, 1);
      h += '<div class="fl"><div class="prog g"><div style="width:' + (done * 100).toFixed(1) + '%"></div></div> <small>עוד ' + daysTxt(run.due - S.day) + '</small></div>';
    } else if (lvl >= projMax(k)) h += '<div class="sub ok">הושלם במלואו</div>';
    else h += '<div class="btns">' + fbtn('build', 'בנה · ' + daysTxt(D.days), { cost: projCost(k), ap: D.ap, rep: D.rep, note: D.g ? 'צמיחה ' + isoNums('+' + (D.g * 100).toFixed(1) + '%') : '' }, 'good', false, ' data-k="' + k + '"') + '</div>';
    h += '</div>';
  }
  if (p.built.police) {
    const ccd = cdLeft('crack');
    h += '<h3>הפגנות</h3>';
    h += ccd ? '<button class="b" disabled>פזר הפגנות בכוח' + cdNote(ccd) + '</button>' :
      fbtn('crack', 'פזר הפגנות בכוח', { ap: 5, rep: c.gov === 'democracy' ? -12 : -7, note: 'שקט ל-3 חודשים' }, 'danger');
    if (p.crack > 0) h += '<p class="sub">המשטרה מדכאת הפגנות — עוד ' + daysTxt(p.crack) + '.</p>';
  }
  h += '<h3>מה משפיע על המוניטין בעולם</h3><ul class="plain"><li>מוריד: תקיפות בלי סיבה, מלחמה בלי סיבה, הפרת הסכמים, נשק גרעיני, סיפוח, דיכוי הפגנות, סנקציות על מדינות חלשות.</li>' +
    '<li>מעלה: סיוע הומניטרי, עזרה באסונות, הסכמי שלום וסחר, קליטת פליטים, אנרגיה ירוקה.</li>' +
    '<li>מוניטין נמוך = יותר סנקציות, סירובים וקואליציות נגדך. גבוה = הסכמים קלים יותר ותמיכה.</li></ul>';
  return missionSection() + factionSection() + h + iniSection();
}

/* ---- military ---- */
let buyMul = 1;
function viewMil() {
  const c = P(), p = S.p;
  const I = c.inv;
  const li = (lbl, v) => '<div><small>' + lbl + '</small>' + v + '</div>';
  let h = '<h2>צבא <small>עוצמה ' + num(power(c)) + '</small></h2><div class="grid">' +
    li('חיילים בסדיר', troopsTxt(I.troops)) + li('מילואים', troopsTxt(c.res) + (c.mob > 0 ? ' <small class="warn">(' + troopsTxt(c.mob) + ' מגויסים)</small>' : '')) +
    li('טנקים', cnt(I.tanks)) + li('נגמ״שים ורק״מ', cnt(I.afv)) +
    li('תותחים וארטילריה', cnt(I.art)) + li('מטוסי קרב', cnt(I.air)) +
    li('מסוקי קרב', cnt(I.heli)) + li('ספינות קרב', cnt(I.ships)) +
    li('צוללות', cnt(I.subs)) + li('נושאות מטוסים', cnt(I.carriers)) +
    li('טילים במלאי', cnt(I.msl) + ' <small>(' + LVL_HE[c.mlv] + (c.mlv ? ', ' + num(MIS_RANGE[c.mlv]) + ' ק״מ' : '') + ')</small>') + li('הגנה אווירית', LVL_HE[c.adv]) +
    li('ראשי נפץ גרעיניים', num(c.nukes)) + li('הרוגים ופצועים במלחמות', num(p.casTotal * 1000)) + '</div>';
  const my = unitsOf(S.player);
  if (my.length) h += '<h3>היחידות שלך על המפה <small class="hint">(' + num(my.length) + ')</small></h3><div class="ulist">' + my.map(unitRow).join('') + '</div><p class="sub">הקש על יחידה (כאן או על המפה) כדי להזיז אותה, לתקוף או להגן.</p>';
  // reserves
  h += '<h3>מילואים</h3><div class="btns">';
  const callN = Math.min(c.res, Math.max(1, c.res * 0.5));
  if (c.mob > 0) h += fbtn('demob', 'שחרר את המילואימניקים הביתה', { ap: 2, note: troopsTxt(c.mob) + ' חוזרים לעבודה' });
  if (c.res >= 1) h += cdLeft('mob') ? '<button class="b" disabled>גייס מילואים' + cdNote(cdLeft('mob')) + '</button>' :
    fbtn('mob', 'גייס ' + troopsTxt(callN) + ' מילואימניקים', { ap: activeWars(S.player) ? -2 : -5, note: 'מגיעים תוך 3 ימים · פוגע בכלכלה' }, 'danger');
  h += '</div>';
  // buying
  h += '<h3>רכש וגיוס</h3><div class="seg" id="buymul">' + [1, 5, 20].map(m => '<button class="' + (buyMul === m ? 'on' : '') + '" data-act="buymul" data-v="' + m + '">×' + m + '</button>').join('') + '</div><div class="btns buy">';
  for (const k in BUY) {
    const B = BUY[k];
    if (B.minGdp && c.gdp < B.minGdp) continue;
    if (B.needMl && c.mlv < B.needMl) continue;
    const n = B.n * buyMul, cost = B.cost * buyMul;
    const lbl = k === 'troops' ? 'גייס ' + num(n * 1000) + ' חיילים' : (buyMul === 1 ? B.he : n + ' ' + B.unit);
    h += fbtn('buy', lbl, { cost, ap: k === 'troops' ? -Math.min(3, buyMul) : 0, note: B.sub.replace(/^.*· /, '') }, '', false, ' data-k="' + k + '"');
  }
  if (c.mlv < 3) h += fbtn('upg', 'שדרג תוכנית טילים לרמה ' + LVL_HE[c.mlv + 1], { cost: upgCost('mlv'), note: 'טווח ' + num(MIS_RANGE[c.mlv + 1]) + ' ק״מ · 18 חודשים' }, '', p.queue.some(q => q.k === 'mlv'), ' data-k="mlv"');
  if (c.adv < 3) h += fbtn('upg', 'שדרג הגנה אווירית לרמה ' + LVL_HE[c.adv + 1], { cost: upgCost('adv'), note: '12 חודשים' }, '', p.queue.some(q => q.k === 'adv'), ' data-k="adv"');
  h += '</div><p class="sub">משלמים עכשיו, הנשק מגיע אחרי זמן הייצור. כל כלי נוסף עולה גם אחזקה שנתית. גיוס ומילואים מורידים מעט את אהבת העם.</p>';
  if (p.queue.length) {
    h += '<h3>בדרך אליך</h3><div class="front">';
    p.queue.slice().sort((a, b) => a.due - b.due).forEach(q => {
      const tot = q.due - q.start, done = clamp((S.day - q.start) / tot, 0, 1);
      const what = q.k === 'mobarrive' ? 'מילואים בדרך' : q.k === 'mlv' ? 'שדרוג טילים' : q.k === 'adv' ? 'שדרוג הגנה אווירית' : q.k === 'cfort' || q.k === 'cad' ? (q.k === 'cfort' ? 'ביצורים ב' : 'הגנה אווירית ב') + esc(CITYI[q.ci] ? cityName(CITYI[q.ci]) : '') : q.k === 'troops' ? num(q.n * 1000) + ' חיילים' : q.n + ' ' + BUY[q.k].unit;
      h += '<div class="fl"><small>' + what + '</small><div class="prog"><div style="width:' + (done * 100).toFixed(1) + '%"></div></div><small class="nw">' + daysTxt(q.due - S.day) + '</small></div>';
    });
    h += '</div>';
  }
  h += '<h3>תוכנית גרעין</h3>';
  if (c.nukes > 0 && !(p.nprog && p.nprog.done)) h += '<p class="sub">יש לך נשק גרעיני. אפשר להשתמש בו מכרטיס של מדינה — במלחמה או בלעדיה — ויגרור תגובה עולמית קשה.</p>';
  else if (!p.nprog) h += '<p class="sub">תוכנית סודית: כ-36 חודשים, עולה כ-' + money(nukeCost(c)) + ' לחודש. אם תיחשף — סנקציות ואולי תקיפות.</p>' + btn('nprog', 'התחל תוכנית גרעין סודית', 'danger');
  else if (!p.nprog.done) h += '<div class="prog"><div style="width:' + (p.nprog.m / 36 * 100) + '%"></div></div><p class="sub">התקדמות: ' + p.nprog.m + ' / 36 חודשים' + (p.nprog.disc ? ' · התוכנית נחשפה!' : ' · עדיין סודית') + '</p>' + btn('nstop', 'עצור את התוכנית');
  else h += '<p class="sub">התוכנית הושלמה. נוסף ראש נפץ כל חצי שנה.</p>';
  return techSection() + h;
}
const upgCost = k => Math.max(0.3, P().gdp * 0.002) * ((P()[k] || 0) + 1) * (k === 'mlv' ? 1.5 : 1);

/* ---- units: panel of one unit, and lists ---- */
const uIc = (u, en) => '<svg class="uic' + (en ? ' en' : '') + '"><use href="#ui-' + uIcon(u) + '"/></svg>';
function uWhere(u) {
  if (domOf(u) === 'sea' && !u.at && S.ct) { const pt = citiesNear([u.lon, u.lat], 150).find(x => x.port && cst(x).o === u.o); if (pt) return 'בנמל ' + cityName(pt); }
  if (domOf(u) === 'sea' && !u.at) { const p = [u.lon, u.lat]; const near = alive().filter(c => { const t = mainTid(c); return t && km(TERR[t].c, p) < 2500; }).map(c => [c, distToC(c, p)]).filter(x => x[1] < 500).sort((a, b) => a[1] - b[1])[0]; return near ? 'בים, מול ' + nm(near[0]) : 'בים הפתוח'; }
  return u.at ? nm(u.at) : (domOf(u) === 'air' ? 'מעל הים' : 'שטח ללא שליטה');
}
function uStateTxt(u) {
  if (u.dest) { const d = etaDays(u), t = d < 1 ? 'מגיעה תוך פחות מיום' : 'עוד ' + daysTxt(d); const to = domOf(u) === 'sea' ? 'ליעד בים' : (ownerAt(u.dest[0], u.dest[1]) ? 'ל' + esc(nm(ownerAt(u.dest[0], u.dest[1]))) : 'ליעד'); return (u.mode === 'ret' ? 'חוזרת הביתה' : 'בתנועה ' + (u.cty && CITYI[u.cty] ? 'אל ' + esc(cityName(CITYI[u.cty])) : to)) + ' · ' + t + (u.slow < 1 ? ' (דרך הים, לאט יותר)' : ''); }
  const cx = u.cty && CITYI[u.cty] && S.ct ? CITYI[u.cty] : null;
  if (cx && km([u.lon, u.lat], cityPt(cx)) <= CR_KM) { const st = cst(cx); if (st.s > 0 && st.b === u.o) return '<span class="bad">במצור</span> על ' + esc(cityName(cx)) + ' · ' + pct(st.s); }
  if (uFighting(u)) return '<span class="bad">בלחימה</span> — ' + esc(domOf(u) === 'sea' ? 'חוסמת את החוף ומגנה על כוחות' : uWhere(u));
  return atHome(u) ? 'בבסיס' : 'ממתינה ב' + esc(uWhere(u));
}
function uRows(u) {
  const ks = Object.keys(u.m).filter(k => u.m[k] >= 0.5 || (k === 'troops' && u.m[k] > 0.001));
  return '<div class="grid">' + ks.map(k => '<div><small>' + INV_HE[k] + '</small>' + (k === 'troops' ? troopsTxt(u.m[k]) : cnt(u.m[k])) + '</div>').join('') +
    '<div><small>עוצמה</small>' + num(uStr(u)) + '</div><div><small>מיקום</small>' + esc(uWhere(u)) + '</div></div>';
}
const enemiesAtWar = () => [...new Set(warsOf(S.player).filter(w => w.pause === 0).flatMap(w => w.A.includes(S.player) ? w.B : w.A))].filter(x => S.c[x] && S.c[x].alive);
function mergeables(u) { return S.units.filter(x => x !== u && x.o === u.o && domOf(x) === domOf(u) && !x.dest && km([x.lon, x.lat], [u.lon, u.lat]) < 80); }
function viewUnit() {
  const u = unitById(selUnit);
  if (!u) return '<p class="hint">היחידה כבר לא קיימת.</p>';
  const mine = u.o === S.player, dom = domOf(u);
  let h = '<h2>' + uIc(u, !mine) + ' ' + esc(uName(u)) + ' <small>' + esc(nm(u.o)) + (mine ? '' : ' · אויב') + '</small></h2>';
  h += '<p class="sub">' + uStateTxt(u) + '</p>';
  const ur = unitRatio(u); if (ur) h += '<div class="box ratio">' + ur.txt + '</div>';
  h += uRows(u);
  if (!mine) return h + '<p class="sub">כדי להילחם בה — שלח לשם יחידות יבשה משלך, או תקוף מהאוויר.</p>';
  h += '<div class="btns">';
  h += btn('umove', 'הזז', 'primary') + btn('uattack', 'תקוף מדינה', 'danger');
  if (u.dest) h += btn('ustop', 'עצור כאן');
  if (dom !== 'sea') h += btn('udefend', 'הגן על הבית');
  h += atHome(u) ? '<button class="b" disabled>חזור הביתה<small class="cost">כבר בבסיס</small></button>' : btn('uret', 'חזור הביתה');
  if (u.t === 'air' || (u.m.air || 0) >= 4) h += btn('ustrike', 'תקיפה אווירית', 'danger');
  if (u.t === 'msl' && P().mlv > 0) h += btn('umissile', 'מטח טילים', 'danger');
  const canSplit = Object.keys(u.m).some(k => u.m[k] >= (k === 'troops' ? 2 : 2)) && !(u.t === 'fleet' && (u.m.ships || 0) < 2 && (u.m.carriers || 0) < 2);
  h += canSplit ? btn('usplit', 'פצל לשתיים') : '<button class="b" disabled>פצל לשתיים<small class="cost">קטנה מדי</small></button>';
  const mg = mergeables(u).length;
  h += mg ? btn('umerge', mg === 1 ? 'אחד עם היחידה שכאן' : 'אחד עם ' + mg + ' יחידות כאן') : '<button class="b" disabled>אחד יחידות<small class="cost">אין יחידות אחרות כאן</small></button>';
  h += '</div><p class="sub">' + ({ land: 'כוחות יבשה זזים ביבשה (חי״ר ~30 ק״מ ביום, שריון ~40). לאי או מעבר לים — רק כשצי שלך באזור, ולאט יותר.', air: 'מטוסים מגיעים תוך יום, עד ' + num(UT[u.t].range) + ' ק״מ מבסיס שלך, של בעלת ברית או מנושאת מטוסים.', sea: 'ספינות שטות כ-' + num(UT[u.t].spd) + ' ק״מ ביום. צי ליד חוף האויב חוסם אותו ומאפשר לכוחות יבשה לחצות את הים.' }[dom]) + '</p>';
  return h;
}
function unitRow(u) {
  return '<button data-act="selunit" data-u="' + u.id + '">' + uIc(u, u.o !== S.player) + '<b>' + esc(uName(u)) + (u.o !== S.player ? ' · ' + esc(nm(u.o)) : '') + '</b><small>' + esc(uLabel(u)) + ' · ' + (u.dest ? 'בתנועה' : uFighting(u) ? 'בלחימה' : atHome(u) ? 'בבסיס' : esc(uWhere(u))) + '</small></button>';
}
function viewUnitList() {
  const us = ulistIds.map(unitById).filter(Boolean);
  if (!us.length) return '<p class="hint">אין כאן יחידות.</p>';
  return '<h2>יחידות במקום הזה <small>' + num(us.length) + '</small></h2><div class="ulist">' + us.map(unitRow).join('') + '</div>';
}

/* ---- wars ---- */
function frontBars(w) {
  const fp = mySideFront(w, S.player);
  return '<div class="front"><div class="fl"><small>שטח האויב בידינו</small><div class="prog g"><div style="width:' + Math.max(0, fp) + '%"></div></div>' + pct(Math.max(0, fp)) + '</div>' +
    '<div class="fl"><small>שטחנו בידי האויב</small><div class="prog r"><div style="width:' + Math.max(0, -fp) + '%"></div></div>' + pct(Math.max(0, -fp)) + '</div></div>';
}
// who is actually fighting on the ground, from the units on the map
const ratioBadge = (a, d) => '<span class="num ' + (a >= d * 1.6 ? 'ok' : d >= a * 1.6 ? 'bad' : 'warn') + '" dir="ltr">' + ratioTxt(a, d) + '</span>';
// the force ratio where a unit stands (ours first) and the forecast, from the last day of fighting
function unitRatio(u) {
  const me = S.player; if (!S.units || domOf(u) === 'sea' || !u.at) return null;
  const foe = u.o === me ? u.at : u.o, inFoe = u.at !== me;
  const w = S.wars.find(v => v.pause === 0 && (v.a === me || v.b === me) && enemyLeaderFor(v, me) === foe); if (!w || !w.ru) return null;
  const a = inFoe ? w.ru.xE : w.ru.yP, d = inFoe ? w.ru.yE : w.ru.xP;
  if (!(a > 0) || !(inFoe ? w.ru.aE : w.ru.aP)) return null;
  return { a, d, txt: 'יחס כוחות ' + ratioBadge(a, d) + ' — ' + forecastTxt(a, d) };
}
function unitFront(w, en) {
  if (!(w.a === S.player || w.b === S.player) || w.pause > 0) return '';
  const mineIn = S.units.filter(u => u.o === S.player && u.at === en && domOf(u) !== 'sea');
  const theirsIn = S.units.filter(u => u.o === en && u.at === S.player && domOf(u) !== 'sea');
  const landIn = mineIn.filter(u => domOf(u) === 'land').length;
  let h = '<div class="box" style="font-size:13px;line-height:1.6">';
  h += 'יחידות שלנו בתוך ' + esc(nm(en)) + ': <b>' + num(mineIn.length) + '</b>' + (mineIn.length ? ' (עוצמה ' + num(mineIn.reduce((s, u) => s + uStr(u), 0)) + ')' : '');
  h += '<br>יחידות אויב בשטחנו: <b class="' + (theirsIn.length ? 'bad' : '') + '">' + num(theirsIn.length) + '</b>';
  if (w.ru && w.ru.aE) h += '<br>יחס כוחות בתוך ' + esc(nm(en)) + ': <b>' + ratioBadge(w.ru.xE, w.ru.yE) + '</b> — ' + forecastTxt(w.ru.xE, w.ru.yE);
  if (w.ru && w.ru.aP) h += '<br>יחס כוחות בשטחנו: <b>' + ratioBadge(w.ru.yP, w.ru.xP) + '</b> — ' + forecastTxt(w.ru.yP, w.ru.xP);
  { const st = warSt(w), meA = w.A.includes(S.player), tw = (st[meA ? 'B' : 'A'].pw || 0), mw = (st[meA ? 'A' : 'B'].pw || 0);
    if (tw >= 1 || mw >= 1) h += '<br>שבויים: ' + (tw >= 1 ? 'לקחנו ' + num(tw) : '') + (mw >= 1 ? (tw >= 1 ? ' · ' : '') + '<span class="bad">שלנו בשבי ' + num(mw) + '</span>' : ''); }
  if (S.ct) {
    const tk = citiesOfT(en).filter(x => sideOf(cst(x).o, S.player) && cst(x).o !== en), ls = citiesOfT(S.player).filter(x => cst(x).o !== S.player);
    const sg = citiesOfT(en).filter(x => cst(x).s > 0 && cst(x).b === S.player);
    h += '<br>ערים שכבשנו: <b>' + num(tk.length) + '</b>' + (tk.length ? ' (' + pct(heldShare(en, S.player) * 100) + ' מהאוכלוסייה' + (capHeldBy(en, S.player) ? ', כולל הבירה!' : '') + ')' : '') +
      (sg.length ? ' · במצור: ' + sg.slice(0, 3).map(x => esc(cityName(x)) + ' ' + pct(cst(x).s)).join(', ') : '') +
      (ls.length ? '<br><span class="bad">ערים שלנו בידי האויב: ' + ls.slice(0, 4).map(x => esc(cityName(x))).join(', ') + (ls.length > 4 ? ' ועוד' : '') + '</span>' : '');
  }
  if (!landIn) h += '<br><span class="warn">אין לנו כוחות יבשה בתוך ' + esc(nm(en)) + ' — אי אפשר לכבוש שטח, רק לתקוף מהאוויר ובטילים. הקש על יחידת חי״ר או שריון ← "תקוף מדינה".</span>';
  return h + '</div>';
}
function warActions(w, compact, target) {
  const en = target || enemyLeaderFor(w, S.player), lead = w.a === S.player || w.b === S.player;
  let h = '';
  if (w.pause > 0) return '<p class="sub">הפסקת אש — עוד ' + daysTxt(w.pause) + '.</p>';
  if (!compact) h += '<div class="seg"><button class="' + (w.stance === 'attack' ? 'on' : '') + '" data-act="stance" data-w="' + w.id + '" data-v="attack">התקפה</button><button class="' + (w.stance === 'defend' ? 'on' : '') + '" data-act="stance" data-w="' + w.id + '" data-v="defend">הגנה</button></div>';
  h += strikeSection(en, w);
  h += '<div class="btns">';
  if (lead) h += fbtn('peace', 'הצע שלום / תנאים', { note: 'שלום: העולם +5' }, 'good', false, ' data-w="' + w.id + '"');
  else h += '<button class="b" data-act="leave" data-w="' + w.id + '">פרוש מהמלחמה</button>';
  h += '</div>';
  return h;
}
function viewWars() {
  const mine = warsOf(S.player);
  let h = '<h2>המלחמות שלך</h2><div class="btns"><button class="b sm" data-act="stats">סטטיסטיקות ואבדות</button></div>';
  if (!mine.length) h += '<p class="hint">אתה לא במלחמה. כדי להכריז מלחמה או לתקוף — בחר מדינה במפה. שכנות קלות לתקוף; מדינות רחוקות יקרות וקשות.</p>';
  mine.forEach(w => {
    const en = enemyLeaderFor(w, S.player), side = w.A.includes(S.player) ? w.A : w.B, other = w.A.includes(S.player) ? w.B : w.A;
    h += '<div class="card war"><h3>נגד ' + esc(nm(en)) + (w.pause > 0 ? ' ' + chip('הפסקת אש', 'teal') : '') + '</h3>' +
      '<p class="sub">מאז ' + (w.startDay != null && w.startDay >= 0 ? dayTxt(w.startDay) : dateTxt(w.start)) + ' · כוחנו: ' + num(power(P())) + ' · כוחם: ' + num(power(S.c[en])) +
      (other.length > 1 ? '<br>לצד האויב: ' + other.filter(x => x !== en).map(nm).join(', ') : '') +
      (side.length > 1 ? '<br>לצדנו: ' + side.filter(x => x !== S.player).map(nm).join(', ') : '') + '</p>' +
      frontBars(w) + warStatsHtml(w) + unitFront(w, en) + warActions(w) + '</div>';
  });
  const world = S.wars.filter(w => !involvesPlayer(w));
  if (world.length) {
    h += '<h3>מלחמות בעולם</h3>';
    world.forEach(w => { const st = warSt(w); h += '<div class="card"><b>' + esc(nm(w.a)) + '</b> נגד <b>' + esc(nm(w.b)) + '</b>' + (w.pause > 0 ? ' ' + chip('הפסקת אש', 'teal') : '') +
      '<div class="sub">' + (w.f >= 0 ? esc(nm(w.a)) + ' מחזיקה ' + pct(w.f) + ' מ' + esc(nm(w.b)) : esc(nm(w.b)) + ' מחזיקה ' + pct(-w.f) + ' מ' + esc(nm(w.a))) +
      (w.rho && w.pause === 0 ? '<br>יחס כוחות: <span class="num" dir="ltr">' + ratioTxt(w.rr >= 0.5 ? w.rho : 1, w.rr >= 0.5 ? 1 : w.rho) + '</span> לטובת ' + esc(nm(w.rr >= 0.5 ? w.a : w.b)) + (w.rho >= 6 ? ' — המלחמה צפויה להסתיים מהר' : w.rho < 1.6 ? ' — כוחות שקולים' : '') : '') +
      '<br>הרוגים מאז תחילת המשחק: ' + num(killed(st.A) + killed(st.B)) + ' <small>(חיילים ' + num(st.A.sk + st.B.sk) + ' · אזרחים ' + num(st.A.ck + st.B.ck) + ')</small></div></div>'; });
  }
  return h;
}
/* ---- "what's urgent": everything that needs the player now, one tap to get there ---- */
let URG = { d: -1, l: [] };
function urgentItems(force) {
  const now = performance.now();
  if (!force && URG.d === S.day && URG.n === S.pending.length && now - URG.t < 1500) return URG.l;
  const me = S.player, p = S.p, c = P(), l = [];
  const add = (t, cls, act, data, sub) => l.push({ t, cls, act, data: data || {}, sub: sub || '' });
  if (S.pending.length) add('החלטה מחכה לך (' + S.pending.length + ')', 'bad', 'urgpend');
  if (S.ct) {
    citiesOfT(me).forEach(x => { const st = cst(x); if (st.o !== me && st.o) add('העיר ' + cityName(x) + ' בידי ' + nm(st.o), 'bad', 'selcity', { ci: x.id }, 'שלח כוחות לשחרר אותה'); else if (st.s > 0 && st.b) add('העיר ' + cityName(x) + ' במצור (' + Math.round(st.s) + '%)', 'bad', 'selcity', { ci: x.id }, 'שלח כוחות להגן'); });
  }
  warsOf(me).forEach(w => { if (w.pause > 0) return; const fp = mySideFront(w, me), en = enemyLeaderFor(w, me);
    if (fp < -10) add('המלחמה מול ' + nm(en) + ' הולכת רע', 'bad', 'tab', { tab: 'wars' }, 'האויב מחזיק ' + Math.round(-fp) + '% משטחנו');
    else if (fp >= 75) add('כמעט ניצחנו את ' + nm(en), 'ok', 'tab', { tab: 'wars' }, Math.round(fp) + '% משטחם בידינו'); });
  if (S.units && warsOf(me).some(w => w.pause === 0 && (w.a === me || w.b === me)) && !minOn('def')) {
    const idle = unitsOf(me).filter(u => domOf(u) === 'land' && !u.dest && u.at === me && uStr(u) >= 1 && !S.units.some(e => e.o !== me && e.at === me));
    if (idle.length >= 2) add(idle.length + ' יחידות יבשה מחכות בבסיס', 'warn', 'urgidle', { ids: idle.map(u => u.id).join(',') }, 'יש מלחמה — אפשר לשלוח אותן לחזית');
  }
  if (p.bankrupt) add('פשיטת רגל!', 'bad', 'tab', { tab: 'eco' }, 'העלה מסים או קצץ הוצאות');
  else if (p.treasury < 0) add('הקופה במינוס: ' + plainT(moneyTxt(-p.treasury)) + ' חוב', -p.treasury > c.gdp * 0.6 ? 'bad' : 'warn', 'tab', { tab: 'eco' }, 'השרים לא יוציאו כסף עד שהקופה תתאזן');
  if (c.approval < 30) add('העם כועס (' + Math.round(c.approval) + '%)', 'bad', 'tab', { tab: 'eco' }, 'מתחת ל-15% — מהפכה');
  if (p.rep < 25) add('המוניטין בעולם בשפל (' + Math.round(p.rep) + ')', 'warn', 'tab', { tab: 'gov' }, 'סיוע ושלום מעלים אותו');
  (p.dl || []).filter(x => S.day - x.d <= 7 && x.d > (p.dlSeen == null ? -1 : p.dlSeen)).forEach(x => add(x.t, 'ok', 'tab', { tab: 'mil' }));
  if (!MIN_ORDER.some(minOf) && S.day > 20) add('אין שרים בממשלה', 'warn', 'tab', { tab: 'gov' }, 'שרים עושים חלק מהעבודה בשבילך');
  URG = { d: S.day, n: S.pending.length, l, t: now };
  return l;
}
function viewUrgent() {
  const l = urgentItems(true);
  S.p.dlSeen = S.day;
  let h = '<h2>מה דחוף <small>' + (l.length ? num(l.length) + ' דברים' : 'הכול רגוע') + '</small></h2>';
  if (!l.length) return h + '<p class="hint">אין כרגע שום דבר שמחכה לך. אפשר להריץ את הזמן.</p>';
  return h + '<div class="ulist urg">' + l.map(x => '<button data-act="' + x.act + '"' + Object.keys(x.data).map(k => ' data-' + k + '="' + esc(x.data[k]) + '"').join('') + '><span class="udot ' + x.cls + '"></span><b>' + isoNums(esc(x.t)) + '</b>' + (x.sub ? '<small>' + isoNums(esc(x.sub)) + '</small>' : '') + '</button>').join('') + '</div>';
}
/* ---- statistics: war cards, charts and the stats screen ---- */
const wstOpen = new Set();
// small line chart (inline SVG, stretches to the card width)
function lineChart(xs, series, lo, hi, zero) {
  const Wc = 300, Hc = 80, pad = 6;
  const X = x => (x - xs[0]) / Math.max(1, xs[xs.length - 1] - xs[0]) * Wc;
  const Y = v => pad + (1 - (v - lo) / ((hi - lo) || 1)) * (Hc - pad * 2);
  let h = '<svg class="chart" viewBox="0 0 ' + Wc + ' ' + Hc + '" preserveAspectRatio="none" aria-hidden="true">';
  [0.25, 0.5, 0.75].forEach(f => { h += '<line x1="0" x2="' + Wc + '" y1="' + (pad + f * (Hc - pad * 2)).toFixed(1) + '" y2="' + (pad + f * (Hc - pad * 2)).toFixed(1) + '" class="gl"/>'; });
  if (zero) h += '<line x1="0" x2="' + Wc + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" class="zl"/>';
  series.forEach(s => {
    const pts = s.v.map((v, i) => X(xs[i]).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
    if (s.area) h += '<polygon points="' + X(xs[0]).toFixed(1) + ',' + Y(0).toFixed(1) + ' ' + pts + ' ' + X(xs[xs.length - 1]).toFixed(1) + ',' + Y(0).toFixed(1) + '" fill="' + s.col + '" fill-opacity=".16"/>';
    h += '<polyline points="' + pts + '" fill="none" stroke="' + s.col + '" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  });
  return h + '</svg>';
}
function warCharts(w) {
  const st = warSt(w), meA = w.A.includes(S.player);
  const hist = st.h.concat([[S.day, Math.round(w.f), Math.round(killed(st.A)), Math.round(killed(st.B))]]);
  if (hist.length < 3 || hist[hist.length - 1][0] - hist[0][0] < 3) return '<p class="sub">הגרפים יופיעו אחרי כמה ימים של מלחמה.</p>';
  const xs = hist.map(x => x[0]);
  const fr = hist.map(x => meA ? x[1] : -x[1]), m = Math.max(10, ...fr.map(Math.abs));
  const mine = hist.map(x => meA ? x[2] : x[3]), theirs = hist.map(x => meA ? x[3] : x[2]), top = Math.max(10, ...mine, ...theirs);
  const ax = '<div class="ch-ax"><span>' + dayHtml(xs[0]) + '</span><span>היום</span></div>';
  return '<div class="charts"><div class="chartbox"><div class="ch-t">שטח שנכבש <small>למעלה — בידינו, למטה — בידם</small></div>' + lineChart(xs, [{ v: fr, col: fr[fr.length - 1] >= 0 ? '#2fbf71' : '#e5383b', area: 1 }], -m, m, true) + ax + '</div>' +
    '<div class="chartbox"><div class="ch-t">הרוגים מצטבר <small><i class="lg" style="background:#f5b301"></i>אצלנו <i class="lg" style="background:#ff6b6b"></i>אצלם</small></div>' + lineChart(xs, [{ v: mine, col: '#f5b301' }, { v: theirs, col: '#ff6b6b' }], 0, top * 1.08) + '<div class="ch-ax"><span>' + num(top) + ' מקסימום</span><span>היום</span></div></div></div>';
}
// table of losses for two sides
function casTable(a, b, la, lb) {
  const rowc = (l, x, y, cls) => '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + l + '</td><td>' + x + '</td><td>' + y + '</td></tr>';
  let h = '<table class="tbl t3"><tr class="hd"><td></td><td>' + la + '</td><td>' + lb + '</td></tr>';
  h += rowc('חיילים הרוגים', num(a.sk), num(b.sk)) + rowc('חיילים פצועים', num(a.sw), num(b.sw));
  if ((a.pw || 0) >= 1 || (b.pw || 0) >= 1) h += rowc('חיילים שנפלו בשבי (שבויים)', num(a.pw || 0), num(b.pw || 0));
  h += rowc('אזרחים הרוגים', num(a.ck), num(b.ck), 'civ') + rowc('אזרחים פצועים', num(a.cw), num(b.cw));
  EQ_K.forEach(k => { if ((a.eq[k] || 0) >= 0.5 || (b.eq[k] || 0) >= 0.5) h += rowc(EQ_HE[k] + ' שהושמדו', cnt(a.eq[k] || 0), cnt(b.eq[k] || 0)); });
  if (a.mu || b.mu) h += rowc('טילים ששוגרו', cnt(a.mu || 0), cnt(b.mu || 0));
  if (a.sp || b.sp) h += rowc('כסף שהוצא', money(a.sp || 0, true), money(b.sp || 0, true));
  if (a.dm || b.dm) h += rowc('נזק (ציוד וכלכלה)', money(a.dm || 0, true), money(b.dm || 0, true));
  return h + '</table>';
}
function logList(lg, n) {
  if (!lg || !lg.length) return '<p class="sub">עוד אין אירועים.</p>';
  return '<ul class="news blog">' + lg.slice(0, n || 8).map(x => '<li><small>' + dayHtml(x.d) + '</small> ' + isoNums(esc(plainT(x.t))) + '</li>').join('') + '</ul>';
}
function warStatsHtml(w) {
  const st = warSt(w), meA = w.A.includes(S.player), my = st[meA ? 'A' : 'B'], th = st[meA ? 'B' : 'A'], fp = mySideFront(w, S.player);
  const days = S.day - (w.startDay != null ? w.startDay : 0);
  let h = '<div class="wst"><div class="grid g3"><div><small>ימים במלחמה</small>' + num(days) + '</div><div><small>הרוגים אצלנו</small><span class="bad">' + num(killed(my)) + '</span></div><div><small>הרוגים אצלם</small>' + num(killed(th)) + '</div>' +
    '<div><small>כבשנו משטחם</small>' + pct(Math.max(0, fp)) + '</div><div><small>הם כבשו משטחנו</small>' + pct(Math.max(0, -fp)) + '</div><div><small>ציוד שהשמדנו</small>' + num(EQ_K.reduce((s, k) => s + (th.eq[k] || 0), 0)) + '</div></div>';
  h += warCharts(w);
  const open = wstOpen.has(w.id);
  h += '<button class="b sm" data-act="wst" data-w="' + w.id + '">' + (open ? 'הסתר פרטים' : 'טבלת אבדות ויומן קרבות') + '</button>';
  if (open) h += casTable(my, th, 'אצלנו', 'אצלם') + '<p class="sub">פצועים: חיילים ≈ פי 2.5 מההרוגים, אזרחים ≈ פי 3. הספירה מתחילה ב-1 בינואר 2026.</p><h3>יומן קרבות</h3>' + logList(st.lg, 10);
  return h + '</div>';
}
const RES_HE = { won: ['ניצחון', 'ok'], lost: ['הפסד', 'bad'], peace: ['שלום / תיקו', 'teal'], left: ['פרשנו', 'orange'] };
function viewStats() {
  const ps = PS(), done = ps.done, act = warsOf(S.player);
  const cntR = r => done.filter(d => d.res === r).length;
  const sp = ps.sp, spTot = sp.def + sp.war + sp.buy + sp.strike;
  let h = '<h2>סטטיסטיקות <small>מאז ' + (S.p && S.p.startDay != null ? dayHtml(S.p.startDay) : 'תחילת המשחק') + '</small></h2>';
  h += '<div class="grid g3"><div><small>מלחמות</small>' + num(done.length + act.length) + (act.length ? ' <small class="warn">(' + num(act.length) + ' פעילות)</small>' : '') + '</div>' +
    '<div><small>ניצחונות</small><span class="ok">' + num(cntR('won')) + '</span></div><div><small>הפסדים</small><span class="' + (cntR('lost') ? 'bad' : '') + '">' + num(cntR('lost')) + '</span></div>' +
    '<div><small>תקיפות שביצענו</small>' + num(ps.strikes) + '</div><div><small>תקיפות עלינו</small>' + num(ps.struck) + '</div><div><small>מדינות שסופחו</small>' + num(S.p.annexed.length) + '</div></div>';
  h += '<h3>אבדות</h3>' + casTable(ps.cau, ps.suf, 'גרמנו לאויב', 'ספגנו');
  h += '<p class="sub">"גרמנו" כולל את כל האבדות של הצד השני במלחמות שלנו. "ספגנו" — רק של ' + esc(P().he) + '.</p>';
  h += '<h3>הוצאות צבאיות <small class="hint">' + money(spTot) + '</small></h3><table class="tbl">' + row('תקציב ביטחון ואחזקה', sp.def) + row('עלות המלחמות', sp.war) + row('רכש נשק, גיוס ושדרוגים', sp.buy) + row('תקיפות', sp.strike) + '<tr class="tot"><td>סה״כ</td><td>' + money(spTot) + '</td></tr></table>';
  h += '<h3>תקיפות אחרונות</h3>';
  h += ps.log.length ? '<div class="ulist">' + ps.log.slice(0, 8).map((r, i) => '<button data-act="rshow" data-i="' + i + '"><b>' + (r.at === S.player ? '<span class="bad">' + esc(nm(r.by)) + ' ← אנחנו</span>' : 'אנחנו ← ' + esc(nm(r.at))) + ' · ' + esc(KIND_HE[r.k]) + '</b><small>' + num(killed(r.cas)) + ' הרוגים · ' + dayHtml(r.d) + '</small></button>').join('') + '</div>' : '<p class="sub">עוד לא היו תקיפות.</p>';
  if (done.length) {
    h += '<h3>מלחמות שהסתיימו</h3>';
    done.slice().reverse().slice(0, 10).forEach(d => { const [rl, rc] = RES_HE[d.res] || ['הסתיימה', '']; h += '<div class="card"><b>נגד ' + esc(nm(d.en)) + '</b> ' + chip(rl, rc) + '<div class="sub">' + num(Math.max(1, d.e - d.s)) + ' ימים · הרוגים: ' + num(killed(d.my)) + ' אצלנו, ' + num(killed(d.th)) + ' אצלם</div></div>'; });
  }
  // the world
  const ws = S.wars.filter(w => w.pause === 0).map(w => ({ w, k: killed(warSt(w).A) + killed(warSt(w).B) })).sort((a, b) => b.k - a.k);
  h += '<h3>העולם</h3><div class="box">הרוגים בכל המלחמות והתקיפות מאז תחילת המשחק: <b>' + num(killed(WST())) + '</b><br><small class="hint">חיילים ' + num(WST().sk) + ' · אזרחים ' + num(WST().ck) + ' · פצועים ' + num(WST().sw + WST().cw) + '</small></div>';
  if (ws.length) h += '<div class="ulist">' + ws.map(({ w, k }) => { const st = warSt(w), my = involvesPlayer(w); return '<button data-act="gotowars"><b>' + (my ? '<span class="dot me"></span>' : '') + esc(nm(w.a)) + ' נגד ' + esc(nm(w.b)) + '</b><small>' + num(k) + ' הרוגים · אזרחים ' + num(st.A.ck + st.B.ck) + '</small></button>'; }).join('') + '</div>';
  else h += '<p class="sub">אין מלחמות פעילות בעולם.</p>';
  return h;
}
function viewNews() {
  if (!S.news.length) return newsSeg('news') + '<p class="hint">אין חדשות עדיין.</p>';
  let h = newsSeg('news') + '<h2>מבזקי חדשות</h2><ul class="news">', last = null;
  S.news.slice(0, 80).forEach(n => { const d = n.t >= 0 ? dayHtml(n.t) : ''; if (d !== last) { h += '<li class="nd">' + d + '</li>'; last = d; } h += '<li class="' + n.k + '">' + esc(n.txt) + '</li>'; });
  return h + '</ul>';
}

/* ================= modals ================= */
let modalQ = [];
// the clock stops while any dialog is open
const modalOpen = () => modalQ.length > 0 || $('#modal').classList.contains('open');
function modal(o) { modalQ.push(o); if (modalQ.length === 1) showModal(); }
function showModal() {
  const o = modalQ[0]; if (!o) { $('#modal').classList.remove('open'); return; }
  $('#m-title').innerHTML = o.title || '';
  $('#m-body').innerHTML = o.html || '';
  const f = $('#m-foot'); f.innerHTML = ''; f.className = o.col ? 'col' : '';
  (o.buttons || [{ label: 'סגור' }]).forEach(b => {
    const e = document.createElement('button'); e.className = 'b ' + (b.cls || ''); e.innerHTML = b.label;
    e.onclick = () => { if (b.keep && b.fn) { b.fn(); return; } modalQ.shift(); $('#modal').classList.remove('open'); if (b.fn) b.fn(); setTimeout(showModal, 30); };
    f.appendChild(e);
  });
  $('#modal').className = 'modal open' + (o.cls ? ' ' + o.cls : '');
  if (o.onShow) o.onShow();
}
// stacked floating toasts (several actions in a row stay readable)
function toast(txt, bad) {
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.innerHTML = isoNums(esc(String(txt).replace(/[⁦⁩]/g, '')));
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
}
const fxBtn = (label, e) => label + (e && fxLine(e) ? '<small class="cost">' + fxLine(e) + '</small>' : '');
// important events stop the clock and ask the player
function processPending() {
  // let a strike / explosion finish on screen before the next dialog covers the map
  if (!S.pending.length || S.over || modalOpen() || performance.now() < fxHold) return;
  const p = S.pending.shift();
  const w = p.wid != null ? S.wars.find(x => x.id === p.wid) : null;
  const after = () => { save(); renderAll(); setTimeout(processPending, 40); };
  if (p.type === 'ev') { if (!evDialog(p, after)) processPending(); return; }
  if (p.type === 'win') { modal({ title: 'ניצחון!', html: '<p>' + p.txt + '</p><p>הניקוד שלך: ' + num(score()) + '. אפשר להמשיך לשחק.</p>', buttons: [{ label: 'המשך לשחק', cls: 'primary', fn: after }] }); return; }
  if (p.type === 'attacked') {
    if (!w) return processPending();
    const side = w.B.filter(x => x !== S.player), foes = w.A.filter(x => x !== p.from);
    modal({ title: 'מלחמה! ' + esc(nm(p.from)) + ' תקפה אותנו', cls: 'danger', html: '<p><b>' + esc(nm(p.from)) + '</b> הכריזה מלחמה על ' + esc(P().he) + '.</p><ul class="plain">' +
      (p.noRally ? '<li class="red">הם מגיבים לתקיפה שלנו — הפעם העם לא מתלכד סביבך (אין בונוס).</li>' : '<li>העם מתלכד סביב הדגל: אהבת העם ' + sgn(6) + '.</li>') +
      (side.length ? '<li>לצדנו נלחמות: ' + side.slice(0, 6).map(nm).join(', ') + '</li>' : '<li>אף מדינה לא הצטרפה לצדנו (עדיין).</li>') +
      (foes.length ? '<li class="red">לצד האויב: ' + foes.slice(0, 6).map(nm).join(', ') + '</li>' : '') +
      '<li>כוחם: ' + num(power(S.c[p.from])) + ' · כוחנו: ' + num(power(P())) + '</li></ul><p class="sub">יחידות האויב מסומנות באדום על המפה. הזז יחידות כדי להגן על הגבול או לפלוש אליהם, גייס מילואים בלשונית צבא, או הצע שלום מלשונית מלחמות.</p>',
      buttons: [{ label: 'השאר מושהה ותכנן', cls: 'primary', fn: () => { setSpeed(0); openTabFresh('wars'); after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (p.type === 'invaded') {
    if (!w) return processPending();
    const u = unitById(p.uid);
    modal({ title: 'פלישה! ' + esc(nm(p.from)) + ' חצתה את הגבול', cls: 'danger', html: '<p>יחידות של <b>' + esc(nm(p.from)) + '</b> נכנסות לשטח ' + esc(P().he) + '.</p><ul class="plain"><li>כדי לעצור אותן — הזז לשם יחידות יבשה (חי״ר ושריון) ותן להן תמיכה מהאוויר.</li><li>אם לא נגן — האויב יכבוש עוד ועוד שטח.</li>' + (minOn('def') ? '<li><b>' + esc(mTitle('def', minOn('def'))) + ' כבר מזיז כוחות להגנה.</b></li>' : '') + '</ul>',
      buttons: [{ label: 'הראה לי', cls: 'primary', fn: () => { setSpeed(0); if (u) { zoomToGeo([u.dest ? u.dest[0] : u.lon, u.dest ? u.dest[1] : u.lat], Math.max(curK, 8)); } after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (p.type === 'nukealert') {
    modal({ title: '☢ פיצוץ גרעיני', cls: 'danger', html: '<p><b>' + esc(nm(p.att)) + '</b> שיגרה נשק גרעיני על <b>' + (p.cn ? esc(p.cn) + '</b> (' + esc(nm(p.tgt)) + ')' : esc(nm(p.tgt)) + '</b>') + '. ' + (p.dead ? num(p.dead) + ' אזרחים נהרגו, ועוד רבים נפצעו.' : 'מיליונים נפגעו.') + ' העולם בהלם.</p>' +
      (p.tgt === S.player ? '<p class="warnbox">אנחנו המטרה! הכלכלה והצבא נפגעו קשות.</p>' : '<p class="sub">רוב העולם יטיל סנקציות על התוקפת. זה רגע טוב לחשוב על בריתות.</p>'), buttons: [{ label: 'המשך', cls: 'primary', fn: after }] });
    return;
  }
  if (p.type === 'revwarn') {
    modal({ title: 'אזהרה: סכנת מהפכה', cls: 'danger', html: '<p>אהבת העם ירדה ל-' + pct(P().approval) + '. אם המצב לא ישתפר בחודשים הקרובים — הממשלה תיפול.</p><ul class="plain"><li>הורד מסים או העלה רווחה (לשונית כלכלה)</li><li>סיים מלחמות ושחרר מילואים</li><li>בנה פרויקטים לאומיים (לשונית בית)</li></ul>',
      buttons: [{ label: 'לכלכלה', cls: 'primary', fn: () => { openTabFresh('eco'); after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (p.type === 'aid') {
    const C = S.c[p.from]; if (!C || !C.alive) return processPending();
    const big = Math.max(0.01, Math.min(P().gdp * 0.002, C.gdp * p.size * 0.5 + 0.02)), small = big * 0.25;
    const eBig = { cost: big, rep: 6, ap: 1, rel: { [p.from]: 18 } }, eSmall = { cost: small, rep: 3, rel: { [p.from]: 8 } }, eNo = { rep: -1, rel: { [p.from]: -4 } };
    modal({ title: 'בקשת עזרה: ' + esc(p.kind) + ' ב' + esc(C.he), html: '<p>' + esc(p.kind) + ' ב' + esc(C.he) + ': אלפי אנשים נפגעו, והממשלה מבקשת סיוע מהעולם.</p>',
      buttons: [{ label: fxBtn('שלח סיוע גדול', eBig), cls: 'good', fn: () => { if (spend(big)) { fxToast('סיוע ל' + C.he, eBig); addNews('שלחנו משלחת סיוע גדולה ל' + C.he + ' אחרי ה' + p.kind + '. העולם מעריך.', 'good'); } after(); } },
        { label: fxBtn('שלח צוותי חילוץ', eSmall), fn: () => { if (spend(small)) { fxToast('חילוץ ב' + C.he, eSmall); addNews('צוותי חילוץ שלנו נחתו ב' + C.he + '.', 'good'); } after(); } },
        { label: fxBtn('סרב', eNo), fn: () => { fxToast('סירבנו', eNo, true); after(); } }] });
    return;
  }
  if (p.type === 'refugees') {
    const C = S.c[p.from]; if (!C || !C.alive) return processPending();
    const cost = Math.max(0.01, P().gdp * 0.0008);
    const eYes = { cost, rep: 6, ap: -2, rel: { [p.from]: 6 } }, eNo = { rep: -2, ap: 1 };
    modal({ title: 'פליטים מ' + esc(C.he), html: '<p>המלחמה ב' + esc(C.he) + ' גירשה מאות אלפים מבתיהם. חלקם מבקשים מקלט אצלנו.</p><p class="sub">קליטה עולה כסף ומרגיזה חלק מהציבור, אבל העולם יעריך את זה.</p>',
      buttons: [{ label: fxBtn('קלוט פליטים', eYes), cls: 'good', fn: () => { if (spend(cost)) { fxToast('קלטנו פליטים', eYes); addNews('קלטנו פליטים מ' + C.he + '.', 'good'); } after(); } },
        { label: fxBtn('סגור את הגבול', eNo), fn: () => { fxToast('הגבול נסגר', eNo, true); after(); } }] });
    return;
  }
  if (p.type === 'siege' || p.type === 'caplost') {
    const x = CITYI[p.ci]; if (!x) return processPending();
    const st = cst(x);
    if (p.type === 'siege' && (st.o !== S.player || !(st.s > 0))) return processPending();
    const dm = minOn('def');
    const html = p.type === 'siege'
      ? '<p>כוחות של <b>' + esc(nm(p.from)) + '</b> מקיפים את <b>' + esc(cityName(x)) + '</b> (' + cityPopT(x) + ' תושבים). אם הם יישארו שם חזקים מהמגינים — העיר תיפול בעוד כ-' + num(Math.max(1, Math.ceil((100 - st.s) / 100 * siegeDays(x, st)))) + ' ימים.</p><ul class="plain"><li>שלח לעיר כוחות יבשה — בכרטיס העיר ← "שלח כוחות להגן".</li><li>תקוף את הכוחות שמסביב מהאוויר.</li>' + (dm ? '<li><b>' + esc(mTitle('def', dm)) + ' כבר שולח כוחות להגנה.</b></li>' : '') + '</ul>'
      : '<p class="warnbox">עיר הבירה <b>' + esc(cityName(x)) + '</b> נכבשה בידי ' + esc(nm(p.from)) + '!</p><p>העם בהלם, הכלכלה נפגעה, והאויב קרוב יותר לניצחון. אפשר לשחרר אותה בכוחות יבשה — או לבקש שלום.</p>';
    modal({ title: p.type === 'siege' ? 'מצור על ' + esc(cityName(x)) + '!' : 'הבירה נפלה!', cls: 'danger', html,
      buttons: [{ label: 'הראה לי', cls: 'primary', fn: () => { setSpeed(0); openCity(x.id, 7); after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (!w) return processPending();
  if (p.type === 'ally') {
    const en = w.a;
    const eJoin = { rel: { [p.ally]: 15, [en]: -100 }, rep: 2 }, eNo = { rel: { [p.ally]: -35 }, rep: -5 };
    modal({ title: 'קריאה לעזרה', html: '<p>' + nm(en) + ' תקפה את בעלת בריתך ' + nm(p.ally) + '. האם לכבד את הברית ולהצטרף למלחמה?</p><p class="sub">סירוב יפגע קשות ביחסים, ינתק את הברית ויפגע באמינות שלך בעולם.</p>',
      buttons: [{ label: fxBtn('הצטרף למלחמה', eJoin), cls: 'danger', fn: () => { if (S.wars.includes(w) && !inWar(w, S.player)) { w.B.push(S.player); fxToast('הצטרפנו למלחמה', eJoin); addNews('הצטרפנו למלחמה לצד ' + nm(p.ally) + ' נגד ' + nm(en) + '.', 'war'); } after(); } },
        { label: fxBtn('הישאר בחוץ', eNo), fn: () => { setPact(p.ally, S.player, 'alliance', false); fxToast('הפרנו את הברית', eNo, true); addNews('סירבנו לסייע ל' + nm(p.ally) + '. אמינותנו נפגעה.', 'bad'); after(); } }] });
  } else if (p.type === 'peace') {
    const cl = p.kind === 'terr' ? pickCede(S.player, p.from, p.share) : [];
    const terms = p.kind === 'white' ? 'שלום ללא תנאים (כל צד נשאר בגבולותיו).' : p.kind === 'repar' ? 'הם ישלמו לנו פיצויים של ' + money(S.c[p.from].gdp * 0.04) + '.' : 'הם יוותרו לנו על ' + pct(cedeShare(p.from, cl, p.share) * 100) + ' משטחם ומאוכלוסייתם.' + (cl.length ? '</p><p>נקבל את: <b>' + esc(cedeNames(cl)) + '</b>' : '');
    modal({ title: 'הצעת שלום מ' + nm(p.from), html: '<p>' + terms + '</p>',
      buttons: [{ label: fxBtn('קבל', { ap: 3, rep: p.kind === 'terr' ? 2 : 5 }), cls: 'good', fn: () => { applyPeace(w, p.kind, S.player, p.from, p.share, cl); after(); } }, { label: 'דחה', fn: after }] });
  } else if (p.type === 'demand') {
    const cl = pickCede(p.from, S.player, p.share);
    modal({ title: 'דרישה מ' + nm(p.from), html: '<p>' + nm(p.from) + ' מוכנה לסיים את המלחמה אם נוותר על ' + pct(cedeShare(S.player, cl, p.share) * 100) + ' משטחנו ומאוכלוסייתנו.</p>' + (cl.length ? '<p>נמסור להם את: <b>' + esc(cedeNames(cl)) + '</b></p>' : '') + '<p class="sub">אם נסרב — הלחימה תימשך.</p>',
      buttons: [{ label: fxBtn('קבל את התנאים', { ap: -5, rep: 3 }), cls: 'danger', fn: () => { applyPeace(w, 'terr', p.from, S.player, p.share, cl); after(); } }, { label: 'נמשיך להילחם', fn: after }] });
  } else processPending();
}
function applyPeace(w, kind, win, lose, share, cities) {
  if (!S.wars.includes(w)) return;
  const pl = involvesPlayer(w);
  if (kind === 'repar') {
    const amt = S.c[lose].gdp * 0.04;
    if (win === S.player) S.p.treasury += amt; if (lose === S.player) S.p.treasury -= amt;
    addNews(nm(lose) + ' הסכימה לשלם פיצויים ל' + nm(win) + '. המלחמה הסתיימה.', win === S.player ? 'good' : 'bad');
  } else if (kind === 'terr') {
    const tot = citiesOfT(lose).reduce((a, x) => a + x.pop, 0);
    const cl = cede(win, lose, share, cities && cities.filter(x => landOf(x) === lose));
    if (cl.length && tot > 0) share = clamp(cl.reduce((a, x) => a + x.pop, 0) / tot, 0.02, 0.5);
    const cn = cl.length ? cedeNames(cl) : '';
    addNews(nm(lose) + ' ויתרה על ' + Math.round(share * 100) + '% משטחה ל' + nm(win) + (cn ? ' (' + cn + ')' : '') + '. נחתם הסכם שלום.', win === S.player ? 'good' : 'bad');
    if (cn && (win === S.player || lose === S.player)) setTimeout(() => toast(win === S.player ? 'קיבלנו את: ' + cn : 'מסרנו ל' + nm(win) + ' את: ' + cn, lose === S.player), 0);
  } else if (kind === 'annex') {
    endWar(w, win === S.player ? 'won' : 'lost'); annex(win, lose); return;
  } else if (kind === 'cease') {
    w.pause = 183; if (pl) fxToast('הפסקת אש', { rep: 2 });
    addNews('הוסכם על הפסקת אש של חצי שנה עם ' + nm(enemyLeaderFor(w, S.player)) + '.', 'good'); return;
  } else addNews('נחתם הסכם שלום עם ' + nm(enemyLeaderFor(w, S.player)) + '. החיילים חוזרים הביתה.', 'good');
  // peace is good for the people and for the world's view of us
  if (pl && kind === 'terr' && lose === S.player) { S.p.shock += 8; fxToast('הסכם שלום', { ap: -5, rep: 3 }, true); }
  else if (pl) fxToast('הסכם שלום', { ap: 3, rep: kind === 'terr' && win === S.player ? 2 : 5 });
  endWar(w, kind === 'white' ? 'peace' : win === S.player ? 'won' : lose === S.player ? 'lost' : 'peace');
}

/* ================= player actions ================= */
function spend(cost) {
  const c = P();
  if (S.p.bankrupt) { toast('במצב פשיטת רגל אי אפשר להוציא כסף על זה', true); return false; }
  if (S.p.treasury - cost < -c.gdp * 1.1) { toast('אין מספיק כסף — החוב גבוה מדי', true); return false; }
  S.p.treasury -= cost; return true;
}
function selOwner() { return selected ? S.owner[selected] : null; }
function aiScore(type, ai) {
  const me = S.player, r = rel(ai, me), A = S.c[ai], M = P();
  const shared = A.blocs.filter(x => M.blocs.includes(x)).length;
  const mis = (A.gov === 'democracy') !== (M.gov === 'democracy') ? 1 : 0;
  const sanc = sanctions(ai, me) || sanctions(me, ai);
  const myWars = warsOf(me).filter(w => w.pause === 0);
  let common = 0, friendFoe = 0;
  myWars.forEach(w => { const en = enemyLeaderFor(w, me); if (rel(ai, en) < -50) common += 25; if (isAlly(ai, en) || rel(ai, en) > 50) friendFoe += 40; });
  const pw = power(M) / (power(A) + 1);
  const noise = (R() - 0.5) * 12;
  // world reputation matters: trusted leaders get deals, pariahs get refusals
  const fo = minOf('fo');
  const rp = (S.p.rep - 50) * (A.gov === 'democracy' ? 0.4 : 0.2) + (fo ? (mSk(fo) - 3) * 4 + (fo.tr === 'dipl' ? 6 : 0) : 0);
  const lowRep = S.p.rep < 30 ? 'המוניטין שלך בעולם נמוך מדי' : null;
  if (type === 'trade') return { ok: r + 15 + shared * 5 + rp - (sanc ? 60 : 0) - friendFoe + noise > 5, why: sanc ? 'יש ביניכם סנקציות' : lowRep || 'היחסים לא מספיק טובים' };
  if (type === 'nap') return { ok: r + 30 + rp + (pw > 1.5 ? 15 : 0) - friendFoe + noise > 10, why: lowRep || 'הם לא סומכים עליך' };
  if (type === 'alliance') return { ok: r + shared * 8 + rp + Math.min(20, pw * 8) - mis * 15 - myWars.length * 12 + common - friendFoe - (sanc ? 50 : 0) + noise > 60, why: myWars.length ? 'הם לא רוצים להיגרר למלחמות שלך' : lowRep || 'צריך יחסים טובים מאוד (מעל 60) ואינטרסים משותפים' };
  return { ok: true };
}
const ACT = {
  tab: d => openTabFresh(d.tab),
  close: () => openTab(null),
  gotowars: () => openTabFresh('wars'),
  help: showHelp,
  menu: showMenu,
  speed: d => setSpeed(+d.v),
  gift: () => { const o = selOwner(), g = giftAmt(), C = S.c[o]; if (cdLeft('gift:' + o)) return; const e = { rep: giftRep(o), rel: { [o]: giftRel(o) } }; if (!spend(g)) return;
    setCd('gift:' + o, 30); fxToast('סיוע ל' + C.he, e); addNews('שלחנו סיוע הומניטרי ל' + C.he + '.', 'dip'); renderAll(); },
  trade: () => dipToggle('trade', 'הסכם סחר', { rep: 2, rel: 8 }, { rep: -1, rel: -10 }),
  nap: () => dipToggle('nap', 'הסכם אי-תוקפנות', { rep: 1, rel: 6 }, { rep: -3, rel: -12 }),
  alliance: () => dipToggle('alliance', 'ברית צבאית', { rep: 0, rel: 12 }, { rep: -4, rel: -20 }),
  sanction: () => { const o = selOwner(), C = S.c[o]; if (cdLeft('sanc:' + o)) return; setCd('sanc:' + o, 15);
    if (sanctions(S.player, o)) { delete S.sanc[S.player + '>' + o]; fxToast('הסנקציות על ' + C.he + ' הוסרו', { rel: { [o]: 6 } }); addNews('הסרנו את הסנקציות על ' + C.he + '.', 'dip'); }
    else { S.sanc[S.player + '>' + o] = 1; C.gdp *= 1 - Math.min(0.03, P().gdp / worldGdp() * 0.1); P().gdp *= 1 - Math.min(0.01, C.gdp / P().gdp * 0.002);
      setPact(o, S.player, 'trade', false); fxToast('סנקציות על ' + C.he, { rep: sancRep(o), rel: { [o]: -20 } }, sancRep(o) < 0); addNews('הטלנו סנקציות כלכליות על ' + C.he + '.', 'dip'); }
    renderAll(); },
  war: () => confirmWar(selOwner()),
  stance: d => { const w = S.wars.find(x => x.id === +d.w); if (w) { w.stance = d.v; renderSheet(); } },
  air: d => strike(d.o, 'air'),
  missile: d => strike(d.o, 'mis'),
  nuke: d => confirmNuke(d.o),
  peace: d => peaceDialog(+d.w),
  leave: d => { const w = S.wars.find(x => x.id === +d.w); if (!w) return; const lead = w.A.includes(S.player) ? w.a : w.b; archiveWar(w, 'left');
    w.A = w.A.filter(x => x !== S.player); w.B = w.B.filter(x => x !== S.player); fxToast('פרשנו מהמלחמה', { ap: 2, rep: -2, rel: { [lead]: -25 } }); addNews('פרשנו מהמלחמה מול ' + nm(enemyLeaderFor(w, lead)) + '.', 'dip'); needMapRecolor = true; renderAll(); },
  buymul: d => { buyMul = +d.v; renderSheet(); },
  buy: d => buyUnits(d.k),
  upg: d => { const k = d.k, c = P(); if ((c[k] || 0) >= 3 || S.p.queue.some(q => q.k === k)) return; const cost = upgCost(k); if (!spend(cost)) return;
    PS().sp.buy += cost; const days = k === 'mlv' ? 548 : 365; S.p.queue.push({ k, n: 1, start: S.day, due: S.day + days });
    toast('השדרוג התחיל: ' + money(cost).replace(/<[^>]+>/g, '') + ' · מוכן בעוד ' + Math.round(days / DPM) + ' חודשים'); renderAll(); },
  mob: () => { if (mobilize()) renderAll(); },
  demob: () => { if (demobilize()) renderAll(); },
  build: d => { if (startProj(d.k)) renderAll(); },
  pz: d => doPz(d.k),
  tech: d => startTech(d.k),
  cov: d => doCovert(d.k),
  sect: d => startSect(d.k),
  unres: () => doUnRes(),
  provo: d => doProvo(d.k),
  calm: () => doCalm(),
  mclaim: d => claimMission(+d.k),
  ini: d => startIni(d.k),
  crack: () => { if (!S.p.built.police || cdLeft('crack')) return; const c = P(); setCd('crack', 120); S.p.crack = 91; S.p.unrest = 0;
    fxToast('ההפגנות פוזרו בכוח', { ap: 5, rep: c.gov === 'democracy' ? -12 : -7 }, true); addNews('כוחות משטרה פיזרו את ההפגנות בכוח. ארגוני זכויות אדם בעולם מגנים.', 'bad');
    alive().forEach(id => { if (id !== S.player && S.c[id].gov === 'democracy') addRel(id, S.player, -3); }); renderAll(); },
  nprog: () => modal({ title: 'תוכנית גרעין סודית', html: '<p>הפרויקט ייקח כ-36 חודשים ויעלה כסף רב כל חודש. בכל חודש יש סיכוי שהעולם יגלה — ואז יבואו סנקציות ואולי תקיפות אוויריות.</p>',
    buttons: [{ label: 'התחל', cls: 'danger', fn: () => { S.p.nprog = { m: 0, disc: false, done: false }; addNews('הממשלה אישרה בחשאי פרויקט מיוחד.', 'dip'); renderAll(); } }, { label: 'ביטול' }] }),
  nstop: () => { S.p.nprog = null; addNews('תוכנית הגרעין הוקפאה.', 'dip'); renderAll(); },
  newgame: () => modal({ title: 'משחק חדש', html: '<p>המשחק הנוכחי יימחק. להמשיך?</p>', buttons: [{ label: 'כן, משחק חדש', cls: 'danger', fn: () => { wipe(); location.reload(); } }, { label: 'ביטול' }] }),
  startpick: () => beginGame(),
  zin: () => zoomBy(1.6),
  zout: () => zoomBy(1 / 1.6),
  zworld: () => { if (GP) { globeTo(gC, gKfit, 600, true); return; } if (svg) svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity); },
  globe: () => setGlobe(!GLOBE),
  clouds: () => { CLOUDS = !CLOUDS; try { localStorage.setItem('world2026_clouds', CLOUDS ? '1' : '0'); } catch (e) { /* no storage */ } drawDeco(); toast(CLOUDS ? 'עננים מוצגים' : 'בלי עננים'); },
  kbhelp: () => showKeys(),
  centerme: () => S && S.player && zoomToTid(S.player, 10),
  legend: () => $('#legend').classList.toggle('open'),
  urgent: () => openTabFresh('urgent'),
  urgpend: () => { openTab(null); processPending(); },
  urgidle: d => { ulistIds = String(d.ids).split(',').map(Number); selUnit = null; openTabFresh('ulist');
    // bring the waiting units into view above the sheet
    const u = unitById(ulistIds[0]); if (u) setTimeout(() => { if (GP) { focusUnit(u); return; } const q = MAP_PROJ([u.lon, u.lat]); if (!q) return; const sx = curT.x + curK * q[0], sy = curT.y + curK * q[1], [vx0, vy0, vx1, vy1] = visibleRect(); if (sx < vx0 + 30 || sx > vx1 - 30 || sy < vy0 + 30 || sy > vy1 - 30) zoomToMapPt(q, curK); }, 80); },
  tutnext: () => tutStep(1),
  tutskip: () => tutEnd(),
  tutstart: () => tutStart(),
  /* units */
  selunit: d => selectUnit(+d.u, 4),
  umove: () => { if (unitById(selUnit)) setMode('move', selUnit); },
  uattack: () => attackDialog(unitById(selUnit)),
  ustrike: () => strikeDialog(unitById(selUnit), 'air'),
  umissile: () => strikeDialog(unitById(selUnit), 'mis'),
  ustop: () => { const u = unitById(selUnit); if (!u) return; u.dest = null; u.via = null; u.mode = null; u.man = S.day + 30; toast(uName(u) + ' עצרה'); save(); renderAll(); },
  uret: () => { const u = unitById(selUnit); if (!u) return; sendHome(u); u.man = S.day + 30; save(); renderAll(); },
  udefend: () => { const u = unitById(selUnit); if (!u) return; const p = defendPt(u); if (!p) { sendHome(u); return; } orderTo(u, p, 'def'); },
  usplit: () => splitUnit(unitById(selUnit)),
  umerge: () => mergeUnit(unitById(selUnit)),
  mvcancel: () => { const id = uMode && uMode.uid; endMode(); if (id) selectUnit(id); },
  /* government and the world */
  gappoint: d => appointDialog(d.r),
  gfire: d => { const m = minOf(d.r); if (!m) return; modal({ title: 'לפטר את ' + esc(m.n) + '?', html: '<p>' + esc(mTitle(d.r, m)) + ' ' + esc(m.n) + ' ' + (m.g === 'f' ? 'תפוטר' : 'יפוטר') + '. פיצויים: ' + money(m.sal * 0.5) + '. התפקיד יישאר פנוי עד שתמנה מחליף.</p>', buttons: [{ label: 'פטר', cls: 'danger', fn: () => { fireMin(d.r); save(); renderAll(); } }, { label: 'ביטול' }] }); },
  gauto: d => { const m = minOf(d.r); if (!m) return; m.auto = d.v === '1'; toast(mTitle(d.r, m) + ': ' + (m.auto ? (m.g === 'f' ? 'פועלת לבד' : 'פועל לבד') : (m.g === 'f' ? 'רק ממליצה — ההחלטות שלך' : 'רק ממליץ — ההחלטות שלך'))); save(); renderSheet(); },
  gpol: d => { const m = minOf(d.r); if (!m) return; m.pol[d.k] = isNaN(+d.v) ? d.v : +d.v; save(); renderSheet(); },
  goworld: () => openTabFresh('world'),
  gonews: () => openTabFresh('news'),
  wrank: d => { wRank = d.v; renderSheet(); },
  wsel: d => { const t = mainTid(d.id); if (!t) return; selected = t; recolor(); openTabFresh('country'); setTimeout(() => zoomToTid(t, 8), 60); },
  /* statistics and animations */
  stats: () => { hideCard(); openTabFresh('stats'); },
  rclose: () => hideCard(),
  rshow: d => { const r = PS().log[+d.i]; if (r) showCard(r); },
  wst: d => { const id = +d.w; if (wstOpen.has(id)) wstOpen.delete(id); else wstOpen.add(id); renderSheet(); },
  /* cities */
  selcity: d => openCity(d.ci, 0),
  csend: d => citySendDialog(CITYI[d.ci]),
  cair: d => CITYI[d.ci] && cityStrikeDialog(CITYI[d.ci], 'air'),
  cmis: d => CITYI[d.ci] && cityStrikeDialog(CITYI[d.ci], 'mis'),
  cnuke: d => { const x = CITYI[d.ci]; if (x) confirmNuke(cst(x).o, x.id); },
  cfort: d => cityBuild(CITYI[d.ci], 'cfort'),
  cad: d => cityBuild(CITYI[d.ci], 'cad'),
  cgo: d => { const x = CITYI[d.ci]; const t = x && mainTid(landOf(x)); if (!t) return; selCity = null; citiesDirty = true; selected = t; recolor(); openTabFresh('country'); },
  fxmode: d => { setFxMode(d.v); document.querySelectorAll('[data-act=fxmode]').forEach(b => b.classList.toggle('on', b.dataset.v === FXMODE)); toast({ full: 'אנימציות מלאות', low: 'אנימציות מופחתות', off: 'בלי אנימציות' }[FXMODE]); }
};
// where to stand to defend the homeland: the part of our land closest to the main enemy
function defendPt(u) {
  const foes = warsOf(S.player).filter(w => w.pause === 0).map(w => enemyLeaderFor(w, S.player)).filter(x => S.c[x] && S.c[x].alive);
  if (!foes.length) return u.hb;
  const foe = foes.sort((a, b) => distToC(a, [u.lon, u.lat]) - distToC(b, [u.lon, u.lat]))[0];
  let best = null, bd = 1e9;
  for (const t of tidsOf(S.player)) for (const p of tp(t).in) { const d = distToC(foe, p); if (d < bd) { bd = d; best = p; } }
  return domOf(u) === 'sea' ? u.hb : best;
}
function attackDialog(u) {
  if (!u) return;
  const foes = enemiesAtWar();
  const list = foes.map(o => {
    const p = domOf(u) === 'sea' ? (snapSea(nearIn(o, [u.lon, u.lat]) || TERR[mainTid(o)].c)) : nearIn(o, [u.lon, u.lat]);
    const r = p ? planMove(u, p, 'atk') : { err: 'אין מטרה' };
    return { o, p, r };
  });
  const h = '<p>לאן לשלוח את <b>' + esc(uName(u)) + '</b>?</p>' + (list.length ? '<div class="btns col">' + list.map((x, i) => '<button class="b' + (x.r.err ? '' : ' danger') + '" data-at="' + i + '"' + (x.r.err ? ' disabled' : '') + '>' + esc(nm(x.o)) +
    '<small class="cost">' + (x.r.err ? esc(x.r.err) : (x.r.days < 1 ? 'מגיעה תוך פחות מיום' : 'הגעה בעוד ' + daysTxt(x.r.days)) + (x.r.slow < 1 ? ' · דרך הים' : '')) + '</small></button>').join('') + '</div>' : '<p class="sub">אתה לא במלחמה עם אף מדינה. אפשר לבחור מדינה על המפה — אם היא לא במלחמה איתך, תתבקש להכריז מלחמה.</p>') +
    '<p class="sub">' + (domOf(u) === 'sea' ? 'צי ליד חוף האויב חוסם אותו, מחליש את הצי שלו ומאפשר לכוחות יבשה לחצות את הים.' : domOf(u) === 'air' ? 'כנף אוויר מעל האויב מחזקת את כוחות היבשה שלנו שם (פי 2 לכל היותר). בלי כוחות יבשה — רק תקיפות.' : 'כוחות יבשה בתוך מדינת האויב כובשים שטח. ארטילריה, מטוסים וצי מחזקים אותם.') + '</p>';
  modal({ title: 'תקוף מדינה', html: h + (domOf(u) === 'land' ? '<p class="sub">כדי לכבוש עיר מסוימת: "בחר על המפה" ואז הקש על העיר.</p>' : ''), buttons: [{ label: 'בחר על המפה', cls: 'primary', fn: () => setMode('attack', u.id) }, { label: 'ביטול' }], onShow: () => {
    document.querySelectorAll('[data-at]').forEach(b => b.onclick = () => {
      const x = list[+b.dataset.at]; modalQ.shift(); $('#modal').classList.remove('open');
      orderTo(u, x.p, 'atk'); setTimeout(showModal, 30);
    });
  } });
}
function strikeDialog(u, kind) {
  if (!u) return;
  const me = P(), rng = kind === 'air' ? AIR_RANGE : MIS_RANGE[me.mlv] || 0;
  const foes = enemiesAtWar().map(o => ({ o, d: distToC(o, [u.lon, u.lat]) }));
  const h = '<p>' + esc(uName(u)) + ' — טווח ' + num(rng) + ' ק״מ ממיקום היחידה.</p>' + (foes.length ? '<div class="btns col">' + foes.map((x, i) => '<button class="b danger" data-st="' + i + '"' + (x.d > rng ? ' disabled' : '') + '>' + esc(nm(x.o)) + '<small class="cost">' + (x.d > rng ? 'מחוץ לטווח (' + num(x.d) + ' ק״מ)' : fxLine(strikeFx(x.o, kind, true))) + '</small></button>').join('') + '</div>' : '') +
    '<p class="sub">אפשר גם לבחור מטרה על המפה — גם מדינה שאתה לא במלחמה איתה (העולם יכעס).</p>';
  modal({ title: kind === 'air' ? 'תקיפה אווירית' : 'מטח טילים', html: h, buttons: [{ label: 'בחר על המפה', cls: 'primary', fn: () => setMode(kind === 'air' ? 'strike' : 'missile', u.id) }, { label: 'ביטול' }], onShow: () => {
    document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
      const x = foes[+b.dataset.st]; modalQ.shift(); $('#modal').classList.remove('open');
      strike(x.o, kind, u.id); setTimeout(showModal, 30);
    });
  } });
}
function splitUnit(u) {
  if (!u) return;
  const m2 = {}; let any = false;
  for (const k in u.m) {
    let half = u.m[k] / 2;
    if (k === 'carriers') half = Math.floor(u.m[k] / 2);
    if (half > 0) { m2[k] = half; u.m[k] -= half; any = true; }
  }
  if (!any) return;
  const p = [u.lon + 0.25, u.lat - 0.15];
  const v = newUnit(u.o, u.t, domOf(u) === 'sea' ? (isSeaAt(p) ? p : [u.lon, u.lat]) : (ownerAt(p[0], p[1]) === u.at ? p : [u.lon, u.lat]), m2);
  v.hb = u.hb.slice(); if (u.dest) { v.dest = u.dest.slice(); v.via = u.via ? u.via.map(q => q.slice()) : null; v.mode = u.mode; v.slow = u.slow; }
  toast(uName(u) + ' פוצלה: נוספה ' + uName(v));
  save(); selectUnit(u.id);
}
function mergeUnit(u) {
  if (!u) return;
  const ms = mergeables(u); if (!ms.length) return;
  ms.forEach(x => { for (const k in x.m) u.m[k] = (u.m[k] || 0) + x.m[k]; });
  S.units = S.units.filter(x => !ms.includes(x));
  toast(ms.length + ' יחידות אוחדו לתוך ' + uName(u));
  save(); selectUnit(u.id);
}
function buyUnits(k) { if (buyPkg(k, buyMul)) renderAll(); }
// order mul packages of one kind (the player's buttons and the defence minister)
function buyPkg(k, mul, quiet) {
  const B = BUY[k], c = P(); if (!B) return false;
  if ((B.minGdp && c.gdp < B.minGdp) || (B.needMl && c.mlv < B.needMl)) return false;
  const n = B.n * mul, cost = B.cost * mul;
  if (!spend(cost)) return false;
  PS().sp.buy += cost;
  S.p.queue.push({ k, n, start: S.day, due: S.day + B.days });
  const e = k === 'troops' ? { ap: -Math.min(3, mul) } : {};
  if (quiet) applyFx(e);
  else fxToast('הוזמן: ' + (k === 'troops' ? num(n * 1000).replace(/<[^>]+>/g, '') + ' חיילים' : n + ' ' + B.unit) + ' · יגיע בעוד ' + Math.round(B.days / DPM) + ' חודשים', e);
  return true;
}
function mobilize(quiet) {
  const c = P(); if (c.res < 1 || cdLeft('mob')) return false;
  const n = Math.min(c.res, Math.max(1, c.res * 0.5)), e = { ap: activeWars(S.player) ? -2 : -5 };
  setCd('mob', 30); S.p.queue.push({ k: 'mobarrive', n, start: S.day, due: S.day + 3 }); c.res -= n;
  if (quiet) applyFx(e); else fxToast('צו 8: ' + troopsPlain(n) + ' אנשי מילואים בדרך', e, true);
  addNews('הממשלה הוציאה צווי חירום: ' + troopsPlain(n) + ' אנשי מילואים גויסו.', 'war');
  return true;
}
function demobilize(quiet) {
  const c = P(); if (!(c.mob > 0)) return false;
  const n = c.mob; c.inv.troops = Math.max(0, c.inv.troops - n); c.res += n; c.mob = 0;
  if (quiet) applyFx({ ap: 2 }); else fxToast('המילואימניקים חזרו הביתה', { ap: 2 });
  addNews('אנשי המילואים שוחררו וחזרו לעבודה.', 'good');
  return true;
}
function startProj(k, quiet) {
  const D = PROJ[k]; if (!D || S.p.proj.some(q => q.k === k) || (S.p.built[k] || 0) >= projMax(k)) return false;
  const cost = projCost(k); if (!spend(cost)) return false;
  S.p.proj.push({ k, start: S.day, due: S.day + D.days });
  if (!quiet) toast('הפרויקט "' + D.he + '" התחיל · יושלם בעוד ' + Math.round(D.days / DPM) + ' חודשים');
  addNews('הממשלה השיקה פרויקט לאומי: ' + D.he + '.', 'good');
  return true;
}
function dipToggle(type, label, good, bad) {
  const o = selOwner(), C = S.c[o];
  if (hasPact(o, S.player, type)) {
    setPact(o, S.player, type, false);
    G().no[type + ':' + o] = S.day + 365; // the foreign minister won't sign it again behind the player's back
    fxToast(label + ' עם ' + C.he + ' בוטל', { rep: bad.rep, rel: { [o]: bad.rel } }, true); addNews('ביטלנו את ה' + label + ' עם ' + C.he + '.', 'dip'); renderAll(); return;
  }
  if (cdLeft('dip:' + o)) return;
  setCd('dip:' + o, 30);
  const r = aiScore(type, o);
  if (r.ok) { setPact(o, S.player, type, true); fxToast(C.he + ' הסכימה! ' + label, { rep: good.rep, rel: { [o]: good.rel } }); addNews('נחתם ' + label + ' בין ' + P().he + ' ל' + C.he + '.', 'good'); }
  else { addRel(o, S.player, -2); toast(C.he + ' סירבה: ' + r.why + ' (אפשר לנסות שוב בעוד חודש)', true); }
  renderAll();
}
function confirmWar(o, after, what) {
  if (!o || o === S.player) return;
  const C = S.c[o], j = likelyJoiners(S.player, o);
  const nap = hasPact(o, S.player, 'nap');
  let defP = power(C) * 1.3; j.forEach(c => defP += power(S.c[c]) * 0.35 * allyProj(c, o, S.player));
  const ratio = power(P()) * proj(S.player, o) / (defP + 1);
  const e = warFx(o);
  let h = (what ? '<p class="warnbox">' + esc(what) + ' נכנסת לשטח של ' + esc(C.he) + ' — זו הכרזת מלחמה.</p>' : '') + '<p>להכריז מלחמה על <b>' + C.he + '</b>?</p><ul class="plain">' +
    '<li>' + (adjacent(S.player, o) ? 'שכנה — כוחות יבשה יכולים להיכנס ישר מעבר לגבול.' : 'אין גבול יבשתי (' + num(dist(S.player, o)) + ' ק״מ) — כוחות יבשה צריכים צי שלך באזור כדי לחצות, והמלחמה יקרה ואיטית יותר.') + '</li>' +
    '<li>יחס כוחות אפקטיבי בחזית: ' + num(ratio, 1) + ' : 1 ' + (ratio > 2 ? '(טוב)' : ratio > 1 ? '(צמוד)' : '(מסוכן!)') + '</li>' +
    (j.length ? '<li class="red">צפויות להצטרף לצד האויב: ' + j.slice(0, 8).map(nm).join(', ') + (j.length > 8 ? ' ועוד ' + (j.length - 8) : '') + '</li>' : '<li>אין לה בעלות ברית שצפויות להגן עליה.</li>') +
    (nap ? '<li class="red">יש לכם הסכם אי-תוקפנות — הפרתו תפגע במוניטין שלך בכל העולם.</li>' : '') +
    (justified(o) ? '<li>יש לך סיבה: ' + (provoked(o) ? 'הם תקפו אותך או את בעלות בריתך.' : 'רוב העולם מתנגד להם.') + ' העולם יכעס פחות.</li>' : '<li class="red">מלחמה בלי סיבה — העולם יראה בך תוקפן.</li>') +
    '<li>כדי לכבוש צריך להכניס לשם כוחות יבשה (חי״ר ושריון) — הקש על יחידה שלך ← "תקוף מדינה".</li>' +
    '<li>מלחמה עולה כסף, הורגת חיילים ומעייפת את העם.</li></ul><div class="box">צפוי: ' + fxLine(e) + '</div>';
  modal({ title: 'הכרזת מלחמה', html: h, buttons: [{ label: 'הכרז מלחמה', cls: 'danger', fn: () => {
    const just = justified(o);
    const w = declareWar(S.player, o); if (w) { w.just = just; fxToast('המלחמה החלה', { ap: e.ap, rep: e.rep }, true); syncAllUnits();
      if (after) { after(); renderAll(); } else { selected = o; renderAll(); openTabFresh('wars'); setTimeout(() => zoomToTid(o, 10), 280); } }
  } }, { label: 'ביטול' }] });
}
// air strike or missile salvo, during a war or as a stand-alone attack
const sancTxt = n => n === 1 ? 'מדינה אחת הטילה עלינו סנקציות' : n + ' מדינות הטילו עלינו סנקציות';
function strike(o, kind, uid, ci, byMin) {
  if (!o || !S.c[o] || !S.c[o].alive || o === S.player) return;
  const me = P(), E = S.c[o], sr = strikeRange(o);
  // a strike on one city (civilians) instead of on military targets
  const cx = ci && CITYI[ci] && S.ct ? CITYI[ci] : null, cS = cx ? cst(cx) : null;
  if (cx && (cS.o !== o || S.owner[cx.tid] === S.player)) { toast('אי אפשר לתקוף את העיר הזו', true); return; }
  // a strike by one specific air wing / missile battery on the map: its own range and its own planes
  const su = uid != null ? unitById(uid) : null;
  if (su) {
    const have = kind === 'air' ? fl(su.m.air) : fl(su.m.msl), need = kind === 'air' ? 4 : 5;
    const rng = kind === 'air' ? AIR_RANGE : MIS_RANGE[me.mlv] || 0;
    if (have < need) { toast(kind === 'air' ? 'אין מספיק מטוסים ביחידה' : 'אין מספיק טילים ביחידה', true); return; }
    if (distToC(o, [su.lon, su.lat]) > rng) { toast('המטרה מחוץ לטווח של ' + uName(su) + ' (' + rng.toLocaleString('en-US') + ' ק״מ)', true); return; }
  } else if (kind === 'air' ? !sr.air : !sr.mis) { toast('המטרה מחוץ לטווח', true); return; }
  const ck = (kind === 'air' ? 'air:' : 'mis:') + o + (su ? ':' + su.id : ''); if (cdLeft(ck)) { toast('היחידה עוד מתארגנת — אפשר שוב בעוד ' + daysTxt(cdLeft(ck)).replace(/<[^>]+>/g, ''), true); return; }
  const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
  if (w && w.pause > 0) { toast('יש הפסקת אש', true); return; }
  const preview = strikeFx(o, kind, !!w);
  const cost = strikeCost(kind);
  if (!spend(cost)) return;
  setCd(ck, kind === 'air' ? 14 : 20);
  const before = invSnap(E);
  let frac, lost = 0, used = 0, civ = 0;
  const dens = densF(o);
  if (kind === 'air') {
    used = su ? Math.min(sortie(), fl(su.m.air)) : sortie();
    frac = clamp(used * me.q / (E.inv.air * 0.5 + E.inv.tanks * 0.03 + 40) * 0.1, 0.004, 0.1) * (1 - 0.15 * E.adv) * (cx ? 0.3 : 1);
    lost = Math.round(used * [0.003, 0.01, 0.025, 0.05][E.adv] * (0.5 + R()) * (cx && cS.a ? 1.6 : 1));
    me.inv.air = Math.max(0, me.inv.air - lost);
    if (su) su.m.air = Math.max(0, (su.m.air || 0) - lost);
    hurtInv(E, frac, ['air', 'heli', 'tanks', 'art', 'msl']); hurtInv(E, frac * 0.4, ['ships', 'afv']); hurtInv(E, frac * 0.15, ['troops']);
    E.gdp *= 1 - frac * 0.06;
    // precision bombs on military targets: few civilians, more in crowded countries; bombing a city kills many
    civ = cx ? cityCiv(cx, 'air', used, cS.a) * (0.7 + R() * 0.6) : used * 0.25 * dens * (0.4 + R() * 0.8);
  } else {
    used = su ? Math.min(salvo(), fl(su.m.msl)) : salvo(); me.inv.msl = Math.max(0, me.inv.msl - used);
    if (su) su.m.msl = Math.max(0, (su.m.msl || 0) - used);
    const hits = used * (1 - [0, 0.25, 0.5, 0.75][E.adv]);
    frac = clamp(hits / (hits + 300) * 0.2, 0.002, 0.06) * (cx ? 0.3 : 1);
    hurtInv(E, frac, ['air', 'art', 'msl', 'ships']); hurtInv(E, frac * 0.5, ['tanks']); hurtInv(E, frac * 0.2, ['troops']);
    E.gdp *= 1 - frac * 0.12;
    // ballistic missiles are less precise: more civilians per hit (far more on a city)
    civ = cx ? cityCiv(cx, 'mis', hits, cS.a) * (0.7 + R() * 0.6) : hits * 0.7 * dens * (0.4 + R() * 0.8);
  }
  const cdInc = cx ? cityHit(cx, cityDmgInc(kind, kind === 'air' ? used : used * (1 - [0, 0.25, 0.5, 0.75][E.adv]), cS.a)) : 0;
  const loss = lossFrom(E, before);
  civCas(loss, Math.round(civ), 2.5 + R());
  E.pop = Math.max(0.01, E.pop - loss.ck / 1e6);
  const own = newCas(); own.sp = cost;
  if (kind === 'air') { if (lost) { own.eq.air = lost; own.sk = Math.round(lost * 0.5); own.sw = Math.round(lost * 0.3); } } else own.mu = used;
  // civilians we kill cost us in the world's eyes
  const repCiv = cx ? -clamp(6 + Math.sqrt(loss.ck) / 3, 6, 35) : -Math.min(8, Math.sqrt(loss.ck) / 8);
  const what = (kind === 'air' ? 'תקיפה אווירית' : 'מטח טילים') + (cx ? ' על העיר ' + cityName(cx) : '') + (su ? ' (' + uName(su) + ')' : '');
  const lp = launchPt(S.player, kind, o, su), tp_ = cx ? cityPt(cx) : targetPt(o, lp);
  let fx, sancN = 0, retal = false;
  if (w) {
    const eff = clamp(power(me) / (power(E) + power(me) + 1) * 2, 0.15, 1.5) * Math.sqrt(proj(S.player, o));
    const amt = (kind === 'air' ? eff : 0.75) * (cx ? 0.3 : 1);
    // strikes only help take ground where our ground forces are already fighting
    const ground = !(w.a === S.player || w.b === S.player) || forcesIn(S.player, o, E.adv).l > 0;
    if (ground) { if (w.A.includes(S.player)) w.f += amt; else w.f -= amt; w.f = clamp(w.f, -100, 100); }
    if (kind === 'mis' || cx) alive().forEach(id => { if (id !== S.player && id !== o && (isAlly(id, o) || (cx && S.c[id].gov === 'democracy'))) addRel(id, S.player, cx ? -4 : -3); });
    fx = applyFx(cx ? { rep: repCiv, ap: me.gov === 'democracy' ? -2 : -1, rel: { [o]: -20 } } : repCiv <= -0.5 ? { rep: repCiv } : {});
  } else {
    // a stand-alone attack: the target, its friends and the world react
    alive().forEach(id => {
      if (id === S.player || id === o) return;
      if (isAlly(id, o)) addRel(id, S.player, kind === 'air' ? -15 : -12);
      else if (S.c[id].gov === 'democracy' && !justified(o)) addRel(id, S.player, -3);
    });
    if (!justified(o)) alive().forEach(id => {
      const C = S.c[id]; if (id === S.player || id === o || C.gov !== 'democracy' || C.gdp < 50 || S.sanc[id + '>' + S.player]) return;
      if (rel(id, S.player) < -30 && R() < 0.3) { S.sanc[id + '>' + S.player] = 1; sancN++; }
    });
    S.p.lastStrike = { o, day: S.day };
    fx = cx ? applyFx({ ap: me.gov === 'democracy' ? -3 : -1, rep: (justified(o) ? -3 : -10) + repCiv, rel: { [o]: -50 } }) : applyFx({ ap: preview.ap, rep: preview.rep + repCiv, rel: preview.rel });
    retal = R() < Math.min(0.95, retaliateChance(o) + (cx ? 0.2 : 0));
  }
  const r = strikeRecord({ k: kind, by: S.player, at: o, cas: loss, own, fx, unit: su ? uName(su) : null, war: !!w, used, lost, sanc: sancN, ci: cx ? cx.id : null, cn: cx ? cityName(cx) : null, cd: cdInc, min: byMin ? 1 : 0 });
  addNews(what + (w ? '' : ' (בלי הכרזת מלחמה)') + (cx ? ' (' + E.he + ')' : ' ב' + E.he) + ': ' + nT(killed(loss)) + ' הרוגים' + (eqTxt(loss.eq, 3) ? ', הושמדו ' + eqTxt(loss.eq, 3) : '') + (lost ? (lost === 1 ? '. איבדנו מטוס אחד' : '. איבדנו ' + lost + ' מטוסים') : '') + '.' + (sancN ? ' ' + sancTxt(sancN) + '.' : ''), 'war');
  if (sancN) toast(sancTxt(sancN), true);
  if (retal) {
    const nw = declareWar(o, S.player, { provoked: true, joinAtt: true, noRally: true });
    if (nw) { addNews(E.he + ' הגיבה לתקיפה והכריזה עלינו מלחמה!', 'war'); r.retal = true; }
  }
  if (w) checkWarEnd(w);
  fxStrike(kind, lp, tp_, used, r);
  needMapRecolor = true;
  save(); renderAll();
}
function confirmNuke(o, ci) {
  if (!o || !S.c[o] || !S.c[o].alive || P().nukes <= 0 || o === S.player) return;
  const cx = ci && CITYI[ci] ? CITYI[ci] : S.ct ? nukeTargetCity(o) : null;
  if (!strikeRange(o).nuke) { toast('אין אמצעי שיגור בטווח', true); return; }
  const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
  const ret = alive().filter(id => id !== S.player && S.c[id].nukes > 0 && (id === o || isAlly(id, o)));
  const h = '<div class="nukewarn"><p><b>אתה עומד לשגר נשק גרעיני על ' + (cx ? esc(cityName(cx)) + ' (' + nm(o) + ')' : nm(o)) + (w ? '' : ' — בלי שאנחנו במלחמה איתה') + '.</b></p><ul class="plain">' +
    (cx ? '<li class="red">בעיר ' + cityPopT(cx) + ' תושבים. צפויים כ-' + num(nukeCityEst(cx)) + ' הרוגים, ועוד יותר פצועים. העיר תיחרב לשנים.</li>' : '<li>מיליוני אזרחים ייפגעו.</li>') + '<li>כל העולם יפנה נגדך: יחסים יקרסו וסנקציות יוטלו כמעט מכל מדינה. המוניטין שלך ' + sgn(-50) + '.</li>' +
    (ret.length ? '<li class="red">מדינות גרעיניות שעלולות להשיב: ' + ret.slice(0, 6).map(nm).join(', ') + '. תגובה גרעינית עלולה להחריב את המדינה שלך.</li>' : '<li>לאויב ולבעלות בריתו אין נשק גרעיני — אבל העולם לא ישכח.</li>') +
    (w ? '' : '<li class="red">' + nm(o) + ' ובעלות בריתה כמעט בוודאות יכריזו עלינו מלחמה.</li>') +
    '<li>העם שלך יהיה בהלם — תמיכה תצנח.</li></ul><label class="chk"><input type="checkbox" id="nukeok"> אני מבין את ההשלכות</label></div>';
  modal({ title: 'אזהרה: תקיפה גרעינית', cls: 'danger', html: h, buttons: [
    { label: 'שגר', cls: 'nuke', keep: true, fn: () => {
      if (!$('#nukeok') || !$('#nukeok').checked) { toast('סמן קודם שאתה מבין את ההשלכות', true); return; }
      modalQ.shift(); $('#modal').classList.remove('open');
      if (!S.c[o].alive || P().nukes <= 0) return;
      P().nukes--; const nr = nukeImpact(S.player, o, false, cx ? cx.id : null);
      nr.fx = applyFx({ rep: -50 });
      if (w && S.wars.includes(w)) { if (w.A.includes(S.player)) w.f += 35; else w.f -= 35; w.f = clamp(w.f, -100, 100); checkWarEnd(w); }
      else if (!w && S.c[o].alive && R() < 0.9) declareWar(o, S.player, { provoked: true, joinAtt: true, noRally: true });
      approvalQuick(); save(); renderAll();
      setTimeout(showModal, 30);
    } },
    { label: 'ביטול', cls: 'primary' }] });
}
function approvalQuick() { const c = P(); c.approval = clamp(c.approval + S.p.shock, 0, 100); S.p.shock = 0; }
// how willing the enemy is to accept our terms (compared with 0 cease-fire … 60 annexation)
function peaceW(w) {
  const en = enemyLeaderFor(w, S.player), fp = mySideFront(w, S.player), age = S.turn - w.start, E = S.c[en];
  const pr = power(P()) / (power(E) + 1);
  let W = fp * 1.2 + age * 0.8 + clamp((pr - 1) * 10, -15, 25) + rel(en, S.player) / 5 + (100 - E.approval) / 10 + (S.p.rep - 50) / 5 + (R() - 0.5) * 20;
  if (fp < 0) W += fp * 0.5;
  // holding their capital makes them much readier to give in (and losing ours, much less)
  if (S.ct) { if (capHeldBy(en, S.player)) W += 20; if (capHeldBy(S.player, en)) W -= 20; }
  return W;
}
function peaceDialog(wid) {
  const w = S.wars.find(x => x.id === wid); if (!w) return;
  const en = enemyLeaderFor(w, S.player), fp = mySideFront(w, S.player);
  const opts = [['cease', 'הפסקת אש (6 חודשים)', true], ['white', 'שלום ללא תנאים', true], ['repar', 'דרוש פיצויים<small class="cost">' + money(S.c[en].gdp * 0.04) + '</small>', true],
    ['terr', '', fp >= 15], ['annex', 'דרוש כניעה מלאה וסיפוח', fp >= 70]];
  const tcl = fp >= 15 ? pickCede(S.player, en, Math.max(0, fp) / 200) : [];
  opts[3][1] = 'דרוש שטחים (' + Math.round(cedeShare(en, tcl, clamp(Math.max(0, fp) / 200, 0.02, 0.5)) * 100) + '% מהם)';
  if (tcl.length) opts[3][1] += '<small class="cost">נקבל את: ' + esc(cedeNames(tcl)) + '</small>';
  let h = '<p>מה להציע ל' + nm(en) + '? כרגע אנחנו ' + (fp >= 0 ? 'מחזיקים ' + Math.round(fp) + '% משטחם.' : 'מאבדים — הם מחזיקים ' + Math.round(-fp) + '% משטחנו.') + '</p><p class="sub">ככל שאתה מנצח יותר — הם יסכימו לתנאים קשים יותר. שלום: העם ' + sgn(3) + ' · העולם ' + sgn(5) + '.</p><div class="btns col">';
  opts.forEach(([k, l, ok]) => { h += '<button class="b" data-pk="' + k + '"' + (ok ? '' : ' disabled') + '>' + l + '</button>'; });
  h += '</div>';
  modal({ title: 'משא ומתן', html: h, buttons: [{ label: 'סגור' }], onShow: () => {
    document.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => {
      const k = b.dataset.pk; modalQ.shift(); $('#modal').classList.remove('open');
      const W = peaceW(w);
      const need = { cease: 0, white: 10, repar: 35, terr: 40, annex: 60 }[k];
      if (W > need || (k === 'annex' && fp >= 90)) { applyPeace(w, k, S.player, en, Math.max(0, fp) / 200, k === 'terr' ? tcl : null); toast(nm(en) + ' הסכימה!'); }
      else { toast(nm(en) + ' דחתה את ההצעה', true); addNews(nm(en) + ' דחתה את הצעת ה' + (k === 'cease' ? 'הפסקת אש' : 'שלום') + ' שלנו.', 'bad'); }
      save(); renderAll(); setTimeout(showModal, 30);
    });
  } });
}
function showGameOver() {
  if (showGameOver.done) return; showGameOver.done = true;
  modal({ title: 'סוף המשחק', cls: 'danger', html: '<p>' + esc(S.over.txt) + '</p><p>שרדת ' + S.turn + ' חודשים (עד ' + esc(dayTxt(S.day)) + '). ניקוד סופי: <b>' + num(score()) + '</b></p>',
    buttons: [{ label: 'משחק חדש', cls: 'primary', fn: () => { wipe(); location.reload(); } }, { label: 'הסתכל על המפה' }] });
}
function showHelp() {
  modal({ title: 'איך משחקים', html:
    '<ul class="plain help">' +
    '<li><b>המטרה:</b> לשרוד ולהגדיל את המדינה שלך עד 2036, או לשלוט ב-35% מהכלכלה העולמית.</li>' +
    '<li><b>הזמן רץ:</b> השעון למעלה מתקדם לבד. ⏸ עוצר, ×1 = יום בשנייה, ×2/×4/×8 מהר יותר. כסף נכנס כל יום. כשקורה משהו חשוב (מלחמה, הצעת שלום, אסון) המשחק נעצר ושואל אותך.</li>' +
    '<li><b>העם (אהבת העם):</b> מתחת ל-30% — הפגנות. מתחת ל-15% כמה חודשים — מהפכה ואתה בחוץ. מסים גבוהים, קיצוץ ברווחה, גיוס, הרוגים ומלחמות ארוכות מורידים. מסים נמוכים, רווחה, פרויקטים וניצחונות מעלים. כשתוקפים אותך — העם מתלכד.</li>' +
    '<li><b>מוניטין עולמי (0–100):</b> איך העולם רואה אותך. תקיפות בלי סיבה, מלחמה, הפרת הסכמים, גרעין, סיפוח ודיכוי מורידים. סיוע, עזרה באסונות, שלום, סחר ופליטים מעלים. מוניטין נמוך = סנקציות, סירובים ואויבים.</li>' +
    '<li><b>לפני כל פעולה</b> כתוב על הכפתור מה יקרה (למשל: העם −2 · העולם −10), ואחרי הפעולה קופצת הודעה עם התוצאה.</li>' +
    '<li><b>כלכלה:</b> מס, רווחה ותקציב ביטחון. אפשר להיכנס לחוב, אבל חוב גדול מדי = פשיטת רגל.</li>' +
    '<li><b>בית:</b> פרויקטים (בתי חולים, בתי ספר, תשתיות, דיור, אנרגיה ירוקה ועוד) עולים כסף ולוקחים זמן, ואז משפרים את העם או את הצמיחה.</li>' +
    '<li><b>צבא:</b> מספרים אמיתיים — חיילים, טנקים, מטוסים, ספינות. קונים בלשונית צבא, וזה מגיע אחרי זמן ייצור (מטוס — שנה, ספינה — שנתיים). מילואים מגיעים תוך ימים, אבל העם והכלכלה סובלים.</li>' +
    '<li><b>מפה:</b> צבוט כדי להגדיל, גרור כדי לזוז, הקש על מדינה כדי לפתוח אותה, הקש על סמל של יחידה כדי לפקד עליה. צהוב = אתה, כחול = בעלות ברית, אדום = במלחמה איתך.</li>' +
    '<li><b>דיפלומטיה:</b> הקש על מדינה: סיוע, סחר, ברית, אי-תוקפנות, סנקציות או מלחמה. אחרי ניסוי שנכשל — מחכים חודש.</li>' +
    '<li><b>תקיפות:</b> אפשר לתקוף מהאוויר או בטילים כל מדינה בטווח — גם בלי מלחמה. זה פוגע בצבא שלהם, אבל העולם כועס והם עלולים להכריז מלחמה.</li>' +
    '<li><b>יחידות על המפה:</b> הצבא שלך מופיע על המפה כסמלים קטנים בצהוב — חי״ר, שריון, ארטילריה, טילים, מטוסים, מסוקים, ציים וצוללות (המקרא למטה משמאל). המספר מתחת לסמל = כמה יש ביחידה (למשל 120K חיילים, 450 טנקים, 60✈ מטוסים).</li>' +
    '<li><b>להזיז יחידה:</b> הקש על הסמל ← "הזז" ← הקש על היעד במפה. קו מקווקו מראה את הדרך וכמה ימים זה ייקח. חי״ר עובר כ-30 ק״מ ביום, שריון כ-40, ספינות כ-500, ומטוסים מגיעים תוך יום (עד 2,500 ק״מ מבסיס או מנושאת מטוסים).</li>' +
    '<li><b>ים:</b> כוחות יבשה הולכים רק ביבשה, לשכנות. כדי לחצות ים (למשל לאי) — קודם שלח צי שלך לאזור, ואז כוחות היבשה יעברו (לאט יותר).</li>' +
    '<li><b>פקודות נוספות:</b> "תקוף מדינה" שולח את היחידה לתוך מדינת אויב. "הגן על הבית" — לגבול מול האויב. "חזור הביתה", "פצל לשתיים" ו"אחד" יחידות שעומדות באותו מקום. כנף אוויר יכולה גם לבצע תקיפה אווירית.</li>' +
    '<li><b>מלחמה:</b> כדי לכבוש שטח צריך להכניס כוחות יבשה (חי״ר ושריון) לתוך מדינת האויב. ארטילריה, מטוסים ומסוקים מחזקים אותם, וצי ליד החוף חוסם ומגן על הכוחות שחוצים את הים. בלי כוחות יבשה בפנים — אפשר רק לתקוף מהאוויר ובטילים. כבשת 100% — המדינה מסופחת. אבדות מורידות חיילים, טנקים ומטוסים מהיחידות שנלחמות.</li>' +
    '<li><b>ערים:</b> על המפה יש ערים אמיתיות — ★ = עיר בירה, נקודה = עיר, ⚓ = נמל. כשהמפה רחוקה רואים רק בירות; ככל שמגדילים מופיעות עוד ערים. הצבע אומר מי שולט בעיר: צהוב — אתה, אדום — אויב, כחול — בעלת ברית. טבעת מקווקוות = עיר כבושה, טבעת כתומה מהבהבת = מצור. הקש על עיר כדי לראות אותה ולפעול.</li>' +
    '<li><b>לכבוש עיר:</b> שלח לעיר כוחות יבשה (בכרטיס העיר ← "שלח כוחות", או "הזז" ואז הקש על העיר). כשהכוחות שלך שם חזקים פי <span class="num">1.5</span> מהמגינים — מתחיל מצור, ואחרי כמה ימים העיר נופלת. ערים שנכבשו מגדילות את אחוז השטח הכבוש (לפי כמה אנשים גרים בהן). כיבוש הבירה מקרב מאוד את הכניעה של האויב. האויב יכול לכבוש בחזרה — וגם לצור על הערים שלך (תקבל התראה).</li>' +
    '<li><b>תקיפה על עיר:</b> הורגת הרבה יותר אזרחים מתקיפה על מטרות צבאיות, ופוגעת קשה במוניטין. עיר שנפגעה מאטה את הכלכלה עד שהיא משתקמת (לאט). בערים שלך אפשר לבנות ביצורים (קשה יותר לכבוש) והגנה אווירית (פחות נפגעים). עיר שנכבשה מורידה את הכלכלה ואת אהבת העם.</li>' +
    '<li><b>נמלים:</b> צי שעוגן ליד נמל שלך מקבל תיקונים וספינות חדשות.</li>' +
    '<li><b>האויב:</b> יחידות האויב בסמלים אדומים. הן מגינות, ולפעמים פולשות למדינה שלך — השאר כוח בבית! כשהמפה רחוקה, יחידות באותה מדינה מתאחדות לסמל אחד עם מספר; הקש עליו או הגדל את המפה כדי לראות כל יחידה. ⚔ = קרב בין מדינות אחרות.</li>' +
    '<li><b>יחס כוחות:</b> בכרטיס היחידה ובלשונית מלחמות כתוב יחס הכוחות (למשל <span class="num" dir="ltr">8:1</span>) ומתי צפוי ניצחון. כשצד אחד חזק פי כמה — הקרב נגמר מהר: הצד החלש נשבר, נסוג או נכנע (שבויים). כוחות שקולים — מלחמה ארוכה.</li>' +
    '<li><b>מה דחוף (!):</b> הכפתור למעלה מראה מה מחכה לך — עיר במצור, קופה במינוס, מלחמה שהולכת רע, יחידות שמחכות, משלוחים שהגיעו. הקש על שורה כדי להגיע לשם.</li>' +
    '<li><b>תקציב השרים:</b> שר האוצר נותן לכל שר תקציב לחודש. כשהקופה במינוס אף שר לא קונה, בונה או שולח סיוע — חוץ מגיוס חירום כשפולשים אלינו.</li>' +
    '<li><b>שלום:</b> בלשונית מלחמות. ככל שאתה מנצח יותר, תוכל לדרוש יותר.</li>' +
    '<li><b>אבדות וסטטיסטיקות:</b> אחרי כל תקיפה (שלך או עליך) קופץ כרטיס "תוצאות התקיפה": הרוגים ופצועים — חיילים ואזרחים — ציוד שהושמד, עלות, ומה זה עשה לעם ולעולם. בלשונית מלחמות יש לכל מלחמה גרפים ויומן קרבות, ובתפריט ☰ ← "סטטיסטיקות" — כל המספרים שלך ושל העולם.</li>' +
    '<li><b>מחיר הדם:</b> חיילים שנהרגים מורידים את אהבת העם, ואזרחים שלנו שנהרגים — עוד יותר. אזרחים שאנחנו הורגים (בעיקר בטילים ובגרעין) פוגעים במוניטין בעולם.</li>' +
    '<li><b>ממשלה (שרים):</b> בלשונית "ממשלה" ממנים ארבעה שרים — ביטחון, אוצר, בינוי ופנים, חוץ. לכל שר יש שם, מיומנות (★ 1–5), תכונה (זהיר, תוקפני, חסכן, פופוליסט, מושחת, דיפלומט...), שכר והשפעה על העם. בוחרים מתוך 3 מועמדים, ואפשר לפטר ולהחליף.</li>' +
    '<li><b>"פועל לבד":</b> שר כזה עושה את העבודה במקומך: שר הביטחון מגן על הגבול, שולח כוחות לחזיתות ומחזיר יחידות פגועות (לפי הגישה — הגנה / מאוזן / התקפה), שר האוצר מכוון מס ורווחה לפי היעד, שר הבינוי בונה פרויקטים מכסף פנוי, ושר החוץ חותם על הסכמי סחר, שולח סיוע ומציע שלום כשהמלחמה רעה. אף שר לא מכריז מלחמה. כל צעד מופיע ב"דיווחי השרים" ובהודעה קטנה. "רק ממליץ" = השר רק נותן המלצה בדיאלוגים.</li>' +
    '<li><b>ההחלטה שלך גוברת:</b> פקודה שנתת ליחידה — שר הביטחון לא נוגע בה חודש. שינית מס או תקציב ביטחון — השר לא משנה אותם שלושה חודשים. ביטלת הסכם — שר החוץ לא יחתום עליו מחדש.</li>' +
    '<li><b>אירועים:</b> כל כמה שבועות קורה משהו — שביתות, הפגנות, שערוריות, אסונות, תגליות, הפיכות, משברי נפט, בקשות לברית ועוד. באירוע עם החלטה המשחק נעצר, ועל כל אפשרות כתוב מה היא תעשה. אם יש שר מתאים שפועל לבד — הוא מחליט בעצמו ומדווח.</li>' +
    '<li><b>העולם חי:</b> מדינות אחרות צומחות ונכנסות למיתון, מגדילות צבא, בונות, עורכות בחירות (עם מנהיגים חדשים), עוברות הפיכות, חותמות על בריתות ומטילות סנקציות. בכרטיס של כל מדינה — "מה קורה שם", ובלשונית חדשות ← "העולם" — דירוג המדינות החזקות ומי עולה ויורד (▲▼).</li>' +
    '<li><b>אנימציות:</b> טילים, מטוסים, פיצוצים וקרבות מופיעים על המפה. בתפריט ☰ אפשר להפחית או לכבות אותן.</li>' +
    '<li><b>במחשב:</b> גלגלת = זום סביב העכבר, ריחוף = פרטים על מדינה, עיר או יחידה. כשיחידה שלך נבחרה — <b>קליק ימני</b> על המפה שולח אותה לשם (על אויב — תקיפה). רווח = עצור/המשך, <kbd>1</kbd>–<kbd>4</kbd> = מהירות, <kbd>Esc</kbd> = ביטול, <kbd>+</kbd>/<kbd>-</kbd> = זום, <kbd>Home</kbd> = המדינה שלי, <kbd>?</kbd> = כל הקיצורים.</li>' +
    '<li><b>מדינות קטנות קשות יותר.</b> המשחק נשמר אוטומטית כל כמה שניות.</li></ul>' });
}
function showMenu() {
  const fxSeg = '<h3 class="mh">אנימציות (פיצוצים וקרבות)</h3><div class="seg">' + [['full', 'מלאות'], ['low', 'מופחתות'], ['off', 'כבויות']].map(([v, l]) => '<button class="' + (FXMODE === v ? 'on' : '') + '" data-act="fxmode" data-v="' + v + '">' + l + '</button>').join('') + '</div>';
  modal({ title: 'תפריט', html: '<div class="btns col">' + btn('help', 'איך משחקים') + btn('tutstart', 'הדרכה קצרה (7 צעדים)') + btn('tab', 'ממשלה ושרים', '', ' data-tab="gov"') + btn('goworld', 'העולם — דירוג ומגמות') + btn('stats', 'סטטיסטיקות ואבדות') + btn('centerme', 'מרכז את המפה על המדינה שלי') + btn('globe', GLOBE ? '🗺️ מעבר למפה שטוחה' : '🌍 מעבר לגלובוס תלת־ממדי') + (GLOBE ? btn('clouds', CLOUDS ? 'הסתר עננים' : 'הצג עננים') : '') + (isDesk() ? btn('kbhelp', 'קיצורי מקלדת ועכבר (?)') : '') + btn('newgame', 'משחק חדש', 'danger') + '</div>' + fxSeg + '<p class="sub">"מופחתות" — רק פיצוץ קצר במקום הפגיעה, בלי הבזקים ורעידות. המשחק נשמר אוטומטית כל כמה שניות.</p>',
    buttons: [{ label: 'סגור' }], onShow: () => document.querySelectorAll('#m-body .btns [data-act]').forEach(b => b.addEventListener('click', () => { modalQ.shift(); $('#modal').classList.remove('open'); setTimeout(showModal, 30); }, { once: true })) });
}

/* ================= start screen ================= */
let pickId = null;
function difficulty(id) {
  const rank = alive().sort((a, b) => power(S.c[b]) - power(S.c[a])).indexOf(id);
  return rank < 10 ? ['קל', 'ok'] : rank < 40 ? ['בינוני', 'warn'] : rank < 100 ? ['קשה', 'bad'] : ['קשה מאוד', 'bad'];
}
function initStart() {
  $('#start').classList.add('open');
  const list = alive().sort((a, b) => S.c[a].he.localeCompare(S.c[b].he, 'he'));
  const render = q => {
    q = (q || '').trim().toLowerCase();
    $('#plist').innerHTML = list.filter(id => !q || S.c[id].he.toLowerCase().includes(q) || S.c[id].en.toLowerCase().includes(q))
      .map(id => '<li data-pid="' + id + '"' + (id === pickId ? ' class="on"' : '') + '>' + esc(S.c[id].he) + '<small>' + money(S.c[id].gdp, true) + '</small></li>').join('');
  };
  render('');
  $('#psearch').addEventListener('input', e => render(e.target.value));
  $('#plist').addEventListener('click', e => { const li = e.target.closest('[data-pid]'); if (li) { startPick(li.dataset.pid); zoomToTid(li.dataset.pid, 8); } });
  startPick.render = render;
}
function startPick(id) {
  if (!S.c[id] || !S.c[id].alive) return;
  pickId = id; selected = id; recolor();
  const c = S.c[id], [dl, dc] = difficulty(id);
  $('#pcard').innerHTML = '<h2>' + esc(c.he) + ' ' + chip('קושי: ' + dl, dc) + '</h2>' +
    '<div class="grid g3"><div><small>אוכלוסייה</small>' + popTxt(c.pop) + '</div><div><small>תמ״ג</small>' + money(c.gdp, true) + '</div><div><small>עוצמה צבאית</small>' + num(power(c)) + '</div>' +
    '<div><small>חיילים</small>' + troopsTxt(c.inv.troops) + '</div><div><small>טנקים</small>' + cnt(c.inv.tanks) + '</div><div><small>מטוסי קרב</small>' + cnt(c.inv.air) + '</div>' +
    '<div><small>משטר</small>' + GOV_HE[c.gov] + '</div><div><small>גרעין</small>' + num(c.nukes) + '</div><div><small>תמיכת העם</small>' + pct(c.approval) + '</div></div>' +
    '<p class="sub">' + (dc === 'bad' ? 'מדינה קטנה = משחק קשה יותר. תצטרך דיפלומטיה חכמה.' : dc === 'warn' ? 'מדינה בינונית — כוח מוגבל, אויבים אמיתיים.' : 'מעצמה גדולה — אבל גם לה יש אויבים.') + '</p>' +
    '<button class="b primary big" data-act="startpick">התחל לשחק כ' + esc(c.he) + '</button>';
  $('#pcard').classList.add('show');
  if (startPick.render) startPick.render($('#psearch').value);
}
function beginGame() {
  if (!pickId) return;
  setupPlayer(pickId);
  $('#start').classList.remove('open');
  $('#app').classList.add('playing');
  S.speed = 1;
  selected = null; save(); renderAll(); homeView(16);
  modal({ title: 'ברוך הבא, מנהיג ' + P().he, html: '<p>1 בינואר 2026. העולם מתוח. <b>הזמן רץ</b> — יום אחד בשנייה. אפשר לעצור (⏸) או להאיץ (×2, ×4, ×8) בכפתורים למעלה.</p><p>הצבא שלך מופיע על המפה כ<b>סמלים צהובים</b> — הקש על סמל כדי להזיז יחידה, לתקוף או להגן.</p><p>טיפ: התחל מלשונית <b>כלכלה</b>, שמור על העם מרוצה ועל המוניטין שלך בעולם, ובנה בריתות לפני שאתה יוצא למלחמה.</p>',
    buttons: [{ label: 'איך משחקים?', fn: showHelp }, { label: 'קדימה', cls: 'primary', fn: () => { if (!tutSeen()) setTimeout(tutStart, 400); } }] });
}
/* ---- first-game tutorial: 7 short steps, each pointing at the thing it explains; can be skipped any time ---- */
const TUT = [
  { sel: '#speed', t: 'השעון', d: 'הזמן רץ לבד. ⏸ עוצר, ×1 עד ×8 מאיצים. כשקורה משהו חשוב — המשחק עוצר ושואל אותך.' },
  { sel: null, t: 'המפה', d: 'גרור כדי לזוז, צבוט כדי להגדיל. צהוב = אתה, כחול = בעלות ברית, אדום = במלחמה איתך. הקש על מדינה או על עיר כדי לפתוח אותה.' },
  { sel: '[data-tab=country]', t: 'המדינה שלך', d: 'כאן הכרטיס של המדינה שלך, או של כל מדינה שהקשת עליה: סיוע, סחר, בריתות, סנקציות ומלחמה.' },
  { sel: '.units .icons .ui.me', t: 'הצבא על המפה', d: 'הסמלים הצהובים הם היחידות שלך, עם מספר החיילים. הקש על יחידה, בחר "הזז" או "תקוף מדינה", ואז הקש על היעד במפה.' },
  { sel: '[data-tab=wars]', t: 'מלחמה ושלום', d: 'כאן כל מלחמה: יחס הכוחות, ערים במצור ואבדות. מכאן גם מציעים שלום. מכריזים מלחמה מהכרטיס של מדינה.' },
  { sel: '[data-tab=gov]', t: 'השרים', d: 'מנה שרים שיעבדו בשבילך: ביטחון, אוצר, בינוי וחוץ. שר האוצר נותן לכל שר תקציב לחודש, ואף שר לא מוציא כסף שאין.' },
  { sel: '#top .r2', t: 'העם והעולם', d: '"אהבת העם" מתחת ל-15% לאורך זמן = מהפכה. "מוניטין" נמוך = סנקציות ואויבים. הכפתור "!" למעלה מראה מה דחוף עכשיו.' }
];
let TUTI = -1, tutSpeed = 1;
const tutSeen = () => { try { return localStorage.getItem('w26_tut') === '1'; } catch (e) { return true; } };
function tutStart() { if (!S || !S.player) return; tutSpeed = S.speed || S.lastSpeed || 1; setSpeed(0); openTab(null); TUTI = 0; tutShow(); }
function tutEnd() {
  TUTI = -1; const el = $('#tut'); if (el) el.className = '';
  try { localStorage.setItem('w26_tut', '1'); } catch (e) { /* storage unavailable */ }
  if (S && S.player && !S.speed) setSpeed(tutSpeed || 1);
}
function tutStep(d) { TUTI += d; if (TUTI >= TUT.length) tutEnd(); else tutShow(); }
function tutShow() {
  const el = $('#tut'); if (!el || TUTI < 0) return;
  const s = TUT[TUTI], tg = s.sel ? [...document.querySelectorAll(s.sel)].find(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && e.style.display !== 'none'; }) : null;
  const r = tg ? tg.getBoundingClientRect() : null, ring = $('#tut-ring'), bub = $('#tut-b');
  if (r) { const pd = 4; Object.assign(ring.style, { display: 'block', left: (r.left - pd) + 'px', top: (r.top - pd) + 'px', width: (r.width + pd * 2) + 'px', height: (r.height + pd * 2) + 'px' }); }
  else ring.style.display = 'none';
  bub.innerHTML = '<div class="tut-h"><b>' + s.t + '</b><span class="num">' + (TUTI + 1) + '/' + TUT.length + '</span></div><p>' + s.d + '</p><div class="btns"><button class="b primary" data-act="tutnext">' + (TUTI === TUT.length - 1 ? 'סיום — בוא נשחק' : 'הבא') + '</button>' + (TUTI < TUT.length - 1 ? '<button class="b" data-act="tutskip">דלג על ההדרכה</button>' : '') + '</div>';
  el.className = 'on';
  // the bubble goes below the target when it is in the top half, above it otherwise; centred when there is no target
  const bh = bub.offsetHeight, vh = innerHeight;
  let top = r ? (r.top + r.height / 2 < vh / 2 ? r.bottom + 12 : r.top - bh - 12) : (vh - bh) / 2;
  bub.style.top = clamp(top, 8, vh - bh - 8) + 'px';
}

/* ================= clock ================= */
function setSpeed(v) {
  if (!S || !S.player) return;
  S.speed = SPEEDS.includes(v) ? v : 0;
  if (S.speed) S.lastSpeed = S.speed;
  renderTop();
}
let sliderT0 = null;
let lastT = 0, acc = 0, lastUi = 0, lastSheet = 0, lastSave = 0, uiBusy = 0;
const LIVE_TABS = { urgent: 1, eco: 1, home: 1, gov: 1, mil: 1, wars: 1, country: 1, news: 1, world: 1, unit: 1, ulist: 1, stats: 1, city: 1 };
function frame(t) {
  requestAnimationFrame(frame);
  const dt = lastT ? Math.min(0.25, (t - lastT) / 1000) : 0; lastT = t;
  if (!S || !S.player) return;
  let ticked = 0;
  if (!S.over && S.speed > 0 && !modalOpen() && !S.pending.length) {
    acc += dt * S.speed;
    while (acc >= 1 && ticked < 12 && !S.over) {
      dayTick(); acc -= 1; ticked++;
      if (S.pending.length) { acc = 0; break; } // something important happened: stop and ask
    }
  }
  if (!modalOpen()) {
    if (S.over) showGameOver();
    else if (S.pending.length) { processPending(); renderTop(); }
  }
  if (ticked && t - lastUi > 120) { lastUi = t; renderTop(); }
  if (tab && LIVE_TABS[tab] && ticked && t - lastSheet > 1000 && t > uiBusy) { lastSheet = t; renderSheet(); }
  if (needMapRecolor && t - lastRecolor > 600) recolor();
  // the units layer is the only thing animated per frame (≈30 fps while units move)
  if (S.units && gIcons) {
    const moving = S.speed > 0 && !modalOpen() && S.units.some(u => u.dest || u.px !== u.lon || u.py !== u.lat);
    if (unitsDirty || (ticked && t - lastUnitsDraw > 100) || (moving && t - lastUnitsDraw > 33) || (hitUntil > t - 150 && t - lastUnitsDraw > 60)) drawUnits();
  }
  // the cities layer: only when something changed and the map is not moving
  if (citiesDirty && gCities && !zooming && t - lastCityDraw > 700) drawCities();
  fxFrame(t, dt);
  gTick(t);
  if (t - lastSave > 5000) { lastSave = t; save(); }
}

/* ================= boot ================= */
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { s.remove(); rej(new Error(src)); }; document.head.appendChild(s); });
}
function buildStartRel() {
  START_REL = new Map();
  (window.STARTING_RELATIONS || []).forEach(r => { if (Array.isArray(r) && r.length >= 3) START_REL.set(key(String(r[0]), String(r[1])), clamp(+r[2] || 0, -100, 100)); });
}
function boot() {
  try { initGeo(); } catch (e) { $('#loading').textContent = 'שגיאה בטעינת המפה'; return; }
  initRaster();
  try { initCities(); } catch (e) { CITY = []; CITYI = {}; }
  buildStartRel();
  const resumed = load();
  if (!resumed) newGame(null);
  initMap();
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = ACT[b.dataset.act]; if (f) f(b.dataset); });
  document.addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.slider; if (!k || !S.p) return;
    if (sliderT0 == null) sliderT0 = approvalTarget();
    S.p[k] = +e.target.value / 1000;
    const lbl = $('#sv-' + k); if (lbl) lbl.textContent = (S.p[k] * 100).toFixed(k === 'defPct' ? 1 : 0) + '%';
    const apt = $('#apt'); if (apt) apt.innerHTML = pct(approvalTarget());
    uiBusy = performance.now() + 1500;
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset && e.target.dataset.slider; if (!k) return;
    save();
    const T = approvalTarget(), d = T - (sliderT0 == null ? T : sliderT0); sliderT0 = null;
    toast({ tax: 'מס', welfare: 'רווחה', defPct: 'תקציב ביטחון' }[k] + ' ⁦' + (S.p[k] * 100).toFixed(k === 'defPct' ? 1 : 0) + '%⁩: העם ' + (Math.abs(d) < 0.5 ? 'בלי שינוי' : sgnT(d) + ' בהדרגה') + ' (צפי ⁦' + Math.round(T) + '%⁩)', d < -0.5);
    // the player's decision wins: the minister keeps his hands off this for three months
    const r = k === 'defPct' ? 'def' : 'fin', m = minOn(r);
    G().ovr[r] = S.day + 91;
    if (m) setTimeout(() => toast(mTitle(r, m) + (m.g === 'f' ? ' לא תשנה את ' : ' לא ישנה את ') + (r === 'fin' ? 'המס והרווחה' : 'תקציב הביטחון') + ' בשלושת החודשים הקרובים'), 900);
  });
  // don't redraw the panel under the player's finger
  const sheet = $('#sheet');
  ['pointerdown', 'touchstart', 'wheel', 'scroll'].forEach(ev => sheet.addEventListener(ev, () => { uiBusy = performance.now() + 1200; }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
  window.addEventListener('pagehide', save);
  $('#loading').remove();
  if (resumed) {
    $('#app').classList.add('playing');
    // coming back to a saved game: start paused so nothing happens before the player looks
    if (S.speed) S.lastSpeed = S.speed;
    S.speed = 0;
    renderAll(); homeView(10);
    if (S.over) showGameOver();
    else toast('ברוך השב! המשחק מושהה — לחץ ×1 כדי להמשיך');
    if (UNITS_MIGRATED) setTimeout(() => toast('חדש: הצבא שלך מופיע על המפה כיחידות — הקש על סמל כדי לתת פקודה'), 600);
    if (GOV_MIGRATED) setTimeout(() => toast('חדש: לשונית "ממשלה" — מנה שרים שיעבדו בשבילך'), 4000);
  } else {
    recolor(); initStart();
    if (OLD_SAVE_FOUND) setTimeout(() => toast('המשחק עודכן לזמן אמת — מתחילים משחק חדש'), 400);
  }
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    const box = $('#map'); if (Math.abs(box.clientWidth - W) < 40 && Math.abs(box.clientHeight - H) < 120) return;
    rebuildMap();
  }, 300); });
  requestAnimationFrame(frame);
  window.__W26 = { get S() { return S; }, dayTick, FX: { enemyStrike, nukeImpact, showCard, hideCard, setFxMode, get n() { return FXL.length; }, get mode() { return FXMODE; }, PS, WST, warSt }, runDays: n => { for (let i = 0; i < n && !S.over; i++) dayTick(); renderAll(); }, declareWar, annex, power, rel, ACT, setSpeed, strike,
    selectTid: t => { selected = t; recolor(); openTab('country'); }, zoomToTid, processPending, wipe, openTab,
    GOV: { minOf, candsFor, hireMin, fireMin, G, govAp, govSal, envOf, setEnvelopes, noMoney,
      autoAll: (pol) => { MIN_ORDER.forEach(r => { if (!minOf(r)) { const l = candsFor(r).slice().sort((a, b) => b.sk - a.sk); hireMin(r, l[0]); } const m = minOf(r); m.auto = true; if (pol && pol[r]) Object.assign(m.pol, pol[r]); }); } },
    C: { get CITY() { return CITY; }, CITYI, pickCede, cede, applyPeace, landOf, ptOwner, peaceDialog, drawCities, cityDay, captureCity, openCity, reconcileCities, aiCityFlip, citiesOfT, heldShare, nukeCityEst, cityStand, get selCity() { return selCity; } },
    EVS: { EV, EVI, eventsDay, evCtx, evChoose, evDialog, worldCoup, rebel, ranks, worldSnap },
    STATS: () => ({ ev: S.ev && S.ev.n, dec: S.ev && S.ev.dn, wc: S.wc || {}, log: S.p && S.p.gov ? S.p.gov.log.length : 0 }),
    U: { unitById, unitsOf, planMove, orderTo, commitMove, selectUnit, setMode, modeTap, syncAllUnits, buildItems, uStr, distToC, nearIn, tidAt, ownerAt, isSeaAt, snapSea, toScreen, drawUnits, zoomToMapPt, tp, mapProj: p => MAP_PROJ(p), get globe() { return !!GP; }, setGlobe, globeTo, get gC() { return gC; }, gEnd, sun: () => sunPt(), set sunLon(v) { gSunLon = v; }, get gK() { return [gKmin, gKfit]; },
      get curK() { return curK; }, get uMode() { return uMode; }, get selUnit() { return selUnit; } }, CB: { crushF, routLoss, breakDays, ratioTxt, forecastTxt, siegeForces, siegeRate } };
}
window.addEventListener('DOMContentLoaded', () => {
  // cities: the full file, else the small sample, else only a capital generated for each country
  const cities = () => loadScript('cities.js').catch(() => loadScript('cities.sample.js')).catch(() => { window.CITIES = []; });
  loadScript('countries-data.js').catch(() => loadScript('countries-data.sample.js')).catch(() => { window.COUNTRY_DATA = {}; }).then(cities).then(boot);
});
})();
