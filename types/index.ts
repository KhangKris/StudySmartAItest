
export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate: string; // ISO 8601 string
  priority: TaskPriority;
  estimatedTime: number; // in minutes
  status: TaskStatus;
  isDaily: boolean;
  completed: boolean;
  completedAt?: string;
  isToday: boolean;
}

export interface UserProfile {
  username: string;
  disciplineScore: number; // Keeping for legacy, or sync with disciplinePoints
  streak: number;
  disciplinePoints: number; // New system
  isFocusModeActive: boolean;
}

export interface DisciplineLog {
  id: number;
  date: string; // ISO Date
  change: number; // e.g. -10, +5
  reason: string;
  taskId?: number;
}
