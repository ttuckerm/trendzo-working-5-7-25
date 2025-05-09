'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Badge,
  Button,
  TooltipProvider, Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Label,
  Input,
  Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/ui-compatibility';
import { TrendingUp, Users, Clock, Sparkles, AlertCircle, CheckCircle, TrendingDown, LineChart, ArrowUpRight, UserCog, Calendar, BarChart2, Sliders, Brain, ArrowRight, Star, Award, Info, Edit, Check, ChevronDown, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { TrendPrediction, ManualAdjustmentLog, ExpertInsightTag } from '@/lib/types/trendingTemplate';
import { useAuth } from '@/lib/hooks/useAuth';
import VelocityScoreIndicator from '@/components/ui/VelocityScoreIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/design-utils';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

// Define a type for the session data
type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
};

type Session = {
  user?: SessionUser;
  expires?: string;
};

// Conditionally import useSession based on environment
const isDev = process.env.NODE_ENV === 'development';
let SessionData: { data: Session | null } = { data: null };

// Only import in production to avoid SessionProvider errors
if (!isDev) {
  try {
    // We'll dynamically import this only in production
    const { useSession } = require('next-auth/react');
    SessionData = useSession();
  } catch (error) {
    console.error('Error importing useSession:', error);
  }
}

interface TrendPredictionCardProps {
  prediction: TrendPrediction;
}

/**
 * Component for displaying a single trend prediction card
 * Includes confidence scores, growth trajectories, expert adjustment capabilities,
 * and visual indicators for expert insights
 */
export function TrendPredictionCard({ prediction }: TrendPredictionCardProps) {
  const { toast } = useToast();
  // In development mode, use a mock session
  const { data: session } = isDev ? { data: null as Session | null } : SessionData;
  const { user } = useAuth();
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showMLInsights, setShowMLInsights] = useState(false);
  const [adjustment, setAdjustment] = useState({
    confidenceScore: prediction.confidenceScore,
    daysUntilPeak: prediction.daysUntilPeak,
    growthTrajectory: prediction.growthTrajectory,
    reason: ''
  });
  const [showInsights, setShowInsights] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Format the prediction time
  const predictionTime = formatDistanceToNow(new Date(prediction.predictedAt), { addSuffix: true });
  
  // Format confidence score as percentage
  const confidencePercentage = Math.round(prediction.confidenceScore * 100);
  
  // Determine confidence level class
  const getConfidenceClass = () => {
    if (prediction.confidenceScore >= 0.8) return 'text-green-600';
    if (prediction.confidenceScore >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Display expert insights, if any
  const hasExpertInsights = prediction.expertInsights && prediction.expertInsights.length > 0;
  
  // Function to render expert insight indicators
  const renderExpertInsights = () => {
    if (!hasExpertInsights) return null;
    
    // Group insights by category for better organization
    const expertCategories: Record<string, ExpertInsightTag[]> = {};
    prediction.expertInsights!.forEach(insight => {
      if (!expertCategories[insight.category]) {
        expertCategories[insight.category] = [];
      }
      expertCategories[insight.category].push(insight);
    });
    
    return (
      <div className="mt-3 border-t border-gray-100 pt-3">
        <h4 className="text-xs font-medium text-gray-500 mb-2">Expert Insights</h4>
        <div className="flex flex-wrap gap-1">
          {Object.entries(expertCategories).map(([category, insights]) => (
            <TooltipProvider key={category}>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {category} ({insights.length})
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-medium">{category} insights:</p>
                    <ul className="list-disc list-inside text-xs">
                      {insights.map((insight) => (
                        <li key={insight.id}>{insight.tag}</li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };
  
  // Get color for growth trajectory
  const getGrowthTrajectoryColor = () => {
    switch (prediction.growthTrajectory) {
      case 'exponential': return 'bg-green-100 text-green-800';
      case 'linear': return 'bg-blue-100 text-blue-800';
      case 'plateauing': return 'bg-amber-100 text-amber-800';
      case 'volatile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get icon for growth trajectory
  const getGrowthTrajectoryIcon = () => {
    switch (prediction.growthTrajectory) {
      case 'exponential': return <ArrowUpRight className="h-4 w-4" />;
      case 'linear': return <LineChart className="h-4 w-4" />;
      case 'plateauing': return <TrendingDown className="h-4 w-4" />;
      case 'volatile': return <BarChart2 className="h-4 w-4" />;
      default: return <LineChart className="h-4 w-4" />;
    }
  };
  
  // Calculate velocity score for display (ensuring a visible value is shown)
  const getVelocityScore = () => {
    // First try to get it from velocityPatterns.confidence
    if (prediction.velocityPatterns?.confidence) {
      return prediction.velocityPatterns.confidence * 10;
    }
    
    // Fallback to a value based on confidenceScore if not available
    return prediction.confidenceScore * 7.5;
  };
  
  // Handle expert adjustment submission
  const handleAdjustmentSubmit = async () => {
    // Get user ID from either NextAuth or Firebase Auth
    const userId = session?.user?.id || user?.uid;
    
    if (!userId) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to adjust predictions',
        variant: 'destructive'
      });
      return;
    }
    
    // Construct adjustment logs
    const adjustmentLogs: { field: string; previousValue: any; newValue: any }[] = [];
    
    // Check which fields were adjusted
    if (adjustment.confidenceScore !== prediction.confidenceScore) {
      adjustmentLogs.push({
        field: 'confidenceScore',
        previousValue: prediction.confidenceScore,
        newValue: adjustment.confidenceScore
      });
    }
    
    if (adjustment.daysUntilPeak !== prediction.daysUntilPeak) {
      adjustmentLogs.push({
        field: 'daysUntilPeak',
        previousValue: prediction.daysUntilPeak,
        newValue: adjustment.daysUntilPeak
      });
    }
    
    if (adjustment.growthTrajectory !== prediction.growthTrajectory) {
      adjustmentLogs.push({
        field: 'growthTrajectory',
        previousValue: prediction.growthTrajectory,
        newValue: adjustment.growthTrajectory
      });
    }
    
    // Only proceed if there are actual changes
    if (adjustmentLogs.length === 0) {
      toast({
        title: 'No changes detected',
        description: 'Make some adjustments to the prediction before submitting',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Submit each adjustment
      for (const log of adjustmentLogs) {
        const response = await fetch('/api/templates/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            templateId: prediction.templateId,
            field: log.field,
            previousValue: log.previousValue,
            newValue: log.newValue,
            reason: adjustment.reason,
            userId: userId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to apply expert adjustment');
        }
      }
      
      toast({
        title: 'Expert adjustment applied',
        description: 'Your insights have been applied to the prediction',
        variant: 'default'
      });
      
      setIsAdjusting(false);
    } catch (error) {
      console.error('Error applying expert adjustment:', error);
      toast({
        title: 'Adjustment Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  // Handle ML Insights display
  const handleMLInsightsClick = () => {
    setShowMLInsights(true);
    // In a real implementation, this would fetch ML insights data
    toast({
      title: "ML Insights Activated",
      description: "Machine learning analysis is being processed for this prediction.",
      duration: 3000
    });
  };
  
  return (
    <motion.div
      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      layout
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{prediction.template.title}</h3>
            
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-xs rounded-full px-2 py-0.5 ${getGrowthTrajectoryColor()} flex items-center`}>
                {getGrowthTrajectoryIcon()}
                <span className="ml-1">{prediction.growthTrajectory}</span>
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-800 flex items-center cursor-help">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {format(new Date(prediction.predictedAt), 'MMMM yyyy')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Expected to peak {predictionTime}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {prediction.expertAdjusted && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs rounded-full px-2 py-0.5 bg-purple-100 text-purple-800 flex items-center">
                        <UserCog className="h-3.5 w-3.5 mr-1" />
                        Expert Adjusted
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">This prediction has been adjusted by an expert</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          
          {/* Confidence indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "relative h-12 w-12 rounded-full flex items-center justify-center border-4",
                      prediction.confidenceScore >= 0.8 ? "border-emerald-500" :
                      prediction.confidenceScore >= 0.65 ? "border-green-500" :
                      prediction.confidenceScore >= 0.5 ? "border-yellow-500" :
                      prediction.confidenceScore >= 0.3 ? "border-orange-500" :
                      "border-red-500"
                    )}
                  >
                    <motion.div 
                      className="font-bold text-lg text-gray-800"
                      initial={{ scale: 1 }}
                      animate={{ scale: isHovered ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0, repeatType: "reverse" }}
                    >
                      {Math.round(prediction.confidenceScore * 100)}%
                    </motion.div>
                    <motion.div 
                      className="absolute -bottom-1 right-0 bg-white rounded-full p-0.5 shadow-sm"
                      animate={{ rotate: isHovered ? [0, -10, 0, 10, 0] : 0 }}
                      transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
                    >
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    </motion.div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{getConfidenceClass()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Confidence score based on data analysis and pattern recognition</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-gray-600 mt-3 text-sm line-clamp-2">{prediction.template.description}</p>
        
        {/* Expert Controls - Only shown if user has expert role */}
        {user?.role === 'expert' && !isAdjusting && (
          <motion.button
            className="mt-3 text-xs flex items-center text-purple-600 hover:text-purple-800 transition-colors"
            onClick={() => setIsAdjusting(true)}
            whileHover={{ x: 3 }}
          >
            <Edit className="h-3 w-3 mr-1" />
            Make expert adjustments
          </motion.button>
        )}
        
        {/* Expert adjustment mode */}
        <AnimatePresence>
          {isAdjusting && (
            <motion.div 
              className="mt-4 border-t border-gray-100 pt-4 space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Adjust Confidence</label>
                  <span className="text-sm font-medium text-gray-900">{Math.round(prediction.confidenceScore * 100)}%</span>
                </div>
                <Slider
                  value={[prediction.confidenceScore * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val: number[]) => setAdjustment({...adjustment, confidenceScore: val[0] / 100})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Expert Insights</label>
                  <div className="flex items-center">
                    <Label htmlFor="expert-verified" className="text-xs text-gray-500 mr-2">
                      Verified
                    </Label>
                    <Switch id="expert-verified" checked={prediction.expertAdjusted} />
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  {prediction.expertInsights?.map((insight, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-start gap-2 bg-gray-50 p-2 rounded-md"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <User className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700 flex-1">{insight.tag}</p>
                      <button 
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                        onClick={() => setAdjustment({...adjustment, reason: `Removed insight: ${insight.tag}`})}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex">
                  <input
                    type="text"
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
                    placeholder="Add expert insight..."
                    className="flex-1 text-sm p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAdjustmentSubmit}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm rounded-r-md"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdjusting(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleAdjustmentSubmit}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save Adjustments
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Expandable section for insights */}
      <AnimatePresence>
        {prediction.expertInsights && (
          <motion.div 
            className="border-t border-gray-200 bg-gray-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            layout
          >
            <button
              className="w-full p-3 flex justify-center items-center text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
              onClick={() => setShowInsights(!showInsights)}
            >
              <span>Expert Insights</span>
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showInsights ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showInsights && (
                <motion.div 
                  className="p-4 pt-0 space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {prediction.expertInsights.map((insight, index) => (
                    <motion.div 
                      key={index}
                      className="flex gap-3 items-start"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Users className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{insight.tag}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-gray-500 flex items-center">
                  <Info className="h-3.5 w-3.5 mr-1" />
                  Category: {prediction.template.category}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Trend categorized under {prediction.template.category}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Link href={`/templates/${prediction.templateId}`}>
            <motion.button
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center"
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              View Templates
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
} 