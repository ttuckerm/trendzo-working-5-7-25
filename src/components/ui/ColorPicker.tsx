"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

const presetColors = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#008000", // Dark Green
  "#800000", // Maroon
  "#008080", // Teal
  "#000080", // Navy
  "#A52A2A", // Brown
  "#808080", // Gray
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(color);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update selected color when the color prop changes
  useEffect(() => {
    setSelectedColor(color);
  }, [color]);

  // Close the color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle color change
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    onChange(newColor);
    setIsOpen(false);
  };

  // Handle color input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    onChange(newColor);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full", className)}
    >
      <div 
        className="flex items-center cursor-pointer border rounded-md p-2 hover:border-gray-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="w-6 h-6 rounded-md mr-2 border border-gray-200"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-sm flex-1">{selectedColor}</span>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-gray-500 transition-transform duration-150",
            isOpen && "transform rotate-180"
          )}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-1 p-3 bg-white border rounded-md shadow-lg w-full"
          >
            <div className="mb-3">
              <input
                type="color"
                value={selectedColor}
                onChange={handleInputChange}
                className="w-full h-10 cursor-pointer rounded-md"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={cn(
                    "w-full h-8 rounded-md border flex items-center justify-center",
                    selectedColor === presetColor && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorChange(presetColor)}
                >
                  {selectedColor === presetColor && (
                    <Check 
                      size={14} 
                      className={
                        presetColor === "#FFFFFF" || presetColor === "#FFFF00" || presetColor === "#00FF00" 
                          ? "text-black" 
                          : "text-white"
                      } 
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full border rounded-md p-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorPicker; 