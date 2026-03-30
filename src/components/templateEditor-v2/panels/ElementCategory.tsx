import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElementCategory, ElementItem } from '../data/elementsData';
import { ElementItem as ElementItemComponent } from './ElementItem';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ElementCategoryProps {
  category: ElementCategory;
  searchTerm: string;
  userTier: 'free' | 'premium' | 'platinum';
}

export const ElementCategory: React.FC<ElementCategoryProps> = ({
  category,
  searchTerm,
  userTier
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Filter elements based on search term
  const filteredElements = searchTerm
    ? category.elements.filter(element => 
        element.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : category.elements;
  
  // Don't render if no matching elements
  if (filteredElements.length === 0) {
    return null;
  }
  
  // Toggle expansion state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div 
      className="mb-2 border border-gray-200 rounded-md overflow-hidden" 
      data-testid="category-item"
    >
      {/* Category Header */}
      <button
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        onClick={toggleExpand}
        data-testid="category-toggle"
      >
        <h3 className="font-medium text-sm">{category.name}</h3>
        <span className="text-gray-500">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      
      {/* Elements List with Animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 grid grid-cols-2 gap-2">
              {filteredElements.map(element => (
                <ElementItemComponent
                  key={element.id}
                  element={element}
                  isLocked={element.premium && userTier === 'free'}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 