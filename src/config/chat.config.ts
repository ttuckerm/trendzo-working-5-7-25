import { ChatConfig } from '../types/chat.types';

export const defaultChatConfig: ChatConfig = {
  models: {
    anthropic: {
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 4096,
    },
    openai: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4096,
    }
  },
  tools: {
    search: true,
    edit: true,
    run: true,
    mcp: true,
  },
  interface: {
    showContext: true,
    showAgent: true,
    showModelSelector: true,
  },
  defaults: {
    model: 'anthropic',
    context: true,
    agent: true,
  }
}; 