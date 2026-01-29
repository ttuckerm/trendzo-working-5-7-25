"use client";

import React, { useState } from 'react';
import AdminProtectionWrapper from '../AdminProtectionWrapper';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminHeader from './SuperAdminHeader';
import MatrixBackground from './MatrixBackground';
import JarvisInterface from './JarvisInterface';
import SystemAlertsDisplay from '@/components/admin/SystemAlertsDisplay';
import { GlobalBrainProvider } from '@/contexts/GlobalBrainContext';
// Floating chat + trigger now mounted globally at root
import { FloatingBrainChat } from '@/components/admin/FloatingBrainChat';
import styles from './super-admin.module.css';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <GlobalBrainProvider>
      <div className={styles.superAdminCenter}>
        <MatrixBackground />
        <AdminProtectionWrapper>
          <SuperAdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className={styles.adminMain}>
            <SuperAdminHeader />
            
            <div className={styles.adminContent}>
              {children}
            </div>
          </div>
        </AdminProtectionWrapper>
        <JarvisInterface />
        <SystemAlertsDisplay />
        
        {/* Global Floating Brain Chat (already provided at root too) */}
        <FloatingBrainChat />
      </div>
    </GlobalBrainProvider>
  );
}