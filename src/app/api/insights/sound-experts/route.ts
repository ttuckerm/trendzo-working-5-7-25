import { NextRequest, NextResponse } from 'next/server';

// Sample data for expert sound insights
const expertInsights = [
  {
    id: '1',
    expert: {
      name: 'Dr. Emma Reynolds',
      role: 'Audio Psychologist',
      avatar: '/default-avatar.png'
    },
    title: 'The Psychology of Sound in Viral Content',
    summary: 'How strategic sound selection affects audience retention and emotional response',
    content: 'Research shows that videos with strategically selected sound elements receive 34% higher engagement rates and 27% longer watch times. The psychological impact of sound creates an emotional bond with viewers, particularly when the audio elements match the visual pacing and emotional tone of the content. In our studies, we found that sound elements that create emotional congruence with visuals perform significantly better than randomly selected popular tracks.',
    category: 'psychology',
    date: '2023-10-15T12:00:00Z',
    stats: {
      successRate: 92,
      implementations: 1245,
      avgEngagementIncrease: 34
    },
    recommendations: [
      'Use sound that matches the emotional tone of your visual content',
      'Consider the psychological impact of tempo changes on viewer perception',
      'Test different audio treatments with small audience segments before full release'
    ]
  },
  {
    id: '2',
    expert: {
      name: 'Miguel Santos',
      role: 'Sound Design Director',
      avatar: '/default-avatar.png'
    },
    title: 'Creating Custom Sound Identities for Brands',
    summary: 'How unique sound signatures can differentiate your brand and improve recognition',
    content: 'Brand sound identity is becoming as important as visual identity in the digital ecosystem. Our analysis of over 500 successful marketing campaigns revealed that brands with consistent sound signatures experienced 41% higher recall rates. The most effective approach involves creating a modular sound system with core elements that can be adapted across different content formats while maintaining brand recognition.',
    category: 'branding',
    date: '2023-11-02T15:30:00Z',
    stats: {
      successRate: 88,
      implementations: 890,
      avgEngagementIncrease: 41
    },
    recommendations: [
      'Develop a core sound signature that can be adapted across different content formats',
      'Ensure sound elements align with brand personality and values',
      'Create a sound style guide to maintain consistency across campaigns'
    ]
  },
  {
    id: '3',
    expert: {
      name: 'Taylor Kim',
      role: 'Trending Audio Analyst',
      avatar: '/default-avatar.png'
    },
    title: 'Leveraging Trending Sounds: Analysis & Prediction',
    summary: 'How to identify and utilize emerging sound trends before they peak',
    content: 'Our predictive model has successfully identified rising sound trends with 78% accuracy, typically 2-3 weeks before mainstream adoption. The analysis of early adoption patterns across niche communities provides valuable insights into which sounds will cross over to larger audiences. The most successful implementations involve creative adaptation rather than direct usage of trending sounds, allowing brands to participate in trends while maintaining their unique identity.',
    category: 'trends',
    date: '2023-12-05T09:15:00Z',
    stats: {
      successRate: 78,
      implementations: 1876,
      avgEngagementIncrease: 53
    },
    recommendations: [
      'Monitor niche creator communities for early sound trend signals',
      'Adapt rather than directly copy trending sounds for better brand alignment',
      'Be prepared to quickly implement emerging sound trends (within 48-72 hours)'
    ]
  },
  {
    id: '4',
    expert: {
      name: 'Aisha Johnson',
      role: 'Music Licensing Specialist',
      avatar: '/default-avatar.png'
    },
    title: 'Navigating Music Licensing for Content Creators',
    summary: 'How to legally use commercial music while avoiding copyright issues',
    content: 'Copyright claims affect approximately 25% of creator content, resulting in demonetization or removal. Our analysis shows that understanding the different types of licenses (synchronization, master use, etc.) is essential for creators. The most cost-effective approach for most creators is to use royalty-free libraries combined with custom sound design elements, which can provide 90% of the quality at 20% of the cost of commercial tracks.',
    category: 'legal',
    date: '2024-01-10T14:45:00Z',
    stats: {
      successRate: 96,
      implementations: 723,
      avgEngagementIncrease: 18
    },
    recommendations: [
      'Invest in premium royalty-free libraries rather than risking copyright claims',
      'Consider working with emerging musicians for exclusive content at reasonable rates',
      'Keep detailed records of all licensing agreements and permissions'
    ]
  },
  {
    id: '5',
    expert: {
      name: 'Dr. Marcus Chen',
      role: 'Audio Technology Researcher',
      avatar: '/default-avatar.png'
    },
    title: 'AI-Generated Sound: The Future of Content Audio',
    summary: 'How artificial intelligence is revolutionizing sound design for creators',
    content: 'AI-generated and enhanced audio is becoming increasingly sophisticated, with quality improvements of 72% over the past 18 months. Our testing reveals that audiences now struggle to distinguish between AI-generated and human-produced sound in blind tests. The most promising applications include personalized sound experiences that adapt to viewer preferences and context, custom voice synthesis for narration, and intelligent audio enhancement that can rescue poor quality recordings.',
    category: 'technology',
    date: '2024-02-18T11:30:00Z',
    stats: {
      successRate: 83,
      implementations: 512,
      avgEngagementIncrease: 37
    },
    recommendations: [
      'Experiment with AI tools for generating custom background music',
      'Use AI-enhanced audio processing to improve recording quality',
      'Consider the ethical implications of AI-generated voice content'
    ]
  },
  {
    id: '6',
    expert: {
      name: 'Sophie Williams',
      role: 'Audio Accessibility Consultant',
      avatar: '/default-avatar.png'
    },
    title: 'Inclusive Sound Design for Wider Audience Reach',
    summary: 'How to create sound that works for audiences with different abilities',
    content: 'Inclusive sound design can increase your potential audience by up to 25%. Our research shows that implementing basic audio accessibility features results in higher engagement across all audience segments, not just those with disabilities. Key strategies include providing clear audio descriptions, ensuring speech clarity, maintaining appropriate volume levels between elements, and offering alternative audio mixes for different listening environments.',
    category: 'accessibility',
    date: '2024-03-07T16:00:00Z',
    stats: {
      successRate: 91,
      implementations: 375,
      avgEngagementIncrease: 29
    },
    recommendations: [
      'Create alternative audio mixes for different listening environments',
      'Ensure clear separation between speech and background elements',
      'Test your audio with diverse audience groups including those with hearing impairments'
    ]
  },
  {
    id: '7',
    expert: {
      name: 'James Harcourt',
      role: 'Sonic Branding Expert',
      avatar: '/default-avatar.png'
    },
    title: 'Building Sound Systems for Cross-Platform Content',
    summary: 'Creating flexible sound frameworks that work across different platforms',
    content: 'Platform-specific sound optimization can increase performance metrics by an average of 42%. Our research across major platforms shows significant variations in how sound affects algorithm performance. The most successful approach involves creating a modular sound system with versions optimized for each platform while maintaining overall brand consistency. This strategy particularly benefits from understanding the unique audience expectations and technical limitations of each platform.',
    category: 'branding',
    date: '2024-03-25T13:20:00Z',
    stats: {
      successRate: 87,
      implementations: 642,
      avgEngagementIncrease: 42
    },
    recommendations: [
      'Create platform-specific versions of your sound assets',
      'Consider how each platform\'s algorithms respond to different audio features',
      'Maintain core sonic identity while adapting to platform requirements'
    ]
  },
  {
    id: '8',
    expert: {
      name: 'Alex Rivera',
      role: 'Audio Production Director',
      avatar: '/default-avatar.png'
    },
    title: 'Professional Sound on a Budget: Production Techniques',
    summary: 'Achieving studio-quality sound without expensive equipment',
    content: 'Our blind tests show that budget-friendly production techniques can achieve 85-90% of professional studio quality when implemented correctly. The most critical factors include recording environment optimization, microphone placement technique, and post-processing knowledge. Most creators over-invest in expensive equipment while under-investing in acoustic treatment and technical knowledge, which typically yields better results at lower cost.',
    category: 'production',
    date: '2024-04-12T10:45:00Z',
    stats: {
      successRate: 89,
      implementations: 1105,
      avgEngagementIncrease: 31
    },
    recommendations: [
      'Invest in acoustic treatment before expensive microphones',
      'Master basic audio editing techniques for significant quality improvements',
      'Use reference tracks to benchmark your sound quality against industry standards'
    ]
  }
];

export async function GET(request: NextRequest) {
  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'latest';

  // Filter insights by category if provided
  let filteredInsights = category 
    ? expertInsights.filter(insight => insight.category === category) 
    : expertInsights;

  // Sort insights based on the sort parameter
  switch (sort) {
    case 'latest':
      filteredInsights = [...filteredInsights].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      break;
    case 'oldest':
      filteredInsights = [...filteredInsights].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      break;
    case 'success_rate':
      filteredInsights = [...filteredInsights].sort((a, b) => 
        b.stats.successRate - a.stats.successRate
      );
      break;
    case 'implementations':
      filteredInsights = [...filteredInsights].sort((a, b) => 
        b.stats.implementations - a.stats.implementations
      );
      break;
    default:
      // Default to latest if sort parameter is not recognized
      filteredInsights = [...filteredInsights].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }

  // Calculate category counts for filters
  const categoryCounts = expertInsights.reduce((acc, insight) => {
    acc[insight.category] = (acc[insight.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return the filtered and sorted insights
  return NextResponse.json({
    insights: filteredInsights,
    meta: {
      total: filteredInsights.length,
      categories: categoryCounts
    }
  });
} 