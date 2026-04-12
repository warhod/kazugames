import type { Metadata } from 'next';
import { Inter, Orbitron, Cinzel, Varela_Round } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/lib/ThemeContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const varelaRound = Varela_Round({
  subsets: ['latin'],
  variable: '--font-varela-round',
  weight: ['400'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kazu.deals'),
  title: {
    template: '%s | KazuDeals',
    default: 'KazuDeals — Switch collections & friend lending',
  },
  description:
    'Track your Nintendo Switch library with DekuDeals prices, build friend groups, and mark games as loanable. KazuDeals is a companion app for crews who lend cartridges and digital-friendly titles — not a DekuDeals replacement.',
  keywords: [
    'nintendo switch',
    'game collection',
    'game lending',
    'friend group',
    'deku deals',
    'kazu deals',
  ],
  openGraph: {
    siteName: 'KazuDeals',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${cinzel.variable} ${varelaRound.variable}`}>
      <body className="font-inter">
        <ThemeProvider>
          <Navbar />
          {/* pt matches Navbar: h-16 + md:hidden subnav h-12 = 7rem below md */}
          <main className="relative z-10 min-h-screen pt-28 md:pt-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
