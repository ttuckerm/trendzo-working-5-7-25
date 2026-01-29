"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Loader2, Brain, Wand2 } from "lucide-react";
import { logTemplateEvent } from "../events";

interface InceptionPanelProps {
  templateId: string;
  platform: string;
  userId?: string;
  onAction?: (action: string) => void;
}

export function InceptionPanel({ templateId, platform, userId, onAction }: InceptionPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneration, setLastGeneration] = useState<{
    timestamp: Date;
    ideas: number;
    tokensUsed: number;
  } | null>(null);

  const deepLink = `/membership/viral-recipe-book?tab=inception&templateId=${templateId}`;

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    
    try {
      // Call AI content generation API with token meter respect
      const response = await fetch('/api/templates/generate-inception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          platform,
          userId,
          type: 'content_variants'
        })
      });

      if (!response.ok) {
        throw new Error('Inception generation failed');
      }

      const result = await response.json();
      
      // Log telemetry
      await logTemplateEvent({
        event_type: 'apply_fix',
        template_id: templateId,
        platform,
        user_id: userId || null,
        metrics_payload: {
          action: 'generate_inception_content',
          tokens_used: result.tokensUsed || 0,
          ideas_generated: result.ideas?.length || 0,
          generation_type: 'content_variants'
        }
      });

      setLastGeneration({
        timestamp: new Date(),
        ideas: result.ideas?.length || 0,
        tokensUsed: result.tokensUsed || 0
      });

      onAction?.('inception_generated');
      
    } catch (error) {
      console.error('Inception generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4" role="tabpanel" aria-label="Inception panel">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">AI Content Inception</h3>
        <p className="text-sm text-muted-foreground">
          Generate viral content ideas and variations powered by AI
        </p>
      </div>

      {/* Generation status */}
      <div className="p-3 rounded-lg border bg-card text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Generation Status</span>
          <Badge variant="outline" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          AI models trained on viral {platform} content patterns
        </div>
      </div>

      {/* Content types */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Available Generators</h4>
        <div className="space-y-2">
          <div className="p-2 rounded border bg-muted/20">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <div className="text-xs font-medium">Hook Variations</div>
                <div className="text-xs text-muted-foreground">Generate alternative hooks and openings</div>
              </div>
            </div>
          </div>
          
          <div className="p-2 rounded border bg-muted/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <div className="text-xs font-medium">Content Angles</div>
                <div className="text-xs text-muted-foreground">Explore different story perspectives</div>
              </div>
            </div>
          </div>

          <div className="p-2 rounded border bg-muted/20">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <div className="text-xs font-medium">Platform Adaptations</div>
                <div className="text-xs text-muted-foreground">Optimize for different platforms</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation insights */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Inception Insights</h4>
        <div className="text-xs text-muted-foreground">
          {platform === 'tiktok' && "TikTok inception focuses on trending sounds and viral formats"}
          {platform === 'instagram' && "Instagram inception leverages visual storytelling and engagement patterns"}
          {platform === 'youtube' && "YouTube inception emphasizes clickable titles and thumbnail concepts"}
        </div>
      </div>

      {/* Last generation result */}
      {lastGeneration && (
        <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Last Generation</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Generated {lastGeneration.ideas} idea{lastGeneration.ideas !== 1 ? 's' : ''} • {lastGeneration.tokensUsed} tokens used
          </div>
          <div className="text-xs text-muted-foreground">
            {lastGeneration.timestamp.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Token usage info */}
      <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">AI Generation</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Est. token usage: 800-1200 tokens per generation
        </div>
        <div className="text-xs text-muted-foreground">
          Generates 5-8 content variations
        </div>
      </div>

      {/* Primary CTA */}
      <div className="space-y-2 pt-2 border-t">
        <Button 
          className="w-full" 
          onClick={handleGenerateContent}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Ideas...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Content
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          asChild
        >
          <a href={deepLink} aria-label="Open full inception view">
            <Lightbulb className="h-4 w-4 mr-2" />
            Inception Studio
          </a>
        </Button>
      </div>
    </div>
  );
}

