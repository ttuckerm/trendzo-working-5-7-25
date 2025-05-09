"use client"

import { useEffect, useRef } from 'react'
// Comment out D3 import until we resolve the issue
// import * as d3 from 'd3'
import { cn } from "@/lib/utils"

interface ChartProps {
  data: any[]
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  xAccessor: (d: any) => any
  yAccessor: (d: any) => number
  color?: string
  xLabel?: string
  yLabel?: string
  className?: string
}

export function LineChart({
  data,
  width = 600,
  height = 300,
  margin = { top: 20, right: 30, bottom: 40, left: 50 },
  xAccessor,
  yAccessor,
  color = '#3b82f6',
  xLabel,
  yLabel,
  className = '',
}: ChartProps) {
  // Temporary simplified implementation until we fix D3
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div 
        className="p-6 bg-muted/30 rounded-lg text-center"
        style={{ width, height }}
      >
        <div className="flex flex-col h-full justify-center items-center">
          <div className="text-2xl font-bold text-muted-foreground mb-2">Line Chart</div>
          <div className="text-sm text-muted-foreground">
            {data.length} data points would be displayed here
          </div>
          {xLabel && (
            <div className="text-xs text-muted-foreground mt-4">
              X-Axis: {xLabel}
            </div>
          )}
          {yLabel && (
            <div className="text-xs text-muted-foreground">
              Y-Axis: {yLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function BarChart({
  data,
  width = 600,
  height = 300,
  margin = { top: 20, right: 30, bottom: 60, left: 50 },
  xAccessor,
  yAccessor,
  color = '#3b82f6',
  xLabel,
  yLabel,
  className = '',
}: ChartProps) {
  // Temporary simplified implementation until we fix D3
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div 
        className="p-6 bg-muted/30 rounded-lg text-center"
        style={{ width, height }}
      >
        <div className="flex flex-col h-full justify-center items-center">
          <div className="text-2xl font-bold text-muted-foreground mb-2">Bar Chart</div>
          <div className="text-sm text-muted-foreground">
            {data.length} data points would be displayed here
          </div>
          {xLabel && (
            <div className="text-xs text-muted-foreground mt-4">
              X-Axis: {xLabel}
            </div>
          )}
          {yLabel && (
            <div className="text-xs text-muted-foreground">
              Y-Axis: {yLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
  // Temporary simplified implementation until we fix D3
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div 
        className="p-6 bg-muted/30 rounded-lg text-center"
        style={{ width, height }}
      >
        <div className="flex flex-col h-full justify-center items-center">
          <div className="text-2xl font-bold text-muted-foreground mb-2">Pie Chart</div>
          <div className="text-sm text-muted-foreground">
            {data.length} segments would be displayed here
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            Inner Radius: {innerRadius}
          </div>
        </div>
      </div>
    </div>
  )
} 