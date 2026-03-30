'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { ExpertNotificationDashboard } from '@/components/notifications/ExpertNotificationDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/unified-card';

export default function NotificationsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold mb-4">Access Denied</h1>
        <p className="text-gray-600">
          Please sign in to access notification settings.
        </p>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {user.isExpert && (
            <TabsTrigger value="expert-dashboard">Expert Dashboard</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>

        {user.isExpert && (
          <TabsContent value="expert-dashboard">
            <ExpertNotificationDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 