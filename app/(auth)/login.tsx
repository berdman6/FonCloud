import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { FloatingBackground } from '@/components/FloatingBackground';
import { useThemeColors } from '@/lib/theme-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t, currentLanguage, toggleLanguage } = useLanguage();
  const colors = useThemeColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');

  const handleNext = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }
    setStep('password');
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/(main)/home');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FloatingBackground />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 40), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={toggleLanguage} style={[styles.langToggle, { borderColor: colors.cardBorder }]}>
            <Ionicons name="language" size={16} color={colors.neonGreen} />
            <Text style={[styles.langText, { color: colors.neonGreen }]}>{currentLanguage === 'bn' ? 'EN' : 'BN'}</Text>
          </Pressable>

          <Text style={[styles.title, { color: colors.text }]}>{t('login')}</Text>

          {step === 'email' ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.tabRow}>
                <Pressable style={[styles.tab, styles.tabActive]}>
                  <Text style={[styles.tabTextActive, { color: colors.text }]}>{t('usernameEmailPhone')}</Text>
                  <View style={[styles.tabIndicator, { backgroundColor: colors.neonGreen }]} />
                </Pressable>
              </View>

              <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('usernameEmailPhone')}
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                />
                {username.length > 0 && (
                  <Pressable onPress={() => setUsername('')} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [styles.mainButton, { backgroundColor: colors.black, borderColor: colors.neonGreen, shadowColor: colors.neonGreen }, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.mainButtonText, { color: colors.neonGreen }]}>{t('next') || 'Next'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.tabRow}>
                <Pressable style={[styles.tab, styles.tabActive]}>
                  <Text style={[styles.tabTextActive, { color: colors.text }]}>{t('usernameEmailPhone')}</Text>
                  <View style={[styles.tabIndicator, { backgroundColor: colors.neonGreen }]} />
                </Pressable>
              </View>

              <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                <Text style={[styles.inputLabel, { backgroundColor: colors.card, color: colors.textSecondary }]}>{t('usernameEmailPhone')}</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => { setUsername(''); setStep('email'); }} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
                <Text style={[styles.inputLabel, { backgroundColor: colors.card, color: colors.textSecondary }]}>{t('enterPassword')}</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('enterPassword')}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.clearBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [styles.mainButton, { backgroundColor: colors.black, borderColor: colors.neonGreen, shadowColor: colors.neonGreen }, loading && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.mainButtonText, { color: colors.neonGreen }]}>{loading ? '...' : t('loginButton')}</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('noAccount')}</Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={[styles.footerLink, { color: colors.neonOrange }]}> {t('register')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  langToggle: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  langText: {
    fontFamily: 'HindSiliguri_600SemiBold',
    fontSize: 13,
  },
  title: {
    fontSize: 32,
    fontFamily: 'HindSiliguri_700Bold',
    marginBottom: 28,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 18,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  tab: {
    paddingBottom: 8,
  },
  tabActive: {},
  tabTextActive: {
    fontFamily: 'HindSiliguri_600SemiBold',
    fontSize: 15,
  },
  tabIndicator: {
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    position: 'absolute',
    top: -10,
    left: 12,
    paddingHorizontal: 6,
    fontSize: 12,
    fontFamily: 'HindSiliguri_500Medium',
  },
  input: {
    flex: 1,
    fontFamily: 'HindSiliguri_500Medium',
    fontSize: 16,
    paddingVertical: 14,
  },
  clearBtn: {
    padding: 6,
  },
  mainButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  mainButtonText: {
    fontFamily: 'HindSiliguri_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'HindSiliguri_600SemiBold',
    fontSize: 14,
  },
});
