"use client";

/**
 * Unified Card Component
 * 
 * This component provides a stable API for card components across the application,
 * resolving the import issues by creating a single unified interface.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { resolveComponents } from '@/lib/utils/import-resolver';

// Try to import from the individual component files, but fall back if they don't exist
let Card: React.FC<React.HTMLAttributes<HTMLDivElement>>;
let CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
let CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
let CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
let CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
let CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;

try {
  // First try to load from card-component
  const module = require('./card-component');
  ({ Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } = module);
} catch (error) {
  // If that fails, create simple implementations
  Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  );
  
  CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  );
  
  CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  );
  
  CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
  
  CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
  );
  
  CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  );
}

// Resolve components to ensure they work
const {
  Card: ResolvedCard,
  CardHeader: ResolvedCardHeader,
  CardTitle: ResolvedCardTitle,
  CardDescription: ResolvedCardDescription,
  CardContent: ResolvedCardContent,
  CardFooter: ResolvedCardFooter
} = resolveComponents({
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
});

// Export all components
export {
  ResolvedCard as Card,
  ResolvedCardHeader as CardHeader,
  ResolvedCardTitle as CardTitle,
  ResolvedCardDescription as CardDescription,
  ResolvedCardContent as CardContent,
  ResolvedCardFooter as CardFooter
};

// Export default object with all components
export default {
  Card: ResolvedCard,
  CardHeader: ResolvedCardHeader,
  CardTitle: ResolvedCardTitle,
  CardDescription: ResolvedCardDescription,
  CardContent: ResolvedCardContent,
  CardFooter: ResolvedCardFooter
}; 