"use client"

import React from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-component'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp, BarChart2, ArrowDownRight, Clock } from 'lucide-react'

interface SoundLifecycleProps {
  soundId: string
  className?: string
}

interface LifecycleStage {
  name: string
  color: string
  icon: React.ReactNode
  description: string
}

// Lifecycle stages with their information
const lifecycleStages: Record<string, LifecycleStage> = {
  emerging: {
    name: 'Emerging',
    color: 'border-blue-500 bg-blue-100 text-blue-800',
    icon: <Zap className="h-4 w-4" />,
    description: 'Early adoption phase with rapid growth potential'
  },
  growing: {
    name: 'Growing',
    color: 'border-green-500 bg-green-100 text-green-800',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Consistent growth with increasing adoption'
  },
  peaking: {
    name: 'Peaking',
    color: 'border-yellow-500 bg-yellow-100 text-yellow-800',
    icon: <BarChart2 className="h-4 w-4" />,
    description: 'Maximum reach and engagement'
  },
  declining: {
    name: 'Declining',
    color: 'border-red-500 bg-red-100 text-red-800',
    icon: <ArrowDownRight className="h-4 w-4" />,
    description: 'Decreasing adoption and engagement'
  },
  stable: {
    name: 'Stable',
    color: 'border-purple-500 bg-purple-100 text-purple-800',
    icon: <Clock className="h-4 w-4" />,
    description: 'Consistent usage without significant changes'
  }
}

// Sample lifecycle trajectory data (in a real app, this would come from an API)
const sampleLifecycleData = [
  { day: 1, usage: 10, stage: 'emerging' },
  { day: 5, usage: 45, stage: 'emerging' },
  { day: 10, usage: 120, stage: 'growing' },
  { day: 15, usage: 230, stage: 'growing' },
  { day: 20, usage: 380, stage: 'growing' },
  { day: 25, usage: 520, stage: 'peaking' },
  { day: 30, usage: 580, stage: 'peaking' },
  { day: 35, usage: 610, stage: 'peaking' },
  { day: 40, usage: 590, stage: 'peaking' },
  { day: 45, usage: 540, stage: 'declining' },
  { day: 50, usage: 480, stage: 'declining' },
  { day: 55, usage: 420, stage: 'declining' },
  { day: 60, usage: 390, stage: 'stable' },
  { day: 65, usage: 405, stage: 'stable' },
  { day: 70, usage: 385, stage: 'stable' }
]

// Create stage transition points for the chart
const stageTransitions = sampleLifecycleData.reduce((acc, point, index, arr) => {
  // If this is the first point of a new stage, add it as a transition
  if (index > 0 && point.stage !== arr[index-1].stage) {
    acc.push({
      day: point.day,
      stage: point.stage,
      prevStage: arr[index-1].stage
    })
  }
  return acc
}, [] as Array<{day: number, stage: string, prevStage: string}>)

export default function SoundLifecycleChart({ soundId, className = "" }: SoundLifecycleProps) {
  const [currentStage, setCurrentStage] = React.useState<string>('growing')
  const [lifecycleData, setLifecycleData] = React.useState(sampleLifecycleData)
  
  // In a real application, we would fetch the lifecycle data using the soundId
  React.useEffect(() => {
    // This is where you would fetch real data
    // For now, using the sample data and setting a random current stage
    const stages = ['emerging', 'growing', 'peaking', 'declining', 'stable']
    const randomStage = stages[Math.floor(Math.random() * 3)] // Only pick from first 3 stages for demo
    setCurrentStage(randomStage)
  }, [soundId])
  
  // Helper to get stage color for the line chart
  const getStageColor = (stage: string) => {
    const stageMap: Record<string, string> = {
      emerging: '#3b82f6',
      growing: '#10b981',
      peaking: '#f59e0b',
      declining: '#ef4444',
      stable: '#8b5cf6'
    }
    return stageMap[stage] || '#6b7280'
  }
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-md border shadow-sm">
          <p className="text-sm font-medium">Day {label}</p>
          <p className="text-sm">Usage: {payload[0].value}</p>
          <p className="text-sm capitalize">
            Stage: {data.stage}
          </p>
        </div>
      )
    }
    return null
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Sound Lifecycle Analysis</CardTitle>
        <CardDescription>
          Track how this sound is progressing through its lifecycle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="font-medium mr-2">Current Stage:</span>
            <Badge className={lifecycleStages[currentStage].color}>
              <span className="mr-1">{lifecycleStages[currentStage].icon}</span>
              {lifecycleStages[currentStage].name}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {lifecycleStages[currentStage].description}
          </p>
        </div>
        
        <div className="h-[300px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lifecycleData}
              margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis 
                dataKey="day" 
                label={{ 
                  value: 'Days', 
                  position: 'bottom',
                  offset: 0
                }} 
              />
              <YAxis 
                label={{ 
                  value: 'Usage', 
                  angle: -90, 
                  position: 'insideLeft',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Add reference lines for stage transitions */}
              {stageTransitions.map((transition, index) => (
                <ReferenceLine
                  key={index}
                  x={transition.day}
                  stroke={getStageColor(transition.stage)}
                  strokeDasharray="3 3"
                  strokeWidth={2}
                >
                  <Label
                    value={`${lifecycleStages[transition.stage].name}`}
                    position="top"
                    fill={getStageColor(transition.stage)}
                    fontSize={12}
                  />
                </ReferenceLine>
              ))}
              
              {/* Create a separate line segment for each lifecycle stage */}
              {['emerging', 'growing', 'peaking', 'declining', 'stable'].map(stage => {
                const stageData = lifecycleData.filter(point => point.stage === stage)
                if (stageData.length === 0) return null
                
                return (
                  <Line
                    key={stage}
                    type="monotone"
                    data={stageData}
                    dataKey="usage"
                    stroke={getStageColor(stage)}
                    strokeWidth={3}
                    dot={{ fill: getStageColor(stage), r: 6 }}
                    activeDot={{ r: 8 }}
                    name={lifecycleStages[stage].name}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 grid grid-cols-5 gap-2">
          {Object.entries(lifecycleStages).map(([stage, info]) => (
            <div 
              key={stage} 
              className={`p-2 rounded text-center ${
                currentStage === stage ? 'border-2 ' + info.color : 'border bg-gray-50'
              }`}
            >
              <div className="flex justify-center mb-1">
                {info.icon}
              </div>
              <div className="text-xs font-medium">{info.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 