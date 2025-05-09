"use client";

import { useState } from 'react';
import EnhancedTemplateBrowser from '@/components/templates/EnhancedTemplateBrowser';
import EnhancedTemplateEditor from '@/components/templates/EnhancedTemplateEditor';
import { EnhancedAnalyticsDisplay } from '@/components/analytics/EnhancedAnalyticsDisplay';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { TemplateProps } from '@/components/templates/TemplateCard';
import { Template, TemplateSection, TextOverlay } from '@/lib/types/template';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<string>("browse");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Handle loading more templates
  const handleLoadMore = async () => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    // Return empty array as we're just testing the interface
    return [];
  };
  
  // Handle search for templates
  const handleSearch = async (query: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    
    // Return empty array as we're just testing the interface
    return [];
  };
  
  // Handle updating text overlay in the editor
  const handleUpdateTextOverlay = (sectionId: string, overlayId: string, data: Partial<TextOverlay>) => {
    if (!selectedTemplate) return;
    
    // Update the template with the edited overlay
    const updatedTemplate = {
      ...selectedTemplate,
      sections: selectedTemplate.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          textOverlays: section.textOverlays.map(overlay => 
            overlay.id === overlayId ? { ...overlay, ...data } : overlay
          )
        } : section
      )
    };
    
    setSelectedTemplate(updatedTemplate);
  };
  
  // Handle adding new text overlay
  const handleAddTextOverlay = (sectionId: string) => {
    if (!selectedTemplate) return;
    
    // Create a new text overlay and add it to the section
    const newOverlay: TextOverlay = {
      id: `overlay-${Date.now()}`,
      text: "New text overlay",
      position: "middle",
      style: "caption",
      color: "#FFFFFF",
      fontSize: 16
    };
    
    const updatedTemplate = {
      ...selectedTemplate,
      sections: selectedTemplate.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          textOverlays: [...section.textOverlays, newOverlay]
        } : section
      )
    };
    
    setSelectedTemplate(updatedTemplate);
  };
  
  // Handle deleting text overlay
  const handleDeleteTextOverlay = (sectionId: string, overlayId: string) => {
    if (!selectedTemplate) return;
    
    const updatedTemplate = {
      ...selectedTemplate,
      sections: selectedTemplate.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          textOverlays: section.textOverlays.filter(overlay => overlay.id !== overlayId)
        } : section
      )
    };
    
    setSelectedTemplate(updatedTemplate);
  };
  
  // Handle updating section properties
  const handleUpdateSection = (sectionId: string, data: Partial<TemplateSection>) => {
    if (!selectedTemplate) return;
    
    const updatedTemplate = {
      ...selectedTemplate,
      sections: selectedTemplate.sections.map(section => 
        section.id === sectionId ? {
          ...section,
          ...data
        } : section
      )
    };
    
    setSelectedTemplate(updatedTemplate);
  };
  
  // Handle AI generation
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGeneratingAI(false);
  };
  
  // Handle saving template
  const handleSaveTemplate = async () => {
    setIsSaving(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };
  
  // Handle date range change for analytics
  const handleDateRangeChange = (range: string) => {
    console.log(`Date range changed to: ${range}`);
    // In a real app, this would fetch new data for the selected range
  };

  // Sample template data for the editor
  const sampleTemplate: Template = {
    id: "template-1",
    name: "Sample Template",
    industry: "Fashion",
    category: "Social Media",
    description: "A sample template for demonstration",
    sections: [
      {
        id: "section-1",
        name: "Intro",
        duration: 3,
        textOverlays: [
          {
            id: "overlay-1",
            text: "Welcome to our fashion collection",
            position: "middle" as const,
            style: "headline" as const,
            color: "#FFFFFF",
            fontSize: 24
          }
        ],
        order: 1
      }
    ],
    views: 1200,
    usageCount: 156,
    isPublished: true,
    userId: "user-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Sample templates for the browser
  const sampleTemplates: TemplateProps[] = [
    {
      id: "1",
      category: "Fashion",
      duration: "30s",
      title: "Summer Collection",
      views: "1.2K",
      isAnalyzed: true
    },
    {
      id: "2",
      category: "Food",
      duration: "15s",
      title: "Quick Recipe",
      views: "3.5K"
    },
    {
      id: "3",
      category: "Travel",
      duration: "45s",
      title: "Destination Guide",
      views: "2.1K"
    }
  ];
  
  // Sample analytics data
  const sampleAnalyticsData = {
    period: "Last 30 days",
    metrics: {
      primary: [
        {
          name: "Template Views",
          value: 1245,
          change: 23.5,
          trend: "up" as const,
          unit: ""
        },
        {
          name: "Usage Count",
          value: 187,
          change: 12.3,
          trend: "up" as const,
          unit: ""
        },
        {
          name: "Completion Rate",
          value: 68.4,
          change: -3.2,
          trend: "down" as const,
          unit: "%"
        },
        {
          name: "Avg. Duration",
          value: 32.5,
          change: 0,
          trend: "neutral" as const,
          unit: "s"
        }
      ],
      secondary: []
    },
    timeSeriesData: {
      views: [],
      engagement: [],
      conversion: []
    },
    topPerformers: []
  };

  // Watch for template selection
  const handleTemplateSelect = (templateId: string) => {
    // In a real app, fetch the full template data
    // For demo purposes, just use the sample template
    setSelectedTemplate(sampleTemplate);
    setSelectedSectionId(sampleTemplate.sections[0].id);
    setActiveTab("edit");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Template Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="edit">Template Editor</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse" className="p-0">
          <EnhancedTemplateBrowser
            initialTemplates={sampleTemplates}
            onLoadMore={handleLoadMore}
            onSearch={handleSearch}
            onSelectTemplate={handleTemplateSelect}
          />
        </TabsContent>
        
        <TabsContent value="edit" className="p-0">
          {selectedTemplate ? (
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-4"
                onClick={() => setActiveTab("browse")}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to browser
              </Button>
              
              <EnhancedTemplateEditor
                template={selectedTemplate}
                selectedSectionId={selectedSectionId}
                onUpdateTextOverlay={handleUpdateTextOverlay}
                onAddTextOverlay={handleAddTextOverlay}
                onDeleteTextOverlay={handleDeleteTextOverlay}
                onUpdateSection={handleUpdateSection}
                onGenerateAI={handleGenerateAI}
                onSave={handleSaveTemplate}
                isGeneratingAI={isGeneratingAI}
                isSaving={isSaving}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a template from the browser to start editing
              </p>
              <Button onClick={() => setActiveTab("browse")}>
                Browse Templates
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="p-0">
          <EnhancedAnalyticsDisplay
            title="Template Performance"
            subtitle="Analytics for your content performance"
            data={sampleAnalyticsData}
            onDateRangeChange={handleDateRangeChange}
            onExport={() => console.log("Exporting analytics data")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 