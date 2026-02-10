import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { PortalAnimation } from '@/components/PortalAnimation';
import { useThemeColors } from '@/lib/theme-context';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();

  const referralLink = `https://foncloud.app/register?ref=${user?.referralCode || ''}`;
  const shareMessage = `${t('joinMessage')}: ${user?.referralCode || ''}\n${referralLink}`;

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('codeCopied'), text);
  };

  const handleShareLink = async () => {
    if (Platform.OS === 'web') {
      try {
        if (navigator.share) {
          await navigator.share({ text: shareMessage });
        } else {
          await Clipboard.setStringAsync(referralLink);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(t('linkCopied'), referralLink);
        }
      } catch (e) {}
    } else {
      try {
        await Share.share({ message: shareMessage });
      } catch (e) {}
    }
  };

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '---';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
    >
      <View style={styles.profileHeader}>
        <PortalAnimation size={100} />
        <View style={[styles.avatarOverlay, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
          <Text style={[styles.avatarLetter, { color: colors.primary }]}>{user?.displayName?.charAt(0)?.toUpperCase() || 'F'}</Text>
        </View>
        <Text style={[styles.displayName, { color: colors.text }]}>{user?.displayName || 'User'}</Text>
        <Text style={[styles.username, { color: colors.textMuted }]}>@{user?.username || 'user'}</Text>
      </View>

      <GlowCard style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primaryDim }]}>
            <Ionicons name="finger-print" size={18} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('userId')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user?.userId || '---'}</Text>
          </View>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primaryDim }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('memberSince')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{memberSince}</Text>
          </View>
        </View>
      </GlowCard>

      <View style={styles.statsGrid}>
        <GlowCard style={styles.statCard}>
          <Ionicons name="wallet" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{Number(user?.walletBalance || 0).toFixed(2)}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('balance')}</Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.text }]}>{Number(user?.totalEarnings || 0).toFixed(2)}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('totalEarned')}</Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <Ionicons name="people" size={24} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.text }]}>{user?.totalReferrals || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('totalReferralsLabel')}</Text>
        </GlowCard>
      </View>

      <GlowCard style={styles.referralCard}>
        <View style={styles.referralHeader}>
          <Ionicons name="gift" size={20} color={colors.primary} />
          <Text style={[styles.referralTitle, { color: colors.textSecondary }]}>{t('referralCodeLabel')}</Text>
        </View>
        <View style={[styles.codeBox, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
          <Text style={[styles.codeText, { color: colors.primary }]}>{user?.referralCode || '---'}</Text>
          <Pressable
            onPress={() => copyToClipboard(user?.referralCode || '')}
            style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={handleShareLink}
            style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.accent} />
          </Pressable>
        </View>
        <Text style={[styles.shareHint, { color: colors.textMuted }]}>{t('shareCode')}</Text>
      </GlowCard>

      <GlowCard style={styles.commissionCard}>
        <Text style={[styles.commissionTitle, { color: colors.text }]}>Commission Structure</Text>
        <View style={styles.levelRow}>
          <View style={[styles.levelItem, { backgroundColor: colors.primaryDim }]}>
            <Text style={[styles.levelLabel, { color: colors.textMuted }]}>L1</Text>
            <Text style={[styles.levelRate, { color: colors.primary }]}>10%</Text>
          </View>
          <View style={[styles.levelItem, { backgroundColor: colors.primaryDim }]}>
            <Text style={[styles.levelLabel, { color: colors.textMuted }]}>L2</Text>
            <Text style={[styles.levelRate, { color: colors.primary }]}>5%</Text>
          </View>
          <View style={[styles.levelItem, { backgroundColor: colors.primaryDim }]}>
            <Text style={[styles.levelLabel, { color: colors.textMuted }]}>L3</Text>
            <Text style={[styles.levelRate, { color: colors.primary }]}>2%</Text>
          </View>
          <View style={[styles.levelItem, { backgroundColor: colors.primaryDim }]}>
            <Text style={[styles.levelLabel, { color: colors.textMuted }]}>L4</Text>
            <Text style={[styles.levelRate, { color: colors.primary }]}>1%</Text>
          </View>
        </View>
      </GlowCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  avatarLetter: {
    fontSize: 22,
    fontFamily: 'HindSiliguri_700Bold',
  },
  displayName: {
    fontSize: 24,
    fontFamily: 'HindSiliguri_700Bold',
    marginTop: 8,
  },
  username: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_400Regular',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  infoDivider: {
    height: 1,
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
    fontFamily: 'HindSiliguri_700Bold',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'HindSiliguri_400Regular',
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
    fontFamily: 'HindSiliguri_500Medium',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 28,
    fontFamily: 'HindSiliguri_700Bold',
    letterSpacing: 4,
  },
  copyBtn: {
    padding: 4,
  },
  shareHint: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
  },
  commissionCard: {
    padding: 20,
    alignItems: 'center',
    gap: 14,
  },
  commissionTitle: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_600SemiBold',
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
    paddingVertical: 12,
    borderRadius: 10,
  },
  levelLabel: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  levelRate: {
    fontSize: 20,
    fontFamily: 'HindSiliguri_700Bold',
  },
});
