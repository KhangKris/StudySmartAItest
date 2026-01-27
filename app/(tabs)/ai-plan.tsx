import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { aiService, ScheduledTask, StudyPlan } from '@/services/aiService';
import { useTaskStore } from '@/store/taskStore';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AIPlanScreen() {
  const tasks = useTaskStore(state => state.tasks);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = getStyles(colors);

  const [startTime, setStartTime] = useState('09:00');
  const [studyHours, setStudyHours] = useState('4');
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  const handleGenerate = () => {
    const config = {
      startTime,
      maxDailyHours: Number(studyHours) || 4
    };
    const result = aiService.generateStudyPlan(tasks, config);
    setPlan(result);
  };

  const renderScheduledItem = ({ item }: { item: ScheduledTask }) => (
    <View style={styles.taskItem}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {item.startTime ? item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </Text>
        <Text style={styles.toText}>to</Text>
        <Text style={styles.timeText}>
          {item.endTime ? item.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </Text>
      </View>
      <View style={styles.taskDetails}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.badges}>
          {item.priority === 'high' && <Text style={styles.highBadge}>High Priority</Text>}
          {item.isDaily && <Text style={styles.dailyBadge}>Daily</Text>}
        </View>
        <Text style={styles.taskDuration}>{item.estimatedTime} min</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Study Planner</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.configContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Study Hours</Text>
            <TextInput
              style={styles.input}
              value={studyHours}
              onChangeText={setStudyHours}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity onPress={handleGenerate} style={styles.generateButton}>
            <Text style={styles.buttonText}>Generate Plan</Text>
          </TouchableOpacity>
        </View>

        {plan && (
          <View style={styles.results}>
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                Total: {(plan.summary.totalStudyMinutes / 60).toFixed(1)} hrs • Deferred: {plan.summary.tasksDeferred} tasks
              </Text>
            </View>

            <Text style={styles.sectionHeader}>Today's Schedule</Text>
            {plan.todaySchedule.length > 0 ? (
              plan.todaySchedule.map(task => (
                <View key={task.id} style={styles.wrapper}>
                  {renderScheduledItem({ item: task })}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No tasks scheduled for today.</Text>
            )}

            {plan.upcomingTasks.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Upcoming / Deferred</Text>
                {plan.upcomingTasks.map(task => (
                  <View key={task.id} style={styles.upcomingItem}>
                    <Text style={styles.upcomingTitle}>{task.title}</Text>
                    <Text style={styles.upcomingMeta}>{task.priority} • {task.estimatedTime} min</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  configContainer: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 8,
    color: colors.text,
  },
  generateButton: {
    backgroundColor: colors.tint,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minWidth: 80,
  },
  timeText: {
    fontWeight: 'bold',
    color: colors.text,
  },
  toText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  taskDetails: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 4,
  },
  highBadge: {
    fontSize: 10,
    color: '#ff4d4d',
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  dailyBadge: {
    fontSize: 10,
    color: colors.tint,
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  upcomingItem: {
    padding: 12,
    backgroundColor: '#f9f9f9', // Slightly distinct
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingTitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  upcomingMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  summary: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#e0f7fa',
    borderRadius: 4,
  },
  summaryText: {
    color: '#006064',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  wrapper: {}, // Helper
  results: {
    paddingBottom: 40,
  },
  emptyText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
  }
});