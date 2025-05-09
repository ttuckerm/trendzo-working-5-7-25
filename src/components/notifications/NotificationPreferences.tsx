'use client';

import { useState, useEffect } from 'react';
import { Bell, Settings, TrendingUp, UserCog, BarChart2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/unified-card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';

interface NotificationSettings {
  trendAlerts: boolean;
  expertVerifications: boolean;
  marketUpdates: boolean;
  systemAnnouncements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    trendAlerts: true,
    expertVerifications: true,
    marketUpdates: true,
    systemAnnouncements: true,
    emailNotifications: true,
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.email || !db) return;
      
      try {
        const userDocRef = doc(db as Firestore, 'users', user.email);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().notificationSettings) {
          setSettings(userDoc.data().notificationSettings);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user?.email]);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!user?.email || !db) return;

    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const userDocRef = doc(db as Firestore, 'users', user.email);
      await setDoc(userDocRef, {
        notificationSettings: newSettings
      }, { merge: true });

      toast({
        title: 'Settings updated',
        description: 'Your notification preferences have been saved.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading preferences...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Customize how and when you want to receive notifications
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-gray-900">Notification Types</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="trendAlerts" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Trend Alerts
                <span className="text-xs text-gray-500">
                  Get notified about new trending templates and patterns
                </span>
              </Label>
              <Switch
                id="trendAlerts"
                checked={settings.trendAlerts}
                onCheckedChange={(checked) => updateSetting('trendAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="expertVerifications" className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-purple-500" />
                Expert Verifications
                <span className="text-xs text-gray-500">
                  Notifications when experts verify trend predictions
                </span>
              </Label>
              <Switch
                id="expertVerifications"
                checked={settings.expertVerifications}
                onCheckedChange={(checked) => updateSetting('expertVerifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="marketUpdates" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-green-500" />
                Market Updates
                <span className="text-xs text-gray-500">
                  Regular updates about market trends and analytics
                </span>
              </Label>
              <Switch
                id="marketUpdates"
                checked={settings.marketUpdates}
                onCheckedChange={(checked) => updateSetting('marketUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="systemAnnouncements" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                System Announcements
                <span className="text-xs text-gray-500">
                  Important system updates and announcements
                </span>
              </Label>
              <Switch
                id="systemAnnouncements"
                checked={settings.systemAnnouncements}
                onCheckedChange={(checked) => updateSetting('systemAnnouncements', checked)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sm text-gray-900">Delivery Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="flex items-center gap-2">
                Email Notifications
                <span className="text-xs text-gray-500">
                  Receive notifications via email
                </span>
              </Label>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pushNotifications" className="flex items-center gap-2">
                Push Notifications
                <span className="text-xs text-gray-500">
                  Receive notifications in your browser
                </span>
              </Label>
              <Switch
                id="pushNotifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 