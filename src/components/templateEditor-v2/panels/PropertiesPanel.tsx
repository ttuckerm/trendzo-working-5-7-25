"use client";

import React, { useState, useEffect } from "react";
import { useTemplateEditor } from "../TemplateEditorContext";
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Bold, 
  Italic, 
  Underline,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Type,
  Image as ImageIcon,
  Video,
  Music,
  Square,
  Palette,
  Volume2,
  PictureInPicture,
  Layers
} from "lucide-react";
import { PropertyGroup } from "../PropertyGroup";
import { ColorPicker } from "../PropertyControls/ColorPicker";
import { FontControls } from "../PropertyControls/FontControls";
import { AnimationControls } from "../PropertyControls/AnimationControls";
import { TextAnimations } from "../PropertyControls/TextAnimations";
import { JustInTimeLearning } from "../JustInTimeLearning";
import { TierAccessManager } from "../TierAccessManager";
import { ProgressiveSkillSystem } from "../ProgressiveSkillSystem";
import { Element, AnimationProperties, AudioProperties } from "../types";

// Color picker options (simplified for this implementation)
const COLORS = [
  "#000000", "#ffffff", "#f44336", "#e91e63", "#9c27b0", 
  "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4",
  "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b",
  "#ffc107", "#ff9800", "#ff5722", "#795548", "#9e9e9e",
];

interface UserContextData {
  selectedElement: Element | null;
  currentAction: string;
  activePanel: string;
}

export const PropertiesPanel: React.FC = () => {
  const { 
    state, 
    updateElement, 
    updateSection,
    selectElement 
  } = useTemplateEditor();
  
  // User tier and context state
  const [userTier, setUserTier] = useState<'free' | 'premium' | 'platinum'>('free');
  const [userContext, setUserContext] = useState<UserContextData>({
    selectedElement: null,
    currentAction: 'editing',
    activePanel: 'properties',
  });
  const [trendData, setTrendData] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [helpTopic, setHelpTopic] = useState<string | null>(null);
  
  const selectedSectionId = state.ui.selectedSectionId;
  const selectedElementId = state.ui.selectedElementId;
  
  // Find the selected section
  const selectedSection = selectedSectionId
    ? state.template.sections.find(section => section.id === selectedSectionId)
    : null;
    
  // Find the selected element
  const selectedElement = selectedSection && selectedElementId
    ? selectedSection.elements.find(element => element.id === selectedElementId)
    : null;
  
  // Initialize the skill system and load user tier
  useEffect(() => {
    // This would typically fetch the user's tier from an API
    // For now, we'll default to 'free'
    setUserTier('free');
    
    // Initialize trend data (would come from an API in production)
    setTrendData({
      topAnimations: ['bounce', 'fade-in-up', 'wave'],
      popularColors: ['#FF5733', '#33FF57', '#3357FF'],
      effectiveFonts: ['Bebas Neue', 'Montserrat', 'Playfair Display'],
    });
    
    // Track user opening the properties panel
    const skillSystem = ProgressiveSkillSystem.getInstance();
    skillSystem.trackAction('openPanel', 'layout', 1);
  }, []);
  
  // Update user context when selection changes
  useEffect(() => {
    if (selectedElement) {
      setUserContext({
        selectedElement,
        currentAction: 'editing',
        activePanel: 'properties',
      });
      
      // Track element selection
      const skillSystem = ProgressiveSkillSystem.getInstance();
      skillSystem.trackAction('selectElement', selectedElement.type === 'text' ? 'text' : 'design', 1);
    }
  }, [selectedElement]);
  
  // Handle element property changes
  const handleElementChange = (property: string, value: any) => {
    if (selectedSection && selectedElement) {
      updateElement(selectedSection.id, selectedElement.id, { [property]: value });
      
      // Track the action for skill progression
      const skillSystem = ProgressiveSkillSystem.getInstance();
      skillSystem.trackAction('editProperty', 
        property.includes('font') || property === 'content' ? 'text' : 
        property.includes('animation') ? 'animation' : 'design',
        2
      );
    }
  };
  
  // Handle section property changes
  const handleSectionChange = (property: string, value: any) => {
    if (selectedSection) {
      updateSection(selectedSection.id, { [property]: value });
      
      // Track the action for skill progression
      const skillSystem = ProgressiveSkillSystem.getInstance();
      skillSystem.trackAction('editSection', 'layout', 2);
    }
  };
  
  // Handle font properties change
  const handleFontChange = (property: string, value: any) => {
    if (selectedSection && selectedElement && selectedElement.type === 'text') {
      updateElement(selectedSection.id, selectedElement.id, { [property]: value });
      
      // Track the action for text editing skill
      const skillSystem = ProgressiveSkillSystem.getInstance();
      skillSystem.trackAction('editFont', 'text', 2);
    }
  };
  
  // Handle animation change
  const handleAnimationChange = (animation: AnimationProperties) => {
    if (selectedSection && selectedElement) {
      // Check if the element already has animations
      const animations = selectedElement.animations || [];
      // Update the first animation or add a new one
      const updatedAnimations = animations.length > 0 
        ? [animation, ...animations.slice(1)] 
        : [animation];
      
      updateElement(selectedSection.id, selectedElement.id, { animations: updatedAnimations });
      
      // Track animation editing with higher complexity
      const skillSystem = ProgressiveSkillSystem.getInstance();
      skillSystem.trackAction('editAnimation', 'animation', 3);
      
      // Track feature use
      skillSystem.trackFeatureUse('animations');
    }
  };
  
  // Toggle property group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prevGroups => 
      prevGroups.includes(groupId)
        ? prevGroups.filter(id => id !== groupId)
        : [...prevGroups, groupId]
    );
  };
  
  // Handle help request
  const handleHelpRequest = (topic: string) => {
    setHelpTopic(topic);
  };
  
  // Handle feature introduction
  const handleFeatureIntroduction = (feature: string) => {
    // In a real app, this would show an introduction tutorial
    console.log(`Introducing feature: ${feature}`);
    
    // Mark feature as introduced
    const skillSystem = ProgressiveSkillSystem.getInstance();
    skillSystem.trackFeatureUse(feature);
  };
  
  // Handle tutorial completion
  const handleTutorialComplete = (tutorial: string) => {
    const skillSystem = ProgressiveSkillSystem.getInstance();
    skillSystem.completeTutorial(tutorial);
  };
  
  // Render text element properties
  const renderTextProperties = () => {
    if (!selectedElement || selectedElement.type !== 'text') return null;
    
    return (
      <>
        <PropertyGroup 
          title="Text Properties" 
          defaultExpanded={expandedGroups.includes('text-properties')}
          id="text-properties"
          tierRequired="free"
          userTier={userTier}
          helpText="Edit your text content and appearance"
          onHelpRequested={() => handleHelpRequest('text')}
        >
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1" htmlFor="text-content">
              Text Content
            </label>
            <textarea
              id="text-content"
              className="w-full text-sm p-2 border rounded min-h-[80px]"
              value={selectedElement.content || ''}
              onChange={(e) => handleElementChange("content", e.target.value)}
              aria-label="Text content"
            />
          </div>
          
          <FontControls
            fontFamily={selectedElement.fontFamily || 'Arial'}
            fontSize={selectedElement.fontSize || 16}
            fontWeight={selectedElement.fontWeight as string || 'normal'}
            fontStyle={selectedElement.fontStyle as string || 'normal'}
            textAlign={selectedElement.textAlign || 'left'}
            onFontFamilyChange={(value) => handleFontChange("fontFamily", value)}
            onFontSizeChange={(value) => handleFontChange("fontSize", value)}
            onFontWeightChange={(value) => handleFontChange("fontWeight", value)}
            onFontStyleChange={(value) => handleFontChange("fontStyle", value)}
            onTextAlignChange={(value) => handleFontChange("textAlign", value)}
            helpText="Choose fonts that match your content's tone"
            trendingFonts={trendData?.effectiveFonts}
          />
          
          <div className="mt-3">
            <ColorPicker
              color={selectedElement.color || '#000000'}
              onChange={(color) => handleElementChange("color", color)}
              label="Text Color"
              id="text-color"
              allowCustom={TierAccessManager.isFeatureAvailable('advancedColors', userTier)}
              helpText="Choose a color that contrasts well with your background"
              trendingColors={trendData?.popularColors}
            />
          </div>
        </PropertyGroup>
        
        <PropertyGroup 
          title="Text Animations" 
          defaultExpanded={expandedGroups.includes('text-animations')}
          id="text-animations"
          tierRequired="free"
          userTier={userTier}
          helpText="Add movement to your text"
          onHelpRequested={() => handleHelpRequest('textAnimations')}
        >
          <TextAnimations
            text={selectedElement.content || 'Sample Text'}
            animation={selectedElement.animations?.[0] || null}
            onChange={handleAnimationChange}
            userTier={userTier}
            context={{
              templateType: 'trending',
              trendCategory: state.template.category as string,
              audioTrack: state.template.tiktokSpecific?.soundId as string
            }}
          />
        </PropertyGroup>
      </>
    );
  };
  
  // Render image element properties
  const renderImageProperties = () => {
    if (!selectedElement || selectedElement.type !== 'image') return null;
    
    return (
      <PropertyGroup 
        title="Image Properties" 
        defaultExpanded={expandedGroups.includes('image-properties')}
        id="image-properties"
        tierRequired="free"
        userTier={userTier}
      >
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" htmlFor="image-url">
            Image URL
          </label>
          <input
            id="image-url"
            type="text"
            className="w-full text-sm p-2 border rounded"
            value={selectedElement.src || ''}
            onChange={(e) => handleElementChange("src", e.target.value)}
            placeholder="Enter image URL"
            aria-label="Image URL"
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" htmlFor="image-fit">
            Fit
          </label>
          <select
            id="image-fit"
            className="w-full text-sm p-2 border rounded"
            value={(selectedElement as any).objectFit || 'cover'}
            onChange={(e) => handleElementChange("objectFit", e.target.value)}
            aria-label="Fit"
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
            <option value="none">None</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" htmlFor="image-alt">
            Alt Text
          </label>
          <input
            id="image-alt"
            type="text"
            className="w-full text-sm p-2 border rounded"
            value={(selectedElement as any).alt || ''}
            onChange={(e) => handleElementChange("alt", e.target.value)}
            placeholder="Describe this image"
            aria-label="Alt Text"
          />
        </div>
      </PropertyGroup>
    );
  };
  
  // Render video element properties
  const renderVideoProperties = () => {
    if (!selectedElement || selectedElement.type !== 'video') return null;

    const handleVideoPropChange = (prop: keyof AudioProperties, value: any) => {
      const currentAudioProps = selectedElement.audio || {};
      handleElementChange("audio", { ...currentAudioProps, [prop]: value });
    };

    return (
      <PropertyGroup 
        title="Video Properties" 
        defaultExpanded={expandedGroups.includes('video-properties')}
        id="video-properties"
        tierRequired="free"
        userTier={userTier}
        helpText="Manage video source and playback settings."
        onHelpRequested={() => handleHelpRequest('video')}
      >
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" htmlFor="video-src">
            Video Source (URL)
          </label>
          <input
            id="video-src"
            type="text"
            className="w-full text-sm p-2 border rounded"
            value={selectedElement.src || ''}
            onChange={(e) => handleElementChange("src", e.target.value)}
            placeholder="Enter video URL"
            aria-label="Video Source URL"
          />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
          <div>
            <label htmlFor="video-autoplay" className="flex items-center text-xs font-medium">
              <input 
                type="checkbox" 
                id="video-autoplay" 
                className="mr-2 rounded"
                checked={selectedElement.audio?.autoplay || false}
                onChange={(e) => handleVideoPropChange('autoplay', e.target.checked)}
              />
              Autoplay
            </label>
          </div>
          <div>
            <label htmlFor="video-loop" className="flex items-center text-xs font-medium">
              <input 
                type="checkbox" 
                id="video-loop" 
                className="mr-2 rounded"
                checked={selectedElement.audio?.loop || false}
                onChange={(e) => handleVideoPropChange('loop', e.target.checked)}
              />
              Loop
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="video-start-time">
              Start Time (sec)
            </label>
            <input
              id="video-start-time"
              type="number"
              step="0.1"
              min="0"
              className="w-full text-sm p-2 border rounded"
              value={selectedElement.audio?.startTime ?? ''}
              onChange={(e) => handleVideoPropChange('startTime', e.target.value === '' ? undefined : parseFloat(e.target.value))}
              placeholder="e.g., 0 or 1.5"
              aria-label="Start Time"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="video-end-time">
              End Time (sec)
            </label>
            <input
              id="video-end-time"
              type="number"
              step="0.1"
              min="0"
              className="w-full text-sm p-2 border rounded"
              value={selectedElement.audio?.endTime ?? ''}
              onChange={(e) => handleVideoPropChange('endTime', e.target.value === '' ? undefined : parseFloat(e.target.value))}
              placeholder="e.g., 10 or 15.2"
              aria-label="End Time"
            />
          </div>
        </div>

      </PropertyGroup>
    );
  };
  
  // Render shape element properties
  const renderShapeProperties = () => {
    if (!selectedElement || selectedElement.type !== 'shape') return null;
    
    return (
      <PropertyGroup 
        title="Shape Properties" 
        defaultExpanded={expandedGroups.includes('shape-properties')}
        id="shape-properties"
        tierRequired="free"
        userTier={userTier}
      >
        <div className="mb-3">
          <ColorPicker
            color={selectedElement.backgroundColor || '#000000'}
            onChange={(color) => handleElementChange("backgroundColor", color)}
            label="Background Color"
            id="shape-bg-color"
            allowCustom={TierAccessManager.isFeatureAvailable('advancedColors', userTier)}
            trendingColors={trendData?.popularColors}
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" htmlFor="border-radius">
            Border Radius
          </label>
          <input
            id="border-radius"
            type="range"
            min="0"
            max="50"
            value={(selectedElement as any).borderRadius || 0}
            onChange={(e) => handleElementChange("borderRadius", parseInt(e.target.value))}
            className="w-full"
            aria-label="Border Radius"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>
      </PropertyGroup>
    );
  };
  
  // Render basic properties common to all element types
  const renderBasicProperties = () => {
    if (!selectedElement) return null;
    
    return (
      <PropertyGroup 
        title="Basic Properties" 
        defaultExpanded={expandedGroups.includes('basic-properties')}
        id="basic-properties"
        tierRequired="free"
        userTier={userTier}
      >
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1">X</label>
              <input
                type="number"
                className="w-full text-sm p-1.5 border rounded"
                value={selectedElement.x}
                onChange={(e) => handleElementChange("x", Number(e.target.value))}
                aria-label="Position X"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Y</label>
              <input
                type="number"
                className="w-full text-sm p-1.5 border rounded"
                value={selectedElement.y}
                onChange={(e) => handleElementChange("y", Number(e.target.value))}
                aria-label="Position Y"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Size</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1">Width</label>
              <input
                type="number"
                className="w-full text-sm p-1.5 border rounded"
                value={selectedElement.width}
                onChange={(e) => handleElementChange("width", Number(e.target.value))}
                min={10}
                aria-label="Width"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Height</label>
              <input
                type="number"
                className="w-full text-sm p-1.5 border rounded"
                value={selectedElement.height}
                onChange={(e) => handleElementChange("height", Number(e.target.value))}
                min={10}
                aria-label="Height"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Rotation (degrees)</label>
          <input
            type="range"
            min="0"
            max="360"
            value={selectedElement.rotation || 0}
            onChange={(e) => handleElementChange("rotation", Number(e.target.value))}
            className="w-full"
            aria-label="Rotation"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0°</span>
            <span>180°</span>
            <span>360°</span>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedElement.opacity || 1}
            onChange={(e) => handleElementChange("opacity", Number(e.target.value))}
            className="w-full"
            aria-label="Opacity"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="mb-3 flex space-x-2">
          <button
            type="button"
            className="flex-1 flex items-center justify-center p-2 border rounded hover:bg-gray-100"
            onClick={() => handleElementChange("locked", !selectedElement.locked)}
            aria-label={selectedElement.locked ? "Unlock element" : "Lock element"}
          >
            {selectedElement.locked ? (
              <>
                <Unlock size={16} className="mr-1" />
                <span className="text-xs">Unlock</span>
              </>
            ) : (
              <>
                <Lock size={16} className="mr-1" />
                <span className="text-xs">Lock</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            className="flex-1 flex items-center justify-center p-2 border rounded hover:bg-gray-100"
            onClick={() => handleElementChange("hidden", !selectedElement.hidden)}
            aria-label={selectedElement.hidden ? "Show element" : "Toggle visibility"}
          >
            {selectedElement.hidden ? (
              <>
                <Eye size={16} className="mr-1" />
                <span className="text-xs">Show</span>
              </>
            ) : (
              <>
                <EyeOff size={16} className="mr-1" />
                <span className="text-xs">Hide</span>
              </>
            )}
          </button>
        </div>
      </PropertyGroup>
    );
  };
  
  // Render appearance properties
  const renderAppearanceProperties = () => {
    if (!selectedElement) return null;
    
    return (
      <PropertyGroup 
        title="Appearance" 
        defaultExpanded={expandedGroups.includes('appearance-properties')}
        id="appearance-properties"
        tierRequired="free"
        userTier={userTier}
      >
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1" htmlFor="z-index">
            Layer (Z-Index)
          </label>
          <input
            id="z-index"
            type="number"
            min="1"
            className="w-full text-sm p-1.5 border rounded"
            value={selectedElement.zIndex || 1}
            onChange={(e) => handleElementChange("zIndex", Number(e.target.value))}
            aria-label="Z-Index"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            className="p-2 border rounded text-xs hover:bg-gray-100"
            onClick={() => handleElementChange("zIndex", (selectedElement.zIndex || 1) + 1)}
          >
            Bring Forward
          </button>
          <button
            type="button"
            className="p-2 border rounded text-xs hover:bg-gray-100"
            onClick={() => handleElementChange("zIndex", Math.max(1, (selectedElement.zIndex || 1) - 1))}
          >
            Send Backward
          </button>
        </div>
      </PropertyGroup>
    );
  };
  
  // Render animation properties
  const renderAnimationProperties = () => {
    if (!selectedElement) return null;
    
    return (
      <PropertyGroup 
        title="Animation" 
        defaultExpanded={expandedGroups.includes('animation-properties')}
        id="animation-properties"
        tierRequired="free"
        userTier={userTier}
        helpText="Add movement and transitions to your element"
        onHelpRequested={() => handleHelpRequest('animations')}
      >
        <AnimationControls
          animation={selectedElement.animations?.[0] || null}
          onChange={handleAnimationChange}
          userTier={userTier}
          audioAvailable={!!state.template.tiktokSpecific?.soundId}
          onPreviewAnimation={() => console.log('Preview animation')}
        />
        
        {TierAccessManager.isFeatureAvailable('advancedAnimations', userTier) ? (
          <p className="text-xs text-blue-500 mt-2">
            Try advanced features
          </p>
        ) : (
          <p className="text-xs text-purple-500 mt-2">
            Upgrade to premium for advanced animations
          </p>
        )}
      </PropertyGroup>
    );
  };
  
  // Render section properties
  const renderSectionProperties = () => {
    if (!selectedSection || selectedElementId) return null;
    
    return (
      <>
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Section Name</label>
          <input
            type="text"
            className="w-full text-sm p-2 border rounded"
            value={selectedSection.name}
            onChange={(e) => handleSectionChange("name", e.target.value)}
          />
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Background Color</label>
          <div className="grid grid-cols-10 gap-1">
            {COLORS.map(color => (
              <button
                key={color}
                className={`w-full aspect-square rounded-full border ${
                  selectedSection.backgroundColor === color ? "ring-2 ring-blue-500" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleSectionChange("backgroundColor", color)}
                title={color}
              />
            ))}
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Background Image URL</label>
          <input
            type="text"
            className="w-full text-sm p-2 border rounded"
            value={selectedSection.backgroundImage || ""}
            onChange={(e) => handleSectionChange("backgroundImage", e.target.value)}
            placeholder="Enter image URL"
          />
        </div>
      </>
    );
  };
  
  // Empty state when nothing is selected
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <Layers className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">No Selection</h3>
      <p className="text-sm text-gray-500 mb-4">
        Select a section or element to view and edit its properties.
      </p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h2 className="text-lg font-semibold">Properties</h2>
        
        {/* Show what's currently selected */}
        {selectedElement && (
          <div className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md flex items-center">
            {selectedElement.type === 'text' ? (
              <Type className="w-3 h-3 mr-1" />
            ) : selectedElement.type === 'image' ? (
              <ImageIcon className="w-3 h-3 mr-1" />
            ) : selectedElement.type === 'shape' ? (
              <Square className="w-3 h-3 mr-1" />
            ) : (
              <PictureInPicture className="w-3 h-3 mr-1" />
            )}
            <span>
              {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Selected
            </span>
          </div>
        )}
        
        {selectedSection && !selectedElement && (
          <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md flex items-center">
            <Layers className="w-3 h-3 mr-1" />
            <span>Section: {selectedSection.name}</span>
          </div>
        )}
      </div>
      
      {/* Properties content */}
      <div className="flex-1 overflow-auto p-4">
        {!selectedSection && !selectedElement ? (
          renderEmptyState()
        ) : selectedSection && !selectedElement ? (
          renderSectionProperties()
        ) : (
          <>
            {renderBasicProperties()}
            {selectedElement && selectedElement.type === 'text' && renderTextProperties()}
            {selectedElement && selectedElement.type === 'image' && renderImageProperties()}
            {selectedElement && selectedElement.type === 'video' && renderVideoProperties()}
            {selectedElement && selectedElement.type === 'shape' && renderShapeProperties()}
            {renderAppearanceProperties()}
            {renderAnimationProperties()}
          </>
        )}
      </div>
      
      {/* Just-in-time learning component */}
      {selectedElement && (
        <JustInTimeLearning
          currentContext={{
            ...userContext,
            selectedElement: {
              id: selectedElement.id,
              type: selectedElement.type,
              animations: selectedElement.animations
            }
          }}
          onHelpRequested={handleHelpRequest}
          onFeatureIntroduced={handleFeatureIntroduction}
          onTutorialComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
}; 