import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'bn' | 'en';

interface Translations {
  [key: string]: string;
}

interface LanguageContextValue {
  t: (key: string) => string;
  currentLanguage: Language;
  toggleLanguage: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const translations: { [key in Language]: Translations } = {
  bn: {
    // Auth
    login: 'লগইন',
    register: 'রেজিস্টার',
    username: 'ব্যবহারকারীর নাম',
    password: 'পাসওয়ার্ড',
    displayName: 'প্রদর্শন নাম',
    referralCode: 'রেফারেল কোড',
    enterReferralCode: 'রেফারেল কোড প্রবেश করুন',
    loginButton: 'লগইন করুন',
    registerButton: 'রেজিস্টার করুন',
    noAccount: 'কোনো অ্যাকাউন্ট নেই?',
    haveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    loginSubtitle: 'আপনার অ্যাকাউন্টে লগইন করুন',
    registerSubtitle: 'একটি নতুন অ্যাকাউন্ট তৈরি করুন',
    enterUsername: 'ব্যবহারকারীর নাম প্রবেশ করুন',
    enterPassword: 'পাসওয়ার্ড প্রবেশ করুন',
    enterDisplayName: 'প্রদর্শন নাম প্রবেশ করুন',
    email: 'ইমেইল',
    phone: 'ফোন নম্বর',
    enterEmail: 'ইমেইল প্রবেশ করুন',
    enterPhone: 'ফোন নম্বর প্রবেশ করুন',
    loginWith: 'লগইন করুন',
    usernameEmailPhone: 'ইউজারনেম / ইমেইল / ফোন',
    optional: '(ঐচ্ছিক)',

    // Navigation/Drawer
    home: 'হোম',
    wallet: 'ওয়ালেট',
    manufacturing: 'ম্যানুফ্যাকচারিং',
    marketplace: 'মার্কেটপ্লেস',
    withdrawals: 'উত্তোলন',
    profile: 'প্রোফাইল',
    referrals: 'রেফারেল',
    logout: 'লগআউট',
    support: 'সহায়তা',
    settings: 'সেটিংস',
    language: 'ভাষা',
    drawerTitle: 'ফনক্লাউড',
    totalCredits: 'মোট ক্রেডিট',
    switchLanguage: 'ভাষা পরিবর্তন করুন',

    // Home
    welcome: 'স্বাগতম',
    welcomeBack: 'আবার স্বাগতম',
    quickActions: 'দ্রুত কাজ',
    recentActivity: 'সাম্প্রতিক কার্যকলাপ',
    totalBalance: 'মোট ভারসাম্য',
    yourDevices: 'আপনার ডিভাইস',
    viewAll: 'সবকিছু দেখুন',
    noActivity: 'কোনো কার্যকলাপ নেই',

    // Wallet
    walletTitle: 'ওয়ালেট',
    balance: 'ব্যালেন্স',
    transfer: 'স্থানান্তর',
    sendCredits: 'ক্রেডিট পাঠান',
    recipientId: 'প্রাপক আইডি',
    amount: 'পরিমাণ',
    enterAmount: 'পরিমাণ প্রবেশ করুন',
    enterRecipientId: 'প্রাপক আইডি প্রবেশ করুন',
    send: 'পাঠান',
    transactionHistory: 'লেনদেনের ইতিহাস',
    noTransactions: 'কোনো লেনদেন নেই',
    transferSuccess: 'স্থানান্তর সফল',
    insufficientBalance: 'অপর্যাপ্ত ব্যালেন্স',
    userNotFound: 'ব্যবহারকারী পাওয়া যায়নি',
    p2pTransfer: 'পিয়ার-টু-পিয়ার স্থানান্তর',
    received: 'গৃহীত',
    sent: 'পাঠানো',
    commission: 'কমিশন',
    signupBonus: 'সাইনআপ বোনাস',
    deviceSale: 'ডিভাইস বিক্রয়',
    devicePurchase: 'ডিভাইস ক্রয়',

    // Dashboard
    earningsDashboard: 'আয়ের ড্যাশবোর্ড',
    last7Days: 'গত ৭ দিন',
    totalIncome: 'মোট আয়',

    // Manufacturing
    labTitle: 'ম্যানুফ্যাকচারিং ল্যাব',
    generateDevice: 'ডিভাইস তৈরি করুন',
    selectBrand: 'ব্র্যান্ড নির্বাচন করুন',
    apple: 'অ্যাপল',
    samsung: 'স্যামসাং',
    foncloudSpecial: 'ফনক্লাউড স্পেশাল',
    generating: 'তৈরি হচ্ছে',
    assembling: 'অ্যাসেম্বলি হচ্ছে',
    deviceReady: 'ডিভাইস প্রস্তুত',
    startManufacturing: 'ম্যানুফ্যাকচারিং শুরু করুন',
    dailyManufacturing: 'আজকের ম্যানুফ্যাকচারিং',
    dailyLimitReached: 'দৈনিক সীমা পৌঁছেছে',
    noDevices: 'কোনো ডিভাইস নেই',
    deviceValue: 'ডিভাইসের মূল্য',
    listOnMarket: 'মার্কেটে তালিকাভুক্ত করুন',
    postToMarketplace: 'মার্কেটে পোস্ট করুন',
    dismiss: 'বাদ দিন',

    // Terminal log messages
    initSystem: 'সিস্টেম ইনিশিয়ালাইজ হচ্ছে... / Initializing system...',
    loadingBlueprint: 'ব্লুপ্রিন্ট লোড হচ্ছে... / Loading blueprint...',
    calibrating: 'ক্যালিব্রেটিং সেন্সরস... / Calibrating sensors...',
    assemblyStart: 'অ্যাসেম্বলি শুরু... / Assembly starting...',
    cpuInstall: 'CPU ইনস্টল করা হচ্ছে... / Installing CPU...',
    ramMount: 'RAM মাউন্ট হচ্ছে... / Mounting RAM...',
    displayAttach: 'ডিসপ্লে অ্যাটাচ হচ্ছে... / Attaching display...',
    batteryConnect: 'ব্যাটারি কানেক্ট হচ্ছে... / Connecting battery...',
    cameraInstall: 'ক্যামেরা মডিউল ইনস্টল... / Installing camera module...',
    osFlash: 'OS ফ্ল্যাশ হচ্ছে... / Flashing OS...',
    qualityCheck: 'কোয়ালিটি চেক চলছে... / Quality check in progress...',
    finalAssembly: 'ফাইনাল অ্যাসেম্বলি... / Final assembly...',
    packaging: 'প্যাকেজিং হচ্ছে... / Packaging...',
    deviceComplete: 'ডিভাইস তৈরি সম্পন্ন! / Device manufacturing complete!',

    // Marketplace
    marketTitle: 'মার্কেটপ্লেস',
    feed: 'ফিড',
    listDevice: 'ডিভাইস তালিকাভুক্ত করুন',
    price: 'মূল্য',
    setPrice: 'মূল্য নির্ধারণ করুন',
    listNow: 'এখনই তালিকাভুক্ত করুন',
    noListings: 'কোনো তালিকা নেই',
    buy: 'কিনুন',
    like: 'পছন্দ করুন',
    sold: 'বিক্রি হয়েছে',
    seller: 'বিক্রেতা',
    postedAt: 'পোস্ট করা হয়েছে',
    buyConfirm: 'ক্রয় নিশ্চিত করুন',
    purchaseSuccess: 'ক্রয় সফল',
    listedSuccess: 'সফলভাবে তালিকাভুক্ত',

    // Withdrawals
    withdrawTitle: 'উত্তোলন',
    requestWithdraw: 'উত্তোলনের অনুরোধ করুন',
    withdrawAmount: 'উত্তোলনের পরিমাণ',
    method: 'পদ্ধতি',
    bkash: 'বিকাশ',
    nagad: 'নগদ',
    bank: 'ব্যাংক',
    accountDetails: 'অ্যাকাউন্টের বিবরণ',
    enterAccountDetails: 'অ্যাকাউন্টের বিবরণ প্রবেশ করুন',
    submit: 'জমা দিন',
    history: 'ইতিহাস',
    noWithdrawals: 'কোনো উত্তোলন নেই',
    pending: 'অপেক্ষমাণ',
    success: 'সফল',
    failed: 'ব্যর্থ',
    withdrawalSubmitted: 'উত্তোলন জমা দেওয়া হয়েছে',
    minimumAmount: 'ন্যূনতম পরিমাণ',

    // Profile
    profileTitle: 'প্রোফাইল',
    userId: 'ব্যবহারকারী আইডি',
    memberSince: 'সদস্য যেহেতু',
    totalEarned: 'মোট অর্জন',
    totalReferralsLabel: 'মোট রেফারেল',
    referralCodeLabel: 'রেফারেল কোড',
    shareCode: 'কোড শেয়ার করুন',
    copyCode: 'কোড কপি করুন',
    codeCopied: 'কোড কপি করা হয়েছে',

    // Referrals
    referralTitle: 'রেফারেল',
    yourNetwork: 'আপনার নেটওয়ার্ক',
    noReferrals: 'কোনো রেফারেল নেই',
    level: 'স্তর',
    commissionHistory: 'কমিশনের ইতিহাস',
    noCommissions: 'কোনো কমিশন নেই',
    totalCommissions: 'মোট কমিশন',
    directReferrals: 'সরাসরি রেফারেল',
    networkSize: 'নেটওয়ার্ক সাইজ',
    shareLink: 'লিংক শেয়ার করুন',
    copyLink: 'লিংক কপি করুন',
    linkCopied: 'লিংক কপি হয়েছে',
    joinMessage: 'আমার রেফারেল কোড ব্যবহার করে FonCloud এ যোগ দিন',

    // Notifications
    deviceSoldOut: 'আপনার ডিভাইস বিক্রি হয়ে গেছে!',
    notificationTitle: 'FonCloud',
    notifications: 'বিজ্ঞপ্তি',
    newNotifications: 'নতুন বিজ্ঞপ্তি',
    noNotifications: 'কোনো বিজ্ঞপ্তি নেই',
    deviceSoldNotif: 'ডিভাইস বিক্রি হয়েছে',
    boughtYourDevice: 'আপনার ডিভাইস কিনেছে',

    // Common
    loading: 'লোড হচ্ছে',
    error: 'ত্রুটি',
    retry: 'পুনরায় চেষ্টা করুন',
    cancel: 'বাতিল করুন',
    confirm: 'নিশ্চিত করুন',
    save: 'সংরক্ষণ করুন',
    delete: 'মুছে ফেলুন',
    back: 'ফিরে যান',
    next: 'পরবর্তী',
    done: 'সম্পন্ন',
    credits: 'ক্রেডিট',
    close: 'বন্ধ করুন',
    search: 'অনুসন্ধান করুন',
    refresh: 'রিফ্রেশ করুন',
    tapToStart: 'শুরু করতে ট্যাপ করুন',
    comingSoon: 'শীঘ্রই আসছে',
  },
  en: {
    // Auth
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    displayName: 'Display Name',
    referralCode: 'Referral Code',
    enterReferralCode: 'Enter Referral Code',
    loginButton: 'Login',
    registerButton: 'Register',
    noAccount: 'No account yet?',
    haveAccount: 'Already have an account?',
    loginSubtitle: 'Sign in to your account',
    registerSubtitle: 'Create a new account',
    enterUsername: 'Enter username',
    enterPassword: 'Enter password',
    enterDisplayName: 'Enter display name',
    email: 'Email',
    phone: 'Phone Number',
    enterEmail: 'Enter email',
    enterPhone: 'Enter phone number',
    loginWith: 'Login',
    usernameEmailPhone: 'Username / Email / Phone',
    optional: '(optional)',

    // Navigation/Drawer
    home: 'Home',
    wallet: 'Wallet',
    manufacturing: 'Manufacturing',
    marketplace: 'Marketplace',
    withdrawals: 'Withdrawals',
    profile: 'Profile',
    referrals: 'Referrals',
    logout: 'Logout',
    support: 'Support',
    settings: 'Settings',
    language: 'Language',
    drawerTitle: 'Foncloud',
    totalCredits: 'Total Credits',
    switchLanguage: 'Switch Language',

    // Home
    welcome: 'Welcome',
    welcomeBack: 'Welcome Back',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    totalBalance: 'Total Balance',
    yourDevices: 'Your Devices',
    viewAll: 'View All',
    noActivity: 'No Activity',

    // Wallet
    walletTitle: 'Wallet',
    balance: 'Balance',
    transfer: 'Transfer',
    sendCredits: 'Send Credits',
    recipientId: 'Recipient ID',
    amount: 'Amount',
    enterAmount: 'Enter amount',
    enterRecipientId: 'Enter recipient ID',
    send: 'Send',
    transactionHistory: 'Transaction History',
    noTransactions: 'No Transactions',
    transferSuccess: 'Transfer Successful',
    insufficientBalance: 'Insufficient Balance',
    userNotFound: 'User Not Found',
    p2pTransfer: 'Peer-to-Peer Transfer',
    received: 'Received',
    sent: 'Sent',
    commission: 'Commission',
    signupBonus: 'Signup Bonus',
    deviceSale: 'Device Sale',
    devicePurchase: 'Device Purchase',

    // Dashboard
    earningsDashboard: 'Earnings Dashboard',
    last7Days: 'Last 7 Days',
    totalIncome: 'Total Income',

    // Manufacturing
    labTitle: 'Manufacturing Lab',
    generateDevice: 'Generate Device',
    selectBrand: 'Select Brand',
    apple: 'Apple',
    samsung: 'Samsung',
    foncloudSpecial: 'Foncloud Special',
    generating: 'Generating',
    assembling: 'Assembling',
    deviceReady: 'Device Ready',
    startManufacturing: 'Start Manufacturing',
    dailyManufacturing: 'Daily Manufacturing',
    dailyLimitReached: 'Daily Limit Reached',
    noDevices: 'No Devices',
    deviceValue: 'Device Value',
    listOnMarket: 'List On Market',
    postToMarketplace: 'Post to Marketplace',
    dismiss: 'Dismiss',

    // Terminal log messages
    initSystem: 'সিস্টেম ইনিশিয়ালাইজ হচ্ছে... / Initializing system...',
    loadingBlueprint: 'ব্লুপ্রিন্ট লোড হচ্ছে... / Loading blueprint...',
    calibrating: 'ক্যালিব্রেটিং সেন্সরস... / Calibrating sensors...',
    assemblyStart: 'অ্যাসেম্বলি শুরু... / Assembly starting...',
    cpuInstall: 'CPU ইনস্টল করা হচ্ছে... / Installing CPU...',
    ramMount: 'RAM মাউন্ট হচ্ছে... / Mounting RAM...',
    displayAttach: 'ডিসপ্লে অ্যাটাচ হচ্ছে... / Attaching display...',
    batteryConnect: 'ব্যাটারি কানেক্ট হচ্ছে... / Connecting battery...',
    cameraInstall: 'ক্যামেরা মডিউল ইনস্টল... / Installing camera module...',
    osFlash: 'OS ফ্ল্যাশ হচ্ছে... / Flashing OS...',
    qualityCheck: 'কোয়ালিটি চেক চলছে... / Quality check in progress...',
    finalAssembly: 'ফাইনাল অ্যাসেম্বলি... / Final assembly...',
    packaging: 'প্যাকেজিং হচ্ছে... / Packaging...',
    deviceComplete: 'ডিভাইস তৈরি সম্পন্ন! / Device manufacturing complete!',

    // Marketplace
    marketTitle: 'Marketplace',
    feed: 'Feed',
    listDevice: 'List Device',
    price: 'Price',
    setPrice: 'Set Price',
    listNow: 'List Now',
    noListings: 'No Listings',
    buy: 'Buy',
    like: 'Like',
    sold: 'Sold',
    seller: 'Seller',
    postedAt: 'Posted At',
    buyConfirm: 'Confirm Purchase',
    purchaseSuccess: 'Purchase Successful',
    listedSuccess: 'Listed Successfully',

    // Withdrawals
    withdrawTitle: 'Withdrawals',
    requestWithdraw: 'Request Withdrawal',
    withdrawAmount: 'Withdrawal Amount',
    method: 'Method',
    bkash: 'bKash',
    nagad: 'Nagad',
    bank: 'Bank',
    accountDetails: 'Account Details',
    enterAccountDetails: 'Enter account details',
    submit: 'Submit',
    history: 'History',
    noWithdrawals: 'No Withdrawals',
    pending: 'Pending',
    success: 'Success',
    failed: 'Failed',
    withdrawalSubmitted: 'Withdrawal Submitted',
    minimumAmount: 'Minimum Amount',

    // Profile
    profileTitle: 'Profile',
    userId: 'User ID',
    memberSince: 'Member Since',
    totalEarned: 'Total Earned',
    totalReferralsLabel: 'Total Referrals',
    referralCodeLabel: 'Referral Code',
    shareCode: 'Share Code',
    copyCode: 'Copy Code',
    codeCopied: 'Code Copied',

    // Referrals
    referralTitle: 'Referrals',
    yourNetwork: 'Your Network',
    noReferrals: 'No Referrals',
    level: 'Level',
    commissionHistory: 'Commission History',
    noCommissions: 'No Commissions',
    totalCommissions: 'Total Commissions',
    directReferrals: 'Direct Referrals',
    networkSize: 'Network Size',
    shareLink: 'Share Link',
    copyLink: 'Copy Link',
    linkCopied: 'Link Copied',
    joinMessage: 'Join FonCloud using my referral code',

    // Notifications
    deviceSoldOut: 'Your device sold out!',
    notificationTitle: 'FonCloud',
    notifications: 'Notifications',
    newNotifications: 'new notifications',
    noNotifications: 'No notifications yet',
    deviceSoldNotif: 'Device Sold',
    boughtYourDevice: 'bought your device',

    // Common
    loading: 'Loading',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    credits: 'Credits',
    close: 'Close',
    search: 'Search',
    refresh: 'Refresh',
    tapToStart: 'Tap to Start',
    comingSoon: 'Coming Soon',
  },
};

const LANGUAGE_KEY = 'foncloud_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('bn');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language from AsyncStorage
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage && (savedLanguage === 'bn' || savedLanguage === 'en')) {
          setCurrentLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[currentLanguage][key] || translations['en'][key] || key;
    },
    [currentLanguage],
  );

  const toggleLanguage = useCallback(async () => {
    const newLanguage = currentLanguage === 'bn' ? 'en' : 'bn';
    setCurrentLanguage(newLanguage);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, [currentLanguage]);

  const setLanguage = useCallback(
    async (lang: Language) => {
      setCurrentLanguage(lang);
      try {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      t,
      currentLanguage,
      toggleLanguage,
      setLanguage,
    }),
    [t, currentLanguage, toggleLanguage, setLanguage],
  );

  if (!isInitialized) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
