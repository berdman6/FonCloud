import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import Colors from '@/constants/colors';

export default function ReferralsScreen() {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
    >
      <View style={styles.statsRow}>
        <GlowCard style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="people" size={22} color={Colors.dark.primary} />
          </View>
          <Text style={styles.statValue}>{user?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>{t('directReferrals')}</Text>
        </GlowCard>
        <GlowCard style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="diamond" size={22} color={Colors.dark.accent} />
          </View>
          <Text style={styles.statValue}>{totalComm.toFixed(2)}</Text>
          <Text style={styles.statLabel}>{t('totalCommissions')}</Text>
        </GlowCard>
      </View>

      <GlowCard style={styles.codeCard}>
        <View style={styles.codeRow}>
          <Ionicons name="gift" size={20} color={Colors.dark.primary} />
          <Text style={styles.codeLabel}>{t('referralCodeLabel')}</Text>
        </View>
        <Text style={styles.codeValue}>{user?.referralCode || '---'}</Text>
        <Text style={styles.codeHint}>{t('shareCode')}</Text>
      </GlowCard>

      <Text style={styles.sectionTitle}>{t('yourNetwork')}</Text>
      {(!network || network.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="people-outline" size={32} color={Colors.dark.textMuted} />
          <Text style={styles.emptyText}>{t('noReferrals')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.networkList}>
          {network.map((ref: any) => (
            <GlowCard key={ref.id} style={styles.refItem}>
              <View style={styles.refRow}>
                <View style={styles.refAvatar}>
                  <Text style={styles.refAvatarText}>{ref.displayName?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.refInfo}>
                  <Text style={styles.refName}>{ref.displayName}</Text>
                  <Text style={styles.refId}>ID: {ref.userId}</Text>
                </View>
                <Text style={styles.refDate}>{new Date(ref.createdAt).toLocaleDateString()}</Text>
              </View>
            </GlowCard>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>{t('commissionHistory')}</Text>
      {(!commissions || commissions.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="trending-up-outline" size={32} color={Colors.dark.textMuted} />
          <Text style={styles.emptyText}>{t('noCommissions')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.commList}>
          {commissions.map((c: any) => (
            <GlowCard key={c.id} style={styles.commItem}>
              <View style={styles.commRow}>
                <View style={[styles.levelBadge, { backgroundColor: Colors.dark.primaryDim }]}>
                  <Text style={styles.levelText}>L{c.level}</Text>
                </View>
                <View style={styles.commInfo}>
                  <Text style={styles.commFrom}>{t('level')} {c.level} {t('commission')}</Text>
                  <Text style={styles.commDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.commAmount}>+{Number(c.amount).toFixed(2)}</Text>
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
    backgroundColor: Colors.dark.background,
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
    backgroundColor: Colors.dark.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
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
    fontFamily: 'Rajdhani_500Medium',
    color: Colors.dark.textSecondary,
  },
  codeValue: {
    fontSize: 32,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
    letterSpacing: 4,
  },
  codeHint: {
    fontSize: 12,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
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
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
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
    backgroundColor: Colors.dark.primaryDim,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refAvatarText: {
    fontSize: 16,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
  },
  refInfo: {
    flex: 1,
  },
  refName: {
    fontSize: 14,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
  },
  refId: {
    fontSize: 11,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  refDate: {
    fontSize: 11,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
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
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
  },
  commInfo: {
    flex: 1,
  },
  commFrom: {
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    color: Colors.dark.text,
  },
  commDate: {
    fontSize: 11,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  commAmount: {
    fontSize: 16,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.success,
  },
});
