'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Field, Select, Icon, Sparkline, Ring, Rec, cx } from './ui';
import {
  today, uid, slug, round1, fmtDay, fmtShort, wt,
  exDef, exList, getWorkouts, findItem, sessionToActive, DEFAULT_WORKOUTS,
  AB_CIRCUIT, ACTIVITY_TYPES, CARDIO_TYPES, MFIELDS,
  progression, allPerf, lastPerf, bestSet, topSetSeries,
  recompScore, weekRotation, weekStatus, trendSummary,
} from '@/lib/data';

const numOr = (v) => (v === '' || v == null ? null : +v);

/* ---- quick logs --------------------------------------------------------- */
export function WeightSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const [v, setV] = useState(S.daily[today()]?.weight ?? '');
  const save = () => { update((s) => { (s.daily[today()] ||= {}).weight = numOr(v); }); toast('Weight logged'); closeSheet(); };
  return (<>
    <h2>Log weight</h2><p className="sub">Weigh under similar conditions — ideally first thing.</p>
    <Field label={`Weight (${S.profile.bodyUnit || S.profile.weightUnit})`}><input className="input" type="number" inputMode="decimal" autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. 138.4" /></Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}
export function StepsSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const [v, setV] = useState(S.daily[today()]?.steps ?? '');
  const save = () => { update((s) => { (s.daily[today()] ||= {}).steps = numOr(v); }); toast('Steps logged'); closeSheet(); };
  return (<>
    <h2>Log steps</h2><p className="sub">Enter today&apos;s step count from your phone or watch.</p>
    <Field label="Steps" hint={`Target ${S.profile.stepTarget.toLocaleString()}/day — the weekly average is what matters.`}><input className="input" type="number" inputMode="numeric" autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. 10250" /></Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}
export function CheckinSheet() {
  const { S, update, closeSheet, toast } = useStore();
  const d0 = S.daily[today()] || {};
  const [f, setF] = useState({ weight: d0.weight ?? '', steps: d0.steps ?? '', energy: d0.energy || '', sleep: d0.sleep || '', soreness: d0.soreness || '', cycle: d0.cycle || '', note: d0.note || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => { update((s) => { const d = (s.daily[today()] ||= {}); d.weight = numOr(f.weight); d.steps = numOr(f.steps); d.energy = f.energy; d.sleep = f.sleep; d.soreness = f.soreness; d.cycle = f.cycle; d.note = f.note; }); toast('Check-in saved'); closeSheet(); };
  return (<>
    <h2>Daily check-in</h2><p className="sub">About a minute — helps explain the ups and downs.</p>
    <div className="grid2">
      <Field label={`Weight (${S.profile.bodyUnit || S.profile.weightUnit})`}><input className="input" type="number" inputMode="decimal" value={f.weight} onChange={set('weight')} /></Field>
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
export function ActivitySheet({ preset, edit }) {
  const { update, closeSheet, toast } = useStore();
  const [f, setF] = useState(edit
    ? { type: edit.type || 'pilates', dur: edit.duration ?? '', int: edit.intensity || 'Moderate', date: edit.date || today(), note: edit.note || '' }
    : { type: preset || 'pilates', dur: '', int: 'Moderate', date: today(), note: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => {
    if (edit) { update((s) => { const i = s.activities.findIndex((x) => x.id === edit.id); if (i >= 0) s.activities[i] = { id: edit.id, date: f.date || edit.date, type: f.type, duration: numOr(f.dur), intensity: f.int, note: f.note }; }); toast('Class updated'); }
    else { update((s) => s.activities.push({ id: uid(), date: f.date || today(), type: f.type, duration: numOr(f.dur), intensity: f.int, note: f.note })); toast('Class logged'); }
    closeSheet();
  };
  return (<>
    <h2>{edit ? 'Edit class' : 'Log Pilates / Yoga'}</h2><p className="sub">Any of these count toward your weekly class goal.</p>
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
export function CardioSheet({ mode, preset, edit }) {
  const active = mode === 'active';
  const { S, update, setActive, openSheet, closeSheet, toast } = useStore();
  const [f, setF] = useState(edit
    ? { type: edit.type || 'stairmaster', dur: edit.duration ?? '', eff: edit.effort || '', level: edit.level ?? '', speed: edit.speed ?? '', incline: edit.incline ?? '', dist: edit.distance || '', note: edit.note || '', date: edit.date || today() }
    : { type: preset || 'stairmaster', dur: '', eff: 'Moderate', level: '', speed: '', incline: '', dist: '', note: '', date: today() });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  // cardio already logged today (only relevant when logging a fresh standalone entry)
  const todays = (!active && !edit && S) ? S.cardio.filter((c) => c.date === today()) : [];
  const save = () => {
    const c = buildCardio(f);
    if (active) { setActive((a) => { a.cardio = c; return a; }); toast('Cardio added'); }
    else if (edit) { update((s) => { const i = s.cardio.findIndex((x) => x.id === edit.id); if (i >= 0) s.cardio[i] = { id: edit.id, date: f.date || edit.date, ...c }; }); toast('Cardio updated'); }
    else { update((s) => s.cardio.push({ id: uid(), date: f.date || today(), ...c })); toast('Cardio logged'); }
    closeSheet();
  };
  return (<>
    <h2>{active ? 'Add cardio to workout' : edit ? 'Edit cardio' : 'Log cardio'}</h2><p className="sub">Keep it moderate — it should support lifting, not fight recovery.</p>
    {todays.length > 0 && (
      <div className="card tight" style={{ marginBottom: 14 }}>
        <div className="small muted" style={{ fontWeight: 800, marginBottom: 2 }}>Already logged today</div>
        {todays.map((c) => (
          <div key={c.id} className="row tap" onClick={() => openSheet(<EntrySheet entry={{ ...c, kind: 'cardio' }} />)}>
            <div className="ic"><Icon name={c.type === 'stairmaster' ? 'stairs' : 'walk'} /></div>
            <div className="main"><div className="t" style={{ fontSize: 14 }}>{(CARDIO_TYPES.find((x) => x.id === c.type) || {}).name}</div><div className="s">{c.duration ? c.duration + ' min' : ''}{c.effort ? (c.duration ? ' · ' : '') + c.effort : ''} · tap to edit or delete</div></div>
            <div className="end muted">›</div>
          </div>
        ))}
        <div className="hint" style={{ marginTop: 6 }}>You&apos;re all set for today — close below, or add another session.</div>
      </div>
    )}
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
    <button className="btn primary block" onClick={save}>{edit ? 'Save changes' : todays.length ? 'Add another session' : 'Save'}</button>
    {!active && <><div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>{todays.length ? 'Done' : 'Cancel'}</button></>}
  </>);
}
export function EntrySheet({ entry }) {
  const { update, openSheet, closeSheet, toast } = useStore();
  const del = () => {
    if (!confirm('Delete this entry? This can’t be undone.')) return;
    update((s) => {
      if (entry.kind === 'cardio') s.cardio = s.cardio.filter((x) => x.id !== entry.id);
      else if (entry.kind === 'act') s.activities = s.activities.filter((x) => x.id !== entry.id);
      else if (entry.kind === 'strength') s.sessions = s.sessions.filter((x) => x.id !== entry.id);
    });
    toast('Deleted'); closeSheet();
  };
  let title = '', lines = [];
  if (entry.kind === 'cardio') {
    title = (CARDIO_TYPES.find((c) => c.id === entry.type) || {}).name || 'Cardio';
    if (entry.duration) lines.push(`${entry.duration} min`);
    if (entry.level != null) lines.push(`level ${entry.level}`);
    if (entry.speed != null) lines.push(`${entry.speed} speed`);
    if (entry.incline != null) lines.push(`${entry.incline}% incline`);
    if (entry.distance) lines.push(`${entry.distance}`);
    if (entry.effort) lines.push(entry.effort);
    if (entry.note) lines.push(entry.note);
  } else if (entry.kind === 'act') {
    title = (ACTIVITY_TYPES.find((a) => a.id === entry.type) || {}).name || 'Class';
    if (entry.duration) lines.push(`${entry.duration} min`);
    if (entry.intensity) lines.push(entry.intensity);
    if (entry.note) lines.push(entry.note);
  } else { title = entry.name || 'Workout'; lines.push('Strength session'); }
  return (<>
    <h2>{title}</h2><p className="sub">{fmtDay(entry.date)}</p>
    <div className="card tight">{lines.length ? lines.map((l, i) => <div key={i} className="small" style={{ padding: '3px 0' }}>{l}</div>) : <div className="small muted">No extra details</div>}</div>
    {entry.kind === 'cardio' && <button className="btn block" onClick={() => openSheet(<CardioSheet mode="standalone" edit={entry} />)}><Icon name="edit" /> Edit cardio</button>}
    {entry.kind === 'act' && <button className="btn block" onClick={() => openSheet(<ActivitySheet edit={entry} />)}><Icon name="edit" /> Edit class</button>}
    <div className="spacer" />
    <button className="btn ghost danger block" onClick={del}>Delete entry</button>
    <div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>Close</button>
  </>);
}

/* ---- logged workout history: view, edit, delete ------------------------- */
export function WorkoutHistorySheet() {
  const { S, openSheet, closeSheet } = useStore();
  const sessions = S.sessions.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const counts = {}; sessions.forEach((s) => { const k = s.date + '|' + s.name; counts[k] = (counts[k] || 0) + 1; });
  const seen = {};
  return (<>
    <h2>Logged workouts</h2><p className="sub">Tap a workout to view, edit or delete it.</p>
    {sessions.length ? sessions.map((s) => {
      const k = s.date + '|' + s.name; const dup = counts[k] > 1; seen[k] = (seen[k] || 0) + 1;
      const exCount = (s.exercises || []).filter((e) => (e.sets || []).some((x) => x.reps != null)).length;
      return (
        <div key={s.id} className="row tap" onClick={() => openSheet(<SessionDetailSheet id={s.id} />)}>
          <div className="ic"><Icon name="dumbbell" /></div>
          <div className="main"><div className="t">{s.name}{dup && <span className="pill muted" style={{ marginLeft: 6 }}>#{seen[k]}</span>}</div><div className="s">{fmtDay(s.date)} · {exCount} exercise{exCount === 1 ? '' : 's'} logged</div></div>
          <div className="end muted">›</div>
        </div>
      );
    }) : <div className="empty small">No workouts logged yet.</div>}
    <div className="spacer" /><button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}
export function SessionDetailSheet({ id }) {
  const { S, setActive, goTab, update, openSheet, closeSheet, toast } = useStore();
  const s = S.sessions.find((x) => x.id === id);
  if (!s) return null;
  const eqStr = (e) => (e.equip ? ['band', 'smith', 'belt'].filter((k) => e.equip[k]).join(' · ') : '');
  const edit = () => { setActive(sessionToActive(S, s)); goTab('gym'); closeSheet(); };
  const del = () => {
    if (!confirm('Delete this workout? Its logged sets will be removed. This can’t be undone.')) return;
    update((st) => { st.sessions = st.sessions.filter((x) => x.id !== id); });
    toast('Workout deleted'); openSheet(<WorkoutHistorySheet />);
  };
  return (<>
    <h2>{s.name}</h2><p className="sub">{fmtDay(s.date)}</p>
    <div className="card tight">
      {(s.exercises || []).map((e, i) => {
        const logged = (e.sets || []).filter((x) => x.reps != null || x.weight != null);
        const eq = eqStr(e);
        return (
          <div key={i} className="row" style={{ padding: '8px 0' }}>
            <div className="main">
              <div className="t" style={{ fontSize: 14 }}>{exDef(S, e.key).name}</div>
              <div className="s">{logged.length ? logged.map((x) => `${x.weight ?? '–'}×${x.reps ?? '–'}`).join(', ') : 'not logged'}{eq ? ' · ' + eq : ''}{e.pain && e.pain !== 'none' ? ' · ⚠ ' + e.pain : ''}</div>
            </div>
          </div>
        );
      })}
      {s.cardio && <div className="small muted" style={{ padding: '6px 0 0' }}>Cardio: {(CARDIO_TYPES.find((c) => c.id === s.cardio.type) || {}).name}{s.cardio.duration ? ' · ' + s.cardio.duration + ' min' : ''}</div>}
      {s.ab && <div className="small muted" style={{ padding: '2px 0 0' }}>Ab circuit ✓</div>}
      {s.note && <div className="small" style={{ padding: '6px 0 0' }}>{s.note}</div>}
    </div>
    <button className="btn block" onClick={edit}><Icon name="edit" /> Edit this workout</button>
    <div className="spacer" />
    <button className="btn ghost danger block" onClick={del}>Delete workout</button>
    <div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>Close</button>
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
    <Field label={`Weight (${S.profile.bodyUnit || S.profile.weightUnit})`}><input className="input" type="number" inputMode="decimal" value={f.weight} onChange={set('weight')} /></Field>
    {MFIELDS.map((fl) => <Field key={fl.k} label={`${fl.label} (${S.profile.measureUnit})`} hint={fl.hint}><input className="input" type="number" inputMode="decimal" value={f[fl.k]} onChange={set(fl.k)} /></Field>)}
    <button className="btn primary block" onClick={save}>Save measurements</button>
  </>);
}
function compressImage(file, max = 720, q = 0.62) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      let { width: w, height: h } = img;
      if (w > h && w > max) { h = (h * max) / w; w = max; } else if (h > max) { w = (w * max) / h; h = max; }
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', q));
    }; img.src = r.result; };
    r.readAsDataURL(file);
  });
}
export function PhotoSheet() {
  const { photos, savePhotos, closeSheet, toast } = useStore();
  const [view, setView] = useState('Front'); const [date, setDate] = useState(today()); const [url, setUrl] = useState(null);
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
  const p = photos.find((x) => x.id === id); if (!p) return null;
  const del = () => { if (!confirm('Delete this photo?')) return; savePhotos(photos.filter((x) => x.id !== id)); toast('Photo deleted'); closeSheet(); };
  return (<>
    <h2>{p.view}</h2><p className="sub">{fmtDay(p.date)}</p>
    <img src={p.dataUrl} alt="" style={{ width: '100%', borderRadius: 14 }} />
    <div className="spacer" /><button className="btn danger block" onClick={del}>Delete photo</button>
    <div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>Close</button>
  </>);
}

/* ---- supplements -------------------------------------------------------- */
function suppByTime(list) {
  const order = { Morning: 0, Afternoon: 1, Evening: 2, Anytime: 3 };
  const groups = {};
  list.filter((s) => s.active).sort((a, b) => (order[a.time] - order[b.time]) || (a.order - b.order)).forEach((s) => { (groups[s.time || 'Anytime'] ||= []).push(s); });
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
      <div key={tm}><div className="small muted" style={{ margin: '6px 2px 2px', fontWeight: 800 }}>{tm}</div>
        {groups[tm].map((s) => <div key={s.id} className={cx('check', log[s.id] && 'on')} onClick={() => toggle(s.id)}><div className="box"><Icon name="check" /></div><div className="lbl">{s.name}{s.dose && <span className="sub"> {s.dose}</span>}</div></div>)}
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
        <div className="end"><button className="btn sm ghost" onClick={() => pause(s.id)}>{s.active ? 'Pause' : 'Resume'}</button></div></div>
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
  const bodyUnit = p.bodyUnit || p.weightUnit || 'lb';
  const [f, setF] = useState({ name: p.name, h: p.heightIn ?? '', sw: p.startWeight ?? '', gw: p.goalWeight ?? '', sd: p.startDate });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = () => { update((s) => { s.profile.name = f.name; s.profile.heightIn = numOr(f.h); s.profile.startWeight = numOr(f.sw); s.profile.goalWeight = numOr(f.gw); s.profile.startDate = f.sd || s.profile.startDate; }); toast('Profile saved'); closeSheet(); };
  return (<>
    <h2>Profile</h2><p className="sub">Used for trends — nothing leaves your device.</p>
    <Field label="Name"><input className="input" value={f.name} onChange={set('name')} placeholder="First name" /></Field>
    <div className="grid2">
      <Field label="Height (in)"><input className="input" type="number" value={f.h} onChange={set('h')} /></Field>
      <Field label={`Start weight (${bodyUnit})`}><input className="input" type="number" value={f.sw} onChange={set('sw')} /></Field>
      <Field label="Goal weight (opt)"><input className="input" type="number" value={f.gw} onChange={set('gw')} /></Field>
      <Field label="Program start"><input className="input" type="date" value={f.sd} onChange={set('sd')} /></Field>
    </div>
    <Field label="Body-weight unit" hint="For weigh-ins & measurements. Lifting weight is set per workout.">
      <div className="seg">
        <button className={bodyUnit === 'lb' ? 'on' : ''} onClick={() => update((s) => { s.profile.bodyUnit = 'lb'; })}>lb</button>
        <button className={bodyUnit === 'kg' ? 'on' : ''} onClick={() => update((s) => { s.profile.bodyUnit = 'kg'; })}>kg</button>
      </div>
    </Field>
    <Field label="Measurement unit">
      <div className="seg">
        <button className={S.profile.measureUnit === 'in' ? 'on' : ''} onClick={() => update((s) => { s.profile.measureUnit = 'in'; })}>inches</button>
        <button className={S.profile.measureUnit === 'cm' ? 'on' : ''} onClick={() => update((s) => { s.profile.measureUnit = 'cm'; })}>cm</button>
      </div>
    </Field>
    <button className="btn primary block" onClick={save}>Save</button>
  </>);
}

/* ---- EXERCISE DATABASE picker + custom creator -------------------------- */
export function ExercisePickerSheet({ title = 'Add exercise', onPick, allowCustom = true }) {
  const { S, openSheet } = useStore();
  const [q, setQ] = useState('');
  const [grp, setGrp] = useState('all');
  const list = exList(S).filter((e) => (grp === 'all' || e.group === grp) &&
    (!q || e.name.toLowerCase().includes(q.toLowerCase()) || (e.muscles || '').toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (<>
    <h2>{title}</h2><p className="sub">Search the exercise database — tracking history follows each exercise.</p>
    <input className="input" placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
    <div className="seg" style={{ margin: '12px 0' }}>
      {[['all', 'All'], ['lower', 'Lower'], ['upper', 'Upper'], ['core', 'Core']].map(([id, l]) => <button key={id} className={grp === id ? 'on' : ''} onClick={() => setGrp(id)}>{l}</button>)}
    </div>
    {allowCustom && <button className="btn sm block" style={{ marginBottom: 10 }} onClick={() => openSheet(<CustomExerciseSheet onCreate={(k) => onPick(k)} />)}><Icon name="plus" /> Create custom exercise</button>}
    <div style={{ maxHeight: '46vh', overflowY: 'auto', margin: '0 -4px' }}>
      {list.map((e) => (
        <div key={e.key} className="row tap" style={{ padding: '11px 4px' }} onClick={() => onPick(e.key)}>
          <div className="ic"><Icon name="dumbbell" /></div>
          <div className="main"><div className="t">{e.name}{e.custom && <span className="pill muted" style={{ marginLeft: 6 }}>custom</span>}</div><div className="s">{e.muscles}</div></div>
          <div className="end muted" style={{ fontSize: 20 }}>＋</div>
        </div>
      ))}
      {!list.length && <div className="empty small">No matches. Try “Create custom exercise”.</div>}
    </div>
  </>);
}
export function CustomExerciseSheet({ onCreate }) {
  const { update, toast } = useStore();
  const [f, setF] = useState({ name: '', group: 'lower', muscles: '' });
  const create = () => {
    if (!f.name.trim()) { toast('Enter a name'); return; }
    const key = slug(f.name);
    update((s) => { (s.customExercises ||= {})[key] = { name: f.name.trim(), group: f.group, cat: f.group === 'lower' ? 'dumbbell' : 'upper', muscles: f.muscles, cues: [], subs: [] }; });
    toast('Exercise created');
    onCreate && onCreate(key);
  };
  return (<>
    <h2>Create custom exercise</h2><p className="sub">It&apos;s saved to your database and tracks like any other.</p>
    <Field label="Name"><input className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Cable Pull-Through" /></Field>
    <Field label="Muscle group"><Select value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })} options={[['lower', 'Lower / Glutes'], ['upper', 'Upper Body'], ['core', 'Core']]} /></Field>
    <Field label="Target muscles (optional)"><input className="input" value={f.muscles} onChange={(e) => setF({ ...f, muscles: e.target.value })} placeholder="e.g. Glutes, hamstrings" /></Field>
    <button className="btn primary block" onClick={create}>Create &amp; add</button>
  </>);
}

/* ---- EDIT WORKOUT (template) -------------------------------------------- */
export function EditWorkoutSheet({ workoutId }) {
  const { S, update, openSheet, closeSheet, toast } = useStore();
  const w = getWorkouts(S).find((x) => x.id === workoutId);
  if (!w) return null;
  const mut = (fn) => update((s) => { const ws = (s.workouts ||= structuredClone(DEFAULT_WORKOUTS)); const wk = ws.find((x) => x.id === workoutId); if (wk) fn(wk, ws); });
  const move = (i, dir) => mut((wk) => { const j = i + dir; if (j < 0 || j >= wk.items.length) return; [wk.items[i], wk.items[j]] = [wk.items[j], wk.items[i]]; });
  const remove = (i) => mut((wk) => { wk.items.splice(i, 1); });
  const setField = (i, k, v) => mut((wk) => { wk.items[i][k] = v === '' ? undefined : +v; });
  const addExercise = (key) => { mut((wk) => { wk.items.push({ key, sets: 3, min: 8, max: 10 }); }); openSheet(<EditWorkoutSheet workoutId={workoutId} />); };
  const swap = (i, key) => { mut((wk) => { wk.items[i].key = key; }); openSheet(<EditWorkoutSheet workoutId={workoutId} />); };
  const del = () => { if (!confirm('Delete this workout? (Your logged history is kept.)')) return; update((s) => { s.workouts = (s.workouts || structuredClone(DEFAULT_WORKOUTS)).filter((x) => x.id !== workoutId); }); toast('Workout deleted'); closeSheet(); };
  return (<>
    <h2>Edit workout</h2><p className="sub">Reorder, swap or add — logged history stays with each exercise.</p>
    <Field label="Name"><input className="input" value={w.name} onChange={(e) => mut((wk) => { wk.name = e.target.value; })} /></Field>
    <Field label="Type — sets its warm-up &amp; cooldown"><Select value={w.group || 'lower'} onChange={(e) => mut((wk) => { wk.group = e.target.value; })} options={[['lower', 'Lower body'], ['upper', 'Upper body']]} /></Field>
    <div className="section-title" style={{ marginLeft: 0 }}>Exercises</div>
    {w.items.map((it, i) => (
      <div key={i} className="card tight" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1, fontWeight: 700 }}>{exDef(S, it.key).name}</div>
          <button className="btn sm ghost" style={{ padding: '6px 9px' }} onClick={() => move(i, -1)}>↑</button>
          <button className="btn sm ghost" style={{ padding: '6px 9px' }} onClick={() => move(i, 1)}>↓</button>
          <button className="btn sm ghost danger" style={{ padding: '6px 9px' }} onClick={() => remove(i)}>✕</button>
        </div>
        <div className="grid3">
          <Field label="Sets"><input className="input" type="number" value={it.sets ?? ''} onChange={(e) => setField(i, 'sets', e.target.value)} /></Field>
          <Field label="Min reps"><input className="input" type="number" value={it.min ?? ''} onChange={(e) => setField(i, 'min', e.target.value)} /></Field>
          <Field label="Max reps"><input className="input" type="number" value={it.max ?? ''} onChange={(e) => setField(i, 'max', e.target.value)} /></Field>
        </div>
        <button className="btn sm ghost block" onClick={() => openSheet(<ExercisePickerSheet title="Swap exercise" onPick={(k) => swap(i, k)} />)}>Swap exercise</button>
      </div>
    ))}
    <button className="btn block" onClick={() => openSheet(<ExercisePickerSheet title="Add exercise" onPick={(k) => addExercise(k)} />)}><Icon name="plus" /> Add exercise</button>
    <div className="spacer" />
    <button className="btn primary block" onClick={() => { toast('Workout saved'); closeSheet(); }}>Done</button>
    <div className="spacer" />
    <button className="btn ghost danger block" onClick={del}>Delete workout</button>
  </>);
}

/* ---- exercise menu (in-session swap) / history / library ---------------- */
export function ExMenuSheet({ idx }) {
  const { S, active, setActive, closeSheet, openSheet } = useStore();
  const ex = active.exercises[idx];
  const e = exDef(S, ex.key);
  const subs = (e.subs || []).map((s) => [s, exDef(S, s).name]);
  const swapTo = (key) => {
    setActive((a) => {
      const slot = a.exercises[idx];
      const prev = lastPerf(S, key);
      const prevW = prev ? Math.max(...prev.ex.sets.filter((s) => s.reps).map((s) => +s.weight || 0)) : (S.exState[key]?.weight || '');
      slot.key = key;
      slot.sets = slot.sets.map(() => ({ weight: prevW || '', reps: '' }));
      slot.pain = 'none';
      return a;
    });
    closeSheet();
  };
  const setPain = (v) => setActive((a) => { a.exercises[idx].pain = v; return a; });
  const [note, setNote] = useState(ex.note || '');
  const done = () => { setActive((a) => { a.exercises[idx].note = note; return a; }); closeSheet(); };
  const remove = () => { if (!confirm('Remove this exercise from today’s workout?')) return; setActive((a) => { a.exercises.splice(idx, 1); return a; }); closeSheet(); };
  return (<>
    <h2>{e.name}</h2><p className="sub">Swap keeps each exercise&apos;s own history</p>
    <Field label="Quick swap">
      <div className="chips">{subs.map(([v, l]) => <button key={v} className="chip" onClick={() => swapTo(v)}>{l}</button>)}</div>
      <button className="btn sm ghost block" style={{ marginTop: 10 }} onClick={() => openSheet(<ExercisePickerSheet title="Swap exercise" onPick={(k) => swapTo(k)} />)}>Browse all exercises →</button>
    </Field>
    <div className="hint" style={{ marginBottom: 14 }}>Swapping logs under the new exercise — the one you swap out keeps all its past data and returns intact if you switch back.</div>
    <Field label="Pain / discomfort" hint="Pain is a signal to stop or swap — not to push through.">
      <div className="chips">{[['none', 'None'], ['mild', 'Mild'], ['pain', 'Pain'], ['stop', 'Stop']].map(([v, l]) => <button key={v} className={cx('chip', ex.pain === v && 'on')} onClick={() => setPain(v)}>{l}</button>)}</div>
    </Field>
    <Field label="Notes"><textarea value={note} onChange={(e2) => setNote(e2.target.value)} placeholder="e.g. felt strong, tweak seat height" /></Field>
    <button className="btn primary block" onClick={done}>Done</button>
    <div className="spacer" />
    <button className="btn ghost danger block" onClick={remove}>Remove exercise from workout</button>
  </>);
}

export function ExHistorySheet({ exKey }) {
  const { S, closeSheet } = useStore();
  const e = exDef(S, exKey);
  const all = allPerf(S, exKey).slice().reverse();
  const best = bestSet(S, exKey);
  const series = topSetSeries(S, exKey);
  const item = findItem(S, exKey);
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
    {all.length ? all.map(({ date, ex }, i) => {
      const eq = ex.equip ? ['band', 'smith', 'belt'].filter((k) => ex.equip[k]).join(' · ') : '';
      return (
        <div key={i} className="row"><div className="main">
          <div className="t">{ex.sets.filter((s) => s.reps).map((s) => `${s.weight || '–'}×${s.reps}`).join(', ')}</div>
          <div className="s">{fmtDay(date)}{eq ? ' · ' + eq : ''}{ex.pain && ex.pain !== 'none' ? ' · ⚠ ' + ex.pain : ''}{ex.note ? ' · ' + ex.note : ''}</div>
        </div></div>
      );
    }) : <div className="empty small">No history yet.</div>}
    <div className="spacer" /><button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}

export function LibrarySheet() {
  const { S, openSheet, closeSheet } = useStore();
  return (<>
    <h2>Exercise Library</h2><p className="sub">Your workouts, form cues &amp; swaps</p>
    {getWorkouts(S).map((w) => (
      <div key={w.id}>
        <div className="section-title" style={{ marginLeft: 0 }}>{w.name}</div>
        {w.items.map((it) => (
          <div key={it.key} className="row tap" onClick={() => openSheet(<ExInfoSheet exKey={it.key} />)}>
            <div className="ic"><Icon name="dumbbell" /></div>
            <div className="main"><div className="t">{exDef(S, it.key).name}</div><div className="s">{it.sets}×{it.min}–{it.max}{it.perSide ? ' /side' : ''} · {exDef(S, it.key).muscles}</div></div>
            <div className="end muted">›</div>
          </div>
        ))}
      </div>
    ))}
    <button className="btn sm ghost block" style={{ margin: '10px 0' }} onClick={() => openSheet(<ExercisePickerSheet title="Browse exercise database" onPick={(k) => openSheet(<ExInfoSheet exKey={k} />)} allowCustom={false} />)}>Browse full exercise database →</button>
    <button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}
export function ExInfoSheet({ exKey }) {
  const { S, closeSheet } = useStore();
  const e = exDef(S, exKey);
  const subs = (e.subs || []).map((s) => exDef(S, s).name);
  return (<>
    <h2>{e.name}</h2><p className="sub">{e.muscles}</p>
    {e.cues && e.cues.length > 0 && <div className="card tight"><div className="small muted" style={{ fontWeight: 800, marginBottom: 6 }}>Form cues</div><ul className="hint">{e.cues.map((c) => <li key={c}>{c}</li>)}</ul></div>}
    {subs.length > 0 && <div className="card tight"><div className="small muted" style={{ fontWeight: 800, marginBottom: 6 }}>Swaps if needed</div><div className="chips">{subs.map((s) => <span key={s} className="chip">{s}</span>)}</div></div>}
    <div className="hint">If a movement causes pain, stop or substitute — pain isn&apos;t something to push through.</div>
    <div className="spacer" /><button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}

/* ---- weekly review + finish summary ------------------------------------- */
export function ReviewSheet() {
  const { S, openSheet, closeSheet } = useStore();
  const sc = recompScore(S); const b = sc.bundle; const status = weekStatus(S, b); const t = trendSummary(S);
  const pain = b.sessions.some((s) => (s.exercises || []).some((e) => e.pain && e.pain !== 'none'));
  const progressed = b.sessions.some((s) => (s.exercises || []).some((e) => { const it = findItem(S, e.key); return e.sets.filter((x) => x.reps).length && e.sets.filter((x) => x.reps).every((x) => +x.reps >= it.max); }));
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
      <div className="metric tap" onClick={() => openSheet(<WorkoutHistorySheet />)}><div className="lbl"><div className="t">Strength workouts</div><div className="s">tap to view, edit or delete</div></div><div className="val">{b.sessions.length} / {S.profile.strengthTarget} ›</div></div><div className="hairline" />
      <Q label="Pilates / Yoga" val={`${b.pilatesYoga.length} / ${S.profile.pilatesTarget}`} />
      <Q label="Step-goal days" val={`${b.stepDays} / 7`} />
      <Q label="Avg daily steps" val={b.stepAvg ? b.stepAvg.toLocaleString() : '—'} />
      <Q label="StairMaster" val={`${b.stair}`} />
      <Q label="Treadmill" val={`${b.tread}`} />
      <Q label="Days took supplements" val={b.supp.possibleDays ? `${b.supp.days}/${b.supp.possibleDays}` : '—'} />
      <Q label="Weekly avg weight" val={b.avgWeight ? wt(S, b.avgWeight) : '—'} />
      <Q label="Weight trend" val={t.delta != null ? `${t.delta <= 0 ? '▼' : '▲'} ${Math.abs(t.delta)} ${S.profile.bodyUnit || S.profile.weightUnit}/wk` : '—'} />
      <Q label="Lifts progressed" val={progressed ? 'Yes 💪' : 'Held steady'} />
      <div className="metric"><div className="lbl"><div className="t">Pain recorded</div></div><div className="val">{pain ? <span className="pill danger">Yes</span> : 'None'}</div></div>
    </div>
    <button className="btn block" onClick={closeSheet}>Close</button>
  </>);
}
export function FinishSummary({ session }) {
  const { S, closeSheet } = useStore();
  const sc = recompScore(S); const rot = weekRotation(S);
  return (<>
    <h2>Workout saved 🎉</h2><p className="sub">{session.name} · {fmtDay(session.date)}</p>
    <div className="card score-card">
      <div className="ring-wrap">
        <div className="ring"><Ring pct={sc.total / 100} size={88} stroke={9} /><div className="num"><b>{sc.total}</b><span>score</span></div></div>
        <div className="small" style={{ opacity: 0.94 }}>{rot.next ? <>Next up in your rotation: <b>{rot.next.name}</b></> : 'Full strength rotation complete this week! 🔥'}</div>
      </div>
    </div>
    <div className="section-title" style={{ marginLeft: 0 }}>Next-session recommendations</div>
    {session.exercises.map((e, i) => <div key={i} style={{ marginBottom: 10 }}><div className="small" style={{ fontWeight: 700, margin: '0 2px 5px' }}>{exDef(S, e.key).name}</div><Rec prog={progression(S, findItem(S, e.key), e)} /></div>)}
    <div className="spacer" /><button className="btn primary block" onClick={closeSheet}>Done</button>
  </>);
}
