import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Task } from '../types';

// Extend the NodeJS.Global interface to include our custom property
// This prevents TypeScript errors when accessing `global._db`
declare global {
  var _db: Promise<SQLite.SQLiteDatabase> | undefined;
}

// --- SQlite Implementation (Native) ---

const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!global._db) {
    global._db = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync('study-smart.db');
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            dueDate TEXT NOT NULL,
            priority TEXT NOT NULL,
            estimatedTime INTEGER NOT NULL,
            status TEXT NOT NULL,
            isDaily INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            completedAt TEXT,
            isToday INTEGER DEFAULT 0
          );
        `);

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS discipline_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            date TEXT NOT NULL,
            change INTEGER NOT NULL,
            reason TEXT NOT NULL,
            taskId INTEGER
          );
        `);

        // Lazy migration for existing tables (ignore errors if columns exist)
        const columns = ['isDaily', 'completed', 'completedAt', 'isToday'];
        for (const col of columns) {
          try {
            // Default isDaily to 0, completed to 0
            const defaultVal = col === 'completedAt' ? 'NULL' : '0';
            await db.execAsync(`ALTER TABLE tasks ADD COLUMN ${col} ${col === 'completedAt' ? 'TEXT' : 'INTEGER'} DEFAULT ${defaultVal};`);
          } catch (e) {
            // Column likely exists
          }
        }

        console.log('Database initialized successfully');
        return db;
      } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
      }
    })();
  }
  return global._db;
};

const nativeInit = async (): Promise<void> => {
  await getDb();
};

const nativeCreateTask = async (task: Omit<Task, 'id' | 'status'> & { isDaily?: boolean, completed?: boolean, completedAt?: string, isToday?: boolean }): Promise<number> => {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO tasks (title, description, dueDate, priority, estimatedTime, status, isDaily, completed, completedAt, isToday) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    task.title,
    task.description || '',
    task.dueDate,
    task.priority,
    task.estimatedTime,
    'pending',
    task.isDaily ? 1 : 0,
    task.completed ? 1 : 0,
    task.completedAt || null,
    task.isToday ? 1 : 0
  );
  return result.lastInsertRowId;
};

const nativeGetTasks = async (): Promise<Task[]> => {
  const db = await getDb();

  // Reset daily tasks logic: 
  // If isDaily=1 AND completedAt date < today, reset.
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    await db.runAsync(`
        UPDATE tasks 
        SET status = 'pending', completed = 0, completedAt = NULL
        WHERE isDaily = 1 AND (completedAt IS NOT NULL AND substr(completedAt, 1, 10) < ?)
      `, today);
  } catch (e) {
    console.warn("Failed to reset daily tasks", e);
  }

  const allRows = await db.getAllAsync<any>('SELECT * FROM tasks;');

  return allRows.map((row: any) => ({
    ...row,
    isDaily: !!row.isDaily,
    completed: !!row.completed,
    isToday: !!row.isToday
  }));
};

const nativeUpdateTask = async (task: Task): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tasks SET title = ?, description = ?, dueDate = ?, priority = ?, estimatedTime = ?, status = ?, isDaily = ?, completed = ?, completedAt = ?, isToday = ? WHERE id = ?;',
    task.title,
    task.description || '',
    task.dueDate,
    task.priority,
    task.estimatedTime,
    task.status,
    task.isDaily ? 1 : 0,
    task.completed ? 1 : 0,
    task.completedAt || null,
    task.isToday ? 1 : 0,
    task.id
  );
};

const nativeDeleteTask = async (id: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?;', id);
};

// --- Web Implementation (AsyncStorage) ---

const STORAGE_KEY = 'tasks_data';

const webInit = async (): Promise<void> => {
  // No-op for web, or optional migration
  console.log('Web storage initialized');
};

const webCreateTask = async (task: Omit<Task, 'id' | 'status'> & { isDaily?: boolean, completed?: boolean, completedAt?: string, isToday?: boolean }): Promise<number> => {
  const tasksJson = await AsyncStorage.getItem(STORAGE_KEY);
  const tasks: Task[] = tasksJson ? JSON.parse(tasksJson) : [];

  // Simple ID generation
  const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

  const newTask: Task = {
    ...task,
    id: newId,
    status: 'pending',
    description: task.description || '',
    isDaily: !!task.isDaily,
    completed: !!task.completed,
    completedAt: task.completedAt,
    isToday: !!task.isToday
  };

  tasks.push(newTask);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  return newId;
};

const webGetTasks = async (): Promise<Task[]> => {
  const tasksJson = await AsyncStorage.getItem(STORAGE_KEY);
  let tasks: Task[] = tasksJson ? JSON.parse(tasksJson) : [];

  // Reset daily tasks logic
  const today = new Date().toISOString().split('T')[0];
  let changed = false;

  tasks = tasks.map(t => {
    if (t.isDaily && t.completedAt) {
      const completedDate = t.completedAt.split('T')[0];
      if (completedDate < today) {
        changed = true;
        return { ...t, status: 'pending', completed: false, completedAt: undefined, isToday: true };
      }
    }
    return t;
  });

  if (changed) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  return tasks;
};

const webUpdateTask = async (task: Task): Promise<void> => {
  const tasks = await webGetTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  if (index !== -1) {
    tasks[index] = { ...task, description: task.description || '' };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
};

const webDeleteTask = async (id: number): Promise<void> => {
  const tasks = await webGetTasks();
  const filtered = tasks.filter(t => t.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// --- Discipline Logs ---

const nativeLogDiscipline = async (change: number, reason: string, taskId?: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO discipline_logs (date, change, reason, taskId) VALUES (?, ?, ?, ?);',
    new Date().toISOString(),
    change,
    reason,
    taskId || null
  );
};

const nativeGetDisciplineLogs = async (): Promise<any[]> => {
  const db = await getDb();
  const logs = await db.getAllAsync('SELECT * FROM discipline_logs ORDER BY date DESC LIMIT 50;');
  return logs;
};

// --- Export ---

const isWeb = Platform.OS === 'web';

export const databaseService = {
  init: isWeb ? webInit : nativeInit,
  createTask: isWeb ? webCreateTask : nativeCreateTask,
  getTasks: isWeb ? webGetTasks : nativeGetTasks,
  updateTask: isWeb ? webUpdateTask : nativeUpdateTask,
  deleteTask: isWeb ? webDeleteTask : nativeDeleteTask,
  logDiscipline: isWeb ? async () => { } : nativeLogDiscipline, // No-op for web for now
  getDisciplineLogs: isWeb ? async () => [] : nativeGetDisciplineLogs,
};
