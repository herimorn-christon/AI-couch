import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Play, Info, CheckCircle, Camera } from 'lucide-react-native';
import { Exercise, ExerciseSet } from '@/types';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';

interface ExerciseCardProps {
  exercise: Exercise;
  currentSetIndex: number;
  onStartSet: () => void;
  onCompleteSet: (formScore?: number) => void;
  onViewInstructions: () => void;
  onAnalyzeForm: () => void;
  canAnalyzeForm: boolean;
}

export default function ExerciseCard({
  exercise,
  currentSetIndex,
  onStartSet,
  onCompleteSet,
  onViewInstructions,
  onAnalyzeForm,
  canAnalyzeForm,
}: ExerciseCardProps) {
  const [isSetActive, setIsSetActive] = useState(false);
  
  const currentSet = exercise.sets[currentSetIndex];
  const completedSets = exercise.sets.filter(set => set.completed).length;
  const progress = (completedSets / exercise.sets.length) * 100;

  const handleStartSet = () => {
    setIsSetActive(true);
    onStartSet();
  };

  const handleCompleteSet = (formScore?: number) => {
    setIsSetActive(false);
    onCompleteSet(formScore);
  };

  const renderSetInfo = (set: ExerciseSet) => {
    if (set.type === 'reps') {
      return `${set.reps} reps${set.weight ? ` @ ${set.weight}kg` : ''}`;
    } else if (set.type === 'time') {
      return `${set.duration}s`;
    } else if (set.type === 'distance') {
      return `${set.distance}m`;
    }
    return '';
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{exercise.name}</Text>
          <TouchableOpacity onPress={onViewInstructions} style={styles.infoButton}>
            <Info size={20} color="#7F8C8D" />
          </TouchableOpacity>
        </View>
        <Text style={styles.muscles}>{exercise.targetMuscles.join(', ')}</Text>
      </View>

      {exercise.imageUrl && (
        <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseImage} />
      )}

      <ProgressBar 
        progress={progress} 
        label={`Set ${currentSetIndex + 1} of ${exercise.sets.length}`}
        showPercentage={true}
      />

      <View style={styles.currentSet}>
        <Text style={styles.setLabel}>Current Set:</Text>
        <Text style={styles.setInfo}>{renderSetInfo(currentSet)}</Text>
        {currentSet.formScore && (
          <Text style={styles.formScore}>Form Score: {currentSet.formScore}%</Text>
        )}
      </View>

      <View style={styles.actions}>
        {!isSetActive ? (
          <TouchableOpacity onPress={handleStartSet} style={styles.startButton}>
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Set</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeSetActions}>
            {canAnalyzeForm && (
              <TouchableOpacity onPress={onAnalyzeForm} style={styles.analyzeButton}>
                <Camera size={18} color="#FF6B35" />
                <Text style={styles.analyzeButtonText}>Analyze Form</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => handleCompleteSet()} 
              style={styles.completeButton}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {exercise.sets.length > 1 && (
        <View style={styles.allSets}>
          <Text style={styles.allSetsLabel}>All Sets:</Text>
          <View style={styles.setsGrid}>
            {exercise.sets.map((set, index) => (
              <View 
                key={set.id} 
                style={[
                  styles.setItem,
                  set.completed && styles.setCompleted,
                  index === currentSetIndex && styles.setCurrent,
                ]}
              >
                <Text style={[
                  styles.setItemText,
                  set.completed && styles.setCompletedText,
                  index === currentSetIndex && styles.setCurrentText,
                ]}>
                  {index + 1}
                </Text>
                {set.completed && set.formScore && (
                  <Text style={styles.setFormScore}>{set.formScore}%</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {currentSet.aiNotes && (
        <View style={styles.aiNotes}>
          <Text style={styles.aiNotesText}>🤖 {currentSet.aiNotes}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  muscles: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FF6B35',
    textTransform: 'capitalize',
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  currentSet: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  setLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    marginBottom: 4,
  },
  setInfo: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  formScore: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#27AE60',
    marginTop: 4,
  },
  actions: {
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  activeSetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  analyzeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  allSets: {
    marginBottom: 12,
  },
  allSetsLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCompleted: {
    backgroundColor: '#27AE60',
  },
  setCurrent: {
    backgroundColor: '#FF6B35',
  },
  setItemText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#7F8C8D',
  },
  setCompletedText: {
    color: '#FFFFFF',
  },
  setCurrentText: {
    color: '#FFFFFF',
  },
  setFormScore: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    position: 'absolute',
    bottom: -2,
  },
  aiNotes: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  aiNotesText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#1976D2',
    lineHeight: 18,
  },
});