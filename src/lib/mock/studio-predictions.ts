export interface VideoPrediction {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  viralScore: number;
  predictedViews: number;
  currentViews: number;
  likes: number;
  shares: number;
  engagement: number;
  tags: string[];
  platform: string;
  uploadDate: string;
  predictionDate: string;
}

export const mockPredictions: VideoPrediction[] = [
  {
    id: "pred_001",
    title: "Secret productivity hack that billionaires don't want you to know",
    creator: "productivityguru",
    thumbnail: "https://picsum.photos/320/180?random=1",
    viralScore: 94,
    predictedViews: 2500000,
    currentViews: 847329,
    likes: 126843,
    shares: 8472,
    engagement: 8.7,
    tags: ["productivity", "lifehack", "success", "mindset"],
    platform: "tiktok",
    uploadDate: "2024-01-15T10:30:00Z",
    predictionDate: "2024-01-15T08:00:00Z"
  },
  {
    id: "pred_002", 
    title: "This $5 kitchen tool changed my entire cooking game",
    creator: "kitchenhacks",
    thumbnail: "https://picsum.photos/320/180?random=2",
    viralScore: 87,
    predictedViews: 1800000,
    currentViews: 1234567,
    likes: 198234,
    shares: 12456,
    engagement: 12.4,
    tags: ["cooking", "kitchen", "foodhack", "budget"],
    platform: "tiktok",
    uploadDate: "2024-01-14T16:45:00Z",
    predictionDate: "2024-01-14T14:30:00Z"
  },
  {
    id: "pred_003",
    title: "POV: You just discovered the most aesthetic coffee shop in NYC",
    creator: "nyccoffee",
    thumbnail: "https://picsum.photos/320/180?random=3",
    viralScore: 91,
    predictedViews: 3200000,
    currentViews: 567891,
    likes: 89234,
    shares: 5672,
    engagement: 6.8,
    tags: ["coffee", "nyc", "aesthetic", "pov"],
    platform: "tiktok",
    uploadDate: "2024-01-14T12:20:00Z",
    predictionDate: "2024-01-14T10:15:00Z"
  },
  {
    id: "pred_004",
    title: "Day in my life as a 22-year-old making $200K in tech",
    creator: "techlifestyle",
    thumbnail: "https://picsum.photos/320/180?random=4",
    viralScore: 89,
    predictedViews: 1500000,
    currentViews: 923456,
    likes: 145678,
    shares: 9876,
    engagement: 11.2,
    tags: ["tech", "lifestyle", "money", "career"],
    platform: "tiktok",
    uploadDate: "2024-01-13T09:15:00Z",
    predictionDate: "2024-01-13T07:00:00Z"
  },
  {
    id: "pred_005",
    title: "This makeup technique will change your face shape completely",
    creator: "makeupmagic",
    thumbnail: "https://picsum.photos/320/180?random=5",
    viralScore: 83,
    predictedViews: 2100000,
    currentViews: 1456789,
    likes: 234567,
    shares: 15678,
    engagement: 13.9,
    tags: ["makeup", "beauty", "tutorial", "transformation"],
    platform: "tiktok",
    uploadDate: "2024-01-12T18:30:00Z",
    predictionDate: "2024-01-12T16:45:00Z"
  },
  {
    id: "pred_006",
    title: "Plot twist: This isn't actually what you think it is",
    creator: "mindblown",
    thumbnail: "https://picsum.photos/320/180?random=6",
    viralScore: 76,
    predictedViews: 950000,
    currentViews: 345678,
    likes: 67890,
    shares: 4321,
    engagement: 7.8,
    tags: ["plottwist", "mindblowing", "unexpected", "viral"],
    platform: "tiktok",
    uploadDate: "2024-01-12T14:20:00Z",
    predictionDate: "2024-01-12T12:00:00Z"
  },
  {
    id: "pred_007",
    title: "Rating viral TikTok life hacks so you don't have to",
    creator: "lifehackreviews",
    thumbnail: "https://picsum.photos/320/180?random=7",
    viralScore: 92,
    predictedViews: 2800000,
    currentViews: 1876543,
    likes: 298765,
    shares: 18976,
    engagement: 14.2,
    tags: ["lifehacks", "review", "testing", "viral"],
    platform: "tiktok",
    uploadDate: "2024-01-11T20:10:00Z",
    predictionDate: "2024-01-11T18:30:00Z"
  },
  {
    id: "pred_008",
    title: "Things I wish I knew before moving to Japan",
    creator: "tokyolife",
    thumbnail: "https://picsum.photos/320/180?random=8",
    viralScore: 85,
    predictedViews: 1600000,
    currentViews: 789012,
    likes: 123456,
    shares: 8901,
    engagement: 9.5,
    tags: ["japan", "expat", "culture", "travel"],
    platform: "tiktok",
    uploadDate: "2024-01-11T15:45:00Z",
    predictionDate: "2024-01-11T13:20:00Z"
  },
  {
    id: "pred_009",
    title: "This fitness routine got me abs in 30 days (no gym needed)",
    creator: "homeworkouts",
    thumbnail: "https://picsum.photos/320/180?random=9",
    viralScore: 88,
    predictedViews: 2200000,
    currentViews: 1123456,
    likes: 187654,
    shares: 12345,
    engagement: 10.8,
    tags: ["fitness", "abs", "homeworkout", "transformation"],
    platform: "tiktok",
    uploadDate: "2024-01-10T11:30:00Z",
    predictionDate: "2024-01-10T09:15:00Z"
  },
  {
    id: "pred_010",
    title: "Small business owner reveals how she makes $50K/month",
    creator: "businesssecrets",
    thumbnail: "https://picsum.photos/320/180?random=10",
    viralScore: 95,
    predictedViews: 3500000,
    currentViews: 2345678,
    likes: 356789,
    shares: 23456,
    engagement: 15.1,
    tags: ["business", "entrepreneur", "money", "success"],
    platform: "tiktok",
    uploadDate: "2024-01-09T13:20:00Z",
    predictionDate: "2024-01-09T11:00:00Z"
  }
];