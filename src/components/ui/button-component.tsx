/**
 * Button Component Re-export
 * 
 * This file re-exports the Button component from the Button implementation.
 * This ensures consistent behavior and allows for easier refactoring if needed.
 */

"use client";

import { Button, buttonVariants } from './button';

export { Button, buttonVariants };

// Also export as default for dynamic imports
export default { Button, buttonVariants }; 