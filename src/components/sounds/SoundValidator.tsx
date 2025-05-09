import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, InfoIcon, XCircle, ArrowRight, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { TikTokSound } from '@/lib/types/tiktok';

interface SoundValidatorProps {
  onValidate?: (result: any) => void;
  initialSound?: Partial<TikTokSound>;
  className?: string;
}

export default function SoundValidator({ onValidate, initialSound, className }: SoundValidatorProps) {
  const [inputData, setInputData] = useState<string>(
    initialSound ? JSON.stringify(initialSound, null, 2) : '{}'
  );
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const { toast } = useToast();

  /**
   * Validate the sound data
   */
  const validateSound = async () => {
    // Reset state
    setIsValidating(true);
    setValidationResult(null);
    setValidationFeedback(null);
    
    try {
      // Parse input JSON
      const soundData = JSON.parse(inputData);
      
      // Call validation API
      const response = await fetch('/api/sounds/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sound: soundData })
      });
      
      const result = await response.json();
      
      // Update state with validation result
      setValidationResult(result);
      
      // Notify parent component
      if (onValidate) {
        onValidate(result);
      }
      
      // Show appropriate feedback
      if (result.valid) {
        setValidationFeedback({
          type: 'success',
          message: 'Sound data is valid!'
        });
        
        if (result.enhancedData) {
          setValidationFeedback({
            type: 'info',
            message: 'Sound data is valid with suggested enhancements.'
          });
        }
      } else {
        setValidationFeedback({
          type: 'error',
          message: `Validation failed with ${result.issues?.length} issues.`
        });
      }
    } catch (error) {
      console.error('Error validating sound data:', error);
      
      // Show parsing error
      if (error instanceof SyntaxError) {
        setValidationFeedback({
          type: 'error',
          message: 'Invalid JSON format. Please check your input.'
        });
      } else {
        setValidationFeedback({
          type: 'error',
          message: 'Error validating sound data. Please try again.'
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputData(e.target.value);
    
    // Clear validation when input changes
    if (validationResult) {
      setValidationResult(null);
      setValidationFeedback(null);
    }
  };

  /**
   * Apply enhanced data suggestions
   */
  const applyEnhancements = () => {
    if (validationResult?.enhancedData) {
      setInputData(JSON.stringify(validationResult.enhancedData, null, 2));
      toast({
        title: 'Enhancements Applied',
        description: 'The suggested enhancements have been applied to the sound data.',
      });
    }
  };

  /**
   * Copy JSON to clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'JSON copied to clipboard',
    });
  };

  // Helper to render validation issues
  const renderIssues = (issues: string[]) => {
    return (
      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-medium flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
          Validation Issues
        </h4>
        <ul className="space-y-1">
          {issues.map((issue, index) => (
            <li key={index} className="text-sm flex items-start">
              <XCircle className="w-3 h-3 mr-2 text-destructive shrink-0 mt-1" />
              <span className="text-destructive/80">{issue}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Helper to render suggestions
  const renderSuggestions = (suggestions: any) => {
    return (
      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-medium flex items-center">
          <InfoIcon className="w-4 h-4 mr-2 text-blue-500" />
          Suggested Enhancements
        </h4>
        <div className="bg-muted/50 p-3 rounded-md">
          <pre className="text-xs overflow-auto">{JSON.stringify(suggestions, null, 2)}</pre>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={applyEnhancements}
          >
            Apply Enhancements
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">Sound Data Validator</CardTitle>
        <CardDescription>Validate and enhance TikTok sound data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="sound-data" className="text-sm font-medium">
              Sound JSON Data
            </Label>
            <Textarea
              id="sound-data"
              className="font-mono text-xs h-64"
              placeholder="Paste sound JSON data here..."
              value={inputData}
              onChange={handleInputChange}
            />
          </div>
          
          {validationFeedback && (
            <Alert
              variant={validationFeedback.type === 'success' ? 'default' : 'destructive'}
              className={`
                ${validationFeedback.type === 'success' ? 'bg-green-50 text-green-900 border-green-200' : ''}
                ${validationFeedback.type === 'info' ? 'bg-blue-50 text-blue-900 border-blue-200' : ''}
                ${validationFeedback.type === 'warning' ? 'bg-amber-50 text-amber-900 border-amber-200' : ''}
              `}
            >
              <div className="flex items-start">
                {validationFeedback.type === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                )}
                {validationFeedback.type === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive mr-2 mt-0.5" />
                )}
                {validationFeedback.type === 'info' && (
                  <InfoIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
                )}
                <div>
                  <AlertTitle className="text-sm font-medium">
                    {validationFeedback.type === 'success' ? 'Valid Sound Data' : 
                     validationFeedback.type === 'error' ? 'Validation Failed' : 
                     'Sound Data Validated'}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {validationFeedback.message}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
          
          {isValidating && (
            <div className="py-2">
              <Progress value={45} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">Validating sound data...</p>
            </div>
          )}
          
          {validationResult && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={validationResult.valid ? "default" : "destructive"}
                  className={`
                    ${validationResult.valid ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                  `}
                >
                  {validationResult.valid ? 'Valid' : 'Invalid'}
                </Badge>
                
                {validationResult.enhancedData && (
                  <Badge 
                    variant="outline"
                    className="bg-blue-50 text-blue-800 hover:bg-blue-100"
                  >
                    Enhancements Available
                  </Badge>
                )}
              </div>
              
              {validationResult.issues && validationResult.issues.length > 0 && 
                renderIssues(validationResult.issues)}
              
              {validationResult.enhancedData && 
                renderSuggestions(validationResult.enhancedData)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          type="submit" 
          onClick={validateSound}
          disabled={isValidating}
        >
          {isValidating ? 'Validating...' : 'Validate Sound Data'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(inputData)}
          className="ml-auto"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy JSON
        </Button>
      </CardFooter>
    </Card>
  );
} 