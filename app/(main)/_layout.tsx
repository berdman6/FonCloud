import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking, Modal } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { useNotifications } from '@/lib/notifications-context';
import { FloatingBackground } from '@/components/FloatingBackground';
import { useThemeColors, useTheme } from '@/lib/theme-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItemProps {
  icon: string;
  iconSet?: 'ionicons' | 'material';
  label: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}

function TabItem({ icon, iconSet = 'ionicons', label, active, badge, onPress }: TabItemProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    translateY.value = withSequence(
      withTiming(-4, { duration: 80 }),
      withSpring(0, { damping: 12, stiffness: 200 })
    );
    onPress();
  }, [onPress]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const iconColor = active ? colors.primary : colors.tabIconDefault;
  const IconComponent = iconSet === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={[styles.tabIconWrap, iconAnimStyle]}>
        {active && <View style={[styles.tabActiveIndicator, { backgroundColor: colors.primary }]} />}
        <IconComponent name={icon as any} size={24} color={iconColor} />
        {badge !== undefined && badge > 0 && (
          <View style={[styles.tabBadge, { backgroundColor: colors.danger }]}>
            <Text style={styles.tabBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </Animated.View>
      <Text style={[styles.tabLabel, { color: colors.tabIconDefault }, active && { color: colors.primary, fontFamily: 'HindSiliguri_600SemiBold' }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

interface MoreSheetItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: number;
  right?: React.ReactNode;
}

function MoreSheetItem({ icon, label, onPress, color, badge, right }: MoreSheetItemProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.moreItem, pressed && { backgroundColor: colors.primaryDim }]}
    >
      <Ionicons name={icon as any} size={22} color={color || colors.textSecondary} />
      <Text style={[styles.moreItemText, { color: colors.text }, color ? { color } : null]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.moreBadge, { backgroundColor: colors.danger }]}>
          <Text style={styles.moreBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
      {right}
    </Pressable>
  );
}

export default function MainLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, currentLanguage, toggleLanguage } = useLanguage();
  const { unreadCount } = useNotifications();
  const { isDark, toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const navigateTo = useCallback((route: string) => {
    setMoreOpen(false);
    router.push(route as any);
  }, []);

  const handleLogout = useCallback(async () => {
    setMoreOpen(false);
    await logout();
    router.replace('/(auth)/login');
  }, [logout]);

  const isActive = (screen: string) => pathname.includes(screen);

  const moreScreensActive = isActive('withdrawal') || isActive('referral') || isActive('profile') || isActive('notification');

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const tabBarHeight = 60 + bottomPad;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FloatingBackground />
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.neonGreen,
          headerTitleStyle: { fontFamily: 'HindSiliguri_600SemiBold', fontSize: 18, color: colors.neonGreen },
          headerLeft: () => null,
          headerRight: () => (
            <Pressable onPress={() => navigateTo('/(main)/notifications')} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          ),
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="home" options={{ title: 'FonCloud' }} />
        <Stack.Screen name="wallet" options={{ title: t('wallet') }} />
        <Stack.Screen name="manufacturing" options={{ title: t('manufacturing') }} />
        <Stack.Screen name="marketplace" options={{ title: t('marketplace') }} />
        <Stack.Screen name="withdrawals" options={{ title: t('withdrawals') }} />
        <Stack.Screen name="referrals" options={{ title: t('referrals') }} />
        <Stack.Screen name="profile" options={{ title: t('profile') }} />
        <Stack.Screen name="notifications" options={{ title: t('notifications') }} />
      </Stack>

      <View style={[styles.tabBar, { height: tabBarHeight, paddingBottom: bottomPad, backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
        <TabItem
          icon={isActive('home') ? 'home' : 'home-outline'}
          label={t('home')}
          active={isActive('home')}
          onPress={() => navigateTo('/(main)/home')}
        />
        <TabItem
          icon="factory"
          iconSet="material"
          label={t('manufacturing')}
          active={isActive('manufacturing')}
          onPress={() => navigateTo('/(main)/manufacturing')}
        />
        <TabItem
          icon={isActive('marketplace') ? 'storefront' : 'storefront-outline'}
          label={t('marketplace')}
          active={isActive('marketplace')}
          onPress={() => navigateTo('/(main)/marketplace')}
        />
        <TabItem
          icon={isActive('wallet') ? 'wallet' : 'wallet-outline'}
          label={t('wallet')}
          active={isActive('wallet')}
          onPress={() => navigateTo('/(main)/wallet')}
        />
        <TabItem
          icon={moreOpen || moreScreensActive ? 'grid' : 'grid-outline'}
          label={t('more') || 'More'}
          active={moreScreensActive}
          onPress={() => setMoreOpen(true)}
        />
      </View>

      <Modal
        visible={moreOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMoreOpen(false)}
      >
        <Pressable style={styles.moreOverlay} onPress={() => setMoreOpen(false)}>
          <Pressable
            style={[styles.moreSheet, { paddingBottom: bottomPad + 12, backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.moreHandle, { backgroundColor: colors.divider }]} />

            <View style={styles.moreProfileRow}>
              <View style={[styles.moreAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.moreAvatarText}>{user?.displayName?.charAt(0)?.toUpperCase() || 'F'}</Text>
              </View>
              <View style={styles.moreProfileInfo}>
                <Text style={[styles.moreProfileName, { color: colors.text }]}>{user?.displayName || 'User'}</Text>
                <Text style={[styles.moreProfileId, { color: colors.textSecondary }]}>ID: {user?.userId || '---'}</Text>
              </View>
            </View>

            <View style={[styles.moreDivider, { backgroundColor: colors.divider }]} />

            <MoreSheetItem
              icon="arrow-down-circle-outline"
              label={t('withdrawals')}
              onPress={() => navigateTo('/(main)/withdrawals')}
            />
            <MoreSheetItem
              icon="people-outline"
              label={t('referrals')}
              onPress={() => navigateTo('/(main)/referrals')}
            />
            <MoreSheetItem
              icon="person-outline"
              label={t('profile')}
              onPress={() => navigateTo('/(main)/profile')}
            />
            <MoreSheetItem
              icon="notifications-outline"
              label={t('notifications')}
              onPress={() => navigateTo('/(main)/notifications')}
              badge={unreadCount}
            />

            <View style={[styles.moreDivider, { backgroundColor: colors.divider }]} />

            <MoreSheetItem
              icon="language"
              label={t('switchLanguage')}
              onPress={() => { toggleLanguage(); setMoreOpen(false); }}
              right={
                <View style={[styles.langChip, { backgroundColor: colors.primaryDim }]}>
                  <Text style={[styles.langChipText, { color: colors.primary }]}>{currentLanguage.toUpperCase()}</Text>
                </View>
              }
            />
            <MoreSheetItem
              icon={isDark ? 'sunny-outline' : 'moon-outline'}
              label={t('switchTheme')}
              onPress={() => { toggleTheme(); setMoreOpen(false); }}
              right={
                <View style={[styles.langChip, { backgroundColor: colors.primaryDim }]}>
                  <Text style={[styles.langChipText, { color: colors.primary }]}>{isDark ? t('darkMode') : t('lightMode')}</Text>
                </View>
              }
            />
            <MoreSheetItem
              icon="paper-plane-outline"
              label={t('support')}
              onPress={() => { Linking.openURL('https://t.me/FonCloudSupport'); setMoreOpen(false); }}
            />
            <MoreSheetItem
              icon="log-out-outline"
              label={t('logout')}
              onPress={handleLogout}
              color={colors.danger}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bellBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 10,
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'flex-start',
    paddingTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconWrap: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActiveIndicator: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontSize: 9,
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'HindSiliguri_500Medium',
  },
  moreOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  moreSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  moreHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  moreProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 14,
  },
  moreAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAvatarText: {
    fontSize: 20,
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
  },
  moreProfileInfo: {
    flex: 1,
  },
  moreProfileName: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  moreProfileId: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
  },
  moreDivider: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderRadius: 10,
    marginHorizontal: 8,
  },
  moreItemText: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_500Medium',
    flex: 1,
  },
  moreBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  moreBadgeText: {
    fontSize: 10,
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  langChipText: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
});
