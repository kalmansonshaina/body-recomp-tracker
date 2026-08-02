// ============================================================================
// Body Recomp Tracker — seed content + pure logic
// All functions are pure and take the app state `S` as an argument.
// ============================================================================

/* ---- date helpers -------------------------------------------------------- */
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => iso(new Date());
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const startOfWeek = (s) => { const d = parse(s); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return iso(d); };
export const weekDates = (mon) => Array.from({ length: 7 }, (_, i) => addDays(mon, i));
export const fmtDay = (s) => parse(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtShort = (s) => parse(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const round1 = (n) => Math.round(n * 10) / 10;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---- seed: exercises ----------------------------------------------------- */
export const INCR = {
  lowerCompound: 'add ~5–10 lb total',
  upper: 'add the smallest available increment',
  dumbbell: 'move up to the next dumbbell pair',
  machine: 'move up one plate / increment',
};

export const EX = {
  hipthrust:   { name: 'Hip Thrust', cat: 'lowerCompound', muscles: 'Glutes', cues: ['Ribs down, chin tucked', 'Drive through heels', 'Full lockout, squeeze glutes'], subs: ['glutebridge', 'Smith Machine Hip Thrust'] },
  rdl:         { name: 'Romanian Deadlift', cat: 'lowerCompound', muscles: 'Hamstrings, glutes', cues: ['Soft knees', 'Push hips back', 'Bar/DBs close to legs', 'Feel the hamstring stretch'], subs: ['dbrdl', 'Single-Leg RDL', 'backext'] },
  dbrdl:       { name: 'Dumbbell RDL', cat: 'dumbbell', muscles: 'Hamstrings, glutes', cues: ['Hips back', 'Flat back', 'Control the lowering'], subs: ['rdl', 'Single-Leg RDL'] },
  bss:         { name: 'Bulgarian Split Squat', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Long stride', 'Slight forward torso lean', 'Glute emphasis', 'Down and slightly forward'], subs: ['revlunge', 'stepup'] },
  backext:     { name: 'Glute-Focused Back Extension', cat: 'machine', muscles: 'Glutes, hamstrings', cues: ['Round upper back slightly', 'Squeeze glutes at top', "Don't hyperextend"], subs: ['rdl', 'Reverse Hyper'] },
  hipabd:      { name: 'Hip Abduction Machine', cat: 'machine', muscles: 'Glute medius', cues: ['Slight forward lean for upper glute', 'Control back in', 'Higher reps'], subs: ['Banded Hip Abduction', 'Cable Abduction'] },
  latpull:     { name: 'Lat Pulldown', cat: 'machine', muscles: 'Lats, back', cues: ['Chest up', 'Pull to upper chest', 'Elbows down and back'], subs: ['pullup'] },
  cablerow:    { name: 'Seated Cable Row', cat: 'machine', muscles: 'Mid back', cues: ['Tall chest', 'Drive elbows back', 'No leaning'], subs: ['csrow'] },
  dbpress:     { name: 'Dumbbell Shoulder Press', cat: 'dumbbell', muscles: 'Shoulders', cues: ['Ribs down', 'Press slightly in', "Don't flare wrists"], subs: ['Machine Shoulder Press', 'Arnold Press'] },
  latraise:    { name: 'Lateral Raise', cat: 'dumbbell', muscles: 'Side delts', cues: ['Lead with elbows', 'Slight lean forward', 'Control down'], subs: ['Cable Lateral Raise', 'Machine Lateral Raise'] },
  triorbi:     { name: 'Triceps Pushdown / Biceps Curl', cat: 'upper', muscles: 'Triceps / biceps', cues: ['Elbows pinned', 'Full range', 'Squeeze at the end'], subs: ['Overhead Triceps', 'Hammer Curl'] },
  pullup:      { name: 'Assisted Pull-Up / Lat Pulldown', cat: 'machine', muscles: 'Lats, back', cues: ['Full hang', 'Chest to bar', 'Control the negative'], subs: ['latpull'] },
  csrow:       { name: 'Chest-Supported Row', cat: 'machine', muscles: 'Mid & upper back', cues: ['Chest on pad', 'Elbows back', 'Squeeze shoulder blades'], subs: ['cablerow'] },
  inclinedb:   { name: 'Incline Dumbbell Press', cat: 'dumbbell', muscles: 'Upper chest', cues: ['30–45° bench', 'Elbows ~45°', 'Press up and slightly in'], subs: ['Incline Machine Press', 'Push-Up'] },
  reardelt:    { name: 'Rear Delt Fly', cat: 'dumbbell', muscles: 'Rear delts', cues: ['Hinge slightly', 'Elbows soft', 'Light weight, high reps'], subs: ['Reverse Pec Deck', 'Cable Rear Delt'] },
  revlunge:    { name: 'Reverse Lunge', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Step straight back', 'Front heel down', 'Torso tall'], subs: ['stepup', 'bss'] },
  hamcurl:     { name: 'Hamstring Curl', cat: 'machine', muscles: 'Hamstrings', cues: ['Control both directions', 'Point toes for more hamstring'], subs: ['Nordic Curl', 'Stability Ball Curl'] },
  glutebridge: { name: 'Glute Bridge Machine', cat: 'machine', muscles: 'Glutes', cues: ['Full lockout', 'Squeeze at top'], subs: ['hipthrust'] },
  stepup:      { name: 'Step-Up', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Tall box', 'Drive through the top foot', 'Control down'], subs: ['revlunge', 'bss'] },
};

export const WORKOUTS = [
  { id: 'lowerA', name: 'Lower Body A', tag: 'Glute Strength',
    items: [
      { key: 'hipthrust', sets: 4, min: 8, max: 10 },
      { key: 'rdl', sets: 3, min: 8, max: 10 },
      { key: 'bss', sets: 3, min: 8, max: 10, perSide: true },
      { key: 'backext', sets: 3, min: 10, max: 12 },
      { key: 'hipabd', sets: 3, min: 15, max: 20 },
    ] },
  { id: 'upperA', name: 'Upper Body A', tag: 'Push / Pull', abOption: true,
    items: [
      { key: 'latpull', sets: 3, min: 8, max: 10 },
      { key: 'cablerow', sets: 3, min: 8, max: 10 },
      { key: 'dbpress', sets: 3, min: 8, max: 10 },
      { key: 'latraise', sets: 3, min: 12, max: 15 },
      { key: 'triorbi', sets: 3, min: 10, max: 12 },
    ] },
  { id: 'lowerB', name: 'Lower Body B', tag: 'Glutes & Hamstrings',
    items: [
      { key: 'hipthrust', sets: 3, min: 10, max: 12, note: 'Slightly less weight than Lower A' },
      { key: 'dbrdl', sets: 3, min: 8, max: 10 },
      { key: 'revlunge', sets: 3, min: 8, max: 10, perSide: true },
      { key: 'hamcurl', sets: 3, min: 10, max: 12 },
      { key: 'hipabd', sets: 3, min: 15, max: 20 },
    ] },
  { id: 'upperB', name: 'Upper Body B', tag: 'Back & Shoulders', abOption: true,
    items: [
      { key: 'pullup', sets: 3, min: 8, max: 10 },
      { key: 'csrow', sets: 3, min: 8, max: 10 },
      { key: 'inclinedb', sets: 3, min: 8, max: 10 },
      { key: 'latraise', sets: 3, min: 12, max: 15 },
      { key: 'reardelt', sets: 3, min: 12, max: 15 },
    ] },
];
export const workoutById = (id) => WORKOUTS.find((w) => w.id === id);

export const AB_CIRCUIT = [
  { name: 'Dead Bug', target: '10–12 / side' },
  { name: 'Reverse Crunch', target: '10–15' },
  { name: 'Plank', target: '30–60 sec' },
  { name: 'Pallof Press', target: '10–12 / side' },
];
export const DEFAULT_SUPPS = [
  { name: 'Prenatal', time: 'Morning' }, { name: 'Omega-3', time: 'Morning' },
  { name: 'Vitamin D', time: 'Morning' }, { name: 'Choline', time: 'Morning' },
  { name: 'Magnesium', time: 'Evening' }, { name: 'Iron', time: 'Evening' },
  { name: 'Probiotic', time: 'Morning' },
];
export const ACTIVITY_TYPES = [
  { id: 'pilates', name: 'Pilates', counts: true }, { id: 'yoga', name: 'Yoga', counts: true },
  { id: 'heated_pilates', name: 'Heated Pilates', counts: true }, { id: 'heated_yoga', name: 'Heated Yoga', counts: true },
  { id: 'mobility', name: 'Mobility / Stretch', counts: true }, { id: 'other', name: 'Other', counts: false },
];
export const CARDIO_TYPES = [
  { id: 'stairmaster', name: 'StairMaster' }, { id: 'treadmill', name: 'Treadmill' },
  { id: 'walk', name: 'Outdoor Walk' }, { id: 'other', name: 'Other' },
];
export const MFIELDS = [
  { k: 'waist', label: 'Natural waist', hint: 'Narrowest part of the torso' },
  { k: 'lowerWaist', label: 'Lower waist / belly', hint: 'Lower stomach, same reference each time' },
  { k: 'highHip', label: 'High hip', hint: 'Around the upper hip bones' },
  { k: 'fullHip', label: 'Full hip / glutes', hint: 'Fullest point of the glutes' },
  { k: 'rThigh', label: 'Right thigh', hint: 'Fullest part, same distance from hip' },
  { k: 'lThigh', label: 'Left thigh', hint: 'Optional' },
  { k: 'chest', label: 'Chest', hint: 'Optional' },
];

/* ---- default state ------------------------------------------------------- */
export function defaultState() {
  return {
    profile: { name: '', heightIn: null, startWeight: null, goalWeight: null,
      stepTarget: 10000, strengthTarget: 4, pilatesTarget: 2, cardioTarget: 3, proteinTarget: 120,
      weightUnit: 'lb', measureUnit: 'in', startDate: today() },
    sessions: [], activities: [], cardio: [], daily: {},
    supplements: DEFAULT_SUPPS.map((s, i) => ({ id: uid(), name: s.name, dose: '', time: s.time, active: true, order: i })),
    suppLog: {}, measurements: [], exState: {},
  };
}

/* ---- weekly aggregates --------------------------------------------------- */
export function suppAdherence(S, dates) {
  const active = S.supplements.filter((s) => s.active);
  if (!active.length) return { pct: 100, taken: 0, possible: 0 };
  let taken = 0, possible = 0;
  const t = today();
  dates.forEach((d) => {
    if (d > t) return;
    const log = S.suppLog[d] || {};
    active.forEach((s) => { possible++; if (log[s.id]) taken++; });
  });
  return { pct: possible ? Math.round((taken / possible) * 100) : 100, taken, possible };
}

export function weekBundle(S, monday = startOfWeek(today())) {
  const dates = weekDates(monday);
  const inWeek = (d) => d >= monday && d <= dates[6];
  const sessions = S.sessions.filter((s) => inWeek(s.date));
  const acts = S.activities.filter((a) => inWeek(a.date));
  const cardio = S.cardio.filter((c) => inWeek(c.date));
  const pilatesYoga = acts.filter((a) => (ACTIVITY_TYPES.find((t) => t.id === a.type) || {}).counts);
  const weights = dates.map((d) => S.daily[d] && S.daily[d].weight).filter((x) => x != null && x !== '');
  const stepsVals = dates.map((d) => (S.daily[d] && +S.daily[d].steps) || 0).filter((x) => x);
  const stepDays = dates.filter((d) => S.daily[d] && +S.daily[d].steps >= S.profile.stepTarget).length;
  const stepAvg = stepsVals.length ? Math.round(stepsVals.reduce((a, b) => a + b, 0) / stepsVals.length) : 0;
  const stair = cardio.filter((c) => c.type === 'stairmaster').length;
  const tread = cardio.filter((c) => c.type === 'treadmill').length;
  const avgWeight = weights.length ? round1(weights.reduce((a, b) => a + +b, 0) / weights.length) : null;
  const supp = suppAdherence(S, dates);
  const measured = S.measurements.some((m) => inWeek(m.date));
  return { monday, dates, sessions, acts, cardio, pilatesYoga, weights, stepDays, stepAvg,
    stair, tread, avgWeight, supp, measured, hasWeighIn: weights.length > 0 };
}

export function weekRotation(S, monday = startOfWeek(today())) {
  const done = new Set(S.sessions.filter((s) => startOfWeek(s.date) === monday).map((s) => s.type));
  const next = WORKOUTS.find((w) => !done.has(w.id)) || null;
  return { done, next, count: done.size };
}

/* ---- weight trend -------------------------------------------------------- */
export function weighIns(S) {
  return Object.keys(S.daily)
    .filter((d) => S.daily[d].weight != null && S.daily[d].weight !== '')
    .map((d) => ({ date: d, w: +S.daily[d].weight }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
export function rollingAvg(S, endDate, days = 7) {
  const start = addDays(endDate, -(days - 1));
  const pts = weighIns(S).filter((p) => p.date >= start && p.date <= endDate);
  if (!pts.length) return null;
  return round1(pts.reduce((a, p) => a + p.w, 0) / pts.length);
}
export function trendSummary(S) {
  const t = today();
  const cur = rollingAvg(S, t, 7);
  const prev = rollingAvg(S, addDays(t, -7), 7);
  const first = S.profile.startWeight;
  return { cur, prev, delta: cur != null && prev != null ? round1(cur - prev) : null,
    fromStart: cur != null && first != null ? round1(cur - +first) : null };
}

/* ---- strength history ---------------------------------------------------- */
export function lastPerf(S, key) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const ex = (S.sessions[i].exercises || []).find((e) => e.key === key && e.sets && e.sets.some((st) => st.reps));
    if (ex) return { date: S.sessions[i].date, ex };
  }
  return null;
}
export function allPerf(S, key) {
  const out = [];
  S.sessions.forEach((s) => (s.exercises || []).forEach((e) => {
    if (e.key === key && e.sets && e.sets.some((st) => st.reps)) out.push({ date: s.date, ex: e });
  }));
  return out;
}
export function bestSet(S, key) {
  let best = null;
  allPerf(S, key).forEach(({ ex }) => ex.sets.forEach((st) => {
    if (st.weight == null || !st.reps) return;
    if (!best || +st.weight > +best.weight || (+st.weight === +best.weight && +st.reps > +best.reps))
      best = { weight: +st.weight, reps: +st.reps };
  }));
  return best;
}
export function topSetSeries(S, key) {
  return allPerf(S, key)
    .map(({ date, ex }) => ({ date, w: Math.max(...ex.sets.filter((s) => s.reps).map((s) => +s.weight || 0)) }))
    .filter((p) => p.w > 0);
}

/* ---- PROGRESSION → color-coded recommendation ---------------------------- */
// levels: green (increase) · yellow (add reps) · blue (maintain) · red (reduce)
export const REC = {
  green:  { emoji: '🟢', label: 'Increase weight next session', klass: 'green' },
  yellow: { emoji: '🟡', label: 'Keep the same weight and add reps', klass: 'yellow' },
  blue:   { emoji: '🔵', label: 'Maintain current weight', klass: 'blue' },
  red:    { emoji: '🔴', label: 'Reduce weight or modify form', klass: 'red' },
};

export function progression(S, item, exOverride) {
  const info = EX[item.key];
  const last = exOverride ? { ex: exOverride } : lastPerf(S, item.key);
  const wU = S.profile.weightUnit;
  if (!last) {
    return { level: 'blue', rec: REC.blue,
      detail: `Establish a working weight — aim for ${item.min}–${item.max} reps, leaving ~2 in reserve.` };
  }
  const sets = last.ex.sets.filter((s) => s.reps);
  const workingWeight = sets.length ? Math.max(...sets.map((s) => +s.weight || 0)) : 0;
  const pain = last.ex.pain && last.ex.pain !== 'none';
  const rir = last.ex.rir == null ? 2 : +last.ex.rir;
  const allTop = sets.length >= 1 && sets.every((s) => +s.reps >= item.max);
  const anyBelowMin = sets.some((s) => +s.reps < item.min);
  const wtxt = workingWeight ? `${workingWeight} ${wU}` : 'this weight';

  if (pain) return { level: 'red', rec: REC.red, detail: `Pain logged — reduce ${wtxt} or modify form. Don't push through.` };
  if (anyBelowMin) return { level: 'red', rec: REC.red, detail: `Some sets fell below ${item.min}. Reduce a little or repeat ${wtxt} after more recovery.` };
  if (allTop && rir >= 1) return { level: 'green', rec: REC.green, detail: `You hit the top of the range — ${INCR[info.cat]} from ${wtxt}.` };
  if (allTop && rir < 1) return { level: 'blue', rec: REC.blue, detail: `Topped the range but it was near failure — maintain ${wtxt} and consolidate.` };
  return { level: 'yellow', rec: REC.yellow, detail: `Keep ${wtxt} and add reps toward ${item.max}.` };
}

/* ---- Body Recomp Score --------------------------------------------------- */
export function recompScore(S, monday = startOfWeek(today())) {
  const b = weekBundle(S, monday);
  const parts = [];
  const sT = S.profile.strengthTarget || 4;
  parts.push({ key: 'Strength', icon: '💪', got: Math.round(clamp(b.sessions.length / sT, 0, 1) * 40), max: 40, detail: `${b.sessions.length}/${sT} workouts` });
  const pT = S.profile.pilatesTarget || 2;
  parts.push({ key: 'Pilates/Yoga', icon: '🧘', got: Math.round(clamp(b.pilatesYoga.length / pT, 0, 1) * 20), max: 20, detail: `${b.pilatesYoga.length}/${pT}` });
  const stepScore = b.stepAvg ? clamp(b.stepAvg / S.profile.stepTarget, 0, 1) : 0;
  parts.push({ key: 'Steps', icon: '🚶', got: Math.round(stepScore * 15), max: 15, detail: b.stepAvg ? `${b.stepAvg.toLocaleString()}/day` : 'none logged' });
  const suppScore = b.supp.pct >= 90 ? 1 : b.supp.pct / 100;
  parts.push({ key: 'Supplements', icon: '❤️', got: Math.round(suppScore * 10), max: 10, detail: `${b.supp.pct}%` });
  const cSess = b.cardio.length;
  let cScore = 0;
  if (cSess >= 2 && cSess <= 4) cScore = 1; else if (cSess === 1) cScore = 0.5; else if (cSess > 4) cScore = 1;
  parts.push({ key: 'Cardio', icon: '🏃', got: Math.round(cScore * 10), max: 10, detail: `${cSess} session${cSess === 1 ? '' : 's'}` });
  const logged = b.hasWeighIn || b.measured;
  parts.push({ key: 'Tracking', icon: '📏', got: logged ? 5 : 0, max: 5, detail: logged ? 'logged' : 'log a weigh-in' });
  const total = parts.reduce((a, p) => a + p.got, 0);
  return { total, parts, bundle: b };
}

export function weekStatus(S, b) {
  const s = b.sessions.length, py = b.pilatesYoga.length;
  if (s >= (S.profile.strengthTarget || 4) && py >= 1) return { label: 'Excellent Week', pill: 'sage' };
  if (s >= 3) return { label: 'Solid Week', pill: 'accent' };
  return { label: 'Recovery Week', pill: 'muted' };
}

/* ---- formatting ---------------------------------------------------------- */
export const wt = (S, n) => (n == null || n === '' ? '—' : `${round1(+n)} ${S.profile.weightUnit}`);
