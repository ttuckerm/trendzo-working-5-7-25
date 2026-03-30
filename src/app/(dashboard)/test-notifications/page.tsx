'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { addTestNotifications, makeUserExpert } from '@/lib/utils/test-data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CustomUser, isExpertUser } from '@/lib/types/user';

export default function TestNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expertLoading, setExpertLoading] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false);

  // Initialize expert mode state from user data
  useEffect(() => {
    if (user) {
      setIsExpertMode(isExpertUser(user));
    }
  }, [user]);

  const handleAddTestData = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await addTestNotifications(user.email);
      toast({
        title: 'Success',
        description: 'Test notifications have been added successfully',
      });
    } catch (error) {
      console.error('Error adding test notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to add test notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpertToggle = async (checked: boolean) => {
    if (!user?.email) return;

    setExpertLoading(true);
    try {
      await makeUserExpert(user.email);
      setIsExpertMode(checked);
      toast({
        title: 'Success',
        description: 'Expert status updated successfully. Please refresh the page.',
      });
    } catch (error) {
      console.error('Error updating expert status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expert status',
        variant: 'destructive',
      });
    } finally {
      setExpertLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Please sign in to access this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Use this page to add test notifications to your account.
            This will create both regular and expert notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-lg bg-yellow-50 p-4">
              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
              <p className="mt-1 text-sm text-yellow-700">
                This is for testing purposes only. The notifications will be added to your account
                and will appear in your notifications list.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="expert-mode" className="flex items-center gap-2">
                  Expert Mode
                  <span className="text-xs text-gray-500">
                    Toggle expert access for testing
                  </span>
                </Label>
                <Switch
                  id="expert-mode"
                  checked={isExpertMode}
                  disabled={expertLoading}
                  onCheckedChange={handleExpertToggle}
                />
              </div>

              <Button
                onClick={handleAddTestData}
                disabled={loading}
              >
                {loading ? 'Adding Test Data...' : 'Add Test Notifications'}
              </Button>
            </div>

            <div>
              <h3 className="font-medium mb-2">What will be added:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>2 Regular notifications (1 unread, 1 read)</li>
                <li>3 Expert notifications (2 pending, 1 reviewed)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 