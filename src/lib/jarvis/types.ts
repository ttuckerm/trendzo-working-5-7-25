export type JarvisTaskInput = {
  goal: string;
  context?: any;
  data?: any;
  maxTokens?: number;
};

export type TaskState =
  | 'pending'
  | 'awaiting_approval'
  | 'running'
  | 'paused'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type Task = {
  id: string;
  input: JarvisTaskInput;
  state: TaskState;
  createdAt: string;
  updatedAt: string;
  requiresApproval?: boolean;
  createdBy: string;
  approvedBy?: string;
  result?: any;
  error?: string;
};

export interface KillSwitchState {
  active: boolean;
  updatedAt: number;
  updatedBy?: string;
}
