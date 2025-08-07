import { create } from 'zustand';

interface Coach {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  bio: string;
  specialties: string[];
  certifications: any[];
  experience: number;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  location: string;
  isVerified: boolean;
  clientCount: number;
  responseTime: string;
  title: string;
  ratingBreakdown: Record<number, number>;
}

interface CoachState {
  coaches: Coach[];
  featuredCoaches: Coach[];
  currentCoach: Coach | null;
  isLoading: boolean;
  getCoaches: () => Promise<void>;
  getFeaturedCoaches: () => Promise<void>;
  getCoachById: (id: string) => Promise<Coach>;
  getCoachWorkouts: (coachId: string) => Promise<any[]>;
  getCoachReviews: (coachId: string) => Promise<any[]>;
  bookSession: (coachId: string, sessionData: any) => Promise<void>;
  applyAsCoach: (applicationData: any) => Promise<void>;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  coaches: [],
  featuredCoaches: [],
  currentCoach: null,
  isLoading: false,

  getCoaches: async () => {
    set({ isLoading: true });
    try {
      // Mock data for now - replace with actual API call
      const mockCoaches: Coach[] = [
        {
          id: '1',
          userId: 'user1',
          name: 'Sarah Johnson',
          avatar: 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Certified personal trainer with 8+ years of experience specializing in strength training and weight loss. I believe in creating sustainable fitness habits that fit your lifestyle.',
          specialties: ['Strength Training', 'Weight Loss', 'Nutrition Coaching'],
          certifications: [
            { id: 1, name: 'NASM-CPT', organization: 'NASM', date: '2018' },
            { id: 2, name: 'Precision Nutrition Level 1', organization: 'Precision Nutrition', date: '2019' }
          ],
          experience: 8,
          hourlyRate: 75,
          rating: 4.9,
          reviewCount: 127,
          location: 'Los Angeles, CA',
          isVerified: true,
          clientCount: 89,
          responseTime: '2 hours',
          title: 'Certified Personal Trainer & Nutrition Coach',
          ratingBreakdown: { 5: 98, 4: 20, 3: 7, 2: 2, 1: 0 }
        },
        {
          id: '2',
          userId: 'user2',
          name: 'Mike Rodriguez',
          avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Former professional athlete turned fitness coach. Specializing in sports performance and functional training for athletes of all levels.',
          specialties: ['Sports Performance', 'Functional Training', 'HIIT'],
          certifications: [
            { id: 1, name: 'CSCS', organization: 'NSCA', date: '2017' },
            { id: 2, name: 'FMS Level 2', organization: 'Functional Movement Systems', date: '2018' }
          ],
          experience: 12,
          hourlyRate: 95,
          rating: 4.8,
          reviewCount: 203,
          location: 'Miami, FL',
          isVerified: true,
          clientCount: 156,
          responseTime: '1 hour',
          title: 'Sports Performance Specialist',
          ratingBreakdown: { 5: 165, 4: 28, 3: 8, 2: 2, 1: 0 }
        },
        {
          id: '3',
          userId: 'user3',
          name: 'Emma Chen',
          avatar: 'https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Yoga instructor and wellness coach focused on mind-body connection. Helping clients find balance through movement, meditation, and mindful living.',
          specialties: ['Yoga', 'Flexibility', 'Meditation', 'Wellness Coaching'],
          certifications: [
            { id: 1, name: 'RYT-500', organization: 'Yoga Alliance', date: '2016' },
            { id: 2, name: 'Certified Wellness Coach', organization: 'IAWP', date: '2019' }
          ],
          experience: 10,
          hourlyRate: 65,
          rating: 4.9,
          reviewCount: 89,
          location: 'San Francisco, CA',
          isVerified: true,
          clientCount: 67,
          responseTime: '3 hours',
          title: 'Yoga Instructor & Wellness Coach',
          ratingBreakdown: { 5: 78, 4: 9, 3: 2, 2: 0, 1: 0 }
        },
        {
          id: '4',
          userId: 'user4',
          name: 'David Thompson',
          avatar: 'https://images.pexels.com/photos/1547248/pexels-photo-1547248.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Rehabilitation specialist and corrective exercise expert. Helping clients recover from injuries and prevent future problems through targeted exercise programs.',
          specialties: ['Injury Rehabilitation', 'Corrective Exercise', 'Mobility'],
          certifications: [
            { id: 1, name: 'NASM-CES', organization: 'NASM', date: '2015' },
            { id: 2, name: 'SFMA Level 2', organization: 'SFMA', date: '2017' }
          ],
          experience: 15,
          hourlyRate: 110,
          rating: 4.7,
          reviewCount: 156,
          location: 'Austin, TX',
          isVerified: true,
          clientCount: 134,
          responseTime: '4 hours',
          title: 'Rehabilitation Specialist',
          ratingBreakdown: { 5: 112, 4: 32, 3: 10, 2: 2, 1: 0 }
        }
      ];

      set({ coaches: mockCoaches, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
      set({ isLoading: false });
    }
  },

  getFeaturedCoaches: async () => {
    try {
      // Mock featured coaches - typically top-rated or promoted coaches
      const featured = [
        {
          id: '1',
          userId: 'user1',
          name: 'Sarah Johnson',
          avatar: 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Certified personal trainer with 8+ years of experience specializing in strength training and weight loss.',
          specialties: ['Strength Training', 'Weight Loss', 'Nutrition Coaching'],
          certifications: [],
          experience: 8,
          hourlyRate: 75,
          rating: 4.9,
          reviewCount: 127,
          location: 'Los Angeles, CA',
          isVerified: true,
          clientCount: 89,
          responseTime: '2 hours',
          title: 'Certified Personal Trainer & Nutrition Coach',
          ratingBreakdown: { 5: 98, 4: 20, 3: 7, 2: 2, 1: 0 }
        },
        {
          id: '2',
          userId: 'user2',
          name: 'Mike Rodriguez',
          avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
          bio: 'Former professional athlete turned fitness coach. Specializing in sports performance and functional training.',
          specialties: ['Sports Performance', 'Functional Training', 'HIIT'],
          certifications: [],
          experience: 12,
          hourlyRate: 95,
          rating: 4.8,
          reviewCount: 203,
          location: 'Miami, FL',
          isVerified: true,
          clientCount: 156,
          responseTime: '1 hour',
          title: 'Sports Performance Specialist',
          ratingBreakdown: { 5: 165, 4: 28, 3: 8, 2: 2, 1: 0 }
        }
      ];

      set({ featuredCoaches: featured });
    } catch (error) {
      console.error('Failed to fetch featured coaches:', error);
    }
  },

  getCoachById: async (id: string) => {
    const coaches = get().coaches;
    let coach = coaches.find(c => c.id === id);
    
    if (!coach) {
      // If not in current list, fetch from API
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/coaches/${id}`);
        if (response.ok) {
          coach = await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch coach:', error);
      }
    }

    if (coach) {
      set({ currentCoach: coach });
      return coach;
    }
    
    throw new Error('Coach not found');
  },

  getCoachWorkouts: async (coachId: string) => {
    try {
      // Mock workout data
      const mockWorkouts = [
        {
          id: '1',
          name: 'Upper Body Strength Builder',
          description: 'A comprehensive upper body workout focusing on compound movements and progressive overload.',
          duration: 45,
          difficulty: 'intermediate',
          rating: 4.8,
          completions: 234,
          calories: 320
        },
        {
          id: '2',
          name: 'HIIT Fat Burner',
          description: 'High-intensity interval training designed to maximize calorie burn and improve cardiovascular fitness.',
          duration: 30,
          difficulty: 'advanced',
          rating: 4.9,
          completions: 189,
          calories: 280
        },
        {
          id: '3',
          name: 'Core Stability Flow',
          description: 'Functional core exercises that improve stability, posture, and overall strength.',
          duration: 25,
          difficulty: 'beginner',
          rating: 4.7,
          completions: 156,
          calories: 180
        }
      ];

      return mockWorkouts;
    } catch (error) {
      console.error('Failed to fetch coach workouts:', error);
      return [];
    }
  },

  getCoachReviews: async (coachId: string) => {
    try {
      // Mock review data
      const mockReviews = [
        {
          id: '1',
          user: {
            name: 'Jennifer M.',
            avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400'
          },
          rating: 5,
          comment: 'Sarah is an amazing trainer! She helped me lose 30 pounds and gain so much confidence. Her nutrition guidance was game-changing.',
          date: '2 weeks ago'
        },
        {
          id: '2',
          user: {
            name: 'Mark T.',
            avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
          },
          rating: 5,
          comment: 'Professional, knowledgeable, and motivating. Sarah creates personalized workouts that actually work. Highly recommend!',
          date: '1 month ago'
        },
        {
          id: '3',
          user: {
            name: 'Lisa K.',
            avatar: 'https://images.pexels.com/photos/3823495/pexels-photo-3823495.jpeg?auto=compress&cs=tinysrgb&w=400'
          },
          rating: 4,
          comment: 'Great trainer with excellent form corrections. Sometimes sessions run a bit over time, but the results speak for themselves.',
          date: '1 month ago'
        }
      ];

      return mockReviews;
    } catch (error) {
      console.error('Failed to fetch coach reviews:', error);
      return [];
    }
  },

  bookSession: async (coachId: string, sessionData: any) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/coaches/${coachId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to book session');
      }

      // Handle successful booking
    } catch (error) {
      console.error('Failed to book session:', error);
      throw error;
    }
  },

  applyAsCoach: async (applicationData: any) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/coaches/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      // Handle successful application
    } catch (error) {
      console.error('Failed to submit coach application:', error);
      throw error;
    }
  },
}));