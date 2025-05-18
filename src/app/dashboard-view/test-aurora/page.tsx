'use client';

import { AuroraText } from "@/registry/magicui/aurora-text";

export function AuroraTextDemo() {
  return (
    <h1 className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
      Your <AuroraText colors={["#4F46E5", "#06B6D4", "#8B5CF6", "#3B82F6", "#10B981"]}>Dashboard</AuroraText>
    </h1>
  );
}

export default function TestAuroraPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8 items-center">
        <AuroraTextDemo />
        
        <div className="mt-10 p-6 rounded-lg bg-gray-100 dark:bg-gray-800 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">AuroraText Component Test</h2>
          <p className="mb-6">
            This page demonstrates the <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">AuroraText</code> component 
            with a beautiful animated gradient.
          </p>
          
          <h3 className="text-xl font-medium mb-2">Examples:</h3>
          <div className="space-y-8">
            <div>
              <p className="text-3xl">
                Ship <AuroraText colors={["#4C63B6", "#2D87C3", "#1E9BD1", "#0FBBDF", "#00D4F5"]}>beautiful</AuroraText>
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Welcome to <AuroraText className="font-extrabold" colors={["#8B5CF6", "#6366F1", "#3B82F6", "#0EA5E9", "#06B6D4"]}>Trendzo</AuroraText>
              </h3>
            </div>
            
            <div>
              <p className="text-2xl">
                Your <AuroraText colors={["#EC4899", "#D946EF", "#8B5CF6", "#6366F1"]} speed={1.5}>dashboard metrics</AuroraText> are now available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 