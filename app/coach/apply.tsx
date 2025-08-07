import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CoachApplicationScreen() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    specialties: [],
    certifications: [],
    location: '',
    availability: {
      monday: { available: false, hours: '' },
      tuesday: { available: false, hours: '' },
      wednesday: { available: false, hours: '' },
      thursday: { available: false, hours: '' },
      friday: { available: false, hours: '' },
      saturday: { available: false, hours: '' },
      sunday: { available: false, hours: '' },
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState({
    name: '',
    organization: '',
    year: '',
  });

  const specialtyOptions = [
    'Strength Training',
    'Cardio & HIIT',
    'Yoga & Flexibility',
    'Nutrition Coaching',
    'Weight Loss',
    'Bodybuilding',
    'Sports Performance',
    'Injury Rehabilitation',
    'Functional Training',
    'Pilates',
    'CrossFit',
    'Powerlifting',
  ];

  const addSpecialty = (specialty: string) => {
    if (!formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty],
      });
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty),
    });
  };

  const addCertification = () => {
    if (newCertification.name && newCertification.organization) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...newCertification, id: Date.now() }],
      });
      setNewCertification({ name: '', organization: '', year: '' });
    }
  };

  const removeCertification = (id: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter(cert => cert.id !== id),
    });
  };

  const updateAvailability = (day: string, field: string, value: any) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day],
          [field]: value,
        },
      },
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!formData.bio || !formData.experience || !formData.hourlyRate) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (formData.specialties.length === 0) {
        Alert.alert('Error', 'Please select at least one specialty');
        return;
      }

      // Submit application
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/coaches/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert(
          'Application Submitted!',
          'Thank you for your application. We will review it and get back to you within 2-3 business days.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          placeholder="Enter your first name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          placeholder="Enter your last name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          placeholder="City, State/Country"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Professional Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bio *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.bio}
          onChangeText={(text) => setFormData({ ...formData, bio: text })}
          placeholder="Tell us about yourself, your training philosophy, and what makes you unique..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Years of Experience *</Text>
        <TextInput
          style={styles.input}
          value={formData.experience}
          onChangeText={(text) => setFormData({ ...formData, experience: text })}
          placeholder="e.g., 5"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hourly Rate (USD) *</Text>
        <TextInput
          style={styles.input}
          value={formData.hourlyRate}
          onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
          placeholder="e.g., 50"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Specialties *</Text>
        <Text style={styles.helperText}>Select your areas of expertise</Text>
        
        <View style={styles.specialtyGrid}>
          {specialtyOptions.map(specialty => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.specialtyChip,
                formData.specialties.includes(specialty) && styles.specialtyChipSelected
              ]}
              onPress={() => {
                if (formData.specialties.includes(specialty)) {
                  removeSpecialty(specialty);
                } else {
                  addSpecialty(specialty);
                }
              }}
            >
              <Text style={[
                styles.specialtyChipText,
                formData.specialties.includes(specialty) && styles.specialtyChipTextSelected
              ]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.selectedSpecialties}>
          {formData.specialties.map(specialty => (
            <View key={specialty} style={styles.selectedSpecialty}>
              <Text style={styles.selectedSpecialtyText}>{specialty}</Text>
              <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
                <X size={16} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Certifications</Text>
      
      <Card style={styles.certificationForm}>
        <Text style={styles.label}>Add Certification</Text>
        
        <TextInput
          style={styles.input}
          value={newCertification.name}
          onChangeText={(text) => setNewCertification({ ...newCertification, name: text })}
          placeholder="Certification name (e.g., NASM-CPT)"
        />
        
        <TextInput
          style={styles.input}
          value={newCertification.organization}
          onChangeText={(text) => setNewCertification({ ...newCertification, organization: text })}
          placeholder="Issuing organization (e.g., NASM)"
        />
        
        <TextInput
          style={styles.input}
          value={newCertification.year}
          onChangeText={(text) => setNewCertification({ ...newCertification, year: text })}
          placeholder="Year obtained (e.g., 2020)"
          keyboardType="numeric"
        />
        
        <Button
          title="Add Certification"
          onPress={addCertification}
          variant="outline"
          size="small"
        />
      </Card>

      <View style={styles.certificationsList}>
        {formData.certifications.map(cert => (
          <View key={cert.id} style={styles.certificationItem}>
            <View style={styles.certificationInfo}>
              <Text style={styles.certificationName}>{cert.name}</Text>
              <Text style={styles.certificationOrg}>{cert.organization}</Text>
              <Text style={styles.certificationYear}>{cert.year}</Text>
            </View>
            <TouchableOpacity onPress={() => removeCertification(cert.id)}>
              <X size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Availability</Text>
      <Text style={styles.helperText}>Set your weekly availability</Text>
      
      {Object.keys(formData.availability).map(day => (
        <View key={day} style={styles.availabilityRow}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            <TouchableOpacity
              style={[
                styles.availabilityToggle,
                formData.availability[day].available && styles.availabilityToggleActive
              ]}
              onPress={() => updateAvailability(day, 'available', !formData.availability[day].available)}
            >
              <Text style={[
                styles.availabilityToggleText,
                formData.availability[day].available && styles.availabilityToggleTextActive
              ]}>
                {formData.availability[day].available ? 'Available' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {formData.availability[day].available && (
            <TextInput
              style={styles.hoursInput}
              value={formData.availability[day].hours}
              onChangeText={(text) => updateAvailability(day, 'hours', text)}
              placeholder="e.g., 9:00 AM - 5:00 PM"
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Coach</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 4</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <Button
            title="Previous"
            onPress={() => setCurrentStep(currentStep - 1)}
            variant="outline"
            style={styles.footerButton}
          />
        )}
        
        {currentStep < 4 ? (
          <Button
            title="Next"
            onPress={() => setCurrentStep(currentStep + 1)}
            variant="primary"
            style={styles.footerButton}
          />
        ) : (
          <Button
            title="Submit Application"
            onPress={handleSubmit}
            variant="primary"
            style={styles.footerButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    paddingBottom: 100,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  specialtyChipSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  specialtyChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  specialtyChipTextSelected: {
    color: '#FFFFFF',
  },
  selectedSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedSpecialty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedSpecialtyText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FF6B35',
  },
  certificationForm: {
    marginBottom: 20,
  },
  certificationsList: {
    gap: 12,
  },
  certificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
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
  certificationYear: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#BDC3C7',
  },
  availabilityRow: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  availabilityToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  availabilityToggleActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  availabilityToggleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  availabilityToggleTextActive: {
    color: '#FFFFFF',
  },
  hoursInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});