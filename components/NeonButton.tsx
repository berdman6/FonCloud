import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/lib/theme-context';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function NeonButton({ title, onPress, variant = 'primary', loading, disabled, style, icon }: NeonButtonProps) {
  const colors = useThemeColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const variantStyles = {
    primary: {
      bg: colors.black,
      text: colors.neonGreen,
      border: colors.neonGreen,
    },
    secondary: {
      bg: 'transparent',
      text: colors.neonGreen,
      border: colors.neonGreen,
    },
    danger: {
      bg: colors.danger,
      text: '#fff',
      border: colors.danger,
    },
    ghost: {
      bg: 'transparent',
      text: colors.textSecondary,
      border: 'transparent',
    },
  };

  const v = variantStyles[variant];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        variant === 'secondary' && { borderWidth: 1.5 },
        variant === 'primary' && { shadowColor: colors.neonGreen, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_600SemiBold',
    letterSpacing: 0.5,
  },
});
