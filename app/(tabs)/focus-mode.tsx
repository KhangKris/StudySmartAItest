/* eslint-disable react-hooks/exhaustive-deps */
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { databaseService } from '@/services/databaseService';
import { useTaskStore } from '@/store/taskStore';
import { useUserStore } from '@/store/userStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FocusModeScreen() {
  const { profile, setFocusMode } = useUserStore();
  const tasks = useTaskStore(state => state.tasks);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = getStyles(colors);

  const [logs, setLogs] = useState<any[]>([]);
  const isFocusActive = profile.isFocusModeActive;

  useEffect(() => {
    loadLogs();
  }, [profile.disciplinePoints]); // Reload when score changes

  const loadLogs = async () => {
    const history = await databaseService.getDisciplineLogs();
    setLogs(history);
  };

  const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'pending'), [tasks]);

  const toggleFocusMode = () => {
    if (!isFocusActive) {
      if (pendingTasks.length === 0) {
        Alert.alert('All Clear!', 'You have no pending tasks. No need for focus mode.');
        return;
      }
      setFocusMode(true);
      Alert.alert('Focus Mode Activated', 'Stay in the app to avoid penalties!');
    } else {
      // If forced (score < 50), maybe prevent?
      if (profile.disciplinePoints < 50) {
        Alert.alert('Locked!', 'Discipline score too low. You cannot disable Focus Mode yet.');
        return;
      }
      setFocusMode(false);
      Alert.alert('Focus Mode Deactivated', 'Good job staying focused.');
    }
  };

  const renderLogItem = ({ item }: { item: any }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={[styles.logChange, item.change < 0 ? styles.negative : styles.positive]}>
          {item.change > 0 ? '+' : ''}{item.change}
        </Text>
      </View>
      <Text style={styles.logReason}>{item.reason}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discipline Dashboard</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Discipline Score</Text>
        <Text style={[styles.score, profile.disciplinePoints < 50 && styles.scoreDanger]}>
          {profile.disciplinePoints}
        </Text>
        <TouchableOpacity
          style={[styles.toggleButton, isFocusActive && styles.toggleButtonActive]}
          onPress={toggleFocusMode}
        >
          <FontAwesome name={isFocusActive ? "lock" : "unlock"} size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.toggleButtonText}>
            {isFocusActive ? 'Focus Mode ON' : 'Enable Focus Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>History</Text>
        {logs.length > 0 ? (
          <FlatList
            data={logs}
            keyExtractor={item => item.id.toString()}
            renderItem={renderLogItem}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <Text style={styles.emptyText}>No discipline records yet.</Text>
        )}
      </View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  scoreCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.tint,
    marginBottom: 16,
  },
  scoreDanger: {
    color: '#ff4d4d',
  },
  toggleButton: {
    flexDirection: 'row',
    backgroundColor: colors.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ff4d4d', // Red for locked/active
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  logItem: {
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.tint,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logChange: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  positive: { color: 'green' },
  negative: { color: 'red' },
  logReason: {
    color: colors.text,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    fontStyle: 'italic',
  }
});
