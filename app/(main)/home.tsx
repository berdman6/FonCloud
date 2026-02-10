import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence, Easing, interpolate, runOnJS, FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { useNotifications } from '@/lib/notifications-context';
import type { AppNotification } from '@/lib/notifications-context';
import { GlowCard } from '@/components/GlowCard';
import { PortalAnimation } from '@/components/PortalAnimation';
import { FloatingBackground } from '@/components/FloatingBackground';
import { useThemeColors } from '@/lib/theme-context';

const ACTION_THEMES = [
  { gradient: ['#39FF14', '#1ABB00'] as const, shadowColor: '#39FF14' },
  { gradient: ['#F5A623', '#E08D0D'] as const, shadowColor: '#F5A623' },
  { gradient: ['#4A90D9', '#2C6DB5'] as const, shadowColor: '#4A90D9' },
  { gradient: ['#E25B45', '#C43E2A'] as const, shadowColor: '#E25B45' },
];

function QuickAction({ icon, label, route, delay, themeIndex }: { icon: React.ReactNode; label: string; route: string; delay: number; themeIndex: number }) {
  const colors = useThemeColors();
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
      <Pressable onPress={() => router.push(route as any)} style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.card }, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}>
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
        <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
        <View style={[styles.actionArrow, { backgroundColor: colors.background }]}>
          <Feather name="chevron-right" size={14} color={colors.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function BarChart({ data, t }: { data: any[]; t: (k: string) => string }) {
  const colors = useThemeColors();
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <GlowCard style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('earningsDashboard')}</Text>
        </View>
        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>{t('last7Days')}</Text>
      </View>

      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>{t('manufacturing')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>{t('commission')}</Text>
        </View>
      </View>

      <View style={[styles.chartBody, { borderBottomColor: colors.divider }]}>
        {data.map((day, idx) => {
          const mfgHeight = maxVal > 0 ? (day.manufacturing / maxVal) * 100 : 0;
          const commHeight = maxVal > 0 ? (day.commission / maxVal) * 100 : 0;
          const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);

          return (
            <View key={idx} style={styles.chartColumn}>
              <View style={styles.chartBarsWrap}>
                <View style={[styles.chartBar, { height: `${Math.max(mfgHeight, 2)}%`, backgroundColor: colors.primary }]} />
                <View style={[styles.chartBar, { height: `${Math.max(commHeight, 2)}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={[styles.chartDayLabel, { color: colors.textMuted }]}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.chartTotals}>
        <View style={styles.chartTotalItem}>
          <Text style={[styles.chartTotalLabel, { color: colors.textMuted }]}>{t('manufacturing')}</Text>
          <Text style={[styles.chartTotalValue, { color: colors.primary }]}>
            {data.reduce((s, d) => s + d.manufacturing, 0).toFixed(0)}
          </Text>
        </View>
        <View style={[styles.chartTotalDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.chartTotalItem}>
          <Text style={[styles.chartTotalLabel, { color: colors.textMuted }]}>{t('commission')}</Text>
          <Text style={[styles.chartTotalValue, { color: colors.accent }]}>
            {data.reduce((s, d) => s + d.commission, 0).toFixed(0)}
          </Text>
        </View>
        <View style={[styles.chartTotalDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.chartTotalItem}>
          <Text style={[styles.chartTotalLabel, { color: colors.textMuted }]}>{t('totalIncome')}</Text>
          <Text style={[styles.chartTotalValue, { color: colors.success }]}>
            {data.reduce((s, d) => s + d.total, 0).toFixed(0)}
          </Text>
        </View>
      </View>
    </GlowCard>
  );
}

const ACTION_LABELS: Record<string, string> = {
  transfer: 'Transfer',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  manufacturing: 'Manufacturing',
  commission: 'Commission',
  sale: 'Sale',
  purchase: 'Purchase',
  signup: 'Signup',
};

const COIN_IMAGES: Record<string, any> = {
  transfer: require('@/assets/images/coin-dollar.png'),
  deposit: require('@/assets/images/coin-taka.png'),
  withdraw: require('@/assets/images/coin-dollar.png'),
  manufacturing: require('@/assets/images/coin-mobile.png'),
  commission: require('@/assets/images/coin-taka.png'),
  sale: require('@/assets/images/coin-mobile.png'),
  purchase: require('@/assets/images/coin-mobile.png'),
  signup: require('@/assets/images/coin-taka.png'),
};

function FeedRow({ item, index, t }: { item: any; index: number; t: (k: string) => string }) {
  const colors = useThemeColors();
  const label = t(item.action) || ACTION_LABELS[item.action] || item.action;
  const coinImg = COIN_IMAGES[item.action] || COIN_IMAGES.transfer;
  const isEven = index % 2 === 0;

  return (
    <Animated.View entering={FadeIn.delay(index * 60).duration(300)}>
      <View style={[feedStyles.row, isEven && feedStyles.rowAlt]}>
        <View style={feedStyles.cellAction}>
          <View style={[feedStyles.actionDot, { backgroundColor: item.color }]} />
          <Text style={feedStyles.actionText} numberOfLines={1}>{label}</Text>
        </View>
        <Text style={feedStyles.cellUser} numberOfLines={1}>{item.user}</Text>
        <Text style={[feedStyles.cellAmount, { color: item.isPositive ? '#2ECC71' : '#E74C3C' }]}>
          {item.isPositive ? '+' : '-'}BDT {item.amount.toFixed(2)}
        </Text>
        <Image source={coinImg} style={feedStyles.coinIcon} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const FEED_ROW_HEIGHT = 42;
const FEED_VISIBLE_ROWS = 6;
const FEED_SCROLL_INTERVAL = 2000;

function ActivityFeed({ t }: { t: (k: string) => string }) {
  const colors = useThemeColors();
  const { data } = useQuery<any>({ queryKey: ['/api/dashboard/activity-feed'] });
  const feed = data?.feed || [];
  const scrollRef = useRef<ScrollView>(null);
  const scrollPos = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxHeight = FEED_ROW_HEIGHT * FEED_VISIBLE_ROWS;
  const items = feed.slice(0, 50);
  const totalHeight = items.length * FEED_ROW_HEIGHT;

  useEffect(() => {
    if (items.length <= FEED_VISIBLE_ROWS) return;

    timerRef.current = setInterval(() => {
      scrollPos.current += FEED_ROW_HEIGHT;
      if (scrollPos.current >= totalHeight - maxHeight + FEED_ROW_HEIGHT) {
        scrollPos.current = 0;
      }
      scrollRef.current?.scrollTo({ y: scrollPos.current, animated: true });
    }, FEED_SCROLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, totalHeight]);

  if (feed.length === 0) {
    return null;
  }

  return (
    <View style={feedStyles.container}>
      <View style={feedStyles.headerRow}>
        <View style={feedStyles.headerLeft}>
          <View style={feedStyles.liveIndicator}>
            <View style={feedStyles.liveDot} />
          </View>
          <Text style={[feedStyles.headerTitle, { color: colors.text }]}>{t('liveFeed')}</Text>
        </View>
      </View>

      <View style={feedStyles.tableCard}>
        <View style={feedStyles.tableHeader}>
          <Text style={[feedStyles.thText, feedStyles.cellAction]}>{t('action')}</Text>
          <Text style={[feedStyles.thText, feedStyles.cellUserH]}>{t('user')}</Text>
          <Text style={[feedStyles.thText, feedStyles.cellAmountH]}>{t('amountLabel')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ height: maxHeight, overflow: 'hidden' }}>
          <ScrollView
            ref={scrollRef}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {items.map((item: any, idx: number) => (
              <FeedRow key={item.id} item={item} index={idx} t={t} />
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function NotificationToast({ notification, onDismiss, onPress }: { notification: AppNotification; onDismiss: () => void; onPress: () => void }) {
  const colors = useThemeColors();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.2)) });
    opacity.value = withTiming(1, { duration: 300 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toastContainer, animStyle]}>
      <Pressable onPress={onPress} style={[styles.toastContent, { backgroundColor: colors.primary }]}>
        <View style={[styles.toastIconWrap, { backgroundColor: notification.iconColor }]}>
          <Ionicons name={notification.icon as any} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.toastBody}>
          <Text style={styles.toastTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.toastMessage} numberOfLines={1}>
            {notification.message}
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { unreadCount, latestUnread, dismissLatest } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: devicesData } = useQuery<any>({
    queryKey: ['/api/manufacturing/devices'],
  });
  const devicesList = devicesData?.devices || [];

  const { data: transactions } = useQuery<any[]>({
    queryKey: ['/api/wallet/transactions'],
  });

  const { data: dashboardData } = useQuery<any>({
    queryKey: ['/api/dashboard/stats'],
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

  const chartData = dashboardData?.last7Days || [];

  const handleToastPress = () => {
    dismissLatest();
    router.push('/(main)/notifications' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>

      {latestUnread && (
        <NotificationToast
          notification={latestUnread}
          onDismiss={dismissLatest}
          onPress={handleToastPress}
        />
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.welcomeSection}>
          <View style={styles.portalWrap}>
            <PortalAnimation size={240} />
          </View>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('welcomeBack')}</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.displayName || 'User'}</Text>
        </View>

        {unreadCount > 0 && (
          <Pressable onPress={() => router.push('/(main)/notifications' as any)} style={styles.notifBanner}>
            <View style={styles.notifBannerLeft}>
              <Ionicons name="notifications" size={18} color={colors.accent} />
              <Text style={[styles.notifBannerText, { color: colors.accent }]}>
                {unreadCount} {t('newNotifications')}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.accent} />
          </Pressable>
        )}

        <Animated.View style={glowStyle}>
        <GlowCard style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('totalBalance')}</Text>
            <Text style={[styles.balanceAmount, { color: colors.primary }]}>{Number(user?.walletBalance || 0).toFixed(2)}</Text>
            <Text style={[styles.creditLabel, { color: colors.textMuted }]}>{t('credits')}</Text>
          </View>
          <View style={[styles.balanceStats, { borderTopColor: colors.divider }]}>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={16} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{Number(user?.totalEarnings || 0).toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('totalEarned')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.text }]}>{user?.totalReferrals || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('referrals')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Ionicons name="phone-portrait" size={16} color={colors.secondary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{devicesList.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('yourDevices')}</Text>
            </View>
          </View>
        </GlowCard>
      </Animated.View>

      {chartData.length > 0 && (
        <BarChart data={chartData} t={t} />
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quickActions')}</Text>
      <View style={styles.actionsGrid}>
        <QuickAction icon={<MaterialCommunityIcons name="factory" size={22} color="#FFFFFF" />} label={t('manufacturing')} route="/(main)/manufacturing" delay={0} themeIndex={0} />
        <QuickAction icon={<Ionicons name="wallet" size={22} color="#FFFFFF" />} label={t('wallet')} route="/(main)/wallet" delay={100} themeIndex={1} />
        <QuickAction icon={<Ionicons name="storefront" size={22} color="#FFFFFF" />} label={t('marketplace')} route="/(main)/marketplace" delay={200} themeIndex={2} />
        <QuickAction icon={<Ionicons name="arrow-down-circle" size={22} color="#FFFFFF" />} label={t('withdrawals')} route="/(main)/withdrawals" delay={300} themeIndex={3} />
      </View>

      <ActivityFeed t={t} />

      <View style={styles.recentHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recentActivity')}</Text>
      </View>
      {(!transactions || transactions.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="time-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noActivity')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.txList}>
          {transactions.slice(0, 5).map((tx: any) => (
            <GlowCard key={tx.id} style={styles.txItem}>
              <View style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? colors.dangerDim : colors.successDim }]}>
                  <Ionicons
                    name={tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? colors.danger : colors.success}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txType, { color: colors.text }]}>{tx.description || tx.type}</Text>
                  <Text style={[styles.txDate, { color: colors.textMuted }]}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? colors.danger : colors.success }]}>
                  {tx.type === 'transfer_sent' || tx.type === 'device_purchase' ? '-' : '+'}{Number(tx.amount).toFixed(2)}
                </Text>
              </View>
            </GlowCard>
          ))}
        </View>
      )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  portalWrap: {
    marginBottom: 4,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_400Regular',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'HindSiliguri_700Bold',
  },
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 166, 35, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  notifBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifBannerText: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_600SemiBold',
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
    fontFamily: 'HindSiliguri_400Regular',
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  balanceAmount: {
    fontSize: 42,
    fontFamily: 'HindSiliguri_700Bold',
    marginTop: 4,
  },
  creditLabel: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_500Medium',
    letterSpacing: 1,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  chartCard: {
    padding: 16,
    marginBottom: 24,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  chartSubtitle: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 4,
    marginBottom: 12,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBarsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    width: '100%',
    justifyContent: 'center',
  },
  chartBar: {
    width: 12,
    borderRadius: 3,
    minHeight: 2,
  },
  chartDayLabel: {
    fontSize: 10,
    fontFamily: 'HindSiliguri_500Medium',
    marginTop: 4,
  },
  chartTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  chartTotalItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartTotalLabel: {
    fontSize: 10,
    fontFamily: 'HindSiliguri_400Regular',
  },
  chartTotalValue: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
  },
  chartTotalDivider: {
    width: 1,
    height: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
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
    fontFamily: 'HindSiliguri_600SemiBold',
    flex: 1,
  },
  actionArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontFamily: 'HindSiliguri_400Regular',
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
    fontFamily: 'HindSiliguri_500Medium',
  },
  txDate: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  txAmount: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    zIndex: 100,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBody: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: '#FFFFFF',
  },
  toastMessage: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
});

const feedStyles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ECC71',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
    letterSpacing: 0.5,
  },
  tableCard: {
    backgroundColor: '#1A2332',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  thText: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowAlt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cellAction: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cellUserH: {
    flex: 1.5,
  },
  cellAmountH: {
    flex: 2,
    textAlign: 'right' as const,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: '#FFFFFF',
    flex: 1,
  },
  cellUser: {
    flex: 1.5,
    fontSize: 13,
    fontFamily: 'HindSiliguri_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  cellAmount: {
    flex: 2,
    fontSize: 13,
    fontFamily: 'HindSiliguri_700Bold',
    textAlign: 'right' as const,
  },
  coinIcon: {
    width: 24,
    height: 24,
    marginLeft: 6,
  },
});
