import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  elevation?: number;
}

export default function Card({ 
  children, 
  style, 
  padding = 20, 
  margin = 0,
  elevation = 3 
}: CardProps) {
  return (
    <View 
      style={[
        styles.card, 
        { padding, margin, elevation },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});