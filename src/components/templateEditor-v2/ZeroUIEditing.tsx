"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTemplateEditor } from './TemplateEditorContext';
import { Mic, Wand2, Layers, Pointer, AlignLeft, AlignCenter, AlignRight, Lightbulb } from 'lucide-react';
import { Element, ElementType } from './types';

export const ZeroUIEditing: React.FC = () => {
  const { state, updateElement, addElement, moveElement } = useTemplateEditor();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{id: string, description: string}>>([]);
  const [showIntentAssistance, setShowIntentAssistance] = useState(false);
  const [lastInteractions, setLastInteractions] = useState<Array<{x: number, y: number, timestamp: number}>>([]);
  const [pendingVoiceText, setPendingVoiceText] = useState('');
  
  const recognitionRef = useRef<any>(null);
  
  // Get the active section
  const activeSection = state.template.sections.find(
    section => section.id === state.ui.selectedSectionId
  ) || state.template.sections[0];
  
  // Get the selected element
  const selectedElement = state.ui.selectedElementId 
    ? activeSection.elements.find(el => el.id === state.ui.selectedElementId)
    : null;
  
  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
          setPendingVoiceText(transcript);
          
          // Check if this is a final result
          if (event.results[event.resultIndex].isFinal) {
            processVoiceCommand(transcript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          setVoiceError(event.error);
          setIsVoiceActive(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsVoiceActive(false);
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, []);
  
  // Process voice commands
  const processVoiceCommand = (command: string) => {
    console.log('Processing voice command:', command);
    
    // Process different types of commands
    if (command.includes('add text')) {
      // Extract the text content after "add text"
      const textContent = command.replace('add text', '').trim();
      if (textContent) {
        addTextElement(textContent);
      }
    } else if (command.includes('center')) {
      centerElement();
    } else if (command.includes('align left')) {
      alignElement('left');
    } else if (command.includes('align right')) {
      alignElement('right');
    } else if (command.includes('select')) {
      // Handle selection commands
    } else if (command.includes('delete')) {
      // Handle deletion commands
    } else if (command.includes('move')) {
      // Handle movement commands
    }
    
    // Clear pending text
    setPendingVoiceText('');
  };
  
  // Start voice recognition
  const startVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        setIsVoiceActive(true);
        setVoiceError(null);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        setVoiceError('Failed to start speech recognition');
        setIsVoiceActive(false);
      }
    } else {
      setVoiceError('Speech recognition not supported in this browser');
    }
  };
  
  // Track mouse/touch interactions to detect user intent
  const trackInteraction = (x: number, y: number) => {
    const now = Date.now();
    const newInteraction = { x, y, timestamp: now };
    
    // Add to interaction history, keeping only recent interactions
    setLastInteractions(prev => {
      const recent = prev.filter(i => now - i.timestamp < 2000); // Keep last 2 seconds
      return [...recent, newInteraction].slice(-10); // Keep up to 10 points
    });
    
    // Analyze interaction pattern
    if (lastInteractions.length >= 5) {
      detectIntent();
    }
  };
  
  // Detect user intent from interaction patterns
  const detectIntent = () => {
    if (lastInteractions.length < 5) return;
    
    // Calculate if user is indecisive (moving back and forth)
    let directionalChanges = 0;
    let lastDirection = null;
    
    for (let i = 1; i < lastInteractions.length; i++) {
      const prev = lastInteractions[i - 1];
      const curr = lastInteractions[i];
      
      const xDiff = curr.x - prev.x;
      const yDiff = curr.y - prev.y;
      
      // Determine dominant direction
      const direction = Math.abs(xDiff) > Math.abs(yDiff)
        ? (xDiff > 0 ? 'right' : 'left')
        : (yDiff > 0 ? 'down' : 'up');
      
      if (lastDirection && direction !== lastDirection) {
        directionalChanges++;
      }
      
      lastDirection = direction;
    }
    
    // If user changes direction frequently, they might need help
    if (directionalChanges >= 3) {
      setShowIntentAssistance(true);
    }
  };
  
  // Add a text element from voice command
  const addTextElement = (content: string) => {
    if (!activeSection) return;
    
    // Get canvas dimensions for positioning
    const canvasWidth = 300; // Placeholder, ideally get from state or refs
    const canvasHeight = 600;
    
    // Add the element
    const elementId = addElement(activeSection.id, 'text');
    
    // Update the element with content and centered position
    if (elementId) {
      // Find the newly created element
      const newElement = activeSection.elements.find(el => el.id === elementId);
      if (newElement) {
        // Position in center of visible area
        const x = (canvasWidth - (newElement.width || 200)) / 2;
        const y = (canvasHeight - (newElement.height || 100)) / 2;
        
        updateElement(activeSection.id, elementId, {
          content,
          x,
          y
        });
      }
    }
  };
  
  // Center the selected element
  const centerElement = () => {
    if (!selectedElement || !activeSection) return;
    
    // Get canvas dimensions
    const canvasWidth = 300; // Placeholder, ideally get from state or refs
    const canvasHeight = 600;
    
    // Calculate center position
    const x = (canvasWidth - selectedElement.width) / 2;
    
    // Keep the same y position
    moveElement(activeSection.id, selectedElement.id, x, selectedElement.y);
  };
  
  // Align element (left, right, center)
  const alignElement = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedElement || !activeSection) return;
    
    // Get canvas dimensions
    const canvasWidth = 300; // Placeholder
    
    let x = selectedElement.x;
    
    if (alignment === 'left') {
      x = 10; // Left margin
    } else if (alignment === 'center') {
      x = (canvasWidth - selectedElement.width) / 2;
    } else if (alignment === 'right') {
      x = canvasWidth - selectedElement.width - 10; // Right margin
    }
    
    moveElement(activeSection.id, selectedElement.id, x, selectedElement.y);
  };
  
  // Generate AI suggestions for element positioning
  const generatePositioningSuggestions = () => {
    if (!selectedElement || !activeSection) return;
    
    // In a real implementation, this would call an AI service
    // For now, we'll generate some simple suggestions
    const suggestions = [
      {
        id: '1',
        description: 'Center on screen',
        apply: () => centerElement()
      },
      {
        id: '2',
        description: 'Align with top',
        apply: () => moveElement(activeSection.id, selectedElement.id, selectedElement.x, 20)
      },
      {
        id: '3',
        description: 'Create visual balance',
        apply: () => {
          // Find a balanced position based on other elements
          const otherElements = activeSection.elements.filter(el => el.id !== selectedElement.id);
          
          // Calculate average x position of other elements
          if (otherElements.length > 0) {
            const avgX = otherElements.reduce((sum, el) => sum + el.x, 0) / otherElements.length;
            
            // Position opposite to balance
            const balancedX = canvasWidth - avgX - selectedElement.width;
            moveElement(activeSection.id, selectedElement.id, balancedX, selectedElement.y);
          }
        }
      }
    ];
    
    setSuggestions(suggestions);
  };
  
  // Auto-align all elements
  const autoAlignElements = () => {
    if (!activeSection) return;
    
    // Find elements that are slightly misaligned
    const elements = [...activeSection.elements];
    
    // Group elements by approximate x coordinate
    const xGroups: Record<number, Element[]> = {};
    
    elements.forEach(element => {
      // Round to nearest 10px to group approximately aligned elements
      const roundedX = Math.round(element.x / 10) * 10;
      
      if (!xGroups[roundedX]) {
        xGroups[roundedX] = [];
      }
      
      xGroups[roundedX].push(element);
    });
    
    // Align elements within each group
    Object.entries(xGroups).forEach(([roundedX, groupElements]) => {
      if (groupElements.length > 1) {
        // Use the most common x value in the group as the target
        const targetX = parseInt(roundedX);
        
        // Align all elements to this x value
        groupElements.forEach(element => {
          if (Math.abs(element.x - targetX) < 10) { // Only adjust if they're close
            moveElement(activeSection.id, element.id, targetX, element.y);
          }
        });
      }
    });
  };
  
  // Balance the composition for better aesthetics
  const balanceComposition = () => {
    if (!activeSection || activeSection.elements.length < 2) return;
    
    // Get canvas dimensions
    const canvasWidth = 300; // Placeholder
    const canvasHeight = 600;
    
    // Calculate the current center of mass
    let totalWeight = 0;
    let weightedX = 0;
    
    activeSection.elements.forEach(element => {
      const elementWeight = element.width * element.height;
      totalWeight += elementWeight;
      weightedX += (element.x + element.width/2) * elementWeight;
    });
    
    const centerOfMass = weightedX / totalWeight;
    const canvasCenter = canvasWidth / 2;
    
    // If significantly imbalanced, adjust elements
    if (Math.abs(centerOfMass - canvasCenter) > 30) {
      // Move elements to balance the composition
      const adjustment = (canvasCenter - centerOfMass) / 2;
      
      activeSection.elements.forEach(element => {
        const newX = element.x + adjustment;
        moveElement(activeSection.id, element.id, newX, element.y);
      });
    }
  };
  
  // Effect to generate suggestions when an element is selected
  useEffect(() => {
    if (selectedElement) {
      generatePositioningSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [state.ui.selectedElementId]);
  
  // For demo purposes, define a fixed canvas width
  const canvasWidth = 300;
  
  return (
    <div data-testid="zero-ui-container" className="p-4 bg-gray-50 border-t">
      {/* Voice command button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">AI-Powered Editing</h3>
        
        <button
          data-testid="voice-command-button"
          onClick={startVoiceRecognition}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
            isVoiceActive 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } transition-colors`}
        >
          <Mic size={18} />
          <span>{isVoiceActive ? 'Listening...' : 'Voice Command'}</span>
        </button>
      </div>
      
      {/* Voice command status */}
      {isVoiceActive && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <Mic size={18} className="text-blue-500 animate-pulse mr-2" />
            <p className="font-medium">
              {pendingVoiceText || "Listening for commands..."}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Try saying: "add text hello world", "center", "align left", "align right"
          </p>
          {voiceError && (
            <div data-testid="voice-error-message" className="mt-2 text-red-500 text-sm">
              Error: {voiceError === 'not-allowed' ? 'Microphone access denied' : voiceError}
            </div>
          )}
        </div>
      )}
      
      {/* AI Tools */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          data-testid="auto-align-button"
          onClick={autoAlignElements}
          className="flex flex-col items-center justify-center p-3 bg-white rounded-md border hover:bg-gray-50 transition-colors"
        >
          <AlignCenter size={20} className="text-blue-500 mb-2" />
          <span className="text-sm">Auto-Align</span>
        </button>
        
        <button
          data-testid="balance-composition-button"
          onClick={balanceComposition}
          className="flex flex-col items-center justify-center p-3 bg-white rounded-md border hover:bg-gray-50 transition-colors"
        >
          <Layers size={20} className="text-blue-500 mb-2" />
          <span className="text-sm">Balance Composition</span>
        </button>
        
        <button
          className="flex flex-col items-center justify-center p-3 bg-white rounded-md border hover:bg-gray-50 transition-colors"
        >
          <Wand2 size={20} className="text-blue-500 mb-2" />
          <span className="text-sm">Magic Enhance</span>
        </button>
      </div>
      
      {/* Intent assistance */}
      {showIntentAssistance && (
        <div 
          data-testid="intent-assistance"
          className="mb-4 p-3 bg-yellow-50 rounded-md flex items-start"
        >
          <Lightbulb size={20} className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Need help positioning?</p>
            <p className="text-sm text-gray-600 mt-1">
              I noticed you're making several adjustments. Would you like me to suggest better positions?
            </p>
            <div className="mt-2 flex space-x-2">
              <button 
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                onClick={() => {
                  generatePositioningSuggestions();
                  setShowIntentAssistance(false);
                }}
              >
                Show suggestions
              </button>
              <button 
                className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => setShowIntentAssistance(false)}
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Positioning suggestions */}
      {selectedElement && suggestions.length > 0 && (
        <div data-testid="positioning-suggestions" className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Intelligent Positioning</h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                data-testid={`suggestion-${suggestion.id}`}
                className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-colors"
                onClick={() => suggestion.apply?.()}
              >
                <span role="button" aria-label={`suggestion ${suggestion.description}`}>
                  {suggestion.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Add proper types for the suggestion
interface PositioningSuggestion {
  id: string;
  description: string;
  apply?: () => void;
} 