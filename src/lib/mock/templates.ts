import { Template } from '../types/template';

// Sample user IDs for mock data
const mockUsers = {
  default: 'user_123456',
  premium: 'user_premium_789',
  business: 'user_business_999'
};

// Generate a date for a specific number of days ago
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Mock templates that will be used as fallbacks when Firebase fails
export const mockTemplates: Template[] = [
  {
    id: 'template_001',
    name: 'Engaging Product Showcase',
    industry: 'E-commerce',
    category: 'TikTok',
    description: 'Showcase your products with this engaging template',
    sections: [
      {
        id: 'section_001',
        name: 'Intro',
        duration: 3,
        textOverlays: [
          {
            id: 'text_001',
            text: 'Check out this amazing product!',
            position: 'top',
            style: 'headline',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#000000',
        order: 0
      },
      {
        id: 'section_002',
        name: 'Product Features',
        duration: 5,
        textOverlays: [
          {
            id: 'text_002',
            text: 'High quality, affordable, and trending!',
            position: 'bottom',
            style: 'caption',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#222222',
        order: 1
      }
    ],
    views: 12500,
    usageCount: 350,
    isPublished: true,
    userId: mockUsers.default,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
    thumbnailUrl: 'https://placehold.co/600x800/orange/white?text=Product+Template',
    totalDuration: 8
  },
  {
    id: 'template_002',
    name: 'TikTok Trending Dance',
    industry: 'Entertainment',
    category: 'TikTok',
    description: 'Get more views with this trending dance template',
    sections: [
      {
        id: 'section_003',
        name: 'Dance Intro',
        duration: 2,
        textOverlays: [
          {
            id: 'text_003',
            text: 'New Trending Dance!',
            position: 'top',
            style: 'headline',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#ff3366',
        order: 0
      },
      {
        id: 'section_004',
        name: 'Dance Steps',
        duration: 10,
        textOverlays: [
          {
            id: 'text_004',
            text: 'Follow these steps',
            position: 'middle',
            style: 'caption',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#ff3366',
        order: 1
      }
    ],
    views: 45000,
    usageCount: 1200,
    isPublished: true,
    userId: mockUsers.premium,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2),
    thumbnailUrl: 'https://placehold.co/600x800/pink/white?text=Dance+Template',
    totalDuration: 12
  },
  {
    id: 'template_003',
    name: 'Business Explainer',
    industry: 'Business',
    category: 'Instagram',
    description: 'Professional template for business explanations',
    sections: [
      {
        id: 'section_005',
        name: 'Problem Statement',
        duration: 4,
        textOverlays: [
          {
            id: 'text_005',
            text: 'Are you struggling with X?',
            position: 'middle',
            style: 'headline',
            color: '#000000'
          }
        ],
        backgroundColor: '#ffffff',
        order: 0
      },
      {
        id: 'section_006',
        name: 'Solution',
        duration: 6,
        textOverlays: [
          {
            id: 'text_006',
            text: 'Our service solves X by doing Y',
            position: 'bottom',
            style: 'caption',
            color: '#000000'
          }
        ],
        backgroundColor: '#f0f0f0',
        order: 1
      }
    ],
    views: 8000,
    usageCount: 420,
    isPublished: true,
    userId: mockUsers.business,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(1),
    thumbnailUrl: 'https://placehold.co/600x800/blue/white?text=Business+Template',
    totalDuration: 10
  },
  {
    id: 'template_004',
    name: 'Quick Recipe',
    industry: 'Food',
    category: 'TikTok',
    description: '60-second recipe template that\'s perfect for TikTok',
    sections: [
      {
        id: 'section_007',
        name: 'Ingredients',
        duration: 3,
        textOverlays: [
          {
            id: 'text_007',
            text: 'You\'ll need these ingredients:',
            position: 'top',
            style: 'headline',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#8BC34A',
        order: 0
      },
      {
        id: 'section_008',
        name: 'Preparation',
        duration: 7,
        textOverlays: [
          {
            id: 'text_008',
            text: 'Follow these simple steps',
            position: 'middle',
            style: 'caption',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#689F38',
        order: 1
      }
    ],
    views: 32000,
    usageCount: 890,
    isPublished: true,
    userId: mockUsers.default,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
    thumbnailUrl: 'https://placehold.co/600x800/green/white?text=Recipe+Template',
    totalDuration: 10
  },
  {
    id: 'template_005',
    name: 'Travel Vlog',
    industry: 'Travel',
    category: 'YouTube',
    description: 'Share your travel experiences with this template',
    sections: [
      {
        id: 'section_009',
        name: 'Destination Intro',
        duration: 5,
        textOverlays: [
          {
            id: 'text_009',
            text: 'Welcome to [Destination]',
            position: 'bottom',
            style: 'headline',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#03A9F4',
        order: 0
      },
      {
        id: 'section_010',
        name: 'Highlights',
        duration: 8,
        textOverlays: [
          {
            id: 'text_010',
            text: 'Must-see places',
            position: 'top',
            style: 'caption',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#0288D1',
        order: 1
      }
    ],
    views: 18500,
    usageCount: 320,
    isPublished: true,
    userId: mockUsers.premium,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(10),
    thumbnailUrl: 'https://placehold.co/600x800/teal/white?text=Travel+Template',
    totalDuration: 13
  }
]; 