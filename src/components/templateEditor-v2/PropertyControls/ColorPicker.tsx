"use client";

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

// Standard color palette
const DEFAULT_COLORS = [
  "#000000", "#ffffff", "#f44336", "#e91e63", "#9c27b0", 
  "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4",
  "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b",
  "#ffc107", "#ff9800", "#ff5722", "#795548", "#9e9e9e",
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
  id?: string;
  allowCustom?: boolean;
  helpText?: string;
  trendingColors?: string[];
}

/**
 * ColorPicker component for selecting colors in the Properties Panel
 * Supports custom colors and trending color suggestions
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  label,
  id,
  allowCustom = false,
  helpText,
  trendingColors = []
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customColor, setCustomColor] = useState(color);
  const [showHelp, setShowHelp] = useState(false);
  
  // Combine default colors with trending colors
  const allColors = [...DEFAULT_COLORS];
  if (trendingColors.length > 0) {
    // Add trending colors that aren't already in the default palette
    trendingColors.forEach(trendColor => {
      if (!allColors.includes(trendColor)) {
        allColors.push(trendColor);
      }
    });
  }
  
  const handleColorClick = (selectedColor: string) => {
    onChange(selectedColor);
  };
  
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
  };
  
  const applyCustomColor = () => {
    onChange(customColor);
    setShowCustomInput(false);
  };
  
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };
  
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id || `color-picker-${label}`} className="block text-xs font-medium">
          {label}
        </label>
        
        {helpText && (
          <button 
            type="button"
            onClick={toggleHelp}
            className="text-gray-400 hover:text-gray-600"
          >
            <HelpCircle size={14} />
          </button>
        )}
      </div>
      
      {showHelp && helpText && (
        <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
          {helpText}
        </div>
      )}
      
      <div className="grid grid-cols-10 gap-1 mb-2">
        {allColors.map((colorOption) => (
          <button
            key={colorOption}
            type="button"
            aria-label={colorOption}
            className={`w-full aspect-square rounded-full border ${
              color === colorOption ? "ring-2 ring-blue-500" : ""
            } ${trendingColors.includes(colorOption) ? "ring-1 ring-yellow-400" : ""}`}
            style={{ backgroundColor: colorOption }}
            onClick={() => handleColorClick(colorOption)}
            title={`${colorOption}${trendingColors.includes(colorOption) ? " (Trending)" : ""}`}
          />
        ))}
      </div>
      
      {trendingColors.length > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          <span className="inline-block w-3 h-3 rounded-full bg-transparent ring-1 ring-yellow-400 mr-1"></span>
          Trending colors
        </div>
      )}
      
      {allowCustom && (
        <div>
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Custom
            </button>
          ) : (
            <div className="flex items-center mt-2">
              <input
                type="text"
                id={id || `color-picker-${label}-custom`}
                aria-label="Custom color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="text-xs p-1 border rounded flex-1 mr-2"
                placeholder="#RRGGBB"
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              />
              <div 
                className="w-6 h-6 rounded border mr-2" 
                style={{ backgroundColor: customColor }}
              />
              <button
                type="button"
                onClick={applyCustomColor}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                aria-label="Apply custom color"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 