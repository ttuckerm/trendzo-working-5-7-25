"use client"

import { cn } from "@/lib/utils"

// Basic chart interfaces
interface ChartProps {
  data: any[]
  width?: number
  height?: number
  xAccessor: (d: any) => any
  yAccessor: (d: any) => number
  color?: string
  xLabel?: string
  yLabel?: string
  className?: string
}

// Simple line chart without D3
export function LineChart({
  data,
  width = 600,
  height = 300,
  xAccessor,
  yAccessor,
  color = '#3b82f6',
  xLabel,
  yLabel,
  className = '',
}: ChartProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div 
        className="p-6 bg-muted/30 rounded-lg text-center"
        style={{ width, height }}
      >
        <div className="flex flex-col h-full justify-center items-center">
          <div className="text-2xl font-bold text-muted-foreground mb-2">Line Chart Placeholder</div>
          <div className="text-sm text-muted-foreground">
            {data.length} data points would be displayed here
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple bar chart without D3
export function BarChart({
  data,
  width = 600,
  height = 300,
  xAccessor,
  yAccessor,
  color = '#3b82f6',
  className = '',
}: ChartProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div 
        className="p-6 bg-muted/30 rounded-lg text-center"
        style={{ width, height }}
      >
        <div className="flex flex-col h-full justify-center items-center">
          <div className="text-2xl font-bold text-muted-foreground mb-2">Bar Chart Placeholder</div>
          <div className="text-sm text-muted-foreground">
            {data.length} data points would be displayed here
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple pie chart without D3
interface PieChartProps {
  data: { name: string; value: number; color?: string }[]
  width?: number
  height?: number
  innerRadius?: number
  className?: string
}

export function PieChart({
  data,
  width = 400,
  height = 400,
  innerRadius = 0,
  className = '',
}: PieChartProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div 
        className="p-6 bg-muted/30 rounded-lg text-center"
        style={{ width, height }}
      >
        <div className="flex flex-col h-full justify-center items-center">
          <div className="text-2xl font-bold text-muted-foreground mb-2">Pie Chart Placeholder</div>
          <div className="text-sm text-muted-foreground">
            {data.length} segments would be displayed here
          </div>
        </div>
      </div>
    </div>
  )
} 