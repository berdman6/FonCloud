import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { NeonButton } from '@/components/NeonButton';
import Colors from '@/constants/colors';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !displayName.trim() || !referralCode.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </Pressable>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.brandName}>FonCloud</Text>
          <Text style={styles.title}>{t('register')}</Text>
          <Text style={styles.subtitle}>{t('registerSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('enterDisplayName')}
              placeholderTextColor={Colors.dark.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="at-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('enterUsername')}
              placeholderTextColor={Colors.dark.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={`${t('enterEmail')} ${t('optional')}`}
              placeholderTextColor={Colors.dark.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={`${t('enterPhone')} ${t('optional')}`}
              placeholderTextColor={Colors.dark.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('enterPassword')}
              placeholderTextColor={Colors.dark.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.dark.textMuted} />
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="gift-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('enterReferralCode')}
              placeholderTextColor={Colors.dark.textMuted}
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.feeNotice}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.dark.warning} />
            <Text style={styles.feeText}>Sign-up fee: 500 credits (distributed to referral chain)</Text>
          </View>

          <NeonButton title={t('registerButton')} onPress={handleRegister} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('haveAccount')}</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.footerLink}> {t('login')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandName: {
    fontSize: 28,
    fontFamily: 'HindSiliguri_700Bold',
    color: Colors.dark.primary,
    letterSpacing: 3,
  },
  title: {
    fontSize: 22,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: Colors.dark.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_400Regular',
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.inputBorder,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontFamily: 'HindSiliguri_500Medium',
    fontSize: 15,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.dark.warningDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
  },
  feeText: {
    color: Colors.dark.warning,
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 13,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    color: Colors.dark.textSecondary,
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 14,
  },
  footerLink: {
    color: Colors.dark.primary,
    fontFamily: 'HindSiliguri_600SemiBold',
    fontSize: 14,
  },
});
