import { useUserStore } from '@/store/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './databaseService';

const LAST_EVALUATION_KEY = 'last_discipline_evaluation';

const evaluateDailyProgress = async () => {
    const lastDate = await AsyncStorage.getItem(LAST_EVALUATION_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (lastDate === today) {
        return; // Already evaluated today
    }

    // We are evaluating "Yesterday's" performance, essentially.
    // Or rather: "Are there any tasks currently marked isToday that are OVERDUE?"
    // Because if they are isToday and Due Date < Today, they were missed yesterday.

    const tasks = await databaseService.getTasks();
    const state = useUserStore.getState();

    let totalPenalty = 0;
    const reasons: string[] = [];

    const overdueTodayTasks = tasks.filter(t => {
        const isPending = t.status === 'pending';
        const isMarkedToday = t.isToday;

        // Check if due date is strictly before today (yesterday or older)
        // Assuming dueDate is ISO string.
        const dueDatePath = t.dueDate.split('T')[0];
        const isOverdue = dueDatePath < today;

        return isPending && isMarkedToday && isOverdue;
    });

    for (const task of overdueTodayTasks) {
        let penalty = 5; // Base
        if (task.priority === 'high') penalty = 10;
        if (task.priority === 'medium') penalty = 5;
        if (task.priority === 'low') penalty = 2;

        // Daily tasks penalty
        if (task.isDaily) penalty = Math.max(penalty, 5); // Minimum 5 for daily

        totalPenalty += penalty;
        const log = `Missed task: ${task.title} (-${penalty})`;
        reasons.push(log);

        // Log to DB
        if (databaseService.logDiscipline) {
            await databaseService.logDiscipline(-penalty, `Missed overdue task: ${task.title}`, task.id);
        }
    }

    if (totalPenalty > 0) {
        await state.updateDisciplineScore(-totalPenalty);
        console.log(`Discipline: Penalized ${totalPenalty} points.`);
    } else {
        // Optional: Reward if no overdue tasks?
        // Only reward if we actually completed something yesterday?
        // For now, simple penalty system logic.
    }

    await AsyncStorage.setItem(LAST_EVALUATION_KEY, today);
};

export const disciplineService = {
    evaluateDailyProgress
};
