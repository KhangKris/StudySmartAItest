import { Task, TaskPriority } from '@/types';

export interface StudyPlanConfig {
  startTime: string; // "09:00"
  maxDailyHours: number;
}

export interface ScheduledTask extends Task {
  startTime?: Date;
  endTime?: Date;
  isDeferred?: boolean;
}

export interface StudyPlan {
  todaySchedule: ScheduledTask[];
  upcomingTasks: Task[];
  summary: {
    totalStudyMinutes: number;
    tasksDeferred: number;
  };
}

const priorityScores: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const calculateDueDateScore = (dueDate: string): number => {
  const diff = new Date(dueDate).getTime() - Date.now();
  // Simple: negative diff (overdue) -> huge urgency. Small diff -> high urgency.
  return -diff;
};

const generateStudyPlan = (tasks: Task[], config: StudyPlanConfig): StudyPlan => {
  const { startTime, maxDailyHours } = config;
  const maxMinutes = maxDailyHours * 60;

  // 1. Filter pending
  const pending = tasks.filter(t => !t.completed);

  // 2. Sort
  const sorted = pending.sort((a, b) => {
    // 1. Manual "Today" override (Highest)
    if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;

    // 2. Daily tasks (Next highest, if not completed)
    if (a.isDaily !== b.isDaily) return a.isDaily ? -1 : 1;

    // 3. Priority
    if (a.priority !== b.priority) {
      return priorityScores[b.priority] - priorityScores[a.priority];
    }

    // 4. Due Date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // 3. Time Blocking
  const todaySchedule: ScheduledTask[] = [];
  const upcomingTasks: Task[] = [];
  let currentMinutes = 0;

  // Parse start time "09:00" -> Date object for today
  const [startHour, startMinute] = startTime.split(':').map(Number);
  let currentTime = new Date();
  currentTime.setHours(startHour, startMinute, 0, 0);

  sorted.forEach(task => {
    // If task is forced "Today", we try to squeeze it in, or just mark it.
    // But standard logic: check capacity.
    // Exception: If 'isToday' is true, user WANTS it today. 
    // We will schedule it even if it exceeds *preferred* hours, OR we flag it?
    // Prompt says: "Do not exceed daily capacity". So we must defer even Today tasks if full.

    const duration = task.estimatedTime;

    if (currentMinutes + duration <= maxMinutes) {
      const endTime = new Date(currentTime.getTime() + duration * 60000);

      todaySchedule.push({
        ...task,
        startTime: new Date(currentTime),
        endTime: endTime
      });

      currentMinutes += duration;
      currentTime = endTime;

      // Add 5 min break buffer? 
      // Not strictly tasks, but advances clock.
      currentTime = new Date(currentTime.getTime() + 5 * 60000);
      currentMinutes += 5;
    } else {
      upcomingTasks.push(task);
    }
  });

  return {
    todaySchedule,
    upcomingTasks,
    summary: {
      totalStudyMinutes: currentMinutes,
      tasksDeferred: upcomingTasks.length
    }
  };
};

export const aiService = {
  generateStudyPlan
};
