import { create } from 'zustand';
import { Workout, Exercise, WorkoutPerformance } from '@/types';

interface WorkoutState {
  currentWorkout: Workout | null;
  workoutHistory: Workout[];
  isWorkoutActive: boolean;
  currentExerciseIndex: number;
  currentSetIndex: number;
  workoutTimer: number;
  restTimer: number;
  startWorkout: (workout: Workout) => void;
  completeSet: (formScore?: number) => void;
  completeExercise: () => void;
  completeWorkout: (performance: WorkoutPerformance) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  generateAIWorkout: (preferences: any) => Promise<Workout>;
  getWorkoutHistory: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentWorkout: null,
  workoutHistory: [],
  isWorkoutActive: false,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  workoutTimer: 0,
  restTimer: 0,

  startWorkout: (workout: Workout) => {
    set({
      currentWorkout: workout,
      isWorkoutActive: true,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      workoutTimer: 0,
      restTimer: 0,
    });
  },

  completeSet: (formScore?: number) => {
    const state = get();
    if (!state.currentWorkout) return;

    const currentExercise = state.currentWorkout.exercises[state.currentExerciseIndex];
    const currentSet = currentExercise.sets[state.currentSetIndex];

    // Update set completion
    currentSet.completed = true;
    if (formScore) currentSet.formScore = formScore;

    // Move to next set or exercise
    if (state.currentSetIndex < currentExercise.sets.length - 1) {
      set({
        currentSetIndex: state.currentSetIndex + 1,
        restTimer: currentExercise.restTime,
      });
    } else {
      get().completeExercise();
    }
  },

  completeExercise: () => {
    const state = get();
    if (!state.currentWorkout) return;

    if (state.currentExerciseIndex < state.currentWorkout.exercises.length - 1) {
      set({
        currentExerciseIndex: state.currentExerciseIndex + 1,
        currentSetIndex: 0,
      });
    } else {
      // Workout completed
      const performance: WorkoutPerformance = {
        duration: state.workoutTimer,
        completedSets: state.currentWorkout.exercises.reduce(
          (total, exercise) => total + exercise.sets.filter(set => set.completed).length,
          0
        ),
        totalSets: state.currentWorkout.exercises.reduce(
          (total, exercise) => total + exercise.sets.length,
          0
        ),
        averageFormScore: 85, // Calculate from actual form scores
        caloriesBurned: Math.round(state.workoutTimer * 0.1), // Estimate
      };

      get().completeWorkout(performance);
    }
  },

  completeWorkout: async (performance: WorkoutPerformance) => {
    const state = get();
    if (!state.currentWorkout) return;

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/workouts/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: state.currentWorkout.id,
          performance,
        }),
      });

      if (response.ok) {
        set({
          currentWorkout: null,
          isWorkoutActive: false,
          currentExerciseIndex: 0,
          currentSetIndex: 0,
          workoutTimer: 0,
        });

        // Refresh workout history
        get().getWorkoutHistory();
      }
    } catch (error) {
      console.error('Failed to complete workout:', error);
    }
  },

  pauseWorkout: () => {
    set({ isWorkoutActive: false });
  },

  resumeWorkout: () => {
    set({ isWorkoutActive: true });
  },

  generateAIWorkout: async (preferences: any): Promise<Workout> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ai/generate-workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) throw new Error('Failed to generate workout');

      const workout = await response.json();
      return workout;
    } catch (error) {
      console.error('AI workout generation failed:', error);
      throw error;
    }
  },

  getWorkoutHistory: async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/workouts/history`);
      if (response.ok) {
        const history = await response.json();
        set({ workoutHistory: history });
      }
    } catch (error) {
      console.error('Failed to fetch workout history:', error);
    }
  },

  pauseWorkout: () => {
    set({ isWorkoutActive: false });
  },

  resumeWorkout: () => {
    set({ isWorkoutActive: true });
  },
}));