'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PanelRight, Settings, Music, TextIcon, Palette, Clock, ThumbsUp } from 'lucide-react';
import { Template } from '@/lib/types/template';
import TemplateSoundSelector from './TemplateSoundSelector';
import { useTemplateSound } from '@/lib/hooks/useTemplateSound';
import { Card, CardContent } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';

interface TemplateSoundRecommendation {
  id: string;
  title: string;
  authorName: string;
  genres?: string[];
  playUrl?: string;
  matchScore: number;
  reason: string;
}

interface TemplateEditorSidebarProps {
  template: Template;
  onTemplateChange?: (template: Template) => void;
  className?: string;
  templateSections?: Array<{
    id: string;
    title: string;
    type: string;
    duration?: number;
  }>;
}

export default function TemplateEditorSidebar({
  template,
  onTemplateChange,
  className = '',
  templateSections = []
}: TemplateEditorSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('sound');
  const [recommendedSounds, setRecommendedSounds] = useState<TemplateSoundRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Reference to the drop target sections
  const sectionRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Initialize template sound hook
  const {
    sound,
    loading: soundLoading,
    selectSound,
    removeSound
  } = useTemplateSound({
    templateId: template.id,
    initialSoundId: template.soundId,
    onSoundChange: (selectedSound) => {
      if (onTemplateChange && template) {
        onTemplateChange({
          ...template,
          soundId: selectedSound?.id,
          soundTitle: selectedSound?.title,
          soundAuthor: selectedSound?.authorName,
          soundUrl: selectedSound?.playUrl
        });
      }
    }
  });

  // Fetch recommended sounds when the template or active tab changes
  useEffect(() => {
    if (activeTab === 'sound' && template) {
      fetchRecommendedSounds();
    }
  }, [activeTab, template.id, template.category]);

  // Fetch recommended sounds based on template content
  const fetchRecommendedSounds = async () => {
    setLoadingRecommendations(true);
    try {
      // In a real app, this would be an API call
      const response = await fetch(`/api/sounds/recommendations?templateId=${template.id}&category=${template.category}`);
      const data = await response.json();
      
      if (data.success && data.recommendations) {
        setRecommendedSounds(data.recommendations);
      } else {
        // Fallback to sample data if API fails
        setRecommendedSounds(getSampleRecommendations());
      }
    } catch (error) {
      console.error('Error fetching sound recommendations:', error);
      setRecommendedSounds(getSampleRecommendations());
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handle sound drag start
  const handleDragStart = (e: React.DragEvent, sound: TemplateSoundRecommendation) => {
    e.dataTransfer.setData('application/json', JSON.stringify(sound));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle drag over on a section
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle drop on a section
  const handleDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    try {
      const soundData = e.dataTransfer.getData('application/json');
      if (soundData) {
        const sound = JSON.parse(soundData);
        // Select the sound using the existing mechanism
        selectSound(sound);
        
        // Here you would also associate this sound with a specific section
        // In a real implementation, this would update the template section data
        console.log(`Sound ${sound.title} dropped on section ${sectionId}`);
        
        // Notify the user
        alert(`Sound "${sound.title}" assigned to section "${sectionId}"`);
      }
    } catch (error) {
      console.error('Error processing dropped sound:', error);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Sample recommendations when API is not available
  const getSampleRecommendations = (): TemplateSoundRecommendation[] => {
    return [
      {
        id: 'sound-rec-1',
        title: 'Cinematic Impact',
        authorName: 'SoundStudio',
        genres: ['Cinematic', 'Impact'],
        playUrl: '/samples/cinematic-impact.mp3',
        matchScore: 92,
        reason: 'Matches template pace and structure'
      },
      {
        id: 'sound-rec-2',
        title: 'Ambient Flow',
        authorName: 'AudioWaves',
        genres: ['Ambient', 'Relaxing'],
        playUrl: '/samples/ambient-flow.mp3',
        matchScore: 86,
        reason: 'Popular with similar templates'
      },
      {
        id: 'sound-rec-3',
        title: 'Energy Beat',
        authorName: 'BeatMaster',
        genres: ['Energetic', 'Rhythmic'],
        playUrl: '/samples/energy-beat.mp3',
        matchScore: 78,
        reason: 'Aligns with content theme'
      }
    ];
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute left-0 top-4 z-10 transform -translate-x-full bg-white p-2 rounded-l-md shadow border border-r-0 border-gray-200"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <PanelRight className={`h-5 w-5 text-gray-600 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Sidebar content */}
      <div 
        className={`${
          isOpen ? 'w-80' : 'w-0 overflow-hidden'
        } transition-all duration-300 ease-in-out h-full border-l border-gray-200 bg-white shadow-sm`}
      >
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Template Options</h2>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="sound" className="flex flex-col items-center py-2">
                <Music className="h-4 w-4 mb-1" />
                <span className="text-xs">Sound</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="flex flex-col items-center py-2">
                <TextIcon className="h-4 w-4 mb-1" />
                <span className="text-xs">Text</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="flex flex-col items-center py-2">
                <Palette className="h-4 w-4 mb-1" />
                <span className="text-xs">Style</span>
              </TabsTrigger>
              <TabsTrigger value="timing" className="flex flex-col items-center py-2">
                <Clock className="h-4 w-4 mb-1" />
                <span className="text-xs">Timing</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sound" className="focus:outline-none">
              <TemplateSoundSelector
                selectedSoundId={template.soundId}
                onSelectSound={selectSound}
                onRemoveSound={removeSound}
                templateCategory={template.category}
                showRecommendations={true}
              />
              
              {/* Template sections for drag-and-drop sound assignment - NEW */}
              {templateSections && templateSections.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Assign to sections</h3>
                  <p className="text-xs text-gray-500 mb-3">Drag and drop sounds to specific sections</p>
                  
                  <div className="space-y-2">
                    {templateSections.map(section => (
                      <div 
                        key={section.id}
                        ref={el => sectionRefs.current[section.id] = el}
                        className="border border-dashed border-gray-300 rounded-md p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{section.title || section.type}</p>
                            {section.duration && (
                              <p className="text-xs text-gray-500">{section.duration}s</p>
                            )}
                          </div>
                          <Music className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recommended sounds - NEW */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span>Recommended Sounds</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchRecommendedSounds}
                    disabled={loadingRecommendations}
                    className="h-7 text-xs"
                  >
                    Refresh
                  </Button>
                </h3>
                
                {loadingRecommendations ? (
                  <div className="py-8 text-center text-gray-500">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-xs">Loading recommendations...</p>
                  </div>
                ) : recommendedSounds.length > 0 ? (
                  <div className="space-y-3">
                    {recommendedSounds.map(rec => (
                      <Card 
                        key={rec.id} 
                        className="border border-gray-200 hover:border-primary/50 cursor-grab transition-colors"
                        draggable
                        onDragStart={(e) => handleDragStart(e, rec)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-sm">{rec.title}</p>
                              <p className="text-xs text-gray-500">By {rec.authorName}</p>
                            </div>
                            <div className="flex items-center">
                              <ThumbsUp className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs font-medium">{rec.matchScore}%</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{rec.reason}</p>
                          
                          {/* Genres */}
                          {rec.genres && rec.genres.length > 0 && (
                            <div className="flex mt-2 flex-wrap gap-1">
                              {rec.genres.map(genre => (
                                <span 
                                  key={genre} 
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <p className="text-xs">No recommendations available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="focus:outline-none">
              <div className="p-4 border rounded-md bg-gray-50">
                <p className="text-sm text-gray-500">Text editing options will go here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="style" className="focus:outline-none">
              <div className="p-4 border rounded-md bg-gray-50">
                <p className="text-sm text-gray-500">Style options will go here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="timing" className="focus:outline-none">
              <div className="p-4 border rounded-md bg-gray-50">
                <p className="text-sm text-gray-500">Timing options will go here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 