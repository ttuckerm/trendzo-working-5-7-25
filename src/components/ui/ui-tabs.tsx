"use client";

/**
 * Tabs Component Wrapper
 * 
 * This is a compatibility layer that ensures Tabs imports work consistently
 * It re-exports the Tabs components from the base tabs.tsx file
 */

import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

export { Tabs, TabsList, TabsTrigger, TabsContent };
export default {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
}; 