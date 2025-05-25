import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import Providers from './providers';
import RootLayout from './_app';
import { StateProvider } from '@/lib/contexts/StateContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trendzo | AI-Powered Social Media Template Management',
  description: 'Manage, customize, and track social media templates with AI-powered predictions and optimization',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <StateProvider>
          <Providers>
            <RootLayout>
              {children}
            </RootLayout>
          </Providers>
        </StateProvider>
      </body>
    </html>
  );
}
