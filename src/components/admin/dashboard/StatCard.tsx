import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'green' | 'blue' | 'purple' | 'yellow' | 'red' | 'cyan';
  className?: string;
  onClick?: () => void;
}

const colorClasses = {
  default: 'text-white',
  green: 'text-green-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  cyan: 'text-cyan-400',
};

const iconBgClasses = {
  default: 'bg-white/10',
  green: 'bg-green-500/20',
  blue: 'bg-blue-500/20',
  purple: 'bg-purple-500/20',
  yellow: 'bg-yellow-500/20',
  red: 'bg-red-500/20',
  cyan: 'bg-cyan-500/20',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'default',
  className,
  onClick,
}: StatCardProps) {
  return (
    <div 
      className={cn(
        'bg-[#111118] border border-[#1a1a2e] rounded-xl p-5 transition-all',
        onClick && 'cursor-pointer hover:border-[#2a2a3e] hover:bg-[#151520]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={cn('p-2 rounded-lg', iconBgClasses[color])}>
            <Icon size={20} className={colorClasses[color]} />
          </div>
        )}
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend.isPositive 
              ? 'text-green-400 bg-green-500/10' 
              : 'text-red-400 bg-red-500/10'
          )}>
            {trend.isPositive ? '↗' : '↘'} {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      
      <div className={cn('text-2xl font-bold mb-1', colorClasses[color])}>
        {value}
      </div>
      
      <div className="text-sm text-gray-400">{title}</div>
      
      {subtitle && (
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  );
}

// Mini version for compact displays
export function StatCardMini({
  title,
  value,
  icon: Icon,
  color = 'default',
  className,
}: Omit<StatCardProps, 'subtitle' | 'trend' | 'onClick'>) {
  return (
    <div className={cn(
      'bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-3 flex items-center gap-3',
      className
    )}>
      {Icon && (
        <div className={cn('p-2 rounded-lg', iconBgClasses[color])}>
          <Icon size={16} className={colorClasses[color]} />
        </div>
      )}
      <div>
        <div className={cn('text-lg font-bold', colorClasses[color])}>{value}</div>
        <div className="text-xs text-gray-500">{title}</div>
      </div>
    </div>
  );
}

export default StatCard;


























































































