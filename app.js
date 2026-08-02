/* ============================================================================
   BODY RECOMP TRACKER
   Offline-first PWA. All data lives on this device (localStorage).
   No accounts, no servers. Built as a single vanilla-JS app.
   ============================================================================ */
'use strict';

/* ---------------------------------------------------------------------------
   0. Small utilities
   --------------------------------------------------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const round1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// dates (local, no timezone surprises)
function today() { const d = new Date(); return iso(d); }
function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
function startOfWeek(s) { // Monday
  const d = parse(s); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return iso(d);
}
function weekDates(monday) { return Array.from({ length: 7 }, (_, i) => addDays(monday, i)); }
function fmtDay(s) { return parse(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
function fmtShort(s) { return parse(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

/* ---------------------------------------------------------------------------
   1. Icons (inline SVG)
   --------------------------------------------------------------------------- */
const I = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M4 8.5v7M17.5 6.5v11M20 8.5v7M6.5 12h11"/></svg>',
  log: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2.4"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8M20 16v-3"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="18" cy="18" r="1.6"/><circle cx="12" cy="12" r="1.6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5 11-11"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s3 1 4-6z"/></svg>',
  walk: '<svg viewBox="0 0 24 24"><circle cx="13" cy="4" r="1.7"/><path d="M11 8l3 2 1 4M8 21l3-6-1-5-3 3M14 14l3 3"/></svg>',
  stairs: '<svg viewBox="0 0 24 24"><path d="M3 20h4v-4h4v-4h4V8h4V4"/></svg>',
  yoga: '<svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="1.7"/><path d="M12 7v6M6 20l6-4 6 4M7 12h10"/></svg>',
  pill: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/></svg>',
  ruler: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/></svg>',
  scale: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8l2.5 3.5h-5z"/><circle cx="12" cy="15" r="1"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.2"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.3 9.3l6.1-.7z"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h12"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  clip: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  trend: '<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 3L5 13h6l-1 8 8-11h-6z"/></svg>'
};

/* ---------------------------------------------------------------------------
   2. Seed content — workouts, exercises, substitutions, supplements
   --------------------------------------------------------------------------- */
// Exercise categories drive the weight-increase suggestion.
const INCR = {
  lowerCompound: 'add ~5–10 lb total',
  upper: 'add the smallest available increment',
  dumbbell: 'move up to the next dumbbell pair',
  machine: 'move up one plate / one increment'
};

const EX = {
  hipthrust:   { name: 'Hip Thrust', cat: 'lowerCompound', muscles: 'Glutes', cues: ['Ribs down, chin tucked', 'Drive through heels', 'Full lockout, squeeze glutes'], subs: ['glutebridge', 'Glute Bridge Machine', 'Smith Machine Hip Thrust'] },
  rdl:         { name: 'Romanian Deadlift', cat: 'lowerCompound', muscles: 'Hamstrings, glutes', cues: ['Soft knees', 'Push hips back', 'Bar/DBs close to legs', 'Feel the hamstring stretch'], subs: ['dbrdl', 'Single-Leg RDL', 'Back Extension'] },
  dbrdl:       { name: 'Dumbbell RDL', cat: 'dumbbell', muscles: 'Hamstrings, glutes', cues: ['Hips back', 'Flat back', 'Control the lowering'], subs: ['rdl', 'Single-Leg RDL'] },
  bss:         { name: 'Bulgarian Split Squat', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Long stride', 'Slight forward torso lean', 'Glute emphasis', 'Down and slightly forward'], subs: ['revlunge', 'stepup', 'Walking Lunge'] },
  backext:     { name: 'Glute-Focused Back Extension', cat: 'machine', muscles: 'Glutes, hamstrings, lower back', cues: ['Round upper back slightly', 'Squeeze glutes at top', 'Don\'t hyperextend'], subs: ['rdl', 'Reverse Hyper'] },
  hipabd:      { name: 'Hip Abduction Machine', cat: 'machine', muscles: 'Glute medius', cues: ['Slight forward lean for upper glute', 'Control back in', 'Higher reps'], subs: ['Banded Hip Abduction', 'Cable Abduction'] },
  latpull:     { name: 'Lat Pulldown', cat: 'machine', muscles: 'Lats, back', cues: ['Chest up', 'Pull to upper chest', 'Elbows down and back'], subs: ['pullup', 'Assisted Pull-Up'] },
  cablerow:    { name: 'Seated Cable Row', cat: 'machine', muscles: 'Mid back', cues: ['Tall chest', 'Drive elbows back', 'Slight squeeze, no leaning'], subs: ['csrow', 'Chest-Supported DB Row'] },
  dbpress:     { name: 'Dumbbell Shoulder Press', cat: 'dumbbell', muscles: 'Shoulders', cues: ['Ribs down', 'Press slightly in', 'Don\'t flare wrists'], subs: ['Machine Shoulder Press', 'Arnold Press'] },
  latraise:    { name: 'Lateral Raise', cat: 'dumbbell', muscles: 'Side delts', cues: ['Lead with elbows', 'Slight lean forward', 'Control down'], subs: ['Cable Lateral Raise', 'Machine Lateral Raise'] },
  triorbi:     { name: 'Triceps Pushdown / Biceps Curl', cat: 'upper', muscles: 'Triceps / biceps', cues: ['Elbows pinned', 'Full range', 'Squeeze at the end'], subs: ['Overhead Triceps', 'Hammer Curl'] },
  pullup:      { name: 'Assisted Pull-Up / Lat Pulldown', cat: 'machine', muscles: 'Lats, back', cues: ['Full hang', 'Chest to bar', 'Control the negative'], subs: ['latpull', 'Assisted Pull-Up Machine'] },
  csrow:       { name: 'Chest-Supported Row', cat: 'machine', muscles: 'Mid & upper back', cues: ['Chest on pad', 'Elbows back', 'Squeeze shoulder blades'], subs: ['cablerow', 'DB Chest-Supported Row'] },
  inclinedb:   { name: 'Incline Dumbbell Press', cat: 'dumbbell', muscles: 'Upper chest, shoulders', cues: ['30–45° bench', 'Elbows ~45°', 'Press up and slightly in'], subs: ['Incline Machine Press', 'Push-Up'] },
  reardelt:    { name: 'Rear Delt Fly', cat: 'dumbbell', muscles: 'Rear delts', cues: ['Hinge slightly', 'Elbows soft', 'Lead with pinkies', 'Light weight, high reps'], subs: ['Reverse Pec Deck', 'Cable Rear Delt'] },
  revlunge:    { name: 'Reverse Lunge', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Step straight back', 'Front heel down', 'Torso tall'], subs: ['stepup', 'bss', 'Walking Lunge'] },
  hamcurl:     { name: 'Hamstring Curl', cat: 'machine', muscles: 'Hamstrings', cues: ['Control both directions', 'Point toes for more hamstring', 'No hips rising'], subs: ['Nordic Curl', 'Stability Ball Curl'] },
  glutebridge: { name: 'Glute Bridge Machine', cat: 'machine', muscles: 'Glutes', cues: ['Full lockout', 'Squeeze at top'], subs: ['hipthrust'] },
  stepup:      { name: 'Step-Up', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Tall box', 'Drive through the top foot', 'Control down'], subs: ['revlunge', 'bss'] }
};

const WORKOUTS = [
  { id: 'lowerA', name: 'Lower Body A', tag: 'Glute Strength', color: 'accent',
    items: [
      { key: 'hipthrust', sets: 4, min: 8, max: 10 },
      { key: 'rdl',       sets: 3, min: 8, max: 10 },
      { key: 'bss',       sets: 3, min: 8, max: 10, perSide: true },
      { key: 'backext',   sets: 3, min: 10, max: 12 },
      { key: 'hipabd',    sets: 3, min: 15, max: 20 }
    ] },
  { id: 'upperA', name: 'Upper Body A', tag: 'Push / Pull', color: 'blue',
    items: [
      { key: 'latpull',  sets: 3, min: 8, max: 10 },
      { key: 'cablerow', sets: 3, min: 8, max: 10 },
      { key: 'dbpress',  sets: 3, min: 8, max: 10 },
      { key: 'latraise', sets: 3, min: 12, max: 15 },
      { key: 'triorbi',  sets: 3, min: 10, max: 12 }
    ], abOption: true },
  { id: 'lowerB', name: 'Lower Body B', tag: 'Glutes & Hamstrings', color: 'accent',
    items: [
      { key: 'hipthrust', sets: 3, min: 10, max: 12, note: 'Slightly less weight than Lower A' },
      { key: 'dbrdl',     sets: 3, min: 8, max: 10 },
      { key: 'revlunge',  sets: 3, min: 8, max: 10, perSide: true },
      { key: 'hamcurl',   sets: 3, min: 10, max: 12 },
      { key: 'hipabd',    sets: 3, min: 15, max: 20 }
    ] },
  { id: 'upperB', name: 'Upper Body B', tag: 'Back & Shoulders', color: 'blue',
    items: [
      { key: 'pullup',    sets: 3, min: 8, max: 10 },
      { key: 'csrow',     sets: 3, min: 8, max: 10 },
      { key: 'inclinedb', sets: 3, min: 8, max: 10 },
      { key: 'latraise',  sets: 3, min: 12, max: 15 },
      { key: 'reardelt',  sets: 3, min: 12, max: 15 }
    ], abOption: true }
];
const workoutById = (id) => WORKOUTS.find((w) => w.id === id);

const AB_CIRCUIT = [
  { name: 'Dead Bug', target: '10–12 / side' },
  { name: 'Reverse Crunch', target: '10–15' },
  { name: 'Plank', target: '30–60 sec' },
  { name: 'Pallof Press', target: '10–12 / side' }
];

const DEFAULT_SUPPS = [
  { name: 'Prenatal', time: 'Morning' },
  { name: 'Omega-3', time: 'Morning' },
  { name: 'Vitamin D', time: 'Morning' },
  { name: 'Choline', time: 'Morning' },
  { name: 'Magnesium', time: 'Evening' },
  { name: 'Iron', time: 'Evening' },
  { name: 'Probiotic', time: 'Morning' }
];

const ACTIVITY_TYPES = [
  { id: 'pilates', name: 'Pilates', counts: true },
  { id: 'yoga', name: 'Yoga', counts: true },
  { id: 'heated_pilates', name: 'Heated Pilates', counts: true },
  { id: 'heated_yoga', name: 'Heated Yoga', counts: true },
  { id: 'mobility', name: 'Mobility / Stretch', counts: true },
  { id: 'other', name: 'Other', counts: false }
];
const CARDIO_TYPES = [
  { id: 'stairmaster', name: 'StairMaster' },
  { id: 'treadmill', name: 'Treadmill' },
  { id: 'walk', name: 'Outdoor Walk' },
  { id: 'other', name: 'Other' }
];

/* ---------------------------------------------------------------------------
   3. State + persistence
   --------------------------------------------------------------------------- */
const KEY = 'brt.state.v1';
const PKEY = 'brt.photos.v1';

function defaultState() {
  return {
    profile: {
      name: '', heightIn: null, startWeight: null, goalWeight: null,
      stepTarget: 10000, strengthTarget: 4, pilatesTarget: 2, cardioTarget: 3, proteinTarget: 120,
      weightUnit: 'lb', measureUnit: 'in', startDate: today(), setup: false
    },
    sessions: [],       // completed strength workouts
    activities: [],     // pilates / yoga / mobility
    cardio: [],         // stairmaster / treadmill / walk
    daily: {},          // { date: {weight, steps, energy, sleep, soreness, cycle, note, ab, abRounds} }
    supplements: DEFAULT_SUPPS.map((s, i) => ({ id: uid(), name: s.name, dose: '', time: s.time, active: true, order: i })),
    suppLog: {},        // { date: {suppId:true} }
    measurements: [],
    exState: {},        // { exKey: {weight} } last working weight cache
    ui: { tab: 'home', active: null }
  };
}

let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    const d = defaultState();
    // shallow-merge to tolerate older/newer shapes
    return { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) }, ui: { ...d.ui, ...(s.ui || {}) } };
  } catch (e) { return defaultState(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Storage full — export a backup or remove some photos'); }
}
// photos kept separate so main state stays small
function loadPhotos() { try { return JSON.parse(localStorage.getItem(PKEY) || '[]'); } catch { return []; } }
function savePhotos(arr) {
  try { localStorage.setItem(PKEY, JSON.stringify(arr)); return true; }
  catch (e) { toast('Not enough space to save photo'); return false; }
}

/* continues in part 2 ... */

/* ---------------------------------------------------------------------------
   4. Units & formatting
   --------------------------------------------------------------------------- */
const wUnit = () => S.profile.weightUnit;
const mUnit = () => S.profile.measureUnit;
function wt(n) { return (n == null || n === '') ? '—' : `${round1(+n)} ${wUnit()}`; }
function num(n, suffix = '') { return (n == null || n === '') ? '—' : `${n}${suffix}`; }

/* ---------------------------------------------------------------------------
   5. Weekly aggregates
   --------------------------------------------------------------------------- */
function currentMonday() { return startOfWeek(today()); }

function weekBundle(monday = currentMonday()) {
  const dates = weekDates(monday);
  const inWeek = (d) => d >= monday && d <= dates[6];
  const sessions = S.sessions.filter((s) => inWeek(s.date));
  const acts = S.activities.filter((a) => inWeek(a.date));
  const cardio = S.cardio.filter((c) => inWeek(c.date));
  const pilatesYoga = acts.filter((a) => (ACTIVITY_TYPES.find((t) => t.id === a.type) || {}).counts);
  const weights = dates.map((d) => S.daily[d] && S.daily[d].weight).filter((x) => x != null && x !== '');
  const stepsArr = dates.map((d) => (S.daily[d] && +S.daily[d].steps) || 0);
  const stepDays = dates.filter((d) => S.daily[d] && +S.daily[d].steps >= S.profile.stepTarget).length;
  const stepAvg = stepsArr.some((x) => x) ? Math.round(stepsArr.filter((x) => x).reduce((a, b) => a + b, 0) / stepsArr.filter((x) => x).length) : 0;
  const stair = cardio.filter((c) => c.type === 'stairmaster').length;
  const tread = cardio.filter((c) => c.type === 'treadmill').length;
  const avgWeight = weights.length ? round1(weights.reduce((a, b) => a + +b, 0) / weights.length) : null;
  const supp = suppAdherence(dates);
  const measured = S.measurements.some((m) => inWeek(m.date));
  return { monday, dates, sessions, acts, cardio, pilatesYoga, weights, stepDays, stepAvg,
    stair, tread, avgWeight, supp, measured, hasWeighIn: weights.length > 0 };
}

// which of the 4 workouts are done this week, and the next recommended one
function weekRotation(monday = currentMonday()) {
  const done = new Set(S.sessions.filter((s) => startOfWeek(s.date) === monday).map((s) => s.type));
  const next = WORKOUTS.find((w) => !done.has(w.id)) || null;
  return { done, next, count: done.size };
}

function suppAdherence(dates) {
  const active = S.supplements.filter((s) => s.active);
  if (!active.length) return { pct: 100, taken: 0, possible: 0 };
  let taken = 0, possible = 0;
  dates.forEach((d) => {
    if (d > today()) return; // don't penalise future days
    const log = S.suppLog[d] || {};
    active.forEach((s) => { possible++; if (log[s.id]) taken++; });
  });
  return { pct: possible ? Math.round((taken / possible) * 100) : 100, taken, possible };
}

/* ---------------------------------------------------------------------------
   6. Weight trend (7-day rolling averages)
   --------------------------------------------------------------------------- */
function weighIns() {
  return Object.keys(S.daily)
    .filter((d) => S.daily[d].weight != null && S.daily[d].weight !== '')
    .map((d) => ({ date: d, w: +S.daily[d].weight }))
    .sort((a, b) => a.date < b.date ? -1 : 1);
}
function rollingAvg(endDate, days = 7) {
  const start = addDays(endDate, -(days - 1));
  const pts = weighIns().filter((p) => p.date >= start && p.date <= endDate);
  if (!pts.length) return null;
  return round1(pts.reduce((a, p) => a + p.w, 0) / pts.length);
}
function trendSummary() {
  const t = today();
  const cur = rollingAvg(t, 7);
  const prev = rollingAvg(addDays(t, -7), 7);
  const first = S.profile.startWeight;
  return { cur, prev, delta: (cur != null && prev != null) ? round1(cur - prev) : null,
    fromStart: (cur != null && first != null) ? round1(cur - +first) : null };
}

/* ---------------------------------------------------------------------------
   7. Progression engine (double progression)
   --------------------------------------------------------------------------- */
// last completed performance for an exercise key
function lastPerf(key) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const ex = (S.sessions[i].exercises || []).find((e) => e.key === key && e.sets && e.sets.some((st) => st.reps));
    if (ex) return { date: S.sessions[i].date, ex };
  }
  return null;
}
function allPerf(key) {
  const out = [];
  S.sessions.forEach((s) => (s.exercises || []).forEach((e) => {
    if (e.key === key && e.sets && e.sets.some((st) => st.reps)) out.push({ date: s.date, ex: e });
  }));
  return out;
}
function bestSet(key) {
  let best = null;
  allPerf(key).forEach(({ ex }) => ex.sets.forEach((st) => {
    if (st.weight == null || !st.reps) return;
    if (!best || +st.weight > +best.weight || (+st.weight === +best.weight && +st.reps > +best.reps))
      best = { weight: +st.weight, reps: +st.reps };
  }));
  return best;
}

// returns {verb, text, klass}  verb in increase|hold|reduce|start
function progression(item) {
  const info = EX[item.key];
  const last = lastPerf(item.key);
  if (!last) {
    return { verb: 'start', klass: 'muted', text: `Start moderate — aim for ${item.min}–${item.max} reps, leaving ~2 in the tank.` };
  }
  const sets = last.ex.sets.filter((s) => s.reps);
  const workingWeight = sets.length ? Math.max(...sets.map((s) => +s.weight || 0)) : 0;
  const pain = last.ex.pain && last.ex.pain !== 'none';
  const rir = last.ex.rir == null ? 2 : +last.ex.rir;
  const allTop = sets.length >= 1 && sets.every((s) => +s.reps >= item.max);
  const anyBelowMin = sets.some((s) => +s.reps < item.min);
  const wtxt = workingWeight ? `${workingWeight} ${wUnit()}` : 'this weight';

  if (pain) return { verb: 'hold', klass: 'danger', text: `Pain logged last time — hold ${wtxt} or substitute. Don't push through.` };
  if (anyBelowMin) return { verb: 'reduce', klass: 'danger', text: `Some sets fell below ${item.min}. Reduce a little or repeat ${wtxt} after more recovery.` };
  if (allTop && rir >= 1) {
    return { verb: 'increase', klass: 'sage', text: `You hit the top of the range — next time ${INCR[info.cat]} from ${wtxt}.` };
  }
  return { verb: 'hold', klass: 'accent', text: `Keep ${wtxt} and add reps toward ${item.max}.` };
}

/* ---------------------------------------------------------------------------
   8. Body Recomp Score (weekly, /100)
   --------------------------------------------------------------------------- */
function recompScore(monday = currentMonday()) {
  const b = weekBundle(monday);
  const parts = [];
  // strength 40 (10 each, cap target)
  const sT = S.profile.strengthTarget || 4;
  parts.push({ key: 'Strength', icon: '💪', got: Math.round(clamp(b.sessions.length / sT, 0, 1) * 40), max: 40,
    detail: `${b.sessions.length}/${sT} workouts` });
  // pilates/yoga 20
  const pT = S.profile.pilatesTarget || 2;
  parts.push({ key: 'Pilates/Yoga', icon: '🧘', got: Math.round(clamp(b.pilatesYoga.length / pT, 0, 1) * 20), max: 20,
    detail: `${b.pilatesYoga.length}/${pT} sessions` });
  // steps 15
  const stepScore = b.stepAvg ? clamp(b.stepAvg / S.profile.stepTarget, 0, 1) : 0;
  parts.push({ key: 'Steps', icon: '🚶', got: Math.round(stepScore * 15), max: 15,
    detail: b.stepAvg ? `${b.stepAvg.toLocaleString()}/day avg` : 'no steps logged' });
  // supplements 10 (10 if >=90%, else scaled)
  const suppScore = b.supp.pct >= 90 ? 1 : b.supp.pct / 100;
  parts.push({ key: 'Supplements', icon: '❤️', got: Math.round(suppScore * 10), max: 10,
    detail: `${b.supp.pct}% taken` });
  // cardio 10 (best at 2-4 sessions)
  const cSess = b.cardio.length;
  let cScore = 0;
  if (cSess >= 2 && cSess <= 4) cScore = 1; else if (cSess === 1) cScore = 0.5; else if (cSess > 4) cScore = 1;
  parts.push({ key: 'Cardio', icon: '🏃', got: Math.round(cScore * 10), max: 10,
    detail: `${cSess} session${cSess === 1 ? '' : 's'}` });
  // logged weight/measurement 5
  const logged = b.hasWeighIn || b.measured;
  parts.push({ key: 'Tracking', icon: '📏', got: logged ? 5 : 0, max: 5,
    detail: logged ? 'weight/measures logged' : 'log a weigh-in' });

  const total = parts.reduce((a, p) => a + p.got, 0);
  return { total, parts, bundle: b };
}

/* ---------------------------------------------------------------------------
   9. Weekly review + status
   --------------------------------------------------------------------------- */
function weekStatus(b) {
  const s = b.sessions.length, py = b.pilatesYoga.length;
  if (s >= (S.profile.strengthTarget || 4) && py >= 1) return { label: 'Excellent Week', pill: 'sage' };
  if (s >= 3) return { label: 'Solid Week', pill: 'accent' };
  return { label: 'Recovery Week', pill: 'muted' };
}

/* ---------------------------------------------------------------------------
   10. Render core: toast, ring, shell, tabs
   --------------------------------------------------------------------------- */
const SCREENS = {};   // populated below
const ACTIONS = {};   // populated below
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function ring(pct, prog, track, size = 112, stroke = 11) {
  const r = size / 2 - stroke, c = 2 * Math.PI * r, off = c * (1 - clamp(pct, 0, 1));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${prog}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 ${size/2} ${size/2})"/></svg>`;
}
function bar(pct, klass = '') { return `<div class="bar ${klass}"><i style="width:${clamp(pct,0,1)*100}%"></i></div>`; }

const TABS = [
  { id: 'home', label: 'Home', icon: I.home },
  { id: 'workout', label: 'Workout', icon: I.dumbbell },
  { id: 'log', label: 'Log', icon: I.log },
  { id: 'progress', label: 'Progress', icon: I.chart },
  { id: 'more', label: 'More', icon: I.more }
];

function render() {
  const tab = S.ui.tab;
  const screen = SCREENS[tab] || SCREENS.home;
  const app = $('#app');
  app.innerHTML =
    `<header class="appbar">
      <div><h1>${esc(screen.title())}</h1>${screen.sub ? `<div class="sub">${esc(screen.sub())}</div>` : ''}</div>
      <div class="date">${screen.right ? screen.right() : fmtDay(today())}</div>
    </header>
    <main class="screen">${screen.body()}</main>`;
  // tabs
  $('#tabbar').innerHTML = TABS.map((t) =>
    `<button class="tab ${t.id === tab ? 'active' : ''}" data-act="tab:${t.id}">${t.icon}<span>${t.label}</span></button>`).join('');
  app.scrollTop = 0; window.scrollTo(0, 0);
  if (screen.wire) screen.wire();
}
function go(tab) { S.ui.tab = tab; save(); render(); }

/* global click delegation */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const [act, ...args] = el.getAttribute('data-act').split(':');
  if (ACTIONS[act]) { e.preventDefault(); ACTIONS[act](args, el); }
});

/* ---------------------------------------------------------------------------
   11. Install hint (iOS Safari can't auto-prompt)
   --------------------------------------------------------------------------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function installHint() {
  if (isStandalone() || localStorage.getItem('brt.installDismiss')) return '';
  if (isIOS()) {
    return `<div class="install"><div>${I.plus}</div>
      <div class="small"><b>Add to your Home Screen</b><br>Tap the Share icon, then <b>Add to Home Screen</b> — it opens full-screen and works offline.</div>
      <button class="x" data-act="dismiss-install">×</button></div>`;
  }
  if (deferredPrompt) {
    return `<div class="install"><div>${I.plus}</div>
      <div class="small"><b>Install this app</b><br>Add it to your device for offline use.</div>
      <button class="btn sm primary" data-act="do-install" style="margin-left:auto">Install</button>
      <button class="x" data-act="dismiss-install">×</button></div>`;
  }
  return '';
}

/* ---------------------------------------------------------------------------
   12. HOME
   --------------------------------------------------------------------------- */
function scoreCard() {
  const sc = recompScore();
  const status = weekStatus(sc.bundle);
  return `<div class="orb-wrap">
    <div class="orb-status"><span class="pill ${status.pill}">${status.label}</span></div>
    <div class="orb"><div class="score"><b>${sc.total}<em>/100</em></b><span>Body Recomp Score</span></div></div>
  </div>
  <div class="card">
    <div class="breakdown">
      ${sc.parts.map((p) => `<div class="bd-item"><span class="em">${p.icon}</span>
        <div class="bd-main"><div class="t">${esc(p.key)} · ${p.got}/${p.max}</div><div class="bd-bar"><i style="width:${(p.got/p.max)*100}%"></i></div></div></div>`).join('')}
    </div>
    <div class="hint center" style="margin-top:15px">Focused on the habits you control — not whether the scale moved overnight.</div>
  </div>`;
}

function nextWorkoutCard() {
  const rot = weekRotation();
  if (!rot.next) {
    return `<div class="card"><div class="card-title"><h2>Strength this week</h2><span class="pill sage">All 4 done 🎉</span></div>
      <div class="hint">You've completed the full rotation. Extra sessions are welcome, or rest — it resets Monday.</div>
      <div class="spacer"></div><button class="btn" data-act="tab:workout">Log an extra workout</button></div>`;
  }
  const w = rot.next;
  return `<div class="card">
    <div class="card-title"><h2>Next workout</h2><span class="pill accent">${rot.count}/${S.profile.strengthTarget} this week</span></div>
    <div class="metric"><div class="ic-lg" style="width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent-ink)">${I.dumbbell}</div>
      <div class="lbl" style="margin-left:12px"><div class="t" style="font-size:17px">${esc(w.name)}</div><div class="s">${esc(w.tag)} · ${w.items.length} exercises</div></div></div>
    <div class="spacer"></div>
    <button class="btn primary block" data-act="start-workout:${w.id}">${I.plus} Start ${esc(w.name)}</button>
  </div>`;
}

function todayCard() {
  const d = S.daily[today()] || {};
  const b = weekBundle();
  const supp = suppAdherence([today()]);
  const rot = weekRotation();
  const doneToday = S.sessions.some((s) => s.date === today());
  const pyToday = S.activities.some((a) => a.date === today() && (ACTIVITY_TYPES.find((t)=>t.id===a.type)||{}).counts);
  return `<div class="card">
    <div class="card-title"><h2>Today</h2><span class="muted small">${fmtShort(today())}</span></div>
    <div class="tiles">
      <div class="tile g-blue"><div class="k">${I.scale} Weight</div><div class="v">${d.weight ? round1(d.weight) : '—'}<small> ${d.weight ? wUnit() : ''}</small></div></div>
      <div class="tile g-sage"><div class="k">${I.walk} Steps</div><div class="v">${d.steps ? (+d.steps).toLocaleString() : '—'}</div></div>
    </div>
    <div class="chips" style="margin-top:12px">
      <button class="chip ${doneToday?'sage on':''}" data-act="tab:workout">💪 Strength ${doneToday?'✓':''}</button>
      <button class="chip ${pyToday?'sage on':''}" data-act="open-activity">🧘 Pilates/Yoga ${pyToday?'✓':''}</button>
      <button class="chip" data-act="open-cardio">🏃 Cardio</button>
      <button class="chip ${d.ab?'sage on':''}" data-act="toggle-ab">🔥 Abs ${d.ab?'✓':''}</button>
    </div>
    <div class="hairline"></div>
    <div class="btn-row">
      <button class="btn sm" data-act="open-weight">${I.scale} Weight</button>
      <button class="btn sm" data-act="open-steps">${I.walk} Steps</button>
      <button class="btn sm" data-act="open-supps">❤️ Supps ${supp.possible?`${supp.taken}/${supp.possible}`:''}</button>
    </div>
    <div class="spacer"></div>
    <button class="btn ghost sm block" data-act="open-checkin">${I.clip} Full daily check-in</button>
  </div>`;
}

function weekCard() {
  const b = weekBundle();
  const sT = S.profile.strengthTarget, pT = S.profile.pilatesTarget;
  const dots = weekDates(b.monday).map((d) => {
    const hit = S.daily[d] && +S.daily[d].steps >= S.profile.stepTarget;
    return `<i class="${hit ? 'on' : ''}"></i>`;
  }).join('');
  return `<div class="card">
    <div class="card-title"><h2>This week</h2><span class="muted small">${fmtShort(b.monday)}–${fmtShort(b.dates[6])}</span></div>
    <div class="metric"><div class="lbl"><div class="t">Strength workouts</div>${bar(b.sessions.length/sT)}</div><div class="val">${b.sessions.length}/${sT}</div></div>
    <div class="hairline"></div>
    <div class="metric"><div class="lbl"><div class="t">Pilates / Yoga</div>${bar(b.pilatesYoga.length/pT,'blue')}</div><div class="val">${b.pilatesYoga.length}/${pT}</div></div>
    <div class="hairline"></div>
    <div class="metric"><div class="lbl"><div class="t">Step-goal days</div><div class="dots">${dots}</div></div><div class="val">${b.stepDays}/7</div></div>
    <div class="hairline"></div>
    <div class="tiles">
      <div class="tile g-cyan"><div class="k">${I.stairs} StairMaster</div><div class="v">${b.stair}<small> sess</small></div></div>
      <div class="tile g-blue"><div class="k">${I.walk} Treadmill</div><div class="v">${b.tread}<small> sess</small></div></div>
      <div class="tile g-pink"><div class="k">❤️ Supplements</div><div class="v">${b.supp.pct}<small>%</small></div></div>
      <div class="tile g-gold"><div class="k">${I.scale} Avg weight</div><div class="v">${b.avgWeight ? round1(b.avgWeight) : '—'}<small> ${b.avgWeight?wUnit():''}</small></div></div>
    </div>
  </div>`;
}

function weightTrendMini() {
  const w = weighIns();
  const t = trendSummary();
  if (w.length < 2) return '';
  return `<div class="card"><div class="card-title"><h2>Weight trend</h2>
    ${t.delta != null ? `<span class="pill ${t.delta<=0?'sage':'muted'}">${t.delta<=0?'▼':'▲'} ${Math.abs(t.delta)} ${wUnit()}/wk</span>` : ''}</div>
    ${sparkline(w.map((p)=>p.w))}
    <div class="metric" style="margin-top:10px"><div class="lbl"><div class="s">7-day average</div></div><div class="val">${t.cur!=null?wt(t.cur):'—'}</div></div>
  </div>`;
}

SCREENS.home = {
  title: () => `Hi${S.profile.name ? ', ' + S.profile.name.split(' ')[0] : ''}`,
  sub: () => 'Consistency over perfection',
  right: () => fmtDay(today()),
  body: () => installHint() + scoreCard() + nextWorkoutCard() + todayCard() + weekCard() + weightTrendMini(),
  wire: () => {}
};

/* ---------------------------------------------------------------------------
   13. Charts (inline SVG, dependency-free)
   --------------------------------------------------------------------------- */
function sparkline(values, klass = '') {
  if (!values.length) return '';
  const w = 320, h = 90, pad = 8;
  const min = Math.min(...values), max = Math.max(...values), span = (max - min) || 1;
  const x = (i) => pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `M${x(0)},${h} L${values.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' L')} L${x(values.length-1)},${h} Z`;
  return `<svg class="spark ${klass}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <path d="${area}" fill="var(--accent-soft)" opacity=".6"/>
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(values.length-1)}" cy="${y(values[values.length-1])}" r="3.5" fill="var(--accent)"/>
  </svg>`;
}
// two-line chart: raw dots + rolling avg line
function weightChart(points) {
  if (points.length < 2) return sparkline(points.map((p) => p.w));
  const w = 340, h = 150, pad = 12;
  const vals = points.map((p) => p.w);
  const min = Math.min(...vals), max = Math.max(...vals), span = (max - min) || 1;
  const d0 = parse(points[0].date), dN = parse(points[points.length - 1].date);
  const spanD = (dN - d0) || 1;
  const x = (dt) => pad + ((parse(dt) - d0) / spanD) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const roll = points.map((p) => ({ x: x(p.date), y: y(rollingAvg(p.date, 7) ?? p.w) }));
  const rollLine = roll.map((r, i) => `${i ? 'L' : 'M'}${r.x.toFixed(1)},${r.y.toFixed(1)}`).join(' ');
  const dots = points.map((p) => `<circle cx="${x(p.date).toFixed(1)}" cy="${y(p.w).toFixed(1)}" r="2.6" fill="var(--faint)"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    ${dots}
    <path d="${rollLine}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>
  <div class="small muted center" style="margin-top:4px">Dots = daily weigh-ins · line = 7-day average</div>`;
}

/* ---------------------------------------------------------------------------
   14. WORKOUT screen
   --------------------------------------------------------------------------- */
function newActive(type) {
  const w = workoutById(type);
  return {
    id: uid(), date: today(), type, name: w.name,
    exercises: w.items.map((it) => {
      const last = lastPerf(it.key);
      const prevW = last ? Math.max(...last.ex.sets.filter((s)=>s.reps).map((s)=>+s.weight||0)) : (S.exState[it.key]?.weight || '');
      return { key: it.key, name: EX[it.key].name, subName: null, min: it.min, max: it.max,
        perSide: !!it.perSide, prescribed: it.sets,
        sets: Array.from({ length: it.sets }, () => ({ weight: prevW || '', reps: '' })),
        rir: 2, pain: 'none', note: '' };
    }),
    cardio: null, ab: false, note: ''
  };
}

function workoutPicker() {
  const rot = weekRotation();
  return `${installHint()}
  <div class="section-title">This week's rotation</div>
  ${WORKOUTS.map((w) => {
    const done = rot.done.has(w.id);
    const isNext = rot.next && rot.next.id === w.id;
    return `<button class="card tight" data-act="start-workout:${w.id}" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:${isNext?'1.5px solid var(--accent)':'1px solid var(--line)'}">
      <div class="ic" style="background:${done?'var(--sage-soft)':'var(--accent-soft)'};color:${done?'var(--sage)':'var(--accent-ink)'};width:42px;height:42px;border-radius:12px;display:grid;place-items:center">${done?I.check:I.dumbbell}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:800">${esc(w.name)} ${isNext?'<span class="pill accent" style="margin-left:4px">Next</span>':''}</div>
        <div class="small muted">${esc(w.tag)} · ${w.items.length} exercises</div></div>
      <div class="pill ${done?'sage':'muted'}">${done?'Done':'Start'}</div>
    </button>`;
  }).join('')}
  <div class="hint center" style="margin-top:10px">No fixed days — do them in any order that fits your week. Complete all four and it resets Monday.</div>`;
}

function activeCardHTML(ex, idx) {
  const item = { key: ex.key, min: ex.min, max: ex.max };
  const prog = progression(item);
  const last = lastPerf(ex.key);
  const lastTxt = last ? `Last: ${last.ex.sets.filter((s)=>s.reps).map((s)=>`${s.weight||'–'}×${s.reps}`).join(', ')}${last.ex.rir!=null?` · ${['failure','1 left','2 left','3 left','4+ left'][Math.min(+last.ex.rir,4)]}`:''}` : 'No history yet';
  const target = `${ex.prescribed} × ${ex.min}–${ex.max}${ex.perSide ? ' /side' : ''}`;
  const rirLabels = [['0','failure'],['1','1 left'],['2','ideal'],['3','3 left'],['4','4+']];
  return `<div class="card" data-ex="${idx}">
    <div class="card-title" style="align-items:flex-start">
      <div><h2 style="font-size:16px">${esc(ex.subName || ex.name)}</h2>
        <div class="small muted">${esc(EX[ex.key].muscles)} · target ${target}</div></div>
      <button class="btn sm ghost" data-act="ex-menu:${idx}" style="padding:6px 9px">⋯</button>
    </div>
    <div class="pill ${prog.klass}" style="margin-bottom:10px">${prog.verb==='increase'?'▲ ':''}${esc(prog.text)}</div>
    <div class="col-h"><span>Set</span><span>Weight (${wUnit()})</span><span>Reps</span><span>✓</span></div>
    ${ex.sets.map((st, si) => `<div class="setrow">
      <div class="n">${si + 1}</div>
      <input class="mini js-w" data-ex="${idx}" data-si="${si}" type="number" inputmode="decimal" placeholder="—" value="${st.weight}">
      <input class="mini js-r" data-ex="${idx}" data-si="${si}" type="number" inputmode="numeric" placeholder="—" value="${st.reps}">
      <button class="done ${st.done?'on':''}" data-act="set-done:${idx}:${si}">${I.check}</button>
    </div>`).join('')}
    <div class="btn-row" style="margin:6px 0 12px">
      <button class="btn sm ghost" data-act="add-set:${idx}">${I.plus} Set</button>
      <button class="btn sm ghost" data-act="del-set:${idx}">– Set</button>
    </div>
    <div class="small muted" style="margin-bottom:6px">Effort — how many reps left in the tank?</div>
    <div class="chips">${rirLabels.map(([v,l]) => `<button class="chip ${String(ex.rir)===v?'on':''}" data-act="set-rir:${idx}:${v}">${l}</button>`).join('')}</div>
    <div class="small muted" style="margin-top:8px">${esc(lastTxt)}</div>
  </div>`;
}

function activeWorkoutHTML() {
  const a = S.ui.active;
  const w = workoutById(a.type);
  const done = a.exercises.filter((e) => e.sets.some((s) => s.reps)).length;
  return `<div class="card tight" style="display:flex;align-items:center;gap:12px">
      <div class="ic" style="background:var(--accent-soft);color:var(--accent-ink);width:42px;height:42px;border-radius:12px;display:grid;place-items:center">${I.dumbbell}</div>
      <div style="flex:1"><div style="font-weight:800">${esc(a.name)}</div><div class="small muted">${done}/${a.exercises.length} exercises logged</div></div>
      <button class="btn sm ghost" data-act="cancel-workout">Cancel</button>
    </div>
    ${a.exercises.map((ex, i) => activeCardHTML(ex, i)).join('')}
    <div class="card">
      <div class="card-title"><h2 style="font-size:15px">Add-ons</h2></div>
      <div class="check ${a.ab?'on':''}" data-act="toggle-active-ab"><div class="box">${I.check}</div><div class="lbl">Ab circuit</div><div class="sub">optional</div></div>
      <div class="check ${a.cardio?'on':''}" data-act="active-cardio"><div class="box">${I.check}</div><div class="lbl">Cardio ${a.cardio?`— ${esc((CARDIO_TYPES.find(c=>c.id===a.cardio.type)||{}).name)} ${a.cardio.duration||''}${a.cardio.duration?'min':''}`:''}</div><div class="sub">tap to add</div></div>
      <div class="field" style="margin-top:12px"><label>Session notes</label><textarea class="js-session-note" placeholder="How did it feel?">${esc(a.note)}</textarea></div>
    </div>
    <button class="btn primary block" data-act="finish-workout" style="margin-bottom:8px">${I.check} Finish & save workout</button>`;
}

SCREENS.workout = {
  title: () => S.ui.active ? S.ui.active.name : 'Workout',
  sub: () => S.ui.active ? 'Log your sets' : 'Pick a session',
  body: () => S.ui.active ? activeWorkoutHTML() : workoutPicker(),
  wire: () => {
    if (!S.ui.active) return;
    $$('.js-w').forEach((el) => el.addEventListener('input', () => {
      S.ui.active.exercises[+el.dataset.ex].sets[+el.dataset.si].weight = el.value; save();
    }));
    $$('.js-r').forEach((el) => el.addEventListener('input', () => {
      S.ui.active.exercises[+el.dataset.ex].sets[+el.dataset.si].reps = el.value; save();
    }));
    const note = $('.js-session-note');
    if (note) note.addEventListener('input', () => { S.ui.active.note = note.value; save(); });
  }
};

/* ---------------------------------------------------------------------------
   15. Modal sheet system
   --------------------------------------------------------------------------- */
function openSheet(html, wire) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="sheet-bg" data-act="close-sheet-bg"><div class="sheet" role="dialog"><div class="grab"></div>${html}</div></div>`;
  if (wire) wire(root);
}
function closeSheet() { $('#modal-root').innerHTML = ''; }

/* ---------------------------------------------------------------------------
   16. LOG screen
   --------------------------------------------------------------------------- */
function suppByTime() {
  const order = { Morning: 0, Afternoon: 1, Evening: 2, Anytime: 3 };
  const groups = {};
  S.supplements.filter((s) => s.active).sort((a, b) => (order[a.time] - order[b.time]) || (a.order - b.order))
    .forEach((s) => { (groups[s.time || 'Anytime'] = groups[s.time || 'Anytime'] || []).push(s); });
  return groups;
}
function suppCard() {
  const groups = suppByTime();
  const log = S.suppLog[today()] || {};
  const active = S.supplements.filter((s) => s.active);
  const taken = active.filter((s) => log[s.id]).length;
  if (!active.length) {
    return `<div class="card"><div class="card-title"><h2>Supplements</h2></div>
      <div class="empty"><span class="em">❤️</span>No supplements yet.<div class="spacer"></div>
      <button class="btn sm" data-act="supp-manage">Add supplements</button></div></div>`;
  }
  return `<div class="card">
    <div class="card-title"><h2>Supplements</h2><span class="pill ${taken===active.length?'sage':'muted'}">${taken}/${active.length}</span></div>
    ${Object.keys(groups).map((tm) => `<div class="small muted" style="margin:6px 2px 2px;font-weight:800">${tm}</div>
      ${groups[tm].map((s) => `<div class="check ${log[s.id]?'on':''}" data-act="toggle-supp:${s.id}">
        <div class="box">${I.check}</div><div class="lbl">${esc(s.name)}${s.dose?` <span class="sub">${esc(s.dose)}</span>`:''}</div></div>`).join('')}`).join('')}
    <div class="btn-row" style="margin-top:12px">
      <button class="btn sm" data-act="supp-all">Mark all</button>
      <button class="btn sm ghost" data-act="supp-clear">Clear</button>
      <button class="btn sm ghost" data-act="supp-manage">${I.gear}</button>
    </div>
  </div>`;
}

function logChecklist() {
  const d = S.daily[today()] || {};
  const strengthToday = S.sessions.some((s) => s.date === today());
  const acts = S.activities.filter((a) => a.date === today());
  const pil = acts.some((a) => a.type === 'pilates' || a.type === 'heated_pilates');
  const yog = acts.some((a) => a.type === 'yoga' || a.type === 'heated_yoga');
  const cardio = S.cardio.filter((c) => c.date === today());
  const stair = cardio.some((c) => c.type === 'stairmaster');
  const tread = cardio.some((c) => c.type === 'treadmill');
  const stepHit = d.steps && +d.steps >= S.profile.stepTarget;
  const log = S.suppLog[today()] || {};
  const active = S.supplements.filter((s) => s.active);
  const suppDone = active.length && active.every((s) => log[s.id]);
  const item = (on, label, sub, act) =>
    `<div class="check ${on?'on':''}" data-act="${act}"><div class="box">${I.check}</div><div class="lbl">${label}</div><div class="sub">${sub}</div></div>`;
  return `<div class="card">
    <div class="card-title"><h2>Today's checklist</h2><span class="muted small">${fmtShort(today())}</span></div>
    ${item(strengthToday, 'Strength workout', strengthToday? S.sessions.filter(s=>s.date===today()).map(s=>s.name).join(', ') :'tap to start', 'tab:workout')}
    ${item(pil, 'Pilates', pil?'logged':'tap to add', 'open-activity:pilates')}
    ${item(yog, 'Yoga', yog?'logged':'tap to add', 'open-activity:yoga')}
    ${item(!!d.ab, 'Ab circuit', d.ab?`${d.abRounds||''} ${d.abRounds?'rounds':'done'}`:'optional', 'toggle-ab')}
    ${item(stair, 'StairMaster', stair?'logged':'tap to add', 'open-cardio:stairmaster')}
    ${item(tread, 'Treadmill', tread?'logged':'tap to add', 'open-cardio:treadmill')}
    ${item(!!stepHit, 'Hit step goal', d.steps?`${(+d.steps).toLocaleString()} / ${S.profile.stepTarget.toLocaleString()}`:'tap to log steps', 'open-steps')}
    ${item(!!suppDone, 'All supplements', active.length?`${active.filter(s=>log[s.id]).length}/${active.length} taken`:'none set', 'supp-jump')}
  </div>`;
}

function weekActivityList() {
  const b = weekBundle();
  const rows = [];
  b.acts.forEach((a) => rows.push({ date: a.date, ...a, kind: 'act' }));
  b.cardio.forEach((c) => rows.push({ date: c.date, ...c, kind: 'cardio' }));
  b.sessions.forEach((s) => rows.push({ date: s.date, name: s.name, kind: 'strength' }));
  rows.sort((a, b) => a.date < b.date ? 1 : -1);
  if (!rows.length) return `<div class="empty small">Nothing logged this week yet.</div>`;
  return rows.map((r) => {
    let ic = I.yoga, t = '', s = fmtShort(r.date);
    if (r.kind === 'strength') { ic = I.dumbbell; t = r.name; s = 'Strength · ' + s; }
    else if (r.kind === 'cardio') { ic = r.type === 'treadmill' ? I.walk : (r.type === 'stairmaster' ? I.stairs : I.walk); t = (CARDIO_TYPES.find((c)=>c.id===r.type)||{}).name; s = `${r.duration?r.duration+' min · ':''}${s}`; }
    else { ic = I.yoga; t = (ACTIVITY_TYPES.find((x)=>x.id===r.type)||{}).name; s = `${r.duration?r.duration+' min · ':''}${s}`; }
    return `<div class="row"><div class="ic">${ic}</div><div class="main"><div class="t">${esc(t)}</div><div class="s">${esc(s)}</div></div></div>`;
  }).join('');
}

SCREENS.log = {
  title: () => 'Log',
  sub: () => 'One-minute daily entry',
  body: () => `${logChecklist()}
    <button class="btn primary block" data-act="open-checkin" style="margin-bottom:14px">${I.clip} Full daily check-in</button>
    ${suppCard()}
    <div class="card">
      <div class="card-title"><h2>Add movement</h2></div>
      <div class="btn-row" style="margin-bottom:8px"><button class="btn sm" data-act="open-activity">${I.yoga} Pilates / Yoga</button><button class="btn sm" data-act="open-cardio">${I.stairs} Cardio</button></div>
      <button class="btn sm ghost block" data-act="open-abs">${I.flame} Ab circuit</button>
    </div>
    <div class="card"><div class="card-title"><h2>This week</h2></div>${weekActivityList()}</div>`,
  wire: () => {}
};

/* ---------------------------------------------------------------------------
   17. PROGRESS screen
   --------------------------------------------------------------------------- */
const MFIELDS = [
  { k: 'waist', label: 'Natural waist', hint: 'Narrowest part of the torso' },
  { k: 'lowerWaist', label: 'Lower waist / belly', hint: 'Lower stomach, same reference each time' },
  { k: 'highHip', label: 'High hip', hint: 'Around the upper hip bones' },
  { k: 'fullHip', label: 'Full hip / glutes', hint: 'Fullest point of the glutes' },
  { k: 'rThigh', label: 'Right thigh', hint: 'Fullest part, same distance from hip' },
  { k: 'lThigh', label: 'Left thigh', hint: 'Optional' },
  { k: 'chest', label: 'Chest', hint: 'Optional' }
];

function progWeight() {
  const w = weighIns();
  const t = trendSummary();
  if (!w.length) return `<div class="empty"><span class="em">${I.scale}</span>No weigh-ins yet.<div class="spacer"></div><button class="btn sm" data-act="open-weight">Log weight</button></div>`;
  const recent = w.slice(-10).reverse();
  return `<div class="card">
    <div class="card-title"><h2>Weight trend</h2><button class="btn sm" data-act="open-weight">${I.plus} Weigh in</button></div>
    ${weightChart(w)}
    <div class="tiles" style="margin-top:12px">
      <div class="tile"><div class="k">7-day average</div><div class="v">${t.cur!=null?round1(t.cur):'—'}<small> ${wUnit()}</small></div></div>
      <div class="tile"><div class="k">Prev 7-day</div><div class="v">${t.prev!=null?round1(t.prev):'—'}<small> ${wUnit()}</small></div></div>
      <div class="tile"><div class="k">Week change</div><div class="v" style="color:${t.delta<=0?'var(--sage)':'var(--text)'}">${t.delta!=null?(t.delta<=0?'▼ ':'▲ ')+Math.abs(t.delta):'—'}</div></div>
      <div class="tile"><div class="k">From start</div><div class="v">${t.fromStart!=null?(t.fromStart<=0?'▼ ':'▲ ')+Math.abs(t.fromStart):'—'}</div></div>
    </div>
    <div class="hint" style="margin-top:10px">Daily ups and downs are water, food and hormones — watch the weekly average, not any single morning.</div>
  </div>
  <div class="card"><div class="card-title"><h2>Recent weigh-ins</h2></div>
    ${recent.map((p)=>`<div class="row"><div class="main"><div class="t">${wt(p.w)}</div></div><div class="end small muted">${fmtDay(p.date)}</div></div>`).join('')}</div>`;
}

function progMeasure() {
  const ms = S.measurements.slice().sort((a, b) => a.date < b.date ? -1 : 1);
  if (!ms.length) return `<div class="empty"><span class="em">${I.ruler}</span>No measurements yet.<div class="spacer"></div><button class="btn sm" data-act="open-measure">Add measurements</button><div class="hint" style="margin-top:12px">Take these every 2–4 weeks, same time of day.</div></div>`;
  const last = ms[ms.length - 1], first = ms[0], prev = ms.length > 1 ? ms[ms.length - 2] : null;
  const whr = (last.waist && last.fullHip) ? round1(last.waist / last.fullHip * 100) / 100 : null;
  let totalLost = 0;
  MFIELDS.forEach((f) => { if (last[f.k] != null && first[f.k] != null) totalLost += (+first[f.k] - +last[f.k]); });
  const chg = (cur, base) => (cur != null && base != null && base !== '') ? round1(cur - base) : null;
  return `<div class="card">
    <div class="card-title"><h2>Latest measurements</h2><button class="btn sm" data-act="open-measure">${I.plus} New</button></div>
    <div class="tiles">
      <div class="tile"><div class="k">Taken</div><div class="v" style="font-size:17px">${fmtShort(last.date)}</div></div>
      <div class="tile"><div class="k">Waist-to-hip</div><div class="v">${whr!=null?whr:'—'}</div></div>
      <div class="tile big"><div class="k">Total change since start (${fmtShort(first.date)})</div><div class="v" style="color:${totalLost>=0?'var(--sage)':'var(--text)'}">${totalLost>=0?'−':'+'}${Math.abs(round1(totalLost))} <small>${mUnit()}</small></div></div>
    </div>
    <div class="hairline"></div>
    <div class="col-h" style="grid-template-columns:1.6fr 1fr 1fr 1fr"><span style="text-align:left">Area</span><span>Now</span><span>vs prev</span><span>vs start</span></div>
    ${MFIELDS.filter((f)=>last[f.k]!=null&&last[f.k]!=='').map((f)=>{
      const vp = prev?chg(+last[f.k], +prev[f.k]):null, vs = chg(+last[f.k], +first[f.k]);
      const col = (v)=> v==null?'muted':(v<0?'style="color:var(--sage)"':(v>0?'':'muted'));
      return `<div class="setrow" style="grid-template-columns:1.6fr 1fr 1fr 1fr;margin-bottom:6px">
        <div style="font-weight:700;font-size:13.5px">${esc(f.label)}</div>
        <div class="center" style="font-weight:800">${last[f.k]}</div>
        <div class="center small" ${col(vp)}>${vp!=null?(vp<=0?'':'+')+vp:'—'}</div>
        <div class="center small" ${col(vs)}>${vs!=null?(vs<=0?'':'+')+vs:'—'}</div></div>`;
    }).join('')}
    <div class="hint" style="margin-top:8px">Your waist can shrink while your glutes stay the same or get firmer — that's recomposition working.</div>
  </div>`;
}

function topSetSeries(key) {
  return allPerf(key).map(({ date, ex }) => ({ date, w: Math.max(...ex.sets.filter((s)=>s.reps).map((s)=>+s.weight||0)) }))
    .filter((p) => p.w > 0);
}
function progStrength() {
  const keys = [...new Set(WORKOUTS.flatMap((w) => w.items.map((i) => i.key)))];
  const withHist = keys.filter((k) => lastPerf(k));
  if (!withHist.length) return `<div class="empty"><span class="em">${I.dumbbell}</span>No strength history yet.<div class="hint" style="margin-top:8px">Finish a workout and your lifts will show up here.</div></div>`;
  return `<div class="card"><div class="card-title"><h2>Strength history</h2></div>
    ${withHist.map((k) => {
      const last = lastPerf(k), best = bestSet(k);
      const lastTxt = last.ex.sets.filter((s)=>s.reps).map((s)=>`${s.weight||'–'}×${s.reps}`).join(', ');
      return `<div class="row" data-act="ex-history:${k}"><div class="ic">${I.dumbbell}</div>
        <div class="main"><div class="t">${esc(EX[k].name)}</div><div class="s">${esc(lastTxt)} · ${fmtShort(last.date)}</div></div>
        <div class="end"><div class="small muted">PR</div><div style="font-weight:800">${best?best.weight:'—'}</div></div></div>`;
    }).join('')}</div>`;
}

function progPhotos() {
  const photos = loadPhotos().sort((a, b) => a.date < b.date ? 1 : -1);
  return `<div class="card">
    <div class="card-title"><h2>Progress photos</h2><button class="btn sm" data-act="open-photo">${I.plus} Add</button></div>
    ${photos.length ? `<div class="photos">${photos.map((p)=>`<div data-act="view-photo:${p.id}"><img src="${p.dataUrl}" alt="${esc(p.view)} ${esc(p.date)}" loading="lazy"><div class="small muted center" style="margin-top:2px">${esc(p.view)} · ${fmtShort(p.date)}</div></div>`).join('')}</div>`
      : `<div class="empty small">No photos yet. Take front, side and back every ~4 weeks.</div>`}
    <div class="hint" style="margin-top:10px">Same lighting, clothing, distance, camera height and time of day. Photos stay on this device only.</div>
  </div>`;
}

const PROG_TABS = [['weight','Weight'],['measure','Measure'],['strength','Strength'],['photos','Photos']];
SCREENS.progress = {
  title: () => 'Progress',
  sub: () => 'Change over time',
  body: () => {
    const t = S.ui.progTab || 'weight';
    const seg = `<div class="seg" style="margin-bottom:14px">${PROG_TABS.map(([id,l])=>`<button class="${t===id?'on':''}" data-act="prog-tab:${id}">${l}</button>`).join('')}</div>`;
    const map = { weight: progWeight, measure: progMeasure, strength: progStrength, photos: progPhotos };
    return seg + (map[t] || progWeight)();
  },
  wire: () => {}
};

/* ---------------------------------------------------------------------------
   18. Weekly Review
   --------------------------------------------------------------------------- */
function weeklyReviewHTML(monday = currentMonday()) {
  const sc = recompScore(monday);
  const b = sc.bundle;
  const status = weekStatus(b);
  const t = trendSummary();
  const pain = b.sessions.some((s) => (s.exercises||[]).some((e) => e.pain && e.pain !== 'none'));
  const progressed = b.sessions.some((s) => (s.exercises||[]).some((e) => {
    const item = WORKOUTS.flatMap((w)=>w.items).find((i)=>i.key===e.key);
    return item && e.sets.filter((x)=>x.reps).every((x)=>+x.reps>=item.max);
  }));
  const q = (label, val) => `<div class="metric"><div class="lbl"><div class="t">${label}</div></div><div class="val">${val}</div></div><div class="hairline"></div>`;
  return `<h2>Weekly Review</h2><p class="sub">${fmtShort(b.monday)}–${fmtShort(b.dates[6])}</p>
    <div class="card score-card" style="margin-top:4px">
      <div class="ring-wrap"><div class="ring">${ring(sc.total/100,'#fff','rgba(255,255,255,.28)',96,10)}<div class="num"><b>${sc.total}</b><span>score</span></div></div>
      <div><div class="pill" style="background:rgba(255,255,255,.22);color:#fff">${status.label}</div>
      <div class="small" style="margin-top:8px;opacity:.92">${status.label==='Excellent Week'?'Four workouts and your classes in — beautiful consistency.':status.label==='Solid Week'?'Strong, steady week. No major regressions.':'Lighter week — rest counts too. Reset Monday.'}</div></div></div>
    </div>
    <div class="card">
      ${q('Strength workouts', `${b.sessions.length} / ${S.profile.strengthTarget}`)}
      ${q('Pilates / Yoga', `${b.pilatesYoga.length} / ${S.profile.pilatesTarget}`)}
      ${q('Step-goal days', `${b.stepDays} / 7`)}
      ${q('Avg daily steps', b.stepAvg?b.stepAvg.toLocaleString():'—')}
      ${q('StairMaster', `${b.stair}`)}
      ${q('Treadmill', `${b.tread}`)}
      ${q('Supplement adherence', `${b.supp.pct}%`)}
      ${q('Weekly avg weight', b.avgWeight?wt(b.avgWeight):'—')}
      ${q('Weight trend', t.delta!=null?`${t.delta<=0?'▼':'▲'} ${Math.abs(t.delta)} ${wUnit()}/wk`:'—')}
      ${q('Lifts progressed', progressed?'Yes 💪':'Held steady')}
      <div class="metric"><div class="lbl"><div class="t">Pain recorded</div></div><div class="val">${pain?'<span class="pill danger">Yes</span>':'None'}</div></div>
    </div>
    <div class="card"><div class="card-title"><h2 style="font-size:15px">Suggestions for next week</h2></div>
      <ul class="hint" style="margin:0;padding-left:18px;line-height:1.9">
        ${b.sessions.length < S.profile.strengthTarget ? `<li>${S.profile.strengthTarget-b.sessions.length} strength workout(s) left in the rotation.</li>`:'<li>Full strength rotation done — nice.</li>'}
        ${b.pilatesYoga.length < 1 ? '<li>Fit in at least one Pilates or yoga class.</li>' : (b.pilatesYoga.length < S.profile.pilatesTarget ? '<li>One more class hits your stretch goal of two.</li>':'')}
        ${b.stepAvg && b.stepAvg < S.profile.stepTarget ? `<li>Averaging ${b.stepAvg.toLocaleString()} steps — a couple of short walks closes the gap.</li>`:''}
        ${pain ? '<li>Pain came up — consider substituting that movement.</li>':''}
        ${progressed ? '<li>You topped a rep range — add a little weight next time.</li>':''}
      </ul></div>
    <button class="btn block" data-act="close-sheet">Close</button>`;
}

/* ---------------------------------------------------------------------------
   19. MORE screen
   --------------------------------------------------------------------------- */
function moreRow(icon, title, sub, act) {
  return `<div class="row" data-act="${act}"><div class="ic">${icon}</div><div class="main"><div class="t">${title}</div>${sub?`<div class="s">${sub}</div>`:''}</div><div class="end muted">›</div></div>`;
}
SCREENS.more = {
  title: () => 'More',
  sub: () => 'Review, library & settings',
  body: () => {
    const p = S.profile;
    return `<div class="card"><div class="card-title"><h2>Review & reference</h2></div>
        ${moreRow(I.star,'Weekly review','This week\'s summary & score','open-review')}
        ${moreRow(I.book,'Exercise library','Form cues, muscles, substitutions','open-library')}
      </div>
      <div class="card"><div class="card-title"><h2>Setup</h2></div>
        ${moreRow(I.heart,'Manage supplements',`${S.supplements.filter(s=>s.active).length} active`,'supp-manage')}
        ${moreRow(I.bolt,'Targets & goals',`${p.strengthTarget} lifts · ${p.pilatesTarget} classes · ${p.stepTarget.toLocaleString()} steps`,'open-targets')}
        ${moreRow(I.edit,'Profile',`${p.name||'Add your details'}`,'open-profile')}
      </div>
      <div class="card"><div class="card-title"><h2>Units</h2></div>
        <div class="field"><label>Body weight</label><div class="seg">
          <button class="${p.weightUnit==='lb'?'on':''}" data-act="set-unit:weightUnit:lb">lb</button>
          <button class="${p.weightUnit==='kg'?'on':''}" data-act="set-unit:weightUnit:kg">kg</button></div></div>
        <div class="field" style="margin:0"><label>Measurements</label><div class="seg">
          <button class="${p.measureUnit==='in'?'on':''}" data-act="set-unit:measureUnit:in">inches</button>
          <button class="${p.measureUnit==='cm'?'on':''}" data-act="set-unit:measureUnit:cm">cm</button></div></div>
      </div>
      <div class="card"><div class="card-title"><h2>Your data</h2></div>
        <div class="hint" style="margin-bottom:10px">Everything is stored only on this device. Export a backup regularly — reinstalling or clearing Safari data will erase it.</div>
        <div class="btn-row"><button class="btn sm" data-act="export-data">Export backup</button><button class="btn sm" data-act="import-data">Import</button></div>
        <div class="spacer"></div>
        <button class="btn sm ghost danger block" data-act="reset-data">Erase all data</button>
      </div>
      <div class="center small muted" style="margin:8px 0 20px">Body Recomp Tracker · v1 · works offline</div>`;
  },
  wire: () => {}
};

/* exercise library sheet content */
function libraryHTML() {
  const keys = [...new Set(WORKOUTS.flatMap((w) => w.items.map((i) => i.key)))];
  return `<h2>Exercise Library</h2><p class="sub">Form cues, target muscles & swaps</p>
    ${WORKOUTS.map((w) => `<div class="section-title" style="margin-left:0">${esc(w.name)}</div>
      ${w.items.map((it) => `<div class="row" data-act="ex-info:${it.key}"><div class="ic">${I.dumbbell}</div>
        <div class="main"><div class="t">${esc(EX[it.key].name)}</div><div class="s">${it.sets}×${it.min}–${it.max}${it.perSide?' /side':''} · ${esc(EX[it.key].muscles)}</div></div><div class="end muted">›</div></div>`).join('')}`).join('')}
    <div class="hint" style="margin:12px 0">Cable kickbacks are intentionally left out — they tend to aggravate the lower back.</div>
    <button class="btn block" data-act="close-sheet">Close</button>`;
}
function exInfoHTML(key) {
  const e = EX[key];
  const subs = e.subs.map((s) => EX[s] ? EX[s].name : s);
  return `<h2>${esc(e.name)}</h2><p class="sub">${esc(e.muscles)}</p>
    <div class="card tight"><div class="small muted" style="font-weight:800;margin-bottom:6px">Form cues</div>
      <ul class="hint" style="margin:0;padding-left:18px;line-height:1.9">${e.cues.map((c)=>`<li>${esc(c)}</li>`).join('')}</ul></div>
    <div class="card tight"><div class="small muted" style="font-weight:800;margin-bottom:6px">Swaps if needed</div>
      <div class="chips">${subs.map((s)=>`<span class="chip">${esc(s)}</span>`).join('')}</div></div>
    <div class="hint">If a movement causes pain, stop or substitute — pain isn't something to push through.</div>
    <div class="spacer"></div><button class="btn block" data-act="close-sheet">Close</button>`;
}

/* ---------------------------------------------------------------------------
   20. Sheets (input forms)
   --------------------------------------------------------------------------- */
function daily(d = today()) { return S.daily[d] || (S.daily[d] = {}); }
function field(label, inner, hint) { return `<div class="field"><label>${label}</label>${inner}${hint?`<div class="hint" style="margin-top:5px">${hint}</div>`:''}</div>`; }
function selHTML(id, opts, val) { return `<select id="${id}">${opts.map((o)=>{const [v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(l)}</option>`;}).join('')}</select>`; }

function weightSheet() {
  const d = daily();
  openSheet(`<h2>Log weight</h2><p class="sub">Weigh under similar conditions — ideally first thing.</p>
    ${field(`Weight (${wUnit()})`, `<input class="input" id="sh-weight" type="number" inputmode="decimal" value="${d.weight||''}" placeholder="e.g. 138.4">`)}
    <button class="btn primary block" data-act="save-weight">Save</button>`,
    () => setTimeout(() => { const i = $('#sh-weight'); if (i) i.focus(); }, 60));
}
function stepsSheet() {
  const d = daily();
  openSheet(`<h2>Log steps</h2><p class="sub">Enter today's step count from your phone or watch.</p>
    ${field('Steps', `<input class="input" id="sh-steps" type="number" inputmode="numeric" value="${d.steps||''}" placeholder="e.g. 10250">`, `Target ${S.profile.stepTarget.toLocaleString()}/day. It's the weekly average that matters.`)}
    <button class="btn primary block" data-act="save-steps">Save</button>`,
    () => setTimeout(() => { const i = $('#sh-steps'); if (i) i.focus(); }, 60));
}
function checkinSheet() {
  const d = daily();
  openSheet(`<h2>Daily check-in</h2><p class="sub">Takes about a minute — helps explain ups and downs.</p>
    <div class="grid2">
      ${field(`Weight (${wUnit()})`, `<input class="input" id="ci-weight" type="number" inputmode="decimal" value="${d.weight||''}">`)}
      ${field('Steps', `<input class="input" id="ci-steps" type="number" inputmode="numeric" value="${d.steps||''}">`)}
    </div>
    ${field('Energy', selHTML('ci-energy', ['','Very low','Low','Normal','High'], d.energy||''))}
    ${field('Sleep quality', selHTML('ci-sleep', ['','Poor','Fair','Good','Great'], d.sleep||''))}
    ${field('Soreness', selHTML('ci-sore', ['','None','Mild','Moderate','High'], d.soreness||''))}
    ${field('Cycle phase (optional)', selHTML('ci-cycle', ['','Menstrual','Follicular','Ovulation','Luteal'], d.cycle||''))}
    ${field('Notes', `<textarea id="ci-note" placeholder="Anything worth remembering">${esc(d.note||'')}</textarea>`)}
    <button class="btn primary block" data-act="save-checkin">Save check-in</button>`);
}
function activitySheet(preset) {
  openSheet(`<h2>Log Pilates / Yoga</h2><p class="sub">Any of these count toward your weekly class goal.</p>
    ${field('Type', selHTML('ac-type', ACTIVITY_TYPES.map((t)=>[t.id,t.name]), preset||'pilates'))}
    <div class="grid2">
      ${field('Duration (min)', `<input class="input" id="ac-dur" type="number" inputmode="numeric" placeholder="50">`)}
      ${field('Intensity', selHTML('ac-int', ['Easy','Moderate','Hard'], 'Moderate'))}
    </div>
    ${field('Date', `<input class="input" id="ac-date" type="date" value="${today()}">`)}
    ${field('Notes', `<textarea id="ac-note" placeholder="How was class?"></textarea>`)}
    <button class="btn primary block" data-act="save-activity">Save</button>`);
}
function cardioSheet(mode, preset) {
  const active = mode === 'active';
  openSheet(`<h2>${active?'Add cardio to workout':'Log cardio'}</h2><p class="sub">Keep it moderate — it should support lifting, not fight recovery.</p>
    ${field('Type', selHTML('cd-type', CARDIO_TYPES.map((t)=>[t.id,t.name]), preset||'stairmaster'))}
    <div class="grid2">
      ${field('Duration (min)', `<input class="input" id="cd-dur" type="number" inputmode="numeric" placeholder="15">`)}
      ${field('Effort', selHTML('cd-eff', ['','Easy','Moderate','Hard'], 'Moderate'))}
    </div>
    <div class="grid3">
      ${field('Level', `<input class="input" id="cd-level" type="number" inputmode="numeric" placeholder="6">`)}
      ${field('Speed', `<input class="input" id="cd-speed" type="number" inputmode="decimal" placeholder="3.2">`)}
      ${field('Incline %', `<input class="input" id="cd-incline" type="number" inputmode="decimal" placeholder="8">`)}
    </div>
    ${field('Distance / floors', `<input class="input" id="cd-dist" type="text" placeholder="optional">`)}
    ${active?'':field('Date', `<input class="input" id="cd-date" type="date" value="${today()}">`)}
    ${field('Notes', `<textarea id="cd-note" placeholder="optional"></textarea>`)}
    <button class="btn primary block" data-act="${active?'save-active-cardio':'save-cardio'}">Save</button>`);
}
function absSheet() {
  const d = daily();
  openSheet(`<h2>Ab circuit</h2><p class="sub">Optional — 2–3 rounds, a couple of times a week.</p>
    <div class="card tight">${AB_CIRCUIT.map((a)=>`<div class="row"><div class="main"><div class="t">${esc(a.name)}</div><div class="s">${esc(a.target)}</div></div></div>`).join('')}</div>
    ${field('Rounds completed', selHTML('ab-rounds', ['1','2','3','4'], d.abRounds||'2'))}
    <button class="btn primary block" data-act="save-abs">Mark complete</button>`);
}
function measureSheet() {
  const last = S.measurements.length ? S.measurements[S.measurements.length-1] : {};
  openSheet(`<h2>Measurements</h2><p class="sub">Every 2–4 weeks, same time of day. Prefilled with your last values.</p>
    ${field('Date', `<input class="input" id="ms-date" type="date" value="${today()}">`)}
    ${field(`Weight (${wUnit()})`, `<input class="input" id="ms-weight" type="number" inputmode="decimal" value="${last.weight||''}">`)}
    ${MFIELDS.map((f)=>field(`${f.label} (${mUnit()})`, `<input class="input ms-f" data-k="${f.k}" type="number" inputmode="decimal" value="${last[f.k]||''}">`, f.hint)).join('')}
    <button class="btn primary block" data-act="save-measure">Save measurements</button>`);
}
function photoSheet() {
  openSheet(`<h2>Add progress photo</h2><p class="sub">Stays on this device. Same lighting, clothing & distance each time.</p>
    ${field('View', selHTML('ph-view', ['Front','Side','Back','Three-quarter'], 'Front'))}
    ${field('Date', `<input class="input" id="ph-date" type="date" value="${today()}">`)}
    ${field('Photo', `<input class="input" id="ph-file" type="file" accept="image/*">`)}
    <div id="ph-preview" class="center"></div>
    <button class="btn primary block" data-act="save-photo" id="ph-save" disabled>Save photo</button>`,
    () => {
      const f = $('#ph-file');
      f.addEventListener('change', async () => {
        if (!f.files || !f.files[0]) return;
        const url = await compressImage(f.files[0]);
        window.__photoTmp = url;
        $('#ph-preview').innerHTML = `<img src="${url}" style="max-height:200px;border-radius:12px;margin:6px 0">`;
        $('#ph-save').removeAttribute('disabled');
      });
    });
}
function suppQuickSheet() {
  const groups = suppByTime(); const log = S.suppLog[today()] || {};
  const active = S.supplements.filter((s)=>s.active);
  openSheet(`<h2>Supplements</h2><p class="sub">${fmtDay(today())}</p>
    ${active.length?Object.keys(groups).map((tm)=>`<div class="small muted" style="margin:6px 2px 2px;font-weight:800">${tm}</div>
      ${groups[tm].map((s)=>`<div class="check ${log[s.id]?'on':''}" data-act="toggle-supp:${s.id}"><div class="box">${I.check}</div><div class="lbl">${esc(s.name)}${s.dose?` <span class="sub">${esc(s.dose)}</span>`:''}</div></div>`).join('')}`).join('')
      :'<div class="empty small">No supplements yet.</div>'}
    <div class="btn-row" style="margin-top:12px"><button class="btn sm" data-act="supp-all">Mark all</button><button class="btn sm ghost" data-act="supp-clear">Clear</button></div>
    <div class="spacer"></div><button class="btn block" data-act="close-sheet">Done</button>`);
}
function suppManageSheet() {
  openSheet(`<h2>Manage supplements</h2><p class="sub">Track whether you took them — no dosage advice.</p>
    ${S.supplements.sort((a,b)=>a.order-b.order).map((s)=>`<div class="row"><div class="ic">${I.pill}</div>
      <div class="main"><div class="t" style="${s.active?'':'opacity:.5'}">${esc(s.name)}</div><div class="s">${esc(s.time||'Anytime')}${s.dose?' · '+esc(s.dose):''}</div></div>
      <div class="end"><button class="btn sm ghost" data-act="supp-toggle:${s.id}">${s.active?'Pause':'Resume'}</button></div></div>`).join('')}
    <div class="hairline"></div>
    <div class="small muted" style="font-weight:800;margin-bottom:8px">Add supplement</div>
    <div class="grid2">${field('Name', `<input class="input" id="su-name" placeholder="e.g. Creatine">`)}${field('Time', selHTML('su-time', ['Morning','Afternoon','Evening','Anytime'], 'Morning'))}</div>
    ${field('Dose (optional)', `<input class="input" id="su-dose" placeholder="e.g. 5 g">`)}
    <button class="btn primary block" data-act="supp-add">Add supplement</button>
    <div class="spacer"></div><button class="btn ghost block" data-act="close-sheet">Done</button>`);
}
function targetsSheet() {
  const p = S.profile;
  openSheet(`<h2>Targets & goals</h2><p class="sub">The weekly targets that drive your score.</p>
    <div class="grid2">
      ${field('Strength / week', `<input class="input" id="tg-str" type="number" value="${p.strengthTarget}">`)}
      ${field('Pilates·Yoga / week', `<input class="input" id="tg-pil" type="number" value="${p.pilatesTarget}">`)}
      ${field('Cardio / week', `<input class="input" id="tg-car" type="number" value="${p.cardioTarget}">`)}
      ${field('Protein (g/day)', `<input class="input" id="tg-pro" type="number" value="${p.proteinTarget}">`)}
    </div>
    ${field('Daily step target', `<input class="input" id="tg-step" type="number" value="${p.stepTarget}">`)}
    <button class="btn primary block" data-act="save-targets">Save</button>`);
}
function profileSheet() {
  const p = S.profile;
  openSheet(`<h2>Profile</h2><p class="sub">Used for trends — nothing leaves your device.</p>
    ${field('Name', `<input class="input" id="pf-name" value="${esc(p.name)}" placeholder="First name">`)}
    <div class="grid2">
      ${field('Height (in)', `<input class="input" id="pf-h" type="number" value="${p.heightIn||''}">`)}
      ${field(`Start weight (${wUnit()})`, `<input class="input" id="pf-sw" type="number" value="${p.startWeight||''}">`)}
      ${field(`Goal weight (opt)`, `<input class="input" id="pf-gw" type="number" value="${p.goalWeight||''}">`)}
      ${field('Program start', `<input class="input" id="pf-sd" type="date" value="${p.startDate}">`)}
    </div>
    <button class="btn primary block" data-act="save-profile">Save</button>`);
}
function exMenuSheet(idx) {
  const ex = S.ui.active.exercises[idx];
  const e = EX[ex.key];
  const subs = e.subs.map((s) => EX[s] ? [s, EX[s].name] : [s, s]);
  openSheet(`<h2>${esc(ex.subName||ex.name)}</h2><p class="sub">Adjust this exercise</p>
    ${field('Substitute with', `<div class="chips">${subs.map(([v,l])=>`<button class="chip" data-act="do-sub:${idx}:${esc(v)}">${esc(l)}</button>`).join('')}${ex.subName?`<button class="chip on" data-act="undo-sub:${idx}">↺ ${esc(ex.name)}</button>`:''}</div>`)}
    ${field('Pain / discomfort', `<div class="chips">${[['none','None'],['mild','Mild'],['pain','Pain'],['stop','Stop']].map(([v,l])=>`<button class="chip ${ex.pain===v?'on':''}" data-act="set-pain:${idx}:${v}">${l}</button>`).join('')}</div>`, 'Pain is a signal to stop or swap — not to push through.')}
    ${field('Notes', `<textarea id="ex-note-${idx}" placeholder="e.g. felt strong, tweak seat height">${esc(ex.note||'')}</textarea>`)}
    <button class="btn primary block" data-act="save-ex-note:${idx}">Done</button>`);
}
function exHistorySheet(key) {
  const e = EX[key], all = allPerf(key).slice().reverse(), best = bestSet(key);
  const series = topSetSeries(key);
  const item = WORKOUTS.flatMap((w)=>w.items).find((i)=>i.key===key) || { min:8, max:10 };
  const prog = progression(item);
  return openSheet(`<h2>${esc(e.name)}</h2><p class="sub">${esc(e.muscles)}</p>
    ${series.length>1?`<div class="card tight">${sparkline(series.map((p)=>p.w))}<div class="small muted center">Top-set weight over time</div></div>`:''}
    <div class="tiles">
      <div class="tile"><div class="k">Personal record</div><div class="v">${best?best.weight:'—'}<small> ${wUnit()}×${best?best.reps:''}</small></div></div>
      <div class="tile"><div class="k">Next goal</div><div class="v" style="font-size:15px">${item.min}–${item.max} reps</div></div>
    </div>
    <div class="pill ${prog.klass}" style="margin:10px 0">${esc(prog.text)}</div>
    <div class="section-title" style="margin-left:0">History</div>
    ${all.length?all.map(({date,ex})=>`<div class="row"><div class="main"><div class="t">${ex.sets.filter((s)=>s.reps).map((s)=>`${s.weight||'–'}×${s.reps}`).join(', ')}</div><div class="s">${fmtDay(date)}${ex.pain&&ex.pain!=='none'?' · ⚠ '+ex.pain:''}${ex.note?' · '+esc(ex.note):''}</div></div></div>`).join(''):'<div class="empty small">No history yet.</div>'}
    <div class="spacer"></div><button class="btn block" data-act="close-sheet">Close</button>`);
}
function photoViewSheet(id) {
  const p = loadPhotos().find((x) => x.id === id); if (!p) return;
  openSheet(`<h2>${esc(p.view)}</h2><p class="sub">${fmtDay(p.date)}</p>
    <img src="${p.dataUrl}" style="width:100%;border-radius:14px">
    <div class="spacer"></div>
    <button class="btn danger block" data-act="del-photo:${id}">Delete photo</button>
    <div class="spacer"></div><button class="btn ghost block" data-act="close-sheet">Close</button>`);
}

/* image compression for progress photos */
function compressImage(file, max = 720, q = 0.62) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > h && w > max) { h = h * max / w; w = max; }
        else if (h > max) { w = w * max / h; h = max; }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------------------
   21. Finish workout + summary
   --------------------------------------------------------------------------- */
function finishWorkout() {
  const a = S.ui.active; if (!a) return;
  const exs = a.exercises.map((e) => ({
    key: e.key, name: e.name, subName: e.subName, rir: e.rir, pain: e.pain, note: e.note,
    sets: e.sets.filter((s) => s.reps !== '' || s.weight !== '')
      .map((s) => ({ weight: s.weight === '' ? null : +s.weight, reps: s.reps === '' ? null : +s.reps, done: !!s.done }))
  }));
  const logged = exs.some((e) => e.sets.some((s) => s.reps));
  if (!logged && !confirm('No sets logged yet — save this workout anyway?')) return;
  const session = { id: a.id, date: a.date, type: a.type, name: a.name, exercises: exs, ab: !!a.ab, cardio: a.cardio || null, note: a.note || '' };
  S.sessions.push(session);
  exs.forEach((e) => { const mw = Math.max(0, ...e.sets.map((s) => +s.weight || 0)); if (mw) S.exState[e.key] = { weight: mw }; });
  if (a.cardio) S.cardio.push({ id: uid(), date: a.date, ...a.cardio });
  if (a.ab) { daily(a.date).ab = true; }
  S.ui.active = null; save(); go('home'); openSheet(finishSummary(session));
}
function finishSummary(session) {
  const sc = recompScore(); const rot = weekRotation();
  return `<h2>Workout saved 🎉</h2><p class="sub">${esc(session.name)} · ${fmtDay(session.date)}</p>
    <div class="card score-card"><div class="ring-wrap"><div class="ring">${ring(sc.total/100,'#fff','rgba(255,255,255,.28)',88,9)}<div class="num"><b>${sc.total}</b><span>score</span></div></div>
    <div class="small" style="opacity:.94">${rot.next?`Next up in your rotation: <b>${esc(rot.next.name)}</b>`:'Full strength rotation complete this week! 🔥'}</div></div></div>
    <div class="section-title" style="margin-left:0">What to aim for next time</div>
    ${session.exercises.map((e) => { const item = WORKOUTS.flatMap((w)=>w.items).find((i)=>i.key===e.key) || {min:8,max:10,key:e.key}; const p = progression(item);
      return `<div class="row"><div class="ic">${I.dumbbell}</div><div class="main"><div class="t">${esc(e.subName||e.name)}</div><div class="s">${esc(p.text)}</div></div></div>`; }).join('')}
    <div class="spacer"></div><button class="btn primary block" data-act="close-sheet">Done</button>`;
}

/* ---------------------------------------------------------------------------
   22. Data export / import / reset
   --------------------------------------------------------------------------- */
function exportData() {
  const payload = JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), state: S, photos: loadPhotos() }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `body-recomp-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  toast('Backup downloaded');
}
function importData() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.state) throw new Error('bad file');
        if (!confirm('Replace all current data with this backup?')) return;
        const d = defaultState();
        S = { ...d, ...data.state, profile: { ...d.profile, ...(data.state.profile || {}) }, ui: { ...d.ui, ...(data.state.ui || {}) } };
        if (Array.isArray(data.photos)) savePhotos(data.photos);
        save(); render(); toast('Backup restored');
      } catch (e) { toast('Could not read that file'); }
    };
    r.readAsText(f);
  };
  inp.click();
}
function resetData() {
  if (!confirm('Erase ALL data on this device? This cannot be undone.')) return;
  if (!confirm('Really erase everything? Export a backup first if unsure.')) return;
  localStorage.removeItem(KEY); localStorage.removeItem(PKEY);
  S = defaultState(); save(); go('home'); toast('All data erased');
}

/* ---------------------------------------------------------------------------
   23. ACTIONS
   --------------------------------------------------------------------------- */
const gv = (id) => { const e = $('#' + id); return e ? String(e.value).trim() : ''; };
const gn = (id) => { const x = gv(id); return x === '' ? null : +x; };
const modalOpen = () => $('#modal-root').children.length > 0;

Object.assign(ACTIONS, {
  tab: (a) => go(a[0]),
  'close-sheet': () => closeSheet(),
  'close-sheet-bg': (a, el, e) => { if (e.target === el) closeSheet(); },
  'dismiss-install': () => { localStorage.setItem('brt.installDismiss', '1'); render(); },
  'do-install': async () => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; } },

  // quick logs
  'open-weight': () => weightSheet(),
  'open-steps': () => stepsSheet(),
  'open-checkin': () => checkinSheet(),
  'open-activity': (a) => activitySheet(a[0]),
  'open-cardio': (a) => cardioSheet('standalone', a[0]),
  'open-abs': () => absSheet(),
  'open-supps': () => suppQuickSheet(),
  'toggle-ab': () => { const d = daily(); d.ab = !d.ab; if (!d.ab) delete d.abRounds; save(); render(); },
  'supp-jump': () => go('log'),

  // saves
  'save-weight': () => { daily().weight = gn('sh-weight'); save(); closeSheet(); render(); toast('Weight logged'); },
  'save-steps': () => { daily().steps = gn('sh-steps'); save(); closeSheet(); render(); toast('Steps logged'); },
  'save-checkin': () => { const d = daily(); d.weight = gn('ci-weight'); d.steps = gn('ci-steps'); d.energy = gv('ci-energy'); d.sleep = gv('ci-sleep'); d.soreness = gv('ci-sore'); d.cycle = gv('ci-cycle'); d.note = gv('ci-note'); save(); closeSheet(); render(); toast('Check-in saved'); },
  'save-activity': () => { const type = gv('ac-type'); S.activities.push({ id: uid(), date: gv('ac-date') || today(), type, duration: gn('ac-dur'), intensity: gv('ac-int'), note: gv('ac-note') }); save(); closeSheet(); render(); toast('Class logged'); },
  'save-cardio': () => { S.cardio.push(buildCardio(gv('cd-date') || today())); save(); closeSheet(); render(); toast('Cardio logged'); },
  'save-active-cardio': () => { S.ui.active.cardio = buildCardio(S.ui.active.date, true); save(); closeSheet(); render(); toast('Cardio added'); },
  'save-abs': () => { const d = daily(); d.ab = true; d.abRounds = gv('ab-rounds'); save(); closeSheet(); render(); toast('Ab circuit logged'); },
  'save-measure': () => {
    const m = { id: uid(), date: gv('ms-date') || today(), weight: gn('ms-weight') };
    $$('.ms-f').forEach((el) => { const v = el.value.trim(); if (v !== '') m[el.dataset.k] = +v; });
    S.measurements.push(m);
    if (m.weight != null && daily(m.date).weight == null) daily(m.date).weight = m.weight;
    save(); closeSheet(); render(); toast('Measurements saved');
  },
  'save-photo': () => {
    if (!window.__photoTmp) return;
    const photos = loadPhotos();
    photos.push({ id: uid(), date: gv('ph-date') || today(), view: gv('ph-view'), dataUrl: window.__photoTmp });
    if (savePhotos(photos)) { window.__photoTmp = null; closeSheet(); render(); toast('Photo saved'); }
  },
  'save-targets': () => { const p = S.profile; p.strengthTarget = gn('tg-str') || 4; p.pilatesTarget = gn('tg-pil') || 2; p.cardioTarget = gn('tg-car') || 3; p.proteinTarget = gn('tg-pro') || 120; p.stepTarget = gn('tg-step') || 10000; save(); closeSheet(); render(); toast('Targets saved'); },
  'save-profile': () => { const p = S.profile; p.name = gv('pf-name'); p.heightIn = gn('pf-h'); p.startWeight = gn('pf-sw'); p.goalWeight = gn('pf-gw'); p.startDate = gv('pf-sd') || p.startDate; p.setup = true; save(); closeSheet(); render(); toast('Profile saved'); },

  // supplements
  'toggle-supp': (a) => { const d = S.suppLog[today()] || (S.suppLog[today()] = {}); if (d[a[0]]) delete d[a[0]]; else d[a[0]] = true; save(); render(); if (modalOpen()) suppQuickSheet(); },
  'supp-all': () => { const d = S.suppLog[today()] = {}; S.supplements.filter((s) => s.active).forEach((s) => d[s.id] = true); save(); render(); if (modalOpen()) suppQuickSheet(); },
  'supp-clear': () => { S.suppLog[today()] = {}; save(); render(); if (modalOpen()) suppQuickSheet(); },
  'supp-manage': () => suppManageSheet(),
  'supp-add': () => { const name = gv('su-name'); if (!name) { toast('Enter a name'); return; } S.supplements.push({ id: uid(), name, dose: gv('su-dose'), time: gv('su-time') || 'Anytime', active: true, order: S.supplements.length }); save(); suppManageSheet(); render(); },
  'supp-toggle': (a) => { const s = S.supplements.find((x) => x.id === a[0]); if (s) s.active = !s.active; save(); suppManageSheet(); render(); },

  // workout
  'start-workout': (a) => { if (S.ui.active && S.ui.active.type !== a[0] && !confirm('Discard your in-progress workout and start a new one?')) return; if (!S.ui.active || S.ui.active.type !== a[0]) S.ui.active = newActive(a[0]); save(); go('workout'); },
  'cancel-workout': () => { if (confirm('Discard this workout? Nothing will be saved.')) { S.ui.active = null; save(); render(); } },
  'add-set': (a) => { const ex = S.ui.active.exercises[+a[0]]; const last = ex.sets[ex.sets.length - 1] || {}; ex.sets.push({ weight: last.weight || '', reps: '' }); save(); render(); },
  'del-set': (a) => { const ex = S.ui.active.exercises[+a[0]]; if (ex.sets.length > 1) ex.sets.pop(); save(); render(); },
  'set-done': (a) => { const st = S.ui.active.exercises[+a[0]].sets[+a[1]]; st.done = !st.done; save(); render(); },
  'set-rir': (a) => { S.ui.active.exercises[+a[0]].rir = +a[1]; save(); render(); },
  'toggle-active-ab': () => { S.ui.active.ab = !S.ui.active.ab; save(); render(); },
  'active-cardio': () => cardioSheet('active'),
  'ex-menu': (a) => exMenuSheet(+a[0]),
  'do-sub': (a) => { const ex = S.ui.active.exercises[+a[0]]; ex.subName = EX[a[1]] ? EX[a[1]].name : a[1]; save(); closeSheet(); render(); },
  'undo-sub': (a) => { S.ui.active.exercises[+a[0]].subName = null; save(); closeSheet(); render(); },
  'set-pain': (a) => { S.ui.active.exercises[+a[0]].pain = a[1]; save(); render(); exMenuSheet(+a[0]); },
  'save-ex-note': (a) => { const t = $('#ex-note-' + a[0]); if (t) S.ui.active.exercises[+a[0]].note = t.value; save(); closeSheet(); render(); },
  'finish-workout': () => finishWorkout(),

  // progress
  'prog-tab': (a) => { S.ui.progTab = a[0]; save(); render(); },
  'ex-history': (a) => exHistorySheet(a[0]),
  'open-measure': () => measureSheet(),
  'open-photo': () => photoSheet(),
  'view-photo': (a) => photoViewSheet(a[0]),
  'del-photo': (a) => { if (!confirm('Delete this photo?')) return; savePhotos(loadPhotos().filter((p) => p.id !== a[0])); closeSheet(); render(); toast('Photo deleted'); },

  // more
  'open-review': () => openSheet(weeklyReviewHTML()),
  'open-library': () => openSheet(libraryHTML()),
  'ex-info': (a) => openSheet(exInfoHTML(a[0])),
  'ex-info-close': () => closeSheet(),
  'open-targets': () => targetsSheet(),
  'open-profile': () => profileSheet(),
  'set-unit': (a) => { S.profile[a[0]] = a[1]; save(); render(); },
  'export-data': () => exportData(),
  'import-data': () => importData(),
  'reset-data': () => resetData()
});

function buildCardio(date, noDate) {
  const o = { type: gv('cd-type'), duration: gn('cd-dur'), effort: gv('cd-eff'),
    level: gn('cd-level'), speed: gn('cd-speed'), incline: gn('cd-incline'), distance: gv('cd-dist'), note: gv('cd-note') };
  if (!noDate) o.date = date;
  Object.keys(o).forEach((k) => { if (o[k] === null || o[k] === '') delete o[k]; });
  o.type = o.type || 'stairmaster';
  return o;
}

/* ---------------------------------------------------------------------------
   24. Init
   --------------------------------------------------------------------------- */
if (!SCREENS[S.ui.tab]) S.ui.tab = 'home';
render();
