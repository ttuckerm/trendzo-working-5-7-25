import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card-component';
import { FrameworkComponent } from '@/types/ai-brain.types';
import AiBrainService from '@/lib/services/ai-brain.service';
import { useToast } from '@/components/ui/use-toast';

export default function AiBrainVisualizer() {
  const [frameworks, setFrameworks] = useState<FrameworkComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFrameworks = async () => {
      try {
        const data = await AiBrainService.getFrameworkComponents();
        setFrameworks(data);
      } catch (error) {
        console.error('Error fetching frameworks:', error);
        toast({
          title: 'Error',
          description: 'Failed to load framework components',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFrameworks();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (frameworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-center">No framework components available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Framework Structure</h3>
      
      <div className="grid grid-cols-1 gap-4">
        {frameworks.map((framework) => (
          <Card key={framework.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center">
                <h4 className="text-lg font-semibold text-blue-700">{framework.name}</h4>
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  Active
                </span>
              </div>
              
              <p className="text-sm text-gray-600">{framework.description}</p>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium">Current State:</p>
                <p className="text-sm">{framework.currentState}</p>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Last updated: {new Date(framework.lastUpdated).toLocaleString()}</span>
                <span>{framework.updateHistory.length} updates</span>
              </div>
              
              {framework.updateHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium mb-2">Recent Changes:</p>
                  {framework.updateHistory.slice(0, 1).map((update) => (
                    <div key={update.id} className="text-xs bg-blue-50 p-2 rounded">
                      <p className="font-medium">{new Date(update.timestamp).toLocaleString()}</p>
                      <p>{update.afterState}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 