import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, ChevronDown, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/design-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricProps {
  label: string;
  value: string | number;
  change?: number;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  detailedData?: Array<{
    label: string;
    value: string | number;
    change?: number;
  }>;
}

interface TemplateMetricsCardProps {
  title: string;
  metrics: MetricProps[];
  className?: string;
}

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const TemplateMetricsCard: React.FC<TemplateMetricsCardProps> = ({
  title,
  metrics,
  className = '',
}) => {
  const [expandedMetric, setExpandedMetric] = useState<number | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedMetric(expandedMetric === index ? null : index);
  };

  // Function to determine appropriate color class based on change value
  const getChangeColorClass = (change?: number) => {
    if (change === undefined) return 'text-gray-500';
    if (change > 5) return 'text-emerald-600';
    if (change > 0) return 'text-green-600';
    if (change < -5) return 'text-red-600';
    if (change < 0) return 'text-orange-600';
    return 'text-gray-500';
  };

  // Function to render change indicator
  const renderChangeIndicator = (change?: number) => {
    if (change === undefined) return null;
    
    const colorClass = getChangeColorClass(change);
    
    if (change > 0) {
      return (
        <div className={`flex items-center ${colorClass} gap-0.5`}>
          <ArrowUp size={14} />
          <span>{change}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className={`flex items-center ${colorClass} gap-0.5`}>
          <ArrowDown size={14} />
          <span>{Math.abs(change)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500 gap-0.5">
          <Minus size={14} />
          <span>0%</span>
        </div>
      );
    }
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center">
        {title}
        <button 
          className="ml-2 text-gray-400 hover:text-gray-600 rounded-full h-5 w-5 inline-flex items-center justify-center hover:bg-gray-100"
          aria-label="More information"
        >
          <Info size={14} />
        </button>
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {metrics.map((metric, index) => (
          <motion.div 
            key={index} 
            className={cn(
              "flex flex-col space-y-1 p-3 rounded-lg border border-transparent",
              metric.detailedData && "cursor-pointer",
              hoveredMetric === index && "border-gray-100 bg-gray-50"
            )}
            whileHover={metric.detailedData ? { scale: 1.02 } : {}}
            onClick={() => metric.detailedData && toggleExpand(index)}
            onMouseEnter={() => setHoveredMetric(index)}
            onMouseLeave={() => setHoveredMetric(null)}
            layoutId={`metric-${index}`}
          >
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500 flex items-center">
                {metric.label}
                {metric.detailedData && (
                  <ChevronRight 
                    className={cn(
                      "ml-1 h-4 w-4 text-gray-400 transition-transform", 
                      expandedMetric === index && "transform rotate-90"
                    )} 
                  />
                )}
              </div>
              {metric.description && (
                <div 
                  className="relative group"
                  onMouseEnter={(e) => e.stopPropagation()}
                  onMouseLeave={(e) => e.stopPropagation()}
                >
                  <div className="p-1 rounded-full hover:bg-gray-100">
                    <Info size={14} className="text-gray-400" />
                  </div>
                  <div className="absolute z-10 right-0 top-full mt-1 w-48 p-2 bg-white rounded-md shadow-lg border border-gray-200 text-xs text-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {metric.description}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {metric.icon && (
                <div 
                  className={cn(
                    "rounded-full p-1.5 flex-shrink-0",
                    metric.color || 'bg-blue-100'
                  )}
                >
                  {metric.icon}
                </div>
              )}
              <div className="flex flex-col">
                <motion.div 
                  className="text-2xl font-semibold text-gray-900"
                  layoutId={`value-${index}`}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, damping: 15 }}
                >
                  {typeof metric.value === 'number' ? formatNumber(metric.value as number) : metric.value}
                </motion.div>
                {metric.change !== undefined && (
                  <div className="flex items-center text-sm gap-1">
                    {renderChangeIndicator(metric.change)}
                    <span className="text-gray-500 text-xs">vs avg</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed data expansion */}
            <AnimatePresence>
              {expandedMetric === index && metric.detailedData && (
                <motion.div 
                  className="mt-3 pt-3 border-t border-gray-200 space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {metric.detailedData.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{detail.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {typeof detail.value === 'number' ? formatNumber(detail.value as number) : detail.value}
                        </span>
                        {detail.change !== undefined && (
                          <div className="flex items-center text-xs">
                            {renderChangeIndicator(detail.change)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TemplateMetricsCard; 