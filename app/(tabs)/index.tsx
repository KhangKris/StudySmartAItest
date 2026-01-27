import AddEditTaskModal from '@/components/AddEditTaskModal';
import ProgressBar from '@/components/ProgressBar';
import TaskItem from '@/components/TaskItem';
import Colors from '@/constants/Colors';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import { Task } from '@/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

const DEFAULT_NEW_TASK: Partial<Task> = {
  title: '',
  description: '',
  dueDate: new Date().toISOString(),
  priority: 'medium',
  estimatedTime: 30,
  isDaily: false,
  completed: false,
  isToday: false,
};

type ListItem = Task | { id: string; type: 'header'; title: string };

export default function HomeScreen() {
  const { tasks, addTask, updateTask } = useTaskStore();
  const { profile } = useUserStore();

  const [isModalVisible, setModalVisible] = useState(false);
  const [taskData, setTaskData] = useState<Partial<Task>>(DEFAULT_NEW_TASK);

  const listData = useMemo(() => {
    const todayList = tasks.filter(t => t.isToday);
    const backlogList = tasks.filter(t => !t.isToday);

    const data: ListItem[] = [
      { id: 'HEADER_TODAY', type: 'header', title: 'Today Tasks' },
      ...todayList,
      { id: 'HEADER_WEEK', type: 'header', title: 'Week Tasks' },
      ...backlogList
    ];
    return data;
  }, [tasks]);

  const progress = useMemo(() => {
    const todayList = tasks.filter(t => t.isToday);
    if (todayList.length === 0) return 0;
    const completed = todayList.filter(t => t.completed);
    return completed.length / todayList.length;
  }, [tasks]);

  const handleOpenModal = (task?: Task) => {
    setTaskData(task || DEFAULT_NEW_TASK);
    setModalVisible(true);
  };

  const handleDataChange = (field: keyof Task, value: Task[keyof Task]) => {
    setTaskData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!taskData.title || !taskData.estimatedTime) {
      Alert.alert('Missing Info', 'Please provide a title and estimated time.');
      return;
    }

    if (taskData.id) {
      // It's an existing task
      const originalTask = tasks.find(t => t.id === taskData.id);
      if (originalTask) {
        const updatedTask = { ...originalTask, ...taskData };
        updateTask(updatedTask);
      }
    } else {
      // It's a new task
      addTask(taskData as Omit<Task, 'id' | 'status'>);
    }
    setModalVisible(false);
  };

  const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<ListItem>) => {
    const index = getIndex();

    // Determine if item is last in its section to apply stylistic touches (optional)
    const allHeaderIndex = listData.findIndex(i => 'type' in i && i.id === 'HEADER_WEEK');
    const isLastInToday = allHeaderIndex !== -1 && index === allHeaderIndex - 1;
    const isLastInAll = index === listData.length - 1;

    if ('type' in item && item.type === 'header') {
      return (
        <View style={[styles.sectionHeader, { marginTop: item.id === 'HEADER_WEEK' ? 24 : 0 }]}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }

    const task = item as Task;

    return (
      <ScaleDecorator>
        <View
          style={[
            styles.itemContainer,
            isActive && { backgroundColor: '#e0e0e0', opacity: 0.8 },
            {
              backgroundColor: Colors.light.background,
              borderBottomWidth: (isLastInToday || isLastInAll) ? 0 : 1,
              borderBottomColor: Colors.light.border
            }
          ]}
        >
          <TaskItem
            task={task}
            onEdit={() => handleOpenModal(task)}
            onLongPress={drag}
            onToggleToday={() => updateTask({ ...task, isToday: !task.isToday })}
          />
        </View>
      </ScaleDecorator>
    );
  }, [handleOpenModal, listData]);

  const onDragEnd = useCallback(({ data }: { data: ListItem[] }) => {
    // Logic: Find index of HEADER_WEEK. Items before it -> isToday=true. After -> isToday=false.

    const allHeaderIndex = data.findIndex(item => 'type' in item && item.id === 'HEADER_WEEK');

    data.forEach((item, index) => {
      if ('type' in item && item.type === 'header') return;

      const task = item as Task;
      // Items before Week Header are Today
      // If header not found (shouldn't happen), assume all Today? Or no change.
      const shouldBeToday = allHeaderIndex !== -1 && index < allHeaderIndex;

      if (task.isToday !== shouldBeToday) {
        updateTask({ ...task, isToday: shouldBeToday });
      }
    });
  }, [updateTask]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hello, {profile.username}!</Text>
        <Text style={styles.subtitle}>Today&apos;s Progress</Text>
        <ProgressBar progress={progress} />
      </View>

      <DraggableFlatList
        data={listData}
        onDragEnd={onDragEnd}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <AddEditTaskModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        taskData={taskData}
        onDataChange={handleDataChange}
      />

      <TouchableOpacity style={styles.fab} onPress={() => handleOpenModal()}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.lightGray,
    flex: 1,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    bottom: 30,
    elevation: 8,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: 30,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 60,
    zIndex: 100,
  },
  header: {
    backgroundColor: Colors.light.background,
    borderBottomColor: Colors.light.border,
    borderBottomWidth: 1,
    padding: 24,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: Colors.light.darkGray,
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    paddingVertical: 12,
  },
  sectionTitle: {
    color: Colors.light.darkGray,
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  }
});
