# Body Recomp Tracker

A flexible **body-recomposition tracker** built with **Next.js 14 + React + Framer Motion**,
deployed on **Vercel**. It's an installable, offline-capable PWA — add it to your phone's home
screen and use it at the gym. All data stays on your device (localStorage); no accounts, no server.

## Features

- **Body Recomp Score** — one animated weekly score /100 from the habits that drive results
  (strength 40 · Pilates/yoga 20 · steps 15 · cardio 10 · supplements 10 · tracking 5).
- **Four-workout strength rotation** (Lower A → Upper A → Lower B → Upper B) that resets weekly,
  with next-workout recommendations.
- **Set/rep/weight logging** with an effort ("reps in the tank") selector, pain flags, notes and
  on-the-fly substitutions.
- **Color-coded next-session recommendation on every exercise** (double progression):
  - 🟢 Increase weight next session
  - 🟡 Keep the same weight and add reps
  - 🔵 Maintain current weight
  - 🔴 Reduce weight or modify form
- **Pilates/yoga**, **StairMaster/treadmill/walk** cardio, optional **ab circuit**.
- **Steps**, **weight** (7-day rolling average + trend chart), **measurements** (waist-to-hip).
- **Supplement tracker** with a daily checklist and adherence %.
- **One-minute daily check-in**, **weekly review**, **progress photos**, **exercise library**.
- Motion throughout (Framer Motion), **Manrope** type, and a soft gradient "aura" aesthetic.

## Tech

- Next.js 14 (App Router) · React 18 · Framer Motion · Manrope via `next/font`
- Fully client-side state in `localStorage`; a runtime service worker (`public/sw.js`) caches the
  shell for offline use.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy

Deploys to Vercel (auto-detected as a Next.js app). Push to `main` and Vercel builds & ships.

> **Apple Health note:** a web app can't read Apple Health, so steps are entered manually
> (one quick tap-in). Everything else works fully offline.
