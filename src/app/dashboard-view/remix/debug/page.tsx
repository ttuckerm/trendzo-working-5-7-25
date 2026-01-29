'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card-component';
import { ArrowLeft, Bug, ExternalLink } from 'lucide-react';

/**
 * Debug page for Template Remix feature
 * Shows the routing structure and navigation options
 */
export default function RemixDebugPage() {
  const [routes, setRoutes] = useState<string[]>([]);
  
  useEffect(() => {
    // Generate a list of all available remix routes
    const availableRoutes = [
      '/dashboard-view/remix',
      '/dashboard-view/remix/template-1',
      '/dashboard-view/remix/template-2',
      '/dashboard-view/remix/template-3',
      '/dashboard-view/remix/template-4',
      '/dashboard-view/remix/go',
      '/dashboard-view/templates',
      '/templates',
      '/dashboard-view',
      '/dashboard',
    ];
    
    setRoutes(availableRoutes);
  }, []);
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard-view/remix">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Remix Hub
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="mr-2 h-5 w-5" />
            Template Remix Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This page helps debug the Template Remix feature by showing available routes and navigation options.</p>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Available Routes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {routes.map((route, index) => (
                <Link href={route} key={index} className="block">
                  <div className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
                    <span className="flex-1 font-mono text-sm">{route}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Environment Info</h3>
            <div className="p-4 bg-gray-50 rounded-md">
              <pre className="text-xs overflow-auto">
                {`Next.js version: 14.2.7
Environment: ${process.env.NODE_ENV}
Base Path: ${process.env.NEXT_PUBLIC_BASE_PATH || '/'}
App directory in use: Yes
`}
              </pre>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">This page is only available in development mode.</p>
        </CardFooter>
      </Card>
    </div>
  );
} 