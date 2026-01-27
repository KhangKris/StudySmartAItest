import { create } from 'zustand';
import { databaseService } from '../services/databaseService';
import { Task } from '../types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  initializeDatabase: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'status'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: true,
  initializeDatabase: async () => {
    try {
      await databaseService.init();
      await get().fetchTasks();
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  },
  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await databaseService.getTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      set({ isLoading: false });
    }
  },
  addTask: async (task) => {
    const newId = await databaseService.createTask(task);
    const newTask: Task = {
      ...task,
      id: newId,
      status: 'pending',
      isDaily: !!task.isDaily,
      completed: false
    };
    set(state => ({ tasks: [...state.tasks, newTask] }));
  },
  updateTask: async (task) => {
    await databaseService.updateTask(task);
    set(state => ({
      tasks: state.tasks.map(t => (t.id === task.id ? task : t)),
    }));
  },
  deleteTask: async (id) => {
    await databaseService.deleteTask(id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },
  setTasks: (tasks) => {
    set({ tasks });
  }
}));
