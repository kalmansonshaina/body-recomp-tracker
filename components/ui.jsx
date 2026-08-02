'use client';
import { motion, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

export const cx = (...a) => a.filter(Boolean).join(' ');

/* ---- icons (inner markup, 24×24) ---------------------------------------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  dumbbell: '<path d="M6.5 6.5v11M4 8.5v7M17.5 6.5v11M20 8.5v7M6.5 12h11"/>',
  log: '<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2.4"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8M20 16v-3"/>',
  more: '<circle cx="6" cy="6" r="1.6"/><circle cx="6" cy="18" r="1.6"/><circle cx="18" cy="6" r="1.6"/><circle cx="18" cy="18" r="1.6"/><circle cx="12" cy="12" r="1.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M4 12.5l5 5 11-11"/>',
  flame: '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s3 1 4-6z"/>',
  walk: '<circle cx="13" cy="4" r="1.7"/><path d="M11 8l3 2 1 4M8 21l3-6-1-5-3 3M14 14l3 3"/>',
  stairs: '<path d="M3 20h4v-4h4v-4h4V8h4V4"/>',
  yoga: '<circle cx="12" cy="4.5" r="1.7"/><path d="M12 7v6M6 20l6-4 6 4M7 12h10"/>',
  pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8l2.5 3.5h-5z"/><circle cx="12" cy="15" r="1"/>',
  cam: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.2"/>',
  heart: '<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.3 9.3l6.1-.7z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h12"/>',
  clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/>',
  bolt: '<path d="M13 3L5 13h6l-1 8 8-11h-6z"/>',
  edit: '<path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  sparkle: '<path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z"/><path d="M18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z"/>',
  heartfill: '<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z" fill="currentColor" stroke="none"/>',
};
export function Icon({ name }) {
  return <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: P[name] || '' }} />;
}

/* ---- motion helpers ----------------------------------------------------- */
export const Reveal = ({ children, delay = 0, className, style, onClick }) => (
  <motion.div className={className} style={style} onClick={onClick}
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.38, delay, ease: [0.2, 0.8, 0.2, 1] }}>
    {children}
  </motion.div>
);

export const Tap = ({ children, className, onClick, style }) => (
  <motion.div className={className} style={style} onClick={onClick}
    whileTap={{ scale: 0.975 }} transition={{ duration: 0.08 }}>
    {children}
  </motion.div>
);

export function CountUp({ value, duration = 0.9 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [value, duration]);
  return <>{n}</>;
}

/* ---- score orb ---------------------------------------------------------- */
export function Orb({ total }) {
  return (
    <motion.div className="orb" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
      <motion.div className="glow" animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="glow2" animate={{ scale: [0.98, 1.08, 0.98], opacity: [0.7, 1, 0.7] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="score">
        <b><CountUp value={total} /><em>/100</em></b>
        <span>Weekly Recomp Score</span>
      </div>
    </motion.div>
  );
}

/* ---- ring --------------------------------------------------------------- */
export function Ring({ pct, size = 112, stroke = 11, prog = '#fff', track = 'rgba(255,255,255,.28)' }) {
  const r = size / 2 - stroke, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={prog} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, pct))) }}
        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

/* ---- bar ---------------------------------------------------------------- */
export function Bar({ pct, klass = '' }) {
  return (
    <div className={cx('bar', klass)}>
      <motion.i initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} />
    </div>
  );
}

export const Pill = ({ tone = 'muted', children }) => <span className={cx('pill', tone)}>{children}</span>;

/* ---- charts (inline SVG) ------------------------------------------------ */
export function Sparkline({ values }) {
  if (!values.length) return null;
  const w = 320, h = 90, pad = 8;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const x = (i) => pad + (i / (values.length - 1 || 1)) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `M${x(0)},${h} L${values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' L')} L${x(values.length - 1)},${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#sg)" />
      <motion.polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3.5" fill="var(--accent)" />
    </svg>
  );
}
export function WeightChart({ points, rollingAvg }) {
  if (points.length < 2) return <Sparkline values={points.map((p) => p.w)} />;
  const w = 340, h = 150, pad = 12;
  const vals = points.map((p) => p.w);
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const d0 = +new Date(points[0].date), dN = +new Date(points[points.length - 1].date), spanD = dN - d0 || 1;
  const x = (dt) => pad + ((+new Date(dt) - d0) / spanD) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const roll = points.map((p) => `${x(p.date).toFixed(1)},${y(rollingAvg(p.date) ?? p.w).toFixed(1)}`);
  const rollLine = 'M' + roll.join(' L');
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {points.map((p, i) => <circle key={i} cx={x(p.date).toFixed(1)} cy={y(p.w).toFixed(1)} r="2.6" fill="var(--faint)" />)}
        <motion.path d={rollLine} fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div className="small muted center" style={{ marginTop: 4 }}>Dots = daily weigh-ins · line = 7-day average</div>
    </>
  );
}

/* ---- color-coded recommendation ---------------------------------------- */
export function Rec({ prog }) {
  return (
    <motion.div className={cx('rec', prog.rec.klass)} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
      <span className="em">{prog.rec.emoji}</span>
      <div>
        <div className="rt">{prog.rec.label}</div>
        <div className="rd">{prog.detail}</div>
      </div>
    </motion.div>
  );
}

/* ---- form helpers ------------------------------------------------------- */
export const Field = ({ label, hint, children }) => (
  <div className="field"><label>{label}</label>{children}{hint && <div className="hint" style={{ marginTop: 5 }}>{hint}</div>}</div>
);
export const Select = ({ value, onChange, options, id }) => (
  <select id={id} value={value} onChange={onChange}>
    {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}
  </select>
);
