'use client';

/**
 * Master Navigation Bar
 * 
 * Unified navigation that follows the user everywhere with:
 * - Live DPS meter
 * - Smart workflow routing
 * - Experience-based suggestions
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Layers, 
  Grid, 
  Upload, 
  Brain, 
  Menu,
  X,
  Zap,
  TrendingUp,
  ChevronDown
} from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  href: string;
  children: React.ReactNode;
  badge?: string;
}

function NavItem({ icon: Icon, href, children, badge }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-white/20 text-white' 
          : 'text-white/70 hover:text-white hover:bg-white/10'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{children}</span>
      {badge && (
        <span className="ml-1 px-2 py-0.5 text-xs bg-pink-500 text-white rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface LiveDPSMeterProps {
  score: number;
}

function LiveDPSMeter({ score }: LiveDPSMeterProps) {
  const getColor = () => {
    if (score >= 85) return 'from-emerald-400 to-green-500';
    if (score >= 70) return 'from-yellow-400 to-orange-500';
    if (score >= 50) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-red-600';
  };

  const getLabel = () => {
    if (score >= 85) return '🔥 Mega-Viral';
    if (score >= 70) return '✨ Viral Ready';
    if (score >= 50) return '📈 Good';
    return '⚠️ Needs Work';
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-black/30 rounded-xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-white/60 text-sm">Live DPS</span>
      </div>
      <div className={`
        text-2xl font-bold bg-gradient-to-r ${getColor()} bg-clip-text text-transparent
      `}>
        {score.toFixed(1)}
      </div>
      <span className="text-xs text-white/50">{getLabel()}</span>
    </div>
  );
}

export function MasterNavigation() {
  const [liveDPS, setLiveDPS] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [algorithmIQ, setAlgorithmIQ] = useState(0);
  const pathname = usePathname();

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/algorithm-iq/performance');
        if (res.ok) {
          const data = await res.json();
          setAlgorithmIQ(data.latestPerformance?.iq_score || 0);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Listen for DPS updates from workflow
  useEffect(() => {
    const handleDPSUpdate = (event: CustomEvent) => {
      setLiveDPS(event.detail.dps);
    };

    window.addEventListener('dps-update' as any, handleDPSUpdate);
    return () => window.removeEventListener('dps-update' as any, handleDPSUpdate);
  }, []);

  // Don't show nav on certain pages
  const hideOnPaths = ['/onboarding', '/auth'];
  if (hideOnPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 via-pink-900 to-red-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & DPS Meter */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CleanCopy</span>
            </Link>
            
            {liveDPS > 0 && <LiveDPSMeter score={liveDPS} />}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavItem icon={Sparkles} href="/admin/workflows/quick-win">
              Quick Win
            </NavItem>
            <NavItem icon={Layers} href="/admin/studio?tab=creator">
              Creator Studio
            </NavItem>
            <NavItem icon={Grid} href="/admin/studio?tab=template-library">
              Templates
            </NavItem>
            <NavItem icon={Upload} href="/admin/studio?tab=instant-analysis">
              Analyze
            </NavItem>
            <NavItem icon={Brain} href="/admin/algorithm-iq" badge={`IQ: ${algorithmIQ}`}>
              Intelligence
            </NavItem>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-white/60 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Algorithm IQ: <strong className="text-white">{algorithmIQ}</strong></span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-lg border-t border-white/10">
          <div className="px-4 py-4 space-y-2">
            <NavItem icon={Sparkles} href="/admin/workflows/quick-win">
              Quick Win
            </NavItem>
            <NavItem icon={Layers} href="/admin/studio?tab=creator">
              Creator Studio
            </NavItem>
            <NavItem icon={Grid} href="/admin/studio?tab=template-library">
              Templates
            </NavItem>
            <NavItem icon={Upload} href="/admin/studio?tab=instant-analysis">
              Analyze
            </NavItem>
            <NavItem icon={Brain} href="/admin/algorithm-iq">
              Intelligence Hub
            </NavItem>
          </div>
        </div>
      )}
    </nav>
  );
}

export default MasterNavigation;



