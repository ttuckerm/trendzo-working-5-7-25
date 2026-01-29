'use client';

import React, { useState } from 'react';
import styles from '../ViralLabV2.module.css';

interface NetflixGalleryProps {
  onNicheSelect: (niche: string, template?: TemplateData) => void;
}

interface TemplateData {
  id: string;
  title: string;
  framework: string;
  views: string;
  viralScore: number;
  thumbnail: string;
  duration: string;
  category: string;
}

// Template data organized by niche
const NICHE_TEMPLATES: Record<string, TemplateData[]> = {
  'Personal Finance/Investing': [
    {
      id: 'pf1',
      title: 'Investment Strategy That Changed Everything',
      framework: 'Authority Framework',
      views: '2.1M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:32',
      category: 'Investment Tips'
    },
    {
      id: 'pf2',
      title: 'POV: You Start Investing at 25',
      framework: 'POV Framework',
      views: '3.4M',
      viralScore: 92,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:28',
      category: 'Life Advice'
    },
    {
      id: 'pf3',
      title: '3 Money Mistakes I Made in My 20s',
      framework: 'Story Framework',
      views: '1.8M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:45',
      category: 'Personal Story'
    },
    {
      id: 'pf4',
      title: 'How I Built $100K Portfolio',
      framework: 'Tutorial Framework',
      views: '2.7M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:38',
      category: 'Tutorial'
    },
    {
      id: 'pf5',
      title: 'Rich vs Poor Mindset',
      framework: 'Comparison Framework',
      views: '4.2M',
      viralScore: 94,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:25',
      category: 'Mindset'
    }
  ],
  'Fitness/Weight Loss': [
    {
      id: 'fw1',
      title: 'Fitness Transformation in 30 Days',
      framework: 'Transformation Framework',
      views: '2.3M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Transformation'
    },
    {
      id: 'fw2',
      title: 'POV: You Start Working Out Consistently',
      framework: 'POV Framework',
      views: '1.9M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:30',
      category: 'Motivation'
    },
    {
      id: 'fw3',
      title: 'Quick Home Workout (No Equipment)',
      framework: 'Tutorial Framework',
      views: '3.1M',
      viralScore: 91,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:42',
      category: 'Tutorial'
    },
    {
      id: 'fw4',
      title: 'Gym Mistakes Everyone Makes',
      framework: 'Educational Framework',
      views: '1.6M',
      viralScore: 83,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:28',
      category: 'Education'
    },
    {
      id: 'fw5',
      title: 'Day in Life: Fitness Coach',
      framework: 'Day-in-Life Framework',
      views: '2.8M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:50',
      category: 'Lifestyle'
    }
  ],
  'Business/Entrepreneurship': [
    {
      id: 'be1',
      title: 'Business Hack Nobody Talks About',
      framework: 'Secret Knowledge Framework',
      views: '3.1M',
      viralScore: 92,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Business Tips'
    },
    {
      id: 'be2',
      title: 'How I Built $1M Business',
      framework: 'Success Story Framework',
      views: '2.5M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:41',
      category: 'Success Story'
    },
    {
      id: 'be3',
      title: 'Entrepreneur Morning Routine',
      framework: 'Day-in-Life Framework',
      views: '1.7M',
      viralScore: 84,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:37',
      category: 'Routine'
    },
    {
      id: 'be4',
      title: 'Startup Mistakes That Kill Companies',
      framework: 'Educational Framework',
      views: '2.2M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:29',
      category: 'Education'
    },
    {
      id: 'be5',
      title: 'Side Hustle Ideas for 2024',
      framework: 'List Framework',
      views: '3.6M',
      viralScore: 93,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:44',
      category: 'Ideas'
    }
  ],
  'Beauty/Skincare': [
    {
      id: 'bs1',
      title: 'Skincare Routine That Changed My Skin',
      framework: 'Transformation Framework',
      views: '1.8M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:36',
      category: 'Routine'
    },
    {
      id: 'bs2',
      title: 'POV: You Finally Find Your Skincare',
      framework: 'POV Framework',
      views: '2.4M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:31',
      category: 'Discovery'
    },
    {
      id: 'bs3',
      title: 'Quick Makeup Tutorial',
      framework: 'Tutorial Framework',
      views: '3.2M',
      viralScore: 91,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:39',
      category: 'Tutorial'
    },
    {
      id: 'bs4',
      title: 'Skincare Myths vs Facts',
      framework: 'Educational Framework',
      views: '1.5M',
      viralScore: 82,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:27',
      category: 'Education'
    },
    {
      id: 'bs5',
      title: 'Get Ready With Me: Natural Look',
      framework: 'GRWM Framework',
      views: '2.9M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:48',
      category: 'GRWM'
    }
  ],
  'Real Estate/Property': [
    {
      id: 're1',
      title: 'How I Bought My First House at 23',
      framework: 'Success Story Framework',
      views: '2.1M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:34',
      category: 'Success Story'
    },
    {
      id: 're2',
      title: 'Real Estate Mistakes to Avoid',
      framework: 'Educational Framework',
      views: '1.6M',
      viralScore: 83,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:29',
      category: 'Education'
    },
    {
      id: 're3',
      title: 'Property Investment Strategy',
      framework: 'Tutorial Framework',
      views: '2.8M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:42',
      category: 'Strategy'
    },
    {
      id: 're4',
      title: 'POV: You Start House Hunting',
      framework: 'POV Framework',
      views: '1.9M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Experience'
    },
    {
      id: 're5',
      title: 'Day in Life: Real Estate Agent',
      framework: 'Day-in-Life Framework',
      views: '2.3M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:46',
      category: 'Lifestyle'
    }
  ],
  'Self-Improvement/Productivity': [
    {
      id: 'sp1',
      title: 'Morning Routine That Changed My Life',
      framework: 'Transformation Framework',
      views: '2.0M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:34',
      category: 'Routine'
    },
    {
      id: 'sp2',
      title: 'Productivity Hack Nobody Talks About',
      framework: 'Secret Knowledge Framework',
      views: '1.7M',
      viralScore: 84,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:29',
      category: 'Productivity'
    },
    {
      id: 'sp3',
      title: 'How I Get More Done in 4 Hours',
      framework: 'Tutorial Framework',
      views: '2.8M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:41',
      category: 'Efficiency'
    },
    {
      id: 'sp4',
      title: 'Self-Improvement Mistakes to Avoid',
      framework: 'Educational Framework',
      views: '1.4M',
      viralScore: 81,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:26',
      category: 'Education'
    },
    {
      id: 'sp5',
      title: 'POV: You Finally Get Your Life Together',
      framework: 'POV Framework',
      views: '3.2M',
      viralScore: 93,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Lifestyle'
    }
  ],
  'Dating/Relationships': [
    {
      id: 'dr1',
      title: 'Dating Red Flags Everyone Ignores',
      framework: 'Educational Framework',
      views: '2.4M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Education'
    },
    {
      id: 'dr2',
      title: 'How I Met My Soulmate',
      framework: 'Story Framework',
      views: '1.9M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:42',
      category: 'Success Story'
    },
    {
      id: 'dr3',
      title: 'Relationship Advice That Actually Works',
      framework: 'Authority Framework',
      views: '2.1M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:38',
      category: 'Advice'
    },
    {
      id: 'dr4',
      title: 'POV: You Finally Find Someone Who Gets You',
      framework: 'POV Framework',
      views: '3.0M',
      viralScore: 91,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:31',
      category: 'Experience'
    },
    {
      id: 'dr5',
      title: 'Communication Mistakes Killing Your Relationship',
      framework: 'Problem Framework',
      views: '1.6M',
      viralScore: 83,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:29',
      category: 'Communication'
    }
  ],
  'Education/Study Tips': [
    {
      id: 'es1',
      title: 'Study Method That Tripled My Grades',
      framework: 'Transformation Framework',
      views: '1.8M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Study Method'
    },
    {
      id: 'es2',
      title: 'How to Remember Everything You Study',
      framework: 'Tutorial Framework',
      views: '2.2M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:36',
      category: 'Memory'
    },
    {
      id: 'es3',
      title: 'Exam Stress? Try This',
      framework: 'Solution Framework',
      views: '1.5M',
      viralScore: 82,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:27',
      category: 'Stress Management'
    },
    {
      id: 'es4',
      title: 'POV: You Actually Enjoy Studying',
      framework: 'POV Framework',
      views: '2.7M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:30',
      category: 'Motivation'
    },
    {
      id: 'es5',
      title: 'Study Mistakes Everyone Makes',
      framework: 'Educational Framework',
      views: '1.9M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:32',
      category: 'Common Mistakes'
    }
  ],
  'Career/Job Advice': [
    {
      id: 'cj1',
      title: 'How I Got My Dream Job',
      framework: 'Success Story Framework',
      views: '2.3M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:39',
      category: 'Success Story'
    },
    {
      id: 'cj2',
      title: 'Interview Mistakes That Cost You the Job',
      framework: 'Educational Framework',
      views: '1.7M',
      viralScore: 84,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:31',
      category: 'Interview Tips'
    },
    {
      id: 'cj3',
      title: 'Career Change at 30? Here\'s How',
      framework: 'Tutorial Framework',
      views: '2.5M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:44',
      category: 'Career Change'
    },
    {
      id: 'cj4',
      title: 'Salary Negotiation Secrets',
      framework: 'Authority Framework',
      views: '3.1M',
      viralScore: 92,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Negotiation'
    },
    {
      id: 'cj5',
      title: 'POV: You Love Your Job',
      framework: 'POV Framework',
      views: '1.8M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:28',
      category: 'Work Life'
    }
  ],
  'Parenting/Family': [
    {
      id: 'pf1',
      title: 'Parenting Hack That Changed Everything',
      framework: 'Secret Knowledge Framework',
      views: '2.0M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:37',
      category: 'Parenting Tips'
    },
    {
      id: 'pf2',
      title: 'How to Raise Confident Kids',
      framework: 'Tutorial Framework',
      views: '1.9M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:41',
      category: 'Child Development'
    },
    {
      id: 'pf3',
      title: 'Family Traditions That Matter',
      framework: 'Story Framework',
      views: '1.4M',
      viralScore: 81,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Family Life'
    },
    {
      id: 'pf4',
      title: 'POV: You\'re a Great Parent',
      framework: 'POV Framework',
      views: '2.8M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:29',
      category: 'Validation'
    },
    {
      id: 'pf5',
      title: 'Balancing Work and Family Life',
      framework: 'Solution Framework',
      views: '2.2M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:38',
      category: 'Work-Life Balance'
    }
  ],
  'Tech Reviews/Tutorials': [
    {
      id: 'tr1',
      title: 'iPhone Tips Apple Doesn\'t Tell You',
      framework: 'Secret Knowledge Framework',
      views: '3.4M',
      viralScore: 93,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:36',
      category: 'Tech Tips'
    },
    {
      id: 'tr2',
      title: 'Gadget Review: Worth the Hype?',
      framework: 'Review Framework',
      views: '1.8M',
      viralScore: 84,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:42',
      category: 'Reviews'
    },
    {
      id: 'tr3',
      title: 'How to Set Up Your Home Office Tech',
      framework: 'Tutorial Framework',
      views: '2.1M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:45',
      category: 'Setup Guide'
    },
    {
      id: 'tr4',
      title: 'Tech Mistakes Costing You Money',
      framework: 'Educational Framework',
      views: '2.7M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Money Saving'
    },
    {
      id: 'tr5',
      title: 'POV: You Finally Understand Tech',
      framework: 'POV Framework',
      views: '1.5M',
      viralScore: 82,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:28',
      category: 'Understanding'
    }
  ],
  'Fashion/Style': [
    {
      id: 'fs1',
      title: 'Style Mistakes Making You Look Older',
      framework: 'Educational Framework',
      views: '2.6M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Style Tips'
    },
    {
      id: 'fs2',
      title: 'How to Look Expensive on a Budget',
      framework: 'Tutorial Framework',
      views: '3.2M',
      viralScore: 91,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:39',
      category: 'Budget Fashion'
    },
    {
      id: 'fs3',
      title: 'Fashion Transformation in 30 Days',
      framework: 'Transformation Framework',
      views: '1.9M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:41',
      category: 'Makeover'
    },
    {
      id: 'fs4',
      title: 'POV: You Finally Found Your Style',
      framework: 'POV Framework',
      views: '2.4M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:32',
      category: 'Personal Style'
    },
    {
      id: 'fs5',
      title: 'Wardrobe Essentials Every Person Needs',
      framework: 'List Framework',
      views: '2.0M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:37',
      category: 'Essentials'
    }
  ],
  'Health/Medical Education': [
    {
      id: 'hm1',
      title: 'Health Myths Your Doctor Won\'t Tell You',
      framework: 'Secret Knowledge Framework',
      views: '2.8M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:38',
      category: 'Health Facts'
    },
    {
      id: 'hm2',
      title: 'How to Read Your Blood Test Results',
      framework: 'Educational Framework',
      views: '1.7M',
      viralScore: 83,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:44',
      category: 'Medical Literacy'
    },
    {
      id: 'hm3',
      title: 'Simple Habits That Changed My Health',
      framework: 'Transformation Framework',
      views: '2.5M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:36',
      category: 'Health Habits'
    },
    {
      id: 'hm4',
      title: 'POV: You Finally Prioritize Your Health',
      framework: 'POV Framework',
      views: '2.1M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:31',
      category: 'Wellness'
    },
    {
      id: 'hm5',
      title: 'Medical Red Flags You Should Never Ignore',
      framework: 'Educational Framework',
      views: '3.0M',
      viralScore: 92,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Warning Signs'
    }
  ],
  'Cooking/Recipes': [
    {
      id: 'cr1',
      title: 'Cooking Hack That Saves Hours',
      framework: 'Secret Knowledge Framework',
      views: '2.3M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:29',
      category: 'Cooking Tips'
    },
    {
      id: 'cr2',
      title: '5-Minute Meal That Tastes Gourmet',
      framework: 'Tutorial Framework',
      views: '3.1M',
      viralScore: 91,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Quick Recipes'
    },
    {
      id: 'cr3',
      title: 'How I Learned to Cook From Scratch',
      framework: 'Story Framework',
      views: '1.8M',
      viralScore: 84,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:42',
      category: 'Learning Journey'
    },
    {
      id: 'cr4',
      title: 'POV: You Can Actually Cook Now',
      framework: 'POV Framework',
      views: '2.6M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:27',
      category: 'Confidence'
    },
    {
      id: 'cr5',
      title: 'Kitchen Mistakes Everyone Makes',
      framework: 'Educational Framework',
      views: '2.0M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:34',
      category: 'Common Mistakes'
    }
  ],
  'Psychology/Mental Health': [
    {
      id: 'pm1',
      title: 'Psychology Tricks That Actually Work',
      framework: 'Secret Knowledge Framework',
      views: '2.7M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:37',
      category: 'Psychology'
    },
    {
      id: 'pm2',
      title: 'How to Break Negative Thought Patterns',
      framework: 'Tutorial Framework',
      views: '2.2M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:41',
      category: 'Mental Health'
    },
    {
      id: 'pm3',
      title: 'My Mental Health Journey',
      framework: 'Story Framework',
      views: '1.9M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:46',
      category: 'Personal Story'
    },
    {
      id: 'pm4',
      title: 'POV: You Finally Feel Mentally Free',
      framework: 'POV Framework',
      views: '3.0M',
      viralScore: 92,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Mental Freedom'
    },
    {
      id: 'pm5',
      title: 'Signs You Need to Set Boundaries',
      framework: 'Educational Framework',
      views: '2.4M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Boundaries'
    }
  ],
  'Travel/Lifestyle': [
    {
      id: 'tl1',
      title: 'Travel Hack That Saves Thousands',
      framework: 'Secret Knowledge Framework',
      views: '2.5M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:32',
      category: 'Travel Tips'
    },
    {
      id: 'tl2',
      title: 'How to Travel Full-Time on $50/Day',
      framework: 'Tutorial Framework',
      views: '3.2M',
      viralScore: 93,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:44',
      category: 'Budget Travel'
    },
    {
      id: 'tl3',
      title: 'My Solo Travel Horror Story',
      framework: 'Story Framework',
      views: '1.8M',
      viralScore: 84,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:39',
      category: 'Travel Stories'
    },
    {
      id: 'tl4',
      title: 'POV: You Finally Take That Trip',
      framework: 'POV Framework',
      views: '2.1M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:29',
      category: 'Adventure'
    },
    {
      id: 'tl5',
      title: 'Travel Mistakes That Ruined My Trip',
      framework: 'Educational Framework',
      views: '1.9M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:36',
      category: 'Travel Advice'
    }
  ],
  'DIY/Home Improvement': [
    {
      id: 'dh1',
      title: 'DIY Project That Doubled My Home Value',
      framework: 'Transformation Framework',
      views: '2.4M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:43',
      category: 'Home Value'
    },
    {
      id: 'dh2',
      title: 'How to Fix Anything in Your Home',
      framework: 'Tutorial Framework',
      views: '1.7M',
      viralScore: 83,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:38',
      category: 'Home Repair'
    },
    {
      id: 'dh3',
      title: 'Room Makeover for Under $100',
      framework: 'Budget Framework',
      views: '2.8M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Budget Decor'
    },
    {
      id: 'dh4',
      title: 'POV: You\'re Actually Handy Now',
      framework: 'POV Framework',
      views: '2.0M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:31',
      category: 'Skills'
    },
    {
      id: 'dh5',
      title: 'DIY Mistakes That Cost Me $5000',
      framework: 'Educational Framework',
      views: '2.2M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:40',
      category: 'Lessons Learned'
    }
  ],
  'Language Learning': [
    {
      id: 'll1',
      title: 'How I Became Fluent in 6 Months',
      framework: 'Transformation Framework',
      views: '2.6M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:41',
      category: 'Language Mastery'
    },
    {
      id: 'll2',
      title: 'Language Learning Method That Actually Works',
      framework: 'Tutorial Framework',
      views: '1.9M',
      viralScore: 85,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:37',
      category: 'Methods'
    },
    {
      id: 'll3',
      title: 'Language Learning Mistakes to Avoid',
      framework: 'Educational Framework',
      views: '1.5M',
      viralScore: 82,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Common Mistakes'
    },
    {
      id: 'll4',
      title: 'POV: You Finally Speak Another Language',
      framework: 'POV Framework',
      views: '2.3M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:30',
      category: 'Achievement'
    },
    {
      id: 'll5',
      title: 'Free Resources for Learning Any Language',
      framework: 'List Framework',
      views: '2.0M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:36',
      category: 'Resources'
    }
  ],
  'Side Hustles/Making Money Online': [
    {
      id: 'sm1',
      title: 'Side Hustle That Made Me $10K/Month',
      framework: 'Success Story Framework',
      views: '3.5M',
      viralScore: 94,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:42',
      category: 'Success Story'
    },
    {
      id: 'sm2',
      title: 'How to Make Money Online in 2024',
      framework: 'Tutorial Framework',
      views: '2.8M',
      viralScore: 90,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:38',
      category: 'Online Income'
    },
    {
      id: 'sm3',
      title: 'Side Hustle Ideas That Actually Work',
      framework: 'List Framework',
      views: '2.1M',
      viralScore: 86,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:35',
      category: 'Ideas'
    },
    {
      id: 'sm4',
      title: 'POV: Your Side Hustle Replaces Your Job',
      framework: 'POV Framework',
      views: '2.7M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:33',
      category: 'Financial Freedom'
    },
    {
      id: 'sm5',
      title: 'Money-Making Mistakes I Made',
      framework: 'Educational Framework',
      views: '1.8M',
      viralScore: 84,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:39',
      category: 'Lessons'
    }
  ],
  'Social Media Marketing': [
    {
      id: 'smm1',
      title: 'Social Media Strategy That Went Viral',
      framework: 'Success Story Framework',
      views: '2.9M',
      viralScore: 91,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:36',
      category: 'Strategy'
    },
    {
      id: 'smm2',
      title: 'How to Gain 10K Followers in 30 Days',
      framework: 'Tutorial Framework',
      views: '3.3M',
      viralScore: 93,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:40',
      category: 'Growth'
    },
    {
      id: 'smm3',
      title: 'Content Creation Mistakes Killing Your Reach',
      framework: 'Educational Framework',
      views: '2.2M',
      viralScore: 87,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:34',
      category: 'Content Strategy'
    },
    {
      id: 'smm4',
      title: 'POV: Your Content Finally Goes Viral',
      framework: 'POV Framework',
      views: '2.5M',
      viralScore: 88,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:28',
      category: 'Viral Success'
    },
    {
      id: 'smm5',
      title: 'Social Media Secrets Influencers Won\'t Share',
      framework: 'Secret Knowledge Framework',
      views: '2.7M',
      viralScore: 89,
      thumbnail: '/api/placeholder/300/534',
      duration: '0:37',
      category: 'Insider Tips'
    }
  ]
};

// Popular niches to display first
const FEATURED_NICHES = [
  'Personal Finance/Investing',
  'Fitness/Weight Loss', 
  'Business/Entrepreneurship',
  'Beauty/Skincare',
  'Real Estate/Property'
];

// Additional niches  
const MORE_NICHES = [
  'Self-Improvement/Productivity',
  'Dating/Relationships',
  'Education/Study Tips',
  'Career/Job Advice',
  'Parenting/Family',
  'Tech Reviews/Tutorials',
  'Fashion/Style',
  'Health/Medical Education',
  'Cooking/Recipes',
  'Psychology/Mental Health',
  'Travel/Lifestyle',
  'DIY/Home Improvement',
  'Language Learning',
  'Side Hustles/Making Money Online',
  'Social Media Marketing'
];

export default function NetflixGallery({ onNicheSelect }: NetflixGalleryProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (niche: string, template: TemplateData) => {
    onNicheSelect(niche, template);
  };

  // Show all 20 niches by default
  const displayNiches = [...FEATURED_NICHES, ...MORE_NICHES];

  return (
    <div className={styles.netflixGallery}>
      {/* Header */}
      <div className={styles.galleryHeader}>
        <h1 className={styles.galleryTitle}>
          🧪 Viral Laboratory - Template Gallery
        </h1>
        <p className={styles.gallerySubtitle}>
          Choose your niche and select a viral template to begin your creation workflow
        </p>
      </div>

      {/* Featured Banner */}
      <div className={styles.featuredBanner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerBadge}>🔥 TRENDING NOW</div>
          <h2 className={styles.bannerTitle}>
            POV Format Exploding in Fitness Niche
          </h2>
          <p className={styles.bannerDescription}>
            +340% growth today • Perfect for Authority and Transformation frameworks
          </p>
          <button 
            className={styles.bannerButton}
            onClick={() => handleTemplateSelect('Fitness/Weight Loss', NICHE_TEMPLATES['Fitness/Weight Loss'][1])}
          >
            ▶ Use This Template
          </button>
        </div>
        <div className={styles.bannerThumbnail}>
          <div className={styles.bannerPlayIcon}>▶</div>
        </div>
      </div>

      {/* Netflix-Style Grid */}
      <div className={styles.netflixGrid}>
        {displayNiches.map((niche) => (
          <div key={niche} className={styles.nicheSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{niche}</h2>
              <div className={styles.sectionStats}>
                {NICHE_TEMPLATES[niche]?.length || 5} viral templates • Trending now
              </div>
            </div>
            
            <div className={styles.videoGrid}>
              {(NICHE_TEMPLATES[niche] || []).map((template) => (
                <div
                  key={template.id}
                  className={styles.videoCard}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => handleTemplateSelect(niche, template)}
                >
                  <div className={styles.videoThumbnail}>
                    <div className={styles.thumbnailImage}>
                      {hoveredTemplate === template.id && (
                        <div className={styles.playOverlay}>
                          <div className={styles.playButton}>▶</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.videoMetrics}>
                    <div className={styles.metricsRow}>
                      <span className={styles.metric}>
                        <span className={styles.metricIcon}>👁</span>
                        {template.views}
                      </span>
                      <span className={styles.metric}>
                        <span className={styles.metricIcon}>❤️</span>
                        {Math.floor(parseInt(template.views.replace(/[^\d]/g, '')) * 0.1)}K
                      </span>
                      <span className={styles.metric}>
                        <span className={styles.metricIcon}>🔥</span>
                        {template.viralScore}%
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.videoContent}>
                    <h3 className={styles.videoTitle}>{template.title}</h3>
                    <div className={styles.creatorInfo}>
                      Created by {template.category.toLowerCase().replace(/\s+/g, '')}guru • TIKTOK • {template.duration}
                    </div>
                    
                    <div className={styles.viralBadge}>
                      <span className={styles.badgeIcon}>🎵</span>
                      <span>Viral Success Pattern Identified</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>


    </div>
  );
} 