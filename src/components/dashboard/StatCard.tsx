import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card-component';

/**
 * StatCard Component
 * 
 * Displays a metric card with a value, icon, and optional trend indicator
 * Used primarily on dashboard for displaying key metrics.
 */
interface StatCardProps {
  /** Title or label for the statistic */
  title: string;
  /** The numeric or string value to display */
  value: number | string;
  /** Icon to display alongside the statistic */
  icon: React.ReactNode;
  /** Background color for the icon container (Tailwind class) */
  iconBgColor?: string;
  /** Text color for the icon (Tailwind class) */
  iconColor?: string;
  /** Optional percentage change to show trend */
  trend?: number;
  /** Description or additional context for the statistic */
  description?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatCard component for displaying key metrics with visual indicators
 */
export default function StatCard({
  title,
  value,
  icon,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
  trend,
  description,
  className = "",
}: StatCardProps) {
  // Helper function to format large numbers
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toString();
    }
    return val;
  };

  // Determine trend direction and color
  const renderTrend = () => {
    if (trend === undefined) return null;
    
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm font-medium">
          <ArrowUp size={16} className="mr-1" />
          <span>{trend}%</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm font-medium">
          <ArrowDown size={16} className="mr-1" />
          <span>{Math.abs(trend)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500 text-sm font-medium">
          <Minus size={16} className="mr-1" />
          <span>0%</span>
        </div>
      );
    }
  };

  return (
    <Card className={`p-6 relative overflow-hidden ${className}`}>
      <div className="flex flex-col">
        <div className="flex items-center mb-2">
          <div className={`rounded-full p-2 ${iconBgColor} ${iconColor}`}>
            {icon}
          </div>
          <h3 className="ml-3 text-sm font-medium text-gray-500">{title}</h3>
        </div>
        
        <div className="flex items-baseline">
          <div className="text-2xl font-semibold text-gray-900">
            {formatValue(value)}
          </div>
          {trend !== undefined && (
            <div className="ml-2">{renderTrend()}</div>
          )}
        </div>
        
        {description && (
          <div className="mt-1 text-xs text-gray-500">{description}</div>
        )}
      </div>
    </Card>
  );
} 