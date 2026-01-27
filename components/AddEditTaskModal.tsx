/* eslint-disable react-native/no-unused-styles */
import Colors from '@/constants/Colors';
import { Task, TaskPriority } from '@/types';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useColorScheme } from './useColorScheme';

interface AddEditTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  taskData: Partial<Task>;
  onDataChange: (
    field: keyof Task,
    value: string | number | TaskPriority | boolean
  ) => void;
}

const priorities: TaskPriority[] = ['low', 'medium', 'high'];
const OVERLAY_COLOR = 'rgba(0,0,0,0.5)';

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
  isVisible,
  onClose,
  onSave,
  taskData,
  onDataChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = getStyles(colors);

  const [isCalendarVisible, setCalendarVisible] = useState(false);

  const dueDate = useMemo(() => {
    return taskData.dueDate ? new Date(taskData.dueDate) : new Date();
  }, [taskData.dueDate]);

  // Format date for the Calendar component (YYYY-MM-DD)
  const markedDate = dueDate.toISOString().split('T')[0];

  const showCalendar = () => setCalendarVisible(true);
  const hideCalendar = () => setCalendarVisible(false);

  const handleDayPress = (day: DateData) => {
    // Construct a date from the dateString (YYYY-MM-DD)
    // We add T12:00:00 to avoid timezone shifts when parsing partial dates
    const selectedDate = new Date(day.dateString + 'T12:00:00');
    onDataChange('dueDate', selectedDate.toISOString());
    hideCalendar();
  };

  return (
    <>
      <Modal visible={isVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {taskData.id ? 'Edit Task' : 'New Task'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Task Title"
              placeholderTextColor={colors.tabIconDefault}
              value={taskData.title ?? ''}
              onChangeText={text => onDataChange('title', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={taskData.description ?? ''}
              onChangeText={text => onDataChange('description', text)}
            />

            <TouchableOpacity style={styles.input} onPress={showCalendar}>
              <Text style={styles.dueDateText}>
                Due: {dueDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Priority:</Text>
              {priorities.map(priority => (
                <TouchableOpacity
                  key={priority}
                  onPress={() => onDataChange('priority', priority)}
                  style={[
                    styles.priorityButton,
                    taskData.priority === priority &&
                    styles.priorityButtonSelected,
                  ]}
                >
                  <Text style={styles.priorityButtonText}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Daily Task (Recur every day)</Text>
              <Switch
                trackColor={{ false: colors.tabIconDefault, true: colors.tint }}
                thumbColor={colors.background}
                onValueChange={(val) => onDataChange('isDaily', val)}
                value={!!taskData.isDaily}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Estimated Time (minutes)"
              placeholderTextColor={colors.tabIconDefault}
              keyboardType="numeric"
              value={
                taskData.estimatedTime !== undefined
                  ? String(taskData.estimatedTime)
                  : ''
              }
              onChangeText={text =>
                onDataChange(
                  'estimatedTime',
                  Number.isNaN(Number(text)) ? 0 : Number(text)
                )
              }
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={onSave}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isCalendarVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={hideCalendar}
        >
          <View style={styles.calendarContent}>
            <Calendar
              current={markedDate}
              onDayPress={handleDayPress}
              markedDates={{
                [markedDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: colors.tint
                },
              }}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.tint,
                selectedDayTextColor: colors.background,
                todayTextColor: colors.tint,
                dayTextColor: colors.text,
                textDisabledColor: colors.tabIconDefault,
                arrowColor: colors.tint,
                monthTextColor: colors.text,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const getStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: OVERLAY_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 20,
      elevation: 10,
    },
    calendarContent: {
      width: '90%',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 10,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 5,
      padding: 10,
      marginBottom: 15,
      justifyContent: 'center',
    },
    dueDateText: {
      color: colors.text,
      textAlign: 'center',
    },
    priorityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    priorityLabel: {
      color: colors.text,
    },
    priorityButton: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginLeft: 10,
    },
    priorityButtonSelected: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    priorityButtonText: {
      color: colors.text,
      textTransform: 'capitalize',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 20,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
      marginLeft: 10,
    },
    cancelButton: {
      backgroundColor: colors.tabIconDefault,
    },
    saveButton: {
      backgroundColor: colors.tint,
    },
    buttonText: {
      color: colors.background,
      fontWeight: 'bold',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
      paddingHorizontal: 4,
    },
    switchLabel: {
      color: colors.text,
      fontSize: 16,
    }
  });

export default AddEditTaskModal;
