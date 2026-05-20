import './globals.css';
import { Inter, Playfair_Display, DM_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import React from 'react';
import type { ReactNode } from 'react';
import Script from 'next/script';
import Providers from './providers';
import RootLayout from './_app';
import { StateProvider } from '@/lib/contexts/StateContext';
import FlagProviderClient from '@/components/FlagProviderClient';
import MetaPixelTracker from '@/components/analytics/MetaPixelTracker';

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
  // Pixel is loaded only on the funnel deploy (techyai.co). On the Trendzo
  // deploy DEPLOY_TARGET is unset, Script + Tracker render to null, and no
  // Facebook hosts are contacted.
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const showPixel = process.env.DEPLOY_TARGET === 'funnel' && !!pixelId;
  const isFunnelDeploy = process.env.DEPLOY_TARGET === 'funnel';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {showPixel && (
          <Script id="meta-pixel-base" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
          `}</Script>
        )}
        {showPixel && (
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`,
            }}
          />
        )}
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${inter.className}`}>
        <StateProvider>
          <Providers>
            <RootLayout isFunnelDeploy={isFunnelDeploy}>
              <FlagProviderClient>
                {showPixel && <MetaPixelTracker />}
                {children}
              </FlagProviderClient>
            </RootLayout>
          </Providers>
        </StateProvider>
      </body>
    </html>
  );
}
