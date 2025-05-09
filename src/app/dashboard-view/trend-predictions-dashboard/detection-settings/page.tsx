'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Save, BarChart2, Settings, Sliders, LineChart, PercentIcon } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Slider, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ui-compatibility';
import { useToast } from '@/components/ui/use-toast';

export default function TrendDetectionSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for detection settings
  const [settings, setSettings] = useState({
    earlyDetectionThreshold: 0.35,
    minimumGrowthRate: 15,
    analysisPeriod: '7d',
    detectUnusualPatterns: true,
    confidenceThreshold: 0.6,
    maxDaysUntilPeak: 30,
    categoryWeights: {
      product: 1.0,
      fashion: 1.2,
      food: 0.9,
      dance: 1.3,
      travel: 0.8
    }
  });

  // Handle settings change
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle category weight change
  const handleCategoryWeightChange = (category: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      categoryWeights: {
        ...prev.categoryWeights,
        [category]: value
      }
    }));
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real implementation, this would save to API
    toast({
      title: "Settings Saved",
      description: "Your trend detection settings have been updated.",
      duration: 3000
    });
  };

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push('/dashboard-view/trend-predictions-dashboard')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Trend Detection Settings</h1>
        </div>
        
        <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
      
      <p className="text-gray-500 mb-8">
        Configure how the system identifies early-stage trending templates and unusual growth patterns.
        These settings affect the sensitivity and accuracy of trend predictions.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Early Detection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Early Detection Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="earlyDetectionThreshold">Early Detection Threshold</Label>
                <span className="text-sm font-medium">{Math.round(settings.earlyDetectionThreshold * 100)}%</span>
              </div>
              <Slider 
                id="earlyDetectionThreshold"
                min={0.05}
                max={0.75}
                step={0.05}
                value={[settings.earlyDetectionThreshold]}
                onValueChange={([value]) => handleSettingChange('earlyDetectionThreshold', value)}
              />
              <p className="text-xs text-gray-500">
                Lower values increase sensitivity but may lead to more false positives.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="minimumGrowthRate">Minimum Growth Rate (%/day)</Label>
                <span className="text-sm font-medium">{settings.minimumGrowthRate}%</span>
              </div>
              <Slider 
                id="minimumGrowthRate"
                min={1}
                max={50}
                step={1}
                value={[settings.minimumGrowthRate]}
                onValueChange={([value]) => handleSettingChange('minimumGrowthRate', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="analysisPeriod">Analysis Period</Label>
              <Select
                value={settings.analysisPeriod}
                onValueChange={(value) => handleSettingChange('analysisPeriod', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 day</SelectItem>
                  <SelectItem value="3d">3 days</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="14d">14 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="detectUnusualPatterns">Detect Unusual Patterns</Label>
              <Switch 
                id="detectUnusualPatterns" 
                checked={settings.detectUnusualPatterns}
                onCheckedChange={(checked) => handleSettingChange('detectUnusualPatterns', checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Prediction Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-purple-600" />
              Prediction Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="confidenceThreshold">Minimum Confidence Threshold</Label>
                <span className="text-sm font-medium">{Math.round(settings.confidenceThreshold * 100)}%</span>
              </div>
              <Slider 
                id="confidenceThreshold"
                min={0.1}
                max={0.9}
                step={0.05}
                value={[settings.confidenceThreshold]}
                onValueChange={([value]) => handleSettingChange('confidenceThreshold', value)}
              />
              <p className="text-xs text-gray-500">
                Predictions below this confidence won't be shown.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="maxDaysUntilPeak">Maximum Days Until Peak</Label>
                <span className="text-sm font-medium">{settings.maxDaysUntilPeak} days</span>
              </div>
              <Slider 
                id="maxDaysUntilPeak"
                min={7}
                max={60}
                step={1}
                value={[settings.maxDaysUntilPeak]}
                onValueChange={([value]) => handleSettingChange('maxDaysUntilPeak', value)}
              />
            </div>
            
            <div className="pt-2 border-t">
              <h3 className="text-sm font-medium mb-3">Category Weight Multipliers</h3>
              
              {Object.entries(settings.categoryWeights).map(([category, weight]) => (
                <div key={category} className="flex items-center mb-2">
                  <Label className="w-24 text-sm capitalize">{category}</Label>
                  <Slider 
                    className="flex-1 mx-3"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={[weight]}
                    onValueChange={([value]) => handleCategoryWeightChange(category, value)}
                  />
                  <span className="w-12 text-sm text-right">{weight.toFixed(1)}x</span>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">
                Adjust how different content categories are weighted in the prediction model.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 