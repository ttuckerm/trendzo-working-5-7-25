// Content Generation Service for Smart Template Engine
// This service handles all dynamic content generation for landing pages

import { LandingPageContent, Niche, Platform } from '@/lib/types/database';
import { supabaseClient } from '@/lib/supabase-client';

// Fallback content for all niche/platform combinations
const FALLBACK_CONTENT: Record<`${Niche}-${Platform}`, LandingPageContent> = {
  'business-linkedin': {
    headline: "Executive Video Content That Gets You Promoted",
    subheadline: "Create professional videos that showcase your expertise in 60 seconds",
    painPoints: [
      "Struggling to stand out in a competitive market",
      "No time to learn complex video editing",
      "Need to build executive presence online"
    ],
    benefits: [
      "Get noticed by decision makers",
      "Position yourself as an industry leader", 
      "Save hours with done-for-you templates"
    ],
    ctaText: "Start Creating",
    socialProof: "Join 5,000+ executives building their brand",
    templateShowcase: "The Executive Insight format - 2M+ views average",
    urgencyText: "Templates updated weekly - get early access"
  },
  'business-twitter': {
    headline: "Professional Threads That Drive Business",
    subheadline: "Turn your expertise into viral Twitter content that attracts opportunities",
    painPoints: [
      "Professional tweets get lost in the noise",
      "Hard to balance authority with engagement",
      "Missing out on Twitter's B2B potential"
    ],
    benefits: [
      "Build thought leadership in your industry",
      "Attract high-value connections",
      "Convert followers into business opportunities"
    ],
    ctaText: "Get Started",
    socialProof: "Executives gained 100K+ followers with our templates",
    templateShowcase: "The Authority Thread - 500K+ impressions average",
    urgencyText: "Twitter algorithm favoring video - act now"
  },
  'business-facebook': {
    headline: "Build Your Professional Community",
    subheadline: "Create engaging video content that transforms connections into clients",
    painPoints: [
      "Facebook seems too casual for business",
      "Struggling to reach decision makers",
      "Professional content gets low engagement"
    ],
    benefits: [
      "Tap into Facebook's massive B2B audience",
      "Build authentic professional relationships",
      "Generate warm leads through storytelling"
    ],
    ctaText: "Start Building",
    socialProof: "Business owners generated $1M+ through video content",
    templateShowcase: "The Client Story format - 85% completion rate",
    urgencyText: "Facebook prioritizing professional content creators"
  },
  'business-instagram': {
    headline: "Executive Presence That Converts",
    subheadline: "Transform your professional brand with videos that inspire action",
    painPoints: [
      "Instagram feels too young for executives",
      "Reels seem unprofessional for business",
      "Not sure how to maintain executive image"
    ],
    benefits: [
      "Reach younger decision makers effectively",
      "Showcase company culture authentically",
      "Build a movement around your leadership"
    ],
    ctaText: "Transform Now",
    socialProof: "CEOs reached 10M+ professionals through Reels",
    templateShowcase: "The Leadership Reel - 3M+ views average",
    urgencyText: "Instagram's professional community growing 300% yearly"
  },
  'creator-linkedin': {
    headline: "Turn Your Content Into Career Opportunities",
    subheadline: "Leverage LinkedIn's algorithm to build your creator business",
    painPoints: [
      "LinkedIn feels too corporate for creators",
      "Creative content gets less reach",
      "Hard to monetize on the platform"
    ],
    benefits: [
      "Access high-paying brand partnerships",
      "Build B2B creator opportunities",
      "Convert connections to consulting clients"
    ],
    ctaText: "Unlock Growth",
    socialProof: "Creators earning $50K+/month from LinkedIn",
    templateShowcase: "The Creator Case Study - 90% engagement rate",
    urgencyText: "LinkedIn Creator Fund accepting applications"
  },
  'creator-twitter': {
    headline: "Go Viral on Twitter in 60 Seconds",
    subheadline: "Steal the video formats getting millions of views right now",
    painPoints: [
      "Tweets getting lost in the algorithm",
      "Missing out on video engagement",
      "Don't know what content works"
    ],
    benefits: [
      "10x your engagement rates",
      "Get retweeted by influencers",
      "Build a loyal following fast"
    ],
    ctaText: "Get Templates",
    socialProof: "Creators gained 500K+ followers using these",
    templateShowcase: "The Thread Explainer - viral every time",
    urgencyText: "Only 48 hours before everyone copies this"
  },
  'creator-facebook': {
    headline: "Facebook's Hidden Creator Goldmine",
    subheadline: "Tap into Facebook's $1B creator fund with viral video templates",
    painPoints: [
      "Facebook seems dead for creators",
      "Reels getting buried by algorithm",
      "Missing monetization opportunities"
    ],
    benefits: [
      "Access Facebook's creator bonus program",
      "Reach untapped older demographics",
      "Build multiple revenue streams"
    ],
    ctaText: "Start Earning",
    socialProof: "Creators earning $10K+/month from Facebook Reels",
    templateShowcase: "The Story Hook format - 5M+ reach guaranteed",
    urgencyText: "Facebook paying creators 10x more than TikTok"
  },
  'creator-instagram': {
    headline: "Instagram Templates That Print Money",
    subheadline: "Copy the exact formats top creators use to get brand deals",
    painPoints: [
      "Reels not getting discovered",
      "Can't crack the Instagram algorithm",
      "Brands not noticing your content"
    ],
    benefits: [
      "Land 5-figure brand partnerships",
      "Get verified checkmark faster",
      "Build sellable Instagram business"
    ],
    ctaText: "Copy Winners",
    socialProof: "Our creators landed $500K+ in brand deals",
    templateShowcase: "The Product Placement format - converts 10x better",
    urgencyText: "Instagram changing algorithm next week"
  },
  'fitness-linkedin': {
    headline: "Corporate Wellness Authority Builder",
    subheadline: "Position yourself as the go-to fitness expert for busy professionals",
    painPoints: [
      "Fitness content seems out of place on LinkedIn",
      "Hard to reach corporate decision makers",
      "Struggling to sell B2B fitness services"
    ],
    benefits: [
      "Land corporate wellness contracts",
      "Build executive coaching clientele",
      "Become the workplace fitness authority"
    ],
    ctaText: "Build Authority",
    socialProof: "Trainers landing $100K+ corporate contracts",
    templateShowcase: "The Deskercise Demo - 95% completion rate",
    urgencyText: "Corporate wellness budgets at all-time high"
  },
  'fitness-twitter': {
    headline: "Fitness Threads That Build Empires",
    subheadline: "Turn workout wisdom into viral content that sells programs",
    painPoints: [
      "Fitness tips get lost in Twitter noise",
      "Hard to show transformations in tweets",
      "Can't convert followers to clients"
    ],
    benefits: [
      "Build cult-like fitness following",
      "Sell out programs in minutes",
      "Get featured by major publications"
    ],
    ctaText: "Go Viral",
    socialProof: "Coaches selling $1M+ through Twitter threads",
    templateShowcase: "The Transformation Thread - 1M+ impressions",
    urgencyText: "Twitter's new video features favor fitness content"
  },
  'fitness-facebook': {
    headline: "Build Your Fitness Community Empire",
    subheadline: "Create viral workout videos that turn viewers into paying clients",
    painPoints: [
      "Facebook groups not converting to sales",
      "Workout videos get low organic reach",
      "Competing with bigger fitness pages"
    ],
    benefits: [
      "Build engaged community of buyers",
      "Launch programs to eager audience",
      "Create recurring revenue streams"
    ],
    ctaText: "Build Community",
    socialProof: "Trainers built 6-figure businesses from Facebook",
    templateShowcase: "The Home Workout format - 10M+ views average",
    urgencyText: "Facebook favoring community-driven fitness content"
  },
  'fitness-instagram': {
    headline: "Turn Your Workouts Into Viral Content",
    subheadline: "Fitness templates that grow your following and impact lives",
    painPoints: [
      "Great transformations but no engagement",
      "Reels not reaching your audience",
      "Competition from bigger accounts"
    ],
    benefits: [
      "Reach millions with your message",
      "Attract your ideal clients",
      "Build a fitness empire online"
    ],
    ctaText: "Start Growing",
    socialProof: "Fitness coaches earned $10K+ from viral videos",
    templateShowcase: "The Transformation Reveal - 5M+ views average",
    urgencyText: "New Instagram algorithm favors these formats"
  },
  'education-linkedin': {
    headline: "Become The Industry's Top Educator",
    subheadline: "Share knowledge through video that positions you as the expert",
    painPoints: [
      "Educational content gets low engagement",
      "Hard to stand out among thought leaders",
      "Not converting views to opportunities"
    ],
    benefits: [
      "Become the go-to industry educator",
      "Attract speaking opportunities",
      "Build lucrative consulting pipeline"
    ],
    ctaText: "Share Wisdom",
    socialProof: "Educators booked $500K+ in speaking gigs",
    templateShowcase: "The Mini Masterclass - 98% watch time",
    urgencyText: "LinkedIn prioritizing educational video content"
  },
  'education-twitter': {
    headline: "Educational Threads That Change Lives",
    subheadline: "Transform complex topics into viral content that educates millions",
    painPoints: [
      "Educational tweets get buried",
      "Hard to explain concepts in short form",
      "Not building authority fast enough"
    ],
    benefits: [
      "Become recognized thought leader",
      "Build massive student following",
      "Launch courses to eager audience"
    ],
    ctaText: "Teach Millions",
    socialProof: "Educators reached 10M+ students via Twitter",
    templateShowcase: "The Concept Breakdown - goes viral daily",
    urgencyText: "Twitter's education community exploding"
  },
  'education-facebook': {
    headline: "Engage Students With Video Content That Works",
    subheadline: "Educational templates proven to boost learning and retention",
    painPoints: [
      "Students distracted and disengaged",
      "Traditional teaching not working",
      "Need to compete with social media"
    ],
    benefits: [
      "Triple student engagement rates",
      "Make complex topics simple",
      "Build a following of eager learners"
    ],
    ctaText: "Transform Teaching",
    socialProof: "Teachers reached 1M+ students with these formats",
    templateShowcase: "The Quick Explainer - 95% completion rate",
    urgencyText: "Start before the new semester rush"
  },
  'education-instagram': {
    headline: "Make Learning Addictively Engaging",
    subheadline: "Educational content that students actually want to watch",
    painPoints: [
      "Students prefer TikTok over textbooks",
      "Educational content seems boring",
      "Losing students to entertainment"
    ],
    benefits: [
      "Make education as engaging as entertainment",
      "Build passionate student community",
      "Transform how students learn"
    ],
    ctaText: "Engage Students",
    socialProof: "Educators gained 1M+ engaged students",
    templateShowcase: "The Edu-tainment format - 99% retention",
    urgencyText: "Students spending 5+ hours daily on Instagram"
  }
};

export class ContentGeneratorService {
  private static instance: ContentGeneratorService;
  private cache: Map<string, LandingPageContent> = new Map();
  private anthropicApiKey: string | null = null;

  private constructor() {
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || null;
  }

  static getInstance(): ContentGeneratorService {
    if (!ContentGeneratorService.instance) {
      ContentGeneratorService.instance = new ContentGeneratorService();
    }
    return ContentGeneratorService.instance;
  }

  async generateNichePage(
    niche: Niche, 
    platform: Platform
  ): Promise<LandingPageContent> {
    const cacheKey = `${niche}-${platform}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Check if content exists in database
      const { data: existingPage } = await supabaseClient
        .from('landing_pages')
        .select('content')
        .eq('niche', niche)
        .eq('platform', platform)
        .eq('ab_variant', 'control')
        .single();

      if (existingPage?.content) {
        this.cache.set(cacheKey, existingPage.content);
        return existingPage.content;
      }

      // Use fallback content for now (Claude API can be integrated later)
      const fallbackContent = this.getFallbackContent(niche, platform);
      
      // Store in database for persistence
      await this.saveToDatabase(niche, platform, fallbackContent);
      this.cache.set(cacheKey, fallbackContent);
      
      return fallbackContent;
    } catch (error) {
      console.error('Error generating content:', error);
      // Return fallback content
      return this.getFallbackContent(niche, platform);
    }
  }

  async generateExitIntentOffer(
    niche: Niche,
    platform: Platform,
    context: 'landing' | 'editor'
  ): Promise<{
    headline: string;
    description: string;
    ctaText: string;
    inputPlaceholder: string;
  }> {
    const exitIntentOffers = {
      landing: {
        business: {
          headline: "Wait! Get This Professional Template Free",
          description: "The exact video format executives use to get promoted. Enter your email to get instant access.",
          ctaText: "Get Template Now",
          inputPlaceholder: "Enter your work email"
        },
        creator: {
          headline: "Leaving Already? Grab 3 Viral Templates First",
          description: "Get the top 3 trending templates before they peak. 89% of creators go viral within 48 hours.",
          ctaText: "Send Me Templates",
          inputPlaceholder: "Where should we send them?"
        },
        fitness: {
          headline: "Don't Miss Out! Free Transformation Template",
          description: "The workout video format getting fitness influencers 10M+ views. Yours free for the next 60 seconds.",
          ctaText: "Claim Template",
          inputPlaceholder: "Your best email"
        },
        education: {
          headline: "Teachers Love This! Free Engagement Template",
          description: "The video format that makes students actually pay attention. Get it before your colleagues do.",
          ctaText: "Get Teaching Template",
          inputPlaceholder: "Your email address"
        }
      },
      editor: {
        business: {
          headline: "Save Your Professional Video + LinkedIn Strategy",
          description: "Don't lose your work! Plus get our executive video posting playbook (worth $97) free.",
          ctaText: "Save & Get Playbook",
          inputPlaceholder: "Enter work email to save"
        },
        creator: {
          headline: "Save Your Template + Viral Timing Calendar",
          description: "Keep your customizations and discover the best times to post for maximum virality.",
          ctaText: "Save & Get Calendar",
          inputPlaceholder: "Email to save progress"
        },
        fitness: {
          headline: "Save Template + Get Script Library",
          description: "Don't lose your edits! Plus get 50 proven workout video scripts that convert viewers to clients.",
          ctaText: "Save Everything",
          inputPlaceholder: "Your email to save"
        },
        education: {
          headline: "Save Video + Student Retention Guide",
          description: "Keep your template and learn the psychology behind videos that students watch to the end.",
          ctaText: "Save & Learn More",
          inputPlaceholder: "Email to continue"
        }
      }
    };

    const baseOffer = exitIntentOffers[context][niche];
    
    // Add platform-specific tweaks
    const platformTweaks: Record<Platform, string> = {
      linkedin: " (optimized for LinkedIn's algorithm)",
      twitter: " (includes Twitter thread formula)",
      facebook: " (with Facebook group growth tactics)",
      instagram: " (plus Instagram Reels secrets)"
    };

    return {
      ...baseOffer,
      description: baseOffer.description + platformTweaks[platform]
    };
  }

  async generateSocialPost(
    niche: Niche,
    platform: Platform,
    campaignWeek: number = 1
  ): Promise<{
    text: string;
    hashtags: string[];
    mediaHint: string;
  }> {
    const socialPosts: Record<Platform, Record<Niche, any>> = {
      linkedin: {
        business: {
          text: "90% of executives say video content boosted their professional brand. Here's the exact template that got 3 promotions in 3 months →",
          hashtags: ["ExecutiveBranding", "ProfessionalDevelopment", "VideoMarketing", "Leadership"],
          mediaHint: "Professional headshot with play button overlay"
        },
        creator: {
          text: "LinkedIn creators are quietly earning $50K+/month. The secret? This video template that positions you as an industry expert →",
          hashtags: ["LinkedInCreator", "ContentCreation", "B2BMarketing", "CreatorEconomy"],
          mediaHint: "Split screen showing creator and earnings graph"
        },
        fitness: {
          text: "Corporate wellness programs are desperately seeking video content. This template helped trainers land $100K+ contracts →",
          hashtags: ["CorporateWellness", "FitnessCoach", "B2BFitness", "WorkplaceHealth"],
          mediaHint: "Professional in workout attire in office setting"
        },
        education: {
          text: "This educator went from unknown to keynote speaker in 6 months. The secret? This video template that showcases expertise →",
          hashtags: ["ThoughtLeadership", "ProfessionalSpeaking", "Education", "ExpertContent"],
          mediaHint: "Educator on stage with audience"
        }
      },
      twitter: {
        business: {
          text: "This executive went from 500 to 50K followers in 3 months.\n\nThe secret?\n\nA video template that turns boring business insights into viral content.\n\nSteal it here before LinkedIn catches on:",
          hashtags: ["BusinessTwitter", "ExecutivePresence", "B2B"],
          mediaHint: "Tweet screenshot showing follower growth"
        },
        creator: {
          text: "🚨 This 15-second video format is about to EXPLODE\n\nI'm talking 10M+ views guaranteed\n\nEvery big creator will be using it next week\n\nSteal it now while it's still fresh →",
          hashtags: ["CreatorTips", "ViralContent", "TwitterVideo"],
          mediaHint: "Trending arrow graph going up dramatically"
        },
        fitness: {
          text: "Fitness coaches are making $10K/month from ONE viral video format\n\nNo equipment needed\nNo fancy editing\nJust copy this template\n\nYour competition doesn't want you to see this →",
          hashtags: ["FitnessBusiness", "OnlineCoaching", "FitTips"],
          mediaHint: "Before/after transformation preview"
        },
        education: {
          text: "Teachers using this video format report:\n\n📈 300% higher engagement\n🎯 95% completion rates\n💡 Students actually remembering content\n\nGet the template making education addictive →",
          hashtags: ["EdTech", "TeacherTwitter", "Education"],
          mediaHint: "Student engagement metrics visualization"
        }
      },
      facebook: {
        business: {
          text: "I was skeptical about using video for my business... until this template helped me land 3 enterprise clients in one month. If you're a professional who wants to attract high-value opportunities without being 'salesy', you need to see this →",
          hashtags: ["BusinessGrowth", "ProfessionalDevelopment", "VideoMarketing"],
          mediaHint: "Professional testimonial-style image"
        },
        creator: {
          text: "ATTENTION CREATORS: Facebook is secretly paying 10x more than TikTok right now. This video template is your ticket to their $1B creator fund. I made $8,400 last month with just 3 videos. Here's how →",
          hashtags: ["FacebookCreator", "CreatorFund", "ContentMonetization"],
          mediaHint: "Creator earnings dashboard screenshot"
        },
        fitness: {
          text: "From struggling trainer to 6-figure online fitness business... This video template changed everything. Now my home workout videos reach millions and my programs sell out in minutes. Want to transform your fitness business too?",
          hashtags: ["FitnessBusiness", "OnlineTraining", "HomeWorkouts"],
          mediaHint: "Trainer success story collage"
        },
        education: {
          text: "My students were glued to TikTok instead of my lessons... So I started using THEIR language. This video template makes learning as addictive as social media. Parents are calling me a miracle worker 😂 See how →",
          hashtags: ["ModernEducation", "TeachersOfFacebook", "StudentEngagement"],
          mediaHint: "Engaged students watching screen"
        }
      },
      instagram: {
        business: {
          text: "POV: You discover the Reel format that helped a 55-year-old executive gain 100K followers and 3 board positions 🤯\n\nProfessional content doesn't have to be boring.\n\nLink in bio for the exact template →",
          hashtags: ["ExecutiveBrand", "ProfessionalReels", "LeadershipContent", "B2BMarketing", "CareerGrowth"],
          mediaHint: "Executive in modern office with trendy overlay"
        },
        creator: {
          text: "This Reel template just landed me a $50K brand deal 💰\n\nNo fancy equipment.\nNo editing skills.\nJust copy and customize.\n\nDrop a '🎬' and I'll DM you the link\n(Hurry, Instagram is changing the algorithm Monday)",
          hashtags: ["ContentCreator", "ReelsStrategy", "CreatorTips", "BrandDeals", "IGGrowth"],
          mediaHint: "Money/success aesthetic with template preview"
        },
        fitness: {
          text: "This transformation video template is breaking the internet 🔥\n\n5M+ views GUARANTEED\nConverts followers to clients\nWorks for any fitness niche\n\nYour competition is already using it...\n\nGrab yours before it's everywhere →",
          hashtags: ["FitnessReels", "TransformationTuesday", "OnlineCoaching", "FitnessBusiness", "WorkoutVideos"],
          mediaHint: "Dramatic before/after with viral indicators"
        },
        education: {
          text: "Teachers: Your students are here 5+ hours a day 📱\n\nMeet them where they are.\n\nThis Reel template makes algebra as engaging as dance trends.\n\nWatch engagement skyrocket 🚀\n\nFree template in bio (save before it's gone!)",
          hashtags: ["TeachersOfIG", "ModernEducation", "EdTech", "TeacherReels", "StudentEngagement"],
          mediaHint: "Split screen: textbook vs engaging reel"
        }
      }
    };

    return socialPosts[platform][niche];
  }

  private getFallbackContent(niche: Niche, platform: Platform): LandingPageContent {
    const key = `${niche}-${platform}` as keyof typeof FALLBACK_CONTENT;
    return FALLBACK_CONTENT[key];
  }

  private async saveToDatabase(
    niche: Niche,
    platform: Platform,
    content: LandingPageContent
  ): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('landing_pages')
        .upsert({
          niche,
          platform,
          content,
          ab_variant: 'control',
          is_active: true
        });

      if (error) {
        console.error('Error saving content to database:', error);
      }
    } catch (error) {
      console.error('Error in saveToDatabase:', error);
    }
  }

  // A/B Testing support
  async generateABVariant(
    niche: Niche,
    platform: Platform,
    variantType: 'headline' | 'cta' | 'urgency'
  ): Promise<Partial<LandingPageContent>> {
    const baseContent = await this.generateNichePage(niche, platform);
    
    // Generate variations based on type
    const variations = {
      headline: [
        `${baseContent.headline} (Guaranteed)`,
        `How to ${baseContent.headline}`,
        `The Secret to ${baseContent.headline}`,
        `Finally: ${baseContent.headline}`
      ],
      cta: [
        "Get Instant Access",
        "Start Now - It's Free",
        "Claim Your Template",
        "Yes, Show Me How"
      ],
      urgency: [
        "Limited time: 50% of templates claimed",
        "Price increases in 24 hours",
        "Only available this week",
        "Bonus expires at midnight"
      ]
    };

    const randomIndex = Math.floor(Math.random() * variations[variantType].length);
    
    return {
      [variantType]: variations[variantType][randomIndex]
    };
  }

  // Clear cache when needed
  clearCache(): void {
    this.cache.clear();
  }
}