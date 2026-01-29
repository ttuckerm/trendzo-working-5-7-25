'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Save, Mail, Globe, Smartphone, Clock, AlertCircle } from 'lucide-react';
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Label,
  Switch,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Input,
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from '@/components/ui/ui-compatibility';
import { useToast } from '@/components/ui/use-toast';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for notification settings
  const [settings, setSettings] = useState({
    enableNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    
    // Notification types
    notifyOnNewTrend: true,
    notifyOnHighConfidence: true,
    notifyOnTrendingInCategory: true,
    notifyOnPredictionChanges: true,
    
    // Frequency
    notificationFrequency: 'daily',
    
    // Categories of interest
    categories: ['product', 'fashion', 'dance'],
    
    // Confidence threshold
    confidenceThreshold: 'medium',
    
    // Email settings
    email: 'user@example.com',
    emailDigest: true
  });

  // Handle settings change
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real implementation, this would save to API
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated.",
      duration: 3000
    });
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSettings(prev => {
      const categories = [...prev.categories];
      
      if (categories.includes(category)) {
        return {
          ...prev,
          categories: categories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          categories: [...categories, category]
        };
      }
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
          <h1 className="text-2xl font-bold">Notification Settings</h1>
        </div>
        
        <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
      
      <p className="text-gray-500 mb-8">
        Configure when and how you receive alerts about new trend predictions and changes to existing ones.
      </p>
      
      <div className="space-y-6">
        {/* Main notification toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-600" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Select how you want to receive trend prediction notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <Label htmlFor="enableNotifications">Enable All Notifications</Label>
              </div>
              <Switch 
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                id="enableNotifications"
              />
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                </div>
                <Switch 
                  checked={settings.emailNotifications && settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  id="emailNotifications"
                  disabled={!settings.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="pushNotifications">Push Notifications</Label>
                </div>
                <Switch 
                  checked={settings.pushNotifications && settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  id="pushNotifications"
                  disabled={!settings.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="inAppNotifications">In-App Notifications</Label>
                </div>
                <Switch 
                  checked={settings.inAppNotifications && settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('inAppNotifications', checked)}
                  id="inAppNotifications"
                  disabled={!settings.enableNotifications}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notification types and frequency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnNewTrend">New Trend Detected</Label>
                <Switch 
                  checked={settings.notifyOnNewTrend && settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifyOnNewTrend', checked)}
                  id="notifyOnNewTrend"
                  disabled={!settings.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnHighConfidence">High Confidence Predictions</Label>
                <Switch 
                  checked={settings.notifyOnHighConfidence && settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifyOnHighConfidence', checked)}
                  id="notifyOnHighConfidence"
                  disabled={!settings.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnTrendingInCategory">Trending in Selected Categories</Label>
                <Switch 
                  checked={settings.notifyOnTrendingInCategory && settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifyOnTrendingInCategory', checked)}
                  id="notifyOnTrendingInCategory"
                  disabled={!settings.enableNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notifyOnPredictionChanges">Prediction Changes/Updates</Label>
                <Switch 
                  checked={settings.notifyOnPredictionChanges && settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('notifyOnPredictionChanges', checked)}
                  id="notifyOnPredictionChanges"
                  disabled={!settings.enableNotifications}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                Notification Frequency & Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notificationFrequency">Frequency</Label>
                <Select
                  value={settings.notificationFrequency}
                  onValueChange={(value) => handleSettingChange('notificationFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly digest</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
                {!settings.enableNotifications && <p className="text-xs text-gray-500 mt-1">Enable notifications to change this setting</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">Minimum Confidence Level</Label>
                <Select
                  value={settings.confidenceThreshold}
                  onValueChange={(value) => handleSettingChange('confidenceThreshold', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select confidence threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (40%+)</SelectItem>
                    <SelectItem value="medium">Medium (60%+)</SelectItem>
                    <SelectItem value="high">High (80%+)</SelectItem>
                    <SelectItem value="veryhigh">Very High (90%+)</SelectItem>
                  </SelectContent>
                </Select>
                {!settings.enableNotifications && <p className="text-xs text-gray-500 mt-1">Enable notifications to change this setting</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Categories of Interest</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                  {['product', 'fashion', 'food', 'dance', 'travel', 'lifestyle'].map(category => (
                    <Button
                      key={category}
                      variant={settings.categories.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(category)}
                      disabled={!settings.enableNotifications}
                      className={settings.categories.includes(category) ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 