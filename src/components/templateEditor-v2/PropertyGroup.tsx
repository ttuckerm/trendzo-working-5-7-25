"use client";

import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PropertyGroupProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  id?: string;
  tierRequired?: 'free' | 'premium' | 'platinum';
  userTier?: 'free' | 'premium' | 'platinum';
  helpText?: string;
  onHelpRequested?: () => void;
}

/**
 * PropertyGroup component for grouping related properties in the Properties Panel
 * Supports collapsible sections and tier-based feature access
 */
export const PropertyGroup: React.FC<PropertyGroupProps> = ({
  title,
  children,
  defaultExpanded = false,
  id,
  tierRequired = 'free',
  userTier = 'free',
  helpText,
  onHelpRequested
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const tierAccess = {
    free: 0,
    premium: 1,
    platinum: 2
  };
  
  const hasAccess = tierAccess[userTier] >= tierAccess[tierRequired];
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  const renderLockBadge = () => {
    if (hasAccess) return null;
    
    const tierName = tierRequired.charAt(0).toUpperCase() + tierRequired.slice(1);
    
    return (
      <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded">
        {tierName}
      </span>
    );
  };
  
  return (
    <div 
      className="mb-3 border rounded overflow-hidden"
      data-testid={id || `property-group-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <button
        className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 text-left"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={`group-content-${id || title}`}
        aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
      >
        <div className="flex items-center">
          <span className="mr-1">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="font-medium text-sm">{title}</span>
          {renderLockBadge()}
        </div>
        
        {helpText && (
          <button
            type="button"
            className="text-xs text-blue-500 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              onHelpRequested?.();
            }}
          >
            Help
          </button>
        )}
      </button>
      
      {isExpanded && (
        <div 
          id={`group-content-${id || title}`}
          className={`p-3 ${!hasAccess ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {!hasAccess ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">
                Upgrade to {tierRequired} to access these features
              </p>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={() => window.open('/pricing', '_blank')}
              >
                Upgrade to {tierRequired}
              </button>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}; 