/**
 * This file provides functions to fix styling issues in the dashboard
 * It handles component styling and ensures proper rendering
 */

// Apply any necessary style fixes for dashboard components
export function fixStyles() {
  // Only run in client side
  if (typeof window === 'undefined') return;
  
  // Set up MutationObserver to fix any dynamically added elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Fix any recharts containers that are added dynamically
        const containers = document.querySelectorAll('.recharts-responsive-container');
        containers.forEach((container) => {
          if (container instanceof HTMLElement) {
            container.style.width = '100%';
            if (container.clientHeight < 200) {
              container.style.minHeight = '200px';
            }
          }
        });
        
        // Fix any tab content visibility issues
        const tabsContent = document.querySelectorAll('[role="tabpanel"]');
        tabsContent.forEach((content) => {
          if (content instanceof HTMLElement && content.style.display === 'none') {
            content.style.display = 'block';
          }
        });
      }
    });
  });
  
  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Return cleanup function
  return () => {
    observer.disconnect();
  };
} 