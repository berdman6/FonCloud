import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing, interpolate, cancelAnimation } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { NeonButton } from '@/components/NeonButton';
import { apiRequest, queryClient } from '@/lib/query-client';
import Colors from '@/constants/colors';

const TIMER_DURATION = 300;
const CIRCLE_SIZE = 180;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TERMINAL_MESSAGES = [
  'initSystem', 'loadingBlueprint', 'calibrating', 'assemblyStart',
  'cpuInstall', 'ramMount', 'displayAttach', 'batteryConnect',
  'cameraInstall', 'osFlash', 'qualityCheck', 'finalAssembly',
  'packaging', 'deviceComplete',
];

const BRANDS = [
  { id: 'Apple', icon: 'logo-apple', label: 'Apple', iconType: 'ionicons' },
  { id: 'Samsung', icon: 'cellphone', label: 'Samsung', iconType: 'material' },
  { id: 'FonCloud Special', icon: 'star-four-points', label: 'FonCloud Special', iconType: 'material' },
];

interface TerminalLine {
  id: string;
  text: string;
  type: 'info' | 'success' | 'process';
}

function AnimatedDeviceCard({ device, index }: { device: any; index: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [20, 0]) }],
  }));

  return (
    <Animated.View style={animStyle}>
      <GlowCard style={styles.deviceCard}>
        <View style={styles.deviceRow}>
          <View style={styles.deviceIconWrap}>
            {device.brand === 'Apple' ? (
              <Ionicons name="logo-apple" size={22} color={Colors.dark.primary} />
            ) : device.brand === 'Samsung' ? (
              <MaterialCommunityIcons name="cellphone" size={22} color={Colors.dark.primary} />
            ) : (
              <MaterialCommunityIcons name="star-four-points" size={22} color={Colors.dark.primary} />
            )}
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceModel}>{device.model}</Text>
            <Text style={styles.deviceBrand}>{device.brand}</Text>
          </View>
          <View style={styles.deviceValueWrap}>
            <Text style={styles.deviceValue}>{Number(device.value).toFixed(0)}</Text>
            <Text style={styles.deviceValueLabel}>credits</Text>
          </View>
        </View>
      </GlowCard>
    </Animated.View>
  );
}

export default function ManufacturingScreen() {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { t } = useLanguage();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const terminalRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseAnim = useSharedValue(0);

  const { data: devices, refetch } = useQuery<any[]>({
    queryKey: ['/api/manufacturing/devices'],
  });

  const generateMutation = useMutation({
    mutationFn: async (brand: string) => {
      const res = await apiRequest('POST', '/api/manufacturing/generate', { brand });
      return res.json();
    },
    onSuccess: (data) => {
      refreshUser();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
    },
    onError: (err: any) => {
      setIsGenerating(false);
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, []);

  const addTerminalLine = (key: string, type: TerminalLine['type'] = 'process') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const text = t(key);
    setTerminalLines(prev => [...prev, { id, text, type }]);
  };

  const startGeneration = () => {
    if (!selectedBrand) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setIsGenerating(true);
    setTimeLeft(TIMER_DURATION);
    setTerminalLines([]);

    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ), -1, true
    );

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setTimeLeft(TIMER_DURATION - elapsed);
      if (elapsed >= TIMER_DURATION) {
        if (timerRef.current) clearInterval(timerRef.current);
        cancelAnimation(pulseAnim);
        pulseAnim.value = 0;
        generateMutation.mutate(selectedBrand);
        setIsGenerating(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);

    const msgInterval = (TIMER_DURATION * 1000) / TERMINAL_MESSAGES.length;
    TERMINAL_MESSAGES.forEach((msg, idx) => {
      msgTimerRef.current = setTimeout(() => {
        const type = idx === TERMINAL_MESSAGES.length - 1 ? 'success' : idx === 0 ? 'info' : 'process';
        addTerminalLine(msg, type);
      }, idx * msgInterval);
    });
  };

  const progress = isGenerating ? (TIMER_DURATION - timeLeft) / TIMER_DURATION : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pulseAnim.value, [0, 1], [0.1, 0.5]),
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
    >
      <Text style={styles.sectionTitle}>{t('selectBrand')}</Text>
      <View style={styles.brandRow}>
        {BRANDS.map((brand) => (
          <Pressable
            key={brand.id}
            onPress={() => !isGenerating && setSelectedBrand(brand.id)}
            style={[
              styles.brandCard,
              selectedBrand === brand.id && styles.brandCardSelected,
              isGenerating && { opacity: 0.5 },
            ]}
          >
            {brand.iconType === 'ionicons' ? (
              <Ionicons name={brand.icon as any} size={28} color={selectedBrand === brand.id ? Colors.dark.primary : Colors.dark.textSecondary} />
            ) : (
              <MaterialCommunityIcons name={brand.icon as any} size={28} color={selectedBrand === brand.id ? Colors.dark.primary : Colors.dark.textSecondary} />
            )}
            <Text style={[styles.brandLabel, selectedBrand === brand.id && { color: Colors.dark.primary }]}>{brand.label}</Text>
          </Pressable>
        ))}
      </View>

      {isGenerating ? (
        <Animated.View style={glowStyle}>
          <GlowCard style={styles.timerCard} glowColor={Colors.dark.primary}>
            <View style={styles.timerContainer}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={Colors.dark.cardBorder} strokeWidth={STROKE_WIDTH} fill="none" />
                <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke={Colors.dark.primary} strokeWidth={STROKE_WIDTH} fill="none" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset} strokeLinecap="round" />
              </Svg>
              <View style={styles.timerCenter}>
                <Text style={styles.timerText}>{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}</Text>
                <Text style={styles.timerLabel}>{t('assembling')}</Text>
              </View>
            </View>
          </GlowCard>
        </Animated.View>
      ) : (
        <NeonButton
          title={t('startManufacturing')}
          onPress={startGeneration}
          disabled={!selectedBrand}
          icon={<MaterialCommunityIcons name="factory" size={20} color={!selectedBrand ? Colors.dark.textMuted : '#050505'} />}
          style={{ marginVertical: 16 }}
        />
      )}

      {terminalLines.length > 0 && (
        <GlowCard style={styles.terminalCard}>
          <View style={styles.terminalHeader}>
            <View style={styles.terminalDot} />
            <View style={[styles.terminalDot, { backgroundColor: Colors.dark.warning }]} />
            <View style={[styles.terminalDot, { backgroundColor: Colors.dark.success }]} />
            <Text style={styles.terminalTitle}>ASSEMBLY LOG</Text>
          </View>
          <ScrollView
            ref={terminalRef}
            style={styles.terminalBody}
            onContentSizeChange={() => terminalRef.current?.scrollToEnd({ animated: true })}
          >
            {terminalLines.map((line) => (
              <Text
                key={line.id}
                style={[
                  styles.terminalLine,
                  line.type === 'success' && { color: Colors.dark.success },
                  line.type === 'info' && { color: Colors.dark.accent },
                ]}
              >
                {line.type === 'success' ? '[OK] ' : line.type === 'info' ? '[>>] ' : '[..] '}
                {line.text}
              </Text>
            ))}
            <Text style={styles.terminalCursor}>_</Text>
          </ScrollView>
        </GlowCard>
      )}

      <View style={styles.devicesHeader}>
        <Text style={styles.sectionTitle}>{t('yourDevices')}</Text>
        <Text style={styles.deviceCount}>{devices?.length || 0}</Text>
      </View>

      {(!devices || devices.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <MaterialCommunityIcons name="phone-outline" size={32} color={Colors.dark.textMuted} />
          <Text style={styles.emptyText}>{t('noDevices')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.devicesList}>
          {devices.map((device: any, idx: number) => (
            <AnimatedDeviceCard key={device.id} device={device} index={idx} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  brandRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  brandCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  brandCardSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryDim,
  },
  brandLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani_500Medium',
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  timerCard: {
    padding: 24,
    alignItems: 'center',
    marginVertical: 16,
  },
  timerContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 36,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
  },
  timerLabel: {
    fontSize: 12,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  terminalCard: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.divider,
  },
  terminalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.danger,
  },
  terminalTitle: {
    fontSize: 11,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.textMuted,
    marginLeft: 8,
    letterSpacing: 2,
  },
  terminalBody: {
    padding: 14,
    maxHeight: 220,
  },
  terminalLine: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  terminalCursor: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    color: Colors.dark.primary,
    marginTop: 4,
  },
  devicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceCount: {
    fontSize: 14,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  devicesList: {
    gap: 8,
  },
  deviceCard: {
    padding: 14,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceModel: {
    fontSize: 14,
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.text,
  },
  deviceBrand: {
    fontSize: 12,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
  deviceValueWrap: {
    alignItems: 'flex-end',
  },
  deviceValue: {
    fontSize: 18,
    fontFamily: 'Rajdhani_700Bold',
    color: Colors.dark.primary,
  },
  deviceValueLabel: {
    fontSize: 10,
    fontFamily: 'Rajdhani_400Regular',
    color: Colors.dark.textMuted,
  },
});
