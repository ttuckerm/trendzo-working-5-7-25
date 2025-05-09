import React from 'react';
import SimilarTemplateCard from '@/components/admin/SimilarTemplateCard';
import { BarChart3 } from 'lucide-react';

interface SimilarTemplate {
  id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  similarityScore: number;
  stats: {
    views: number;
    engagementRate: number;
  };
  trendData?: {
    velocityScore?: number;
  };
}

interface SimilarTemplatesSectionProps {
  templates: SimilarTemplate[];
  title?: string;
  description?: string;
}

const SimilarTemplatesSection: React.FC<SimilarTemplatesSectionProps> = ({
  templates,
  title = "Similar Templates",
  description = "These templates share similar structure and content patterns"
}) => {
  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      </div>
      
      {description && <p className="text-gray-600 text-sm mb-6">{description}</p>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <SimilarTemplateCard
            key={template.id}
            id={template.id}
            title={template.title}
            category={template.category}
            thumbnailUrl={template.thumbnailUrl}
            similarityScore={template.similarityScore}
            engagementRate={template.stats.engagementRate}
            views={template.stats.views}
            velocityScore={template.trendData?.velocityScore}
          />
        ))}
      </div>
    </div>
  );
};

export default SimilarTemplatesSection; 