export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'free' | 'premium' | 'elite' | 'trainer' | 'admin';
  subscriptionStatus: 'active' | 'inactive' | 'canceled';
  subscriptionTier?: 'premium' | 'elite';
  createdAt: string;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  notifications: boolean;
  voiceCoaching: boolean;
  formAnalysis: boolean;
  goals: FitnessGoals;
}

export interface FitnessGoals {
  primaryGoal: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness';
  targetWeight?: number;
  weeklyWorkouts: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserStats {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageRating: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  description?: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: WorkoutCategory;
  exercises: Exercise[];
  aiCoachingNotes?: string;
  completedAt?: string;
  rating?: number;
  calories?: number;
  createdBy: 'user' | 'ai' | 'trainer';
  isPublic: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  targetMuscles: string[];
  instructions: string[];
  tips: string[];
  videoUrl?: string;
  imageUrl?: string;
  sets: ExerciseSet[];
  restTime: number;
  formCheckpoints: FormCheckpoint[];
}

export interface ExerciseSet {
  id: string;
  type: 'reps' | 'time' | 'distance';
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed: boolean;
  formScore?: number;
  aiNotes?: string;
}

export interface FormCheckpoint {
  id: string;
  description: string;
  keyPoints: string[];
  commonMistakes: string[];
}

export type WorkoutCategory = 
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'sports'
  | 'rehabilitation'
  | 'yoga'
  | 'pilates'
  | 'hiit'
  | 'functional';

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'full_body';

export interface NutritionLog {
  id: string;
  userId: string;
  date: string;
  meals: Meal[];
  totalCalories: number;
  macros: Macros;
  waterIntake: number;
  aiRecommendations?: string[];
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  calories: number;
  macros: Macros;
  loggedAt: string;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  calories: number;
  macros: Macros;
  imageUrl?: string;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface AICoach {
  generateWorkout: (preferences: UserPreferences, history: Workout[]) => Promise<Workout>;
  analyzeForm: (videoData: Blob, exercise: Exercise) => Promise<FormAnalysis>;
  provideFeedback: (workout: Workout, performance: WorkoutPerformance) => Promise<string>;
  predictProgress: (history: Workout[], goals: FitnessGoals) => Promise<ProgressPrediction>;
}

export interface FormAnalysis {
  overallScore: number;
  feedback: FormFeedback[];
  improvements: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface FormFeedback {
  checkpoint: string;
  score: number;
  feedback: string;
  timestamp: number;
}

export interface WorkoutPerformance {
  duration: number;
  completedSets: number;
  totalSets: number;
  averageFormScore: number;
  caloriesBurned: number;
  heartRateData?: number[];
}

export interface ProgressPrediction {
  timeToGoal: number;
  confidenceLevel: number;
  recommendations: string[];
  potentialChallenges: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'premium' | 'elite';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  features: SubscriptionFeature[];
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface Trainer {
  id: string;
  userId: string;
  certification: string[];
  specialties: string[];
  experience: number;
  rating: number;
  hourlyRate: number;
  bio: string;
  clients: string[];
  earnings: TrainerEarnings;
}

export interface TrainerEarnings {
  totalEarned: number;
  monthlyEarnings: number;
  commissionRate: number;
  payoutHistory: Payout[];
}

export interface Payout {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}