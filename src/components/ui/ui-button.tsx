"use client";

/**
 * Button Component Wrapper
 * 
 * This is a compatibility layer that ensures Button imports work consistently
 * It re-exports the Button component from the unified-button.tsx file
 */

import { Button } from './unified-button';

export { Button };

// Also export as default for dynamic imports
export default { Button }; 