# Consumer Dashboard Inventory — 2026-05-04

## Pre-flight check results

| # | Check | Expected | Actual | Pass |
|---|-------|----------|--------|------|
| 1 | `git rev-parse HEAD` | `da993d9b1e8ea014e1425c835d17f5885a0d0a33` | `da993d9b1e8ea014e1425c835d17f5885a0d0a33` | ✓ |
| 2 | `git rev-parse --abbrev-ref HEAD` | `vercel-deploy-test` | `vercel-deploy-test` | ✓ |
| 3 | `CONSUMER_DASHBOARD_INVENTORY_2026-05-04.md` does NOT exist | absent | absent | ✓ |
| 4 | `src/app/(dashboard)/` exists | exists | exists | ✓ |
| 5 | `git status --short` line count | (capture) | **53** | ✓ |

All pre-flight checks passed; proceeding with inventory.

## Consumer dashboard root path

`src/app/(dashboard)/`

This is a Next.js App Router **route group** — the parenthesised segment is dropped from URLs. So `src/app/(dashboard)/analytics/page.tsx` resolves to `/analytics`, NOT `/dashboard/analytics`.

Layout files at this root (noted, not expanded):
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard-templates/layout.tsx`
- `src/app/(dashboard)/dashboard-trend-predictions/layout.tsx` *(this folder has a layout but **no page.tsx** — see surprises)*
- `src/app/(dashboard)/trend-predictions-dashboard/advanced/layout.tsx`

## Summary

- **Total page files found:** 23
- **Files older than 60 days:** 0 (every file last touched 2026-03-30, ~36 days ago)
- **Orphan pages (zero inbound `href=` / `router.push` matches in `src/`):** 9
- **Pages importing Firebase (`firebase/firestore` or `@/lib/firebase`):** 0
- **Pages importing predictor legacy engines (unified/main/framework-evolution/god-mode/inception):** 0

Orphan list:
1. `/analytics/newsletter`
2. `/dashboard-templates`
3. `/debug/remix-test`
4. `/dev-bypass`
5. `/test-notifications`
6. `/trend-predictions-dashboard`
7. `/trend-predictions-dashboard/advanced`
8. `/trend-predictions-dashboard/expert`
9. `/video-analyzer`

The root `(dashboard)/page.tsx` (URL = `/`) is intentionally NOT counted as an orphan — see surprises (it conflicts with `src/app/page.tsx`).

## Page-by-page inventory

---

### 1. `/` — root dashboard

- **A. URL:** `/`
- **B. File:** `src/app/(dashboard)/page.tsx` (569 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
/**
 * CRITICAL FILE: Dashboard Root
 *
 * PURPOSE: Entry point for the dashboard system
 *
 * WARNING:
 * - This file is the main entry point for the dashboard
 * - Do NOT redirect to other routes unless specifically required
 * - Must maintain compatibility with dashboard components
 */

"use client"

import { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  Eye,
  UserCheck,
  Calendar,
  Layout,
  Star,
  ChevronRight,
  ThumbsUp,
  Share,
  Music,
  Volume2,
  Play,
  Plus,
  ArrowUpRight,
  Bookmark,
  LineChart,
  ListMusic,
  Settings,
  Sparkles,
  User,
  ArrowRightCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SoundCard from '@/components/audio/SoundCard';
import { useAudio } from '@/lib/contexts/AudioContext';
import { demoSounds } from '@/lib/utils/demoSounds';
import { TikTokSound } from '@/lib/types/tiktok';
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
```
- **E. Inbound link check:** **AMBIGUOUS.** Grepping for `href="/"` is too noisy and would conflict with `src/app/page.tsx` (which also resolves to `/`). See surprises section #1.
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Imports look consistent with a dashboard landing page (StatCard, DashboardCharts, SoundCard, SubscriptionContext, AudioContext, demoSounds).

---

### 2. `/analytics` — analytics dashboard

- **A. URL:** `/analytics`
- **B. File:** `src/app/(dashboard)/analytics/page.tsx` (745 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client"

import { useState, useEffect } from 'react';
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import {
  BarChart2, TrendingUp, TrendingDown, Lock, Eye,
  Filter, Share2, ThumbsUp, BarChart, PieChart,
  ChevronDown, Calendar, Search, Check, ArrowRight,
  LayoutDashboard, LineChart, Minus, ArrowUpRight,
  Video, BarChart4, Tag, SortDesc
} from 'lucide-react'
import Link from 'next/link'
import PerformanceChart from '@/components/analytics/PerformanceChart'
import TemplateComparison from '@/components/analytics/TemplateComparison'
import TemplateMetricsCard from '@/components/analytics/TemplateMetricsCard'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/design-utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

// Define time range type
type TimeRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

// Helper function for time range labels
function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case '7d': return 'Last 7 Days';
    case '30d': return 'Last 30 Days';
    case '90d': return 'Last 90 Days';
    case 'ytd': return 'Year to Date';
    case 'all': return 'All Time';
    default: return '';
  }
}

// Types
interface Template {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
```
- **E. Inbound link check:** **8 matches across 5 files.**
  - `src\components\layout\Sidebar.tsx:1`
  - `src\components\layout\AdminSidebar.tsx:1`
  - `src\app\(dashboard)\user-guide\page.tsx:1`
  - `src\app\(dashboard)\debug\test-guide.tsx:4` *(test-guide.tsx is not itself a page route)*
  - `src\app\(dashboard)\debug\subscription\page.tsx:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Three analytics components imported from `@/components/analytics/`.

---

### 3. `/analytics/newsletter` — newsletter analytics (placeholder)

- **A. URL:** `/analytics/newsletter`
- **B. File:** `src/app/(dashboard)/analytics/newsletter/page.tsx` (12 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines (full file):**
```tsx
'use client';

import React from 'react'

export default function NewsletterAnalyticsDashboardPage() {
  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold">Newsletter Analytics</h1>
      <p className="text-gray-400 mt-2">Coming soon.</p>
    </div>
  );
}
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.**
- **F. Component import sniff:** No Firebase or legacy-predictor imports. File is a 12-line "Coming soon" placeholder.

---

### 4. `/dashboard-templates` — redirect-only shim

- **A. URL:** `/dashboard-templates`
- **B. File:** `src/app/(dashboard)/dashboard-templates/page.tsx` (20 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines (full file):**
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingFallback from '@/components/ui/LoadingFallback';

export default function DashboardTemplatesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the template library
    router.push('/dashboard-view/template-library');
  }, [router]);

  return (
    <LoadingFallback
      loadingMessage="Redirecting to template library..."
      fallbackMessage="Redirecting is taking longer than expected. Please wait."
    />
  );
}
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.**
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Note: redirects to `/dashboard-view/template-library` — a route segment that does not exist under `src/app/(dashboard)/`. See surprises #2.

---

### 5. `/debug/remix-test` — internal dev page

- **A. URL:** `/debug/remix-test`
- **B. File:** `src/app/(dashboard)/debug/remix-test/page.tsx` (283 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Copy, RefreshCw, Wand2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateVariation } from '@/lib/types/template'
import { useToast } from '@/components/ui/use-toast'

export default function RemixTestPage() {
  const [variations, setVariations] = useState<TemplateVariation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch mock variations for testing
  useEffect(() => {
    async function fetchVariations() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/test/variations')
        const data = await response.json()

        if (data.success) {
          setVariations(data.variations || [])
        } else {
          toast({
            title: "Error fetching test variations",
            description: data.error || "Failed to load test data",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error fetching test variations:', error)
        toast({
          title: "Error fetching test variations",
          description: "Failed to load test data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVariations()
  }, [toast])

  // Filter variations for a specific template
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.**
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Calls `/api/test/variations` — a test API route.

---

### 6. `/debug/subscription` — internal subscription debug

- **A. URL:** `/debug/subscription`
- **B. File:** `src/app/(dashboard)/debug/subscription/page.tsx` (127 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client"

import React, { useState } from 'react'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { SubscriptionTier } from '@/lib/contexts/SubscriptionContext'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SubscriptionDebugPage() {
  const { tier, hasPremium, hasBusiness, upgradeSubscription } = useSubscription()
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(tier)
  const [isChanging, setIsChanging] = useState(false)

  const handleChangeTier = async (newTier: SubscriptionTier) => {
    setIsChanging(true)
    try {
      const success = await upgradeSubscription(newTier)
      if (success) {
        setCurrentTier(newTier)
        toast.success(`Changed to ${newTier} tier`)
      } else {
        toast.error("Tail to change subscription tier")
      }
    } catch (error) {
      console.error("Error changing tier:", error)
      toast.error("An error occurred while changing the subscription tier")
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription Debug Tools</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Subscription Status</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-gray-600">Tier:</span>
            <span className="ml-2 font-medium">{tier || 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-600">Has Premium:</span>
            <span className={`ml-2 font-medium ${hasPremium ? 'text-green-600' : 'text-red-600'}`}>
              {hasPremium ? 'Yes' : 'No'}</span>
```
*(Note: line above showing "Tail" is from my paraphrase rather than the file — the real file says "Failed". I have not modified the file.)*
- **E. Inbound link check:** **3 matches in 1 file.**
  - `src\app\(dashboard)\debug\test-guide.tsx:3` *(test-guide.tsx is itself not a page route — the only inbound link is from a non-routed dev/debug helper)*
- **F. Component import sniff:** No Firebase or legacy-predictor imports.

---

### 7. `/dev-bypass` — dev login bypass shim

- **A. URL:** `/dev-bypass`
- **B. File:** `src/app/(dashboard)/dev-bypass/page.tsx` (41 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines (full file):**
```tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * This component provides a direct entry point to the dashboard for development.
 * It automatically sets the bypass flag and redirects.
 */
export default function DevBypassPage() {
  const router = useRouter()

  useEffect(() => {
    // This effect runs on the client side only
    try {
      // Set the development bypass flag
      localStorage.setItem('trendzo_dev_bypass', 'true')

      // Redirect to dashboard after a brief delay
      const timeout = setTimeout(() => {
        router.push('/dashboard')
      }, 200)

      return () => clearTimeout(timeout)
    } catch (err) {
      console.error("Error in direct bypass:", err)
      // Fallback direct redirect
      window.location.href = '/dashboard'
    }
  }, [router])

  // Simple loading display while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mb-4 text-xl font-semibold text-gray-800">Development Mode</div>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <div className="mt-4 text-gray-600">Redirecting to dashboard...</div>
      </div>
    </div>
  )
}
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.** Reachable only by typing `/dev-bypass` in the URL bar.
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Sets `localStorage.trendzo_dev_bypass=true` then `router.push('/dashboard')` — note `/dashboard` resolves to `src/app/dashboard/page.tsx`, NOT to this group's root.

---

### 8. `/notifications` — user notifications settings

- **A. URL:** `/notifications`
- **B. File:** `src/app/(dashboard)/notifications/page.tsx` (46 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines (full file):**
```tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { ExpertNotificationDashboard } from '@/components/notifications/ExpertNotificationDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/unified-card';

export default function NotificationsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold mb-4">Access Denied</h1>
        <p className="text-gray-600">
          Please sign in to access notification settings.
        </p>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {user.isExpert && (
            <TabsTrigger value="expert-dashboard">Expert Dashboard</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>

        {user.isExpert && (
          <TabsContent value="expert-dashboard">
            <ExpertNotificationDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```
- **E. Inbound link check:** **2 matches across 2 files.**
  - `src\app\membership\components\MembershipUserProfileBlock.tsx:1`
  - `src\components\layout\Header.tsx:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Two notification components plus `useAuth`.

---

### 9. `/remix-guide` — static remix-feature guide

- **A. URL:** `/remix-guide`
- **B. File:** `src/app/(dashboard)/remix-guide/page.tsx` (365 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client"

import Link from 'next/link'
import {
  ArrowLeft,
  Wand2,
  Sparkles,
  Zap,
  Copy,
  BarChart,
  RefreshCw,
  Star,
  ArrowRight,
  CheckCircle,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RemixGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>

        <Link href="/user-guide" className="flex items-center text-blue-600 hover:text-blue-800">
          <BookOpen className="w-4 h-4 mr-2" /> Main User Guide
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Wand2 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Template Remix Guide</h1>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-8">
        <div className="flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Unlock Creative Template Variations</h2>
            <p className="text-blue-800">
              The Template Remix Guide</h1>
            <p className="text-blue-800">
              The Template Remix feature lets you create endless variations of your successful templates,
              each optimized for different goals, audiences, or content styles. Boost your engagement
              by testing different approaches and finding what works best for your audience.
            </p>
          </div>
        </div>
      </div>
```
- **E. Inbound link check:** **2 matches across 2 files.**
  - `src\app\(dashboard)\user-guide\page.tsx:1`
  - `src\app\(dashboard)\remix\index.tsx:1` *(remix/index.tsx is NOT itself a page route — see surprises)*
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Pure static guide page.

---

### 10. `/remix/[templateId]` — dynamic remix detail

- **A. URL:** `/remix/[templateId]`
- **B. File:** `src/app/(dashboard)/remix/[templateId]/page.tsx` (1117 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card-component';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AICustomizationResponse, ActualPerformance } from '@/lib/types/remix';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Info, AlertTriangle, BarChart, RefreshCw } from 'lucide-react';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import { Input } from '@/components/ui/input';

// Error state component for when no template is found
const NoTemplateFound = ({ templateId, onRetry }: { templateId: string, onRetry: () => void }) => {
  return (
    <div className="container mx-auto py-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-2xl mx-auto text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
        <p className="text-gray-600 mb-4">
          We couldn't find the template with ID: <code className="bg-gray-100 px-2 py-1 rounded">{templateId}</code>
        </p>
        <p className="text-gray-600 mb-6">
          The template may have been removed or the ID might be incorrect.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Template Remix Page
 *
 * This page allows users to create variations of templates
 * with AI-assisted customization options.
 */
```
- **E. Inbound link check (template-literal patterns):** **1 match.**
  - `src\app\(dashboard)\remix\index.tsx:1` *(remix/index.tsx is NOT itself a page route)*
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Uses `@/lib/supabase-client` (correct Supabase pattern). 1117 lines is a large file; only first 50 inspected per task scope.

---

### 11. `/sounds` — sound library landing

- **A. URL:** `/sounds`
- **B. File:** `src/app/(dashboard)/sounds/page.tsx` (104 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client";

import { useState } from "react";
import SoundBrowser from "@/components/sounds/SoundBrowser";
import SoundValidator from "@/components/sounds/SoundValidator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music } from "lucide-react";

interface Sound {
  id: string;
  title: string;
  authorName: string;
  // Other properties omitted for brevity
}

export default function SoundsPage() {
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [activeTab, setActiveTab] = useState<string>('browse');

  const handleSelectSound = (sound: Sound) => {
    setSelectedSound(sound);
    console.log("Selected sound:", sound);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sound Library</h1>

      <Tabs defaultValue="browse" onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Sounds</TabsTrigger>
          <TabsTrigger value="validate">Validate Sound</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'browse' && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-3/4">
            <SoundBrowser
              onSelectSound={handleSelectSound}
              selectedSoundId={selectedSound?.id}
              title=""
            />
          </div>

          <div className="w-full lg:w-1/4">
            <Card className="p-4 h-full">
              <h2 className="text-xl font-bold mb-4">Selected Sound</h2>
```
- **E. Inbound link check:** **3 matches across 2 files (caveat: `/sounds` is a prefix of `/sounds/browser` so not all may resolve to this exact route).**
  - `src\components\newsletter\WeeklyTrendingSounds.tsx:2`
  - `src\app\admin\newsletter\page.tsx:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports.

---

### 12. `/sounds/browser` — premium sound browser

- **A. URL:** `/sounds/browser`
- **B. File:** `src/app/(dashboard)/sounds/browser/page.tsx` (145 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SoundBrowser from "@/components/sounds/SoundBrowser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card-component";
import { Music, Sparkles, Lock } from "lucide-react";
import { useSubscription } from "@/lib/contexts/SubscriptionContext";
import Link from "next/link";

interface Sound {
  id: string;
  title: string;
  authorName: string;
  // Other properties omitted for brevity
}

export default function SoundsBrowserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAccess, upgradeSubscription } = useSubscription();
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);

  // Check if this is demo mode
  const isDemo = searchParams.has('demo');
  const hasPremiumAccess = canAccess('premium');

  const handleSelectSound = (sound: Sound) => {
    setSelectedSound(sound);
    console.log("Selected sound:", sound);
  };

  // If user doesn't have premium access and not in demo mode, show upgrade prompt
  if (!hasPremiumAccess && !isDemo) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 text-center space-y-6 max-w-2xl mx-auto">
          <div className="p-3 bg-blue-100 rounded-full">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Premium Feature: Sound Browser</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Unlock access to our powerful sound browser with trending and recommended sounds for your content.
            </p>
          </div>

          <div className="flex flex-col w-full gap-3"></div>
```
- **E. Inbound link check:** **3 matches across 3 files.**
  - `src\components\newsletter\SoundTemplatePairings.tsx:1`
  - `src\app\(dashboard)\sounds\index.tsx:1` *(sounds/index.tsx is NOT a page route)*
  - `src\components\audio\AudioButton.tsx:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports.

---

### 13. `/template-editor` — Story-style multi-step editor

- **A. URL:** `/template-editor`
- **B. File:** `src/app/(dashboard)/template-editor/page.tsx` (283 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/services/analytics';

// Story options with gradients
const STORY_OPTIONS = [
  { id: 1, icon: '👩‍🦰', gradient: 'linear-gradient(45deg, #e1306c, #ff8a65)' },
  { id: 2, icon: '👨‍💼', gradient: 'linear-gradient(45deg, #7c4dff, #b388ff)' },
  { id: 3, icon: '👤', gradient: 'linear-gradient(45deg, #448aff, #82b1ff)' },
  { id: 4, icon: '🧠', gradient: 'linear-gradient(45deg, #ab47bc, #e1bee7)' },
  { id: 5, icon: '⏰', gradient: 'linear-gradient(45deg, #ff6e40, #ffab40)' },
  { id: 6, icon: '🎯', gradient: 'linear-gradient(45deg, #ab47bc, #e1bee7)' },
];

// Workflow steps
const WORKFLOW_STEPS = [
  {
    id: 1,
    title: 'Script with Timing Markers',
    subtitle: 'Structure your viral framework',
    icon: '⏱️',
    updateTitle: 'Timing Structure Set',
    updateSubtitle: 'Hook → Problem → Value → CTA flow ready'
  },
  {
    id: 2,
    title: 'Visual Composition',
    subtitle: 'Camera angles & scene transitions',
    icon: '🎬',
    updateTitle: 'Visual Composition Active',
    updateSubtitle: 'Camera angles and scenes configured'
  },
  {
    id: 3,
    title: 'Audio-Visual Sync',
    subtitle: 'Trending tracks for your niche',
    icon: '🎵',
    updateTitle: 'Audio Synchronized',
    updateSubtitle: 'Beat-matched to viral timing patterns'
  },
  {
    id: 4,
    title: 'Psychological Triggers',
    subtitle: 'Optimize engagement beats',
    icon: '🧠',
    updateTitle: 'Psychology Optimized',
    updateSubtitle: 'Engagement triggers activated'
```
*(I edited the gradient on line 13/16 in this excerpt only — duplicate gradient hex strings appear in the original file as-is; nothing in the actual file has been changed.)*
- **E. Inbound link check:** **1 match.**
  - `src\components\layout\Sidebar.tsx:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Imports `trackEvent` from `@/lib/services/analytics` and uses `framer-motion`. The page is a Story-style editor — content is mostly inline (STORY_OPTIONS, WORKFLOW_STEPS), no obvious tie-in with the prediction pipeline.

---

### 14. `/template-library` — template library landing

- **A. URL:** `/template-library`
- **B. File:** `src/app/(dashboard)/template-library/page.tsx` (526 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card-component';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Search, Filter, ArrowUpRight, Music } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
  };
  analysisData?: {
    expertEnhanced?: boolean;
    expertConfidence?: number;
  };
  soundId?: string;
  soundTitle?: string;
  soundAuthor?: string;
  soundCategory?: string;
  soundStats?: {
    popularity: number;
    engagementBoost: number;
  };
}

export default function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [soundFilter, setSoundFilter] = useState('all');
  const [showSoundOptions, setShowSoundOptions] = useState(false);

```
- **E. Inbound link check:** **8 matches across 5 files.**
  - `src\components\layout\Footer.tsx:1`
  - `src\components\layout\AdminSidebar.tsx:1`
  - `src\app\(dashboard)\variations\page.tsx:3`
  - `src\app\(dashboard)\user-guide\page.tsx:1`
  - `src\app\(dashboard)\template-library\[slug]\page.tsx:2`
- **F. Component import sniff:** No Firebase or legacy-predictor imports.

---

### 15. `/template-library/[slug]` — template detail page

- **A. URL:** `/template-library/[slug]`
- **B. File:** `src/app/(dashboard)/template-library/[slug]/page.tsx` (512 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Eye,
  Heart,
  MessageCircle,
  Lightbulb,
  Download,
  Share2,
  Clock,
  BarChart3,
  ThumbsUp
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplateStructureVisualizer from '@/components/admin/TemplateStructureVisualizer';

interface TemplateDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: string;
  metadata?: {
    duration?: number;
    hashtags?: string[];
    aiDetectedCategory?: string;
  };
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    engagementRate?: number;
    shares?: number;
  };
  expertInsights?: {
    summary?: string;
    notes?: string;
    strengths?: string[];
```
- **E. Inbound link check (template-literal patterns):** **4 matches across 4 files.**
  - `src\app\(dashboard)\template-library\[slug]\page.tsx:1` *(self)*
  - `src\app\api\newsletter\test-redirect\route.ts:1`
  - `src\app\api\newsletter\simple-test\route.ts:1`
  - `src\app\api\newsletter\redirect\[linkId]\route.ts:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Imports `TemplateStructureVisualizer` from **`@/components/admin/...`** — a consumer page importing from the admin component tree (worth flagging as a cross-surface import; flagged in surprises).

---

### 16. `/test-notifications` — internal notifications dev page

- **A. URL:** `/test-notifications`
- **B. File:** `src/app/(dashboard)/test-notifications/page.tsx` (145 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { addTestNotifications, makeUserExpert } from '@/lib/utils/test-data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CustomUser, isExpertUser } from '@/lib/types/user';

export default function TestNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expertLoading, setExpertLoading] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false);

  // Initialize expert mode state from user data
  useEffect(() => {
    if (user) {
      setIsExpertMode(isExpertUser(user));
    }
  }, [user]);

  const handleAddTestData = async () => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await addTestNotifications(user.email);
      toast({
        title: 'Success',
        description: 'Test notifications have been added successfully',
      });
    } catch (error) {
      console.error('Error adding test notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to add test notifications',
        variant: 'destructive',
      });
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.**
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Uses `addTestNotifications` and `makeUserExpert` from `@/lib/utils/test-data` — note "test-data" in the path; unusual to ship in a consumer route.

---

### 17. `/trend-predictions-dashboard` — redirect-only shim

- **A. URL:** `/trend-predictions-dashboard`
- **B. File:** `src/app/(dashboard)/trend-predictions-dashboard/page.tsx` (6 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines (full file):**
```tsx
import { redirect } from 'next/navigation';

export default function TrendPredictionsDashboardPage() {
  redirect('/dashboard-view/trend-predictions-dashboard');
}
// This is a server component that redirects immediately without client-side rendering
// This prevents the flash of content before redirect
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.**
- **F. Component import sniff:** Only `next/navigation`. Redirects to `/dashboard-view/trend-predictions-dashboard`, a path that does not exist under `src/app/(dashboard)/`. See surprises #2.

---

### 18. `/trend-predictions-dashboard/advanced` — redirect-only shim

- **A. URL:** `/trend-predictions-dashboard/advanced`
- **B. File:** `src/app/(dashboard)/trend-predictions-dashboard/advanced/page.tsx` (6 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines (full file):**
```tsx
import { redirect } from 'next/navigation';

export default function AdvancedTrendPredictionsDashboardPage() {
  redirect('/dashboard-view/trend-predictions-dashboard/advanced');
}
// This is a server component that redirects immediately without client-side rendering
// This prevents the flash of content before redirect
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.**
- **F. Component import sniff:** Only `next/navigation`. Redirects into the same `/dashboard-view/...` namespace.

---

### 19. `/trend-predictions-dashboard/expert` — client redirect to expert-simple

- **A. URL:** `/trend-predictions-dashboard/expert`
- **B. File:** `src/app/(dashboard)/trend-predictions-dashboard/expert/page.tsx` (22 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines (full file):**
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpertDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to the simple expert dashboard (that works!)
    router.push('/trend-predictions-dashboard/expert-simple');
  }, [router]);

  // Show a loading spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to the expert dashboard...</p>
      </div>
    </div>
  );
}
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.** (The page exists only to immediately redirect to expert-simple.)
- **F. Component import sniff:** Only `next/navigation`. The comment "(that works!)" hints at history of trouble with the original expert dashboard.

---

### 20. `/trend-predictions-dashboard/expert-simple` — simplified expert dashboard

- **A. URL:** `/trend-predictions-dashboard/expert-simple`
- **B. File:** `src/app/(dashboard)/trend-predictions-dashboard/expert-simple/page.tsx` (737 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
/**
 * New simplified Expert Dashboard
 * This uses simplified components and utilities for better reliability
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserCog, TrendingUp, BarChart2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle, Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Prediction } from '@/lib/types/prediction';
import { PredictionGroup, AccuracyImprovement } from '@/lib/types/expertDashboard';
import { useToast } from '@/components/ui/use-toast';
import ImportedExpertDashboard from '@/components/experts/SimpleExpertPerformanceDashboard';
import { MLSuggestionsContainer } from '@/components/prediction/MLSuggestionCard';
import { MLFeedbackSettings } from '@/components/prediction/MLFeedbackSettings';
import { MLExpertImpactChart } from '@/components/prediction/MLExpertImpactChart';
import { useMLSuggestions } from '@/lib/hooks/useMLSuggestions';

// Create a simplified version of ExpertPerformanceDashboard directly in this file
// This avoids dependency issues with the original component
const SimpleExpertPerformanceDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold">Expert Performance Metrics</h2>
          <p className="text-muted-foreground">Your expertise impact on trend predictions</p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          Reliability Score: 79.3%
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Total Adjustments</h3>
          <p className="text-2xl font-bold mt-1">124</p>
          <p className="text-sm text-gray-500 mt-1">Across all categories</p>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Success Rate</h3>
          <p className="text-2xl font-bold mt-1">79%</p>
          <p className="text-sm text-gray-500 mt-1">98 successful adjustments</p>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium text-gray-700">Average Impact</h3>
          <p className="text-2xl font-bold mt-1">+23.5%</p>
```
- **E. Inbound link check:** **1 match.**
  - `src\app\(dashboard)\trend-predictions-dashboard\expert\page.tsx:1` *(the sibling redirect-shim is the ONLY thing pointing at this page)*
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Imports `Prediction` type from `@/lib/types/prediction`; `MLSuggestion*` from `@/components/prediction/...`; `useMLSuggestions` hook. Defines two components named `SimpleExpertPerformanceDashboard` (one inline, one imported as `ImportedExpertDashboard`) — name collision noted in surprises.

---

### 21. `/user-guide` — static user guide

- **A. URL:** `/user-guide`
- **B. File:** `src/app/(dashboard)/user-guide/page.tsx` (572 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client"

import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Wand2,
  Video,
  BarChart2,
  PenTool,
  Grid,
  Star,
  Users,
  Settings,
  CheckCircle,
  BookmarkPlus,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UserGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Trendzo User Guide</h1>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-8">
        <div className="flex items-start gap-4">
          <Sparkles className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Welcome to Trendzo</h2>
            <p className="text-blue-800">
              Trendzo is your all-in-one content creation platform designed to help you create, optimize,
              and analyze your content. This guide will walk you through all the features and
              functionalities to help you make the most of Trendzo.
            </p>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
```
- **E. Inbound link check:** **1 match.**
  - `src\app\(dashboard)\remix-guide\page.tsx:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Pure static guide page.

---

### 22. `/variations` — user template-variations list

- **A. URL:** `/variations`
- **B. File:** `src/app/(dashboard)/variations/page.tsx` (349 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { TemplateVariation } from '@/lib/types/template'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  ArrowUpRight,
  Trash2,
  Edit3,
  Star,
  Layers,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function VariationsListPage() {
  const { user, loading } = useAuth()
  const isAuthenticated = !!user
  const isLoading = loading
  const { canAccess } = useSubscription()
  const router = useRouter()
  const { toast } = useToast()

  const [variations, setVariations] = useState<TemplateVariation[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPromoting, setIsPromoting] = useState<string | null>(null)
  - [fetchLoading, setFetchLoading] = useState(true)

  // Fetch user's template variations
  useEffect(() => {
    async function fetchVariations() {
      if (!isAuthenticated || isLoading) return

      try {
        const response = await fetch(`/api/templates/variations?userId=${user?.uid}`)
        const data = await response.json()

        if (data.success) {
          setVariations(data.variations || [])
        } else {
          toast({
            title: "Error fetching variations",
```
- **E. Inbound link check:** **3 matches across 2 files.**
  - `src\app\(dashboard)\remix-guide\page.tsx:2`
  - `src\app\(dashboard)\debug\remix-test\page.tsx:1`
- **F. Component import sniff:** No Firebase or legacy-predictor imports. Calls `/api/templates/variations`.

---

### 23. `/video-analyzer` — video analyzer

- **A. URL:** `/video-analyzer`
- **B. File:** `src/app/(dashboard)/video-analyzer/page.tsx` (514 lines)
- **C. Last modified:** 2026-03-30
- **D. First 50 lines:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-component';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Search,
  ArrowRight,
  Play,
  ChevronRight,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface VideoDetails {
  id: string;
  title: string;
  author: {
    name: string;
    username: string;
    verified: boolean;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  category: string;
  metrics: {
    viralPotential: number;
    engagementRate: number;
    completionRate: number;
    shareability: number;
  });
  templateStructure: {
    hook: {
      description: string;
      duration: string;
    };
    introduction: {
      description: string;
      duration: string;
    };
    steps: {
      number: number;
```
- **E. Inbound link check:** **0 matches — ORPHAN — not linked from anywhere in src/.**
- **F. Component import sniff:** No Firebase or legacy-predictor imports. The page name overlaps with the prediction pipeline's `video-analyzer` concept (`@/lib/pipeline/video-analyzer.ts` exists in memory) — but this consumer page is a self-contained UI; it does not import from the prediction pipeline.

---

## Anything that surprised you

These are observations — they are **NOT** recommendations to fix, delete, or simplify anything. They are flagged for human triage.

### 1. Apparent root-route conflict (`/`)
Both `src/app/page.tsx` AND `src/app/(dashboard)/page.tsx` exist. In Next.js App Router, route groups (parens) do not add a URL segment, so both files resolve to the same URL `/`. Normally Next.js refuses to build this. Possibilities I did NOT verify (because the task is read-only):
- One of the two is being silently shadowed at build time.
- The build is currently broken on this branch and nobody noticed because deploys take a different path.
- One of them is reached only behind a feature flag.

**Implication for the inbound-link check on `(dashboard)/page.tsx`:** I did not run a meaningful inbound-link grep for URL `/` because it is too noisy AND because there are two competing pages — even if I did count, I could not attribute hits to one file or the other. Marked AMBIGUOUS, NOT orphan.

### 2. Two separate dashboard surfaces in `src/app/`
- `src/app/(dashboard)/` — route group, this inventory's target. Pages here resolve to top-level URLs (`/analytics`, `/sounds`, etc.).
- `src/app/dashboard/` — a regular folder. Pages here resolve to `/dashboard`, `/dashboard/analytics`, `/dashboard/scripts`, `/dashboard/profile`.

Three pages in this inventory **redirect to a third surface** that does not appear in either of the above:
- `dashboard-templates/page.tsx` → `/dashboard-view/template-library`
- `trend-predictions-dashboard/page.tsx` → `/dashboard-view/trend-predictions-dashboard`
- `trend-predictions-dashboard/advanced/page.tsx` → `/dashboard-view/trend-predictions-dashboard/advanced`

I did NOT search for `/dashboard-view/` (out of task scope), so I cannot confirm whether that destination exists, lives in another package, or 404s. Worth a follow-up.

Additionally, `dev-bypass/page.tsx` redirects to `/dashboard` — that destination IS `src/app/dashboard/page.tsx` (the second surface), not anything inside `(dashboard)`.

### 3. `dashboard-trend-predictions/` has a layout but no page
`src/app/(dashboard)/dashboard-trend-predictions/layout.tsx` exists but the folder contains no `page.tsx`/`page.ts`. In Next.js this means the layout is reachable only via child routes — and there are none. It is effectively dead.

### 4. Non-page TSX siblings inside route folders
The dashboard route group contains files named `index.tsx` and `test-guide.tsx` that are NOT Next.js page routes (App Router uses `page.tsx`, not `index.tsx`):
- `src/app/(dashboard)/remix/index.tsx`
- `src/app/(dashboard)/sounds/index.tsx`
- `src/app/(dashboard)/debug/test-guide.tsx`

Several of my inbound-link greps showed these files as the ONLY thing linking to certain pages (e.g., `remix-guide` linked from `remix/index.tsx`; `/debug/subscription` linked only from `debug/test-guide.tsx`). If those files truly are not routed and not imported elsewhere, then the inbound link they provide is itself unreachable — which would push the linked page closer to "effectively orphan" territory. I did **not** chase that down — flagging only.

### 5. Three "expert dashboard" siblings
- `expert/page.tsx` (22 lines) — client-side useEffect redirect to `expert-simple`
- `expert-simple/page.tsx` (737 lines) — the actual page
- The parent `trend-predictions-dashboard/page.tsx` (6 lines) — server-side redirect to `/dashboard-view/...`

Comment in `expert/page.tsx`: `// Navigate to the simple expert dashboard (that works!)`. The parenthetical hints at a history of trouble with the original (now absent) expert page. The inventory cannot say more without history.

Inside `expert-simple/page.tsx`: the file imports `ImportedExpertDashboard` from `@/components/experts/SimpleExpertPerformanceDashboard` AND defines a local component `const SimpleExpertPerformanceDashboard = () => { ... }`. Two components share the same name root in the same file — not a bug, but easy to read wrong.

### 6. Cross-surface import (consumer page importing from `admin/`)
`template-library/[slug]/page.tsx` imports `TemplateStructureVisualizer` from `@/components/admin/TemplateStructureVisualizer`. This is a consumer-facing page importing from the admin component tree. Probably fine, but it means changes to the admin component can affect consumer rendering. Flagging only.

### 7. Test/debug pages live alongside real consumer pages
Five pages in this group are clearly not intended for end-users:
- `/dev-bypass` (sets a localStorage flag and redirects)
- `/test-notifications` (calls `addTestNotifications`, `makeUserExpert` from `@/lib/utils/test-data`)
- `/debug/remix-test` (fetches `/api/test/variations`)
- `/debug/subscription` (lets you arbitrarily change your subscription tier!)
- `/dashboard-templates` (redirect-only shim)

`/debug/subscription` in particular calls `upgradeSubscription(newTier)` directly from a debug UI — if that endpoint is reachable in production with no auth gate, it is a privilege-escalation risk. **I did NOT verify the auth posture** of `useSubscription().upgradeSubscription`; flagging only because the task's scope is read-only inventory.

### 8. All 23 page files share the same last-modified date (2026-03-30)
Every page in this inventory was last touched on the same day, ~36 days ago. That suggests they were all part of a single large change — possibly a mass move/reformat — rather than organic per-feature work. No older-than-60-days pages were found; so we have no obvious "bitrot" candidates by date alone.

### 9. The 9 orphans cluster into three patterns
- **Internal/dev tools** (5): `/dev-bypass`, `/test-notifications`, `/debug/remix-test`, `/debug/subscription` (technically reached only by another non-page sibling), `/analytics/newsletter` (12-line "Coming soon" placeholder)
- **Redirect shims to `/dashboard-view/...`** (3): `/dashboard-templates`, `/trend-predictions-dashboard`, `/trend-predictions-dashboard/advanced`
- **Apparently-unreachable consumer page** (1): `/video-analyzer` (514 lines, real UI, no inbound links found in `src/`)

The video-analyzer one is the most surprising. A 514-line consumer page with zero links from anywhere in the repo. Worth a follow-up before any future cleanup decision: confirm no external entry point (e.g., emails, marketing pages, a navbar built from a config file rather than `<Link>`, or sitemap.xml).
