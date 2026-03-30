"use client"

import { LineChart as D3LineChart } from './charts'
import { LineChart as SimpleLineChart, BarChart as SimpleBarChart, PieChart as SimplePieChart } from './simple-charts'
import { cn } from '@/lib/utils'

// Flexible ChartProps interface that combines both requirements
export interface ChartProps {
  data: any[]
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  xAccessor?: (d: any) => any
  yAccessor?: (d: any) => number
  color?: string
  xLabel?: string
  yLabel?: string
  className?: string
  // Add any other props you need
}

// Wrapper for LineChart that safely handles different implementations
export function LineChart({
  data,
  width = 600,
  height = 300,
  xAccessor = (d) => d.date,
  yAccessor = (d) => d.value,
  color = '#3b82f6',
  xLabel,
  yLabel,
  className = '',
  ...rest
}: ChartProps) {
  try {
    // Try to use D3 implementation
    return (
      <D3LineChart
        data={data}
        width={width}
        height={height}
        xAccessor={xAccessor}
        yAccessor={yAccessor}
        color={color}
        xLabel={xLabel}
        yLabel={yLabel}
        className={className}
        {...rest}
      />
    )
  } catch (error) {
    console.warn('Failed to render D3 chart, falling back to simple chart:', error)
    // Fallback to simple implementation
    return (
      <SimpleLineChart
        data={data}
        width={width}
        height={height}
        xAccessor={xAccessor}
        yAccessor={yAccessor}
        color={color}
        xLabel={xLabel}
        yLabel={yLabel}
        className={className}
        {...rest}
      />
    )
  }
}

// Re-export the simple charts for now
export { SimpleBarChart as BarChart, SimplePieChart as PieChart } 