"use client";

/**
 * Card Component Re-exports
 * 
 * This file re-exports card components from our unified implementation
 * to ensure consistent behavior regardless of import path.
 */

import CardComponents, {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from './unified-card';

// Export all components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};

// Also export as default object
export default CardComponents; 