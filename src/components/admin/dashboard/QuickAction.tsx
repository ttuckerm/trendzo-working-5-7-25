import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
  label: string;
  href: string;
  icon: LucideIcon;
  color?: 'default' | 'green' | 'blue' | 'purple' | 'yellow' | 'red' | 'cyan';
  description?: string;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
}

const colorClasses = {
  default: 'hover:border-white/30 hover:text-white',
  green: 'hover:border-green-500/50 hover:text-green-400',
  blue: 'hover:border-blue-500/50 hover:text-blue-400',
  purple: 'hover:border-purple-500/50 hover:text-purple-400',
  yellow: 'hover:border-yellow-500/50 hover:text-yellow-400',
  red: 'hover:border-red-500/50 hover:text-red-400',
  cyan: 'hover:border-cyan-500/50 hover:text-cyan-400',
};

const iconColorClasses = {
  default: 'group-hover:text-white',
  green: 'group-hover:text-green-400',
  blue: 'group-hover:text-blue-400',
  purple: 'group-hover:text-purple-400',
  yellow: 'group-hover:text-yellow-400',
  red: 'group-hover:text-red-400',
  cyan: 'group-hover:text-cyan-400',
};

export function QuickAction({ 
  label, 
  href, 
  icon: Icon, 
  color = 'default',
  description,
  badge,
  disabled = false,
  external = false,
}: QuickActionProps) {
  const content = (
    <>
      <div className="relative">
        <Icon size={24} className={cn('transition-colors', iconColorClasses[color])} />
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-red-500 rounded-full text-[10px] font-bold text-white">
            {typeof badge === 'number' && badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <span className="text-xs text-gray-500">{description}</span>
      )}
    </>
  );

  const className = cn(
    'group flex flex-col items-center justify-center gap-2 p-4',
    'bg-[#111118] border border-[#1a1a2e] rounded-xl',
    'text-gray-400 transition-all',
    disabled ? 'opacity-50 cursor-not-allowed' : colorClasses[color]
  );

  if (disabled) {
    return <div className={className}>{content}</div>;
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

// Horizontal variant
export function QuickActionRow({ 
  label, 
  href, 
  icon: Icon, 
  color = 'default',
  description,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 p-4',
        'bg-[#111118] border border-[#1a1a2e] rounded-xl',
        'text-gray-400 transition-all',
        colorClasses[color]
      )}
    >
      <div className={cn('p-3 rounded-lg bg-[#0a0a0f]', iconColorClasses[color])}>
        <Icon size={20} />
      </div>
      <div>
        <div className="font-medium text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-500">{description}</div>
        )}
      </div>
    </Link>
  );
}

export default QuickAction;


























































































