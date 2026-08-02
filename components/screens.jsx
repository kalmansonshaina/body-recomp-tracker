'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Icon, Reveal, Tap, Orb, Ring, Bar, Pill, Sparkline, WeightChart, Rec, cx } from './ui';
import {
  WeightSheet, StepsSheet, CheckinSheet, ActivitySheet, CardioSheet, AbsSheet,
  MeasureSheet, PhotoSheet, PhotoViewSheet, SuppQuickSheet, SuppManageSheet,
  TargetsSheet, ProfileSheet, ExMenuSheet, ExHistorySheet, LibrarySheet, ReviewSheet, FinishSummary,
  ExercisePickerSheet, EditWorkoutSheet,
} from './sheets';
import {
  today, uid, round1, fmtDay, fmtShort, wt, defaultState,
  exDef, getWorkouts, workoutById, findItem, WARMUPS, COOLDOWNS, DEFAULT_WORKOUTS,
  ACTIVITY_TYPES, CARDIO_TYPES, MFIELDS,
  weekBundle, weekRotation, weekStatus, weekDates, startOfWeek,
  recompScore, trendSummary, weighIns, rollingAvg, lastPerf, bestSet, allPerf, progression,
} from '@/lib/data';
const AppBar = ({ title, sub, right }) => (
  <header className="appbar"><div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div><div className="date">{right}</div></header>
);

/* ========================================================================= */
/* HOME                                                                      */
/* ========================================================================= */
function InstallHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (ios && !standalone && !localStorage.getItem('brt.installDismiss')) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <Reveal className="install">
      <Icon name="plus" />
      <div className="small"><b>Add to your Home Screen</b><br />Tap the Share icon, then <b>Add to Home Screen</b> — it opens full-screen and works offline.</div>
      <button className="x" onClick={() => { localStorage.setItem('brt.installDismiss', '1'); setShow(false); }}>×</button>
    </Reveal>
  );
}

export function Home({ go }) {
  const { S, active, setActive } = useStore();
  const rot = weekRotation(S);
  const sc = recompScore(S);
  const first = S.profile.name ? S.profile.name.split(' ')[0].toLowerCase() : null;
  const startNext = () => {
    const id = rot.next?.id;
    if (!id) { go('gym'); return; }
    if (!active || active.type !== id) setActive(makeActive(S, id));
    go('gym');
  };
  const leadDesc = rot.next ? `${rot.next.name.toLowerCase()} — ${rot.next.tag.toLowerCase()}` : 'rotation complete — extra session';
  const leadMeta = rot.next ? `${rot.next.items.length} exercises · warm-up included` : `recomp score ${sc.total}/100 this week`;
  const cats = [
    { id: 'dashboard', label: 'dashboard' },
    { id: 'movement', label: 'movement' },
    { id: 'progress', label: 'progress' },
    { id: 'more', label: 'more' },
  ];
  return (
    <div className="hero">
      <div className="hero-orb"><motion.div className="hero-orb-in" animate={{ scale: [0.97, 1.05, 0.97] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} /></div>
      <div className="hero-head">for you<span>{first ? ` · hi ${first}` : ' · today'}</span></div>
      <div className="hero-body">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}>
          <span className="hero-kicker">recomp score {sc.total}/100</span>
          <button className="hero-word lead" onClick={() => go('gym')}>gym</button>
          <div className="hero-desc">{leadDesc}</div>
          <div className="hero-meta">{leadMeta}</div>
        </motion.div>
        <div className="hero-cats">
          {cats.map((c, i) => (
            <motion.button key={c.id} className="hero-word" onClick={() => go(c.id)}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.06, duration: 0.4 }}>
              {c.label}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="hero-foot">
        <button className="hero-dots" onClick={() => go('more')}>…</button>
        <motion.button whileTap={{ scale: 0.96 }} className="hero-start" onClick={startNext}>start <span className="arw"><Icon name="arrow" /></span></motion.button>
      </div>
    </div>
  );
}

export function Dashboard({ go }) {
  const { S, openSheet } = useStore();
  const sc = recompScore(S);
  const status = weekStatus(S, sc.bundle);
  const rot = weekRotation(S);
  const b = sc.bundle;
  const d = S.daily[today()] || {};
  const doneToday = S.sessions.some((s) => s.date === today());
  const pyToday = S.activities.some((a) => a.date === today() && (ACTIVITY_TYPES.find((t) => t.id === a.type) || {}).counts);
  const w = weighIns(S);
  const t = trendSummary(S);
  const dots = weekDates(b.monday).map((dd) => S.daily[dd] && +S.daily[dd].steps >= S.profile.stepTarget);
  const suppToday = (() => { const log = S.suppLog[today()] || {}; const a = S.supplements.filter((x) => x.active); return { taken: a.filter((x) => log[x.id]).length, total: a.length }; })();

  return (<>
    <AppBar title="Dashboard" sub={`Hi${S.profile.name ? ', ' + S.profile.name.split(' ')[0] : ''} · consistency over perfection`} right={fmtDay(today())} />
    <main className="screen">
      <InstallHint />
      <div className="orb-wrap">
        <Reveal className="orb-status"><Pill tone={status.pill}>{status.label}</Pill></Reveal>
        <Orb total={sc.total} />
      </div>
      <Reveal delay={0.05} className="card">
        <div className="breakdown">
          {sc.parts.map((p) => (
            <div key={p.key} className="bd-item"><span className="em">{p.icon}</span>
              <div className="bd-main"><div className="t">{p.key} · {p.got}/{p.max}</div><Bar pct={p.got / p.max} /></div>
            </div>
          ))}
        </div>
        <div className="hint center" style={{ marginTop: 15 }}>Focused on the habits you control — not whether the scale moved overnight.</div>
      </Reveal>

      <Reveal delay={0.1} className="card">
        <div className="card-title"><h2>Next workout</h2><Pill tone="accent">{rot.count}/{S.profile.strengthTarget} this week</Pill></div>
        {rot.next ? (<>
          <div className="metric">
            <div style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}><Icon name="dumbbell" /></div>
            <div className="lbl" style={{ marginLeft: 12 }}><div className="t" style={{ fontSize: 17 }}>{rot.next.name}</div><div className="s">{rot.next.tag} · {rot.next.items.length} exercises</div></div>
          </div>
          <div className="spacer" />
          <StartButton go={go} id={rot.next.id} label={`Start ${rot.next.name}`} />
        </>) : (<>
          <div className="hint">You&apos;ve completed the full rotation. Extra sessions are welcome, or rest — it resets Monday.</div>
          <div className="spacer" /><button className="btn" onClick={() => go('gym')}>Log an extra workout</button>
        </>)}
      </Reveal>

      <Reveal delay={0.15} className="card">
        <div className="card-title"><h2>Today</h2><span className="muted small">{fmtShort(today())}</span></div>
        <div className="tiles">
          <div className="tile g-blue"><div className="k"><Icon name="scale" /> Weight</div><div className="v">{d.weight ? round1(d.weight) : '—'}<small> {d.weight ? S.profile.weightUnit : ''}</small></div></div>
          <div className="tile g-sage"><div className="k"><Icon name="walk" /> Steps</div><div className="v">{d.steps ? (+d.steps).toLocaleString() : '—'}</div></div>
        </div>
        <div className="chips" style={{ marginTop: 12 }}>
          <Tap className={cx('chip', doneToday && 'sage on')} onClick={() => go('gym')}>💪 Strength {doneToday && '✓'}</Tap>
          <Tap className={cx('chip', pyToday && 'sage on')} onClick={() => openSheet(<ActivitySheet />)}>🧘 Pilates/Yoga {pyToday && '✓'}</Tap>
          <Tap className="chip" onClick={() => openSheet(<CardioSheet mode="standalone" />)}>🏃 Cardio</Tap>
          <Tap className={cx('chip', d.ab && 'sage on')} onClick={() => openSheet(<AbsSheet />)}>🔥 Abs {d.ab && '✓'}</Tap>
        </div>
        <div className="hairline" />
        <div className="btn-row">
          <button className="btn sm" onClick={() => openSheet(<WeightSheet />)}><Icon name="scale" /> Weight</button>
          <button className="btn sm" onClick={() => openSheet(<StepsSheet />)}><Icon name="walk" /> Steps</button>
          <button className="btn sm" onClick={() => openSheet(<SuppQuickSheet />)}>❤️ {suppToday.total ? `${suppToday.taken}/${suppToday.total}` : 'Supps'}</button>
        </div>
        <div className="spacer" /><button className="btn ghost sm block" onClick={() => openSheet(<CheckinSheet />)}><Icon name="clip" /> Full daily check-in</button>
      </Reveal>

      <Reveal delay={0.2} className="card">
        <div className="card-title"><h2>This week</h2><span className="muted small">{fmtShort(b.monday)}–{fmtShort(b.dates[6])}</span></div>
        <div className="metric"><div className="lbl"><div className="t">Strength workouts</div><Bar pct={b.sessions.length / S.profile.strengthTarget} /></div><div className="val">{b.sessions.length}/{S.profile.strengthTarget}</div></div>
        <div className="hairline" />
        <div className="metric"><div className="lbl"><div className="t">Pilates / Yoga</div><Bar pct={b.pilatesYoga.length / S.profile.pilatesTarget} klass="blue" /></div><div className="val">{b.pilatesYoga.length}/{S.profile.pilatesTarget}</div></div>
        <div className="hairline" />
        <div className="metric"><div className="lbl"><div className="t">Step-goal days</div><div className="dots">{dots.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}</div></div><div className="val">{b.stepDays}/7</div></div>
        <div className="hairline" />
        <div className="tiles">
          <div className="tile g-cyan"><div className="k"><Icon name="stairs" /> StairMaster</div><div className="v">{b.stair}<small> sess</small></div></div>
          <div className="tile g-blue"><div className="k"><Icon name="walk" /> Treadmill</div><div className="v">{b.tread}<small> sess</small></div></div>
          <div className="tile g-pink"><div className="k">❤️ Supplements</div><div className="v">{b.supp.pct}<small>%</small></div></div>
          <div className="tile g-gold"><div className="k"><Icon name="scale" /> Avg weight</div><div className="v">{b.avgWeight ? round1(b.avgWeight) : '—'}<small> {b.avgWeight ? S.profile.weightUnit : ''}</small></div></div>
        </div>
      </Reveal>

      {w.length >= 2 && (
        <Reveal delay={0.25} className="card">
          <div className="card-title"><h2>Weight trend</h2>{t.delta != null && <Pill tone={t.delta <= 0 ? 'sage' : 'muted'}>{t.delta <= 0 ? '▼' : '▲'} {Math.abs(t.delta)} {S.profile.weightUnit}/wk</Pill>}</div>
          <Sparkline values={w.map((p) => p.w)} />
          <div className="metric" style={{ marginTop: 10 }}><div className="lbl"><div className="s">7-day average</div></div><div className="val">{t.cur != null ? wt(S, t.cur) : '—'}</div></div>
        </Reveal>
      )}
    </main>
  </>);
}

function StartButton({ go, id, label }) {
  const { S, active, setActive } = useStore();
  const doStart = () => {
    if (active && active.type !== id && !confirm('Discard your in-progress workout and start a new one?')) return;
    if (!active || active.type !== id) setActive(makeActive(S, id));
    go('gym');
  };
  return <motion.button whileTap={{ scale: 0.97 }} className="btn primary block" onClick={doStart}><Icon name="plus" /> {label}</motion.button>;
}

function makeActive(S, type) {
  const w = workoutById(S, type);
  return {
    id: uid(), date: today(), type, name: w.name, group: w.group || 'lower',
    exercises: w.items.map((it) => {
      const last = lastPerf(S, it.key);
      const prevW = last ? Math.max(...last.ex.sets.filter((s) => s.reps).map((s) => +s.weight || 0)) : (S.exState[it.key]?.weight || '');
      return { key: it.key, min: it.min, max: it.max, perSide: !!it.perSide, prescribed: it.sets || 3,
        sets: Array.from({ length: it.sets || 3 }, () => ({ weight: prevW || '', reps: '' })), rir: 2, pain: 'none', note: '' };
    }),
    cardio: null, ab: false, warmup: false, cooldown: false, note: '',
  };
}
function addExerciseToActive(S, setActive, key) {
  setActive((a) => {
    const last = lastPerf(S, key);
    const prevW = last ? Math.max(...last.ex.sets.filter((s) => s.reps).map((s) => +s.weight || 0)) : (S.exState[key]?.weight || '');
    a.exercises.push({ key, min: 8, max: 10, perSide: false, prescribed: 3, sets: Array.from({ length: 3 }, () => ({ weight: prevW || '', reps: '' })), rir: 2, pain: 'none', note: '' });
    return a;
  });
}

/* ========================================================================= */
/* WORKOUT                                                                   */
/* ========================================================================= */
export function Workout({ go }) {
  const { S, active } = useStore();
  return (<>
    <AppBar title={active ? active.name : 'Gym'} sub={active ? 'Log your sets' : 'Pick a session'} right={fmtDay(today())} />
    <main className="screen">{active ? <ActiveWorkout go={go} /> : <Picker go={go} />}</main>
  </>);
}

function Picker({ go }) {
  const { S, active, setActive, openSheet, update } = useStore();
  const rot = weekRotation(S);
  const workouts = getWorkouts(S);
  const start = (id) => {
    if (active && active.type !== id && !confirm('Discard your in-progress workout and start a new one?')) return;
    if (!active || active.type !== id) setActive(makeActive(S, id));
    go('gym');
  };
  const edit = (e, id) => { e.stopPropagation(); openSheet(<EditWorkoutSheet workoutId={id} />); };
  const newWorkout = () => {
    const id = 'w_' + uid();
    update((s) => { const ws = s.workouts || (s.workouts = structuredClone(DEFAULT_WORKOUTS)); ws.push({ id, name: 'New Workout', tag: 'Custom', group: 'lower', items: [] }); });
    openSheet(<EditWorkoutSheet workoutId={id} />);
  };
  return (<>
    <div className="section-title">Your workouts · tap to start, pencil to edit</div>
    {workouts.map((w, i) => {
      const done = rot.done.has(w.id);
      const isNext = rot.next && rot.next.id === w.id;
      return (
        <Reveal key={w.id} delay={i * 0.05}>
          <motion.div whileTap={{ scale: 0.985 }} className="card tight tap" style={{ display: 'flex', alignItems: 'center', gap: 12, border: isNext ? '1.5px solid var(--accent)' : undefined }} onClick={() => start(w.id)}>
            <div className="ic" style={{ background: done ? 'var(--sage-soft)' : 'var(--accent-soft)', color: done ? 'var(--sage)' : 'var(--accent-ink)', width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center' }}><Icon name={done ? 'check' : 'dumbbell'} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800 }}>{w.name} {isNext && <Pill tone="accent">Next</Pill>}</div><div className="small muted">{w.tag} · {w.items.length} exercises</div></div>
            <button className="btn sm ghost" style={{ padding: '7px 10px' }} onClick={(e) => edit(e, w.id)}><Icon name="edit" /></button>
          </motion.div>
        </Reveal>
      );
    })}
    <button className="btn ghost block" style={{ marginTop: 4 }} onClick={newWorkout}><Icon name="plus" /> New workout</button>
    <div className="hint center" style={{ marginTop: 10 }}>No fixed days — do them in any order that fits your week. Swap or add exercises anytime; your history stays with each exercise.</div>
  </>);
}

function RoutineCard({ routine, title, done, onToggle, tone }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: open ? 12 : 0 }}>
        <h2 style={{ fontSize: 15 }}>{routine.title} <span className="muted small" style={{ fontWeight: 600 }}>· {routine.time}</span></h2>
        <button className="btn sm ghost" style={{ padding: '6px 10px' }} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>
      </div>
      {open && (
        <div style={{ marginBottom: 12 }}>
          {routine.steps.map((s, i) => (
            <div key={i} className="row" style={{ padding: '9px 0' }}><div className="n" style={{ width: 22, fontWeight: 800, color: 'var(--muted)' }}>{i + 1}</div><div className="main"><div className="t" style={{ fontSize: 14 }}>{s.name}</div><div className="s">{s.detail}</div></div></div>
          ))}
          {routine.note && <div className="hint" style={{ marginTop: 8 }}>{routine.note}</div>}
        </div>
      )}
      <div className={cx('check', done && 'on')} style={{ borderBottom: 0, padding: '4px 0 0' }} onClick={onToggle}><div className="box"><Icon name="check" /></div><div className="lbl">{title}</div></div>
    </div>
  );
}

function ActiveWorkout({ go }) {
  const { S, active, setActive, update, openSheet, closeSheet, toast } = useStore();
  const doneCount = active.exercises.filter((e) => e.sets.some((s) => s.reps)).length;
  const grp = active.group || 'lower';
  const warm = WARMUPS[grp], cool = COOLDOWNS[grp];

  const setSet = (ei, si, field, val) => setActive((a) => { a.exercises[ei].sets[si][field] = val; return a; });
  const addSet = (ei) => setActive((a) => { const arr = a.exercises[ei].sets; arr.push({ weight: arr[arr.length - 1]?.weight || '', reps: '' }); return a; });
  const delSet = (ei) => setActive((a) => { if (a.exercises[ei].sets.length > 1) a.exercises[ei].sets.pop(); return a; });
  const toggleDone = (ei, si) => setActive((a) => { a.exercises[ei].sets[si].done = !a.exercises[ei].sets[si].done; return a; });
  const setRir = (ei, v) => setActive((a) => { a.exercises[ei].rir = v; return a; });

  const cancel = () => { if (confirm('Discard this workout? Nothing will be saved.')) setActive(null); };
  const finish = () => {
    const exs = active.exercises.map((e) => ({ key: e.key, rir: e.rir, pain: e.pain, note: e.note,
      sets: e.sets.filter((s) => s.reps !== '' || s.weight !== '').map((s) => ({ weight: s.weight === '' ? null : +s.weight, reps: s.reps === '' ? null : +s.reps, done: !!s.done })) }));
    if (!exs.some((e) => e.sets.some((s) => s.reps)) && !confirm('No sets logged yet — save this workout anyway?')) return;
    const session = { id: active.id, date: active.date, type: active.type, name: active.name, group: grp, exercises: exs, ab: !!active.ab, cardio: active.cardio || null, warmup: !!active.warmup, cooldown: !!active.cooldown, note: active.note || '' };
    update((s) => {
      s.sessions.push(session);
      exs.forEach((e) => { const mw = Math.max(0, ...e.sets.map((x) => +x.weight || 0)); if (mw) s.exState[e.key] = { weight: mw }; });
      if (session.cardio) s.cardio.push({ id: uid(), date: session.date, ...session.cardio });
      if (session.ab) (s.daily[session.date] ||= {}).ab = true;
    });
    setActive(null); go('home'); openSheet(<FinishSummary session={session} />);
  };

  const rirLabels = [['0', 'failure'], ['1', '1 left'], ['2', 'ideal'], ['3', '3 left'], ['4', '4+']];

  return (<>
    <div className="card tight" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="ic" style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center' }}><Icon name="dumbbell" /></div>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{active.name}</div><div className="small muted">{doneCount}/{active.exercises.length} exercises logged</div></div>
      <button className="btn sm ghost" onClick={cancel}>Cancel</button>
    </div>

    {warm && <RoutineCard routine={warm} title="Warm-up completed" done={active.warmup} onToggle={() => setActive((a) => { a.warmup = !a.warmup; return a; })} />}

    {active.exercises.map((ex, ei) => {
      const def = exDef(S, ex.key);
      const item = { key: ex.key, min: ex.min, max: ex.max };
      const logged = ex.sets.some((s) => s.reps);
      const prog = logged ? progression(S, item, { sets: ex.sets, rir: ex.rir, pain: ex.pain }) : progression(S, item);
      const last = lastPerf(S, ex.key);
      const lastTxt = last ? `Last: ${last.ex.sets.filter((s) => s.reps).map((s) => `${s.weight || '–'}×${s.reps}`).join(', ')}` : 'No history yet';
      return (
        <Reveal key={ei} delay={0.03 * ei} className="card">
          <div className="card-title" style={{ alignItems: 'flex-start' }}>
            <div><h2 style={{ fontSize: 16 }}>{def.name}</h2><div className="small muted">{def.muscles} · target {ex.prescribed} × {ex.min}–{ex.max}{ex.perSide ? ' /side' : ''}</div></div>
            <button className="btn sm ghost" style={{ padding: '6px 9px' }} onClick={() => openSheet(<ExMenuSheet idx={ei} />)}>⋯</button>
          </div>
          <div className="col-h"><span>Set</span><span>Weight ({S.profile.weightUnit})</span><span>Reps</span><span>✓</span></div>
          {ex.sets.map((st, si) => (
            <div key={si} className="setrow">
              <div className="n">{si + 1}</div>
              <input className="mini" type="number" inputMode="decimal" placeholder="—" value={st.weight} onChange={(e) => setSet(ei, si, 'weight', e.target.value)} />
              <input className="mini" type="number" inputMode="numeric" placeholder="—" value={st.reps} onChange={(e) => setSet(ei, si, 'reps', e.target.value)} />
              <button className={cx('done', st.done && 'on')} onClick={() => toggleDone(ei, si)}><Icon name="check" /></button>
            </div>
          ))}
          <div className="btn-row" style={{ margin: '6px 0 12px' }}>
            <button className="btn sm ghost" onClick={() => addSet(ei)}><Icon name="plus" /> Set</button>
            <button className="btn sm ghost" onClick={() => delSet(ei)}>– Set</button>
          </div>
          <div className="small muted" style={{ marginBottom: 6 }}>Effort — how many reps left in the tank?</div>
          <div className="chips">{rirLabels.map(([v, l]) => <button key={v} className={cx('chip', String(ex.rir) === v && 'on')} onClick={() => setRir(ei, +v)}>{l}</button>)}</div>
          <div className="small muted" style={{ margin: '8px 0 10px' }}>{lastTxt}</div>
          <Rec prog={prog} />
        </Reveal>
      );
    })}

    <button className="btn ghost block" style={{ marginBottom: 15 }} onClick={() => openSheet(<ExercisePickerSheet title="Add exercise to today" onPick={(k) => { addExerciseToActive(S, setActive, k); closeSheet(); }} />)}><Icon name="plus" /> Add exercise</button>

    {cool && <RoutineCard routine={cool} title="Stretching completed" done={active.cooldown} onToggle={() => setActive((a) => { a.cooldown = !a.cooldown; return a; })} />}

    <div className="card">
      <div className="card-title"><h2 style={{ fontSize: 15 }}>Add-ons</h2></div>
      <div className={cx('check', active.ab && 'on')} onClick={() => setActive((a) => { a.ab = !a.ab; return a; })}><div className="box"><Icon name="check" /></div><div className="lbl">Ab circuit</div><div className="sub">optional</div></div>
      <div className={cx('check', active.cardio && 'on')} onClick={() => openSheet(<CardioSheet mode="active" />)}><div className="box"><Icon name="check" /></div><div className="lbl">Cardio {active.cardio && `— ${(CARDIO_TYPES.find((c) => c.id === active.cardio.type) || {}).name} ${active.cardio.duration || ''}${active.cardio.duration ? 'min' : ''}`}</div><div className="sub">StairMaster / Treadmill · tap to add</div></div>
      <div className="field" style={{ marginTop: 12 }}><label>Session notes</label><textarea value={active.note} onChange={(e) => setActive((a) => { a.note = e.target.value; return a; })} placeholder="How did it feel?" /></div>
    </div>
    <motion.button whileTap={{ scale: 0.98 }} className="btn primary block" style={{ marginBottom: 8 }} onClick={finish}><Icon name="check" /> Finish &amp; save workout</motion.button>
  </>);
}

/* ========================================================================= */
/* LOG                                                                       */
/* ========================================================================= */
export function Log({ go }) {
  const { S, openSheet, update } = useStore();
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
  const toggleAb = () => update((s) => { const dd = (s.daily[today()] ||= {}); dd.ab = !dd.ab; if (!dd.ab) delete dd.abRounds; });

  const Item = ({ on, label, sub, onClick }) => (
    <div className={cx('check', on && 'on')} onClick={onClick}><div className="box"><Icon name="check" /></div><div className="lbl">{label}</div><div className="sub">{sub}</div></div>
  );

  const groups = suppGroups(S);
  const suppTaken = active.filter((s) => log[s.id]).length;
  const toggleSupp = (id) => update((s) => { const dd = (s.suppLog[today()] ||= {}); if (dd[id]) delete dd[id]; else dd[id] = true; });
  const markAll = () => update((s) => { const dd = (s.suppLog[today()] = {}); s.supplements.filter((x) => x.active).forEach((x) => (dd[x.id] = true)); });
  const clearAll = () => update((s) => { s.suppLog[today()] = {}; });

  return (<>
    <AppBar title="Movement" sub="Pilates · cardio · steps · supplements" right={fmtDay(today())} />
    <main className="screen">
      <Reveal className="card">
        <div className="card-title"><h2>Today&apos;s checklist</h2><span className="muted small">{fmtShort(today())}</span></div>
        <Item on={strengthToday} label="Strength workout" sub={strengthToday ? S.sessions.filter((s) => s.date === today()).map((s) => s.name).join(', ') : 'tap to start'} onClick={() => go('gym')} />
        <Item on={pil} label="Pilates" sub={pil ? 'logged' : 'tap to add'} onClick={() => openSheet(<ActivitySheet preset="pilates" />)} />
        <Item on={yog} label="Yoga" sub={yog ? 'logged' : 'tap to add'} onClick={() => openSheet(<ActivitySheet preset="yoga" />)} />
        <Item on={!!d.ab} label="Ab circuit" sub={d.ab ? `${d.abRounds || ''} ${d.abRounds ? 'rounds' : 'done'}` : 'optional'} onClick={toggleAb} />
        <Item on={stair} label="StairMaster" sub={stair ? 'logged' : 'tap to add'} onClick={() => openSheet(<CardioSheet mode="standalone" preset="stairmaster" />)} />
        <Item on={tread} label="Treadmill" sub={tread ? 'logged' : 'tap to add'} onClick={() => openSheet(<CardioSheet mode="standalone" preset="treadmill" />)} />
        <Item on={!!stepHit} label="Hit step goal" sub={d.steps ? `${(+d.steps).toLocaleString()} / ${S.profile.stepTarget.toLocaleString()}` : 'tap to log steps'} onClick={() => openSheet(<StepsSheet />)} />
        <Item on={!!suppDone} label="All supplements" sub={active.length ? `${suppTaken}/${active.length} taken` : 'none set'} onClick={() => openSheet(<SuppQuickSheet />)} />
      </Reveal>

      <motion.button whileTap={{ scale: 0.98 }} className="btn primary block" style={{ marginBottom: 15 }} onClick={() => openSheet(<CheckinSheet />)}><Icon name="clip" /> Full daily check-in</motion.button>

      <Reveal delay={0.05} className="card">
        <div className="card-title"><h2>Supplements</h2><Pill tone={active.length && suppTaken === active.length ? 'sage' : 'muted'}>{suppTaken}/{active.length}</Pill></div>
        {active.length ? Object.keys(groups).map((tm) => (
          <div key={tm}>
            <div className="small muted" style={{ margin: '6px 2px 2px', fontWeight: 800 }}>{tm}</div>
            {groups[tm].map((s) => (
              <div key={s.id} className={cx('check', log[s.id] && 'on')} onClick={() => toggleSupp(s.id)}><div className="box"><Icon name="check" /></div><div className="lbl">{s.name}{s.dose && <span className="sub"> {s.dose}</span>}</div></div>
            ))}
          </div>
        )) : <div className="empty small">No supplements yet. Add some in More → Manage supplements.</div>}
        {active.length > 0 && <div className="btn-row" style={{ marginTop: 12 }}><button className="btn sm" onClick={markAll}>Mark all</button><button className="btn sm ghost" onClick={clearAll}>Clear</button><button className="btn sm ghost" onClick={() => openSheet(<SuppManageSheet />)}><Icon name="gear" /></button></div>}
      </Reveal>

      <Reveal delay={0.1} className="card">
        <div className="card-title"><h2>Add movement</h2></div>
        <div className="btn-row" style={{ marginBottom: 8 }}>
          <button className="btn sm" onClick={() => openSheet(<ActivitySheet />)}><Icon name="yoga" /> Pilates / Yoga</button>
          <button className="btn sm" onClick={() => openSheet(<CardioSheet mode="standalone" />)}><Icon name="stairs" /> Cardio</button>
        </div>
        <button className="btn sm ghost block" onClick={() => openSheet(<AbsSheet />)}><Icon name="flame" /> Ab circuit</button>
      </Reveal>

      <Reveal delay={0.15} className="card"><div className="card-title"><h2>This week</h2></div><WeekActivity /></Reveal>
    </main>
  </>);
}
function suppGroups(S) {
  const order = { Morning: 0, Afternoon: 1, Evening: 2, Anytime: 3 };
  const g = {};
  S.supplements.filter((s) => s.active).sort((a, b) => (order[a.time] - order[b.time]) || (a.order - b.order)).forEach((s) => { (g[s.time || 'Anytime'] ||= []).push(s); });
  return g;
}
function WeekActivity() {
  const { S } = useStore();
  const b = weekBundle(S);
  const rows = [];
  b.acts.forEach((a) => rows.push({ ...a, kind: 'act' }));
  b.cardio.forEach((c) => rows.push({ ...c, kind: 'cardio' }));
  b.sessions.forEach((s) => rows.push({ date: s.date, name: s.name, kind: 'strength' }));
  rows.sort((a, b2) => (a.date < b2.date ? 1 : -1));
  if (!rows.length) return <div className="empty small">Nothing logged this week yet.</div>;
  return rows.map((r, i) => {
    let icon = 'yoga', t = '', s = fmtShort(r.date);
    if (r.kind === 'strength') { icon = 'dumbbell'; t = r.name; s = 'Strength · ' + s; }
    else if (r.kind === 'cardio') { icon = r.type === 'stairmaster' ? 'stairs' : 'walk'; t = (CARDIO_TYPES.find((c) => c.id === r.type) || {}).name; s = `${r.duration ? r.duration + ' min · ' : ''}${s}`; }
    else { icon = 'yoga'; t = (ACTIVITY_TYPES.find((x) => x.id === r.type) || {}).name; s = `${r.duration ? r.duration + ' min · ' : ''}${s}`; }
    return <div key={i} className="row"><div className="ic"><Icon name={icon} /></div><div className="main"><div className="t">{t}</div><div className="s">{s}</div></div></div>;
  });
}

/* ========================================================================= */
/* PROGRESS                                                                  */
/* ========================================================================= */
const PROG_TABS = [['weight', 'Weight'], ['measure', 'Measure'], ['strength', 'Strength'], ['photos', 'Photos']];
export function Progress() {
  const [tab, setTab] = useState('weight');
  const Body = { weight: ProgWeight, measure: ProgMeasure, strength: ProgStrength, photos: ProgPhotos }[tab];
  return (<>
    <AppBar title="Progress" sub="Change over time" right={fmtDay(today())} />
    <main className="screen">
      <div className="seg" style={{ marginBottom: 14 }}>{PROG_TABS.map(([id, l]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>)}</div>
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><Body /></motion.div>
    </main>
  </>);
}
function ProgWeight() {
  const { S, openSheet } = useStore();
  const w = weighIns(S);
  const t = trendSummary(S);
  if (!w.length) return <div className="empty"><span className="em">⚖️</span>No weigh-ins yet.<div className="spacer" /><button className="btn sm" onClick={() => openSheet(<WeightSheet />)}>Log weight</button></div>;
  const recent = w.slice(-10).reverse();
  return (<>
    <div className="card">
      <div className="card-title"><h2>Weight trend</h2><button className="btn sm" onClick={() => openSheet(<WeightSheet />)}><Icon name="plus" /> Weigh in</button></div>
      <WeightChart points={w} rollingAvg={(d) => rollingAvg(S, d, 7)} />
      <div className="tiles" style={{ marginTop: 12 }}>
        <div className="tile g-blue"><div className="k">7-day average</div><div className="v">{t.cur != null ? round1(t.cur) : '—'}<small> {S.profile.weightUnit}</small></div></div>
        <div className="tile g-cyan"><div className="k">Prev 7-day</div><div className="v">{t.prev != null ? round1(t.prev) : '—'}<small> {S.profile.weightUnit}</small></div></div>
        <div className="tile g-sage"><div className="k">Week change</div><div className="v" style={{ color: t.delta <= 0 ? 'var(--sage)' : 'var(--ink)' }}>{t.delta != null ? (t.delta <= 0 ? '▼ ' : '▲ ') + Math.abs(t.delta) : '—'}</div></div>
        <div className="tile g-gold"><div className="k">From start</div><div className="v">{t.fromStart != null ? (t.fromStart <= 0 ? '▼ ' : '▲ ') + Math.abs(t.fromStart) : '—'}</div></div>
      </div>
      <div className="hint" style={{ marginTop: 10 }}>Daily ups and downs are water, food and hormones — watch the weekly average, not any single morning.</div>
    </div>
    <div className="card"><div className="card-title"><h2>Recent weigh-ins</h2></div>{recent.map((p, i) => <div key={i} className="row"><div className="main"><div className="t">{wt(S, p.w)}</div></div><div className="end small muted">{fmtDay(p.date)}</div></div>)}</div>
  </>);
}
function ProgMeasure() {
  const { S, openSheet } = useStore();
  const ms = S.measurements.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!ms.length) return <div className="empty"><span className="em">📏</span>No measurements yet.<div className="spacer" /><button className="btn sm" onClick={() => openSheet(<MeasureSheet />)}>Add measurements</button><div className="hint" style={{ marginTop: 12 }}>Take these every 2–4 weeks, same time of day.</div></div>;
  const last = ms[ms.length - 1], first = ms[0], prev = ms.length > 1 ? ms[ms.length - 2] : null;
  const whr = last.waist && last.fullHip ? round1((last.waist / last.fullHip) * 100) / 100 : null;
  let totalLost = 0;
  MFIELDS.forEach((f) => { if (last[f.k] != null && first[f.k] != null) totalLost += +first[f.k] - +last[f.k]; });
  const chg = (cur, base) => (cur != null && base != null ? round1(cur - base) : null);
  return (
    <div className="card">
      <div className="card-title"><h2>Latest measurements</h2><button className="btn sm" onClick={() => openSheet(<MeasureSheet />)}><Icon name="plus" /> New</button></div>
      <div className="tiles">
        <div className="tile g-blue"><div className="k">Taken</div><div className="v" style={{ fontSize: 17 }}>{fmtShort(last.date)}</div></div>
        <div className="tile g-pink"><div className="k">Waist-to-hip</div><div className="v">{whr != null ? whr : '—'}</div></div>
        <div className="tile big g-sage"><div className="k">Total change since start ({fmtShort(first.date)})</div><div className="v" style={{ color: totalLost >= 0 ? 'var(--sage)' : 'var(--ink)' }}>{totalLost >= 0 ? '−' : '+'}{Math.abs(round1(totalLost))} <small>{S.profile.measureUnit}</small></div></div>
      </div>
      <div className="hairline" />
      <div className="col-h" style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1fr' }}><span style={{ textAlign: 'left' }}>Area</span><span>Now</span><span>vs prev</span><span>vs start</span></div>
      {MFIELDS.filter((f) => last[f.k] != null).map((f) => {
        const vp = prev ? chg(+last[f.k], +prev[f.k]) : null, vs = chg(+last[f.k], +first[f.k]);
        const col = (v) => (v == null ? 'var(--muted)' : v < 0 ? 'var(--sage)' : v > 0 ? 'var(--ink)' : 'var(--muted)');
        return (
          <div key={f.k} className="setrow" style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1fr', marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{f.label}</div>
            <div className="center" style={{ fontWeight: 800 }}>{last[f.k]}</div>
            <div className="center small" style={{ color: col(vp) }}>{vp != null ? (vp <= 0 ? '' : '+') + vp : '—'}</div>
            <div className="center small" style={{ color: col(vs) }}>{vs != null ? (vs <= 0 ? '' : '+') + vs : '—'}</div>
          </div>
        );
      })}
      <div className="hint" style={{ marginTop: 8 }}>Your waist can shrink while your glutes stay the same or get firmer — that&apos;s recomposition working.</div>
    </div>
  );
}
function ProgStrength() {
  const { S, openSheet } = useStore();
  const templateKeys = getWorkouts(S).flatMap((w) => w.items.map((i) => i.key));
  const sessionKeys = S.sessions.flatMap((s) => (s.exercises || []).map((e) => e.key));
  const keys = [...new Set([...templateKeys, ...sessionKeys])].filter((k) => lastPerf(S, k));
  if (!keys.length) return <div className="empty"><span className="em">🏋️</span>No strength history yet.<div className="hint" style={{ marginTop: 8 }}>Finish a workout and your lifts will show up here.</div></div>;
  return (
    <div className="card"><div className="card-title"><h2>Strength history</h2></div>
      {keys.map((k) => {
        const last = lastPerf(S, k), best = bestSet(S, k);
        const lastTxt = last.ex.sets.filter((s) => s.reps).map((s) => `${s.weight || '–'}×${s.reps}`).join(', ');
        return (
          <div key={k} className="row tap" onClick={() => openSheet(<ExHistorySheet exKey={k} />)}>
            <div className="ic"><Icon name="dumbbell" /></div>
            <div className="main"><div className="t">{exDef(S, k).name}</div><div className="s">{lastTxt} · {fmtShort(last.date)}</div></div>
            <div className="end"><div className="small muted">PR</div><div style={{ fontWeight: 800 }}>{best ? best.weight : '—'}</div></div>
          </div>
        );
      })}
    </div>
  );
}
function ProgPhotos() {
  const { photos, openSheet } = useStore();
  const list = photos.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="card">
      <div className="card-title"><h2>Progress photos</h2><button className="btn sm" onClick={() => openSheet(<PhotoSheet />)}><Icon name="plus" /> Add</button></div>
      {list.length ? <div className="photos">{list.map((p) => <div key={p.id} className="tap" onClick={() => openSheet(<PhotoViewSheet id={p.id} />)}><img src={p.dataUrl} alt="" loading="lazy" /><div className="small muted center" style={{ marginTop: 2 }}>{p.view} · {fmtShort(p.date)}</div></div>)}</div>
        : <div className="empty small">No photos yet. Take front, side and back every ~4 weeks.</div>}
      <div className="hint" style={{ marginTop: 10 }}>Same lighting, clothing, distance, camera height and time of day. Photos stay on this device only.</div>
    </div>
  );
}

/* ========================================================================= */
/* MORE                                                                      */
/* ========================================================================= */
export function More() {
  const { S, update, openSheet, photos, setS, savePhotos, setActive, toast } = useStore();
  const p = S.profile;
  const setUnit = (field, val) => update((s) => { s.profile[field] = val; });
  const Row = ({ icon, title, sub, onClick }) => (
    <div className="row tap" onClick={onClick}><div className="ic"><Icon name={icon} /></div><div className="main"><div className="t">{title}</div>{sub && <div className="s">{sub}</div>}</div><div className="end muted">›</div></div>
  );
  const exportData = () => {
    const payload = JSON.stringify({ v: 1, state: S, photos }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `body-recomp-backup-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); toast('Backup downloaded');
  };
  const importData = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { try { const data = JSON.parse(r.result); if (!data.state) throw new Error('bad'); if (!confirm('Replace all current data with this backup?')) return;
        const d = defaultState(); setS({ ...d, ...data.state, profile: { ...d.profile, ...(data.state.profile || {}) } }); if (Array.isArray(data.photos)) savePhotos(data.photos); toast('Backup restored'); }
        catch { toast('Could not read that file'); } };
      r.readAsText(f); };
    inp.click();
  };
  const resetData = () => { if (!confirm('Erase ALL data on this device? This cannot be undone.')) return; if (!confirm('Really erase everything? Export a backup first if unsure.')) return; setS(defaultState()); savePhotos([]); setActive(null); toast('All data erased'); };

  return (<>
    <AppBar title="More" sub="Review, library & settings" right={fmtDay(today())} />
    <main className="screen">
      <Reveal className="card">
        <div className="card-title"><h2>Review &amp; reference</h2></div>
        <Row icon="star" title="Weekly review" sub="This week's summary & score" onClick={() => openSheet(<ReviewSheet />)} />
        <Row icon="book" title="Exercise library" sub="Form cues, muscles, substitutions" onClick={() => openSheet(<LibrarySheet />)} />
      </Reveal>
      <Reveal delay={0.05} className="card">
        <div className="card-title"><h2>Setup</h2></div>
        <Row icon="heart" title="Manage supplements" sub={`${S.supplements.filter((s) => s.active).length} active`} onClick={() => openSheet(<SuppManageSheet />)} />
        <Row icon="bolt" title="Targets & goals" sub={`${p.strengthTarget} lifts · ${p.pilatesTarget} classes · ${p.stepTarget.toLocaleString()} steps`} onClick={() => openSheet(<TargetsSheet />)} />
        <Row icon="edit" title="Profile" sub={p.name || 'Add your details'} onClick={() => openSheet(<ProfileSheet />)} />
      </Reveal>
      <Reveal delay={0.1} className="card">
        <div className="card-title"><h2>Units</h2></div>
        <div className="field"><label>Body weight</label><div className="seg">
          <button className={p.weightUnit === 'lb' ? 'on' : ''} onClick={() => setUnit('weightUnit', 'lb')}>lb</button>
          <button className={p.weightUnit === 'kg' ? 'on' : ''} onClick={() => setUnit('weightUnit', 'kg')}>kg</button></div></div>
        <div className="field" style={{ margin: 0 }}><label>Measurements</label><div className="seg">
          <button className={p.measureUnit === 'in' ? 'on' : ''} onClick={() => setUnit('measureUnit', 'in')}>inches</button>
          <button className={p.measureUnit === 'cm' ? 'on' : ''} onClick={() => setUnit('measureUnit', 'cm')}>cm</button></div></div>
      </Reveal>
      <Reveal delay={0.15} className="card">
        <div className="card-title"><h2>Your data</h2></div>
        <div className="hint" style={{ marginBottom: 10 }}>Everything is stored only on this device. Export a backup regularly.</div>
        <div className="btn-row"><button className="btn sm" onClick={exportData}>Export backup</button><button className="btn sm" onClick={importData}>Import</button></div>
        <div className="spacer" /><button className="btn sm ghost danger block" onClick={resetData}>Erase all data</button>
      </Reveal>
      <div className="center small muted" style={{ margin: '8px 0 20px' }}>Body Recomp Tracker · works offline · made with 💙</div>
    </main>
  </>);
}
