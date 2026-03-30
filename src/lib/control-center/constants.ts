import { PageDefinition, ComponentDefinition } from './types';

export const PAGE_DEFINITIONS: PageDefinition[] = [
  {
    id: 'scraping',
    name: 'Scraping',
    path: '/admin/scraping',
    description: 'TikTok data collection and video scraping',
    icon: 'Download',
    workflows: [
      { id: 'apify-scraper', name: 'Apify Scraper', description: 'Scrape TikTok videos via Apify' },
      { id: 'video-downloader', name: 'Video Downloader', description: 'Download videos from URLs' }
    ],
    components: ['apify-api', 'video-storage', 'metadata-extractor']
  },
  {
    id: 'component-test',
    name: 'Component Test',
    path: '/admin/component-test',
    description: 'Test individual AI components in isolation',
    icon: 'FlaskConical',
    workflows: [
      { id: 'component-tester', name: 'Component Tester', description: 'Test components individually' }
    ],
    components: ['all']
  },
  {
    id: 'calibration',
    name: 'Calibration Lab',
    path: '/admin/calibration',
    description: 'Diagnose and fix prediction accuracy issues',
    icon: 'FlaskConical',
    workflows: [
      { id: 'diagnostic-runner', name: 'Diagnostic Runner', description: 'Run calibration diagnostics on sample transcripts' },
      { id: 'calibration-config', name: 'Calibration Config', description: 'Manage component calibration parameters' },
      { id: 'auto-calibrator', name: 'Auto Calibrator', description: 'Automatically adjust calibration based on history' }
    ],
    components: ['xgboost', 'gpt4', 'pattern-extraction', 'historical-analyzer', 'gemini', 'negative-signal-detector', 'score-calibrator']
  },
  {
    id: 'upload-test',
    name: 'Upload Test',
    path: '/admin/upload-test',
    description: 'Test predictions on uploaded videos',
    icon: 'Upload',
    workflows: [
      { id: 'video-upload', name: 'Video Upload', description: 'Upload video files' },
      { id: 'prediction-pipeline', name: 'Prediction Pipeline', description: 'Full prediction workflow' }
    ],
    components: ['ffmpeg', 'whisper', 'xgboost', 'gpt4', 'gemini', 'feature-extraction']
  },
  {
    id: 'bulk-download',
    name: 'Bulk Download',
    path: '/admin/bulk-download',
    description: 'Download videos in bulk from URLs',
    icon: 'Download',
    workflows: [
      { id: 'bulk-downloader', name: 'Bulk Downloader', description: 'Download multiple videos' }
    ],
    components: ['kling-api', 'video-storage']
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    path: '/admin/bloomberg',
    description: 'Analytics terminal for viral metrics',
    icon: 'BarChart3',
    workflows: [
      { id: 'data-aggregation', name: 'Data Aggregation', description: 'Aggregate viral metrics' },
      { id: 'chart-renderer', name: 'Chart Renderer', description: 'Render analytics charts' }
    ],
    components: ['data-aggregator']
  },
  {
    id: 'studio',
    name: 'Studio',
    path: '/admin/studio',
    description: 'Video and script creation studio',
    icon: 'Video',
    workflows: [
      { id: 'script-generator', name: 'Script Generator', description: 'Generate viral scripts' },
      { id: 'video-creator', name: 'Video Creator', description: 'Create videos from scripts' }
    ],
    components: ['gpt4', 'claude', 'script-engine']
  },
  {
    id: 'algorithm-iq',
    name: 'Algorithm IQ',
    path: '/admin/algorithm-iq',
    description: 'Prediction accuracy tracking over time',
    icon: 'Brain',
    workflows: [
      { id: 'accuracy-tracker', name: 'Accuracy Tracker', description: 'Track prediction accuracy' }
    ],
    components: ['accuracy-calculator', 'trend-analyzer']
  },
  {
    id: 'training-data',
    name: 'Training Data',
    path: '/admin/operations/training/data',
    description: 'ML training dataset management',
    icon: 'Database',
    workflows: [
      { id: 'data-importer', name: 'Data Importer', description: 'Import training data' },
      { id: 'feature-calculator', name: 'Feature Calculator', description: 'Calculate ML features' }
    ],
    components: ['supabase', 'feature-extraction']
  },
  {
    id: 'creators',
    name: 'Creators',
    path: '/admin/creators',
    description: 'Creator management and tracking',
    icon: 'Users',
    workflows: [
      { id: 'creator-crud', name: 'Creator CRUD', description: 'Create, read, update, delete creators' }
    ],
    components: ['supabase']
  },
  {
    id: 'settings',
    name: 'Settings',
    path: '/admin/settings',
    description: 'System configuration and settings',
    icon: 'Settings',
    workflows: [
      { id: 'settings-manager', name: 'Settings Manager', description: 'Manage system settings' }
    ],
    components: ['config-store']
  },
  {
    id: 'error-logs',
    name: 'Error Logs',
    path: '/admin/error-logs',
    description: 'System error tracking and debugging',
    icon: 'AlertTriangle',
    workflows: [
      { id: 'log-aggregator', name: 'Log Aggregator', description: 'Aggregate system logs' }
    ],
    components: ['logger', 'error-tracker']
  },
  {
    id: 'home',
    name: 'Home',
    path: '/',
    description: 'Landing page and main dashboard',
    icon: 'Home',
    workflows: [
      { id: 'home-renderer', name: 'Home Renderer', description: 'Render home page' }
    ],
    components: ['nextjs', 'react']
  },
  {
    id: 'auth-login',
    name: 'Login',
    path: '/auth',
    description: 'User authentication',
    icon: 'LogIn',
    workflows: [
      { id: 'auth-flow', name: 'Auth Flow', description: 'Handle user login' }
    ],
    components: ['supabase-auth']
  },
  {
    id: 'auth-signup',
    name: 'Signup',
    path: '/auth?signup=true',
    description: 'New user registration',
    icon: 'LogIn',
    workflows: [
      { id: 'signup-flow', name: 'Signup Flow', description: 'Handle user registration' }
    ],
    components: ['supabase-auth', 'email-service']
  }
];

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // ML Models
  { id: 'xgboost', name: 'XGBoost Predictor', description: 'Main ML model for DPS prediction', category: 'ml' },
  
  // LLMs
  { id: 'gpt4', name: 'GPT-4 Refinement', description: 'Qualitative analysis and refinement', category: 'llm' },
  { id: 'gemini', name: 'Gemini 3 Pro', description: 'Google AI for video understanding', category: 'llm' },
  { id: 'claude', name: 'Claude', description: 'Anthropic AI for analysis', category: 'llm' },
  
  // Frameworks
  { id: 'feature-extraction', name: 'Feature Extraction', description: 'Extracts 119 features from content', category: 'framework' },
  { id: '7-legos', name: '7 Idea Legos', description: 'Pattern extraction framework', category: 'framework' },
  { id: '9-attributes', name: '9 Attributes', description: 'Viral attribute scoring', category: 'framework' },
  { id: '24-styles', name: '24 Video Styles', description: 'Style classification', category: 'framework' },
  { id: 'virality-matrix', name: 'Virality Matrix', description: 'TikTok virality scoring', category: 'framework' },
  { id: 'hook-scorer', name: 'Hook Scorer', description: 'Opening hook effectiveness', category: 'framework' },
  { id: 'pattern-extraction', name: 'Pattern Extraction', description: 'Multi-LLM pattern extraction', category: 'framework' },
  
  // Services
  { id: 'vader-sentiment', name: 'VADER Sentiment', description: 'Social media sentiment analysis', category: 'service' },
  { id: 'pyscenedetect', name: 'PySceneDetect', description: 'Scene/cut detection in videos', category: 'service' },
  { id: 'shap-explainer', name: 'SHAP Explainer', description: 'XGBoost prediction explainability', category: 'service' },
  { id: 'faster-whisper', name: 'faster-whisper', description: 'Fast local transcription', category: 'service' },
  { id: 'whisper', name: 'Whisper (OpenAI)', description: 'Audio transcription', category: 'service' },
  { id: 'ffmpeg', name: 'FFmpeg Visual', description: 'Video frame and visual analysis', category: 'service' },
  
  // Utilities
  { id: 'historical-analyzer', name: 'Historical Analyzer', description: 'Historical performance analysis', category: 'utility' },
  { id: 'trend-timing', name: 'Trend Timing', description: 'Trend timing optimization', category: 'utility' },
  { id: 'posting-optimizer', name: 'Posting Optimizer', description: 'Optimal posting time', category: 'utility' },
  { id: 'thumbnail-analyzer', name: 'Thumbnail Analyzer', description: 'Thumbnail effectiveness', category: 'utility' },
  { id: 'audio-analyzer', name: 'Audio Analyzer', description: 'Audio quality and music detection', category: 'utility' },
  { id: 'niche-keywords', name: 'Niche Keywords', description: 'Niche-specific keyword analysis', category: 'utility' },
  
  // Calibration
  { id: 'negative-signal-detector', name: 'Negative Signal Detector', description: 'Detects weak hooks, filler words, and other negative signals', category: 'utility' },
  { id: 'score-calibrator', name: 'Score Calibrator', description: 'Applies calibration curves to reduce prediction bias', category: 'utility' }
];

export const ENHANCEMENT_DEFINITIONS = [
  { id: 'pyscenedetect', name: 'PySceneDetect', description: 'Scene/cut detection in videos' },
  { id: 'vader-sentiment', name: 'VADER Sentiment', description: 'Social media sentiment analysis' },
  { id: 'faster-whisper', name: 'faster-whisper', description: 'Fast local transcription' },
  { id: 'shap-explainer', name: 'SHAP Explainer', description: 'XGBoost prediction explainability' }
];

// Category display names and colors
export const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  ml: { label: 'ML Model', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  llm: { label: 'LLM', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  framework: { label: 'Framework', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  service: { label: 'Service', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  utility: { label: 'Utility', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
};

// Status display config
export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  healthy: { label: 'Healthy', color: 'text-green-400', bgColor: 'bg-green-500/20', dotColor: 'bg-green-500' },
  warning: { label: 'Warning', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', dotColor: 'bg-yellow-500' },
  error: { label: 'Error', color: 'text-red-400', bgColor: 'bg-red-500/20', dotColor: 'bg-red-500' },
  inactive: { label: 'Inactive', color: 'text-gray-400', bgColor: 'bg-gray-500/20', dotColor: 'bg-gray-500' },
  running: { label: 'Running', color: 'text-blue-400', bgColor: 'bg-blue-500/20', dotColor: 'bg-blue-500' }
};





