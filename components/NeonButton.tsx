import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

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
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const variantStyles = {
    primary: {
      bg: Colors.dark.black,
      text: Colors.dark.neonGreen,
      border: Colors.dark.neonGreen,
    },
    secondary: {
      bg: 'transparent',
      text: Colors.dark.neonGreen,
      border: Colors.dark.neonGreen,
    },
    danger: {
      bg: Colors.dark.danger,
      text: '#fff',
      border: Colors.dark.danger,
    },
    ghost: {
      bg: 'transparent',
      text: Colors.dark.textSecondary,
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
        variant === 'primary' && { shadowColor: Colors.dark.neonGreen, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
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
