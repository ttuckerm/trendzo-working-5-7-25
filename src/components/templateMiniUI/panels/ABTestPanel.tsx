"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Play, Trophy, Plus, Loader2, BarChart3 } from "lucide-react";
import { logTemplateEvent } from "../events";

interface ABVariant {
  id: string;
  name: string;
  status: "draft" | "running" | "completed";
  performance?: {
    impressions: number;
    engagement: number;
    virality_score: number;
  };
  created_at: string;
}

interface ABTestPanelProps {
  templateId: string;
  platform: string;
  userId?: string;
  onAction?: (action: string) => void;
}

// Mock recordAbEvent function - would integrate with actual A/B testing system
async function recordAbEvent(event: {
  template_id: string;
  variant_id?: string;
  event_type: 'create' | 'switch' | 'promote' | 'view';
  user_id?: string;
  platform?: string;
}) {
  try {
    await fetch('/api/templates/ab-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (error) {
    console.warn('A/B event recording failed:', error);
  }
}

export function ABTestPanel({ templateId, platform, userId, onAction }: ABTestPanelProps) {
  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  const deepLink = `/membership/viral-recipe-book?tab=abtesting&templateId=${templateId}`;

  // Load variants on mount
  useEffect(() => {
    loadVariants();
    recordAbEvent({
      template_id: templateId,
      event_type: 'view',
      user_id: userId,
      platform
    });
  }, [templateId, userId, platform]);

  const loadVariants = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}/variants`);
      if (response.ok) {
        const data = await response.json();
        setVariants(data.variants || []);
        setActiveVariant(data.activeVariant || null);
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVariant = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/templates/create-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          platform,
          userId,
          name: `Variant ${variants.length + 1}`
        })
      });

      if (!response.ok) {
        throw new Error('Variant creation failed');
      }

      const newVariant = await response.json();
      setVariants(prev => [...prev, newVariant]);
      
      // Record A/B event
      await recordAbEvent({
        template_id: templateId,
        variant_id: newVariant.id,
        event_type: 'create',
        user_id: userId,
        platform
      });

      // Log telemetry
      await logTemplateEvent({
        event_type: 'variant',
        template_id: templateId,
        variant_id: newVariant.id,
        platform,
        user_id: userId || null,
        metrics_payload: {
          action: 'create_variant',
          total_variants: variants.length + 1
        }
      });

      onAction?.('variant_created');
      
    } catch (error) {
      console.error('Variant creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchVariant = async (variantId: string) => {
    try {
      await recordAbEvent({
        template_id: templateId,
        variant_id: variantId,
        event_type: 'switch',
        user_id: userId,
        platform
      });
      
      setActiveVariant(variantId);
      onAction?.('variant_switched');
    } catch (error) {
      console.error('Variant switch error:', error);
    }
  };

  const handlePromoteVariant = async (variantId: string) => {
    try {
      const response = await fetch('/api/templates/promote-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          variantId,
          userId
        })
      });

      if (response.ok) {
        await recordAbEvent({
          template_id: templateId,
          variant_id: variantId,
          event_type: 'promote',
          user_id: userId,
          platform
        });
        
        onAction?.('variant_promoted');
      }
    } catch (error) {
      console.error('Variant promotion error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" role="tabpanel" aria-label="A/B Test panel">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">A/B Testing</h3>
        <p className="text-sm text-muted-foreground">
          Create and compare content variants for optimal performance
        </p>
      </div>

      {/* Test status */}
      <div className="p-3 rounded-lg border bg-card text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Test Status</span>
          <Badge variant={variants.some(v => v.status === 'running') ? "default" : "secondary"}>
            {variants.some(v => v.status === 'running') ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {variants.length} variant{variants.length !== 1 ? 's' : ''} created
          {activeVariant && ` • Active: ${variants.find(v => v.id === activeVariant)?.name || 'Unknown'}`}
        </div>
      </div>

      {/* Variants list */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Variants</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {variants.map((variant) => (
              <div key={variant.id} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{variant.name}</span>
                    {variant.id === activeVariant && (
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    )}
                    <Badge 
                      variant={variant.status === 'running' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {variant.status}
                    </Badge>
                  </div>
                  {variant.performance && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {variant.performance.virality_score.toFixed(1)} • 
                      Engagement: {variant.performance.engagement}%
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  {variant.id !== activeVariant && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSwitchVariant(variant.id)}
                      className="h-6 px-2"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  {variant.performance && variant.performance.virality_score > 7 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePromoteVariant(variant.id)}
                      className="h-6 px-2"
                    >
                      <Trophy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance insights */}
      {variants.some(v => v.performance) && (
        <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Performance Insights</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {(() => {
              const bestVariant = variants
                .filter(v => v.performance)
                .sort((a, b) => (b.performance!.virality_score - a.performance!.virality_score))[0];
              
              return bestVariant 
                ? `${bestVariant.name} is performing best with ${bestVariant.performance!.virality_score.toFixed(1)} viral score`
                : "Collecting performance data...";
            })()}
          </div>
        </div>
      )}

      {/* Primary CTA */}
      <div className="space-y-2 pt-2 border-t">
        <Button 
          className="w-full" 
          onClick={handleCreateVariant}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Variant...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Variant
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          asChild
        >
          <a href={deepLink} aria-label="Open full A/B testing view">
            <GitBranch className="h-4 w-4 mr-2" />
            Manage A/B Tests
          </a>
        </Button>
      </div>
    </div>
  );
}

