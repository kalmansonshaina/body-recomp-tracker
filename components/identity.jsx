'use client';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Icon, Field, Select, cx } from './ui';
import {
  today, fmtDay, uid, defaultIdentity,
  idCats, idCat, idAffs, idToday, idFeaturedCat, idDailyAff, idReflectionPrompt, idRead,
} from '@/lib/data';

// soft per-category gradients (calm, feminine, elevated)
const GRAD = {
  beauty: ['#f6cdd9', '#e3a6c6'], glamour: ['#dcc7f4', '#b79ae8'], wealth: ['#ecdcaa', '#cdb26c'],
  health: ['#c2e8cf', '#8fcfa6'], body: ['#f8d0b6', '#eaa987'], confidence: ['#c2d8f4', '#93b7ea'],
  relationships: ['#f7c9dc', '#ef9dc0'], future: ['#f9d6b6', '#f2b07f'],
};
const gradOf = (id) => GRAD[id] || ['#cdd8f0', '#a9bfe6'];
const idOK = (s) => { if (!s.identity) s.identity = defaultIdentity(); return s.identity; };

/* ---- collapsed dashboard card ------------------------------------------- */
export function IdentityCollapsedCard() {
  const { S, openIdentity } = useStore();
  const cat = idFeaturedCat(S);
  if (!cat) return null;
  const read = idRead(S);
  const g = gradOf(cat.id);
  return (
    <motion.button className="id-collapsed" layoutId="id-featured" whileTap={{ scale: 0.99 }}
      style={{ background: `linear-gradient(120deg, ${g[0]}44, ${g[1]}55)` }}
      onClick={() => openIdentity(cat.id, 'id-featured')}
      aria-label={`Today's identity, ${cat.name}. Tap to reveal.`}>
      <span className="idc-label"><span className="idc-title">Today’s Identity</span> · {cat.name}</span>
      <span className="idc-mark">{read ? '✓' : '✦'}</span>
    </motion.button>
  );
}

/* ---- full-screen reveal (opened from a collapsed card via shared layout) - */
export function IdentityReveal() {
  const { S, identityOpen, closeIdentity, openSheet, update } = useStore();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {identityOpen && (
        <RevealCard key="reveal" S={S} info={identityOpen} reduce={reduce}
          onClose={closeIdentity} openSheet={openSheet} update={update} />
      )}
    </AnimatePresence>
  );
}
function RevealCard({ S, info, reduce, onClose, openSheet, update }) {
  const { catId, layoutId } = info;
  const cat = idCat(S, catId);
  const aff = idDailyAff(S, catId);
  const g = gradOf(catId);
  const another = () => update((s) => { const I = idOK(s); const d = (I.daily[today()] ||= {}); (d.pick ||= {})[catId] = (d.pick[catId] || 0) + 1; });
  const fav = () => aff && update((s) => { const a = idOK(s).affirmations.find((x) => x.id === aff.id); if (a) a.favorite = !a.favorite; });
  const dragProps = reduce ? {} : { drag: true, dragSnapToOrigin: true, dragElastic: 0.5,
    onDragEnd: (e, i) => { if (i.offset.y > 110 && i.offset.y > Math.abs(i.offset.x)) onClose(); else if (Math.abs(i.offset.x) > 90) another(); } };
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  return (
    <motion.div className="id-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="id-full" layoutId={reduce ? undefined : layoutId}
        initial={reduce ? { opacity: 0 } : false} animate={reduce ? { opacity: 1 } : {}} exit={reduce ? { opacity: 0 } : {}}
        style={{ background: `linear-gradient(160deg, ${g[0]}, ${g[1]})` }}
        onClick={onClose} {...dragProps}>
        <button className="id-close" onClick={stop(onClose)} aria-label="Close"><Icon name="close" /></button>
        <div className="id-full-inner">
          <motion.div className="id-cat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.14, duration: 0.4 }}>
            <span className="id-cat-emoji">{cat?.emoji}</span> {cat?.name}
          </motion.div>
          <motion.blockquote className="id-aff serif" key={aff?.id}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 0.28, duration: 0.55 }}>
            {aff ? `“${aff.text}”` : 'Add an affirmation to this category in your library.'}
          </motion.blockquote>
          <motion.div className="id-date" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.5 }}>{fmtDay(today())}</motion.div>
        </div>
        <motion.div className="id-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.55 }} onClick={(e) => e.stopPropagation()}>
          <button className="id-act" onClick={stop(fav)} aria-label="Favorite">{aff?.favorite ? '♥' : '♡'}</button>
          <button className="id-act wide" onClick={stop(another)}>another</button>
          <button className="id-act" onClick={stop(() => { if (aff) openSheet(<AffEditSheet affId={aff.id} />); })} aria-label="Edit">✎</button>
        </motion.div>
        <div className="id-swipe-hint">tap anywhere · swipe down to close</div>
      </motion.div>
    </motion.div>
  );
}

/* ---- Identity page (full "Today's Identity" + reflection + library) ----- */
export function IdentityPage({ go }) {
  const { S, openIdentity, openSheet, update } = useStore();
  const items = idToday(S);
  const read = idRead(S);
  const prompt = idReflectionPrompt();
  const day = S.identity?.daily?.[today()] || {};
  const [reflection, setReflection] = useState(day.reflection || '');
  const saveReflection = () => update((s) => { const I = idOK(s); (I.daily[today()] ||= {}).reflection = reflection; });
  const toggleRead = () => update((s) => { const I = idOK(s); const d = (I.daily[today()] ||= {}); d.read = !d.read; });

  return (<>
    <header className="appbar"><div><h1>Identity</h1><div className="sub">Who you’re becoming</div></div><div className="date">{fmtDay(today())}</div></header>
    <main className="screen id-page">
      <div className="id-page-head">
        <div className="serif id-page-title">Today’s Identity</div>
        <div className="hint" style={{ marginTop: 4 }}>One line from each part of the woman you’re building. Tap any card to sit with it.</div>
      </div>

      {items.map(({ cat, aff }, i) => {
        const g = gradOf(cat.id);
        return (
          <motion.button key={cat.id} className="id-card" layoutId={`id-cat-${cat.id}`}
            style={{ background: `linear-gradient(120deg, ${g[0]}2e, ${g[1]}3a)` }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}
            whileTap={{ scale: 0.99 }} onClick={() => openIdentity(cat.id, `id-cat-${cat.id}`)}>
            <div className="id-card-cat">{cat.emoji} {cat.name}</div>
            <div className="id-card-aff serif">{aff ? `“${aff.text}”` : 'Tap to add an affirmation'}</div>
          </motion.button>
        );
      })}

      <div className={cx('id-read', read && 'on')} onClick={toggleRead}>
        <div className="box"><Icon name="check" /></div>
        <div className="lbl">I read today’s identity</div>
      </div>

      <div className="card id-reflect">
        <div className="card-title"><h2 style={{ fontSize: 15 }}>Reflection</h2><span className="pill muted">optional</span></div>
        <div className="serif id-prompt">{prompt}</div>
        <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} onBlur={saveReflection} placeholder="A few words, or skip it…" style={{ marginTop: 10 }} />
      </div>

      <button className="btn ghost block" onClick={() => openSheet(<ManageIdentitySheet />)} style={{ marginTop: 4 }}><Icon name="sparkle" /> Edit categories &amp; affirmations</button>
      <div className="hint center" style={{ marginTop: 12 }}>Your affirmations are yours — the app never overwrites what you write.</div>
    </main>
  </>);
}

/* ---- library management sheets ------------------------------------------ */
export function ManageIdentitySheet() {
  const { S, update, openSheet, closeSheet } = useStore();
  const cats = (S.identity?.categories || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [f, setF] = useState({ name: '', emoji: '✨' });
  const add = () => { if (!f.name.trim()) return; update((s) => { const I = idOK(s); I.categories.push({ id: 'c_' + uid(), name: f.name.trim(), emoji: f.emoji || '✨', order: I.categories.length, active: true }); }); setF({ name: '', emoji: '✨' }); };
  return (<>
    <h2>Identity library</h2><p className="sub">Edit categories, or tap one to manage its affirmations.</p>
    {cats.map((c) => (
      <div key={c.id} className="row tap" onClick={() => openSheet(<CategoryAffsSheet catId={c.id} />)}>
        <div className="ic" style={{ fontSize: 18 }}>{c.emoji}</div>
        <div className="main"><div className="t">{c.name}</div><div className="s">{idAffs(S, c.id).length} affirmations{c.active === false ? ' · hidden' : ''}</div></div>
        <button className="btn sm ghost" onClick={(e) => { e.stopPropagation(); openSheet(<CategoryEditSheet catId={c.id} />); }}><Icon name="edit" /></button>
      </div>
    ))}
    <div className="hairline" />
    <div className="small muted" style={{ fontWeight: 800, marginBottom: 8 }}>Add category</div>
    <div className="grid2" style={{ gridTemplateColumns: '64px 1fr' }}>
      <Field label="Icon"><input className="input" value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} style={{ textAlign: 'center' }} maxLength={2} /></Field>
      <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Discipline" /></Field>
    </div>
    <button className="btn primary block" onClick={add}>Add category</button>
    <div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>Done</button>
  </>);
}
export function CategoryEditSheet({ catId }) {
  const { S, update, closeSheet } = useStore();
  const c = idCat(S, catId) || {};
  const [f, setF] = useState({ name: c.name || '', emoji: c.emoji || '✨' });
  const save = () => { update((s) => { const x = idOK(s).categories.find((y) => y.id === catId); if (x) { x.name = f.name.trim() || x.name; x.emoji = f.emoji || x.emoji; } }); closeSheet(); };
  const toggleHide = () => { update((s) => { const x = idOK(s).categories.find((y) => y.id === catId); if (x) x.active = x.active === false; }); closeSheet(); };
  const del = () => { if (!confirm('Delete this category and its affirmations?')) return; update((s) => { const I = idOK(s); I.categories = I.categories.filter((y) => y.id !== catId); I.affirmations = I.affirmations.filter((a) => a.catId !== catId); }); closeSheet(); };
  return (<>
    <h2>Edit category</h2><p className="sub">Rename, hide, or remove.</p>
    <div className="grid2" style={{ gridTemplateColumns: '64px 1fr' }}>
      <Field label="Icon"><input className="input" value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} style={{ textAlign: 'center' }} maxLength={2} /></Field>
      <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
    </div>
    <button className="btn primary block" onClick={save}>Save</button>
    <div className="spacer" /><button className="btn ghost block" onClick={toggleHide}>{c.active === false ? 'Show in rotation' : 'Hide from rotation'}</button>
    <div className="spacer" /><button className="btn ghost danger block" onClick={del}>Delete category</button>
  </>);
}
export function CategoryAffsSheet({ catId }) {
  const { S, update, openSheet } = useStore();
  const c = idCat(S, catId) || {};
  const affs = idAffs(S, catId);
  const fav = (id) => update((s) => { const a = idOK(s).affirmations.find((x) => x.id === id); if (a) a.favorite = !a.favorite; });
  const del = (id) => update((s) => { const I = idOK(s); I.affirmations = I.affirmations.filter((x) => x.id !== id); });
  return (<>
    <h2>{c.emoji} {c.name}</h2><p className="sub">Add, edit, favorite or remove affirmations.</p>
    {affs.map((a) => (
      <div key={a.id} className="row">
        <button className="id-fav" onClick={() => fav(a.id)} aria-label="Favorite">{a.favorite ? '♥' : '♡'}</button>
        <div className="main" onClick={() => openSheet(<AffEditSheet affId={a.id} />)} style={{ cursor: 'pointer' }}><div className="t serif" style={{ fontWeight: 500, fontSize: 15 }}>{a.text}</div></div>
        <button className="btn sm ghost danger" onClick={() => del(a.id)}>✕</button>
      </div>
    ))}
    {!affs.length && <div className="empty small">No affirmations yet.</div>}
    <div className="spacer" />
    <button className="btn primary block" onClick={() => openSheet(<AffEditSheet catId={catId} />)}><Icon name="plus" /> Add affirmation</button>
  </>);
}
export function AffEditSheet({ affId, catId }) {
  const { S, update, closeSheet } = useStore();
  const existing = affId ? (S.identity?.affirmations || []).find((a) => a.id === affId) : null;
  const cid = catId || existing?.catId;
  const [text, setText] = useState(existing?.text || '');
  const save = () => {
    const t = text.trim(); if (!t) { closeSheet(); return; }
    update((s) => {
      const I = idOK(s);
      if (existing) { const a = I.affirmations.find((x) => x.id === affId); if (a) a.text = t; }
      else I.affirmations.push({ id: uid(), catId: cid, text: t, favorite: false, custom: true });
    });
    closeSheet();
  };
  return (<>
    <h2>{existing ? 'Edit affirmation' : 'New affirmation'}</h2><p className="sub">{idCat(S, cid)?.emoji} {idCat(S, cid)?.name}</p>
    <Field label="Affirmation"><textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="I am…" style={{ minHeight: 90 }} /></Field>
    <button className="btn primary block" onClick={save}>Save</button>
    <div className="spacer" /><button className="btn ghost block" onClick={closeSheet}>Cancel</button>
  </>);
}
