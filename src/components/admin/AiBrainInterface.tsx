import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card-component';
import { Message, FrameworkUpdate } from '@/types/ai-brain.types';
import AiBrainService from '@/lib/services/ai-brain.service';
import AiBrainVisualizer from '@/components/admin/AiBrainVisualizer';
import AiBrainHistory from '@/components/admin/AiBrainHistory';

export default function AiBrainInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [frameworkUpdates, setFrameworkUpdates] = useState<FrameworkUpdate[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Call AI Brain Service
      const response = await AiBrainService.sendMessage(input);
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Add framework updates
      setFrameworkUpdates(prev => [
        ...prev,
        ...response.frameworkUpdates.map(update => ({
          ...update,
          timestamp: new Date(update.timestamp)
        }))
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyUpdate = async (updateId: string) => {
    try {
      // Call AI Brain Service to apply update
      await AiBrainService.applyUpdate(updateId);
      
      // Update local state
      setFrameworkUpdates(prev => 
        prev.map(update => 
          update.id === updateId 
            ? { ...update, applied: true } 
            : update
        )
      );
      
      toast({
        title: 'Update Applied',
        description: 'Framework changes have been applied successfully',
      });
    } catch (error) {
      console.error('Error applying update:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply framework update. Please try again.',
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
            Communicate with the system to update frameworks and strategies
          </p>
        </div>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-center">
                Begin a conversation with the AI Brain to modify system frameworks and strategies.
              </p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your command or question..."
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? 'Processing...' : 'Send'}
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
            <h3 className="text-lg font-semibold text-gray-800">Pending Updates</h3>
            
            {frameworkUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-center">
                  No framework updates available. Start a conversation to generate suggestions.
                </p>
              </div>
            ) : (
              frameworkUpdates.map(update => (
                <Card key={update.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{update.component}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        update.applied 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {update.applied ? 'Applied' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Before:</p>
                        <p className="bg-gray-50 p-2 rounded">{update.beforeState}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">After:</p>
                        <p className="bg-blue-50 p-2 rounded">{update.afterState}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {update.timestamp.toLocaleString()}
                      </span>
                      
                      {!update.applied && (
                        <Button 
                          size="sm" 
                          onClick={() => handleApplyUpdate(update.id)}
                        >
                          Apply Changes
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
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