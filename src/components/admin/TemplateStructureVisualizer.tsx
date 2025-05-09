import React from 'react';

interface TemplateSection {
  type: string;
  startTime: number;
  duration: number;
  purpose?: string;
}

interface TemplateStructureVisualizerProps {
  sections: TemplateSection[];
  totalDuration: number;
}

const TemplateStructureVisualizer: React.FC<TemplateStructureVisualizerProps> = ({ 
  sections, 
  totalDuration 
}) => {
  // Sort sections by startTime to ensure proper rendering order
  const sortedSections = [...sections].sort((a, b) => a.startTime - b.startTime);
  
  // Get color for section type
  const getColorForType = (type: string): string => {
    const colors: {[key: string]: string} = {
      'Hook': 'bg-red-500',
      'Intro': 'bg-blue-500',
      'Main': 'bg-green-500',
      'Demo': 'bg-purple-500',
      'Tutorial': 'bg-yellow-500',
      'Conclusion': 'bg-indigo-500',
      'CTA': 'bg-orange-500'
    };
    
    return colors[type] || 'bg-gray-500';
  };
  
  // Get text color for section based on background color
  const getTextColor = (type: string): string => {
    const darkBackgrounds = ['Hook', 'Intro', 'Main', 'Demo', 'Conclusion', 'CTA'];
    return darkBackgrounds.includes(type) ? 'text-white' : 'text-gray-800';
  };
  
  // Format timestamp to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Template Structure</h3>
      
      {/* Timeline visualization */}
      <div className="relative h-12 flex rounded overflow-hidden">
        {sortedSections.map((section, index) => {
          // Calculate width percentage based on duration relative to total
          const widthPercent = (section.duration / totalDuration) * 100;
          
          return (
            <div 
              key={index}
              className={`relative flex items-center justify-center ${getColorForType(section.type)} ${getTextColor(section.type)}`}
              style={{ width: `${widthPercent}%` }}
              title={`${section.type}: ${formatTime(section.startTime)} - ${formatTime(section.startTime + section.duration)}`}
            >
              <span className="text-xs font-medium truncate px-1">
                {section.type}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Timeline markers */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>0:00</span>
        <span>{formatTime(totalDuration)}</span>
      </div>
      
      {/* Legend */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-2">
          {['Hook', 'Intro', 'Main', 'Demo', 'Tutorial', 'Conclusion', 'CTA'].map(type => (
            <div key={type} className="flex items-center">
              <div className={`w-3 h-3 rounded-sm ${getColorForType(type)} mr-1`}></div>
              <span className="text-xs text-gray-600">{type}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Sections detail */}
      <div className="mt-4 space-y-2">
        {sortedSections.map((section, index) => (
          <div key={index} className="flex items-start space-x-2 text-sm">
            <div className={`w-3 h-3 rounded-sm mt-1 ${getColorForType(section.type)}`}></div>
            <div>
              <div className="font-medium">{section.type}</div>
              <div className="text-gray-500 text-xs">
                {formatTime(section.startTime)} - {formatTime(section.startTime + section.duration)} ({section.duration}s)
              </div>
              {section.purpose && (
                <div className="text-gray-600 text-xs mt-1">{section.purpose}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateStructureVisualizer; 