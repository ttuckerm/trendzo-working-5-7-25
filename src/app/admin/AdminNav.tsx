'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

const AdminNav = () => {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  
  if (!user || !isAdmin) {
    return null;
  }
  
  const navItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Control Center', href: '/admin/control-center' },
    { name: 'Calibration Lab', href: '/admin/calibration' },
    { name: 'Agent', href: '/admin/agent' },
    { name: 'Integration Status', href: '/api/admin/integration/status' },
    { name: 'Viral Prediction Hub', href: '/admin/viral-prediction-hub' },
    { name: 'Baselines', href: '/admin/baselines' },
    { name: 'Validation', href: '/admin/validation' },
    { name: 'Creator Studio', href: '/admin/studio' },
    { name: 'Viral Recipe Book', href: '/admin/viral-recipe-book' },
    { name: 'System Map', href: '/admin/system-map' },
    { name: 'ApifyScraper', href: '/admin/apify-scraper' },
    { name: 'FeatureDecomposer', href: '/admin/feature-decomposer' },
    { name: 'GeneTagger', href: '/admin/gene-tagger' },
    { name: 'Newsletter', href: '/admin/newsletter' },
    { name: 'ETL Dashboard', href: '/admin/etl-dashboard' },
    { name: 'ETL Status', href: '/admin/etl-status' },
    { name: 'Impact Analysis', href: '/impact-analysis' },
    { name: 'Process Intel', href: '/admin/process-intel' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Marketing', href: '/admin/marketing-inception' },
    { name: 'Keys', href: '/admin/keys' },
    { name: 'Settings', href: '/admin/settings' },
  ];
  
  return (
    <div className="bg-white text-gray-800 border-b border-gray-200">
      <div className="container mx-auto px-4 overflow-x-auto">
        <div className="flex justify-between items-center py-3">
          <h1 className="text-xl font-bold whitespace-nowrap">Admin Panel</h1>
          
          <nav className="flex space-x-2 md:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminNav; 