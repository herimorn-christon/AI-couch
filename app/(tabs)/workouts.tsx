import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Filter, Plus, Zap } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useAuthStore } from '@/stores/authStore';
import WorkoutCard from '@/components/workout/WorkoutCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function WorkoutsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const { workoutHistory, generateAIWorkout, getWorkoutHistory } = useWorkoutStore();
  const { hasFeature } = useAuthStore();

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'strength', label: 'Strength' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'hiit', label: 'HIIT' },
    { id: 'yoga', label: 'Yoga' },
    { id: 'flexibility', label: 'Flexibility' },
  ];

  useEffect(() => {
    getWorkoutHistory();
  }, []);

  const filteredWorkouts = workoutHistory.filter(workout => {
    const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || workout.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerateAIWorkout = async () => {
    try {
      const preferences = { /* user preferences */ };
      const aiWorkout = await generateAIWorkout(preferences);
      router.push(`/workout/${aiWorkout.id}`);
    } catch (error) {
      console.error('Failed to generate AI workout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <TouchableOpacity 
            onPress={() => router.push('/workout/create')}
            style={styles.createButton}
          >
            <Plus size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#7F8C8D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search workouts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#BDC3C7"
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* AI Workout Generator */}
        {hasFeature('ai_coaching') && (
          <Card style={styles.aiGeneratorCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIcon}>
                <Zap size={20} color="#FFD700" />
              </View>
              <Text style={styles.aiTitle}>AI Workout Generator</Text>
            </View>
            <Text style={styles.aiDescription}>
              Let AI create a personalized workout based on your goals and preferences
            </Text>
            <Button
              title="Generate AI Workout"
              onPress={handleGenerateAIWorkout}
              variant="primary"
              style={styles.aiButton}
            />
          </Card>
        )}

        {/* Workout List */}
        <View style={styles.workoutsList}>
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => router.push(`/workout/${workout.id}`)}
                showStats={true}
              />
            ))
          ) : (
            <Card style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No workouts found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery 
                  ? `No workouts match "${searchQuery}"`
                  : 'Start your fitness journey by creating your first workout'
                }
              </Text>
              <Button
                title="Create Workout"
                onPress={() => router.push('/workout/create')}
                variant="primary"
                style={styles.emptyButton}
              />
            </Card>
          )}
        </View>

        {/* Quick Start Workouts */}
        <Card>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <Text style={styles.sectionDescription}>
            Popular workout templates to get you started
          </Text>
          
          <View style={styles.quickStartGrid}>
            <TouchableOpacity style={styles.quickStartItem}>
              <Text style={styles.quickStartEmoji}>💪</Text>
              <Text style={styles.quickStartTitle}>Full Body</Text>
              <Text style={styles.quickStartDuration}>45 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickStartItem}>
              <Text style={styles.quickStartEmoji}>🏃‍♂️</Text>
              <Text style={styles.quickStartTitle}>Cardio Blast</Text>
              <Text style={styles.quickStartDuration}>30 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickStartItem}>
              <Text style={styles.quickStartEmoji}>🧘‍♀️</Text>
              <Text style={styles.quickStartTitle}>Yoga Flow</Text>
              <Text style={styles.quickStartDuration}>60 min</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickStartItem}>
              <Text style={styles.quickStartEmoji}>⚡</Text>
              <Text style={styles.quickStartTitle}>HIIT</Text>
              <Text style={styles.quickStartDuration}>20 min</Text>
            </TouchableOpacity>
          </View>
        </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesContainer: {
    paddingLeft: 24,
    marginBottom: 24,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  aiGeneratorCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  aiTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  aiDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginBottom: 16,
    lineHeight: 20,
  },
  aiButton: {
    marginTop: 8,
  },
  workoutsList: {
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    minWidth: 160,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginBottom: 20,
  },
  quickStartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickStartItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  quickStartEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickStartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  quickStartDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
});