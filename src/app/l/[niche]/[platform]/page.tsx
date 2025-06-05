// Dynamic Landing Page for Smart Template Engine
// Route: /l/[niche]/[platform]

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LandingPageComponent from '@/components/mvp/LandingPage';
import { ContentGeneratorService } from '@/lib/services/contentGenerator';
import { trackPageView } from '@/lib/services/analytics';
import { Niche, Platform } from '@/lib/types/database';

// Validate route params
const VALID_NICHES = ['business', 'creator', 'fitness', 'education'] as const;
const VALID_PLATFORMS = ['linkedin', 'twitter', 'facebook', 'instagram'] as const;

interface PageProps {
  params: {
    niche: string;
    platform: string;
  };
}

// Dynamic metadata generation for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { niche, platform } = params;
  
  if (!VALID_NICHES.includes(niche as Niche) || !VALID_PLATFORMS.includes(platform as Platform)) {
    return {
      title: 'Page Not Found'
    };
  }

  const contentGenerator = ContentGeneratorService.getInstance();
  const content = await contentGenerator.generateNichePage(niche as Niche, platform as Platform);

  return {
    title: `${content.headline} | TRENDZO`,
    description: content.subheadline,
    openGraph: {
      title: content.headline,
      description: content.subheadline,
      type: 'website',
      siteName: 'TRENDZO',
      images: [
        {
          url: `/og/${niche}-${platform}.png`,
          width: 1200,
          height: 630,
          alt: content.headline
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: content.headline,
      description: content.subheadline,
      images: [`/og/${niche}-${platform}.png`]
    }
  };
}

// Generate static params for better performance
export async function generateStaticParams() {
  const params: { niche: string; platform: string }[] = [];
  
  VALID_NICHES.forEach(niche => {
    VALID_PLATFORMS.forEach(platform => {
      params.push({ niche, platform });
    });
  });
  
  return params;
}

export default async function LandingPage({ params }: PageProps) {
  const { niche, platform } = params;
  
  // Validate params
  if (!VALID_NICHES.includes(niche as Niche) || !VALID_PLATFORMS.includes(platform as Platform)) {
    notFound();
  }

  // Get content for this niche/platform combination
  const contentGenerator = ContentGeneratorService.getInstance();
  const content = await contentGenerator.generateNichePage(niche as Niche, platform as Platform);

  // Track page view (server-side)
  if (typeof window === 'undefined') {
    // Server-side tracking
    try {
      await trackPageView({
        niche: niche as Niche,
        platform: platform as Platform,
        source: 'organic'
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  return (
    <LandingPageComponent
      niche={niche as Niche}
      platform={platform as Platform}
      content={content}
    />
  );
}