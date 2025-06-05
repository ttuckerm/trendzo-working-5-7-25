"use client";

import React, { useState } from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Bold, 
  Italic, 
  Underline,
  HelpCircle
} from 'lucide-react';

interface FontControlsProps {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onFontWeightChange: (value: string) => void;
  onFontStyleChange: (value: string) => void;
  onTextAlignChange: (value: string) => void;
  helpText?: string;
  trendingFonts?: string[];
}

const FONT_FAMILIES = [
  "Arial", "Helvetica", "Times New Roman", "Courier New", 
  "Georgia", "Verdana", "Impact", "Tahoma", "Trebuchet MS",
  "Comic Sans MS", "Palatino", "Garamond", "Bookman", "Avant Garde",
];

/**
 * FontControls component for text formatting in the Properties Panel
 * Includes font family, size, weight, style, and alignment controls
 */
export const FontControls: React.FC<FontControlsProps> = ({
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  textAlign,
  onFontFamilyChange,
  onFontSizeChange,
  onFontWeightChange,
  onFontStyleChange,
  onTextAlignChange,
  helpText,
  trendingFonts = []
}) => {
  const [showHelp, setShowHelp] = useState(false);
  
  // Combine standard fonts with trending fonts
  const allFonts = [...FONT_FAMILIES];
  if (trendingFonts.length > 0) {
    trendingFonts.forEach(trendFont => {
      if (!allFonts.includes(trendFont)) {
        allFonts.push(trendFont);
      }
    });
  }
  
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    if (!isNaN(size) && size > 0) {
      onFontSizeChange(size);
    }
  };
  
  const toggleBold = () => {
    onFontWeightChange(fontWeight === 'bold' ? 'normal' : 'bold');
  };
  
  const toggleItalic = () => {
    onFontStyleChange(fontStyle === 'italic' ? 'normal' : 'italic');
  };
  
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };
  
  return (
    <div className="space-y-3">
      {/* Font Family */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="font-family" className="block text-xs font-medium">
            Font Family
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
        
        <select
          id="font-family"
          className="w-full text-sm p-1.5 border rounded"
          value={fontFamily}
          onChange={(e) => onFontFamilyChange(e.target.value)}
          aria-label="Font Family"
        >
          {allFonts.map((font) => (
            <option 
              key={font} 
              value={font}
              style={{ fontFamily: font }}
            >
              {font} {trendingFonts.includes(font) ? '(Trending)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      {/* Font Size */}
      <div>
        <label htmlFor="font-size" className="block text-xs font-medium mb-1">
          Font Size
        </label>
        <div className="flex items-center">
          <input
            id="font-size"
            type="number"
            min="8"
            max="144"
            value={fontSize}
            onChange={handleFontSizeChange}
            onBlur={(e) => {
              const size = parseInt(e.target.value, 10);
              if (isNaN(size) || size < 8) {
                onFontSizeChange(8);
              } else if (size > 144) {
                onFontSizeChange(144);
              }
            }}
            className="w-16 text-sm p-1.5 border rounded mr-2"
            aria-label="Font Size"
          />
          <input
            type="range"
            min="8"
            max="72"
            value={fontSize}
            onChange={handleFontSizeChange}
            className="flex-1"
          />
        </div>
      </div>
      
      {/* Text Styling Controls */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Style
        </label>
        <div className="flex space-x-1">
          <button
            type="button"
            className={`p-1.5 border rounded ${
              fontWeight === 'bold' ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'
            }`}
            onClick={toggleBold}
            aria-label="Bold"
            aria-pressed={fontWeight === 'bold'}
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className={`p-1.5 border rounded ${
              fontStyle === 'italic' ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'
            }`}
            onClick={toggleItalic}
            aria-label="Italic"
            aria-pressed={fontStyle === 'italic'}
          >
            <Italic size={16} />
          </button>
        </div>
      </div>
      
      {/* Text Alignment */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Alignment
        </label>
        <div className="flex border rounded overflow-hidden">
          <button
            type="button"
            className={`flex-1 p-1.5 ${textAlign === "left" ? "bg-blue-100" : "hover:bg-gray-100"}`}
            onClick={() => onTextAlignChange("left")}
            aria-label="Left Align"
            aria-pressed={textAlign === "left"}
          >
            <AlignLeft size={16} className="mx-auto" />
          </button>
          <button
            type="button"
            className={`flex-1 p-1.5 ${textAlign === "center" ? "bg-blue-100" : "hover:bg-gray-100"}`}
            onClick={() => onTextAlignChange("center")}
            aria-label="Center Align"
            aria-pressed={textAlign === "center"}
          >
            <AlignCenter size={16} className="mx-auto" />
          </button>
          <button
            type="button"
            className={`flex-1 p-1.5 ${textAlign === "right" ? "bg-blue-100" : "hover:bg-gray-100"}`}
            onClick={() => onTextAlignChange("right")}
            aria-label="Right Align"
            aria-pressed={textAlign === "right"}
          >
            <AlignRight size={16} className="mx-auto" />
          </button>
          <button
            type="button"
            className={`flex-1 p-1.5 ${textAlign === "justify" ? "bg-blue-100" : "hover:bg-gray-100"}`}
            onClick={() => onTextAlignChange("justify")}
            aria-label="Justify Align"
            aria-pressed={textAlign === "justify"}
          >
            <AlignJustify size={16} className="mx-auto" />
          </button>
        </div>
      </div>
      
      {trendingFonts.length > 0 && (
        <div className="text-xs text-gray-500">
          <p className="font-medium">Trending Fonts:</p>
          <ul className="mt-1 space-y-1">
            {trendingFonts.slice(0, 3).map(font => (
              <li 
                key={font}
                className="cursor-pointer hover:text-blue-500"
                onClick={() => onFontFamilyChange(font)}
                style={{ fontFamily: font }}
              >
                {font}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 