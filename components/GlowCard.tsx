import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
