import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, RefreshControl, Share, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { useThemeColors } from '@/lib/theme-context';

export default function ReferralsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const { data: networkData, refetch: refetchNetwork } = useQuery<any>({
    queryKey: ['/api/referrals/network'],
  });

  const network: any[] = networkData?.referrals || [];

  const { data: commissions, refetch: refetchComm } = useQuery<any[]>({
    queryKey: ['/api/referrals/commissions'],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchNetwork(), refetchComm()]);
    setRefreshing(false);
  };

  const totalComm = commissions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;

  const referralLink = `https://foncloud.app/register?ref=${user?.referralCode || ''}`;
  const shareMessage = `${t('joinMessage')}: ${user?.referralCode || ''}\n${referralLink}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(referralLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('linkCopied'), referralLink);
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.statsRow}>
        <GlowCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.primaryDim }]}>
            <Ionicons name="people" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{user?.totalReferrals || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('directReferrals')}</Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.primaryDim }]}>
            <Ionicons name="diamond" size={22} color={colors.accent} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalComm.toFixed(2)}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('totalCommissions')}</Text>
        </GlowCard>
      </View>

      <GlowCard style={styles.codeCard}>
        <View style={styles.codeRow}>
          <Ionicons name="gift" size={20} color={colors.primary} />
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>{t('referralCodeLabel')}</Text>
        </View>
        <Text style={[styles.codeValue, { color: colors.primary }]}>{user?.referralCode || '---'}</Text>
        <Text style={[styles.codeHint, { color: colors.textMuted }]}>{t('shareCode')}</Text>
      </GlowCard>

      <View style={styles.shareRow}>
        <Pressable onPress={handleCopyLink} style={({ pressed }) => [styles.shareBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}>
          <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>{t('copyLink')}</Text>
        </Pressable>
        <Pressable onPress={handleShareLink} style={({ pressed }) => [styles.shareBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.8 }]}>
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>{t('shareLink')}</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('yourNetwork')}</Text>
      {(!network || network.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="people-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noReferrals')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.networkList}>
          {network.map((ref: any) => (
            <GlowCard key={ref.id} style={styles.refItem}>
              <View style={styles.refRow}>
                <View style={[styles.refAvatar, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
                  <Text style={[styles.refAvatarText, { color: colors.primary }]}>{ref.displayName?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.refInfo}>
                  <Text style={[styles.refName, { color: colors.text }]}>{ref.displayName}</Text>
                  <Text style={[styles.refId, { color: colors.textMuted }]}>ID: {ref.userId}</Text>
                </View>
                <Text style={[styles.refDate, { color: colors.textMuted }]}>{new Date(ref.createdAt).toLocaleDateString()}</Text>
              </View>
            </GlowCard>
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('commissionHistory')}</Text>
      {(!commissions || commissions.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="trending-up-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noCommissions')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.commList}>
          {commissions.map((c: any) => (
            <GlowCard key={c.id} style={styles.commItem}>
              <View style={styles.commRow}>
                <View style={[styles.levelBadge, { backgroundColor: colors.primaryDim }]}>
                  <Text style={[styles.levelText, { color: colors.primary }]}>L{c.level}</Text>
                </View>
                <View style={styles.commInfo}>
                  <Text style={[styles.commFrom, { color: colors.text }]}>{t('level')} {c.level} {t('commission')}</Text>
                  <Text style={[styles.commDate, { color: colors.textMuted }]}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.commAmount, { color: colors.success }]}>+{Number(c.amount).toFixed(2)}</Text>
              </View>
            </GlowCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'HindSiliguri_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
    textAlign: 'center',
  },
  codeCard: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_500Medium',
  },
  codeValue: {
    fontSize: 32,
    fontFamily: 'HindSiliguri_700Bold',
    letterSpacing: 4,
  },
  codeHint: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
  },
  shareRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareBtnText: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_400Regular',
  },
  networkList: {
    gap: 8,
    marginBottom: 24,
  },
  refItem: {
    padding: 14,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refAvatarText: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
  },
  refInfo: {
    flex: 1,
  },
  refName: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  refId: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  refDate: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  commList: {
    gap: 8,
  },
  commItem: {
    padding: 14,
  },
  commRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_700Bold',
  },
  commInfo: {
    flex: 1,
  },
  commFrom: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_500Medium',
  },
  commDate: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  commAmount: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
  },
});
