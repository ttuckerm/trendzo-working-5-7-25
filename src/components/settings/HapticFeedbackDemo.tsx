"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Vibrate } from 'lucide-react';

export function HapticFeedbackDemo() {
  return (
    <Card className="w-full max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vibrate className="h-5 w-5" />
          Haptic Feedback (Coming Soon)
        </CardTitle>
        <CardDescription>
          This feature is currently under development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center py-6">
        <p className="text-muted-foreground">
          Haptic feedback options will be available in a future update.
        </p>
      </CardContent>
    </Card>
  );
}

export default HapticFeedbackDemo; 