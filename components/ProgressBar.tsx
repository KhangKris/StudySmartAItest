import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${clampedProgress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{`${Math.round(clampedProgress * 100)}%`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#4caf50',
    borderRadius: 5,
    height: '100%',
  },
  container: {
    marginBottom: 16,
    width: '100%',
  },
  progressText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center'
  },
  track: {
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
  }
});

export default ProgressBar;
