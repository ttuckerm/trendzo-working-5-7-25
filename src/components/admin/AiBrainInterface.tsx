import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card-component';
import { useBrain } from '@/features/Brain/useBrain';
import AiBrainVisualizer from '@/components/admin/AiBrainVisualizer';
import AiBrainHistory from '@/components/admin/AiBrainHistory';

export default function AiBrainInterface() {
  const [input, setInput] = useState('');
  const [frameworkUpdates, setFrameworkUpdates] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Use the new brain hook
  const { messages, isLoading, error, sendMessage, clearMessages } = useBrain();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userInput = input;
    setInput('');
    
    try {
      await sendMessage(userInput);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex h-full rounded-lg overflow-hidden border border-gray-200 bg-white">
      {/* Left side - Chat Interface */}
      <div className="flex flex-col w-1/2 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <h2 className="text-lg font-semibold text-blue-800">AI Brain Interface</h2>
          <p className="text-sm text-gray-600">
            Conversational command center for system management and analytics
          </p>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-center">
                Begin a conversation with the AI Brain to modify system frameworks and strategies.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={`${message.role}-${index}`} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-red-100 border border-red-200 text-red-800">
                <p>Error: {error}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2 mb-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your command or question..."
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              disabled={isLoading}
              className="flex-1 text-black"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? 'Processing...' : 'Send'}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearMessages}
              disabled={isLoading}
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right side - Framework Visualization */}
      <div className="flex flex-col w-1/2">
        <Tabs defaultValue="updates" className="w-full h-full">
          <div className="border-b border-gray-200 bg-gray-50 px-4">
            <TabsList className="mt-2">
              <TabsTrigger value="updates">Framework Updates</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="history">Audit Trail</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="updates" className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">AI Brain Actions</h3>
            
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-center mb-4">
                When the AI Brain executes pipeline actions, they will appear here.
              </p>
              <div className="text-sm text-gray-400">
                <p>Available Actions:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>run - Execute general pipeline operations</li>
                  <li>micro - Run micro-level analysis</li>
                  <li>macro_track - Run macro tracking operations</li>
                  <li>module - Execute specific module operations</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visualization" className="flex-1 overflow-y-auto p-4">
            <AiBrainVisualizer />
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 overflow-y-auto p-4">
            <AiBrainHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}