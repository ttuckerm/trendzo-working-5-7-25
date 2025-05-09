"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Settings, 
  Paintbrush, 
  Bell, 
  Shield, 
  UserCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  Cloud,
  Music
} from 'lucide-react';

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Animations & Haptics',
      description: 'Customize animations and haptic feedback',
      icon: <Zap className="h-5 w-5" />,
      href: '/settings/animations',
      new: true
    },
    {
      title: 'Multi-Sensory Preferences',
      description: 'Personalize your audio-visual experience',
      icon: <Music className="h-5 w-5" />,
      href: '/settings/multi-sensory',
      new: true
    },
    {
      title: 'Appearance',
      description: 'Customize the app theme and visual elements',
      icon: <Paintbrush className="h-5 w-5" />,
      href: '/settings/appearance'
    },
    {
      title: 'Notifications',
      description: 'Manage notification preferences',
      icon: <Bell className="h-5 w-5" />,
      href: '/settings/notifications'
    },
    {
      title: 'Privacy & Security',
      description: 'Control your data and security settings',
      icon: <Shield className="h-5 w-5" />,
      href: '/settings/privacy'
    },
    {
      title: 'Account',
      description: 'Manage your account details and preferences',
      icon: <UserCircle className="h-5 w-5" />,
      href: '/settings/account'
    },
    {
      title: 'Sync & Backup',
      description: 'Configure data synchronization options',
      icon: <Cloud className="h-5 w-5" />,
      href: '/settings/sync'
    },
    {
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: <HelpCircle className="h-5 w-5" />,
      href: '/settings/help'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container max-w-4xl py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {settingsSections.map((section, index) => (
          <motion.div key={index} variants={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href={section.href}>
              <div className="p-6 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {section.icon}
                  </div>
                  {section.new && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                      New
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-1">{section.title}</h2>
                <p className="text-muted-foreground text-sm mb-4">{section.description}</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  Configure
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 