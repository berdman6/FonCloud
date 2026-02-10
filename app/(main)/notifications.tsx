import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, AppNotification } from '@/lib/notifications-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { useThemeColors } from '@/lib/theme-context';

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function NotificationItem({ item, onPress }: { item: AppNotification; onPress: (id: string) => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={[
        styles.notifItem,
        { backgroundColor: colors.card },
        !item.isRead && { backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.cardBorder },
      ]}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: item.iconColor + '1A' }]}>
        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifTitleRow}>
          <Text
            style={[
              styles.notifTitle,
              { color: colors.textSecondary },
              !item.isRead && { fontFamily: 'HindSiliguri_600SemiBold', color: colors.text },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.notifTime, { color: colors.textMuted }]}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={[styles.notifMessage, { color: colors.textMuted }]} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.isRead && <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handlePress = (id: string) => {
    markAsRead(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlowCard style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={22} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('allNotifications')}</Text>
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
            {unreadCount > 0 && (
              <Pressable onPress={markAllAsRead} hitSlop={8} style={styles.markAllBtn}>
                <Ionicons name="checkmark-done" size={22} color={colors.primary} />
              </Pressable>
            )}
          </View>
        </View>
      </GlowCard>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noNotifications')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handlePress} />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20), paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
  },
  markAllBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_500Medium',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  notifIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_500Medium',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  notifMessage: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
    lineHeight: 17,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separator: {
    height: 8,
  },
});
