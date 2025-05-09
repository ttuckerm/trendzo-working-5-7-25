"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Link,
  Unlink,
  Palette
} from "lucide-react";
import { ColorPicker } from "../ui/ColorPicker";
import { Slider } from "../ui/Slider";
import { Input } from "../ui/Input";
import { TextArea } from "../ui/TextArea";
import { Button } from "../ui/Button";

/**
 * PropertyEditor Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls are organized by context and revealed when needed
 * - Emotional Design: Subtle animations for state changes
 * - Contextual Intelligence: Different controls based on element type
 * - Progressive Disclosure: Properties organized in collapsible sections
 * - Sensory Harmony: Visual feedback coordinated with interactions
 */

interface PropertyEditorProps {
  className?: string;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({ 
  className = "" 
}) => {
  // Get editor context
  const { 
    state, 
    updateElement,
    deleteElement,
    moveElementUp,
    moveElementDown
  } = useEditor();
  
  // Local state for open/closed sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    appearance: true,
    text: true,
    position: true,
    link: false,
    advanced: false
  });
  
  // Find the currently selected element and its section
  const activeSection = state.template.sections.find(
    section => section.id === state.ui.selectedSectionId
  );
  
  const selectedElement = activeSection?.elements.find(
    element => element.id === state.ui.selectedElementId
  );
  
  // State for text input to prevent too many re-renders
  const [textInput, setTextInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  
  // Update the text input when the selected element changes
  useEffect(() => {
    if (selectedElement?.type === "text" && selectedElement.content) {
      setTextInput(selectedElement.content);
    }
    
    if (selectedElement?.link) {
      setLinkUrl(selectedElement.link);
    } else {
      setLinkUrl("");
    }
  }, [selectedElement]);
  
  // Apply text changes when input is blurred
  const handleTextChange = () => {
    if (!selectedElement || !activeSection) return;
    
    updateElement(
      activeSection.id,
      selectedElement.id,
      { content: textInput }
    );
  };
  
  // Toggle section visibility
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle style changes for text elements
  const toggleTextStyle = (style: "bold" | "italic" | "underline") => {
    if (!selectedElement || !activeSection || selectedElement.type !== "text") return;
    
    const currentStyles = selectedElement.styles || {};
    const fontStyle = currentStyles.fontStyle || {};
    
    let newValue;
    
    switch(style) {
      case "bold":
        newValue = fontStyle.fontWeight === "bold" ? "normal" : "bold";
        updateElement(
          activeSection.id,
          selectedElement.id,
          { 
            styles: {
              ...currentStyles,
              fontStyle: {
                ...fontStyle,
                fontWeight: newValue
              }
            }
          }
        );
        break;
      case "italic":
        newValue = fontStyle.fontStyle === "italic" ? "normal" : "italic";
        updateElement(
          activeSection.id,
          selectedElement.id,
          { 
            styles: {
              ...currentStyles,
              fontStyle: {
                ...fontStyle,
                fontStyle: newValue
              }
            }
          }
        );
        break;
      case "underline":
        newValue = fontStyle.textDecoration === "underline" ? "none" : "underline";
        updateElement(
          activeSection.id,
          selectedElement.id,
          { 
            styles: {
              ...currentStyles,
              fontStyle: {
                ...fontStyle,
                textDecoration: newValue
              }
            }
          }
        );
        break;
    }
  };
  
  // Update alignment for text elements
  const setTextAlignment = (alignment: "left" | "center" | "right") => {
    if (!selectedElement || !activeSection || selectedElement.type !== "text") return;
    
    const currentStyles = selectedElement.styles || {};
    const fontStyle = currentStyles.fontStyle || {};
    
    updateElement(
      activeSection.id,
      selectedElement.id,
      { 
        styles: {
          ...currentStyles,
          fontStyle: {
            ...fontStyle,
            textAlign: alignment
          }
        }
      }
    );
  };
  
  // Update color for elements
  const handleColorChange = (color: string, property: "color" | "backgroundColor" | "borderColor") => {
    if (!selectedElement || !activeSection) return;
    
    const currentStyles = selectedElement.styles || {};
    
    if (property === "color" && selectedElement.type === "text") {
      const fontStyle = currentStyles.fontStyle || {};
      updateElement(
        activeSection.id,
        selectedElement.id,
        { 
          styles: {
            ...currentStyles,
            fontStyle: {
              ...fontStyle,
              color
            }
          }
        }
      );
    } else {
      updateElement(
        activeSection.id,
        selectedElement.id,
        { 
          styles: {
            ...currentStyles,
            [property]: color
          }
        }
      );
    }
  };
  
  // Update element position or size
  const updatePositionOrSize = (
    value: number, 
    property: "x" | "y" | "width" | "height" | "rotation"
  ) => {
    if (!selectedElement || !activeSection) return;
    
    updateElement(
      activeSection.id,
      selectedElement.id,
      { [property]: value }
    );
  };
  
  // Update border properties
  const updateBorder = (
    value: number | string,
    property: "borderWidth" | "borderRadius" | "borderStyle"
  ) => {
    if (!selectedElement || !activeSection) return;
    
    const currentStyles = selectedElement.styles || {};
    
    updateElement(
      activeSection.id,
      selectedElement.id,
      { 
        styles: {
          ...currentStyles,
          [property]: value
        }
      }
    );
  };
  
  // Update link URL
  const handleLinkUpdate = () => {
    if (!selectedElement || !activeSection) return;
    
    updateElement(
      activeSection.id,
      selectedElement.id,
      { link: linkUrl || null }
    );
  };
  
  // Remove link
  const removeLink = () => {
    if (!selectedElement || !activeSection) return;
    
    updateElement(
      activeSection.id,
      selectedElement.id,
      { link: null }
    );
    setLinkUrl("");
  };
  
  // Delete the selected element
  const handleDelete = () => {
    if (!selectedElement || !activeSection) return;
    
    deleteElement(activeSection.id, selectedElement.id);
  };
  
  // If no element is selected, show empty state
  if (!selectedElement || !activeSection) {
    return (
      <div className={cn(
        "flex flex-col h-full bg-white border-l p-4",
        className
      )}>
        <div className="flex items-center justify-center h-full text-gray-400 text-center">
          <div>
            <p className="mb-2">No element selected</p>
            <p className="text-sm">Select an element on the canvas to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-l overflow-y-auto",
      className
    )}>
      {/* Header with element type and actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
        <div className="flex items-center">
          {selectedElement.type === "text" && <Type size={16} className="mr-2" />}
          {selectedElement.type === "image" && <ImageIcon size={16} className="mr-2" />}
          {selectedElement.type === "shape" && (
            selectedElement.shape === "circle" 
              ? <Circle size={16} className="mr-2" /> 
              : <Square size={16} className="mr-2" />
          )}
          <span className="font-medium capitalize">
            {selectedElement.type} Element
          </span>
        </div>
        <div className="flex space-x-1">
          <motion.button
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={() => moveElementDown(activeSection.id, selectedElement.id)}
            title="Move Down"
            disabled={activeSection.elements.indexOf(selectedElement) === activeSection.elements.length - 1}
          >
            <ArrowDown size={16} />
          </motion.button>
          <motion.button
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={() => moveElementUp(activeSection.id, selectedElement.id)}
            title="Move Up"
            disabled={activeSection.elements.indexOf(selectedElement) === 0}
          >
            <ArrowUp size={16} />
          </motion.button>
          <motion.button
            className="p-1 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            title="Delete Element"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>
      
      {/* Content area with property sections */}
      <div className="p-4 space-y-4">
        {/* Content Section */}
        {selectedElement.type === "text" && (
          <div className="space-y-2">
            <TextArea 
              label="Text Content"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onBlur={handleTextChange}
              rows={3}
            />
          </div>
        )}
        
        {selectedElement.type === "image" && (
          <div className="space-y-2">
            <Input 
              label="Image URL"
              value={selectedElement.src || ""}
              onChange={(e) => {
                updateElement(
                  activeSection.id,
                  selectedElement.id,
                  { src: e.target.value }
                );
              }}
            />
            <div className="h-24 bg-gray-100 rounded-md flex items-center justify-center mt-2">
              {selectedElement.src ? (
                <img 
                  src={selectedElement.src} 
                  alt="Preview" 
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-sm">Image preview</span>
              )}
            </div>
          </div>
        )}
        
        {/* Appearance Section */}
        <div>
          <button
            className="flex items-center justify-between w-full text-left py-2"
            onClick={() => toggleSection("appearance")}
          >
            <span className="font-medium">Appearance</span>
            {openSections.appearance ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {openSections.appearance && (
            <div className="mt-2 space-y-4">
              {/* Color controls */}
              {selectedElement.type === "text" && (
                <div>
                  <label className="block text-sm mb-1">Text Color</label>
                  <ColorPicker 
                    color={selectedElement.styles?.fontStyle?.color || "#000000"} 
                    onChange={(color) => handleColorChange(color, "color")}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm mb-1">Background Color</label>
                <ColorPicker 
                  color={selectedElement.styles?.backgroundColor || "transparent"} 
                  onChange={(color) => handleColorChange(color, "backgroundColor")}
                />
              </div>
              
              {/* Border controls */}
              <div>
                <label className="block text-sm mb-1">Border</label>
                <div className="flex space-x-2">
                  <Slider 
                    min={0}
                    max={10}
                    value={selectedElement.styles?.borderWidth || 0}
                    onChange={(value) => updateBorder(value, "borderWidth")}
                    label="Width"
                  />
                  
                  <Slider 
                    min={0}
                    max={50}
                    value={selectedElement.styles?.borderRadius || 0}
                    onChange={(value) => updateBorder(value, "borderRadius")}
                    label="Radius"
                  />
                </div>
                
                <div className="mt-2">
                  <label className="block text-sm mb-1">Border Color</label>
                  <ColorPicker 
                    color={selectedElement.styles?.borderColor || "#000000"} 
                    onChange={(color) => handleColorChange(color, "borderColor")}
                  />
                </div>
              </div>
              
              {/* Text style controls */}
              {selectedElement.type === "text" && (
                <div>
                  <label className="block text-sm mb-1">Text Style</label>
                  <div className="flex space-x-1 mb-2">
                    <motion.button
                      className={cn(
                        "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                        selectedElement.styles?.fontStyle?.fontWeight === "bold" && "bg-blue-50 text-blue-600"
                      )}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTextStyle("bold")}
                      title="Bold"
                    >
                      <Bold size={16} />
                    </motion.button>
                    
                    <motion.button
                      className={cn(
                        "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                        selectedElement.styles?.fontStyle?.fontStyle === "italic" && "bg-blue-50 text-blue-600"
                      )}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTextStyle("italic")}
                      title="Italic"
                    >
                      <Italic size={16} />
                    </motion.button>
                    
                    <motion.button
                      className={cn(
                        "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                        selectedElement.styles?.fontStyle?.textDecoration === "underline" && "bg-blue-50 text-blue-600"
                      )}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTextStyle("underline")}
                      title="Underline"
                    >
                      <Underline size={16} />
                    </motion.button>
                  </div>
                  
                  <div className="flex space-x-1">
                    <motion.button
                      className={cn(
                        "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                        selectedElement.styles?.fontStyle?.textAlign === "left" && "bg-blue-50 text-blue-600"
                      )}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTextAlignment("left")}
                      title="Align Left"
                    >
                      <AlignLeft size={16} />
                    </motion.button>
                    
                    <motion.button
                      className={cn(
                        "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                        selectedElement.styles?.fontStyle?.textAlign === "center" && "bg-blue-50 text-blue-600"
                      )}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTextAlignment("center")}
                      title="Align Center"
                    >
                      <AlignCenter size={16} />
                    </motion.button>
                    
                    <motion.button
                      className={cn(
                        "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                        selectedElement.styles?.fontStyle?.textAlign === "right" && "bg-blue-50 text-blue-600"
                      )}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTextAlignment("right")}
                      title="Align Right"
                    >
                      <AlignRight size={16} />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Position & Size Section */}
        <div>
          <button
            className="flex items-center justify-between w-full text-left py-2"
            onClick={() => toggleSection("position")}
          >
            <span className="font-medium">Position & Size</span>
            {openSections.position ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {openSections.position && (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">X Position</label>
                  <Slider 
                    min={0}
                    max={1000}
                    value={selectedElement.x || 0}
                    onChange={(value) => updatePositionOrSize(value, "x")}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Y Position</label>
                  <Slider 
                    min={0}
                    max={1000}
                    value={selectedElement.y || 0}
                    onChange={(value) => updatePositionOrSize(value, "y")}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">Width</label>
                  <Slider 
                    min={20}
                    max={1000}
                    value={selectedElement.width || 100}
                    onChange={(value) => updatePositionOrSize(value, "width")}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Height</label>
                  <Slider 
                    min={20}
                    max={1000}
                    value={selectedElement.height || 100}
                    onChange={(value) => updatePositionOrSize(value, "height")}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Rotation</label>
                <Slider 
                  min={0}
                  max={360}
                  value={selectedElement.rotation || 0}
                  onChange={(value) => updatePositionOrSize(value, "rotation")}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Link Section */}
        <div>
          <button
            className="flex items-center justify-between w-full text-left py-2"
            onClick={() => toggleSection("link")}
          >
            <span className="font-medium">Link</span>
            {openSections.link ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {openSections.link && (
            <div className="mt-2 space-y-3">
              <Input 
                label="URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                icon={<Link size={16} />}
              />
              
              <div className="flex space-x-2">
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleLinkUpdate}
                  disabled={!linkUrl}
                >
                  Apply
                </Button>
                
                {selectedElement.link && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={removeLink}
                  >
                    <Unlink size={14} className="mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyEditor; 