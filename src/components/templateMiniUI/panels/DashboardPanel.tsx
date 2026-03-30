"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Users, BarChart3 } from "lucide-react";

interface DashboardPanelProps {
  templateId: string;
  onAction?: (action: string) => void;
}

export function DashboardPanel({ templateId, onAction }: DashboardPanelProps) {
  const deepLink = `/membership/viral-recipe-book?tab=dashboard&templateId=${templateId}`;

  return (
    <div className="space-y-4" role="tabpanel" aria-label="Dashboard panel">
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Performance Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          Track metrics, engagement, and performance across platforms
        </p>
      </div>

      {/* Quick metrics preview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium">Viral Score</span>
          </div>
          <div className="text-lg font-bold">8.2/10</div>
        </div>
        
        <div className="p-3 rounded-lg border bg-card text-card-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium">Est. Reach</span>
          </div>
          <div className="text-lg font-bold">45K</div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Updated 2 hours ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">A/B test scheduled</span>
          </div>
        </div>
      </div>

      {/* Platform status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Platform Status</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">TikTok Ready</Badge>
          <Badge variant="outline" className="text-xs">Instagram Pending</Badge>
          <Badge variant="outline" className="text-xs">YouTube Draft</Badge>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-2 border-t">
        <Button 
          className="w-full" 
          onClick={() => onAction?.('open_dashboard')}
          asChild
        >
          <a href={deepLink} aria-label="Open full dashboard view">
            Open Full Dashboard
          </a>
        </Button>
      </div>
    </div>
  );
}

