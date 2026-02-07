import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { PortalAnimation } from '@/components/PortalAnimation';
import Colors from '@/constants/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();

  const copyToClipboard = (text: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('codeCopied'), text);
  };

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '---';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
    >
      <View style={styles.profileHeader}>
        <PortalAnimation size={100} />
        <View style={styles.avatarOverlay}>
          <Text style={styles.avatarLetter}>{user?.displayName?.charAt(0)?.toUpperCase() || 'F'}</Text>
        </View>
        <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
        <Text style={styles.username}>@{user?.username || 'user'}</Text>
      </View>

      <GlowCard style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="finger-print" size={18} color={Colors.dark.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('userId')}</Text>
            <Text style={styles.infoValue}>{user?.userId || '---'}</Text>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="calendar-outline" size={18} color={Colors.dark.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('memberSince')}</Text>
            <Text style={styles.infoValue}>{memberSince}</Text>
          </View>
        </View>
      </GlowCard>

      <View style={styles.statsGrid}>
        <GlowCard style={styles.statCard}>
          <Ionicons name="wallet" size={24} color={Colors.dark.primary} />
          <Text style={styles.statValue}>{Number(user?.walletBalance || 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>{t('balance')}</Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={Colors.dark.success} />
          <Text style={styles.statValue}>{Number(user?.totalEarnings || 0).toFixed(2)}</Text>
          <Text style={styles.statLabel}>{t('totalEarned')}</Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <Ionicons name="people" size={24} color={Colors.dark.accent} />
          <Text style={styles.statValue}>{user?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>{t('totalReferralsLabel')}</Text>
        </GlowCard>
      </View>

      <GlowCard style={styles.referralCard}>
        <View style={styles.referralHeader}>
          <Ionicons name="gift" size={20} color={Colors.dark.primary} />
          <Text style={styles.referralTitle}>{t('referralCodeLabel')}</Text>
        </View>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{user?.referralCode || '---'}</Text>
          <Pressable
            onPress={() => copyToClipboard(user?.referralCode || '')}
            style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="copy-outline" size={18} color={Colors.dark.primary} />
          </Pressable>
        </View>
        <Text style={styles.shareHint}>{t('shareCode')}</Text>
      </GlowCard>

      <GlowCard style={styles.commissionCard}>
        <Text style={styles.commissionTitle}>Commission Structure</Text>
        <View style={styles.levelRow}>
          <View style={styles.levelItem}>
            <Text style={styles.levelLabel}>L1</Text>
            <Text style={styles.levelRate}>10%</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={styles.levelLabel}>L2</Text>
            <Text style={styles.levelRate}>5%</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={styles.levelLabel}>L3</Text>
            <Text style={styles.levelRate}>2%</Text>
          </View>
          <View style={styles.levelItem}>
            <Text style={styles.levelLabel}>L4</Text>
            <Text style={styles.levelRate}>1%</Text>
          </View>
        </View>
      </GlowCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarOverlay: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primaryDim,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  avatarLetter: {
    fontSize: 22,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
  },
  displayName: {
    fontSize: 24,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.text,
    marginTop: 8,
  },
  username: {
    fontSize: 14,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.dark.divider,
    marginLeft: 48,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  referralCard: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referralTitle: {
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    color: Colors.dark.textSecondary,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.dark.primaryDim,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  codeText: {
    fontSize: 28,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
    letterSpacing: 4,
  },
  copyBtn: {
    padding: 4,
  },
  shareHint: {
    fontSize: 12,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  commissionCard: {
    padding: 20,
    alignItems: 'center',
    gap: 14,
  },
  commissionTitle: {
    fontSize: 14,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  levelItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.primaryDim,
    paddingVertical: 12,
    borderRadius: 10,
  },
  levelLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.textMuted,
  },
  levelRate: {
    fontSize: 20,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
  },
});
