export interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatConfig {
  models: {
    anthropic: ModelConfig;
    openai: ModelConfig;
  };
  tools: {
    search: boolean;
    edit: boolean;
    run: boolean;
    mcp: boolean;
  };
  interface: {
    showContext: boolean;
    showAgent: boolean;
    showModelSelector: boolean;
  };
  defaults: {
    model: 'anthropic' | 'openai';
    context: boolean;
    agent: boolean;
  };
} 