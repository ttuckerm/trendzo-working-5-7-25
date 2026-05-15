import './globals.css';
import { Inter, Playfair_Display, DM_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import React from 'react';
import type { ReactNode } from 'react';
import Providers from './providers';
import RootLayout from './_app';
import { StateProvider } from '@/lib/contexts/StateContext';
import FlagProviderClient from '@/components/FlagProviderClient';

// ⬇️ Add this import
import SupabaseUrlShim from './_supabase-url-shim';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', weight: ['400', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Escape Assessment',
  description: 'Manage, customize, and track social media templates with AI-powered predictions and optimization',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function Layout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${inter.className}`}>
        {/* ⬇️ Mount the shim once, near the top of <body> */}
        <SupabaseUrlShim />

        <StateProvider>
          <Providers>
            <RootLayout>
              <FlagProviderClient>
                {children}
              </FlagProviderClient>
            </RootLayout>
          </Providers>
        </StateProvider>
      </body>
    </html>
  );
}
