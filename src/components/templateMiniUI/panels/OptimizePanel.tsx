"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Zap, Loader2, ArrowUp, Sparkles } from "lucide-react";
import { trimHashtagsToPlatformLimit, seedFirst3sCue, runOptimizationPipeline, applyFix } from "../fixes";
import { publishSlotUpdate } from "../signalBridge";
import type { TemplateSlotsState } from "../store";
import type { EditingCoachResult, EditChange } from "@/lib/rubric-engine/editing-coach-types";

interface OptimizePanelProps {
  templateId: string;
  platform: string;
  slots: TemplateSlotsState;
  userId?: string;
  onSlotsUpdate?: (slots: Partial<TemplateSlotsState>) => void;
  onAction?: (action: string) => void;
  /** Pack 2 (Editing Coach) results for AI-driven content fixes */
  pack2Results?: EditingCoachResult | null;
}

export function OptimizePanel({
  templateId,
  platform,
  slots,
  userId,
  onSlotsUpdate,
  onAction,
  pack2Results
}: OptimizePanelProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimization, setLastOptimization] = useState<{
    timestamp: Date;
    fixes: number;
    tokensUsed: number;
  } | null>(null);

  const deepLink = `/membership/viral-recipe-book?tab=optimization&templateId=${templateId}`;

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    try {
      // Run optimization pipeline
      const result = runOptimizationPipeline(slots, platform);
      
      if (result.fixes.length === 0) {
        // No fixes needed
        setLastOptimization({
          timestamp: new Date(),
          fixes: 0,
          tokensUsed: 0
        });
        onAction?.('optimization_complete');
        return;
      }

      // Apply fixes
      const updatedSlots: Partial<TemplateSlotsState> = {};
      
      for (const { id, result: fixResult } of result.fixes) {
        if (fixResult.success && fixResult.newValue !== undefined) {
          // Log telemetry for each fix
          await applyFix(id, fixResult, {
            templateId,
            platform,
            userId
          });

          // Apply the fix to slots
          if (id === 'trim_hashtags' || id === 'optimize_hashtags') {
            updatedSlots.hashtags = fixResult.newValue as string[];
          } else if (id === 'seed_first3s') {
            updatedSlots.first3sCue = fixResult.newValue as string;
          }
        }
      }

      // Update slots if any changes were made
      if (Object.keys(updatedSlots).length > 0) {
        onSlotsUpdate?.(updatedSlots);

        // Publish signals for each updated slot
        for (const [slotName, value] of Object.entries(updatedSlots)) {
          await publishSlotUpdate({
            templateId,
            slot: slotName as keyof TemplateSlotsState,
            value,
            ts: Date.now(),
            source: 'optimize'
          });
        }
      }

      setLastOptimization({
        timestamp: new Date(),
        fixes: result.fixes.length,
        tokensUsed: result.totalTokens
      });

      onAction?.('optimization_complete');
      
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Analyze potential optimizations
  const potentialIssues = [
    ...(slots.hashtags.length > (platform === 'tiktok' ? 3 : platform === 'instagram' ? 5 : 15) ? 
      [{ type: 'hashtags', severity: 'warning', message: 'Too many hashtags for platform' }] : []),
    ...(!slots.first3sCue || slots.first3sCue.trim().length === 0 ? 
      [{ type: 'first3s', severity: 'error', message: 'Missing first 3s cue' }] : []),
    ...(slots.hashtags.some(tag => /^#(viral|trending|like|follow)$/i.test(tag)) ? 
      [{ type: 'generic-hashtags', severity: 'info', message: 'Generic hashtags detected' }] : [])
  ];

  return (
    <div className="space-y-4" role="tabpanel" aria-label="Optimize panel">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Content Optimization</h3>
        <p className="text-sm text-muted-foreground">
          AI-powered fixes to maximize viral potential
        </p>
      </div>

      {/* Optimization score */}
      <div className="p-3 rounded-lg border bg-card text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Optimization Score</span>
          <Badge variant={potentialIssues.length === 0 && (!pack2Results?.changes?.length) ? "default" : "secondary"}>
            {potentialIssues.length === 0 && (!pack2Results?.changes?.length)
              ? "Perfect"
              : `${Math.max(0, 10 - potentialIssues.length * 2 - (pack2Results?.changes?.length || 0))}/10`
            }
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {potentialIssues.length === 0 && (!pack2Results?.changes?.length)
            ? "Your content is fully optimized!"
            : `${potentialIssues.length + (pack2Results?.changes?.length || 0)} optimization${(potentialIssues.length + (pack2Results?.changes?.length || 0)) > 1 ? 's' : ''} available`
          }
        </div>
      </div>

      {/* Issues found */}
      {potentialIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Optimization Opportunities</h4>
          <div className="space-y-2">
            {potentialIssues.slice(0, 3).map((issue, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded border bg-muted/20">
                {issue.severity === 'error' && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />}
                {issue.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                {issue.severity === 'info' && <ArrowUp className="h-4 w-4 text-blue-500 mt-0.5" />}
                <div className="flex-1">
                  <div className="text-xs font-medium capitalize">{issue.type.replace('-', ' ')}</div>
                  <div className="text-xs text-muted-foreground">{issue.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pack 2 AI Coaching Fixes */}
      {pack2Results && pack2Results.changes && pack2Results.changes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h4 className="text-sm font-medium">AI Coach Suggestions</h4>
            <Badge variant="secondary" className="text-xs">
              +{Math.round(pack2Results.predicted_after_estimate - pack2Results.predicted_before)} DPS
            </Badge>
          </div>
          <div className="space-y-2">
            {pack2Results.changes.map((change: EditChange, index: number) => (
              <div key={index} className="p-3 rounded-lg border bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">
                    {change.priority}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{change.what_to_change}</div>
                    <div className="text-xs text-muted-foreground mt-1">{change.how_to_change}</div>
                    {change.example && (
                      <div className="text-xs mt-2 p-2 rounded bg-muted/30 italic">
                        "{change.example}"
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        +{change.estimated_lift.toFixed(1)} DPS
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(change.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {pack2Results.notes && (
            <div className="text-xs text-muted-foreground p-2 rounded bg-muted/20">
              💡 {pack2Results.notes}
            </div>
          )}
        </div>
      )}

      {/* Last optimization result */}
      {lastOptimization && (
        <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Last Optimization</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {lastOptimization.fixes === 0 
              ? "No issues found - content is optimized!"
              : `Applied ${lastOptimization.fixes} fix${lastOptimization.fixes > 1 ? 'es' : ''} • ${lastOptimization.tokensUsed} tokens`
            }
          </div>
          <div className="text-xs text-muted-foreground">
            {lastOptimization.timestamp.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Optimization insights */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Platform Insights</h4>
        <div className="text-xs text-muted-foreground">
          {platform === 'tiktok' && "TikTok favors quick hooks and concise messaging"}
          {platform === 'instagram' && "Instagram rewards visual storytelling and engagement"}
          {platform === 'youtube' && "YouTube prioritizes thumbnail impact and longer-form content"}
        </div>
      </div>

      {/* Primary CTA */}
      <div className="space-y-2 pt-2 border-t">
        <Button 
          className="w-full" 
          onClick={handleOptimize}
          disabled={isOptimizing}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Apply 1-Click Fix
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          asChild
        >
          <a href={deepLink} aria-label="Open full optimization view">
            Advanced Optimization
          </a>
        </Button>
      </div>
    </div>
  );
}

