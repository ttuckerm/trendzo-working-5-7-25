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
    { name: 'Templates', href: '/admin/templates' },
    { name: 'Newsletter', href: '/admin/newsletter' },
    { name: 'Test Newsletter', href: '/test-newsletter' },
    { name: 'ETL Dashboard', href: '/admin/etl-dashboard' },
    { name: 'ETL Status', href: '/admin/etl-status' },
    { name: 'Impact Analysis', href: '/impact-analysis' },
    { name: 'Users', href: '/admin/users' },
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