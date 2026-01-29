export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface FrameworkUpdate {
  id: string;
  component: string;
  beforeState: string;
  afterState: string;
  timestamp: Date;
  applied: boolean;
}

export interface AiBrainResponse {
  message: string;
  frameworkUpdates: FrameworkUpdate[];
}

export interface ConversationHistory {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
  updatedFrameworks: string[];
}

export interface FrameworkComponent {
  id: string;
  name: string;
  description: string;
  currentState: string;
  lastUpdated: Date;
  updateHistory: FrameworkUpdate[];
} 