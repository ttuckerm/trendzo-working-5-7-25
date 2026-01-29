import { useState } from 'react';
import { defaultChatConfig } from '@/config/chat.config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatProps {
  onSend?: (message: string) => void;
  initialConfig?: typeof defaultChatConfig;
}

export function Chat({ onSend, initialConfig = defaultChatConfig }: ChatProps) {
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState(initialConfig);

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message);
      setMessage('');
    }
  };

  const toggleContext = () => {
    setConfig(prev => ({
      ...prev,
      interface: {
        ...prev.interface,
        showContext: !prev.interface.showContext
      }
    }));
  };

  const toggleAgent = () => {
    setConfig(prev => ({
      ...prev,
      interface: {
        ...prev.interface,
        showAgent: !prev.interface.showAgent
      }
    }));
  };

  const handleModelChange = (model: 'anthropic' | 'openai') => {
    setConfig(prev => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        model
      }
    }));
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Top Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.interface.showContext}
            onCheckedChange={toggleContext}
            id="context-toggle"
          />
          <label htmlFor="context-toggle" className="text-sm">Add context</label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.interface.showAgent}
            onCheckedChange={toggleAgent}
            id="agent-toggle"
          />
          <label htmlFor="agent-toggle" className="text-sm">Agent</label>
        </div>

        {config.interface.showModelSelector && (
          <Select
            value={config.defaults.model}
            onValueChange={(value: 'anthropic' | 'openai') => handleModelChange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Claude 3 Sonnet</SelectItem>
              <SelectItem value="openai">GPT-4</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Message Input */}
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend}>Send</Button>
      </div>

      {/* Tool Selection */}
      <div className="flex space-x-4">
        {Object.entries(config.tools).map(([tool, enabled]) => (
          <div key={tool} className="flex items-center space-x-2">
            <Switch
              checked={enabled}
              onCheckedChange={() => {
                setConfig(prev => ({
                  ...prev,
                  tools: {
                    ...prev.tools,
                    [tool]: !enabled
                  }
                }));
              }}
              id={`${tool}-toggle`}
            />
            <label htmlFor={`${tool}-toggle`} className="text-sm capitalize">{tool}</label>
          </div>
        ))}
      </div>
    </div>
  );
} 