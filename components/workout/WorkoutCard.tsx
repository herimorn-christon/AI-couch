import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Clock, Users, Zap, Trophy } from 'lucide-react-native';
import { Workout } from '@/types';
import Card from '@/components/ui/Card';

interface WorkoutCardProps {
  workout: Workout;
  onPress: () => void;
  showStats?: boolean;
}

export default function WorkoutCard({ workout, onPress, showStats = false }: WorkoutCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#27AE60';
      case 'intermediate': return '#F39C12';
      case 'advanced': return '#E74C3C';
      default: return '#BDC3C7';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{workout.name}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) }]}>
              <Text style={styles.difficultyText}>{workout.difficulty}</Text>
            </View>
          </View>
          {workout.createdBy === 'ai' && (
            <View style={styles.aiBadge}>
              <Zap size={12} color="#FFD700" />
              <Text style={styles.aiText}>AI</Text>
            </View>
          )}
        </View>

        {workout.description && (
          <Text style={styles.description} numberOfLines={2}>
            {workout.description}
          </Text>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Clock size={16} color="#7F8C8D" />
            <Text style={styles.statText}>{formatDuration(workout.duration)}</Text>
          </View>
          <View style={styles.stat}>
            <Users size={16} color="#7F8C8D" />
            <Text style={styles.statText}>{workout.exercises.length} exercises</Text>
          </View>
          {workout.calories && (
            <View style={styles.stat}>
              <Text style={styles.caloriesText}>{workout.calories} cal</Text>
            </View>
          )}
        </View>

        {showStats && workout.rating && (
          <View style={styles.ratingContainer}>
            <Trophy size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{workout.rating}/5</Text>
          </View>
        )}

        {workout.aiCoachingNotes && (
          <View style={styles.aiNotes}>
            <Text style={styles.aiNotesText} numberOfLines={1}>
              💡 {workout.aiCoachingNotes}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  aiText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  caloriesText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  aiNotes: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  aiNotesText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2C3E50',
  },
});