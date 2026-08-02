'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Field, Select, Icon, Sparkline, Ring, Rec, cx } from './ui';
import {
  today, uid, round1, fmtDay, fmtShort, wt,
  EX, WORKOUTS, AB_CIRCUIT, ACTIVITY_TYPES, CARDIO_TYPES, MFIELDS,
  progression, allPerf, lastPerf, bestSet, topSetSeries,
  recompScore, weekRotation, weekBundle, weekStatus, trendSummary,
} from '@/lib/data';

const numOr = (v) => (v === '' || v == null ? null : +v);
const findItem = (key) => WORKOUTS.flatMap((w) => w.items).find((i) => i.key === key) || { key, min: 8, max: 10 };

/* ---- quick logs --------------------------------------------------------- */
export function WeightSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const [v, setV] = useState(S.daily[today()]?.weight ?? '');
  const save = () => { update((s) => { (s.daily[today()] ||= {}).weight = numOr(v); }); toast('Weight logged'); closeSheet(); };
  return (<>
    <h2>Log weight</h2><p className="sub">Weigh under similar conditions — ideally first thing.</p>
    <Field label={`Weight (${S.profile.weightUnit})`}>
      <input className="input" type="number" inputMode="decimal" autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. 138.4" />
    </Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}

export function StepsSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const [v, setV] = useState(S.daily[today()]?.steps ?? '');
  const save = () => { update((s) => { (s.daily[today()] ||= {}).steps = numOr(v); }); toast('Steps logged'); closeSheet(); };
  return (<>
    <h2>Log steps</h2><p className="sub">Enter today&apos;s step count from your phone or watch.</p>
    <Field label="Steps" hint={`Target ${S.profile.stepTarget.toLocaleString()}/day — the weekly average is what matters.`}>
      <input className="input" type="number" inputMode="numeric" autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. 10250" />
    </Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}

export function CheckinSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const d0 = S.daily[today()] || {};
  const [f, setF] = useState({ weight: d0.weight ?? '', steps: d0.steps ?? '', energy: d0.energy || '', sleep: d0.sleep || '', soreness: d0.soreness || '', cycle: d0.cycle || '', note: d0.note || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    update((s) => { const d = (s.daily[today()] ||= {}); d.weight = numOr(f.weight); d.steps = numOr(f.steps); d.energy = f.energy; d.sleep = f.sleep; d.soreness = f.soreness; d.cycle = f.cycle; d.note = f.note; });
    toast('Check-in saved'); closeSheet();
  };
  return (<>
    <h2>Daily check-in</h2><p className="sub">About a minute — helps explain the ups and downs.</p>
    <div className="grid2">
      <Field label={`Weight (${S.profile.weightUnit})`}><input className="input" type="number" inputMode="decimal" value={f.weight} onChange={set('weight')} /></Field>
      <Field label="Steps"><input className="input" type="number" inputMode="numeric" value={f.steps} onChange={set('steps')} /></Field>
    </div>
    <Field label="Energy"><Select value={f.energy} onChange={set('energy')} options={[['', '—'], 'Very low', 'Low', 'Normal', 'High']} /></Field>
    <Field label="Sleep quality"><Select value={f.sleep} onChange={set('sleep')} options={[['', '—'], 'Poor', 'Fair', 'Good', 'Great']} /></Field>
    <Field label="Soreness"><Select value={f.soreness} onChange={set('soreness')} options={[['', '—'], 'None', 'Mild', 'Moderate', 'High']} /></Field>
    <Field label="Cycle phase (optional)"><Select value={f.cycle} onChange={set('cycle')} options={[['', '—'], 'Menstrual', 'Follicular', 'Ovulation', 'Luteal']} /></Field>
    <Field label="Notes"><textarea value={f.note} onChange={set('note')} placeholder="Anything worth remembering" /></Field>
    <button className="btn primary block" onClick={save}>Save check-in</button>
  </>);
}

export function ActivitySheet({ preset }) {
  const { update, closeSheet, toast } = useStore();
  const [f, setF] = useState({ type: preset || 'pilates', dur: '', int: 'Moderate', date: today(), note: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => { update((s) => s.activities.push({ id: uid(), date: f.date || today(), type: f.type, duration: numOr(f.dur), intensity: f.int, note: f.note })); toast('Class logged'); closeSheet(); };
  return (<>
    <h2>Log Pilates / Yoga</h2><p className="sub">Any of these count toward your weekly class goal.</p>
    <Field label="Type"><Select value={f.type} onChange={set('type')} options={ACTIVITY_TYPES.map((t) => [t.id, t.name])} /></Field>
    <div className="grid2">
      <Field label="Duration (min)"><input className="input" type="number" inputMode="numeric" value={f.dur} onChange={set('dur')} placeholder="50" /></Field>
      <Field label="Intensity"><Select value={f.int} onChange={set('int')} options={['Easy', 'Moderate', 'Hard']} /></Field>
    </div>
    <Field label="Date"><input className="input" type="date" value={f.date} onChange={set('date')} /></Field>
    <Field label="Notes"><textarea value={f.note} onChange={set('note')} placeholder="How was class?" /></Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}

function buildCardio(f) {
  const o = { type: f.type || 'stairmaster', duration: numOr(f.dur), effort: f.eff, level: numOr(f.level), speed: numOr(f.speed), incline: numOr(f.incline), distance: f.dist, note: f.note };
  Object.keys(o).forEach((k) => { if (o[k] === null || o[k] === '' || o[k] === undefined) delete o[k]; });
  o.type = o.type || 'stairmaster';
  return o;
}
export function CardioSheet({ mode, preset }) {
  const active = mode === 'active';
  const { update, setActive, closeSheet, toast } = useStore();
  const [f, setF] = useState({ type: preset || 'stairmaster', dur: '', eff: 'Moderate', level: '', speed: '', incline: '', dist: '', note: '', date: today() });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    const c = buildCardio(f);
    if (active) { setActive((a) => { a.cardio = c; return a; }); toast('Cardio added'); }
    else { update((s) => s.cardio.push({ id: uid(), date: f.date || today(), ...c })); toast('Cardio logged'); }
    closeSheet();
  };
  return (<>
    <h2>{active ? 'Add cardio to workout' : 'Log cardio'}</h2><p className="sub">Keep it moderate — it should support lifting, not fight recovery.</p>
    <Field label="Type"><Select value={f.type} onChange={set('type')} options={CARDIO_TYPES.map((t) => [t.id, t.name])} /></Field>
    <div className="grid2">
      <Field label="Duration (min)"><input className="input" type="number" inputMode="numeric" value={f.dur} onChange={set('dur')} placeholder="15" /></Field>
      <Field label="Effort"><Select value={f.eff} onChange={set('eff')} options={[['', '—'], 'Easy', 'Moderate', 'Hard']} /></Field>
    </div>
    <div className="grid3">
      <Field label="Level"><input className="input" type="number" inputMode="numeric" value={f.level} onChange={set('level')} placeholder="6" /></Field>
      <Field label="Speed"><input className="input" type="number" inputMode="decimal" value={f.speed} onChange={set('speed')} placeholder="3.2" /></Field>
      <Field label="Incline %"><input className="input" type="number" inputMode="decimal" value={f.incline} onChange={set('incline')} placeholder="8" /></Field>
    </div>
    <Field label="Distance / floors"><input className="input" type="text" value={f.dist} onChange={set('dist')} placeholder="optional" /></Field>
    {!active && <Field label="Date"><input className="input" type="date" value={f.date} onChange={set('date')} /></Field>}
    <Field label="Notes"><textarea value={f.note} onChange={set('note')} placeholder="optional" /></Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}

export function AbsSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const [rounds, setRounds] = useState(S.daily[today()]?.abRounds || '2');
  const save = () => { update((s) => { const d = (s.daily[today()] ||= {}); d.ab = true; d.abRounds = rounds; }); toast('Ab circuit logged'); closeSheet(); };
  return (<>
    <h2>Ab circuit</h2><p className="sub">Optional — 2–3 rounds, a couple of times a week.</p>
    <div className="card tight">{AB_CIRCUIT.map((a) => <div key={a.name} className="row"><div className="main"><div className="t">{a.name}</div><div className="s">{a.target}</div></div></div>)}</div>
    <Field label="Rounds completed"><Select value={rounds} onChange={(e) => setRounds(e.target.value)} options={['1', '2', '3', '4']} /></Field>
    <button className="btn primary block" onClick={save}>Mark complete</button>
  </>);
}

export function MeasureSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const last = S.measurements.length ? S.measurements[S.measurements.length - 1] : {};
  const init = { date: today(), weight: last.weight ?? '' };
  MFIELDS.forEach((f) => { init[f.k] = last[f.k] ?? ''; });
  const [f, setF] = useState(init);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    update((s) => {
      const m = { id: uid(), date: f.date || today(), weight: numOr(f.weight) };
      MFIELDS.forEach((fl) => { if (f[fl.k] !== '') m[fl.k] = +f[fl.k]; });
      s.measurements.push(m);
      if (m.weight != null && (s.daily[m.date]?.weight == null)) (s.daily[m.date] ||= {}).weight = m.weight;
    });
    toast('Measurements saved'); closeSheet();
  };
  return (<>
    <h2>Measurements</h2><p className="sub">Every 2–4 weeks, same time of day. Prefilled with your last values.</p>
    <Field label="Date"><input className="input" type="date" value={f.date} onChange={set('date')} /></Field>
    <Field label={`Weight (${S.profile.weightUnit})`}><input className="input" type="number" inputMode="decimal" value={f.weight} onChange={set('weight')} /></Field>
    {MFIELDS.map((fl) => (
      <Field key={fl.k} label={`${fl.label} (${S.profile.measureUnit})`} hint={fl.hint}>
        <input className="input" type="number" inputMode="decimal" value={f[fl.k]} onChange={set(fl.k)} />
      </Field>
    ))}
    <button className="btn primary block" onClick={save}>Save measurements</button>
  </>);
}

function compressImage(file, max = 720, q = 0.62) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > h && w > max) { h = (h * max) / w; w = max; } else if (h > max) { w = (w * max) / h; h = max; }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
export function PhotoSheet() {
  const { photos, savePhotos, closeSheet, toast } = useStore();
  const [view, setView] = useState('Front');
  const [date, setDate] = useState(today());
  const [url, setUrl] = useState(null);
  const onFile = async (e) => { const file = e.target.files?.[0]; if (!file) return; setUrl(await compressImage(file)); };
  const save = () => { if (!url) return; if (savePhotos([...photos, { id: uid(), date, view, dataUrl: url }])) { toast('Photo saved'); closeSheet(); } };
  return (<>
    <h2>Add progress photo</h2><p className="sub">Stays on this device. Same lighting, clothing &amp; distance each time.</p>
    <Field label="View"><Select value={view} onChange={(e) => setView(e.target.value)} options={['Front', 'Side', 'Back', 'Three-quarter']} /></Field>
    <Field label="Date"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
    <Field label="Photo"><input className="input" type="file" accept="image/*" onChange={onFile} /></Field>
    {url && <div className="center"><img src={url} alt="" style={{ maxHeight: 200, borderRadius: 12, margin: '6px 0' }} /></div>}
    <button className="btn primary block" disabled={!url} onClick={save}>Save photo</button>
  </>);
}
export function PhotoViewSheet({ id }) {
  const { photos, savePhotos, closeSheet, toast } = useStore();
  const p = photos.find((x) => x.id === id);
  if (!p) return null;
  const del = () => { if (!confirm('Delete this photo?')) return; savePhotos(photos.filter((x) => x.id !== id)); toast('Photo deleted'); closeSheet(); };
  return (<>
    <h2>{p.view}</h2><p className="sub">{fmtDay(p.date)}</p>
    <img src={p.dataUrl} alt="" style={{ width: '100%', borderRadius: 14 }} />
    <div className="spacer" />
    <button className="btn danger block" onClick={del}>Delete photo</button>
    <div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>Close</button>
  </>);
}

/* ---- supplements -------------------------------------------------------- */
function suppByTime(list) {
  const order = { Morning: 0, Afternoon: 1, Evening: 2, Anytime: 3 };
  const groups = {};
  list.filter((s) => s.active).sort((a, b) => (order[a.time] - order[b.time]) || (a.order - b.order))
    .forEach((s) => { (groups[s.time || 'Anytime'] ||= []).push(s); });
  return groups;
}
export function SuppQuickSheet() {
  const { S, update, closeSheet } = useStore();
  const groups = suppByTime(S.supplements);
  const log = S.suppLog[today()] || {};
  const active = S.supplements.filter((s) => s.active);
  const toggle = (id) => update((s) => { const d = (s.suppLog[today()] ||= {}); if (d[id]) delete d[id]; else d[id] = true; });
  const all = () => update((s) => { const d = (s.suppLog[today()] = {}); s.supplements.filter((x) => x.active).forEach((x) => (d[x.id] = true)); });
  const clear = () => update((s) => { s.suppLog[today()] = {}; });
  return (<>
    <h2>Supplements</h2><p className="sub">{fmtDay(today())}</p>
    {active.length ? Object.keys(groups).map((tm) => (
      <div key={tm}>
        <div className="small muted" style={{ margin: '6px 2px 2px', fontWeight: 800 }}>{tm}</div>
        {groups[tm].map((s) => (
          <div key={s.id} className={cx('check', log[s.id] && 'on')} onClick={() => toggle(s.id)}>
            <div className="box"><Icon name="check" /></div><div className="lbl">{s.name}{s.dose && <span className="sub"> {s.dose}</span>}</div>
          </div>
        ))}
      </div>
    )) : <div className="empty small">No supplements yet.</div>}
    <div className="btn-row" style={{ marginTop: 12 }}><button className="btn sm" onClick={all}>Mark all</button><button className="btn sm ghost" onClick={clear}>Clear</button></div>
    <div className="spacer" /><button className="btn block" onClick={closeSheet}>Done</button>
  </>);
}
export function SuppManageSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const [f, setF] = useState({ name: '', dose: '', time: 'Morning' });
  const add = () => { if (!f.name.trim()) { toast('Enter a name'); return; } update((s) => s.supplements.push({ id: uid(), name: f.name.trim(), dose: f.dose, time: f.time || 'Anytime', active: true, order: s.supplements.length })); setF({ name: '', dose: '', time: f.time }); };
  const pause = (id) => update((s) => { const x = s.supplements.find((y) => y.id === id); if (x) x.active = !x.active; });
  return (<>
    <h2>Manage supplements</h2><p className="sub">Track whether you took them — no dosage advice.</p>
    {S.supplements.slice().sort((a, b) => a.order - b.order).map((s) => (
      <div key={s.id} className="row"><div className="ic"><Icon name="pill" /></div>
        <div className="main"><div className="t" style={{ opacity: s.active ? 1 : 0.5 }}>{s.name}</div><div className="s">{s.time || 'Anytime'}{s.dose ? ' · ' + s.dose : ''}</div></div>
        <div className="end"><button className="btn sm ghost" onClick={() => pause(s.id)}>{s.active ? 'Pause' : 'Resume'}</button></div>
      </div>
    ))}
    <div className="hairline" />
    <div className="small muted" style={{ fontWeight: 800, marginBottom: 8 }}>Add supplement</div>
    <div className="grid2">
      <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Creatine" /></Field>
      <Field label="Time"><Select value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} options={['Morning', 'Afternoon', 'Evening', 'Anytime']} /></Field>
    </div>
    <Field label="Dose (optional)"><input className="input" value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} placeholder="e.g. 5 g" /></Field>
    <button className="btn primary block" onClick={add}>Add supplement</button>
    <div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>Done</button>
  </>);
}

/* ---- settings ----------------------------------------------------------- */
export function TargetsSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const p = S.profile;
  const [f, setF] = useState({ str: p.strengthTarget, pil: p.pilatesTarget, car: p.cardioTarget, pro: p.proteinTarget, step: p.stepTarget });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => { update((s) => { s.profile.strengthTarget = +f.str || 4; s.profile.pilatesTarget = +f.pil || 2; s.profile.cardioTarget = +f.car || 3; s.profile.proteinTarget = +f.pro || 120; s.profile.stepTarget = +f.step || 10000; }); toast('Targets saved'); closeSheet(); };
  return (<>
    <h2>Targets &amp; goals</h2><p className="sub">The weekly targets that drive your score.</p>
    <div className="grid2">
      <Field label="Strength / week"><input className="input" type="number" value={f.str} onChange={set('str')} /></Field>
      <Field label="Pilates·Yoga / week"><input className="input" type="number" value={f.pil} onChange={set('pil')} /></Field>
      <Field label="Cardio / week"><input className="input" type="number" value={f.car} onChange={set('car')} /></Field>
      <Field label="Protein (g/day)"><input className="input" type="number" value={f.pro} onChange={set('pro')} /></Field>
    </div>
    <Field label="Daily step target"><input className="input" type="number" value={f.step} onChange={set('step')} /></Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}
export function ProfileSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const p = S.profile;
  const [f, setF] = useState({ name: p.name, h: p.heightIn ?? '', sw: p.startWeight ?? '', gw: p.goalWeight ?? '', sd: p.startDate });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => { update((s) => { s.profile.name = f.name; s.profile.heightIn = numOr(f.h); s.profile.startWeight = numOr(f.sw); s.profile.goalWeight = numOr(f.gw); s.profile.startDate = f.sd || s.profile.startDate; }); toast('Profile saved'); closeSheet(); };
  return (<>
    <h2>Profile</h2><p className="sub">Used for trends — nothing leaves your device.</p>
    <Field label="Name"><input className="input" value={f.name} onChange={set('name')} placeholder="First name" /></Field>
    <div className="grid2">
      <Field label="Height (in)"><input className="input" type="number" value={f.h} onChange={set('h')} /></Field>
      <Field label={`Start weight (${S.profile.weightUnit})`}><input className="input" type="number" value={f.sw} onChange={set('sw')} /></Field>
      <Field label="Goal weight (opt)"><input className="input" type="number" value={f.gw} onChange={set('gw')} /></Field>
      <Field label="Program start"><input className="input" type="date" value={f.sd} onChange={set('sd')} /></Field>
    </div>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}

/* ---- exercise menu / history / library ---------------------------------- */
export function ExMenuSheet({ idx }) {
  const { active, setActive, closeSheet } = useStore();
  const ex = active.exercises[idx];
  const e = EX[ex.key];
  const subs = e.subs.map((s) => (EX[s] ? [s, EX[s].name] : [s, s]));
  const doSub = (v) => { setActive((a) => { a.exercises[idx].subName = EX[v] ? EX[v].name : v; return a; }); closeSheet(); };
  const undo = () => { setActive((a) => { a.exercises[idx].subName = null; return a; }); closeSheet(); };
  const setPain = (v) => setActive((a) => { a.exercises[idx].pain = v; return a; });
  const [note, setNote] = useState(ex.note || '');
  const done = () => { setActive((a) => { a.exercises[idx].note = note; return a; }); closeSheet(); };
  return (<>
    <h2>{ex.subName || ex.name}</h2><p className="sub">Adjust this exercise</p>
    <Field label="Substitute with">
      <div className="chips">
        {subs.map(([v, l]) => <button key={v} className="chip" onClick={() => doSub(v)}>{l}</button>)}
        {ex.subName && <button className="chip on" onClick={undo}>↺ {ex.name}</button>}
      </div>
    </Field>
    <Field label="Pain / discomfort" hint="Pain is a signal to stop or swap — not to push through.">
      <div className="chips">{[['none', 'None'], ['mild', 'Mild'], ['pain', 'Pain'], ['stop', 'Stop']].map(([v, l]) => (
        <button key={v} className={cx('chip', ex.pain === v && 'on')} onClick={() => setPain(v)}>{l}</button>
      ))}</div>
    </Field>
    <Field label="Notes"><textarea value={note} onChange={(e2) => setNote(e2.target.value)} placeholder="e.g. felt strong, tweak seat height" /></Field>
    <button className="btn primary block" onClick={done}>Done</button>
  </>);
}

export function ExHistorySheet({ exKey }) {
  const { S, closeSheet } = useStore();
  const e = EX[exKey];
  const all = allPerf(S, exKey).slice().reverse();
  const best = bestSet(S, exKey);
  const series = topSetSeries(S, exKey);
  const item = findItem(exKey);
  const prog = progression(S, item);
  return (<>
    <h2>{e.name}</h2><p className="sub">{e.muscles}</p>
    {series.length > 1 && <div className="card tight"><Sparkline values={series.map((p) => p.w)} /><div className="small muted center">Top-set weight over time</div></div>}
    <div className="tiles">
      <div className="tile g-blue"><div className="k">Personal record</div><div className="v">{best ? best.weight : '—'}<small> {S.profile.weightUnit}×{best ? best.reps : ''}</small></div></div>
      <div className="tile g-sage"><div className="k">Next goal</div><div className="v" style={{ fontSize: 16 }}>{item.min}–{item.max} reps</div></div>
    </div>
    <div style={{ margin: '12px 0' }}><Rec prog={prog} /></div>
    <div className="section-title" style={{ marginLeft: 0 }}>History</div>
    {all.length ? all.map(({ date, ex }, i) => (
      <div key={i} className="row"><div className="main">
        <div className="t">{ex.sets.filter((s) => s.reps).map((s) => `${s.weight || '–'}×${s.reps}`).join(', ')}</div>
        <div className="s">{fmtDay(date)}{ex.pain && ex.pain !== 'none' ? ' · ⚠ ' + ex.pain : ''}{ex.note ? ' · ' + ex.note : ''}</div>
      </div></div>
    )) : <div className="empty small">No history yet.</div>}
    <div className="spacer" /><button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}

export function LibrarySheet() {
  const { openSheet, closeSheet } = useStore();
  return (<>
    <h2>Exercise Library</h2><p className="sub">Form cues, target muscles &amp; swaps</p>
    {WORKOUTS.map((w) => (
      <div key={w.id}>
        <div className="section-title" style={{ marginLeft: 0 }}>{w.name}</div>
        {w.items.map((it) => (
          <div key={it.key} className="row tap" onClick={() => openSheet(<ExInfoSheet exKey={it.key} />)}>
            <div className="ic"><Icon name="dumbbell" /></div>
            <div className="main"><div className="t">{EX[it.key].name}</div><div className="s">{it.sets}×{it.min}–{it.max}{it.perSide ? ' /side' : ''} · {EX[it.key].muscles}</div></div>
            <div className="end muted">›</div>
          </div>
        ))}
      </div>
    ))}
    <div className="hint" style={{ margin: '12px 0' }}>Cable kickbacks are intentionally left out — they tend to aggravate the lower back.</div>
    <button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}
export function ExInfoSheet({ exKey }) {
  const { closeSheet } = useStore();
  const e = EX[exKey];
  const subs = e.subs.map((s) => (EX[s] ? EX[s].name : s));
  return (<>
    <h2>{e.name}</h2><p className="sub">{e.muscles}</p>
    <div className="card tight"><div className="small muted" style={{ fontWeight: 800, marginBottom: 6 }}>Form cues</div>
      <ul className="hint">{e.cues.map((c) => <li key={c}>{c}</li>)}</ul></div>
    <div className="card tight"><div className="small muted" style={{ fontWeight: 800, marginBottom: 6 }}>Swaps if needed</div>
      <div className="chips">{subs.map((s) => <span key={s} className="chip">{s}</span>)}</div></div>
    <div className="hint">If a movement causes pain, stop or substitute — pain isn&apos;t something to push through.</div>
    <div className="spacer" /><button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}

/* ---- weekly review + finish summary ------------------------------------- */
export function ReviewSheet() {
  const { S, closeSheet } = useStore();
  const sc = recompScore(S);
  const b = sc.bundle;
  const status = weekStatus(S, b);
  const t = trendSummary(S);
  const pain = b.sessions.some((s) => (s.exercises || []).some((e) => e.pain && e.pain !== 'none'));
  const progressed = b.sessions.some((s) => (s.exercises || []).some((e) => { const it = findItem(e.key); return e.sets.filter((x) => x.reps).length && e.sets.filter((x) => x.reps).every((x) => +x.reps >= it.max); }));
  const Q = ({ label, val }) => <><div className="metric"><div className="lbl"><div className="t">{label}</div></div><div className="val">{val}</div></div><div className="hairline" /></>;
  return (<>
    <h2>Weekly Review</h2><p className="sub">{fmtShort(b.monday)}–{fmtShort(b.dates[6])}</p>
    <div className="card score-card">
      <div className="ring-wrap">
        <div className="ring"><Ring pct={sc.total / 100} size={96} stroke={10} /><div className="num"><b>{sc.total}</b><span>score</span></div></div>
        <div><span className="pill" style={{ background: 'rgba(255,255,255,.22)', color: '#fff' }}>{status.label}</span>
          <div className="small" style={{ marginTop: 8, opacity: 0.92 }}>{status.label === 'Excellent Week' ? 'Four workouts and your classes in — beautiful consistency.' : status.label === 'Solid Week' ? 'Strong, steady week. No major regressions.' : 'Lighter week — rest counts too. Reset Monday.'}</div></div>
      </div>
    </div>
    <div className="card">
      <Q label="Strength workouts" val={`${b.sessions.length} / ${S.profile.strengthTarget}`} />
      <Q label="Pilates / Yoga" val={`${b.pilatesYoga.length} / ${S.profile.pilatesTarget}`} />
      <Q label="Step-goal days" val={`${b.stepDays} / 7`} />
      <Q label="Avg daily steps" val={b.stepAvg ? b.stepAvg.toLocaleString() : '—'} />
      <Q label="StairMaster" val={`${b.stair}`} />
      <Q label="Treadmill" val={`${b.tread}`} />
      <Q label="Supplement adherence" val={`${b.supp.pct}%`} />
      <Q label="Weekly avg weight" val={b.avgWeight ? wt(S, b.avgWeight) : '—'} />
      <Q label="Weight trend" val={t.delta != null ? `${t.delta <= 0 ? '▼' : '▲'} ${Math.abs(t.delta)} ${S.profile.weightUnit}/wk` : '—'} />
      <Q label="Lifts progressed" val={progressed ? 'Yes 💪' : 'Held steady'} />
      <div className="metric"><div className="lbl"><div className="t">Pain recorded</div></div><div className="val">{pain ? <span className="pill danger">Yes</span> : 'None'}</div></div>
    </div>
    <button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}

export function FinishSummary({ session }) {
  const { S, closeSheet } = useStore();
  const sc = recompScore(S);
  const rot = weekRotation(S);
  return (<>
    <h2>Workout saved 🎉</h2><p className="sub">{session.name} · {fmtDay(session.date)}</p>
    <div className="card score-card">
      <div className="ring-wrap">
        <div className="ring"><Ring pct={sc.total / 100} size={88} stroke={9} /><div className="num"><b>{sc.total}</b><span>score</span></div></div>
        <div className="small" style={{ opacity: 0.94 }}>{rot.next ? <>Next up in your rotation: <b>{rot.next.name}</b></> : 'Full strength rotation complete this week! 🔥'}</div>
      </div>
    </div>
    <div className="section-title" style={{ marginLeft: 0 }}>Next-session recommendations</div>
    {session.exercises.map((e, i) => <div key={i} style={{ marginBottom: 10 }}><div className="small" style={{ fontWeight: 700, margin: '0 2px 5px' }}>{e.subName || e.name}</div><Rec prog={progression(S, findItem(e.key), e)} /></div>)}
    <div className="spacer" /><button className="btn primary block" onClick={closeSheet}>Done</button>
  </>);
}
