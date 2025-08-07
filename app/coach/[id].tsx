import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, MapPin, Clock, Award, Users, Calendar, MessageCircle, Video, Heart } from 'lucide-react-native';
import { useCoachStore } from '@/stores/coachStore';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';

export default function CoachProfileScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  
  const { getCoachById, getCoachWorkouts, getCoachReviews } = useCoachStore();
  const { user } = useAuthStore();
  
  const [coach, setCoach] = useState<any>(null);
  const [workouts, setWorkouts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachData();
  }, [id]);

  const loadCoachData = async () => {
    try {
      const coachData = await getCoachById(id as string);
      const coachWorkouts = await getCoachWorkouts(id as string);
      const coachReviews = await getCoachReviews(id as string);
      
      setCoach(coachData);
      setWorkouts(coachWorkouts);
      setReviews(coachReviews);
    } catch (error) {
      console.error('Failed to load coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = () => {
    router.push(`/coach/${id}/book`);
  };

  const handleMessage = () => {
    router.push(`/chat/${coach.userId}`);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Update favorites in backend
  };

  if (loading || !coach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading coach profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <Card>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{coach.bio}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <View style={styles.specialtiesGrid}>
          {coach.specialties.map((specialty: string) => (
            <View key={specialty} style={styles.specialtyItem}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Certifications</Text>
        {coach.certifications.map((cert: any) => (
          <View key={cert.id} style={styles.certificationItem}>
            <Award size={20} color="#FFD700" />
            <View style={styles.certificationInfo}>
              <Text style={styles.certificationName}>{cert.name}</Text>
              <Text style={styles.certificationOrg}>{cert.organization}</Text>
              <Text style={styles.certificationDate}>Obtained: {cert.date}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Experience</Text>
        <View style={styles.experienceItem}>
          <Clock size={20} color="#FF6B35" />
          <Text style={styles.experienceText}>{coach.experience}+ years of training experience</Text>
        </View>
        <View style={styles.experienceItem}>
          <Users size={20} color="#FF6B35" />
          <Text style={styles.experienceText}>{coach.clientCount} clients trained</Text>
        </View>
        <View style={styles.experienceItem}>
          <Star size={20} color="#FFD700" />
          <Text style={styles.experienceText}>{coach.rating} average rating</Text>
        </View>
      </Card>
    </View>
  );

  const renderWorkoutsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Coach's Workouts ({workouts.length})</Text>
      {workouts.map((workout: any) => (
        <Card key={workout.id} style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>{workout.name}</Text>
            <View style={styles.workoutMeta}>
              <Text style={styles.workoutDuration}>{workout.duration} min</Text>
              <Text style={styles.workoutDifficulty}>{workout.difficulty}</Text>
            </View>
          </View>
          <Text style={styles.workoutDescription} numberOfLines={2}>
            {workout.description}
          </Text>
          <View style={styles.workoutStats}>
            <Text style={styles.workoutStat}>⭐ {workout.rating}</Text>
            <Text style={styles.workoutStat}>👥 {workout.completions} completed</Text>
            <Text style={styles.workoutStat}>🔥 {workout.calories} cal</Text>
          </View>
          <Button
            title="Try Workout"
            onPress={() => router.push(`/workout/${workout.id}`)}
            variant="outline"
            size="small"
          />
        </Card>
      ))}
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.reviewsHeader}>
        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
        <View style={styles.ratingBreakdown}>
          <Text style={styles.overallRating}>{coach.rating}</Text>
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map(rating => (
              <View key={rating} style={styles.ratingBar}>
                <Text style={styles.ratingLabel}>{rating}★</Text>
                <ProgressBar
                  progress={(coach.ratingBreakdown?.[rating] || 0) / coach.reviewCount * 100}
                  height={6}
                  color="#FFD700"
                />
                <Text style={styles.ratingCount}>{coach.ratingBreakdown?.[rating] || 0}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {reviews.map((review: any) => (
        <Card key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Image source={{ uri: review.user.avatar }} style={styles.reviewerAvatar} />
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerName}>{review.user.name}</Text>
              <View style={styles.reviewRating}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    color="#FFD700"
                    fill={i < review.rating ? "#FFD700" : "transparent"}
                  />
                ))}
              </View>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          </View>
          <Text style={styles.reviewText}>{review.comment}</Text>
        </Card>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#2C3E50" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Heart size={24} color={isFavorite ? "#FF6B35" : "#7F8C8D"} fill={isFavorite ? "#FF6B35" : "transparent"} />
          </TouchableOpacity>
        </View>

        {/* Coach Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: coach.avatar }} style={styles.profileAvatar} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{coach.name}</Text>
              {coach.isVerified && <Award size={20} color="#FFD700" />}
            </View>
            <View style={styles.ratingRow}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.profileRating}>{coach.rating}</Text>
              <Text style={styles.reviewCount}>({coach.reviewCount} reviews)</Text>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#7F8C8D" />
              <Text style={styles.profileLocation}>{coach.location}</Text>
            </View>
            <Text style={styles.profileTitle}>{coach.title}</Text>
          </View>
        </View>

        {/* Price and Actions */}
        <View style={styles.priceSection}>
          <View style={styles.priceInfo}>
            <Text style={styles.hourlyRate}>${coach.hourlyRate}/hour</Text>
            <Text style={styles.responseTime}>Responds in ~{coach.responseTime}</Text>
          </View>
          <View style={styles.actionButtons}>
            <Button
              title="Message"
              onPress={handleMessage}
              variant="outline"
              size="small"
              style={styles.messageButton}
            />
            <Button
              title="Book Session"
              onPress={handleBookSession}
              variant="primary"
              size="small"
              style={styles.bookButton}
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['about', 'workouts', 'reviews'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'workouts' && renderWorkoutsTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  profileRating: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  reviewCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  profileLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  profileTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FF6B35',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  priceInfo: {
    flex: 1,
  },
  hourlyRate: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  responseTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  messageButton: {
    minWidth: 80,
  },
  bookButton: {
    minWidth: 120,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  activeTabText: {
    color: '#FF6B35',
    fontFamily: 'Inter-SemiBold',
  },
  tabContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 24,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyItem: {
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FF6B35',
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  certificationInfo: {
    flex: 1,
  },
  certificationName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  certificationOrg: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  certificationDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#BDC3C7',
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  experienceText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  workoutCard: {
    marginBottom: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  workoutMeta: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FF6B35',
  },
  workoutDifficulty: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textTransform: 'capitalize',
  },
  workoutDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 12,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  workoutStat: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  reviewsHeader: {
    marginBottom: 20,
  },
  ratingBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 12,
  },
  overallRating: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  ratingBars: {
    flex: 1,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    width: 20,
  },
  ratingCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    width: 20,
    textAlign: 'right',
  },
  reviewCard: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#BDC3C7',
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 20,
  },
});