"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronRight, Plus, Lock, Crown } from "lucide-react";
import { ElementCategory, ElementItem, elementCategories } from "../data/elementsData";
import { useTemplateEditor } from "../TemplateEditorContext";
import { useDragDrop } from "../hooks/useDragDrop";
import { motion, AnimatePresence } from "framer-motion";
import { useUserPermissions } from '../hooks/useUserPermissions';
import { ElementCategory as CategoryComponent } from './ElementCategory';
import { ElementType } from "../types";

export interface ElementsPanelProps {
  onAddCustomElement?: () => void;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ 
  onAddCustomElement 
}) => {
  const { state, addElement } = useTemplateEditor();
  const { startDrag } = useDragDrop();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [filteredCategories, setFilteredCategories] = useState<ElementCategory[]>(elementCategories);
  const { userTier } = useUserPermissions();

  // Initialize expanded state for all categories
  useEffect(() => {
    const initialExpandedState = elementCategories.reduce((acc, category) => {
      acc[category.id] = true; // Start with all categories expanded
      return acc;
    }, {} as Record<string, boolean>);
    
    setExpandedCategories(initialExpandedState);
  }, []);

  // Filter elements based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCategories(elementCategories);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const filtered = elementCategories
      .map(category => {
        // Filter elements within the category
        const matchingElements = category.elements.filter(element => 
          element.name.toLowerCase().includes(query) || 
          element.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          element.description?.toLowerCase().includes(query)
        );
        
        // Return a new category with only the matching elements
        return matchingElements.length > 0
          ? { ...category, elements: matchingElements }
          : null;
      })
      .filter(Boolean) as ElementCategory[];
    
    setFilteredCategories(filtered);
    
    // Auto-expand categories with matching results
    if (filtered.length > 0) {
      const newExpandedState = { ...expandedCategories };
      filtered.forEach(category => {
        newExpandedState[category.id] = true;
      });
      setExpandedCategories(newExpandedState);
    }
  }, [searchQuery, expandedCategories]);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, element: ElementItem) => {
    // Set drag data
    e.dataTransfer.setData("application/json", JSON.stringify(element));
    
    // Set drag effect
    e.dataTransfer.effectAllowed = "copy";
    
    // Trigger drag start in context
    startDrag(element, e);
    
    // Apply dragging class to body for global styling
    document.body.classList.add("dragging");
  }, [startDrag]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    document.body.classList.remove("dragging");
  }, []);

  // Handle clicking on an element to add it directly
  const handleElementClick = useCallback((element: ElementItem) => {
    if (state.ui.selectedSectionId) {
      addElement(state.ui.selectedSectionId, element.type as ElementType);
    }
  }, [state.ui.selectedSectionId, addElement]);

  // Render premium indicator for elements that require subscription
  const renderPremiumIndicator = useCallback((element: ElementItem) => {
    if (!element.premium) return null;
    
    return (
      <div className="absolute top-1 right-1 text-amber-500" title="Premium Feature">
        <Crown size={14} />
      </div>
    );
  }, []);

  // Render new badge for newly added elements
  const renderNewBadge = useCallback((element: ElementItem) => {
    if (!element.new) return null;
    
    return (
      <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
        New
      </div>
    );
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  // Clear search term
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-lg font-medium mb-2">Elements</h2>
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search elements..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="elements-search"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <span className="text-gray-400 hover:text-gray-600">&times;</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Elements Categories */}
      <div className="flex-1 overflow-auto p-3">
        {elementCategories.map(category => (
          <CategoryComponent
            key={category.id}
            category={category}
            searchTerm={searchQuery}
            userTier={userTier}
          />
        ))}
        
        {/* No results message */}
        {searchQuery && !elementCategories.some(category => 
          category.elements.some(element => 
            element.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        ) && (
          <div className="text-center py-8 text-gray-500">
            <p>No elements match "{searchQuery}"</p>
            <button 
              onClick={clearSearch}
              className="mt-2 text-blue-500 text-sm hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
      
      {/* Panel Footer with Add Element Button */}
      <motion.div 
        className="p-3 border-t border-gray-200 bg-gray-50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={onAddCustomElement}
          className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          disabled={userTier === 'free'}
        >
          <Plus size={16} />
          <span>Add Custom Element</span>
        </button>
        
        {userTier === 'free' && (
          <p className="text-xs text-center mt-1 text-gray-500">
            Upgrade to add custom elements
          </p>
        )}
      </motion.div>
    </div>
  );
}; 