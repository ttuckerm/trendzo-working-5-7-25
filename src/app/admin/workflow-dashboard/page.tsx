'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Zap,
  Eye,
  ArrowRight
} from 'lucide-react';
import { UnifiedShell } from '@/components/unified-shell/UnifiedShell';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  interfaces: string[];
  duration: string;
  objectives: number[];
  status: 'pending' | 'in_progress' | 'completed';
  timeStarted?: string;
}

interface ObjectiveMapping {
  id: number;
  title: string;
  interface: string;
  url: string;
  status: 'not_tested' | 'tested_today' | 'needs_attention';
  lastTested?: string;
  testCount: number;
}

/**
 * Systematic Daily Workflow Dashboard
 * Guides users through cyclical optimization workflow for all 13 objectives
 */
export default function WorkflowDashboard() {
  const [currentWorkflow, setCurrentWorkflow] = useState<string | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveMapping[]>([]);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);

  // 13 Objectives Mapping
  const objectiveMappings: ObjectiveMapping[] = [
    {
      id: 1,
      title: "Automated Viral Template Discovery",
      interface: "Recipe Book",
      url: "/admin/recipe-book",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 2,
      title: "Instant Content Analysis Engine",
      interface: "Studio Analyzer",
      url: "/admin/studio",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 3,
      title: "Prediction Validation System (≥90% Accuracy)",
      interface: "Prediction Validation",
      url: "/admin/prediction-validation",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 4,
      title: "Fully Automated 24/7 Pipeline",
      interface: "Engine Room",
      url: "/admin/engine-room",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 5,
      title: "Exponential Learning System",
      interface: "System Intelligence",
      url: "/admin/command-center",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 6,
      title: "Script Intelligence Integration",
      interface: "Script Intelligence",
      url: "/admin/viral-recipe-book",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 7,
      title: "Cross-Platform Intelligence",
      interface: "Command Center",
      url: "/admin/command-center",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 8,
      title: "AI-Powered R&D Layer (MCP Integration)",
      interface: "AI R&D Layer",
      url: "/admin/engine-room",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 9,
      title: "Process Intelligence Layer",
      interface: "Process Intelligence",
      url: "/admin/command-center",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 10,
      title: "Algorithm Adaptation Engine",
      interface: "Algorithm Adaptation",
      url: "/admin/engine-room",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 11,
      title: "Marketing Inception",
      interface: "Marketing Inception",
      url: "/admin/command-center",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 12,
      title: "Defensible Moat Creation",
      interface: "Defensive Moat",
      url: "/admin/engine-room",
      status: 'not_tested',
      testCount: 0
    },
    {
      id: 13,
      title: "Scale From Zero Demonstration",
      interface: "Scale From Zero",
      url: "/admin/engine-room",
      status: 'not_tested',
      testCount: 0
    }
  ];

  // Daily Cyclical Workflow Steps
  const dailyWorkflowSteps: WorkflowStep[] = [
    {
      id: 'discovery',
      title: '🌅 Discovery & Acquisition',
      description: 'Review new viral templates and validate framework algorithms',
      interfaces: ['Recipe Book', 'Studio TikTok Scraper'],
      duration: '60 minutes',
      objectives: [1, 4],
      status: 'pending'
    },
    {
      id: 'analysis',
      title: '🔍 Pattern Analysis',
      description: 'Deep viral DNA extraction and multi-dimensional analysis',
      interfaces: ['Viral Recipe Book Analyzer', 'Studio Instant Analysis'],
      duration: '60 minutes',
      objectives: [2, 6, 7],
      status: 'pending'
    },
    {
      id: 'creation',
      title: '🎬 Content Creation & Replication',
      description: 'Test AI-powered script generation and content replication',
      interfaces: ['Studio Script Intelligence', 'Viral Recipe Book'],
      duration: '60 minutes',
      objectives: [6, 2],
      status: 'pending'
    },
    {
      id: 'validation',
      title: '📊 Prediction & Validation',
      description: 'Generate viral probability scores and track performance',
      interfaces: ['Prediction Validation', 'Studio Analysis'],
      duration: '60 minutes',
      objectives: [3],
      status: 'pending'
    },
    {
      id: 'intelligence',
      title: '🧠 Learning & Intelligence Amplification',
      description: 'Review exponential learning metrics and system evolution',
      interfaces: ['Engine Room AI R&D', 'Command Center'],
      duration: '60 minutes',
      objectives: [5, 8, 9, 10],
      status: 'pending'
    },
    {
      id: 'optimization',
      title: '📈 Performance Review & Optimization',
      description: 'Daily accuracy assessment and optimization planning',
      interfaces: ['All Interfaces - Systematic Review'],
      duration: '60 minutes',
      objectives: [11, 12, 13],
      status: 'pending'
    }
  ];

  useEffect(() => {
    setWorkflowSteps(dailyWorkflowSteps);
    setObjectives(objectiveMappings);
    
    // Calculate daily progress
    const testedToday = objectiveMappings.filter(obj => obj.status === 'tested_today').length;
    setDailyProgress((testedToday / 13) * 100);
  }, []);

  const startWorkflow = () => {
    setIsWorkflowActive(true);
    setCurrentWorkflow('discovery');
    const updatedSteps = workflowSteps.map(step => 
      step.id === 'discovery' 
        ? { ...step, status: 'in_progress' as const, timeStarted: new Date().toISOString() }
        : step
    );
    setWorkflowSteps(updatedSteps);
  };

  const completeStep = (stepId: string) => {
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    const updatedSteps = [...workflowSteps];
    
    // Mark current step as completed
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status: 'completed' };
    
    // Start next step if available
    if (stepIndex + 1 < updatedSteps.length) {
      updatedSteps[stepIndex + 1] = { 
        ...updatedSteps[stepIndex + 1], 
        status: 'in_progress',
        timeStarted: new Date().toISOString()
      };
      setCurrentWorkflow(updatedSteps[stepIndex + 1].id);
    } else {
      setIsWorkflowActive(false);
      setCurrentWorkflow(null);
    }
    
    setWorkflowSteps(updatedSteps);
  };

  const resetWorkflow = () => {
    setIsWorkflowActive(false);
    setCurrentWorkflow(null);
    const resetSteps = dailyWorkflowSteps.map(step => ({ ...step, status: 'pending' as const }));
    setWorkflowSteps(resetSteps);
  };

  const markObjectiveTested = (objectiveId: number) => {
    const updatedObjectives = objectives.map(obj => 
      obj.id === objectiveId 
        ? { 
            ...obj, 
            status: 'tested_today' as const, 
            lastTested: new Date().toISOString(),
            testCount: obj.testCount + 1
          }
        : obj
    );
    setObjectives(updatedObjectives);
    
    // Update progress
    const testedToday = updatedObjectives.filter(obj => obj.status === 'tested_today').length;
    setDailyProgress((testedToday / 13) * 100);
  };

  const openInterface = (url: string) => {
    window.open(url, '_blank');
  };

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'in_progress': return <Play className="h-6 w-6 text-blue-500" />;
      default: return <Clock className="h-6 w-6 text-gray-400" />;
    }
  };

  const getObjectiveStatusColor = (status: ObjectiveMapping['status']) => {
    switch (status) {
      case 'tested_today': return 'bg-green-100 text-green-800';
      case 'needs_attention': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Systematic Daily Workflow Dashboard
        </h1>
        <p className="text-gray-600">
          Cyclical optimization workflow for testing and validating all 13 objectives
        </p>
      </div>

      {/* Daily Progress Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-500" />
              Daily Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{Math.round(dailyProgress)}%</div>
              <Progress value={dailyProgress} />
              <div className="text-xs text-gray-500">
                {objectives.filter(obj => obj.status === 'tested_today').length} of 13 objectives tested
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Brain className="h-4 w-4 mr-2 text-purple-500" />
              Learning Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {objectives.reduce((sum, obj) => sum + obj.testCount, 0)}
              </div>
              <div className="text-xs text-gray-500">Total tests completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">91.3%</div>
              <div className="text-xs text-gray-500">Prediction accuracy</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              Workflow Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className={isWorkflowActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {isWorkflowActive ? 'Active' : 'Inactive'}
              </Badge>
              <div className="text-xs text-gray-500">
                {currentWorkflow ? `Step: ${currentWorkflow}` : 'Ready to start'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daily Cyclical Workflow</span>
            <div className="space-x-2">
              {!isWorkflowActive ? (
                <Button onClick={startWorkflow} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start Daily Workflow
                </Button>
              ) : (
                <Button onClick={resetWorkflow} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Workflow
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  step.status === 'in_progress' 
                    ? 'border-blue-500 bg-blue-50' 
                    : step.status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStepIcon(step.status)}
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Duration: {step.duration} | Objectives: {step.objectives.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {step.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        onClick={() => completeStep(step.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Complete Step
                      </Button>
                    )}
                    {step.interfaces.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Interfaces: {step.interfaces.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 13 Objectives Grid */}
      <Card>
        <CardHeader>
          <CardTitle>13 Core Objectives - Testing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {objectives.map((objective) => (
              <div
                key={objective.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                      {objective.id}
                    </div>
                    <Badge className={getObjectiveStatusColor(objective.status)}>
                      {objective.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInterface(objective.url)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <h4 className="font-medium text-sm mb-1">{objective.title}</h4>
                <p className="text-xs text-gray-500 mb-2">{objective.interface}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Tests: {objective.testCount}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => markObjectiveTested(objective.id)}
                    className="bg-green-600 hover:bg-green-700 text-xs"
                  >
                    Mark Tested
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Unified Shell Integration */}
      <UnifiedShell />
    </div>
  );
}