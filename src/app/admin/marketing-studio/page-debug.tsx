'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export default function MarketingStudioDebugPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        {/* Simple Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Marketing Studio - Debug Mode</h1>
              <p className="text-sm text-muted-foreground">Testing basic functionality</p>
            </div>
            <Badge variant="outline" className="ml-auto">
              Debug Version
            </Badge>
          </div>
        </Card>

        {/* Test Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Test</h2>
            <p className="text-sm text-muted-foreground mb-4">
              If you can see this, the basic page structure is working.
            </p>
            <Button className="w-full">
              Test Button
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Component Status</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Basic UI Components: Working</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Lucide Icons: Working</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">TailwindCSS: Working</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Next Steps</h2>
            <ol className="text-sm space-y-1">
              <li>1. Verify this page loads without errors</li>
              <li>2. Test importing enhanced components one by one</li>
              <li>3. Check browser console for specific error messages</li>
              <li>4. Gradually restore full functionality</li>
            </ol>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Error Debugging</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Common Issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Missing UI component imports</li>
                <li>Framer Motion import issues</li>
                <li>Service import circular dependencies</li>
                <li>TypeScript compilation errors</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}