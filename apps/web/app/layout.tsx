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
  title: {
    template: '%s | CartridgeVault',
    default: 'CartridgeVault — Track Your Game Collection',
  },
  description:
    'Track your Nintendo Switch game collection, find deals via DekuDeals, and share with friends. CartridgeVault is the cyberpunk-themed game tracker for you and your crew.',
  keywords: ['nintendo switch', 'game collection', 'game tracker', 'deku deals', 'game deals'],
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
          <main className="relative z-10 min-h-screen pt-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
