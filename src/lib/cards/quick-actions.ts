export const QUICK_ACTIONS: Record<string, string[]> = {
  'cooking': [
    'What should I cook tonight?',
    'Quick meal prep ideas',
    'Best cooking hacks for beginners',
  ],
  'fitness': [
    'Best workout for weight loss?',
    'How to stay consistent',
    'Home workout plan',
  ],
  'personal-finance': [
    'How to start budgeting',
    'Best way to save money',
    'Investing for beginners',
  ],
  'side-hustles': [
    'Best side hustles for beginners',
    'How to make $1K/month online',
    'Fastest way to first dollar',
  ],
  'business': [
    'How to get first customers',
    'Best pricing strategies',
    'When to quit my day job?',
  ],
  'food-nutrition': [
    'Best foods for energy',
    'Simple meal plan ideas',
    'How to track macros easily',
  ],
  'beauty': [
    'Best skincare routine',
    'How to find my skin type',
    'Affordable product dupes',
  ],
  'real-estate': [
    'Tips for first-time buyers',
    'How to invest in property',
    'Best cities to invest in',
  ],
  'self-improvement': [
    'Best morning routine tips',
    'How to build good habits',
    'Top productivity hacks',
  ],
  'dating': [
    'How to improve communication',
    'Best first date ideas',
    'Red flags to watch for',
  ],
  'education': [
    'Best study techniques',
    'How to stay focused',
    'Exam prep strategies',
  ],
  'career': [
    'How to negotiate salary',
    'Best resume tips',
    'How to switch careers',
  ],
  'parenting': [
    'Tips for new parents',
    'Fun activities for kids',
    'How to manage screen time',
  ],
  'tech': [
    'Best gadgets under $100',
    'How to learn coding',
    'Top apps for productivity',
  ],
  'fashion': [
    'How to build a capsule wardrobe',
    'Best budget fashion tips',
    'Outfit ideas for work',
  ],
  'health': [
    'How to improve sleep quality',
    'Best daily health habits',
    'When to see a doctor',
  ],
  'psychology': [
    'How to manage anxiety',
    'Best mindfulness exercises',
    'Understanding attachment styles',
  ],
  'travel': [
    'Best budget travel tips',
    'How to plan a trip',
    'Hidden gem destinations',
  ],
  'diy': [
    'Easy weekend projects',
    'Best tools for beginners',
    'Budget renovation ideas',
  ],
  'language': [
    'Fastest way to learn a language',
    'Best apps for language learning',
    'How to practice speaking',
  ],
}

const DEFAULT_ACTIONS = [
  'What content should I create?',
  'How to grow my audience',
  'Best strategy for beginners',
]

export function getQuickActions(niche: string): string[] {
  return QUICK_ACTIONS[niche] || DEFAULT_ACTIONS
}
