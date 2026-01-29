"use client";

// This script helps fix styling issues by ensuring tailwind classes are properly applied
export function fixStyles() {
  // Fix for Radix UI components
  if (typeof document !== "undefined") {
    // Add Tailwind classes to root
    document.documentElement.classList.add('h-full', 'antialiased');
    document.body.classList.add('h-full', 'bg-gray-50');
    
    // Fix UI layout issues if needed
    const tryFixUILayouts = () => {
      // Fix for sidebar styling
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        sidebar.classList.add('shadow-md');
      }
      
      // Fix for navigation items
      const navItems = document.querySelectorAll('li');
      navItems.forEach(item => {
        if (!item.className.includes('list-none')) {
          item.classList.add('list-none');
        }
      });
    };
    
    // Run the fix initially and on any DOM changes
    tryFixUILayouts();
    
    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(tryFixUILayouts);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      // Clean up the observer when the component unmounts
      observer.disconnect();
    };
  }
} 