"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Import icons
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Crown,
  GraduationCap,
  ImageIcon,
  LayoutDashboard,
  Edit,
  Compass,
  BarChart,
  Volume2,
} from "lucide-react";

export function SessionNavBar() {
  const pathname = usePathname();
  const [mainExpanded, setMainExpanded] = useState(true);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true);
  
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link href="/dashboard-view" className="flex items-center">
          <span className="text-xl font-bold text-blue-600">TRENDZO</span>
        </Link>
      </div>
      
      {/* Business Plan Badge */}
      <div className="p-4">
        <div className="mb-4 rounded-lg bg-purple-50 p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-purple-600" />
            <span className="font-medium">Business Plan</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-2 overflow-y-auto">
        {/* MAIN Section */}
        <div className="mb-4">
          <button
            onClick={() => setMainExpanded(!mainExpanded)}
            className="flex w-full items-center justify-between px-2 py-2 text-xs font-semibold uppercase text-gray-500"
          >
            MAIN
            {mainExpanded ? (
              <ChevronUp size={14} className="transition-transform" />
            ) : (
              <ChevronDown size={14} className="transition-transform" />
            )}
          </button>
          
          {mainExpanded && (
            <ul className="mt-1 space-y-1 list-none p-0">
              <li>
                <Link
                  href="/dashboard-view"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    (pathname === "/dashboard-view" || pathname === "/dashboard")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={(pathname === "/dashboard-view" || pathname === "/dashboard") ? "text-blue-600" : "text-gray-500"}>
                    <LayoutDashboard size={18} />
                  </span>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard-view/template-library"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname.includes("/template-library")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname.includes("/template-library") ? "text-blue-600" : "text-gray-500"}>
                    <ImageIcon size={18} />
                  </span>
                  <span>Template Library</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard-view/template-editor"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === "/editor" || pathname === "/dashboard-view/template-editor" || pathname.startsWith("/dashboard-view/template-editor/")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname === "/editor" || pathname === "/dashboard-view/template-editor" || pathname.startsWith("/dashboard-view/template-editor/") ? "text-blue-600" : "text-gray-500"}>
                    <Edit size={18} />
                  </span>
                  <span>Template Editor</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard-view/video-analyzer"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname.includes("/video-analyzer")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname.includes("/video-analyzer") ? "text-blue-600" : "text-gray-500"}>
                    <Compass size={18} />
                  </span>
                  <span>Video Analyzer Tools</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/documentation"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === "/documentation" || pathname.startsWith("/documentation/")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname === "/documentation" || pathname.startsWith("/documentation/") ? "text-blue-600" : "text-gray-500"}>
                    <GraduationCap size={18} />
                  </span>
                  <span>Documentation</span>
                </Link>
              </li>
            </ul>
          )}
        </div>

        {/* ANALYTICS Section */}
        <div className="mb-4">
          <button
            onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
            className="flex w-full items-center justify-between px-2 py-2 text-xs font-semibold uppercase text-gray-500"
          >
            ANALYTICS
            {analyticsExpanded ? (
              <ChevronUp size={14} className="transition-transform" />
            ) : (
              <ChevronDown size={14} className="transition-transform" />
            )}
          </button>
          
          {analyticsExpanded && (
            <ul className="mt-1 space-y-1 list-none p-0">
              <li>
                <Link
                  href="/dashboard-view/analytics/trend-insights"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === "/dashboard-view/analytics/trend-insights" || pathname === "/analytics/trend-insights"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname === "/dashboard-view/analytics/trend-insights" || pathname === "/analytics/trend-insights" ? "text-blue-600" : "text-gray-500"}>
                    <BarChart2 size={18} />
                  </span>
                  <span>Trend Insights</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/sound-trends"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === "/sound-trends"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname === "/sound-trends" ? "text-blue-600" : "text-gray-500"}>
                    <Volume2 size={18} />
                  </span>
                  <span>Sound Trends</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard-view/analytics/performance"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === "/dashboard-view/analytics/performance"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname === "/dashboard-view/analytics/performance" ? "text-blue-600" : "text-gray-500"}>
                    <BarChart size={18} />
                  </span>
                  <span>Performance Metrics</span>
                  <span className="ml-auto flex h-5 items-center rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-700">
                    Premium
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard-view/analytics/advanced-insights"
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === "/dashboard-view/analytics/advanced-insights"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={pathname === "/dashboard-view/analytics/advanced-insights" ? "text-blue-600" : "text-gray-500"}>
                    <BarChart2 size={18} />
                  </span>
                  <span>Advanced</span>
                  <span className="ml-auto flex h-5 items-center rounded-full bg-purple-100 px-2 text-xs font-medium text-purple-700">
                    Business
                  </span>
                </Link>
              </li>
            </ul>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-200 p-4 text-center text-xs text-gray-500">
        © 2023 Trendzo
        <br />
        Making content creation easier
      </div>
    </aside>
  );
} 