"use client";

import React, { useState } from 'react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { useAISuggestions } from '@/lib/hooks/useAISuggestions';
import { Sparkles, Lightbulb, Type, LayoutGrid, BarChart, RefreshCw, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * AI Suggestions Panel
 * 
 * Provides AI-powered suggestions for text content, layout improvements,
 * and performance optimization based on contextual analysis.
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Suggestions appear when relevant
 * - Emotional Design: Engaging suggestion UI with immediate preview
 * - Contextual Intelligence: Suggestions adapt to content type and user behavior
 * - Progressive Disclosure: More advanced suggestions appear as users engage
 * - Sensory Harmony: Visual feedback for applied suggestions
 * 
 * This component is self-contained and does not modify any existing components,
 * ensuring no disruption to the current functionality.
 */
const AISuggestionsPanel: React.FC = () => {
  const { selectedSection, selectedElement, trackInteraction } = useTemplateEditor();
  const { 
    isLoading, 
    error, 
    isPremiumUser, 
    togglePremiumStatus, 
    requestSuggestions, 
    applySuggestion 
  } = useAISuggestions();
  
  const [activeTab, setActiveTab] = useState('text');
  const [mockSuggestions, setMockSuggestions] = useState<{
    text: string[];
    layout: any[];
    performance: string[];
  }>({
    text: [],
    layout: [],
    performance: []
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    trackInteraction('select', `ai-tab:${value}`);
  };
  
  // Request suggestions
  const handleRequestSuggestions = (type: 'text' | 'layout' | 'performance') => {
    if (!isPremiumUser) return;
    
    trackInteraction('request', `ai-suggestion:${type}`);
    requestSuggestions(type);
    
    // For demo purposes, set mock suggestions after a delay
    setTimeout(() => {
      if (type === 'text') {
        setMockSuggestions(prev => ({
          ...prev,
          text: [
            "Grab attention with: \"The secret to viral content revealed!\"",
            "Start strong: \"3 techniques that changed my content game\"",
            "Question opener: \"Want to 10x your engagement overnight?\""
          ]
        }));
      } else if (type === 'layout') {
        setMockSuggestions(prev => ({
          ...prev,
          layout: [
            { id: 'layout1', name: 'Center focus', description: 'Move elements to center for better engagement' },
            { id: 'layout2', name: 'Rule of thirds', description: 'Align key content with the rule of thirds grid' },
            { id: 'layout3', name: 'Visual hierarchy', description: 'Increase contrast between primary and secondary elements' }
          ]
        }));
      } else if (type === 'performance') {
        setMockSuggestions(prev => ({
          ...prev,
          performance: [
            'Reduce section duration to maintain viewer attention',
            'Add a hook within the first 2 seconds to reduce drop-off',
            'Increase text size for better readability on mobile devices',
            'Use brighter colors to increase engagement metrics'
          ]
        }));
      }
    }, 1500);
  };
  
  // Apply suggestion
  const handleApplySuggestion = (type: 'text' | 'layout' | 'performance', id: number | string) => {
    if (!isPremiumUser) return;
    
    applySuggestion(type, id);
    trackInteraction('apply', `ai-suggestion:${type}:${id}`);
  };
  
  // Render text suggestions
  const renderTextSuggestions = () => {
    if (!isPremiumUser) return renderPremiumUpsell('text');
    
    if (isLoading) {
      return (
        <div className="space-y-3 py-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (!selectedElement) {
      return (
        <div className="text-center py-6 px-4">
          <Lightbulb className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-600 mb-1">No Element Selected</h3>
          <p className="text-xs text-gray-500">
            Select a text element to get AI-powered content suggestions.
          </p>
        </div>
      );
    }
    
    if (selectedElement.type !== 'text') {
      return (
        <div className="text-center py-6 px-4">
          <Type className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-600 mb-1">Text Suggestions</h3>
          <p className="text-xs text-gray-500">
            Only available for text elements. Select a text element to continue.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3 py-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Text Suggestions</h3>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => handleRequestSuggestions('text')}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        
        {mockSuggestions.text.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-3 text-center">
            <p className="text-sm text-gray-600">
              No suggestions yet. Click the refresh button to generate some.
            </p>
          </div>
        ) : (
          mockSuggestions.text.map((suggestion, index) => (
            <Card 
              key={index}
              className="border rounded-md p-3 bg-blue-50 border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => handleApplySuggestion('text', index)}
            >
              <p className="text-sm">{suggestion}</p>
            </Card>
          ))
        )}
      </div>
    );
  };
  
  // Render layout suggestions
  const renderLayoutSuggestions = () => {
    if (!isPremiumUser) return renderPremiumUpsell('layout');
    
    if (isLoading) {
      return (
        <div className="space-y-3 py-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }
    
    if (!selectedSection) {
      return (
        <div className="text-center py-6 px-4">
          <LayoutGrid className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-600 mb-1">No Section Selected</h3>
          <p className="text-xs text-gray-500">
            Select a section to get AI-powered layout suggestions.
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3 py-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Layout Suggestions</h3>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => handleRequestSuggestions('layout')}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        
        {mockSuggestions.layout.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-3 text-center">
            <p className="text-sm text-gray-600">
              No suggestions yet. Click the refresh button to generate some.
            </p>
          </div>
        ) : (
          mockSuggestions.layout.map((suggestion, index) => (
            <Card 
              key={index}
              className="border rounded-md p-3 bg-purple-50 border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={() => handleApplySuggestion('layout', suggestion.id)}
            >
              <h4 className="text-sm font-medium mb-1">{suggestion.name}</h4>
              <p className="text-xs text-gray-600">{suggestion.description}</p>
            </Card>
          ))
        )}
      </div>
    );
  };
  
  // Render performance suggestions
  const renderPerformanceSuggestions = () => {
    if (!isPremiumUser) return renderPremiumUpsell('performance');
    
    if (isLoading) {
      return (
        <div className="space-y-3 py-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }
    
    return (
      <div className="space-y-3 py-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Performance Tips</h3>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => handleRequestSuggestions('performance')}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        
        {mockSuggestions.performance.length === 0 ? (
          <div className="bg-gray-50 rounded-md p-3 text-center">
            <p className="text-sm text-gray-600">
              No suggestions yet. Click the refresh button to generate some.
            </p>
          </div>
        ) : (
          mockSuggestions.performance.map((tip, index) => (
            <div 
              key={index}
              className="border rounded-md p-3 bg-amber-50 border-amber-100"
            >
              <p className="text-sm">{tip}</p>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // Render premium upsell
  const renderPremiumUpsell = (feature: string) => {
    return (
      <div className="p-4">
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <LockKeyhole className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800 text-sm font-medium">Premium Feature</AlertTitle>
          <AlertDescription className="text-amber-700 text-xs">
            Unlock AI-powered {feature} suggestions with a premium subscription.
          </AlertDescription>
        </Alert>
        
        <Button 
          className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          size="sm"
          onClick={togglePremiumStatus}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade Now (Demo)
        </Button>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center">
          <Sparkles className="w-4 h-4 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">AI Suggestions</h2>
        </div>
        
        {isPremiumUser ? (
          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200">
            Premium
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-600">
            Free
          </Badge>
        )}
      </div>
      
      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs 
          defaultValue="text" 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="text">
              <Type className="w-4 h-4 mr-1.5" />
              Text
            </TabsTrigger>
            <TabsTrigger value="layout">
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart className="w-4 h-4 mr-1.5" />
              Metrics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="px-4">
            {renderTextSuggestions()}
          </TabsContent>
          
          <TabsContent value="layout" className="px-4">
            {renderLayoutSuggestions()}
          </TabsContent>
          
          <TabsContent value="performance" className="px-4">
            {renderPerformanceSuggestions()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AISuggestionsPanel; 