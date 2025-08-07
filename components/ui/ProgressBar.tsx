import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
}

export default function ProgressBar({
  progress,
  height = 8,
  color = '#FF6B35',
  backgroundColor = '#E8E8E8',
  showPercentage = false,
  label,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.track, { height, backgroundColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2C3E50',
    marginBottom: 4,
  },
  track: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    textAlign: 'right',
    marginTop: 4,
  },
});