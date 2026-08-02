// ============================================================================
// Body Recomp Tracker — seed content + pure logic
// Pure functions take the app state `S` as an argument.
//
// KEY DATA-MODEL RULE: every logged set is stored on a workout session under a
// stable exercise `key`. History is derived by filtering sessions for that key.
// So editing a workout template (add / remove / swap an exercise) NEVER touches
// past session data — an exercise's history is preserved and reappears intact
// if it's added back later.
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
export const slug = (s) => 'x_' + s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Math.random().toString(36).slice(2, 5);

/* ---- weight-increase guidance by category ------------------------------- */
export const INCR = {
  lowerCompound: 'add ~5–10 lb total',
  upper: 'add the smallest available increment',
  dumbbell: 'move up to the next dumbbell pair',
  machine: 'move up one plate / increment',
  bodyweight: 'add reps or a little load',
  core: 'add reps or a little load',
};
export function incrText(cat, unit) {
  if (cat === 'lowerCompound') return unit === 'kg' ? 'add ~2.5–5 kg total' : 'add ~5–10 lb total';
  return INCR[cat] || INCR.upper;
}

/* ---- EXERCISE DATABASE --------------------------------------------------- */
// group: 'lower' | 'upper' | 'core'   ·   cat drives the progression increment
export const EX = {
  // ----- lower / glutes -----
  hipthrust:   { name: 'Hip Thrust', group: 'lower', cat: 'lowerCompound', muscles: 'Glutes', cues: ['Ribs down, chin tucked', 'Drive through heels', 'Full lockout, squeeze glutes'], subs: ['glutebridge', 'sl_hipthrust', 'smith_hipthrust'] },
  glutebridge: { name: 'Glute Bridge Machine', group: 'lower', cat: 'machine', muscles: 'Glutes', cues: ['Full lockout', 'Squeeze at top'], subs: ['hipthrust'] },
  sl_hipthrust:{ name: 'Single-Leg Hip Thrust', group: 'lower', cat: 'bodyweight', muscles: 'Glutes', cues: ['Level hips', 'Drive through the heel'], subs: ['hipthrust'] },
  smith_hipthrust: { name: 'Smith Machine Hip Thrust', group: 'lower', cat: 'lowerCompound', muscles: 'Glutes', cues: ['Pad on hips', 'Full lockout'], subs: ['hipthrust'] },
  rdl:         { name: 'Romanian Deadlift', group: 'lower', cat: 'lowerCompound', muscles: 'Hamstrings, glutes', cues: ['Soft knees', 'Push hips back', 'Bar close to legs', 'Feel the hamstring stretch'], subs: ['dbrdl', 'sl_rdl', 'backext'] },
  dbrdl:       { name: 'Dumbbell RDL', group: 'lower', cat: 'dumbbell', muscles: 'Hamstrings, glutes', cues: ['Hips back', 'Flat back', 'Control the lowering'], subs: ['rdl', 'sl_rdl'] },
  sl_rdl:      { name: 'Single-Leg RDL', group: 'lower', cat: 'dumbbell', muscles: 'Hamstrings, glutes', cues: ['Square hips', 'Slow and balanced'], subs: ['dbrdl'] },
  sumodl:      { name: 'Sumo Deadlift', group: 'lower', cat: 'lowerCompound', muscles: 'Glutes, hamstrings', cues: ['Wide stance', 'Knees track toes', 'Push the floor away'], subs: ['rdl'] },
  bss:         { name: 'Bulgarian Split Squat', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Long stride', 'Slight forward torso lean', 'Glute emphasis'], subs: ['revlunge', 'stepup', 'walkinglunge'] },
  revlunge:    { name: 'Reverse Lunge', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Step straight back', 'Front heel down', 'Torso tall'], subs: ['stepup', 'bss', 'walkinglunge'] },
  walkinglunge:{ name: 'Walking Lunge', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Long steps', 'Push through front heel'], subs: ['revlunge', 'bss'] },
  stepup:      { name: 'Step-Up', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, quads', cues: ['Tall box', 'Drive through the top foot', 'Control down'], subs: ['revlunge', 'bss'] },
  gobletsquat: { name: 'Goblet Squat', group: 'lower', cat: 'dumbbell', muscles: 'Quads, glutes', cues: ['Elbows inside knees', 'Chest tall', 'Sit between hips'], subs: ['legpress', 'hacksquat'] },
  backsquat:   { name: 'Back Squat', group: 'lower', cat: 'lowerCompound', muscles: 'Quads, glutes', cues: ['Brace', 'Knees track toes', 'Depth with control'], subs: ['gobletsquat', 'hacksquat'] },
  legpress:    { name: 'Leg Press', group: 'lower', cat: 'machine', muscles: 'Quads, glutes', cues: ['Feet high for glutes', 'No lower-back rounding'], subs: ['hacksquat', 'gobletsquat'] },
  hacksquat:   { name: 'Hack Squat', group: 'lower', cat: 'machine', muscles: 'Quads', cues: ['Full depth', 'Control the descent'], subs: ['legpress'] },
  hamcurl:     { name: 'Lying Hamstring Curl', group: 'lower', cat: 'machine', muscles: 'Hamstrings', cues: ['Control both directions', 'Point toes for more hamstring'], subs: ['seated_hamcurl', 'nordic'] },
  seated_hamcurl: { name: 'Seated Hamstring Curl', group: 'lower', cat: 'machine', muscles: 'Hamstrings', cues: ['Pad above knees', 'Squeeze at the bottom'], subs: ['hamcurl'] },
  nordic:      { name: 'Nordic Curl', group: 'lower', cat: 'bodyweight', muscles: 'Hamstrings', cues: ['Lower slowly', 'Assist up as needed'], subs: ['hamcurl'] },
  legext:      { name: 'Leg Extension', group: 'lower', cat: 'machine', muscles: 'Quads', cues: ['Pause at the top', 'Control down'], subs: ['legpress'] },
  backext:     { name: 'Glute-Focused Back Extension', group: 'lower', cat: 'machine', muscles: 'Glutes, hamstrings', cues: ['Round upper back slightly', 'Squeeze glutes at top', "Don't hyperextend"], subs: ['rdl', 'reversehyper'] },
  reversehyper:{ name: 'Reverse Hyper', group: 'lower', cat: 'machine', muscles: 'Glutes, low back', cues: ['Controlled swing', 'Squeeze at top'], subs: ['backext'] },
  hipabd:      { name: 'Hip Abduction Machine', group: 'lower', cat: 'machine', muscles: 'Glute medius', cues: ['Slight forward lean for upper glute', 'Control back in', 'Higher reps'], subs: ['banded_abd', 'cable_abd'] },
  banded_abd:  { name: 'Banded Hip Abduction', group: 'lower', cat: 'bodyweight', muscles: 'Glute medius', cues: ['Keep tension', 'Slow reps'], subs: ['hipabd'] },
  cable_abd:   { name: 'Cable Hip Abduction', group: 'lower', cat: 'machine', muscles: 'Glute medius', cues: ['Stand tall', 'Lead with the heel'], subs: ['hipabd'] },
  adductor:    { name: 'Adductor Machine', group: 'lower', cat: 'machine', muscles: 'Inner thigh', cues: ['Control the stretch', 'Squeeze in'], subs: [] },
  calfraise:   { name: 'Standing Calf Raise', group: 'lower', cat: 'machine', muscles: 'Calves', cues: ['Full stretch', 'Pause at top'], subs: ['seated_calf'] },
  seated_calf: { name: 'Seated Calf Raise', group: 'lower', cat: 'machine', muscles: 'Calves', cues: ['Slow tempo', 'Big stretch'], subs: ['calfraise'] },

  // ----- upper -----
  latpull:     { name: 'Lat Pulldown', group: 'upper', cat: 'machine', muscles: 'Lats, back', cues: ['Chest up', 'Pull to upper chest', 'Elbows down and back'], subs: ['pullup', 'assisted_pullup'] },
  pullup:      { name: 'Pull-Up', group: 'upper', cat: 'bodyweight', muscles: 'Lats, back', cues: ['Full hang', 'Chest to bar', 'Control the negative'], subs: ['assisted_pullup', 'latpull'] },
  assisted_pullup: { name: 'Assisted Pull-Up', group: 'upper', cat: 'machine', muscles: 'Lats, back', cues: ['Full range', 'Control the negative'], subs: ['latpull'] },
  cablerow:    { name: 'Seated Cable Row', group: 'upper', cat: 'machine', muscles: 'Mid back', cues: ['Tall chest', 'Drive elbows back', 'No leaning'], subs: ['csrow', 'dbrow'] },
  csrow:       { name: 'Chest-Supported Row', group: 'upper', cat: 'machine', muscles: 'Mid & upper back', cues: ['Chest on pad', 'Elbows back', 'Squeeze shoulder blades'], subs: ['cablerow', 'dbrow'] },
  dbrow:       { name: 'One-Arm Dumbbell Row', group: 'upper', cat: 'dumbbell', muscles: 'Lats, mid back', cues: ['Flat back', 'Row to hip', 'No twisting'], subs: ['csrow', 'cablerow'] },
  facepull:    { name: 'Face Pull', group: 'upper', cat: 'machine', muscles: 'Rear delts, upper back', cues: ['Pull to the face', 'Elbows high', 'Squeeze'], subs: ['reardelt'] },
  dbpress:     { name: 'Dumbbell Shoulder Press', group: 'upper', cat: 'dumbbell', muscles: 'Shoulders', cues: ['Ribs down', 'Press slightly in', "Don't flare wrists"], subs: ['machine_press', 'arnold', 'ohp'] },
  ohp:         { name: 'Overhead Press', group: 'upper', cat: 'upper', muscles: 'Shoulders', cues: ['Brace', 'Bar over midfoot', 'Full lockout'], subs: ['dbpress', 'machine_press'] },
  machine_press: { name: 'Machine Shoulder Press', group: 'upper', cat: 'machine', muscles: 'Shoulders', cues: ['Set seat height', 'Full range'], subs: ['dbpress'] },
  arnold:      { name: 'Arnold Press', group: 'upper', cat: 'dumbbell', muscles: 'Shoulders', cues: ['Rotate as you press', 'Control down'], subs: ['dbpress'] },
  latraise:    { name: 'Lateral Raise', group: 'upper', cat: 'dumbbell', muscles: 'Side delts', cues: ['Lead with elbows', 'Slight lean forward', 'Control down'], subs: ['cable_latraise', 'machine_latraise'] },
  cable_latraise: { name: 'Cable Lateral Raise', group: 'upper', cat: 'machine', muscles: 'Side delts', cues: ['Constant tension', 'Lead with elbow'], subs: ['latraise'] },
  machine_latraise: { name: 'Machine Lateral Raise', group: 'upper', cat: 'machine', muscles: 'Side delts', cues: ['Pause at top', 'Slow down'], subs: ['latraise'] },
  reardelt:    { name: 'Rear Delt Fly', group: 'upper', cat: 'dumbbell', muscles: 'Rear delts', cues: ['Hinge slightly', 'Elbows soft', 'Light weight, high reps'], subs: ['pecdeck_rear', 'facepull'] },
  pecdeck_rear:{ name: 'Reverse Pec Deck', group: 'upper', cat: 'machine', muscles: 'Rear delts', cues: ['Squeeze shoulder blades', 'Control back'], subs: ['reardelt'] },
  inclinedb:   { name: 'Incline Dumbbell Press', group: 'upper', cat: 'dumbbell', muscles: 'Upper chest', cues: ['30–45° bench', 'Elbows ~45°', 'Press up and slightly in'], subs: ['incline_machine', 'pushup'] },
  incline_machine: { name: 'Incline Machine Press', group: 'upper', cat: 'machine', muscles: 'Upper chest', cues: ['Set seat', 'Full range'], subs: ['inclinedb'] },
  benchpress:  { name: 'Bench Press', group: 'upper', cat: 'upper', muscles: 'Chest', cues: ['Shoulder blades set', 'Bar to lower chest', 'Drive up'], subs: ['chestpress', 'pushup'] },
  chestpress:  { name: 'Chest Press Machine', group: 'upper', cat: 'machine', muscles: 'Chest', cues: ['Set seat', 'Full range'], subs: ['benchpress', 'pushup'] },
  pushup:      { name: 'Push-Up', group: 'upper', cat: 'bodyweight', muscles: 'Chest, triceps', cues: ['Straight line', 'Elbows ~45°'], subs: ['chestpress'] },
  pecdeck:     { name: 'Pec Deck', group: 'upper', cat: 'machine', muscles: 'Chest', cues: ['Squeeze in', 'Control out'], subs: ['chestpress'] },
  tricepspushdown: { name: 'Triceps Pushdown', group: 'upper', cat: 'machine', muscles: 'Triceps', cues: ['Elbows pinned', 'Full lockout'], subs: ['overhead_tri'] },
  overhead_tri:{ name: 'Overhead Triceps Extension', group: 'upper', cat: 'dumbbell', muscles: 'Triceps', cues: ['Elbows in', 'Big stretch'], subs: ['tricepspushdown'] },
  bicepscurl:  { name: 'Biceps Curl', group: 'upper', cat: 'dumbbell', muscles: 'Biceps', cues: ['Elbows pinned', 'Full range', 'Squeeze'], subs: ['hammercurl', 'preacher'] },
  hammercurl:  { name: 'Hammer Curl', group: 'upper', cat: 'dumbbell', muscles: 'Biceps, forearms', cues: ['Neutral grip', 'No swinging'], subs: ['bicepscurl'] },
  preacher:    { name: 'Preacher Curl', group: 'upper', cat: 'machine', muscles: 'Biceps', cues: ['Full stretch', 'Control down'], subs: ['bicepscurl'] },
  triorbi:     { name: 'Triceps or Biceps (finisher)', group: 'upper', cat: 'upper', muscles: 'Triceps / biceps', cues: ['Pick one', 'Elbows pinned', 'Full range'], subs: ['tricepspushdown', 'bicepscurl'] },

  // ----- core -----
  deadbug:     { name: 'Dead Bug', group: 'core', cat: 'core', muscles: 'Core', cues: ['Low back flat', 'Slow opposite limbs'], subs: ['birddog'] },
  reversecrunch:{ name: 'Reverse Crunch', group: 'core', cat: 'core', muscles: 'Lower abs', cues: ['Curl hips up', 'Control down'], subs: ['hangingknee'] },
  plank:       { name: 'Plank', group: 'core', cat: 'core', muscles: 'Core', cues: ['Straight line', 'Squeeze glutes'], subs: ['deadbug'] },
  pallof:      { name: 'Pallof Press', group: 'core', cat: 'core', muscles: 'Core (anti-rotation)', cues: ['Resist rotation', 'Press straight out'], subs: ['deadbug'] },
  hangingknee: { name: 'Hanging Knee Raise', group: 'core', cat: 'core', muscles: 'Lower abs', cues: ['No swinging', 'Curl the pelvis'], subs: ['reversecrunch'] },
  cablecrunch: { name: 'Cable Crunch', group: 'core', cat: 'machine', muscles: 'Abs', cues: ['Crunch with abs', 'Hips still'], subs: ['reversecrunch'] },
  birddog:     { name: 'Bird Dog', group: 'core', cat: 'core', muscles: 'Core', cues: ['Slow', 'Square hips'], subs: ['deadbug'] },
};

export const EX_GROUPS = [
  { id: 'lower', name: 'Lower / Glutes' },
  { id: 'upper', name: 'Upper Body' },
  { id: 'core', name: 'Core' },
];

/* ---- default editable workouts ------------------------------------------ */
export const DEFAULT_WORKOUTS = [
  { id: 'lowerA', name: 'Lower Body A', tag: 'Glute Strength', group: 'lower', items: [
    { key: 'hipthrust', sets: 4, min: 8, max: 10 },
    { key: 'rdl', sets: 3, min: 8, max: 10 },
    { key: 'bss', sets: 3, min: 8, max: 10, perSide: true },
    { key: 'backext', sets: 3, min: 10, max: 12 },
    { key: 'hipabd', sets: 3, min: 15, max: 20 },
  ] },
  { id: 'upperA', name: 'Upper Body A', tag: 'Push / Pull', group: 'upper', abOption: true, items: [
    { key: 'latpull', sets: 3, min: 8, max: 10 },
    { key: 'cablerow', sets: 3, min: 8, max: 10 },
    { key: 'dbpress', sets: 3, min: 8, max: 10 },
    { key: 'latraise', sets: 3, min: 12, max: 15 },
    { key: 'triorbi', sets: 3, min: 10, max: 12 },
  ] },
  { id: 'lowerB', name: 'Lower Body B', tag: 'Glutes & Hamstrings', group: 'lower', items: [
    { key: 'hipthrust', sets: 3, min: 10, max: 12, note: 'Slightly less weight than Lower A' },
    { key: 'dbrdl', sets: 3, min: 8, max: 10 },
    { key: 'revlunge', sets: 3, min: 8, max: 10, perSide: true },
    { key: 'hamcurl', sets: 3, min: 10, max: 12 },
    { key: 'hipabd', sets: 3, min: 15, max: 20 },
  ] },
  { id: 'upperB', name: 'Upper Body B', tag: 'Back & Shoulders', group: 'upper', abOption: true, items: [
    { key: 'pullup', sets: 3, min: 8, max: 10 },
    { key: 'csrow', sets: 3, min: 8, max: 10 },
    { key: 'inclinedb', sets: 3, min: 8, max: 10 },
    { key: 'latraise', sets: 3, min: 12, max: 15 },
    { key: 'reardelt', sets: 3, min: 12, max: 15 },
  ] },
];

/* ---- warm-ups & cooldowns (context-aware by workout group) -------------- */
export const WARMUPS = {
  lower: { title: 'Lower Body Warm-Up', time: '5–7 min', steps: [
    { name: 'Banded Lateral Walks', detail: '10 steps each direction · slight squat · keep band tension the whole time' },
    { name: 'Glute Bridges', detail: '15 reps · 2-sec hold at top · squeeze glutes, don’t arch' },
    { name: 'Bodyweight Bulgarian Split Squats', detail: '5 reps/leg · long stance · slight forward lean · slow & controlled' },
  ], note: 'Then do 1–2 lighter warm-up sets of your first exercise before your working sets.' },
  upper: { title: 'Upper Body Warm-Up', time: '3–5 min', steps: [
    { name: 'Band Pull-Aparts', detail: '15 reps' },
    { name: 'Cat-Cow', detail: '8 reps' },
    { name: 'Arm Circles', detail: '20 sec each direction' },
  ], note: 'Then perform one lighter warm-up set of your first lift.' },
};
export const COOLDOWNS = {
  lower: { title: 'Lower Body Cooldown', time: '5 min', steps: [
    { name: 'Frog Stretch', detail: 'Hold 30–45 sec · gentle stretch only' },
    { name: 'Adductor Rock-Backs', detail: '8–10 slow reps/side · move in and out of the stretch' },
    { name: 'Hip Flexor Stretch', detail: '30–45 sec/side · pelvis tucked slightly under, not arched' },
  ] },
  upper: { title: 'Upper Body Cooldown', time: 'optional', steps: [
    { name: 'Child’s Pose', detail: '30 sec' },
    { name: 'Thread the Needle', detail: '30 sec each side' },
    { name: 'Doorway Chest Stretch', detail: '30 sec each side' },
  ] },
};

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

/* ---- catalog accessors (built-in + user custom) ------------------------- */
export function exDef(S, key) {
  return EX[key] || (S && S.customExercises && S.customExercises[key]) || { name: key, group: 'other', cat: 'upper', muscles: '', cues: [], subs: [] };
}
export function exList(S) {
  const custom = (S && S.customExercises) || {};
  return [...Object.keys(EX).map((k) => ({ key: k, ...EX[k], custom: false })),
    ...Object.keys(custom).map((k) => ({ key: k, ...custom[k], custom: true }))];
}
export function getWorkouts(S) { return S && S.workouts && S.workouts.length ? S.workouts : DEFAULT_WORKOUTS; }
export function workoutById(S, id) { return getWorkouts(S).find((w) => w.id === id); }
export function findItem(S, key) { return getWorkouts(S).flatMap((w) => w.items).find((i) => i.key === key) || { key, min: 8, max: 10, sets: 3 }; }

// Rehydrate an already-finished session back into the editable workout shape,
// keeping every logged set/weight/rep. Used when re-opening a workout you
// already completed (same day or from history) so it shows your reps.
export function sessionToActive(S, session) {
  const w = workoutById(S, session.type);
  const itemFor = (key) => ((w && w.items) || []).find((it) => it.key === key) || {};
  return {
    id: session.id, date: session.date, type: session.type, name: session.name,
    group: session.group || (w && w.group) || 'lower', completed: true,
    exercises: (session.exercises || []).map((e) => {
      const it = itemFor(e.key);
      const prescribed = it.sets || (e.sets ? e.sets.length : 3) || 3;
      const sets = (e.sets || []).map((s) => ({ weight: s.weight ?? '', reps: s.reps ?? '', done: !!s.done }));
      while (sets.length < prescribed) sets.push({ weight: sets.length ? sets[sets.length - 1].weight : '', reps: '' });
      return { key: e.key, min: it.min ?? 8, max: it.max ?? 12, perSide: !!it.perSide, prescribed, sets,
        rir: e.rir ?? 2, pain: e.pain || 'none', equip: e.equip || {}, note: e.note || '' };
    }),
    cardio: session.cardio || null, ab: !!session.ab, warmup: !!session.warmup, cooldown: !!session.cooldown, note: session.note || '',
  };
}

/* ---- default state ------------------------------------------------------- */
export function defaultState() {
  return {
    profile: { name: '', heightIn: null, startWeight: null, goalWeight: null,
      stepTarget: 10000, strengthTarget: 4, pilatesTarget: 2, cardioTarget: 3, proteinTarget: 120,
      weightUnit: 'lb', bodyUnit: 'lb', measureUnit: 'in', startDate: today() },
    workouts: structuredClone(DEFAULT_WORKOUTS),
    customExercises: {},
    sessions: [], activities: [], cardio: [], daily: {},
    supplements: DEFAULT_SUPPS.map((s, i) => ({ id: uid(), name: s.name, dose: '', time: s.time, active: true, order: i })),
    suppLog: {}, measurements: [], exState: {},
    identity: defaultIdentity(),
  };
}

/* ---- weekly aggregates --------------------------------------------------- */
// Supplements are scored as a simple daily yes/no: a day counts if you took
// AT LEAST ONE supplement that day. Leaving some out (or swapping days) never
// hurts the score — the detailed per-supplement checklist is just for you.
export function suppAdherence(S, dates) {
  const active = S.supplements.filter((s) => s.active);
  const t = today();
  const elapsed = dates.filter((d) => d <= t);
  if (!active.length) return { pct: 100, days: 0, possibleDays: 0, tookToday: false };
  let days = 0;
  elapsed.forEach((d) => { const log = S.suppLog[d] || {}; if (active.some((s) => log[s.id])) days++; });
  const todayLog = S.suppLog[t] || {};
  const tookToday = active.some((s) => todayLog[s.id]);
  return { pct: elapsed.length ? Math.round((days / elapsed.length) * 100) : 100, days, possibleDays: elapsed.length, tookToday };
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
  return { monday, dates, sessions, acts, cardio, pilatesYoga, weights, stepDays, stepAvg, stair, tread, avgWeight, supp, measured, hasWeighIn: weights.length > 0 };
}
export function weekRotation(S, monday = startOfWeek(today())) {
  const workouts = getWorkouts(S);
  const done = new Set(S.sessions.filter((s) => startOfWeek(s.date) === monday).map((s) => s.type));
  const next = workouts.find((w) => !done.has(w.id)) || null;
  return { done, next, count: [...done].filter((id) => workouts.some((w) => w.id === id)).length };
}

/* ---- weight trend -------------------------------------------------------- */
export function weighIns(S) {
  return Object.keys(S.daily).filter((d) => S.daily[d].weight != null && S.daily[d].weight !== '')
    .map((d) => ({ date: d, w: +S.daily[d].weight })).sort((a, b) => (a.date < b.date ? -1 : 1));
}
export function rollingAvg(S, endDate, days = 7) {
  const start = addDays(endDate, -(days - 1));
  const pts = weighIns(S).filter((p) => p.date >= start && p.date <= endDate);
  if (!pts.length) return null;
  return round1(pts.reduce((a, p) => a + p.w, 0) / pts.length);
}
export function trendSummary(S) {
  const t = today();
  const cur = rollingAvg(S, t, 7), prev = rollingAvg(S, addDays(t, -7), 7), first = S.profile.startWeight;
  return { cur, prev, delta: cur != null && prev != null ? round1(cur - prev) : null, fromStart: cur != null && first != null ? round1(cur - +first) : null };
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
  S.sessions.forEach((s) => (s.exercises || []).forEach((e) => { if (e.key === key && e.sets && e.sets.some((st) => st.reps)) out.push({ date: s.date, ex: e }); }));
  return out;
}
export function bestSet(S, key) {
  let best = null;
  allPerf(S, key).forEach(({ ex }) => ex.sets.forEach((st) => {
    if (st.weight == null || !st.reps) return;
    if (!best || +st.weight > +best.weight || (+st.weight === +best.weight && +st.reps > +best.reps)) best = { weight: +st.weight, reps: +st.reps };
  }));
  return best;
}
export function topSetSeries(S, key) {
  return allPerf(S, key).map(({ date, ex }) => ({ date, w: Math.max(...ex.sets.filter((s) => s.reps).map((s) => +s.weight || 0)) })).filter((p) => p.w > 0);
}

/* ---- PROGRESSION → color-coded recommendation --------------------------- */
export const REC = {
  green:  { emoji: '🟢', label: 'Increase weight next session', klass: 'green' },
  yellow: { emoji: '🟡', label: 'Keep the same weight and add reps', klass: 'yellow' },
  blue:   { emoji: '🔵', label: 'Maintain current weight', klass: 'blue' },
  red:    { emoji: '🔴', label: 'Reduce weight or modify form', klass: 'red' },
};
export function progression(S, item, exOverride) {
  const info = exDef(S, item.key);
  const last = exOverride ? { ex: exOverride } : lastPerf(S, item.key);
  const wU = S.profile.weightUnit;
  if (!last) return { level: 'blue', rec: REC.blue, detail: `Establish a working weight — aim for ${item.min}–${item.max} reps, leaving ~2 in reserve.` };
  const sets = last.ex.sets.filter((s) => s.reps);
  const workingWeight = sets.length ? Math.max(...sets.map((s) => +s.weight || 0)) : 0;
  const pain = last.ex.pain && last.ex.pain !== 'none';
  const rir = last.ex.rir == null ? 2 : +last.ex.rir;
  const allTop = sets.length >= 1 && sets.every((s) => +s.reps >= item.max);
  const anyBelowMin = sets.some((s) => +s.reps < item.min);
  const wtxt = workingWeight ? `${workingWeight} ${wU}` : 'this weight';
  if (pain) return { level: 'red', rec: REC.red, detail: `Pain logged — reduce ${wtxt} or modify form. Don't push through.` };
  if (anyBelowMin) return { level: 'red', rec: REC.red, detail: `Some sets fell below ${item.min}. Reduce a little or repeat ${wtxt} after more recovery.` };
  if (allTop && rir >= 1) return { level: 'green', rec: REC.green, detail: `You hit the top of the range — ${incrText(info.cat, wU)} from ${wtxt}.` };
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
  // Simple daily yes/no: took any supplement today → full credit. Which ones
  // (or how many) you skip doesn't matter — the checklist is just for you.
  parts.push({ key: 'Supplements', icon: '❤️', got: b.supp.tookToday ? 10 : 0, max: 10, detail: b.supp.tookToday ? 'taken today' : 'not yet today' });
  const cSess = b.cardio.length;
  let cScore = 0;
  if (cSess >= 2 && cSess <= 4) cScore = 1; else if (cSess === 1) cScore = 0.5; else if (cSess > 4) cScore = 1;
  parts.push({ key: 'Cardio', icon: '🏃', got: Math.round(cScore * 10), max: 10, detail: `${cSess} session${cSess === 1 ? '' : 's'}` });
  const logged = b.hasWeighIn || b.measured;
  parts.push({ key: 'Tracking', icon: '📏', got: logged ? 5 : 0, max: 5, detail: logged ? 'logged' : 'log a weigh-in' });
  return { total: parts.reduce((a, p) => a + p.got, 0), parts, bundle: b };
}
export function weekStatus(S, b) {
  const s = b.sessions.length, py = b.pilatesYoga.length;
  if (s >= (S.profile.strengthTarget || 4) && py >= 1) return { label: 'Excellent Week', pill: 'sage' };
  if (s >= 3) return { label: 'Solid Week', pill: 'accent' };
  return { label: 'Recovery Week', pill: 'muted' };
}

// body-weight formatter uses the body-weight unit (separate from lifting weight)
export const wt = (S, n) => (n == null || n === '' ? '—' : `${round1(+n)} ${S.profile.bodyUnit || S.profile.weightUnit || 'lb'}`);

/* ============================================================================
   IDENTITY — categories, affirmation library, daily "Today's Identity" logic
   ============================================================================ */
export const IDENTITY_CATEGORIES = [
  { id: 'beauty', name: 'Beauty', emoji: '✨' },
  { id: 'glamour', name: 'Glamour & Magic', emoji: '🪄' },
  { id: 'wealth', name: 'Wealth', emoji: '💰' },
  { id: 'health', name: 'Health', emoji: '🌿' },
  { id: 'body', name: 'Body', emoji: '🍑' },
  { id: 'confidence', name: 'Confidence', emoji: '🤍' },
  { id: 'relationships', name: 'Friendships & Relationships', emoji: '🌸' },
  { id: 'future', name: 'Future Self', emoji: '🌅' },
];
export const IDENTITY_SEED = {
  beauty: ['I naturally radiate beauty and warmth.', 'My skin, hair, and body become healthier every day.', 'I carry myself with elegance.', 'I look rested, vibrant, and feminine.', 'My beauty grows through the way I care for myself.'],
  glamour: ['I create beauty wherever I go.', 'My life feels luxurious in simple ways.', 'I notice magic and opportunity every day.', 'I move through life with grace and curiosity.', 'I am becoming the woman I always imagined.'],
  wealth: ['I make decisions that build lasting wealth.', 'Money flows toward valuable work.', 'I create far more value than I consume.', 'My income grows because my skills grow.', 'I manage money with confidence and wisdom.'],
  health: ['Every workout makes me stronger.', 'I nourish my body with food that gives me energy.', 'Recovery helps me grow.', 'I trust my body and care for it consistently.', 'Healthy habits compound into extraordinary results.'],
  body: ['I am building a strong, feminine body.', 'My waist becomes leaner through consistency.', 'My glutes become stronger every week.', 'I move with confidence and good posture.', 'I celebrate progress over perfection.'],
  confidence: ['I trust my judgment.', 'I keep promises to myself.', 'I remain calm under pressure.', 'Progress matters more than perfection.', 'My confidence grows through consistent action.'],
  relationships: ['I attract kind and emotionally healthy people.', 'I invest deeply in the people I love.', 'I communicate with warmth and honesty.', 'My relationships become richer every year.', 'I create a joyful home and community.'],
  future: ['Every small action today builds my future.', 'My habits reflect the woman I am becoming.', 'I choose consistency over intensity.', 'I become more capable every month.', "My future is created by today's decisions."],
};
export const REFLECTION_PROMPTS = [
  'How can I embody this version of myself today?',
  'What decision would my future self make today?',
  'What habit will reinforce today’s identity?',
  'What are three things I’m grateful for today?',
  'How did I show up as this version of myself today?',
];
// weekday rotation (0=Sun … 6=Sat) for the dashboard featured category
export const IDENTITY_ROTATION = ['body', 'wealth', 'beauty', 'confidence', 'health', 'relationships', 'glamour'];

export function defaultIdentity() {
  const categories = IDENTITY_CATEGORIES.map((c, i) => ({ ...c, order: i, active: true }));
  const affirmations = [];
  Object.keys(IDENTITY_SEED).forEach((catId) => IDENTITY_SEED[catId].forEach((text) => affirmations.push({ id: uid(), catId, text, favorite: false })));
  return { categories, affirmations, rotation: [...IDENTITY_ROTATION], daily: {} };
}

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export function idCats(S) { return ((S.identity && S.identity.categories) || []).filter((c) => c.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); }
export function idCat(S, catId) { return ((S.identity && S.identity.categories) || []).find((c) => c.id === catId); }
export function idAffs(S, catId) { return ((S.identity && S.identity.affirmations) || []).filter((a) => a.catId === catId); }
export function idFeaturedCat(S, date = today()) {
  const cats = idCats(S); if (!cats.length) return null;
  const rot = (S.identity && S.identity.rotation) || [];
  const wd = parse(date).getDay();
  return cats.find((c) => c.id === rot[wd]) || cats[hashStr(date) % cats.length];
}
export function idDailyAff(S, catId, date = today()) {
  const affs = idAffs(S, catId); if (!affs.length) return null;
  const base = hashStr(date + ':' + catId) % affs.length;
  const over = (S.identity && S.identity.daily && S.identity.daily[date] && S.identity.daily[date].pick && S.identity.daily[date].pick[catId]) || 0;
  return affs[(base + over) % affs.length];
}
export function idToday(S, date = today()) { return idCats(S).map((c) => ({ cat: c, aff: idDailyAff(S, c.id, date) })); }
export function idReflectionPrompt(date = today()) { return REFLECTION_PROMPTS[hashStr('r' + date) % REFLECTION_PROMPTS.length]; }
export function idRead(S, date = today()) { return !!(S.identity && S.identity.daily && S.identity.daily[date] && S.identity.daily[date].read); }

/* ============================================================================
   EXTENDED EXERCISE DATABASE — hundreds of movements so custom is rarely needed
   (name / group / cat / muscles; cues optional). Merged into EX above.
   ============================================================================ */
Object.assign(EX, {
  /* ---- GLUTES / HIPS ---- */
  hipthrust_machine: { name: 'Hip Thrust Machine', group: 'lower', cat: 'machine', muscles: 'Glutes' },
  bstance_hipthrust: { name: 'B-Stance Hip Thrust', group: 'lower', cat: 'dumbbell', muscles: 'Glutes' },
  kas_bridge: { name: 'KAS Glute Bridge', group: 'lower', cat: 'lowerCompound', muscles: 'Glutes' },
  frog_pump: { name: 'Frog Pump', group: 'lower', cat: 'bodyweight', muscles: 'Glutes' },
  cable_pullthrough: { name: 'Cable Pull-Through', group: 'lower', cat: 'machine', muscles: 'Glutes, hamstrings' },
  glute_kickback_machine: { name: 'Glute Kickback Machine', group: 'lower', cat: 'machine', muscles: 'Glutes' },
  glute_kickback_cable: { name: 'Cable Glute Kickback', group: 'lower', cat: 'machine', muscles: 'Glutes' },
  curtsy_lunge: { name: 'Curtsy Lunge', group: 'lower', cat: 'dumbbell', muscles: 'Glutes' },
  lateral_lunge: { name: 'Lateral Lunge', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, adductors' },
  deficit_reverse_lunge: { name: 'Deficit Reverse Lunge', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, quads' },
  band_glute_bridge: { name: 'Banded Glute Bridge', group: 'lower', cat: 'bodyweight', muscles: 'Glutes' },
  band_hip_thrust: { name: 'Banded Hip Thrust', group: 'lower', cat: 'bodyweight', muscles: 'Glutes' },
  band_lateral_walk: { name: 'Banded Lateral Walk', group: 'lower', cat: 'bodyweight', muscles: 'Glute medius' },
  band_kickback: { name: 'Banded Kickback', group: 'lower', cat: 'bodyweight', muscles: 'Glutes' },
  monster_walk: { name: 'Monster Walk', group: 'lower', cat: 'bodyweight', muscles: 'Glute medius' },
  clamshell: { name: 'Clamshell', group: 'lower', cat: 'bodyweight', muscles: 'Glute medius' },
  fire_hydrant: { name: 'Fire Hydrant', group: 'lower', cat: 'bodyweight', muscles: 'Glutes' },
  donkey_kick: { name: 'Donkey Kick', group: 'lower', cat: 'bodyweight', muscles: 'Glutes' },

  /* ---- QUADS ---- */
  backsquat_smith: { name: 'Smith Machine Squat', group: 'lower', cat: 'machine', muscles: 'Quads, glutes' },
  front_squat: { name: 'Front Squat', group: 'lower', cat: 'lowerCompound', muscles: 'Quads' },
  hack_squat: { name: 'Hack Squat (Machine)', group: 'lower', cat: 'machine', muscles: 'Quads' },
  pendulum_squat: { name: 'Pendulum Squat', group: 'lower', cat: 'machine', muscles: 'Quads' },
  belt_squat: { name: 'Belt Squat', group: 'lower', cat: 'machine', muscles: 'Quads, glutes' },
  db_split_squat: { name: 'Dumbbell Split Squat', group: 'lower', cat: 'dumbbell', muscles: 'Quads, glutes' },
  sissy_squat: { name: 'Sissy Squat', group: 'lower', cat: 'bodyweight', muscles: 'Quads' },
  cossack_squat: { name: 'Cossack Squat', group: 'lower', cat: 'bodyweight', muscles: 'Quads, adductors' },
  box_squat: { name: 'Box Squat', group: 'lower', cat: 'lowerCompound', muscles: 'Quads, glutes' },
  wall_sit: { name: 'Wall Sit', group: 'lower', cat: 'bodyweight', muscles: 'Quads' },
  single_leg_press: { name: 'Single-Leg Press', group: 'lower', cat: 'machine', muscles: 'Quads, glutes' },
  sumo_squat: { name: 'Sumo / Plié Squat', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, adductors' },
  smith_lunge: { name: 'Smith Machine Lunge', group: 'lower', cat: 'machine', muscles: 'Quads, glutes' },

  /* ---- HAMSTRINGS / POSTERIOR ---- */
  deadlift: { name: 'Conventional Deadlift', group: 'lower', cat: 'lowerCompound', muscles: 'Hamstrings, glutes, back' },
  trap_bar_deadlift: { name: 'Trap Bar Deadlift', group: 'lower', cat: 'lowerCompound', muscles: 'Hamstrings, glutes, quads' },
  stiff_leg_dl: { name: 'Stiff-Leg Deadlift', group: 'lower', cat: 'lowerCompound', muscles: 'Hamstrings' },
  good_morning: { name: 'Good Morning', group: 'lower', cat: 'lowerCompound', muscles: 'Hamstrings, low back' },
  ghr: { name: 'Glute-Ham Raise', group: 'lower', cat: 'bodyweight', muscles: 'Hamstrings, glutes' },
  kb_swing: { name: 'Kettlebell Swing', group: 'lower', cat: 'dumbbell', muscles: 'Glutes, hamstrings' },
  smith_rdl: { name: 'Smith Machine RDL', group: 'lower', cat: 'machine', muscles: 'Hamstrings, glutes' },

  /* ---- CALVES ---- */
  leg_press_calf: { name: 'Leg Press Calf Raise', group: 'lower', cat: 'machine', muscles: 'Calves' },
  donkey_calf: { name: 'Donkey Calf Raise', group: 'lower', cat: 'machine', muscles: 'Calves' },
  smith_calf: { name: 'Smith Machine Calf Raise', group: 'lower', cat: 'machine', muscles: 'Calves' },

  /* ---- BACK / LATS ---- */
  wide_pulldown: { name: 'Wide-Grip Lat Pulldown', group: 'upper', cat: 'machine', muscles: 'Lats' },
  close_pulldown: { name: 'Close-Grip Lat Pulldown', group: 'upper', cat: 'machine', muscles: 'Lats, biceps' },
  neutral_pulldown: { name: 'Neutral-Grip Pulldown', group: 'upper', cat: 'machine', muscles: 'Lats' },
  straight_arm_pulldown: { name: 'Straight-Arm Pulldown', group: 'upper', cat: 'machine', muscles: 'Lats' },
  chinup: { name: 'Chin-Up', group: 'upper', cat: 'bodyweight', muscles: 'Lats, biceps' },
  barbell_row: { name: 'Barbell Row', group: 'upper', cat: 'upper', muscles: 'Back' },
  pendlay_row: { name: 'Pendlay Row', group: 'upper', cat: 'upper', muscles: 'Back' },
  tbar_row: { name: 'T-Bar Row', group: 'upper', cat: 'machine', muscles: 'Back' },
  meadows_row: { name: 'Meadows Row', group: 'upper', cat: 'dumbbell', muscles: 'Back' },
  machine_row: { name: 'Machine Row', group: 'upper', cat: 'machine', muscles: 'Back' },
  smith_row: { name: 'Smith Machine Row', group: 'upper', cat: 'machine', muscles: 'Back' },
  inverted_row: { name: 'Inverted Row', group: 'upper', cat: 'bodyweight', muscles: 'Back' },
  seated_row_wide: { name: 'Wide-Grip Seated Row', group: 'upper', cat: 'machine', muscles: 'Upper back' },
  pullover_db: { name: 'Dumbbell Pullover', group: 'upper', cat: 'dumbbell', muscles: 'Lats, chest' },
  shrug_db: { name: 'Dumbbell Shrug', group: 'upper', cat: 'dumbbell', muscles: 'Traps' },
  shrug_bb: { name: 'Barbell Shrug', group: 'upper', cat: 'upper', muscles: 'Traps' },
  rack_pull: { name: 'Rack Pull', group: 'upper', cat: 'upper', muscles: 'Back, traps' },
  band_pullapart: { name: 'Band Pull-Apart', group: 'upper', cat: 'bodyweight', muscles: 'Upper back, rear delts' },

  /* ---- CHEST ---- */
  incline_bb_press: { name: 'Incline Barbell Press', group: 'upper', cat: 'upper', muscles: 'Upper chest' },
  decline_press: { name: 'Decline Press', group: 'upper', cat: 'upper', muscles: 'Lower chest' },
  flat_db_press: { name: 'Flat Dumbbell Press', group: 'upper', cat: 'dumbbell', muscles: 'Chest' },
  smith_bench: { name: 'Smith Machine Bench Press', group: 'upper', cat: 'machine', muscles: 'Chest' },
  cable_fly: { name: 'Cable Fly', group: 'upper', cat: 'machine', muscles: 'Chest' },
  incline_cable_fly: { name: 'Incline Cable Fly', group: 'upper', cat: 'machine', muscles: 'Upper chest' },
  chest_dip: { name: 'Chest Dip', group: 'upper', cat: 'bodyweight', muscles: 'Chest, triceps' },
  close_grip_bench: { name: 'Close-Grip Bench Press', group: 'upper', cat: 'upper', muscles: 'Triceps, chest' },
  incline_pushup: { name: 'Incline Push-Up', group: 'upper', cat: 'bodyweight', muscles: 'Chest' },

  /* ---- SHOULDERS ---- */
  smith_ohp: { name: 'Smith Machine Shoulder Press', group: 'upper', cat: 'machine', muscles: 'Shoulders' },
  seated_db_press: { name: 'Seated Dumbbell Press', group: 'upper', cat: 'dumbbell', muscles: 'Shoulders' },
  cable_lat_raise: { name: 'Cable Lateral Raise', group: 'upper', cat: 'machine', muscles: 'Side delts' },
  lean_away_lat_raise: { name: 'Lean-Away Lateral Raise', group: 'upper', cat: 'dumbbell', muscles: 'Side delts' },
  front_raise: { name: 'Front Raise', group: 'upper', cat: 'dumbbell', muscles: 'Front delts' },
  upright_row: { name: 'Upright Row', group: 'upper', cat: 'dumbbell', muscles: 'Side delts, traps' },
  cable_rear_fly: { name: 'Cable Rear Delt Fly', group: 'upper', cat: 'machine', muscles: 'Rear delts' },
  band_face_pull: { name: 'Band Face Pull', group: 'upper', cat: 'bodyweight', muscles: 'Rear delts' },
  landmine_press: { name: 'Landmine Press', group: 'upper', cat: 'dumbbell', muscles: 'Shoulders, chest' },
  pike_pushup: { name: 'Pike Push-Up', group: 'upper', cat: 'bodyweight', muscles: 'Shoulders' },

  /* ---- BICEPS ---- */
  ez_curl: { name: 'EZ-Bar Curl', group: 'upper', cat: 'upper', muscles: 'Biceps' },
  incline_db_curl: { name: 'Incline Dumbbell Curl', group: 'upper', cat: 'dumbbell', muscles: 'Biceps' },
  cable_curl: { name: 'Cable Curl', group: 'upper', cat: 'machine', muscles: 'Biceps' },
  bayesian_curl: { name: 'Bayesian Cable Curl', group: 'upper', cat: 'machine', muscles: 'Biceps' },
  concentration_curl: { name: 'Concentration Curl', group: 'upper', cat: 'dumbbell', muscles: 'Biceps' },
  spider_curl: { name: 'Spider Curl', group: 'upper', cat: 'dumbbell', muscles: 'Biceps' },
  reverse_curl: { name: 'Reverse Curl', group: 'upper', cat: 'dumbbell', muscles: 'Forearms, biceps' },
  machine_curl: { name: 'Machine Curl', group: 'upper', cat: 'machine', muscles: 'Biceps' },

  /* ---- TRICEPS ---- */
  rope_pushdown: { name: 'Rope Pushdown', group: 'upper', cat: 'machine', muscles: 'Triceps' },
  overhead_cable_ext: { name: 'Overhead Cable Extension', group: 'upper', cat: 'machine', muscles: 'Triceps' },
  skullcrusher: { name: 'Skullcrusher', group: 'upper', cat: 'upper', muscles: 'Triceps' },
  db_overhead_ext: { name: 'Dumbbell Overhead Extension', group: 'upper', cat: 'dumbbell', muscles: 'Triceps' },
  triceps_kickback: { name: 'Triceps Kickback', group: 'upper', cat: 'dumbbell', muscles: 'Triceps' },
  triceps_dip: { name: 'Triceps Dip', group: 'upper', cat: 'bodyweight', muscles: 'Triceps' },
  close_grip_pushup: { name: 'Close-Grip Push-Up', group: 'upper', cat: 'bodyweight', muscles: 'Triceps' },

  /* ---- FOREARMS / CARRIES ---- */
  wrist_curl: { name: 'Wrist Curl', group: 'upper', cat: 'dumbbell', muscles: 'Forearms' },
  reverse_wrist_curl: { name: 'Reverse Wrist Curl', group: 'upper', cat: 'dumbbell', muscles: 'Forearms' },
  farmer_carry: { name: 'Farmer Carry', group: 'upper', cat: 'dumbbell', muscles: 'Forearms, full body' },

  /* ---- CORE / ABS ---- */
  hanging_leg_raise: { name: 'Hanging Leg Raise', group: 'core', cat: 'core', muscles: 'Lower abs' },
  lying_leg_raise: { name: 'Lying Leg Raise', group: 'core', cat: 'core', muscles: 'Lower abs' },
  cable_woodchop: { name: 'Cable Woodchop', group: 'core', cat: 'machine', muscles: 'Obliques' },
  ab_wheel: { name: 'Ab Wheel Rollout', group: 'core', cat: 'bodyweight', muscles: 'Core' },
  side_plank: { name: 'Side Plank', group: 'core', cat: 'core', muscles: 'Obliques' },
  bicycle_crunch: { name: 'Bicycle Crunch', group: 'core', cat: 'core', muscles: 'Abs, obliques' },
  mountain_climber: { name: 'Mountain Climber', group: 'core', cat: 'core', muscles: 'Core' },
  v_up: { name: 'V-Up', group: 'core', cat: 'core', muscles: 'Abs' },
  flutter_kick: { name: 'Flutter Kick', group: 'core', cat: 'core', muscles: 'Lower abs' },
  russian_twist: { name: 'Russian Twist', group: 'core', cat: 'core', muscles: 'Obliques' },
  decline_situp: { name: 'Decline Sit-Up', group: 'core', cat: 'core', muscles: 'Abs' },
  toe_touch: { name: 'Toe Touch Crunch', group: 'core', cat: 'core', muscles: 'Upper abs' },
  hollow_hold: { name: 'Hollow Body Hold', group: 'core', cat: 'core', muscles: 'Core' },
  stir_the_pot: { name: 'Stir-the-Pot', group: 'core', cat: 'core', muscles: 'Core' },
  weighted_crunch: { name: 'Weighted Crunch', group: 'core', cat: 'core', muscles: 'Abs' },
});
