import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Linking } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { useNotifications } from '@/lib/notifications-context';
import Colors from '@/constants/colors';

interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  route: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}

function DrawerItem({ icon, label, active, onPress, badge }: DrawerItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.drawerItem,
        active && styles.drawerItemActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      {icon}
      <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.drawerBadge}>
          <Text style={styles.drawerBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
      {active && <View style={styles.activeIndicator} />}
    </Pressable>
  );
}

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, currentLanguage, toggleLanguage } = useLanguage();
  const { unreadCount } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useSharedValue(0);

  const openDrawer = () => {
    setDrawerOpen(true);
    drawerAnim.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
  };

  const closeDrawer = () => {
    drawerAnim.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    setTimeout(() => setDrawerOpen(false), 260);
  };

  const navigateTo = (route: string) => {
    closeDrawer();
    setTimeout(() => router.push(route as any), 280);
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    router.replace('/(auth)/login');
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drawerAnim.value, [0, 1], [0, 0.6]),
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(drawerAnim.value, [0, 1], [-300, 0]) }],
  }));

  const menuItems = [
    { icon: <Ionicons name="home-outline" size={22} color={pathname.includes('home') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('home'), route: '/(main)/home' },
    { icon: <Ionicons name="wallet-outline" size={22} color={pathname.includes('wallet') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('wallet'), route: '/(main)/wallet' },
    { icon: <MaterialCommunityIcons name="factory" size={22} color={pathname.includes('manufacturing') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('manufacturing'), route: '/(main)/manufacturing' },
    { icon: <Ionicons name="storefront-outline" size={22} color={pathname.includes('marketplace') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('marketplace'), route: '/(main)/marketplace' },
    { icon: <Ionicons name="arrow-down-circle-outline" size={22} color={pathname.includes('withdrawal') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('withdrawals'), route: '/(main)/withdrawals' },
    { icon: <Ionicons name="people-outline" size={22} color={pathname.includes('referral') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('referrals'), route: '/(main)/referrals' },
    { icon: <Ionicons name="person-outline" size={22} color={pathname.includes('profile') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('profile'), route: '/(main)/profile' },
    { icon: <Ionicons name="notifications-outline" size={22} color={pathname.includes('notification') ? Colors.dark.primary : Colors.dark.textSecondary} />, label: t('notifications'), route: '/(main)/notifications', badge: unreadCount },
  ];

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: Colors.dark.background },
          headerTintColor: Colors.dark.text,
          headerTitleStyle: { fontFamily: 'HindSiliguri_600SemiBold', fontSize: 18 },
          headerLeft: () => (
            <Pressable onPress={openDrawer} style={styles.menuBtn}>
              <Ionicons name="menu" size={26} color={Colors.dark.primary} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => navigateTo('/(main)/notifications')} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={22} color={Colors.dark.primary} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          ),
          contentStyle: { backgroundColor: Colors.dark.background },
          headerShadowVisible: true,
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

      {drawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable onPress={closeDrawer} style={StyleSheet.absoluteFill}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, overlayStyle]} />
          </Pressable>

          <Animated.View style={[styles.drawer, drawerStyle, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 10) }]}>
            <View style={styles.drawerProfile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.displayName?.charAt(0)?.toUpperCase() || 'F'}</Text>
              </View>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileId}>ID: {user?.userId || '---'}</Text>
              <View style={styles.balanceRow}>
                <Ionicons name="diamond-outline" size={14} color="#FFFFFF" />
                <Text style={styles.balanceText}>{t('totalCredits')}: {Number(user?.walletBalance || 0).toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.drawerDivider} />

            <ScrollView style={styles.drawerMenu} showsVerticalScrollIndicator={false}>
              {menuItems.map((item: any) => (
                <DrawerItem
                  key={item.route}
                  icon={item.icon}
                  label={item.label}
                  route={item.route}
                  active={pathname.includes(item.route.split('/').pop() || '')}
                  onPress={() => navigateTo(item.route)}
                  badge={item.badge}
                />
              ))}
            </ScrollView>

            <View style={styles.drawerDivider} />

            <View style={styles.drawerBottom}>
              <Pressable onPress={toggleLanguage} style={styles.drawerBottomItem}>
                <Ionicons name="language" size={20} color={Colors.dark.textSecondary} />
                <Text style={styles.drawerBottomText}>{t('switchLanguage')}</Text>
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>{currentLanguage.toUpperCase()}</Text>
                </View>
              </Pressable>

              <Pressable onPress={() => Linking.openURL('https://t.me/FonCloudSupport')} style={styles.drawerBottomItem}>
                <Ionicons name="paper-plane-outline" size={20} color={Colors.dark.textSecondary} />
                <Text style={styles.drawerBottomText}>{t('support')}</Text>
              </Pressable>

              <Pressable onPress={handleLogout} style={styles.drawerBottomItem}>
                <Ionicons name="log-out-outline" size={20} color={Colors.dark.danger} />
                <Text style={[styles.drawerBottomText, { color: Colors.dark.danger }]}>{t('logout')}</Text>
              </Pressable>
            </View>

            <View style={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 10) }} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
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
    backgroundColor: Colors.dark.danger,
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
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: Colors.dark.surface,
    borderRightWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 8,
  },
  drawerProfile: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  profileId: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  balanceText: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_500Medium',
    color: '#FFFFFF',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.dark.divider,
    marginHorizontal: 16,
  },
  drawerMenu: {
    flex: 1,
    paddingVertical: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 14,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  drawerItemActive: {
    backgroundColor: Colors.dark.primaryDim,
  },
  drawerItemText: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_500Medium',
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  drawerItemTextActive: {
    color: Colors.dark.primary,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.primary,
  },
  drawerBottom: {
    paddingVertical: 8,
  },
  drawerBottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  drawerBottomText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_500Medium',
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  langBadge: {
    backgroundColor: Colors.dark.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  langBadgeText: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: Colors.dark.primary,
  },
  drawerBadge: {
    backgroundColor: Colors.dark.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  drawerBadgeText: {
    fontSize: 10,
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
  },
});
