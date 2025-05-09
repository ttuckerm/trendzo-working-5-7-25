'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

function DocumentationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Function for navigation using the Next.js router
  const navigateTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[Documentation] Navigating to:', path);
    router.push(path);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Documentation Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm overflow-y-auto transition-transform duration-300 md:translate-x-0">
        <div className="p-6">
          <a 
            href="/documentation" 
            onClick={navigateTo('/documentation')}
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Documentation
          </a>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Performance Optimization Framework
          </p>
        </div>
        
        <nav className="px-4 py-2">
          <ul className="space-y-2">
            <li>
              <a 
                href="/documentation" 
                onClick={navigateTo('/documentation')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  pathname === '/documentation' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Documentation Home
              </a>
            </li>
            <li>
              <a 
                href="/documentation/ComponentOptimizationGuide" 
                onClick={navigateTo('/documentation/ComponentOptimizationGuide')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  pathname === '/documentation/ComponentOptimizationGuide' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Component Optimization Guide
              </a>
            </li>
            <li>
              <a 
                href="/documentation/UXUIStyleGuide" 
                onClick={navigateTo('/documentation/UXUIStyleGuide')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  pathname === '/documentation/UXUIStyleGuide' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                UX/UI Style Guide
              </a>
            </li>
            <li>
              <a 
                href="/documentation/PerformanceChecklist" 
                onClick={navigateTo('/documentation/PerformanceChecklist')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  pathname === '/documentation/PerformanceChecklist' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Performance Checklist
              </a>
            </li>
            <li>
              <a 
                href="/documentation/optimization-demo" 
                onClick={navigateTo('/documentation/optimization-demo')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  pathname === '/documentation/optimization-demo' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                Optimization Demo
              </a>
            </li>
          </ul>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Utilities & Hooks
            </h3>
            <ul className="mt-2 space-y-1">
              <li>
                <a 
                  href="/documentation#performance-tracking" 
                  onClick={navigateTo('/documentation#performance-tracking')}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Performance Tracking
                </a>
              </li>
              <li>
                <a 
                  href="/documentation#animation-optimization" 
                  onClick={navigateTo('/documentation#animation-optimization')}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Animation Optimization
                </a>
              </li>
              <li>
                <a 
                  href="/documentation#data-fetching" 
                  onClick={navigateTo('/documentation#data-fetching')}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Data Fetching
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4">
        <div className="mx-auto max-w-4xl py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DocumentationLayout; 