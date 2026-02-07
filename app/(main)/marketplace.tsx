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
import Colors from '@/constants/colors';

function ListingCard({ listing, userId, onLike }: { listing: any; userId: string; onLike: (id: number) => void }) {
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
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>{listing.sellerName?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{listing.sellerName}</Text>
            <Text style={styles.postedTime}>{timeAgo(listing.createdAt)}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Ionicons name="diamond" size={12} color={Colors.dark.primary} />
            <Text style={styles.priceText}>{Number(listing.price).toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.deviceDisplay}>
          <View style={styles.deviceDisplayIcon}>
            {listing.brand === 'Apple' ? (
              <Ionicons name="logo-apple" size={36} color={Colors.dark.primary} />
            ) : listing.brand === 'Samsung' ? (
              <MaterialCommunityIcons name="cellphone" size={36} color={Colors.dark.primary} />
            ) : (
              <MaterialCommunityIcons name="star-four-points" size={36} color={Colors.dark.primary} />
            )}
          </View>
          <Text style={styles.deviceModelName}>{listing.model}</Text>
          <Text style={styles.deviceBrandName}>{listing.brand}</Text>
        </View>

        <View style={styles.listingActions}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onLike(listing.id); }}
            style={styles.actionBtn}
          >
            <Ionicons name="heart-outline" size={20} color={Colors.dark.primary} />
            <Text style={styles.actionCount}>{listing.likes || 0}</Text>
          </Pressable>
        </View>
      </GlowCard>
    </Animated.View>
  );
}

export default function MarketplaceScreen() {
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>{t('feed')}</Text>
        </View>

        {(!listings || listings.length === 0) ? (
          <GlowCard style={styles.emptyCard}>
            <Ionicons name="storefront-outline" size={40} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>{t('noListings')}</Text>
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
    backgroundColor: Colors.dark.background,
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
    color: Colors.dark.text,
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
    color: Colors.dark.textMuted,
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
    backgroundColor: Colors.dark.primaryDim,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
    color: Colors.dark.primary,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: Colors.dark.text,
  },
  postedTime: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
    color: Colors.dark.textMuted,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_700Bold',
    color: Colors.dark.primary,
  },
  deviceDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.dark.primaryDim,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceDisplayIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  deviceModelName: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: Colors.dark.text,
  },
  deviceBrandName: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
    color: Colors.dark.textMuted,
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
    backgroundColor: Colors.dark.primaryDim,
  },
  actionCount: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_600SemiBold',
    color: Colors.dark.primary,
  },
});
