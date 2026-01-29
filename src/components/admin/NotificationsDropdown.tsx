'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  UserCheck,
  DollarSign,
  AlertTriangle,
  Megaphone,
  Smartphone,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationType = 
  | 'creator_verified'
  | 'payout_pending'
  | 'campaign_completed'
  | 'app_submitted'
  | 'webhook_failing'
  | 'tier_upgraded';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  created_at: string;
}

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: any; color: string; bg: string }> = {
  creator_verified: { icon: UserCheck, color: 'text-green-400', bg: 'bg-green-500/20' },
  payout_pending: { icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  campaign_completed: { icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  app_submitted: { icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/20' },
  webhook_failing: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  tier_upgraded: { icon: Settings, color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock notifications - in real implementation, fetch from API
  useEffect(() => {
    setNotifications([
      {
        id: '1',
        type: 'creator_verified',
        title: 'Creator Verified',
        message: '@newcreator has been verified and is ready to create',
        href: '/admin/organization/creators/5',
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
      },
      {
        id: '2',
        type: 'payout_pending',
        title: 'Payouts Pending',
        message: '3 payouts ($1,250 total) are waiting for approval',
        href: '/admin/rewards/payouts',
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      },
      {
        id: '3',
        type: 'app_submitted',
        title: 'New App Submission',
        message: 'Auto Poster by Automation Inc needs review',
        href: '/admin/rewards/app-store?pending=true',
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      },
      {
        id: '4',
        type: 'webhook_failing',
        title: 'Webhook Failing',
        message: 'Legacy System webhook has failed 5 times',
        href: '/admin/integrations/webhooks',
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: '5',
        type: 'campaign_completed',
        title: 'Campaign Completed',
        message: 'CleanCopy Launch Promo has finished with 52K signups',
        href: '/admin/rewards/platform-campaigns/1',
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
    ]);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#111118] border border-[#1a1a2e] rounded-xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a2e]">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 border-b border-[#1a1a2e] last:border-0 hover:bg-white/5 transition-colors',
                      !notification.read && 'bg-white/5'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                        <Icon size={16} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{notification.title}</span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">{notification.message}</p>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {notification.href && (
                            <Link
                              href={notification.href}
                              onClick={() => {
                                markAsRead(notification.id);
                                setIsOpen(false);
                              }}
                              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                              View Details
                              <ChevronRight size={12} />
                            </Link>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1 ml-auto"
                            >
                              <Check size={12} />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-400">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#1a1a2e] bg-[#0a0a0f]">
            <Link
              href="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1"
            >
              View All Notifications
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Toast notification component for real-time updates
export function NotificationToast({ 
  notification, 
  onDismiss 
}: { 
  notification: Notification; 
  onDismiss: () => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 shadow-xl max-w-sm">
        <div className="flex gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
            <Icon size={16} className={config.color} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm">{notification.title}</span>
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{notification.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing real-time notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setToasts(prev => [...prev, newNotification]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    notifications,
    toasts,
    addNotification,
    dismissToast,
  };
}


























































































