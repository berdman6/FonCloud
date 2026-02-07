import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getApiUrl } from './query-client';
import { fetch } from 'expo/fetch';
import Colors from '@/constants/colors';

const BUYER_NAMES = [
  'Ahmed Khan', 'Sakura Tanaka', 'Carlos Rivera', 'Fatima Ali', 'Liam O\'Brien',
  'Priya Sharma', 'Yuki Suzuki', 'Hans Mueller', 'Maria Santos', 'Chen Wei',
  'Aisha Mohammed', 'Dmitri Volkov', 'Isabella Rossi', 'Park Joon', 'Amara Okafor',
  'Sophie Bernard', 'Raj Patel', 'Olga Petrov', 'Kim Min-jun', 'Anya Ivanova',
  'Diego Fernandez', 'Hana Sato', 'Lars Johansson', 'Mei Lin', 'Omar Hassan',
  'Elena Popov', 'Takeshi Yamamoto', 'Zara Hussain', 'Marco Bianchi', 'Nadia Koslov',
];

const COUNTRY_FLAGS = [
  { flag: '\uD83C\uDDE7\uD83C\uDDE9', name: 'Bangladesh' },
  { flag: '\uD83C\uDDEE\uD83C\uDDF3', name: 'India' },
  { flag: '\uD83C\uDDF5\uD83C\uDDF0', name: 'Pakistan' },
  { flag: '\uD83C\uDDFA\uD83C\uDDF8', name: 'USA' },
  { flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'UK' },
  { flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'Germany' },
  { flag: '\uD83C\uDDEF\uD83C\uDDF5', name: 'Japan' },
  { flag: '\uD83C\uDDE7\uD83C\uDDF7', name: 'Brazil' },
  { flag: '\uD83C\uDDF0\uD83C\uDDF7', name: 'South Korea' },
  { flag: '\uD83C\uDDF3\uD83C\uDDEC', name: 'Nigeria' },
  { flag: '\uD83C\uDDF9\uD83C\uDDF7', name: 'Turkey' },
  { flag: '\uD83C\uDDEE\uD83C\uDDE9', name: 'Indonesia' },
  { flag: '\uD83C\uDDF2\uD83C\uDDFE', name: 'Malaysia' },
  { flag: '\uD83C\uDDF8\uD83C\uDDE6', name: 'Saudi Arabia' },
  { flag: '\uD83C\uDDE6\uD83C\uDDEA', name: 'UAE' },
  { flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'France' },
  { flag: '\uD83C\uDDEE\uD83C\uDDF9', name: 'Italy' },
  { flag: '\uD83C\uDDF7\uD83C\uDDFA', name: 'Russia' },
  { flag: '\uD83C\uDDE8\uD83C\uDDE6', name: 'Canada' },
  { flag: '\uD83C\uDDE6\uD83C\uDDFA', name: 'Australia' },
];

export type NotificationType = 'device_sold' | 'signup' | 'login' | 'commission' | 'referral' | 'withdrawal' | 'transfer';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  iconColor: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  latestUnread: AppNotification | null;
  dismissLatest: () => void;
  addNotification: (type: NotificationType, title: string, message: string) => void;
  scheduleDeviceSoldNotifs: (deviceModel: string, brand: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; iconColor: string }> = {
  device_sold: { icon: 'cart', iconColor: Colors.dark.primary },
  signup: { icon: 'person-add', iconColor: Colors.dark.success },
  login: { icon: 'log-in', iconColor: Colors.dark.primary },
  commission: { icon: 'cash', iconColor: Colors.dark.accent },
  referral: { icon: 'people', iconColor: Colors.dark.accent },
  withdrawal: { icon: 'arrow-down-circle', iconColor: Colors.dark.primary },
  transfer: { icon: 'swap-horizontal', iconColor: Colors.dark.primary },
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createNotification(type: NotificationType, title: string, message: string): AppNotification {
  const config = NOTIFICATION_CONFIG[type];
  return {
    id: generateId(),
    type,
    title,
    message,
    icon: config.icon,
    iconColor: config.iconColor,
    isRead: false,
    createdAt: new Date(),
  };
}

function mapServerNotification(n: any): AppNotification {
  const type = (n.type || 'login') as NotificationType;
  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.login;
  return {
    id: `srv_${n.id}`,
    type,
    title: n.title,
    message: n.message,
    icon: config.icon,
    iconColor: config.iconColor,
    isRead: n.isRead || n.is_read || false,
    createdAt: new Date(n.createdAt || n.created_at),
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [clientNotifications, setClientNotifications] = useState<AppNotification[]>([]);
  const [latestUnread, setLatestUnread] = useState<AppNotification | null>(null);
  const soldTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevServerCountRef = useRef<number>(0);

  const { data: serverNotifications } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const mappedServerNotifs = useMemo(() => {
    if (!serverNotifications) return [];
    return serverNotifications.map(mapServerNotification);
  }, [serverNotifications]);

  useEffect(() => {
    if (mappedServerNotifs.length > prevServerCountRef.current && prevServerCountRef.current > 0) {
      const newest = mappedServerNotifs[0];
      if (newest && !newest.isRead) {
        setLatestUnread(newest);
      }
    }
    prevServerCountRef.current = mappedServerNotifs.length;
  }, [mappedServerNotifs]);

  const allNotifications = useMemo(() => {
    const merged = [...clientNotifications, ...mappedServerNotifs];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged.slice(0, 100);
  }, [clientNotifications, mappedServerNotifs]);

  const pushClientNotification = useCallback((notif: AppNotification) => {
    setClientNotifications(prev => [notif, ...prev].slice(0, 50));
    setLatestUnread(notif);
  }, []);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const notif = createNotification(type, title, message);
    pushClientNotification(notif);
  }, [pushClientNotification]);

  const scheduleDeviceSoldNotifs = useCallback((deviceModel: string, brand: string) => {
    const intervals = [
      (5 + Math.random() * 10) * 60 * 1000,
      (25 + Math.random() * 15) * 60 * 1000,
      (50 + Math.random() * 20) * 60 * 1000,
      (120 + Math.random() * 60) * 60 * 1000,
      (300 + Math.random() * 120) * 60 * 1000,
    ];

    const count = 3 + Math.floor(Math.random() * 3);
    const selectedIntervals = intervals.slice(0, count);

    let cumulative = 0;
    selectedIntervals.forEach((interval) => {
      cumulative += interval;
      const timer = setTimeout(() => {
        const buyer = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];
        const country = COUNTRY_FLAGS[Math.floor(Math.random() * COUNTRY_FLAGS.length)];
        const title = `${country.flag} ${buyer}`;
        const message = `${brand} ${deviceModel} - 50 credits`;
        const notif = createNotification('device_sold', title, message);
        pushClientNotification(notif);
      }, cumulative);
      soldTimersRef.current.push(timer);
    });
  }, [pushClientNotification]);

  useEffect(() => {
    if (!user) {
      setClientNotifications([]);
      setLatestUnread(null);
      soldTimersRef.current.forEach(t => clearTimeout(t));
      soldTimersRef.current = [];
      prevServerCountRef.current = 0;
      return;
    }

    return () => {
      soldTimersRef.current.forEach(t => clearTimeout(t));
      soldTimersRef.current = [];
    };
  }, [user?.id]);

  const unreadCount = useMemo(() => allNotifications.filter(n => !n.isRead).length, [allNotifications]);

  const markAsRead = useCallback((id: string) => {
    if (id.startsWith('srv_')) {
      const serverId = id.replace('srv_', '');
      apiRequest('POST', `/api/notifications/${serverId}/read`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      }).catch(() => {});
    } else {
      setClientNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  }, [queryClient]);

  const markAllAsRead = useCallback(() => {
    setClientNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    apiRequest('POST', '/api/notifications/read-all').then(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }).catch(() => {});
  }, [queryClient]);

  const dismissLatest = useCallback(() => {
    setLatestUnread(null);
  }, []);

  const value = useMemo(() => ({
    notifications: allNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    latestUnread,
    dismissLatest,
    addNotification,
    scheduleDeviceSoldNotifs,
  }), [allNotifications, unreadCount, markAsRead, markAllAsRead, latestUnread, dismissLatest, addNotification, scheduleDeviceSoldNotifs]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
