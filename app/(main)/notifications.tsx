import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, AppNotification } from '@/lib/notifications-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import Colors from '@/constants/colors';

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
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={[styles.notifItem, !item.isRead && styles.notifItemUnread]}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: item.iconColor + '1A' }]}>
        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.isRead && <View style={styles.notifDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handlePress = (id: string) => {
    markAsRead(id);
  };

  return (
    <View style={styles.container}>
      <GlowCard style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={22} color={Colors.dark.primary} />
            <Text style={styles.headerTitle}>{t('allNotifications')}</Text>
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
            {unreadCount > 0 && (
              <Pressable onPress={markAllAsRead} hitSlop={8} style={styles.markAllBtn}>
                <Ionicons name="checkmark-done" size={22} color={Colors.dark.primary} />
              </Pressable>
            )}
          </View>
        </View>
      </GlowCard>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={56} color={Colors.dark.textMuted} />
          <Text style={styles.emptyText}>{t('noNotifications')}</Text>
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
    backgroundColor: Colors.dark.background,
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
    color: Colors.dark.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    backgroundColor: Colors.dark.danger,
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
    color: Colors.dark.textMuted,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  notifItemUnread: {
    backgroundColor: 'rgba(91, 140, 62, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(91, 140, 62, 0.12)',
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
    color: Colors.dark.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  notifTitleUnread: {
    fontFamily: 'HindSiliguri_600SemiBold',
    color: Colors.dark.text,
  },
  notifTime: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
    color: Colors.dark.textMuted,
  },
  notifMessage: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
    color: Colors.dark.textMuted,
    lineHeight: 17,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.primary,
  },
  separator: {
    height: 8,
  },
});
