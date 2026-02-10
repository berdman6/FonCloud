import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/lib/theme-context';

interface GlowCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  noBorder?: boolean;
}

export function GlowCard({ children, style, glowColor, noBorder }: GlowCardProps) {
  const colors = useThemeColors();
  const borderColor = glowColor || colors.cardBorder;

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.card, shadowColor: colors.neonGreen },
      !noBorder && { borderColor, borderWidth: 1 },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
});
