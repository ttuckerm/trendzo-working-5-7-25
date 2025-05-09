'use client';

import { useState } from 'react';
import { Bot, Settings, RefreshCw, Save, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

export interface MLFeedbackSettings {
  feedbackLoopEnabled: boolean;
  expertWeightFactor: number;
  incorporateRealTimeData: boolean;
  sensitivityThreshold: number;
  autoApplySuggestions: boolean;
  considerHistoricalAdjustments: boolean;
  minConfidenceForSuggestions: number;
}

interface MLFeedbackSettingsProps {
  settings?: MLFeedbackSettings;
  onSaveSettings?: (settings: MLFeedbackSettings) => Promise<boolean>;
  isLoading?: boolean;
}

const defaultSettings: MLFeedbackSettings = {
  feedbackLoopEnabled: true,
  expertWeightFactor: 0.7,
  incorporateRealTimeData: true,
  sensitivityThreshold: 0.5,
  autoApplySuggestions: false,
  considerHistoricalAdjustments: true,
  minConfidenceForSuggestions: 0.65
};

export function MLFeedbackSettings({ 
  settings: initialSettings, 
  onSaveSettings,
  isLoading = false
}: MLFeedbackSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MLFeedbackSettings>(initialSettings || defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: keyof MLFeedbackSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!onSaveSettings) {
      toast({
        title: "Settings Saved",
        description: "Your ML feedback settings have been updated.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const success = await onSaveSettings(settings);
      
      if (success) {
        toast({
          title: "Settings Saved",
          description: "Your ML feedback settings have been updated.",
        });
      } else {
        toast({
          title: "Error",
          description: "There was a problem saving your settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <BrainCircuit className="h-5 w-5 text-purple-600 mr-2" />
          <CardTitle className="text-lg text-purple-800">ML Feedback Settings</CardTitle>
        </div>
        <CardDescription>
          Configure how the machine learning system processes your expert feedback
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-0.5">
            <Label htmlFor="feedback-loop" className="font-medium">ML Feedback Loop</Label>
            <p className="text-xs text-gray-500">
              Enable the system to learn from your adjustments
            </p>
          </div>
          <Switch 
            id="feedback-loop"
            checked={settings.feedbackLoopEnabled}
            onCheckedChange={(checked) => handleSettingChange('feedbackLoopEnabled', checked)}
            disabled={isLoading || isSaving}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="expert-weight" className="font-medium">Expert Weight Factor</Label>
            <span className="text-sm">{Math.round(settings.expertWeightFactor * 100)}%</span>
          </div>
          <Slider 
            id="expert-weight"
            value={[settings.expertWeightFactor]}
            min={0.1}
            max={1}
            step={0.05}
            onValueChange={([value]) => handleSettingChange('expertWeightFactor', value)}
            disabled={!settings.feedbackLoopEnabled || isLoading || isSaving}
          />
          <p className="text-xs text-gray-500">
            How heavily your adjustments influence the ML model
          </p>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-0.5">
            <Label htmlFor="realtime-data" className="font-medium">Incorporate Real-Time Data</Label>
            <p className="text-xs text-gray-500">
              Include latest data in model updates
            </p>
          </div>
          <Switch 
            id="realtime-data"
            checked={settings.incorporateRealTimeData}
            onCheckedChange={(checked) => handleSettingChange('incorporateRealTimeData', checked)}
            disabled={!settings.feedbackLoopEnabled || isLoading || isSaving}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="sensitivity" className="font-medium">Sensitivity Threshold</Label>
            <span className="text-sm">{Math.round(settings.sensitivityThreshold * 100)}%</span>
          </div>
          <Slider 
            id="sensitivity"
            value={[settings.sensitivityThreshold]}
            min={0.1}
            max={0.9}
            step={0.05}
            onValueChange={([value]) => handleSettingChange('sensitivityThreshold', value)}
            disabled={!settings.feedbackLoopEnabled || isLoading || isSaving}
          />
          <p className="text-xs text-gray-500">
            How sensitive the ML system is to pattern changes
          </p>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-0.5">
            <Label htmlFor="auto-apply" className="font-medium">Auto-Apply High Confidence Suggestions</Label>
            <p className="text-xs text-gray-500">
              Automatically apply suggestions with confidence &gt;90%
            </p>
          </div>
          <Switch 
            id="auto-apply"
            checked={settings.autoApplySuggestions}
            onCheckedChange={(checked) => handleSettingChange('autoApplySuggestions', checked)}
            disabled={!settings.feedbackLoopEnabled || isLoading || isSaving}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="space-y-0.5">
            <Label htmlFor="historical-adjustments" className="font-medium">Consider Historical Adjustments</Label>
            <p className="text-xs text-gray-500">
              Include patterns from past adjustments
            </p>
          </div>
          <Switch 
            id="historical-adjustments"
            checked={settings.considerHistoricalAdjustments}
            onCheckedChange={(checked) => handleSettingChange('considerHistoricalAdjustments', checked)}
            disabled={!settings.feedbackLoopEnabled || isLoading || isSaving}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="min-confidence" className="font-medium">Minimum Confidence for Suggestions</Label>
            <span className="text-sm">{Math.round(settings.minConfidenceForSuggestions * 100)}%</span>
          </div>
          <Slider 
            id="min-confidence"
            value={[settings.minConfidenceForSuggestions]}
            min={0.4}
            max={0.95}
            step={0.05}
            onValueChange={([value]) => handleSettingChange('minConfidenceForSuggestions', value)}
            disabled={!settings.feedbackLoopEnabled || isLoading || isSaving}
          />
          <p className="text-xs text-gray-500">
            Only show suggestions above this confidence level
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSettings(defaultSettings)}
          disabled={isLoading || isSaving}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Reset Defaults
        </Button>
        <Button 
          onClick={handleSaveSettings}
          disabled={isLoading || isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
} 