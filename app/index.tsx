import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { PortalAnimation } from '@/components/PortalAnimation';
import { FloatingBackground } from '@/components/FloatingBackground';
import Colors from '@/constants/colors';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(main)/home');
        } else {
          router.replace('/(auth)/login');
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <FloatingBackground />
      <PortalAnimation size={220} />
      <Text style={styles.title}>FonCloud</Text>
      <ActivityIndicator color={Colors.dark.neonGreen} size="small" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'HindSiliguri_700Bold',
    color: Colors.dark.neonGreen,
    marginTop: 24,
    letterSpacing: 3,
    textShadowColor: 'rgba(57, 255, 20, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
});
