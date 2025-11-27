export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  subtasks: SubTask[];
  createdAt: number;
  completedAt?: number;
  description?: string;
}

export interface AIResponse {
  subtasks: string[];
  priority: Priority;
  refinedTitle: string;
}