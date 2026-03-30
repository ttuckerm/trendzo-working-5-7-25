import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'running';
  message?: string;
  duration?: number;
}

export default function TestRunner() {
  const [sampleSize, setSampleSize] = useState(3);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName: string) => {
    setIsRunning(true);
    
    // Add running test to results
    setResults(prev => [
      ...prev,
      {
        name: testName,
        status: 'running'
      }
    ]);

    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/admin/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: testName,
          options: {
            samples: sampleSize
          }
        }),
      });

      const data = await response.json();
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      
      // Update test result
      setResults(prev => prev.map(result => 
        result.name === testName ? {
          name: testName,
          status: data.success ? 'success' : 'error',
          message: data.message,
          duration
        } : result
      ));
    } catch (error) {
      // Update test result with error
      setResults(prev => prev.map(result => 
        result.name === testName ? {
          name: testName,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        } : result
      ));
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const tests = ['processing', 'categorization', 'structure', 'similarity'];
    
    for (const test of tests) {
      await runTest(test);
    }
    
    setIsRunning(false);
  };

  const getStatusClass = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'running': return 'text-blue-500';
      default: return '';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Test Runner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sample-size">Sample Size</Label>
            <div className="flex gap-4">
              <Input
                id="sample-size"
                type="number"
                min="1"
                max="10"
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value) || 3)}
                disabled={isRunning}
                className="max-w-xs"
              />
              <Button onClick={runAllTests} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Number of videos to use for testing. Smaller samples run faster but may be less thorough.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => runTest('processing')}
              disabled={isRunning}
              className="justify-start"
            >
              Test Video Processing
            </Button>
            <Button
              variant="outline"
              onClick={() => runTest('categorization')}
              disabled={isRunning}
              className="justify-start"
            >
              Test Template Categorization
            </Button>
            <Button
              variant="outline"
              onClick={() => runTest('structure')}
              disabled={isRunning}
              className="justify-start"
            >
              Test Structure Extraction
            </Button>
            <Button
              variant="outline"
              onClick={() => runTest('similarity')}
              disabled={isRunning}
              className="justify-start"
            >
              Test Template Similarity
            </Button>
          </div>

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Test Results</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span>{result.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.duration && `${result.duration.toFixed(1)}s`}
                      </div>
                    </div>
                    {result.message && (
                      <p className={`text-sm mt-2 ${getStatusClass(result.status)}`}>
                        {result.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 