import React from 'react';
import Link from 'next/link';
import { ChevronRight, TrendingUp } from 'lucide-react';

interface SimilarTemplateProps {
  id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  similarityScore: number;
  engagementRate: number;
  views: number;
  velocityScore?: number;
}

/**
 * SimilarTemplateCard displays a template that's similar to the currently viewed one
 * along with a similarity score and key metrics
 */
const SimilarTemplateCard: React.FC<SimilarTemplateProps> = ({
  id,
  title,
  category,
  thumbnailUrl,
  similarityScore,
  engagementRate,
  views,
  velocityScore
}) => {
  // Format view count to human-readable format (e.g., 1.2M)
  const formatViews = (viewCount: number): string => {
    if (viewCount >= 1000000) {
      return `${(viewCount / 1000000).toFixed(1)}M`;
    } else if (viewCount >= 1000) {
      return `${(viewCount / 1000).toFixed(1)}K`;
    }
    return viewCount.toString();
  };

  // Convert similarity score (0-1) to percentage
  const similarityPercentage = Math.round(similarityScore * 100);
  
  // Determine color based on similarity score
  const getSimilarityColor = () => {
    if (similarityPercentage >= 80) return 'bg-green-500';
    if (similarityPercentage >= 60) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Top part with image and similarity score */}
      <div className="relative">
        <div className="aspect-video bg-gray-100">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              No thumbnail
            </div>
          )}
        </div>
        
        {/* Similarity badge */}
        <div className="absolute top-2 right-2">
          <div className={`text-xs font-semibold text-white px-2 py-1 rounded-full flex items-center ${getSimilarityColor()}`}>
            {similarityPercentage}% match
          </div>
        </div>
        
        {/* Trending indicator if applicable */}
        {velocityScore && velocityScore > 5 && (
          <div className="absolute top-2 left-2">
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3 flex-grow">
        <div className="text-xs text-gray-500 mb-1">{category}</div>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{title}</h3>
        
        {/* Stats */}
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <div className="flex items-center">
            <span className="font-medium">{formatViews(views)}</span>
            <span className="ml-1">views</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">{(engagementRate * 100).toFixed(1)}%</span>
            <span className="ml-1">engagement</span>
          </div>
        </div>
      </div>
      
      {/* Footer with link */}
      <Link 
        href={`/templates/${id}`}
        className="mt-auto bg-gray-50 px-3 py-2 text-sm text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors flex justify-between items-center"
      >
        View template
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default SimilarTemplateCard; 