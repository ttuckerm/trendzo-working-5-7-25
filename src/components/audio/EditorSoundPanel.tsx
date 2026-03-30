"use client";

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Music, Search, Info, ChevronDown, ChevronRight, Crown, Volume2, RotateCw } from 'lucide-react';
import { useTemplateSound } from '@/lib/hooks/useTemplateSound';
import { useAudio } from '@/lib/contexts/AudioContext';
import { Sound } from '@/lib/types/audio';
import { Tooltip } from '@/components/ui/tooltip';
import SoundSelector from './SoundSelector';
import SoundCard from './SoundCard';
import { formatAudioTime } from '@/lib/utils/audioUtils';
import { Badge } from '@/components/ui/badge';

interface EditorSoundPanelProps {
  templateId: string;
  mode?: 'full' | 'compact';
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

/**
 * EditorSoundPanel - A comprehensive panel for managing sounds in the template editor
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Integrated directly into the editor flow
 * - Progressive Disclosure: Advanced features revealed when needed
 * - Contextual Intelligence: Recommendations based on template content
 * - Emotional Design: Visual feedback on optimal sound choices
 */
const EditorSoundPanel: React.FC<EditorSoundPanelProps> = ({
  templateId,
  mode = 'full',
  isPremium = false,
  onUpgradeClick
}) => {
  // State and hooks
  const { templateSound, updateTemplateSound, isLoading } = useTemplateSound(templateId);
  const { state, setVolume, setLoop } = useAudio();
  const [activeTab, setActiveTab] = useState('current');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Example recommended sounds (in a real app, this would come from an API)
  const recommendedSounds: Sound[] = [
    {
      id: 'rec-1',
      title: 'Upbeat Summer Vibe',
      artist: 'SoundStudio',
      url: '/sounds/summer-vibe.mp3',
      duration: 45,
      category: 'Music',
      tags: ['upbeat', 'summer', 'positive']
    },
    {
      id: 'rec-2',
      title: 'Corporate Success',
      artist: 'BusinessAudio',
      url: '/sounds/corporate.mp3',
      duration: 30,
      category: 'Music',
      tags: ['corporate', 'success', 'professional']
    },
    {
      id: 'rec-3',
      title: 'Social Media Notification',
      artist: 'UX Sounds',
      url: '/sounds/notification.mp3',
      duration: 2,
      category: 'SFX',
      tags: ['notification', 'short', 'social']
    }
  ];

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  // Handle loop toggle
  const handleLoopToggle = (checked: boolean) => {
    setLoop(checked);
  };

  // Handle sound selection
  const handleSelectSound = (sound: Sound | null) => {
    updateTemplateSound(sound);
  };

  // Handle premium feature click
  const handlePremiumFeatureClick = () => {
    if (!isPremium && onUpgradeClick) {
      onUpgradeClick();
    }
  };

  // Render compact mode
  if (mode === 'compact') {
    return (
      <div className="editor-sound-panel-compact p-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Template Sound</h3>
          {isPremium && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs border-amber-200">
              <Crown className="h-3 w-3 mr-1 text-amber-500" />
              Premium
            </Badge>
          )}
        </div>
        
        <SoundSelector
          value={templateSound}
          onChange={handleSelectSound}
          label=""
          placeholder="Select a sound"
          contextType="template"
          contextId={templateId}
        />
        
        {!isPremium && (
          <div className="bg-muted/40 border border-muted rounded-md p-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Info className="h-3.5 w-3.5 mr-1 text-amber-500" />
              <span>Upgrade to access advanced sound features</span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="mt-2 w-full text-xs h-7 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900"
              onClick={onUpgradeClick}
            >
              <Crown className="h-3 w-3 mr-1 text-amber-500" />
              Upgrade to Premium
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render full mode
  return (
    <div className="editor-sound-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Template Sound</h3>
        {isPremium && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Crown className="h-3.5 w-3.5 mr-1 text-amber-500" />
            Premium
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="current" className="flex-1">Current</TabsTrigger>
          <TabsTrigger value="recommended" className="flex-1">Recommended</TabsTrigger>
          <TabsTrigger value="browse" className="flex-1">Browse</TabsTrigger>
        </TabsList>

        {/* Current Sound Tab */}
        <TabsContent value="current" className="space-y-4 mt-4">
          {templateSound ? (
            <div className="space-y-4">
              <SoundCard 
                sound={templateSound} 
                variant="detailed"
                actions={['play', 'favorite']}
                clickable={false}
              />
              
              <Collapsible 
                open={showAdvanced} 
                onOpenChange={setShowAdvanced}
                className={!isPremium ? "opacity-60 pointer-events-none" : ""}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-1">
                        {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <h4 className="text-sm font-medium">Advanced Settings</h4>
                  </div>
                  
                  {!isPremium && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs py-1 h-6 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-900"
                      onClick={onUpgradeClick}
                    >
                      <Crown className="h-3 w-3 mr-1 text-amber-500" />
                      Premium
                    </Button>
                  )}
                </div>
                
                <CollapsibleContent className="pt-2 space-y-4">
                  {/* Volume control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="volume" className="text-xs">Volume</Label>
                      <span className="text-xs text-muted-foreground">{Math.round(state.playback.volume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        id="volume"
                        value={[state.playback.volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={handleVolumeChange}
                      />
                    </div>
                  </div>
                  
                  {/* Loop control */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="loop" className="text-sm cursor-pointer">Loop sound</Label>
                    </div>
                    <Switch
                      id="loop"
                      checked={state.playback.loop}
                      onCheckedChange={handleLoopToggle}
                    />
                  </div>
                  
                  {/* Trim controls (requires premium) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="trim" className="text-xs">Trim Sound</Label>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{formatAudioTime(0)}</span>
                        <span>-</span>
                        <span>{formatAudioTime(templateSound.duration || 0)}</span>
                      </div>
                    </div>
                    <Slider
                      id="trim"
                      value={[0, 100]}
                      max={100}
                      step={1}
                      disabled={true}
                      className="cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground italic">
                      Sound trimming available in premium version
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <div className="pt-2 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSelectSound(null)}
                >
                  Remove Sound
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/30 border rounded-md p-6 flex flex-col items-center justify-center text-center">
                <Music className="h-8 w-8 text-muted-foreground mb-2" />
                <h4 className="font-medium mb-1">No sound selected</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a sound to enhance your template
                </p>
                <SoundSelector
                  value={templateSound}
                  onChange={handleSelectSound}
                  label=""
                  placeholder="Select a sound"
                  contextType="template"
                  contextId={templateId}
                  className="w-full max-w-xs"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Recommended Sounds Tab */}
        <TabsContent value="recommended" className="space-y-4 mt-4">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Info className="h-4 w-4 mr-1.5" />
            <span>Sounds recommended for your template</span>
          </div>
          
          <div className="space-y-3">
            {recommendedSounds.map(sound => (
              <SoundCard
                key={sound.id}
                sound={sound}
                variant="basic"
                actions={['play', 'add']}
                onAddClick={() => handleSelectSound(sound)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Browse Sounds Tab */}
        <TabsContent value="browse" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search sounds..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {['All', 'Music', 'SFX', 'Voice', 'Ambient'].map(category => (
                <Badge 
                  key={category} 
                  variant={category === 'All' ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="pt-2 grid grid-cols-2 gap-3">
            {recommendedSounds.map(sound => (
              <SoundCard
                key={sound.id}
                sound={sound}
                variant="grid"
                actions={['play', 'add']}
                onAddClick={() => handleSelectSound(sound)}
                className="w-full"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {!isPremium && activeTab !== 'current' && (
        <div className="bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-100 rounded-md p-3 flex items-start">
          <div className="mr-3 mt-1">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-grow">
            <h4 className="text-sm font-medium text-amber-800 mb-1">Premium Sound Features</h4>
            <p className="text-xs text-amber-700 mb-2">
              Upgrade to access sound trimming, waveform editing, and 1000+ premium sounds
            </p>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              onClick={onUpgradeClick}
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorSoundPanel; 