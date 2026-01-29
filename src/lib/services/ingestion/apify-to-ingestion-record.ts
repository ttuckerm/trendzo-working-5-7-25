// Note: Avoid importing project-wide Supabase types here to keep demo type-check lean

export interface ApifyTikTokItem {
  id: string;
  desc?: string;
  createTime?: number;
  webVideoUrl?: string;
  videoUrl?: string;
  covers?: { default?: string; origin?: string; dynamic?: string };
  authorMeta?: { id?: string; name?: string; nickname?: string };
  videoMeta?: { duration?: number };
  music?: { id?: string };
  musicMeta?: { musicId?: string };
  stats?: { playCount?: number; diggCount?: number; commentCount?: number; shareCount?: number };
  hashtags?: string[];
}

export interface VideoIngestionRecord {
  id: string;
  platform: 'tiktok' | 'youtube' | 'instagram' | 'linkedin';
  web_url: string;
  video_url?: string | null;
  thumbnail_url?: string | null;
  author_id?: string | null;
  author_username: string;
  caption: string;
  hashtags: string[];
  sound_id?: string | null;
  duration_sec: number;
  created_at_platform: string; // ISO
  niches: string[];
  frameworks: string[];
  template_id?: string | null;
  stats: { views: number; likes: number; comments: number; shares: number; snapshot_at?: string | null };
  rollup_48h?: { views: number; likes: number; comments: number; shares: number; snapshot_at?: string | null } | null;
  derived: { engagement_rate: number; velocity_score: number; viral_score?: number | null };
  metadata?: Record<string, unknown>;
}

function parseHashtagsFromCaption(caption: string | undefined): string[] {
  if (!caption) return [];
  const matches = caption.match(/#[a-zA-Z0-9_]+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

function chooseThumbnail(covers?: { default?: string; origin?: string; dynamic?: string }): string | null {
  return covers?.origin || covers?.default || covers?.dynamic || null;
}

function toIsoFromEpochSeconds(epoch?: number): string {
  const ms = (epoch || 0) * 1000;
  return new Date(ms || Date.now()).toISOString();
}

export function mapApifyItemToIngestionRecord(item: ApifyTikTokItem): VideoIngestionRecord {
  const caption = item.desc || '';
  const hashtags = item.hashtags && item.hashtags.length ? item.hashtags : parseHashtagsFromCaption(caption);

  const views = item.stats?.playCount || 0;
  const likes = item.stats?.diggCount || 0;
  const comments = item.stats?.commentCount || 0;
  const shares = item.stats?.shareCount || 0;

  const hoursSince = Math.max((Date.now() - ((item.createTime || 0) * 1000)) / (1000 * 60 * 60), 1);
  const engagementRate = (likes + comments + shares) / Math.max(views, 1);
  const velocity = views / hoursSince;

  return {
    id: item.id,
    platform: 'tiktok',
    web_url: item.webVideoUrl || item.videoUrl || `https://www.tiktok.com/@_/video/${item.id}`,
    video_url: item.videoUrl || null,
    thumbnail_url: chooseThumbnail(item.covers),
    author_id: item.authorMeta?.id || null,
    author_username: item.authorMeta?.name || item.authorMeta?.nickname || 'unknown',
    caption,
    hashtags,
    sound_id: item.musicMeta?.musicId || item.music?.id || null,
    duration_sec: item.videoMeta?.duration || 0,
    created_at_platform: toIsoFromEpochSeconds(item.createTime),
    niches: [],
    frameworks: [],
    template_id: null,
    stats: { views, likes, comments, shares },
    rollup_48h: null,
    derived: { engagement_rate: engagementRate, velocity_score: velocity, viral_score: null },
    metadata: {}
  };
}









