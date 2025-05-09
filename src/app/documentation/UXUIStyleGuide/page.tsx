'use client';

import React from 'react';
import Link from 'next/link';

export default function UXUIStyleGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trendzo UX/UI Style Guide</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Version 1.0.0 - Last updated: July 15, 2023
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" id="design-principles">Design Principles</h2>
          
          <p className="mb-4">
            The Trendzo platform follows these core design principles to ensure a consistent, 
            high-quality user experience:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Clarity First</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Design for clarity over decoration. Elements should be immediately 
                recognizable and their function should be obvious.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-medium mb-2 text-purple-600 dark:text-purple-400">Progressive Disclosure</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Reveal information progressively to reduce cognitive load. Show only what 
                users need at each step of their journey.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-medium mb-2 text-green-600 dark:text-green-400">Consistent Patterns</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Use consistent interaction patterns throughout the application to build 
                user confidence and reduce learning curves.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-medium mb-2 text-amber-600 dark:text-amber-400">Performance as Design</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Treat performance as a core design feature. Responsive UI is essential 
                to a good user experience.
              </p>
            </div>
          </div>
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" id="performance-guidelines">Performance Guidelines</h2>
          
          <p className="mb-4">
            Performance is a fundamental aspect of good UX/UI design. Follow these guidelines 
            to ensure optimal performance:
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Perceived Performance</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use skeleton loaders that match the shape of the expected content</li>
            <li>Implement optimistic UI updates for actions that typically succeed</li>
            <li>Provide immediate feedback for user actions, even if processing continues in the background</li>
            <li>Load critical content first, then progressively enhance the page</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Core Web Vitals Targets</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse table-auto">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Metric</th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Target</th>
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">LCP</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">&lt; 2.5s</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Largest Contentful Paint - time for main content to load</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">FID</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">&lt; 100ms</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">First Input Delay - time until the page responds to user interaction</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">CLS</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">&lt; 0.1</td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">Cumulative Layout Shift - stability of page elements as it loads</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" id="animation-system">Animation System</h2>
          
          <p className="mb-4">
            Animations in Trendzo add both delight and functional context to the user experience.
            All animations should follow these guidelines:
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Animation Principles</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Purpose:</strong> Every animation should serve a purpose (directing attention, providing feedback, etc.)</li>
            <li><strong>Subtlety:</strong> Animations should be subtle and not distract from the content</li>
            <li><strong>Consistency:</strong> Similar actions should have similar animations</li>
            <li><strong>Performance:</strong> Animations should maintain 60fps and not cause layout shifts</li>
            <li><strong>Accessibility:</strong> All animations must respect reduced motion preferences</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Standard Animation Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2">Fade</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">For subtle transitions between states</p>
              <div className="text-xs">
                <code>Duration: 200-300ms</code><br />
                <code>Easing: ease-in-out</code>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2">Slide</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">For elements entering from off-screen</p>
              <div className="text-xs">
                <code>Duration: 300-400ms</code><br />
                <code>Easing: cubic-bezier(0.4, 0, 0.2, 1)</code>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2">Scale</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">For emphasizing elements or modals</p>
              <div className="text-xs">
                <code>Duration: 200-250ms</code><br />
                <code>Easing: cubic-bezier(0.18, 0.89, 0.32, 1.28)</code>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2">Bounce</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">For playful feedback or attention</p>
              <div className="text-xs">
                <code>Duration: 500-800ms</code><br />
                <code>Easing: spring(mass: 1, stiffness: 80, damping: 10)</code>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Example Implementation</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { useOptimizedAnimation } from '@/lib/hooks/useOptimizedAnimation';
import { motion } from 'framer-motion';

function FeedbackMessage({ isVisible, message, type = 'info' }) {
  const { motionProps, play, reset } = useOptimizedAnimation({
    type: type === 'error' ? 'bounce' : 'fade',
    duration: 300,
    delay: 0.1,
    useGPU: true
  });
  
  useEffect(() => {
    if (isVisible) {
      play();
    } else {
      reset();
    }
  }, [isVisible, play, reset]);
  
  return (
    <motion.div
      {...motionProps}
      className={\`p-4 rounded \${type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}\`}
    >
      {message}
    </motion.div>
  );
}`}
            </pre>
          </div>
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" id="component-guidelines">Component Guidelines</h2>
          
          <p className="mb-4">
            Trendzo components should follow these guidelines for consistency and usability:
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Buttons</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use verb labels that clearly describe the action (e.g., "Save Changes" instead of "Submit")</li>
            <li>Maintain consistent button styling based on importance:</li>
            <ul className="list-disc pl-5 mt-1">
              <li>Primary: Filled, high contrast for main actions</li>
              <li>Secondary: Outlined or subdued for alternative actions</li>
              <li>Tertiary: Text-only for least important actions</li>
            </ul>
            <li>Provide visual feedback on hover, focus, active, and disabled states</li>
            <li>Ensure sufficient touch target size (minimum 44×44px) for mobile</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Forms</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Place labels above input fields for improved scanability</li>
            <li>Use explicit error messages with suggested fixes</li>
            <li>Show validation feedback in real-time when possible</li>
            <li>Group related fields together logically</li>
            <li>Preserve user input when errors occur</li>
            <li>Use appropriate input types for data (date pickers, sliders, etc.)</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Cards</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Maintain consistent padding and spacing within cards</li>
            <li>Use subtle shadows to create visual hierarchy</li>
            <li>Ensure the entire card is clickable if it represents a single action</li>
            <li>Include clear visual cues for interactive elements within cards</li>
            <li>Keep content concise with a clear hierarchy</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Modals and Dialogs</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use modals sparingly for important interruptions or focused tasks</li>
            <li>Provide a clear title that describes the purpose</li>
            <li>Always include a way to dismiss the modal (close button, cancel, etc.)</li>
            <li>Trap focus within the modal for keyboard users</li>
            <li>Close modals when clicking outside or pressing Escape key</li>
          </ul>
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" id="interaction-patterns">Interaction Patterns</h2>
          
          <p className="mb-4">
            Consistent interaction patterns provide familiarity and improve usability:
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Navigation</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Maintain consistent global navigation across all pages</li>
            <li>Provide clear visual indication of current location</li>
            <li>Use breadcrumbs for deep hierarchical navigation</li>
            <li>Enable keyboard navigation with proper focus management</li>
            <li>Implement responsive navigation patterns for different screen sizes</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Selection & Filtering</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use checkboxes for multiple selection</li>
            <li>Use radio buttons for mutually exclusive options</li>
            <li>Provide clear filter indicators with counts when possible</li>
            <li>Show applied filters with the ability to remove individually</li>
            <li>Allow bulk selection and actions for efficiency</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Data Tables</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Support sorting by clicking column headers with clear indicators</li>
            <li>Enable pagination with options for items per page</li>
            <li>Implement responsive strategies for small screens (horizontal scroll, card view, etc.)</li>
            <li>Highlight rows on hover for improved scanability</li>
            <li>Provide empty and loading states with appropriate feedback</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Drag and Drop</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide clear visual affordances for draggable items</li>
            <li>Show feedback during drag operations (cursor change, ghost element)</li>
            <li>Highlight valid drop targets during drag</li>
            <li>Ensure keyboard alternatives for drag and drop operations</li>
            <li>Provide undo functionality for accidental drops</li>
          </ul>
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4" id="accessibility-guidelines">Accessibility Guidelines</h2>
          
          <p className="mb-4">
            Trendzo is committed to WCAG 2.1 AA compliance. Follow these guidelines:
          </p>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Keyboard Navigation</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ensure all interactive elements are keyboard accessible</li>
            <li>Maintain a logical tab order that follows visual flow</li>
            <li>Provide visible focus indicators for all interactive elements</li>
            <li>Implement focus trapping for modals and dialogs</li>
            <li>Support standard keyboard shortcuts and patterns</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Screen Readers</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use semantic HTML elements appropriately</li>
            <li>Provide alternative text for all non-decorative images</li>
            <li>Implement ARIA landmarks, roles, and attributes when needed</li>
            <li>Announce dynamic content changes with aria-live regions</li>
            <li>Ensure form inputs have associated labels</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Visual Design</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Maintain color contrast ratios of at least 4.5:1 for normal text and 3:1 for large text</li>
            <li>Don't rely solely on color to convey information</li>
            <li>Support text resizing up to 200% without loss of functionality</li>
            <li>Provide sufficient spacing between interactive elements</li>
            <li>Design for various zoom levels and screen magnification</li>
          </ul>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Motion & Animation</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Respect prefers-reduced-motion user setting</li>
            <li>Avoid animations that flash or flicker</li>
            <li>Provide alternatives to motion-based interactions</li>
            <li>Ensure animations don't block access to content</li>
            <li>Allow users to pause, stop, or hide animations longer than 5 seconds</li>
          </ul>
        </section>
        
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Additional Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/documentation/ComponentOptimizationGuide" className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <h3 className="text-lg font-medium mb-1">Component Optimization Guide</h3>
              <p className="text-sm">Practical strategies for optimizing React components</p>
            </Link>
            
            <Link href="/documentation/PerformanceChecklist" className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <h3 className="text-lg font-medium mb-1">Performance Checklist</h3>
              <p className="text-sm">Pre-deployment verification for optimal performance</p>
            </Link>
            
            <Link href="/documentation/optimization-demo" className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <h3 className="text-lg font-medium mb-1">Optimization Demo</h3>
              <p className="text-sm">Interactive examples of optimization techniques</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 