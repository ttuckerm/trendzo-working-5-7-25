"use client";

import { useState } from 'react';
import { ManualAdjustmentLog } from '@/lib/types/trendingTemplate';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { User } from 'lucide-react';

interface ExpertAdjustmentHistoryProps {
  adjustments: ManualAdjustmentLog[];
  onSelectAdjustment?: (adjustment: ManualAdjustmentLog) => void;
}

function getCategoryColor(category: string | undefined): string {
  if (!category) return 'bg-gray-100';
  switch (category.toLowerCase()) {
    case 'growth':
      return 'bg-green-100';
    case 'engagement':
      return 'bg-blue-100';
    case 'audience':
      return 'bg-purple-100';
    case 'content':
      return 'bg-yellow-100';
    default:
      return 'bg-gray-100';
  }
}

function getConfidenceColor(confidence: number | undefined): string {
  if (confidence === undefined) return 'bg-gray-100';
  if (confidence >= 0.8) return 'bg-green-100';
  if (confidence >= 0.5) return 'bg-yellow-100';
  return 'bg-red-100';
}

export default function ExpertAdjustmentHistory({
  adjustments,
  onSelectAdjustment
}: ExpertAdjustmentHistoryProps) {
  const [selectedId, setSelectedId] = useState<string>();
  
  const handleSelect = (adjustment: ManualAdjustmentLog) => {
    setSelectedId(adjustment.id);
    onSelectAdjustment?.(adjustment);
  };
  
  if (!adjustments?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No expert adjustments have been made yet.
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {adjustments.map((adjustment) => (
          <Card
            key={adjustment.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedId === adjustment.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSelect(adjustment)}
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col space-y-2">
                <CardTitle className="text-sm font-medium">
                  {adjustment.field}
                </CardTitle>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(adjustment.adjustedAt), { addSuffix: true })}
                  </div>
                  <div className="text-sm font-medium">
                    Expert Confidence: {adjustment.expertConfidence ? Math.round(adjustment.expertConfidence * 100) : 0}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {adjustment.reason}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-red-50 p-2 rounded">
                    <div className="font-medium text-red-600 text-xs">Previous</div>
                    <div className="mt-1 text-sm break-words">
                      {typeof adjustment.previousValue === 'object' 
                        ? JSON.stringify(adjustment.previousValue) 
                        : String(adjustment.previousValue)}
                    </div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-medium text-green-600 text-xs">New</div>
                    <div className="mt-1 text-sm break-words">
                      {typeof adjustment.newValue === 'object' 
                        ? JSON.stringify(adjustment.newValue) 
                        : String(adjustment.newValue)}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2">
                  {adjustment.expertConfidence !== undefined && (
                    <Badge variant="secondary" className={getConfidenceColor(adjustment.expertConfidence)}>
                      {`${Math.round(adjustment.expertConfidence * 100)}% Confidence`}
                    </Badge>
                  )}
                  {adjustment.dataSource && (
                    <Badge variant="outline">
                      {adjustment.dataSource}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="text-xs flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                <span>Adjusted by {adjustment.adjustedBy}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
} 