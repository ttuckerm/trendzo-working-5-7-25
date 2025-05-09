'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addDays, subDays, subMonths, subYears } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeframeSelectorProps {
  timeRange: { startDate: Date; endDate: Date };
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  onTimeframeChange: (range: { startDate: Date; endDate: Date }) => void;
  onGranularityChange: (granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly') => void;
}

export default function TimeframeSelector({
  timeRange,
  granularity,
  onTimeframeChange,
  onGranularityChange,
}: TimeframeSelectorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // Quick timeframe options
  const quickTimeframes = [
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
    { label: 'Last 6 months', value: 180 },
    { label: 'Last year', value: 365 },
    { label: 'All time', value: 1095 } // ~3 years
  ];
  
  const handleQuickTimeframeSelect = (days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    onTimeframeChange({ startDate, endDate });
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger>
          <Button 
            variant="outline" 
            className={cn(
              "w-[240px] justify-between text-left font-normal",
              !timeRange.startDate && "text-gray-500"
            )}
          >
            <CalendarIcon className="h-4 w-4 opacity-50" />
            {timeRange.startDate ? format(timeRange.startDate, "PPP") : "Select timeframe"}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col p-2 gap-2">
            <h4 className="font-medium">Quick Select</h4>
            <div className="flex flex-col gap-1">
              {quickTimeframes.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickTimeframeSelect(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Select
        value={granularity}
        onValueChange={(value) => 
          onGranularityChange(value as 'daily' | 'weekly' | 'monthly' | 'quarterly')
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select granularity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="quarterly">Quarterly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 