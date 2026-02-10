import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { apiRequest } from '@/lib/query-client';
import { useThemeColors } from '@/lib/theme-context';

function ListingCard({ listing, userId, onLike }: { listing: any; userId: string; onLike: (id: number) => void }) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0);
  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [15, 0]) }],
  }));

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <Animated.View style={animStyle}>
      <GlowCard style={styles.listingCard}>
        <View style={styles.listingHeader}>
          <View style={[styles.sellerAvatar, { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}>
            <Text style={[styles.sellerAvatarText, { color: colors.primary }]}>{listing.sellerName?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.sellerInfo}>
            <Text style={[styles.sellerName, { color: colors.text }]}>{listing.sellerName}</Text>
            <Text style={[styles.postedTime, { color: colors.textMuted }]}>{timeAgo(listing.createdAt)}</Text>
          </View>
          <View style={[styles.priceBadge, { backgroundColor: colors.primaryDim, borderColor: colors.cardBorder }]}>
            <Ionicons name="diamond" size={12} color={colors.primary} />
            <Text style={[styles.priceText, { color: colors.primary }]}>{Number(listing.price).toFixed(0)}</Text>
          </View>
        </View>

        <View style={[styles.deviceDisplay, { backgroundColor: colors.primaryDim }]}>
          <View style={[styles.deviceDisplayIcon, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {listing.brand === 'Apple' ? (
              <Ionicons name="logo-apple" size={36} color={colors.primary} />
            ) : listing.brand === 'Samsung' ? (
              <MaterialCommunityIcons name="cellphone" size={36} color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="star-four-points" size={36} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.deviceModelName, { color: colors.text }]}>{listing.model}</Text>
          <Text style={[styles.deviceBrandName, { color: colors.textMuted }]}>{listing.brand}</Text>
        </View>

        <View style={styles.listingActions}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onLike(listing.id); }}
            style={[styles.actionBtn, { backgroundColor: colors.primaryDim }]}
          >
            <Ionicons name="heart-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionCount, { color: colors.primary }]}>{listing.likes || 0}</Text>
          </Pressable>
        </View>
      </GlowCard>
    </Animated.View>
  );
}

export default function MarketplaceScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  const { data: listings, refetch: refetchListings } = useQuery<any[]>({
    queryKey: ['/api/marketplace/feed'],
  });

  const likeMutation = useMutation({
    mutationFn: async (listingId: number) => {
      const res = await apiRequest('POST', `/api/marketplace/like/${listingId}`);
      return res.json();
    },
    onSuccess: () => {
      refetchListings();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchListings();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('feed')}</Text>
        </View>

        {(!listings || listings.length === 0) ? (
          <GlowCard style={styles.emptyCard}>
            <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noListings')}</Text>
          </GlowCard>
        ) : (
          <View style={styles.listingsGrid}>
            {listings.map((listing: any) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                userId={user?.userId || ''}
                onLike={(id) => likeMutation.mutate(id)}
              />
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
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_400Regular',
  },
  listingsGrid: {
    gap: 12,
  },
  listingCard: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sellerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  postedTime: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_700Bold',
  },
  deviceDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceDisplayIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  deviceModelName: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  deviceBrandName: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
  },
  listingActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionCount: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
});
