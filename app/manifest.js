export const dynamic = 'force-static';
export default function manifest() {
  const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return {
    name: 'Body Recomp Tracker',
    short_name: 'Recomp',
    description: 'Flexible strength, cardio, steps, weight, measurements, supplements and a weekly Body Recomp Score.',
    start_url: `${BP}/`,
    scope: `${BP}/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#eef3fb',
    theme_color: '#3f7bff',
    icons: [
      { src: `${BP}/icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${BP}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${BP}/icons/icon-maskable-192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: `${BP}/icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
