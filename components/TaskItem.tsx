import { useTaskStore } from '@/store/taskStore';
import { Task, TaskPriority } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface TaskItemProps {
  task: Task;
  onEdit: () => void;
  onLongPress?: () => void;
  onToggleToday?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  high: '#ff4d4d',
  medium: '#ffa500',
  low: '#888',
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, onLongPress, onToggleToday }) => {
  const { updateTask, deleteTask } = useTaskStore();

  const toggleComplete = () => {
    const isDone = !task.completed;
    updateTask({
      ...task,
      status: isDone ? 'completed' : 'pending',
      completed: isDone,
      completedAt: isDone ? new Date().toISOString() : undefined
    });
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'pending';
  const status = isOverdue ? 'overdue' : task.status;

  return (
    <View style={[styles.container, status === 'completed' && styles.completedContainer]}>
      <TouchableOpacity onPress={toggleComplete} style={styles.checkboxContainer}>
        <FontAwesome
          name={status === 'completed' ? 'check-square-o' : 'square-o'}
          size={24}
          color={status === 'completed' ? '#888' : '#333'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onEdit}
        onLongPress={onLongPress}
        style={styles.taskDetails}
      >
        <Text style={[styles.title, status === 'completed' && styles.completedText]}>
          {task.title}
        </Text>
        <Text style={styles.deadline}>
          Due: {new Date(task.dueDate).toLocaleString()}
          {isOverdue && <Text style={styles.overdueText}> (Overdue)</Text>}
        </Text>
        {task.isDaily && <Text style={styles.dailyText}> ↻ Daily</Text>}
        {task.isDaily && <Text style={styles.dailyText}> ↻ Daily</Text>}
      </TouchableOpacity>

      {onToggleToday && (
        <TouchableOpacity onPress={onToggleToday} style={styles.actionButton}>
          <FontAwesome
            name={task.isToday ? 'arrow-down' : 'arrow-up'}
            size={20}
            color="#2f95dc"
          />
        </TouchableOpacity>
      )}

      {
        task.completed && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <FontAwesome name="trash-o" size={24} color="#ff4d4d" />
          </TouchableOpacity>
        )
      }

      <View style={[styles.priorityIndicator, { backgroundColor: priorityColors[task.priority] }]} />
    </View >
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    marginRight: 16,
  },
  completedContainer: {
    backgroundColor: '#f0f0f0',
  },
  completedText: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  deadline: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  overdueText: {
    color: '#ff4d4d',
    fontWeight: 'bold',
  },
  priorityIndicator: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
    bottom: 0,
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 10,
  },
  taskDetails: {
    flex: 1,
  },
  title: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  dailyText: {
    color: '#2f95dc',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  }
});

export default TaskItem;
