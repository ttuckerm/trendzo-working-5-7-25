"use client";

import { useState } from "react";
import AdminProtectionWrapper from "./AdminProtectionWrapper";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import "./admin.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <AdminProtectionWrapper>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header */}
            <AdminHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 text-gray-900">
              {children}
            </main>
          </div>
        </div>
      </AdminProtectionWrapper>
    </div>
  );
} 