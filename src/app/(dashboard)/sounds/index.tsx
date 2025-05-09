"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from "@/lib/contexts/SubscriptionContext";

export default function SoundsIndexPage() {
  const router = useRouter();
  const { canAccess } = useSubscription();
  
  useEffect(() => {
    if (canAccess('premium')) {
      // If user has premium access, redirect directly to browser
      router.push('/sounds/browser');
    } else {
      // Otherwise redirect with demo mode query parameter
      router.push('/sounds/browser?demo=true');
    }
  }, [router, canAccess]);
  
  return null;
} 