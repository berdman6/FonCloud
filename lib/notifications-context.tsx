import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useAuth } from './auth-context';

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

const DEVICE_MODELS = [
  'iPhone 15 Pro', 'iPhone 16', 'Galaxy S24 Ultra', 'Galaxy Z Fold 5',
  'FonCloud X1', 'FonCloud Pro Max', 'iPhone 14', 'Galaxy A54',
  'FonCloud Lite', 'iPhone 15', 'Galaxy S23', 'FonCloud Special Edition',
];

const BRANDS = ['Apple', 'Samsung', 'FonCloud Special'];

export interface AppNotification {
  id: string;
  buyerName: string;
  countryFlag: string;
  countryName: string;
  deviceModel: string;
  brand: string;
  price: number;
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
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function generateNotification(): AppNotification {
  const buyer = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)];
  const country = COUNTRY_FLAGS[Math.floor(Math.random() * COUNTRY_FLAGS.length)];
  const model = DEVICE_MODELS[Math.floor(Math.random() * DEVICE_MODELS.length)];
  const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    buyerName: buyer,
    countryFlag: country.flag,
    countryName: country.name,
    deviceModel: model,
    brand,
    price: 50,
    isRead: false,
    createdAt: new Date(),
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestUnread, setLatestUnread] = useState<AppNotification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLatestUnread(null);
      return;
    }

    const scheduleNext = () => {
      const delay = 30000 + Math.random() * 90000;
      timerRef.current = setTimeout(() => {
        const notif = generateNotification();
        setNotifications(prev => [notif, ...prev].slice(0, 50));
        setLatestUnread(notif);
        scheduleNext();
      }, delay);
    };

    const initialDelay = setTimeout(() => {
      const notif = generateNotification();
      setNotifications(prev => [notif, ...prev]);
      setLatestUnread(notif);
      scheduleNext();
    }, 8000);

    return () => {
      clearTimeout(initialDelay);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.id]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const dismissLatest = useCallback(() => {
    setLatestUnread(null);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    latestUnread,
    dismissLatest,
  }), [notifications, unreadCount, markAsRead, markAllAsRead, latestUnread, dismissLatest]);

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
