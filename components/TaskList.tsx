import { Task } from '@/types';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  scrollEnabled?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, scrollEnabled = true }) => {
  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks yet. Add one to get started!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <TaskItem task={item} onEdit={() => onEdit(item)} />}
      contentContainerStyle={styles.list}
      scrollEnabled={scrollEnabled}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
});

export default TaskList;
