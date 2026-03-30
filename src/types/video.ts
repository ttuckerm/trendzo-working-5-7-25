export interface Video {
  id: string;
  thumbnailUrl: string;
  videoUrl: string;
  title: string;
  creator: string;
  avatarUrl: string;
  views: number;
  likes: number;
  comments: number;
  predictionScore: number;
  hashtags: string[];
  isTrendingAudio?: boolean;
  isHighSaves?: boolean;
  isAuthentic?: boolean;
  // Add any other relevant fields you might need
}

// Keep the existing VideoPrediction interface for compatibility
export interface VideoPrediction {
  id: string;
  title: string;
  author: string;
  creator?: string;
  thumbnail_url?: string;
  video_url?: string;
  video_preview_url?: string;
  viral_score?: number;
  engagement_score: number;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  platform: string;
  created_at: string;
  description?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  tags: string[];
  template_data: any; // Or a more specific type if you have one for the editor
}