import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { ConversationHistory } from '@/types/ai-brain.types';
import AiBrainService from '@/lib/services/ai-brain.service';
import { useToast } from '@/components/ui/use-toast';

export default function AiBrainHistory() {
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await AiBrainService.getConversationHistory();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversation history',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [toast]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id === selectedConversation ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-center">No conversation history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Conversation History</h3>
      
      <div className="space-y-4">
        {history.map((conversation) => (
          <Card key={conversation.id} className="overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{conversation.title}</h4>
                <span className="text-xs text-gray-500">
                  {new Date(conversation.lastUpdated).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {conversation.updatedFrameworks.map((framework, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800"
                  >
                    {framework}
                  </span>
                ))}
              </div>
            </div>
            
            {selectedConversation === conversation.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                {conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-100 text-gray-800'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 