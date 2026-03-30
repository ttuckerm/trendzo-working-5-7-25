"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Zap, Loader2 } from "lucide-react";
import { logTemplateEvent } from "../events";

interface ScriptsPanelProps {
  templateId: string;
  platform: string;
  userId?: string;
  onAction?: (action: string) => void;
}

export function ScriptsPanel({ templateId, platform, userId, onAction }: ScriptsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const deepLink = `/membership/viral-recipe-book?tab=scripts&templateId=${templateId}`;

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    
    try {
      // Call existing script API with token meter respect
      const response = await fetch('/api/templates/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          platform,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Script generation failed');
      }

      const result = await response.json();
      
      // Log telemetry
      await logTemplateEvent({
        event_type: 'apply_fix',
        template_id: templateId,
        platform,
        user_id: userId || null,
        metrics_payload: {
          action: 'generate_script',
          tokens_used: result.tokensUsed || 0,
          script_length: result.script?.length || 0
        }
      });

      onAction?.('script_generated');
      
    } catch (error) {
      console.error('Script generation error:', error);
      // Handle error UI feedback
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4" role="tabpanel" aria-label="Scripts panel">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Script Generation</h3>
        <p className="text-sm text-muted-foreground">
          AI-powered script creation optimized for {platform}
        </p>
      </div>

      {/* Script status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Status</span>
          <Badge variant="outline" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Draft Ready
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Est. generation time: 30s</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Token usage: ~500 tokens</span>
          </div>
        </div>
      </div>

      {/* Script templates preview */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Available Templates</h4>
        <div className="space-y-1">
          <div className="p-2 rounded border bg-muted/20">
            <div className="text-xs font-medium">Viral Hook Script</div>
            <div className="text-xs text-muted-foreground">Perfect for attention-grabbing openings</div>
          </div>
          <div className="p-2 rounded border bg-muted/20">
            <div className="text-xs font-medium">Storytelling Arc</div>
            <div className="text-xs text-muted-foreground">Complete narrative structure</div>
          </div>
        </div>
      </div>

      {/* Generation metrics */}
      <div className="p-3 rounded-lg border bg-card text-card-foreground">
        <div className="text-xs font-medium mb-1">Generation Insights</div>
        <div className="text-xs text-muted-foreground">
          Scripts generated today: 3/10 (token limit)
        </div>
      </div>

      {/* Primary CTA */}
      <div className="space-y-2 pt-2 border-t">
        <Button 
          className="w-full" 
          onClick={handleGenerateScript}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Script...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Draft Script
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          asChild
        >
          <a href={deepLink} aria-label="Open full scripts view">
            View All Scripts
          </a>
        </Button>
      </div>
    </div>
  );
}

