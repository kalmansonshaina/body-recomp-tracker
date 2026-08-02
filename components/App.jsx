'use client';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StoreProvider, useStore } from '@/lib/store';
import { Icon, cx } from './ui';
import { Home, Dashboard, Workout, Log, Progress, More } from './screens';
import { IdentityPage, IdentityReveal } from './identity';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'gym', label: 'Gym', icon: 'dumbbell' },
  { id: 'movement', label: 'Movement', icon: 'yoga' },
  { id: 'progress', label: 'Progress', icon: 'trend' },
  { id: 'more', label: 'More', icon: 'more' },
];
const SCREENS = { home: Home, dashboard: Dashboard, gym: Workout, movement: Log, identity: IdentityPage, progress: Progress, more: More };

function SheetHost() {
  const { sheet, closeSheet } = useStore();
  return (
    <AnimatePresence>
      {sheet && (
        <motion.div className="sheet-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}>
          <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
            <div className="grab" />
            {sheet}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast() {
  const { toastMsg } = useStore();
  return (
    <AnimatePresence>
      {toastMsg && (
        <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
          {toastMsg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Shell() {
  const { ready, active } = useStore();
  const [tab, setTab] = useState('home');
  const resumed = useRef(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';
      navigator.serviceWorker.register(`${BP}/sw.js`, { scope: `${BP}/` }).catch(() => {});
    }
  }, []);

  // If there's an in-progress workout when the app opens, drop straight into it
  // so you never land on Home and accidentally start a fresh session.
  useEffect(() => {
    if (ready && active && !resumed.current) { resumed.current = true; setTab('gym'); }
  }, [ready, active]);

  if (!ready) return null;
  const Screen = SCREENS[tab] || SCREENS.home;

  const atHome = tab === 'home';
  return (
    <>
      <div id="app" className={atHome ? 'at-home' : ''}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
            <Screen go={setTab} />
          </motion.div>
        </AnimatePresence>
      </div>
      {!atHome && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <button key={t.id} className={cx('tab', tab === t.id && 'active')} onClick={() => setTab(t.id)}>
              <motion.span whileTap={{ scale: 0.8 }} style={{ display: 'grid', placeItems: 'center' }}><Icon name={t.icon} /></motion.span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
      <IdentityReveal />
      <SheetHost />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
