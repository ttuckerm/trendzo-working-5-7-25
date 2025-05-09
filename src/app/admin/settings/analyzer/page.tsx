"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuditLog } from '@/lib/hooks/useAuditLog';
import { 
  getAnalyzerSettings, 
  updateAnalyzerSettings, 
  validateAnalyzerSettings,
  type AnalyzerSettings,
  DEFAULT_ANALYZER_SETTINGS
} from '@/lib/services/systemSettingsService';

// Import directly from the compatibility components
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Button,
  Slider
} from '@/components/ui/ui-compatibility';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";

export default function TemplateAnalyzerSettings() {
  const [settings, setSettings] = useState<AnalyzerSettings>(DEFAULT_ANALYZER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<null | 'saving' | 'saved' | 'error'>(null);
  const { logAuditEvent } = useAuditLog();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Set a timeout to prevent hanging indefinitely
        const timeoutPromise = new Promise<AnalyzerSettings>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout fetching settings')), 3000);
        });
        
        // Race between the actual fetch and the timeout
        const analyzerSettings = await Promise.race([
          getAnalyzerSettings(),
          timeoutPromise
        ]);
        
        setSettings(analyzerSettings);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching analyzer settings:', error);
        setIsLoading(false);
        toast({
          title: "Error loading settings",
          description: "Could not load analyzer settings. Using default values.",
          variant: "destructive"
        });
      }
    };
    
    fetchSettings();
    
    // Set a backup timeout to ensure the UI renders even if everything fails
    const backupTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        console.warn('Backup timeout triggered to prevent UI hanging');
      }
    }, 5000);
    
    return () => clearTimeout(backupTimeout);
  }, [toast, isLoading]);
  
  const handleSettingsChange = (category: string | null, key: string, value: number | boolean) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [key]: typeof value === 'number' ? parseFloat(value as unknown as string) : value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: key === 'enableExpertOverride' ? value : parseFloat(value as unknown as string)
      }));
    }
  };
  
  const handleSaveSettings = async () => {
    // Validate settings before saving
    const validation = validateAnalyzerSettings(settings);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid settings",
        description: validation.errors.join(", "),
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaveStatus('saving');
      
      // Update settings
      const success = await updateAnalyzerSettings(settings);
      
      if (!success) {
        throw new Error("Failed to update settings");
      }
      
      // Log the change to audit trail
      try {
        // Get the current settings before updating for audit log (if Firebase is available)
        let oldSettings = null;
        if (db) {
          const currentSettings = await getDoc(doc(db, 'system', 'analyzerSettings'));
          if (currentSettings.exists()) {
            oldSettings = currentSettings.data();
          }
        }
        
        await logAuditEvent({
          action: 'update_analyzer_settings',
          details: { 
            oldSettings,
            newSettings: settings
          }
        });
      } catch (auditError) {
        console.error('Error logging audit event:', auditError);
        // Continue even if audit logging fails
      }
      
      setSaveStatus('saved');
      toast({
        title: "Settings saved",
        description: "Analyzer settings have been updated successfully.",
        variant: "default"
      });
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error updating analyzer settings:', error);
      setSaveStatus('error');
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Template Analyzer Settings</h1>
        <Button 
          onClick={handleSaveSettings} 
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Saving...
            </>
          ) : 'Save Settings'}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure the main parameters that control how the analyzer operates</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex justify-between">
              <span>Confidence Threshold</span>
              <span className="text-sm text-muted-foreground">{settings.confidenceThreshold.toFixed(2)}</span>
            </label>
            <Slider 
              min={0.1} 
              max={0.9} 
              step={0.05} 
              value={[settings.confidenceThreshold]} 
              onValueChange={(value) => handleSettingsChange(null, 'confidenceThreshold', value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Confidence</span>
              <span>High Confidence</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="minimumDataPoints">Minimum Data Points</label>
            <Input
              id="minimumDataPoints"
              type="number"
              min={10}
              max={1000}
              value={settings.minimumDataPoints.toString()}
              onChange={(e) => handleSettingsChange(null, 'minimumDataPoints', parseInt(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="refreshInterval">Refresh Interval (hours)</label>
            <Input
              id="refreshInterval"
              type="number"
              min={1}
              max={72}
              value={settings.refreshInterval.toString()}
              onChange={(e) => handleSettingsChange(null, 'refreshInterval', parseInt(e.target.value))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableExpertOverride"
              checked={settings.enableExpertOverride}
              onCheckedChange={(checked) => handleSettingsChange(null, 'enableExpertOverride', !!checked)}
            />
            <label htmlFor="enableExpertOverride">
              Enable Expert Override
            </label>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Weight Factors</CardTitle>
          <CardDescription>Adjust how much influence different factors have on the overall analysis</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="flex justify-between">
              <span>Engagement Weight</span>
              <span className="text-sm text-muted-foreground">{settings.engagementWeight.toFixed(1)}</span>
            </label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[settings.engagementWeight]}
              onValueChange={(value) => handleSettingsChange(null, 'engagementWeight', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex justify-between">
              <span>Growth Rate Weight</span>
              <span className="text-sm text-muted-foreground">{settings.growthRateWeight.toFixed(1)}</span>
            </label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[settings.growthRateWeight]}
              onValueChange={(value) => handleSettingsChange(null, 'growthRateWeight', value[0])}
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex justify-between">
              <span>User Feedback Weight</span>
              <span className="text-sm text-muted-foreground">{settings.userFeedbackWeight.toFixed(1)}</span>
            </label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[settings.userFeedbackWeight]}
              onValueChange={(value) => handleSettingsChange(null, 'userFeedbackWeight', value[0])}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Feature-Specific Weights</CardTitle>
          <CardDescription>Configure how much each feature contributes to the template analysis</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(settings.featureSpecificWeights).map(([feature, weight]) => (
            <div key={feature} className="space-y-2">
              <label className="flex justify-between">
                <span>{feature.charAt(0).toUpperCase() + feature.slice(1)} Weight</span>
                <span className="text-sm text-muted-foreground">{weight.toFixed(1)}</span>
              </label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[weight]}
                onValueChange={(value) => handleSettingsChange('featureSpecificWeights', feature, value[0])}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
} 