import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { FloatingBackground } from '@/components/FloatingBackground';
import { useThemeColors } from '@/lib/theme-context';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { t } = useLanguage();
  const colors = useThemeColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !displayName.trim() || !referralCode.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Terms of Use and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password, displayName.trim(), referralCode.trim().toUpperCase(), email.trim(), phone.trim());
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

          <Text style={[styles.title, { color: colors.text }]}>{t('register')}</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <InputField
              label={t('enterDisplayName')}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <InputField
              label={t('enterUsername')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <InputField
              label={`${t('enterEmail')} ${t('optional')}`}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <InputField
              label={`${t('enterPhone')} ${t('optional')}`}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
              {password.length > 0 && <Text style={[styles.inputLabel, { backgroundColor: colors.card, color: colors.neonGreen }]}>{t('enterPassword')}</Text>}
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

            <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
              {referralCode.length > 0 && <Text style={[styles.inputLabel, { backgroundColor: colors.card, color: colors.neonGreen }]}>{t('enterReferralCode')}</Text>}
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('enterReferralCode')}
                placeholderTextColor={colors.textMuted}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </View>

            <View style={[styles.feeNotice, { backgroundColor: colors.accentDim, borderColor: 'rgba(245, 166, 35, 0.2)' }]}>
              <Ionicons name="information-circle" size={16} color={colors.neonOrange} />
              <Text style={[styles.feeText, { color: colors.neonOrange }]}>Sign-up fee: 500 credits (paid by referrer)</Text>
            </View>

            <Pressable onPress={() => setAgreed(!agreed)} style={styles.checkRow}>
              <View style={[styles.checkbox, { borderColor: colors.textMuted }, agreed && { backgroundColor: colors.neonGreen, borderColor: colors.neonGreen }]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#000" />}
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
              <Text style={[styles.mainButtonText, { color: colors.neonGreen }]}>{loading ? '...' : t('registerButton')}</Text>
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

function InputField({ label, value, onChangeText, autoCapitalize, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  const colors = useThemeColors();

  return (
    <View style={[styles.inputWrap, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
      {value.length > 0 && <Text style={[styles.inputLabel, { backgroundColor: colors.card, color: colors.neonGreen }]}>{label}</Text>}
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      )}
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
  title: {
    fontSize: 32,
    fontFamily: 'HindSiliguri_700Bold',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 14,
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
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  feeText: {
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 13,
    flex: 1,
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
