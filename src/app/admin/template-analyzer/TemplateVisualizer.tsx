import React from 'react';
import { TemplateSection } from '@/lib/types/trendingTemplate';

interface TemplateVisualizerProps {
  sections: TemplateSection[];
  duration: number;
}

/**
 * Visualizes the template structure as a timeline with sections
 */
const TemplateVisualizer: React.FC<TemplateVisualizerProps> = ({ sections, duration }) => {
  if (!sections || sections.length === 0) {
    return <div className="text-gray-500 italic">No template sections available</div>;
  }
  
  // Sort sections by startTime
  const sortedSections = [...sections].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  
  // Get color for section type
  const getSectionColor = (type: string): string => {
    const typeMap: Record<string, string> = {
      'hook': 'bg-pink-500',
      'intro': 'bg-blue-500',
      'main': 'bg-purple-500',
      'content': 'bg-purple-500',
      'cta': 'bg-green-500',
      'outro': 'bg-yellow-500',
      'transition': 'bg-orange-500',
    };
    
    // Find a partial match in the type map
    const matchedType = Object.keys(typeMap).find(key => 
      type.toLowerCase().includes(key.toLowerCase())
    );
    
    return matchedType ? typeMap[matchedType] : 'bg-gray-500';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-3">Template Structure Timeline</h3>
      
      {/* Timeline visualization */}
      <div className="relative h-16 mb-6">
        {/* Timeline base */}
        <div className="absolute top-8 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        
        {/* Time markers */}
        <div className="absolute top-11 left-0 w-full flex justify-between text-xs text-gray-500">
          <span>0s</span>
          <span>{Math.round(duration / 4)}s</span>
          <span>{Math.round(duration / 2)}s</span>
          <span>{Math.round(3 * duration / 4)}s</span>
          <span>{duration}s</span>
        </div>
        
        {/* Sections */}
        {sortedSections.map((section, index) => {
          const startPercent = ((section.startTime || 0) / duration) * 100;
          const widthPercent = ((section.duration || 0) / duration) * 100;
          
          return (
            <div 
              key={section.id || index}
              className={`absolute h-6 rounded-md ${getSectionColor(section.type)} text-white text-xs flex items-center justify-center overflow-hidden`}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                top: '0.5rem',
                minWidth: '1.5rem'
              }}
              title={`${section.type}: ${section.startTime}s - ${(section.startTime || 0) + (section.duration || 0)}s`}
            >
              {widthPercent > 10 && section.type}
            </div>
          );
        })}
      </div>
      
      {/* Section details */}
      <div className="space-y-2 mt-8">
        <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Section Details</h4>
        {sortedSections.map((section, index) => (
          <div key={section.id || index} className="flex items-start space-x-2 text-sm">
            <div className={`w-3 h-3 mt-1 rounded-full ${getSectionColor(section.type)}`}></div>
            <div className="flex-1">
              <div className="font-medium">{section.type} ({section.startTime}s - {(section.startTime || 0) + (section.duration || 0)}s)</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">
                {section.contentDescription || section.purpose || 'No description available'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateVisualizer; 