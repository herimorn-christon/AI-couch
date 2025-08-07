import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Filter, Star, MapPin, Clock, DollarSign, Award, Users } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useCoachStore } from '@/stores/coachStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CoachesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const { user } = useAuthStore();
  const { coaches, featuredCoaches, getCoaches, getFeaturedCoaches } = useCoachStore();

  const specialties = [
    { id: 'all', label: 'All Specialties' },
    { id: 'strength', label: 'Strength Training' },
    { id: 'cardio', label: 'Cardio & HIIT' },
    { id: 'yoga', label: 'Yoga & Flexibility' },
    { id: 'nutrition', label: 'Nutrition Coaching' },
    { id: 'rehabilitation', label: 'Injury Rehabilitation' },
    { id: 'sports', label: 'Sports Performance' },
    { id: 'weight_loss', label: 'Weight Loss' },
    { id: 'bodybuilding', label: 'Bodybuilding' },
  ];

  const priceRanges = [
    { id: 'all', label: 'All Prices' },
    { id: 'budget', label: '$20-40/hr' },
    { id: 'mid', label: '$40-80/hr' },
    { id: 'premium', label: '$80+/hr' },
  ];

  useEffect(() => {
    getCoaches();
    getFeaturedCoaches();
  }, []);

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coach.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpecialty = selectedSpecialty === 'all' || coach.specialties.includes(selectedSpecialty);
    const matchesPrice = priceRange === 'all' || 
                        (priceRange === 'budget' && coach.hourlyRate >= 20 && coach.hourlyRate < 40) ||
                        (priceRange === 'mid' && coach.hourlyRate >= 40 && coach.hourlyRate < 80) ||
                        (priceRange === 'premium' && coach.hourlyRate >= 80);
    
    return matchesSearch && matchesSpecialty && matchesPrice;
  });

  const renderCoachCard = (coach: any, featured = false) => (
    <TouchableOpacity
      key={coach.id}
      onPress={() => router.push(`/coach/${coach.id}`)}
      style={[styles.coachCard, featured && styles.featuredCard]}
    >
      <View style={styles.coachHeader}>
        <Image source={{ uri: coach.avatar }} style={styles.coachAvatar} />
        <View style={styles.coachInfo}>
          <View style={styles.coachNameRow}>
            <Text style={styles.coachName}>{coach.name}</Text>
            {coach.isVerified && (
              <Award size={16} color="#FFD700" />
            )}
          </View>
          <View style={styles.ratingRow}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>{coach.rating}</Text>
            <Text style={styles.reviewCount}>({coach.reviewCount} reviews)</Text>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={12} color="#7F8C8D" />
            <Text style={styles.location}>{coach.location}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${coach.hourlyRate}</Text>
          <Text style={styles.priceUnit}>/hour</Text>
        </View>
      </View>

      <View style={styles.specialtiesContainer}>
        {coach.specialties.slice(0, 3).map((specialty: string) => (
          <View key={specialty} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
        {coach.specialties.length > 3 && (
          <Text style={styles.moreSpecialties}>+{coach.specialties.length - 3} more</Text>
        )}
      </View>

      <Text style={styles.coachBio} numberOfLines={2}>
        {coach.bio}
      </Text>

      <View style={styles.coachStats}>
        <View style={styles.statItem}>
          <Users size={14} color="#FF6B35" />
          <Text style={styles.statText}>{coach.clientCount} clients</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={14} color="#FF6B35" />
          <Text style={styles.statText}>{coach.experience}+ years</Text>
        </View>
        <View style={styles.statItem}>
          <Award size={14} color="#FF6B35" />
          <Text style={styles.statText}>{coach.certifications.length} certs</Text>
        </View>
      </View>

      <View style={styles.coachActions}>
        <Button
          title="View Profile"
          onPress={() => router.push(`/coach/${coach.id}`)}
          variant="outline"
          size="small"
          style={styles.viewButton}
        />
        <Button
          title="Book Session"
          onPress={() => router.push(`/coach/${coach.id}/book`)}
          variant="primary"
          size="small"
          style={styles.bookButton}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find Your Coach</Text>
          <Text style={styles.subtitle}>Connect with certified fitness professionals</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#7F8C8D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coaches, specialties..."
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

        {/* Filters */}
        {showFilters && (
          <Card style={styles.filtersCard}>
            <Text style={styles.filterTitle}>Specialties</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {specialties.map((specialty) => (
                <TouchableOpacity
                  key={specialty.id}
                  style={[
                    styles.filterChip,
                    selectedSpecialty === specialty.id && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedSpecialty(specialty.id)}
                >
                  <Text style={[
                    styles.filterText,
                    selectedSpecialty === specialty.id && styles.filterTextActive
                  ]}>
                    {specialty.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.filterTitle, { marginTop: 16 }]}>Price Range</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {priceRanges.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    styles.filterChip,
                    priceRange === range.id && styles.filterChipActive
                  ]}
                  onPress={() => setPriceRange(range.id)}
                >
                  <Text style={[
                    styles.filterText,
                    priceRange === range.id && styles.filterTextActive
                  ]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        )}

        {/* Featured Coaches */}
        {featuredCoaches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Coaches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredCoaches.map(coach => (
                <View key={coach.id} style={styles.featuredCoachContainer}>
                  {renderCoachCard(coach, true)}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Coaches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Coaches ({filteredCoaches.length})
          </Text>
          
          {filteredCoaches.length > 0 ? (
            filteredCoaches.map(coach => renderCoachCard(coach))
          ) : (
            <Card style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No coaches found</Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search criteria or browse all coaches
              </Text>
              <Button
                title="Clear Filters"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('all');
                  setPriceRange('all');
                }}
                variant="primary"
                style={styles.clearButton}
              />
            </Card>
          )}
        </View>

        {/* Become a Coach CTA */}
        <Card style={styles.becomeCoachCard}>
          <Text style={styles.ctaTitle}>Are you a fitness professional?</Text>
          <Text style={styles.ctaDescription}>
            Join our platform and start earning by sharing your expertise with clients worldwide
          </Text>
          <Button
            title="Become a Coach"
            onPress={() => router.push('/coach/apply')}
            variant="primary"
            style={styles.ctaButton}
          />
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
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
  filtersCard: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  featuredCoachContainer: {
    width: 300,
    marginLeft: 24,
  },
  coachCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    marginHorizontal: 0,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coachName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FF6B35',
  },
  priceUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FF6B35',
  },
  moreSpecialties: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    alignSelf: 'center',
  },
  coachBio: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 16,
  },
  coachStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  coachActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
  },
  bookButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 24,
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
  clearButton: {
    minWidth: 160,
  },
  becomeCoachCard: {
    marginHorizontal: 24,
    marginBottom: 100,
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    minWidth: 200,
  },
});