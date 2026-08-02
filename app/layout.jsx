import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata = {
  title: 'Body Recomp Tracker',
  description: 'Flexible body-recomposition tracker: strength, cardio, steps, weight, measurements, supplements and a weekly Body Recomp Score.',
  manifest: `${BP}/manifest.webmanifest`,
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Recomp' },
  icons: {
    icon: `${BP}/icons/favicon-64.png`,
    apple: `${BP}/icons/apple-touch-icon.png`,
  },
};

export const viewport = {
  themeColor: '#3f7bff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
