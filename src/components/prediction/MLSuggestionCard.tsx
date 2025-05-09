'use client';

import { useState } from 'react';
import { Bot, Check, Info, Sparkles, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/ui-compatibility';
import { useToast } from '@/components/ui/use-toast';
import { TrendPrediction } from '@/lib/types/trendingTemplate';

interface MLSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
}

interface MLSuggestionCardProps {
  suggestion: MLSuggestion;
  predictionId: string;
  onApply?: (suggestion: MLSuggestion) => Promise<boolean>;
  onReject?: (suggestion: MLSuggestion) => Promise<boolean>;
}

/**
 * Component for displaying a machine learning-based suggestion
 * for improving trend predictions
 */
export function MLSuggestionCard({ 
  suggestion, 
  predictionId, 
  onApply, 
  onReject 
}: MLSuggestionCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  // Format the confidence as a percentage
  const confidencePercentage = Math.round(suggestion.confidence * 100);
  
  // Determine how to display the field name in a more human-readable format
  const formatFieldName = (field: string) => {
    switch (field) {
      case 'confidenceScore':
        return 'Confidence Score';
      case 'daysUntilPeak':
        return 'Days Until Peak';
      case 'growthTrajectory':
        return 'Growth Trajectory';
      default:
        return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
  };
  
  // Format values based on the field type
  const formatValue = (field: string, value: any) => {
    if (field === 'confidenceScore') {
      return `${Math.round(value * 100)}%`;
    }
    return value;
  };
  
  // Handle applying the suggestion
  const handleApply = async () => {
    if (!onApply) {
      toast({
        title: 'Cannot Apply Suggestion',
        description: 'The apply handler is not configured.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const success = await onApply(suggestion);
      
      if (success) {
        setIsApplied(true);
        toast({
          title: 'Suggestion Applied',
          description: `The ${formatFieldName(suggestion.field)} has been updated based on ML suggestion.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Failed to Apply Suggestion',
          description: 'There was an error applying the suggestion.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while applying the suggestion.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle rejecting the suggestion
  const handleReject = async () => {
    if (!onReject) {
      // If no rejection handler, just hide the suggestion
      setIsRejected(true);
      return;
    }
    
    try {
      setIsLoading(true);
      const success = await onReject(suggestion);
      
      if (success) {
        setIsRejected(true);
        toast({
          title: 'Suggestion Rejected',
          description: 'Thank you for your feedback. This helps improve our ML system.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Failed to Reject Suggestion',
          description: 'There was an error recording your rejection.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      // Even if the API call fails, we'll still hide the suggestion
      setIsRejected(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If the suggestion is applied or rejected, don't show it
  if (isApplied || isRejected) {
    return null;
  }
  
  return (
    <Card className="mb-4 border border-blue-100 bg-blue-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <Bot className="h-5 w-5 text-blue-600 mr-2" />
            <CardTitle className="text-md font-medium text-blue-800">
              ML Suggestion: {formatFieldName(suggestion.field)}
            </CardTitle>
          </div>
          <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">
            {confidencePercentage}% Confidence
          </Badge>
        </div>
        <CardDescription className="text-blue-700 mt-1">
          Machine learning has detected a potential improvement
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Current Value:</span>
            <span className="font-medium">
              {formatValue(suggestion.field, suggestion.currentValue)}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Suggested Value:</span>
            <span className="font-medium text-blue-700">
              {formatValue(suggestion.field, suggestion.suggestedValue)}
            </span>
          </div>
          
          <div 
            className="bg-white p-3 rounded-md text-sm mt-2 text-gray-700 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium flex items-center">
                <Sparkles className="h-4 w-4 text-blue-500 mr-1" />
                Reasoning
              </span>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            
            {isExpanded && (
              <div className="mt-2 text-gray-600">
                {suggestion.reason}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2 pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReject}
                disabled={isLoading}
                className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reject this suggestion and provide feedback to the ML system</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleApply}
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Apply
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Apply this suggestion to update the prediction</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

interface MLSuggestionsContainerProps {
  predictionId: string;
  suggestions: MLSuggestion[];
  onApplySuggestion?: (suggestion: MLSuggestion) => Promise<boolean>;
  onRejectSuggestion?: (suggestion: MLSuggestion) => Promise<boolean>;
  isLoading?: boolean;
}

/**
 * Container component for displaying multiple ML suggestions
 */
export function MLSuggestionsContainer({
  predictionId,
  suggestions,
  onApplySuggestion,
  onRejectSuggestion,
  isLoading = false
}: MLSuggestionsContainerProps) {
  if (isLoading) {
    return (
      <Card className="mb-4 border border-blue-100 bg-blue-50 p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <Bot className="h-10 w-10 text-blue-600 mb-4 animate-pulse" />
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Loading ML Suggestions
          </h3>
          <p className="text-blue-700 text-sm">
            Our machine learning system is analyzing patterns to provide suggestions...
          </p>
        </div>
      </Card>
    );
  }
  
  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="mb-4 border border-gray-200 bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <Bot className="h-10 w-10 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Suggestions Available
          </h3>
          <p className="text-gray-500 text-sm">
            Our ML system doesn't have any suggestions for this prediction at the moment.
            This could be because there's not enough historical data, or the prediction
            is already optimal.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center mb-2">
        <Bot className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-800">
          ML-Generated Suggestions ({suggestions.length})
        </h3>
      </div>
      
      {suggestions.map((suggestion, index) => (
        <MLSuggestionCard
          key={`${predictionId}-suggestion-${index}`}
          suggestion={suggestion}
          predictionId={predictionId}
          onApply={onApplySuggestion}
          onReject={onRejectSuggestion}
        />
      ))}
    </div>
  );
} 