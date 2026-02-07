import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import Colors from '@/constants/colors';

const AnimatedView = Animated.View;

function FloatingOrb({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1, true
    ));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -20]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.8, 1.1, 0.8]) },
    ],
    opacity: opacity.value,
  }));

  return (
    <AnimatedView style={[{ position: 'absolute', left: x, top: y }, animStyle]}>
      <View style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]} />
    </AnimatedView>
  );
}

export function PortalAnimation({ size = 200 }: { size?: number }) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const innerRotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1, false
    );
    innerRotation.value = withRepeat(
      withTiming(-360, { duration: 6000, easing: Easing.linear }),
      -1, false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]) },
    ],
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${innerRotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.15]) }],
  }));

  const half = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <AnimatedView style={[styles.glow, { width: size * 1.4, height: size * 1.4, borderRadius: size * 0.7 }, glowStyle]} />

      <AnimatedView style={outerRingStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="portalGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={Colors.dark.primary} stopOpacity="0.4" />
              <Stop offset="70%" stopColor={Colors.dark.primary} stopOpacity="0.1" />
              <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={half} cy={half} r={half - 4} fill="url(#portalGrad)" />
          <Circle cx={half} cy={half} r={half - 4} stroke={Colors.dark.primary} strokeWidth={2} fill="none" strokeOpacity={0.6} />
          <Circle cx={half} cy={half} r={half - 15} stroke={Colors.dark.primary} strokeWidth={1} fill="none" strokeOpacity={0.3} strokeDasharray="8 12" />
        </Svg>
      </AnimatedView>

      <AnimatedView style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, innerRingStyle]}>
        <Svg width={size * 0.6} height={size * 0.6} viewBox={`0 0 ${size * 0.6} ${size * 0.6}`}>
          <Circle cx={size * 0.3} cy={size * 0.3} r={size * 0.28} stroke={Colors.dark.accent} strokeWidth={1.5} fill="none" strokeOpacity={0.5} strokeDasharray="4 8" />
        </Svg>
      </AnimatedView>

      <FloatingOrb delay={0} size={8} x={size * 0.15} y={size * 0.2} />
      <FloatingOrb delay={500} size={6} x={size * 0.7} y={size * 0.15} />
      <FloatingOrb delay={1000} size={10} x={size * 0.8} y={size * 0.6} />
      <FloatingOrb delay={1500} size={5} x={size * 0.25} y={size * 0.75} />
      <FloatingOrb delay={800} size={7} x={size * 0.5} y={size * 0.1} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.dark.primaryGlow,
  },
  orb: {
    backgroundColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});
