import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Play, Zap, Trophy, Target, Calendar, TrendingUp } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import WorkoutCard from '@/components/workout/WorkoutCard';

export default function HomeScreen() {
  const { user, hasFeature } = useAuthStore();
  const { generateAIWorkout, workoutHistory, getWorkoutHistory } = useWorkoutStore();
  const [refreshing, setRefreshing] = useState(false);
  const [aiWorkout, setAiWorkout] = useState(null);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  useEffect(() => {
    getWorkoutHistory();
    if (hasFeature('ai_coaching')) {
      generateTodaysWorkout();
    }
  }, []);

  const generateTodaysWorkout = async () => {
    if (!user?.preferences) return;
    
    setIsGeneratingWorkout(true);
    try {
      const workout = await generateAIWorkout(user.preferences);
      setAiWorkout(workout);
    } catch (error) {
      console.error('Failed to generate AI workout:', error);
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getWorkoutHistory();
    if (hasFeature('ai_coaching')) {
      await generateTodaysWorkout();
    }
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todaysStats = {
    streak: user?.stats?.currentStreak || 0,
    weeklyProgress: 4, // Calculate from actual data
    calories: 1250,
    minutes: 45,
  };

  const recentWorkouts = workoutHistory.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.firstName || 'Athlete'}!</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/profile')}
              style={styles.avatarContainer}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todaysStats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todaysStats.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todaysStats.minutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* AI Workout Recommendation */}
          {hasFeature('ai_coaching') && (
            <Card style={styles.aiWorkoutCard}>
              <View style={styles.cardHeader}>
                <View style={styles.aiIcon}>
                  <Zap size={20} color="#FFD700" />
                </View>
                <Text style={styles.cardTitle}>AI Workout Recommendation</Text>
              </View>
              
              {isGeneratingWorkout ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Generating your perfect workout...</Text>
                </View>
              ) : aiWorkout ? (
                <WorkoutCard
                  workout={aiWorkout}
                  onPress={() => router.push(`/workout/${aiWorkout.id}`)}
                />
              ) : (
                <Button
                  title="Generate AI Workout"
                  onPress={generateTodaysWorkout}
                  variant="primary"
                />
              )}
            </Card>
          )}

          {/* Weekly Progress */}
          <Card>
            <View style={styles.cardHeader}>
              <Target size={20} color="#FF6B35" />
              <Text style={styles.cardTitle}>Weekly Progress</Text>
            </View>
            <ProgressBar
              progress={(todaysStats.weeklyProgress / 7) * 100}
              label={`${todaysStats.weeklyProgress} of 7 workouts completed`}
              showPercentage={true}
            />
            <Text style={styles.progressText}>
              Keep it up! You're {Math.round(((todaysStats.weeklyProgress / 7) * 100))}% towards your weekly goal.
            </Text>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/workouts/start')}
              >
                <Play size={24} color="#FF6B35" />
                <Text style={styles.actionText}>Start Workout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/progress')}
              >
                <TrendingUp size={24} color="#27AE60" />
                <Text style={styles.actionText}>View Progress</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/nutrition')}
              >
                <Target size={24} color="#3498DB" />
                <Text style={styles.actionText}>Log Nutrition</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Recent Workouts */}
          {recentWorkouts.length > 0 && (
            <Card>
              <View style={styles.cardHeader}>
                <Calendar size={20} color="#FF6B35" />
                <Text style={styles.cardTitle}>Recent Workouts</Text>
                <TouchableOpacity onPress={() => router.push('/workouts')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {recentWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onPress={() => router.push(`/workout/${workout.id}`)}
                  showStats={true}
                />
              ))}
            </Card>
          )}

          {/* Achievements */}
          {user?.stats?.achievements && user.stats.achievements.length > 0 && (
            <Card>
              <View style={styles.cardHeader}>
                <Trophy size={20} color="#FFD700" />
                <Text style={styles.cardTitle}>Recent Achievements</Text>
              </View>
              
              <View style={styles.achievements}>
                {user.stats.achievements.slice(0, 3).map((achievement) => (
                  <View key={achievement.id} style={styles.achievementItem}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <View style={styles.achievementText}>
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Subscription Upgrade */}
          {!hasFeature('ai_coaching') && (
            <Card style={styles.upgradeCard}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.upgradeGradient}>
                <Text style={styles.upgradeTitle}>Unlock AI Coaching</Text>
                <Text style={styles.upgradeDescription}>
                  Get personalized workouts, form analysis, and advanced insights
                </Text>
                <Button
                  title="Upgrade to Premium"
                  onPress={() => router.push('/subscription')}
                  variant="secondary"
                  style={styles.upgradeButton}
                />
              </LinearGradient>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  avatarContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  aiWorkoutCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  aiIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FF6B35',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    flex: 1,
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  achievements: {
    marginTop: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginTop: 2,
  },
  upgradeCard: {
    marginTop: 16,
    padding: 0,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 24,
    borderRadius: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 20,
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
});