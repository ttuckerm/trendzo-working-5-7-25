import React from 'react';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnimationSettingsPage() {
  return (
    <div className="container max-w-4xl py-12 px-4">
      <div className="mb-8">
        <Link href="/settings">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Animation Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize how animations behave in the app
        </p>
      </div>
      
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Animation Settings
          </CardTitle>
          <CardDescription>
            Animation settings are currently under development. Check back soon!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground py-6">
            Our team is working on implementing advanced animation controls for a better user experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 