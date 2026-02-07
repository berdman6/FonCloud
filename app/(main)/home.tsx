import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence, Easing, interpolate } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { PortalAnimation } from '@/components/PortalAnimation';
import Colors from '@/constants/colors';

const ACTION_THEMES = [
  { gradient: ['#5B8C3E', '#3D6B28'] as const, shadowColor: '#5B8C3E' },
  { gradient: ['#F5A623', '#E08D0D'] as const, shadowColor: '#F5A623' },
  { gradient: ['#4A90D9', '#2C6DB5'] as const, shadowColor: '#4A90D9' },
  { gradient: ['#E25B45', '#C43E2A'] as const, shadowColor: '#E25B45' },
];

function QuickAction({ icon, label, route, delay, themeIndex }: { icon: React.ReactNode; label: string; route: string; delay: number; themeIndex: number }) {
  const scale = useSharedValue(0);
  const theme = ACTION_THEMES[themeIndex % ACTION_THEMES.length];
  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.7)) }));
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));
  return (
    <Animated.View style={[animStyle, { flexGrow: 1, flexBasis: '45%' }]}>
      <Pressable onPress={() => router.push(route as any)} style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}>
        <View style={[styles.actionIconWrap, { shadowColor: theme.shadowColor }]}>
          <LinearGradient
            colors={[theme.gradient[0], theme.gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionIconGradient}
          >
            {icon}
          </LinearGradient>
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        <View style={styles.actionArrow}>
          <Feather name="chevron-right" size={14} color={Colors.dark.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: devices } = useQuery<any[]>({
    queryKey: ['/api/manufacturing/devices'],
  });

  const { data: transactions } = useQuery<any[]>({
    queryKey: ['/api/wallet/transactions'],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const pulseAnim = useSharedValue(0);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ), -1, true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pulseAnim.value, [0, 1], [0.2, 0.6]),
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
    >
      <View style={styles.welcomeSection}>
        <View style={styles.portalWrap}>
          <PortalAnimation size={120} />
        </View>
        <Text style={styles.welcomeText}>{t('welcomeBack')}</Text>
        <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
      </View>

      <Animated.View style={glowStyle}>
        <GlowCard style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>{t('totalBalance')}</Text>
            <Text style={styles.balanceAmount}>{Number(user?.walletBalance || 0).toFixed(2)}</Text>
            <Text style={styles.creditLabel}>{t('credits')}</Text>
          </View>
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={16} color={Colors.dark.success} />
              <Text style={styles.statValue}>{Number(user?.totalEarnings || 0).toFixed(2)}</Text>
              <Text style={styles.statLabel}>{t('totalEarned')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={Colors.dark.accent} />
              <Text style={styles.statValue}>{user?.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>{t('referrals')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="phone-portrait" size={16} color={Colors.dark.secondary} />
              <Text style={styles.statValue}>{devices?.length || 0}</Text>
              <Text style={styles.statLabel}>{t('yourDevices')}</Text>
            </View>
          </View>
        </GlowCard>
      </Animated.View>

      <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
      <View style={styles.actionsGrid}>
        <QuickAction icon={<MaterialCommunityIcons name="factory" size={22} color="#FFFFFF" />} label={t('manufacturing')} route="/(main)/manufacturing" delay={0} themeIndex={0} />
        <QuickAction icon={<Ionicons name="wallet" size={22} color="#FFFFFF" />} label={t('wallet')} route="/(main)/wallet" delay={100} themeIndex={1} />
        <QuickAction icon={<Ionicons name="storefront" size={22} color="#FFFFFF" />} label={t('marketplace')} route="/(main)/marketplace" delay={200} themeIndex={2} />
        <QuickAction icon={<Ionicons name="arrow-down-circle" size={22} color="#FFFFFF" />} label={t('withdrawals')} route="/(main)/withdrawals" delay={300} themeIndex={3} />
      </View>

      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
      </View>
      {(!transactions || transactions.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="time-outline" size={32} color={Colors.dark.textMuted} />
          <Text style={styles.emptyText}>{t('noActivity')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.txList}>
          {transactions.slice(0, 5).map((tx: any) => (
            <GlowCard key={tx.id} style={styles.txItem}>
              <View style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? Colors.dark.dangerDim : Colors.dark.successDim }]}>
                  <Ionicons
                    name={tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? Colors.dark.danger : Colors.dark.success}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>{tx.description || tx.type}</Text>
                  <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? Colors.dark.danger : Colors.dark.success }]}>
                  {tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? '-' : '+'}{Number(tx.amount).toFixed(2)}
                </Text>
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
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  portalWrap: {
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.text,
  },
  balanceCard: {
    padding: 20,
    marginBottom: 24,
  },
  balanceContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  balanceAmount: {
    fontSize: 42,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
    marginTop: 4,
  },
  creditLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani_500Medium',
    color: Colors.dark.textMuted,
    letterSpacing: 1,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.divider,
    paddingTop: 14,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.dark.divider,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionIconWrap: {
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderRadius: 14,
  },
  actionIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
    flex: 1,
  },
  actionArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  txList: {
    gap: 8,
  },
  txItem: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    color: Colors.dark.text,
  },
  txDate: {
    fontSize: 11,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  txAmount: {
    fontSize: 16,
    fontFamily: 'Rajdhani_700Bold',
  },
});
