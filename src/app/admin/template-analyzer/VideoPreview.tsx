import React from 'react';
import { Play, Heart, MessageCircle, Eye, Share2 } from 'lucide-react';

// Define the TikTokVideo interface locally to avoid type conflicts
interface TikTokVideo {
  id: string;
  text: string;
  createTime: number;
  authorMeta: {
    id: string;
    name: string;
    nickname: string;
    verified: boolean;
  };
  musicMeta?: {
    musicId: string;
    musicName: string;
    musicAuthor: string;
    musicUrl?: string;
    duration?: number;
    isOriginal?: boolean;
    usageCount?: number;
  };
  videoMeta?: {
    height: number;
    width: number;
    duration: number;
  };
  hashtags?: string[];
  stats: {
    commentCount: number;
    diggCount: number;
    playCount: number;
    shareCount: number;
  };
  webVideoUrl?: string;
}

// Accept a TikTokVideo object
interface VideoPreviewProps {
  video: TikTokVideo;
}

export default function VideoPreview({ video }: VideoPreviewProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };

  const formattedDuration = video.videoMeta?.duration 
    ? `${Math.floor(video.videoMeta.duration / 60)}:${(video.videoMeta.duration % 60).toString().padStart(2, '0')}`
    : '0:00';

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="relative pt-[177.77%] bg-gray-100 flex items-center justify-center">
        {/* Placeholder for video thumbnail/preview */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800">
          <div className="absolute inset-0 opacity-10" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
            }}
          />
          <div className="text-center z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer group transition-all hover:bg-blue-200">
                <Play fill="#3b82f6" size={24} className="text-blue-600 ml-1 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <p className="text-sm font-medium">TikTok Video Preview</p>
            <p className="text-xs mt-1 text-gray-500">ID: {video.id}</p>
            <p className="text-xs mt-3 text-gray-500">{formatDate(video.createTime)}</p>
          </div>
        </div>
        
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm border border-gray-800">
          {formattedDuration}
        </div>
      </div>
      <div className="p-4 bg-white">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm shadow-sm">
            {video.authorMeta.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <span className="font-medium text-sm text-gray-800">{video.authorMeta.nickname}</span>
              {video.authorMeta.verified && (
                <span className="ml-1 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Content Creator</p>
          </div>
        </div>
        <p className="text-sm mb-4 text-gray-700 line-clamp-2">{video.text}</p>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
            <div className="flex items-center justify-center mb-1 text-red-500">
              <Heart size={14} className="mr-1" />
            </div>
            <div className="text-gray-500">Likes</div>
            <div className="text-gray-900 font-semibold">{formatNumber(video.stats.diggCount)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
            <div className="flex items-center justify-center mb-1 text-blue-500">
              <MessageCircle size={14} className="mr-1" />
            </div>
            <div className="text-gray-500">Comments</div>
            <div className="text-gray-900 font-semibold">{formatNumber(video.stats.commentCount)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
            <div className="flex items-center justify-center mb-1 text-purple-500">
              <Eye size={14} className="mr-1" />
            </div>
            <div className="text-gray-500">Views</div>
            <div className="text-gray-900 font-semibold">{formatNumber(video.stats.playCount)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg py-2 px-1 border border-gray-100">
            <div className="flex items-center justify-center mb-1 text-green-500">
              <Share2 size={14} className="mr-1" />
            </div>
            <div className="text-gray-500">Shares</div>
            <div className="text-gray-900 font-semibold">{formatNumber(video.stats.shareCount)}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 