'use client';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { defaultState } from './data';

const KEY = 'brt.state.v1';
const PKEY = 'brt.photos.v1';
const AKEY = 'brt.active.v1';

const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    const d = defaultState();
    return { ...d, ...s, profile: { ...d.profile, ...(s.profile || {}) } };
  } catch { return defaultState(); }
}
function loadJSON(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } }

export function StoreProvider({ children }) {
  const [S, setS] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [active, setActiveState] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const ready = S != null;
  const toastTimer = useRef();

  useEffect(() => {
    setS(load());
    setPhotos(loadJSON(PKEY, []));
    setActiveState(loadJSON(AKEY, null));
  }, []);

  useEffect(() => { if (S) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Storage full — export a backup'); } } }, [S]); // eslint-disable-line
  useEffect(() => { if (ready) { try { localStorage.setItem(AKEY, JSON.stringify(active)); } catch {} } }, [active, ready]);

  const toast = useCallback((m) => {
    setToastMsg(m); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  const update = useCallback((fn) => setS((prev) => { const s = structuredClone(prev); fn(s); return s; }), []);
  const setActive = useCallback((fnOrVal) => setActiveState((prev) => {
    if (typeof fnOrVal === 'function') { const a = prev ? structuredClone(prev) : prev; return fnOrVal(a); }
    return fnOrVal;
  }), []);

  const savePhotos = useCallback((arr) => {
    try { localStorage.setItem(PKEY, JSON.stringify(arr)); setPhotos(arr); return true; }
    catch { toast('Not enough space to save photo'); return false; }
  }, [toast]);

  const openSheet = useCallback((node) => setSheet(() => node), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const value = { S, ready, photos, active, sheet, toastMsg,
    update, setActive, savePhotos, openSheet, closeSheet, toast, setS, setPhotos };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
