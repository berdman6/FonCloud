import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { FloatingBackground } from '@/components/FloatingBackground';
import { PortalAnimation } from '@/components/PortalAnimation';
import { useThemeColors } from '@/lib/theme-context';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { t } = useLanguage();
  const colors = useThemeColors();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRegister = async () => {
    if (!emailOrPhone.trim() || !referralCode.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Terms of Use and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      await register(emailOrPhone.trim(), referralCode.trim().toUpperCase());
      router.replace('/(main)/home');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Registration failed');
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
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.neonGreen} />
          </Pressable>

          <View style={styles.portalWrap}>
            <PortalAnimation size={160} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
              {emailOrPhone.length > 0 && <Text style={[styles.inputLabel, { backgroundColor: colors.card, color: colors.neonGreen }]}>Email/Phone Number</Text>}
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email/Phone Number (without country code)"
                placeholderTextColor={colors.textMuted}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              {emailOrPhone.length > 0 && (
                <Pressable onPress={() => setEmailOrPhone('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
              {referralCode.length > 0 && <Text style={[styles.inputLabel, { backgroundColor: colors.card, color: colors.neonGreen }]}>Referral Code</Text>}
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Referral Code"
                placeholderTextColor={colors.textMuted}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </View>

            <Pressable onPress={() => setAgreed(!agreed)} style={styles.checkRow}>
              <View style={[styles.checkbox, { borderColor: colors.textMuted }, agreed && { backgroundColor: colors.text, borderColor: colors.text }]}>
                {agreed && <Ionicons name="checkmark" size={14} color={colors.background} />}
              </View>
              <Text style={[styles.checkText, { color: colors.textSecondary }]}>
                I have read and agree to the{' '}
                <Text style={[styles.checkLink, { color: colors.text }]}>Terms of Use</Text> and{' '}
                <Text style={[styles.checkLink, { color: colors.text }]}>Privacy Policy</Text>.
              </Text>
            </Pressable>

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [styles.mainButton, { backgroundColor: colors.black, borderColor: colors.neonGreen, shadowColor: colors.neonGreen }, loading && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.mainButtonText, { color: colors.neonGreen }]}>{loading ? '...' : 'Create Account'}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('haveAccount')}</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.footerLink, { color: colors.neonOrange }]}> {t('login')}</Text>
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  portalWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'HindSiliguri_700Bold',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 18,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 2,
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
    fontSize: 15,
    paddingVertical: 14,
  },
  clearBtn: {
    padding: 6,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkText: {
    flex: 1,
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  checkLink: {
    fontFamily: 'HindSiliguri_600SemiBold',
    textDecorationLine: 'underline',
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
