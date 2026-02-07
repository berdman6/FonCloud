import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface GlowCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  noBorder?: boolean;
}

export function GlowCard({ children, style, glowColor, noBorder }: GlowCardProps) {
  const borderColor = glowColor || Colors.dark.cardBorder;

  return (
    <View style={[styles.container, !noBorder && { borderColor, borderWidth: 1 }, style]}>
      <LinearGradient
        colors={['rgba(0, 255, 136, 0.03)', 'rgba(0, 0, 0, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
