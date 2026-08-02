'use client';
import dynamic from 'next/dynamic';

// The whole app is client-side (localStorage), so skip SSR entirely.
const App = dynamic(() => import('@/components/App'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="orb" style={{ width: 160, height: 160 }}>
        <div className="glow" /><div className="glow2" />
      </div>
    </div>
  ),
});

export default function Page() {
  return <App />;
}
