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
          
          <div className="flex flex-col w-full gap-3">
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
              onClick={() => upgradeSubscription('premium')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/sounds/browser?demo=true')}
            >
              Try in Demo Mode
            </Button>
            
            <Link 
              href="/pricing"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
            >
              See pricing details
            </Link>
          </div>
          
          <div className="text-xs text-gray-500 border-t border-gray-200 pt-4 w-full max-w-md">
            Premium includes unlimited template remixes, custom branding, advanced sound library, and detailed analytics.
          </div>
        </div>
      </div>
    )
  }

  // If the user has premium access or is in demo mode, show the browser
  return (
    <div className="container mx-auto p-4">
      {isDemo && !hasPremiumAccess && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <Sparkles className="text-amber-500 mr-2 h-5 w-5" />
            <p className="text-amber-800 text-sm">
              You're viewing the Sound Browser in demo mode. Upgrade to Premium for full access.
            </p>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-amber-500 to-amber-600"
            onClick={() => upgradeSubscription('premium')}
          >
            Upgrade
          </Button>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <SoundBrowser 
            onSelectSound={handleSelectSound} 
            selectedSoundId={selectedSound?.id}
            title="Browse Sounds" 
          />
        </div>
        
        <div className="w-full lg:w-1/4">
          <Card className="p-4 h-full">
            <h2 className="text-xl font-bold mb-4">Selected Sound</h2>
            
            {selectedSound ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Music size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedSound.title}</h3>
                    <p className="text-sm text-muted-foreground">By {selectedSound.authorName}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Button className="w-full">Add to Template</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Music className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No Sound Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a sound from the browser to see details
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 