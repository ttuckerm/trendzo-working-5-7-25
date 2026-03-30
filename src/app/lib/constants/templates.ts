import { TemplateProps } from "../../components/TemplateCard";

// Define interfaces for template components
export interface ExampleVideo {
  id: string;
  title: string;
  thumbnail: string;
  username: string;
  userAvatar: string;
  views: string;
  likes: string;
}

export interface StructureSegment {
  time: string;
  title: string;
  description: string;
}

export interface Performance {
  metric: string;
  value: string;
  change: string;
  trending: "up" | "down" | "neutral";
}

export interface Adaptation {
  title: string;
  description: string;
}

export interface DetailedTemplate extends TemplateProps {
  description: string;
  exampleVideos: ExampleVideo[];
  structure: StructureSegment[];
  performance: Performance[];
  adaptations: Adaptation[];
  tips: string[];
}

export interface TemplatesDict {
  [key: string]: DetailedTemplate;
}

// Template data
export const TEMPLATES: TemplatesDict = {
  "dance-challenge": {
    id: "dance-challenge",
    category: "Dance",
    duration: "30 sec",
    title: "Dance Challenge Template",
    views: "24.5K",
    background: "bg-purple-100",
    image: "/images/dance-template.jpg",
    description: "A viral dance challenge template with smooth transitions that has gained massive popularity. Perfect for creating engaging dance content that's easy to follow and replicate.",
    exampleVideos: [
      {
        id: "v1",
        title: "Summer Dance Challenge #viral",
        thumbnail: "/images/dance-example-1.jpg",
        username: "@dancepro",
        userAvatar: "/images/avatar-1.jpg",
        views: "1.2M",
        likes: "145K"
      },
      {
        id: "v2",
        title: "How I nailed this dance 🔥",
        thumbnail: "/images/dance-example-2.jpg",
        username: "@dancestar",
        userAvatar: "/images/avatar-2.jpg",
        views: "890K",
        likes: "112K"
      },
      {
        id: "v3",
        title: "Dance challenge with my sister",
        thumbnail: "/images/dance-example-3.jpg",
        username: "@dancefamily",
        userAvatar: "/images/avatar-3.jpg",
        views: "750K",
        likes: "98K"
      }
    ],
    structure: [
      {
        time: "0-5s",
        title: "Hook",
        description: "Start with a stationary pose, looking directly at camera"
      },
      {
        time: "5-15s",
        title: "First sequence",
        description: "Perform the first 4 counts of the choreography with the beat drop"
      },
      {
        time: "15-25s",
        title: "Transition & second sequence",
        description: "Quick spin transition into the second part of the choreography"
      },
      {
        time: "25-30s",
        title: "Finale",
        description: "End with a freeze pose that matches the music's final beat"
      }
    ],
    performance: [
      {
        metric: "Average Views",
        value: "450K",
        change: "+128%",
        trending: "up"
      },
      {
        metric: "Completion Rate",
        value: "78%",
        change: "+23%",
        trending: "up"
      },
      {
        metric: "Share Rate",
        value: "12.4%",
        change: "+8.2%",
        trending: "up"
      },
      {
        metric: "Average Comments",
        value: "1,250",
        change: "+85%",
        trending: "up"
      }
    ],
    adaptations: [
      {
        title: "Duo Performance",
        description: "Adapt the choreography to include a friend or family member for a duo performance that creates visual interest and doubles your reach."
      },
      {
        title: "Location Variation",
        description: "Film the same choreography in multiple locations and use quick transitions between them to add visual interest."
      },
      {
        title: "Outfit Change",
        description: "Incorporate an outfit change during one of the transitions to create a surprising visual effect."
      }
    ],
    tips: [
      "Film in landscape mode first, then crop to 9:16 for better framing",
      "Practice the routine at least 10 times before recording",
      "Use natural lighting whenever possible for better video quality",
      "Add text overlays during editing to guide viewers through the moves",
      "Tag the original creator and use relevant hashtags to increase discoverability"
    ]
  },
  "product-showcase": {
    id: "product-showcase",
    category: "Marketing",
    duration: "15 sec",
    title: "Product Showcase",
    views: "18.2K",
    background: "bg-blue-100",
    image: "/images/product-template.jpg",
    description: "An effective product showcase template designed to highlight features and benefits in a visually compelling way that drives conversions.",
    exampleVideos: [
      {
        id: "v1",
        title: "Our new skincare line revealed!",
        thumbnail: "/images/product-example-1.jpg",
        username: "@beautyshop",
        userAvatar: "/images/avatar-4.jpg",
        views: "540K",
        likes: "62K"
      },
      {
        id: "v2",
        title: "This gadget changed my workflow",
        thumbnail: "/images/product-example-2.jpg",
        username: "@techreview",
        userAvatar: "/images/avatar-5.jpg",
        views: "320K",
        likes: "38K"
      }
    ],
    structure: [
      {
        time: "0-3s",
        title: "Problem statement",
        description: "Present the problem your product solves"
      },
      {
        time: "3-7s",
        title: "Product reveal",
        description: "Dynamic reveal of your product with key benefit text overlay"
      },
      {
        time: "7-12s",
        title: "Feature highlights",
        description: "Quick showcase of 2-3 main features with visual cues"
      },
      {
        time: "12-15s",
        title: "Call to action",
        description: "Clear CTA with urgency element (limited time, exclusive offer, etc.)"
      }
    ],
    performance: [
      {
        metric: "Conversion Rate",
        value: "4.2%",
        change: "+2.1%",
        trending: "up"
      },
      {
        metric: "Click-through Rate",
        value: "8.7%",
        change: "+3.5%",
        trending: "up"
      },
      {
        metric: "Save Rate",
        value: "15.3%",
        change: "+7.8%",
        trending: "up"
      },
      {
        metric: "Average Watch Time",
        value: "13.2s",
        change: "+2.5s",
        trending: "up"
      }
    ],
    adaptations: [
      {
        title: "Before & After",
        description: "Modify to show the before and after effects of using your product for proof of effectiveness."
      },
      {
        title: "Customer Testimonial",
        description: "Include a brief customer testimonial clip to add social proof to your showcase."
      },
      {
        title: "Unboxing Experience",
        description: "Adapt to focus on the premium unboxing experience to increase perceived value."
      }
    ],
    tips: [
      "Use bright, consistent lighting to make your product look professional",
      "Incorporate text overlays to emphasize key features and benefits",
      "Film close-up shots to highlight product details and quality",
      "Include your logo subtly in the corner throughout the video",
      "End with a strong call-to-action and link in bio reminder"
    ]
  },
  "tutorial-explainer": {
    id: "tutorial-explainer",
    category: "Education",
    duration: "45 sec",
    title: "Tutorial Explainer",
    views: "12.8K",
    background: "bg-green-100",
    image: "/images/tutorial-template.jpg",
    description: "A step-by-step tutorial template optimized for knowledge sharing and skill teaching in a concise, easy-to-follow format.",
    exampleVideos: [
      {
        id: "v1",
        title: "How to make perfect French toast",
        thumbnail: "/images/tutorial-example-1.jpg",
        username: "@chefsecrets",
        userAvatar: "/images/avatar-6.jpg",
        views: "780K",
        likes: "92K"
      },
      {
        id: "v2",
        title: "3 Excel formulas everyone should know",
        thumbnail: "/images/tutorial-example-2.jpg",
        username: "@techtutor",
        userAvatar: "/images/avatar-7.jpg",
        views: "420K",
        likes: "56K"
      }
    ],
    structure: [
      {
        time: "0-5s",
        title: "Hook & promise",
        description: "State what viewers will learn and why it's valuable"
      },
      {
        time: "5-10s",
        title: "Materials/requirements",
        description: "Quickly show what's needed to follow along"
      },
      {
        time: "10-35s",
        title: "Step-by-step process",
        description: "Break down the process into 3-5 clear steps with visual demonstrations"
      },
      {
        time: "35-40s",
        title: "Result showcase",
        description: "Show the completed result and highlight key success points"
      },
      {
        time: "40-45s",
        title: "Recap & CTA",
        description: "Summarize key points and invite viewers to try it themselves"
      }
    ],
    performance: [
      {
        metric: "Save Rate",
        value: "22.7%",
        change: "+15.3%",
        trending: "up"
      },
      {
        metric: "Completion Rate",
        value: "68%",
        change: "+12%",
        trending: "up"
      },
      {
        metric: "Comment Engagement",
        value: "5.8%",
        change: "+2.3%",
        trending: "up"
      },
      {
        metric: "Follow Rate",
        value: "3.2%",
        change: "+1.8%",
        trending: "up"
      }
    ],
    adaptations: [
      {
        title: "Quick Tips Version",
        description: "Modify to focus on 3 quick tips related to a skill instead of a full tutorial process."
      },
      {
        title: "Common Mistakes",
        description: "Adapt to show common mistakes people make and how to avoid them."
      },
      {
        title: "Expert vs. Beginner",
        description: "Show the same process done by a beginner and then an expert for contrast and learning."
      }
    ],
    tips: [
      "Use on-screen text to reinforce key steps and information",
      "Ensure good lighting so viewers can clearly see what you're doing",
      "Speak clearly and at a moderate pace for better comprehension",
      "Use close-up shots for detailed steps that require precision",
      "Consider adding subtitles to make your tutorial more accessible"
    ]
  },
  "outfit-transformation": {
    id: "outfit-transformation",
    category: "Fashion",
    duration: "20 sec",
    title: "Outfit Transformation",
    views: "32.1K",
    background: "bg-pink-100",
    image: "/images/fashion-template.jpg",
    description: "A creative outfit transformation template that creates a wow effect as viewers see the dramatic change from casual to glamorous.",
    exampleVideos: [
      {
        id: "v1",
        title: "My casual to formal transformation ✨",
        thumbnail: "/images/fashion-example-1.jpg",
        username: "@fashionista",
        userAvatar: "/images/avatar-8.jpg",
        views: "1.3M",
        likes: "212K"
      },
      {
        id: "v2",
        title: "Transformation for the gala",
        thumbnail: "/images/fashion-example-2.jpg",
        username: "@stylecoach",
        userAvatar: "/images/avatar-9.jpg",
        views: "876K",
        likes: "145K"
      }
    ],
    structure: [
      {
        time: "0-3s",
        title: "Start state",
        description: "Show initial outfit with neutral pose"
      },
      {
        time: "3-7s",
        title: "Transition setup",
        description: "Quick movement or prop to hide the cut point"
      },
      {
        time: "7-15s",
        title: "Reveal",
        description: "Show new outfit with confident pose and expression"
      },
      {
        time: "15-20s",
        title: "Detail highlights",
        description: "Close-ups of key outfit elements with text overlays"
      }
    ],
    performance: [
      {
        metric: "Engagement Rate",
        value: "18.5%",
        change: "+7.2%",
        trending: "up"
      },
      {
        metric: "Completion Rate",
        value: "91%",
        change: "+14%",
        trending: "up"
      },
      {
        metric: "Share Rate",
        value: "8.7%",
        change: "+3.5%",
        trending: "up"
      },
      {
        metric: "Save Rate",
        value: "12.3%",
        change: "+6.8%",
        trending: "up"
      }
    ],
    adaptations: [
      {
        title: "Multiple Transformations",
        description: "Extend the template to include 3-4 different outfit transitions in sequence."
      },
      {
        title: "Before & After Text",
        description: "Add text labels like 'Before' and 'After' to emphasize the transformation."
      },
      {
        title: "Theme-Based",
        description: "Create transformations based on themes like 'Decades' or 'Fashion Icons'."
      }
    ],
    tips: [
      "Film both segments in the same location with the same lighting",
      "Use a consistent camera angle for before and after shots",
      "Plan your transition object or movement carefully",
      "Consider adding music that builds up to the reveal moment",
      "End with a confident pose or expression that sells the transformation"
    ]
  },
  "comedy-skit": {
    id: "comedy-skit",
    category: "Comedy",
    duration: "60 sec",
    title: "Comedy Skit Format",
    views: "41.3K",
    background: "bg-yellow-100",
    image: "/images/comedy-template.jpg",
    description: "A comedy skit template designed for maximum laughs with perfect timing and punchline delivery.",
    exampleVideos: [
      {
        id: "v1",
        title: "When your boss catches you...",
        thumbnail: "/images/comedy-example-1.jpg",
        username: "@comedyking",
        userAvatar: "/images/avatar-10.jpg",
        views: "2.1M",
        likes: "342K"
      },
      {
        id: "v2",
        title: "Shopping with mom be like",
        thumbnail: "/images/comedy-example-2.jpg",
        username: "@funnyskits",
        userAvatar: "/images/avatar-11.jpg",
        views: "1.7M",
        likes: "298K"
      }
    ],
    structure: [
      {
        time: "0-10s",
        title: "Setup",
        description: "Establish the scenario and character"
      },
      {
        time: "10-25s",
        title: "Build-up",
        description: "Create anticipation through escalating scenarios"
      },
      {
        time: "25-50s",
        title: "Twist/Conflict",
        description: "Introduce the unexpected turn or conflict"
      },
      {
        time: "50-60s",
        title: "Punchline",
        description: "Deliver the final joke or resolution with perfect timing"
      }
    ],
    performance: [
      {
        metric: "Average Views",
        value: "620K",
        change: "+142%",
        trending: "up"
      },
      {
        metric: "Watch Time",
        value: "54 sec",
        change: "+21 sec",
        trending: "up"
      },
      {
        metric: "Comment Rate",
        value: "8.2%",
        change: "+4.7%",
        trending: "up"
      },
      {
        metric: "Share Rate",
        value: "15.8%",
        change: "+9.3%",
        trending: "up"
      }
    ],
    adaptations: [
      {
        title: "POV Switching",
        description: "Adapt to show multiple perspectives in the same scenario for added humor."
      },
      {
        title: "Types of People",
        description: "Modify to show different types of people in the same situation."
      },
      {
        title: "Date/Time Format",
        description: "Use text overlays to show the progression of time for comedic effect."
      }
    ],
    tips: [
      "Keep facial expressions exaggerated but believable",
      "Use props to enhance the comedy without distracting from the punchline",
      "Time your cuts precisely for maximum comedic effect",
      "Consider adding subtitle text for dialogue or inner thoughts",
      "Test your skit with a few friends to ensure the joke lands well"
    ]
  }
};

// All available template categories
export const TEMPLATE_CATEGORIES = [
  "All",
  "Dance",
  "Marketing",
  "Education",
  "Fashion",
  "Comedy",
  "Food",
  "Fitness",
  "Beauty"
];

// Helper function to generate a slug for routing
export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

// Find template by slug (derived from title) or ID
export function findTemplateBySlug(templates: TemplatesDict, slug: string): DetailedTemplate | undefined {
  // First check if there's a direct match with ID
  if (templates[slug]) {
    return templates[slug];
  }
  
  // If not, try to find by generating a slug from the title
  return Object.values(templates).find(template => generateSlug(template.title) === slug);
}

// Get related templates
export function getRelatedTemplates(templates: TemplatesDict, category: string, excludeId: string): DetailedTemplate[] {
  return Object.values(templates)
    .filter(t => t.id !== excludeId && t.category === category)
    .slice(0, 3);
}

// Get simple template data for cards
export function getTemplateData(): TemplateProps[] {
  return Object.values(TEMPLATES).map(template => ({
    id: template.id,
    category: template.category,
    duration: template.duration,
    title: template.title,
    views: template.views,
    background: template.background,
    image: template.image
  }));
}

// Export a list of templates for easier access
export const TEMPLATES_LIST = Object.values(TEMPLATES); 