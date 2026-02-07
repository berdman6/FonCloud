import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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
import Svg, { Circle, Rect, Line, Path, Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, G, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

const AnimatedView = Animated.View;

function FloatingChip({ delay, size, x, y, icon }: { delay: number; size: number; x: number; y: number; icon: string }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.2, { duration: 2000 })
      ),
      -1, true
    ));
    drift.value = withDelay(delay, withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -16]) },
      { translateX: interpolate(drift.value, [0, 1], [-6, 6]) },
      { rotate: `${interpolate(progress.value, [0, 1], [-15, 15])}deg` },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.85, 1.15, 0.85]) },
    ],
    opacity: opacity.value,
  }));

  return (
    <AnimatedView style={[{ position: 'absolute', left: x, top: y }, animStyle]}>
      <View style={[styles.chip, { width: size, height: size, borderRadius: size * 0.3 }]}>
        <MaterialCommunityIcons name={icon as any} size={size * 0.55} color="#FFFFFF" />
      </View>
    </AnimatedView>
  );
}

function ScanLine({ size }: { size: number }) {
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    top: interpolate(sweep.value, [0, 1], [size * 0.2, size * 0.8]),
    opacity: interpolate(sweep.value, [0, 0.2, 0.5, 0.8, 1], [0, 0.6, 0.3, 0.6, 0]),
  }));

  return (
    <AnimatedView style={[styles.scanLine, { width: size * 0.5, left: size * 0.25 }, lineStyle]} />
  );
}

export function PortalAnimation({ size = 200 }: { size?: number }) {
  const outerRot = useSharedValue(0);
  const midRot = useSharedValue(0);
  const innerRot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const corePulse = useSharedValue(0);
  const arcSweep = useSharedValue(0);

  useEffect(() => {
    outerRot.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1, false
    );
    midRot.value = withRepeat(
      withTiming(-360, { duration: 8000, easing: Easing.linear }),
      -1, false
    );
    innerRot.value = withRepeat(
      withTiming(360, { duration: 5000, easing: Easing.linear }),
      -1, false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    corePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    arcSweep.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${outerRot.value}deg` },
      { scale: interpolate(pulse.value, [0, 1], [0.97, 1.03]) },
    ],
  }));

  const midStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${midRot.value}deg` }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${innerRot.value}deg` },
      { scale: interpolate(corePulse.value, [0, 1], [0.95, 1.08]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.45]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.2]) }],
  }));

  const coreGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(corePulse.value, [0, 1], [0.4, 0.9]),
    transform: [{ scale: interpolate(corePulse.value, [0, 1], [0.9, 1.1]) }],
  }));

  const half = size / 2;
  const outerR = half - 4;
  const midR = half * 0.72;
  const innerR = half * 0.48;
  const coreR = half * 0.3;

  const makeTickMarks = (radius: number, count: number, len: number) => {
    const lines = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360;
      const rad = (angle * Math.PI) / 180;
      const x1 = half + Math.cos(rad) * (radius - len);
      const y1 = half + Math.sin(rad) * (radius - len);
      const x2 = half + Math.cos(rad) * radius;
      const y2 = half + Math.sin(rad) * radius;
      lines.push(
        <Line
          key={`tick-${i}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#5B8C3E"
          strokeWidth={i % 5 === 0 ? 2 : 0.8}
          strokeOpacity={i % 5 === 0 ? 0.7 : 0.3}
        />
      );
    }
    return lines;
  };

  const makeArcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <AnimatedView style={[styles.outerGlow, {
        width: size * 1.5, height: size * 1.5,
        borderRadius: size * 0.75,
        top: -size * 0.25, left: -size * 0.25,
      }, glowStyle]} />

      <AnimatedView style={outerStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#5B8C3E" stopOpacity="0.15" />
              <Stop offset="50%" stopColor="#5B8C3E" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#5B8C3E" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={half} cy={half} r={outerR} fill="url(#bgGrad)" />
          <Circle cx={half} cy={half} r={outerR} stroke="#5B8C3E" strokeWidth={2.5} fill="none" strokeOpacity={0.5} />
          <Circle cx={half} cy={half} r={outerR - 3} stroke="#5B8C3E" strokeWidth={0.5} fill="none" strokeOpacity={0.2} />
          {makeTickMarks(outerR - 1, 60, 5)}
          <Path d={makeArcPath(half, half, outerR - 8, 0, 90)} stroke="#F5A623" strokeWidth={2} fill="none" strokeOpacity={0.6} strokeLinecap="round" />
          <Path d={makeArcPath(half, half, outerR - 8, 180, 250)} stroke="#F5A623" strokeWidth={2} fill="none" strokeOpacity={0.4} strokeLinecap="round" />
        </Svg>
      </AnimatedView>

      <AnimatedView style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, midStyle]}>
        <Svg width={size * 0.78} height={size * 0.78} viewBox={`0 0 ${size * 0.78} ${size * 0.78}`}>
          <Circle cx={size * 0.39} cy={size * 0.39} r={midR} stroke="#5B8C3E" strokeWidth={1.5} fill="none" strokeOpacity={0.4} strokeDasharray="3 6" />
          <Circle cx={size * 0.39} cy={size * 0.39} r={midR - 6} stroke="#5B8C3E" strokeWidth={0.8} fill="none" strokeOpacity={0.2} strokeDasharray="12 4 2 4" />
          <Path d={makeArcPath(size * 0.39, size * 0.39, midR + 2, 30, 120)} stroke="#FFFFFF" strokeWidth={2.5} fill="none" strokeOpacity={0.15} strokeLinecap="round" />
          <Path d={makeArcPath(size * 0.39, size * 0.39, midR + 2, 210, 300)} stroke="#FFFFFF" strokeWidth={2.5} fill="none" strokeOpacity={0.15} strokeLinecap="round" />
        </Svg>
      </AnimatedView>

      <AnimatedView style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, innerStyle]}>
        <Svg width={size * 0.55} height={size * 0.55} viewBox={`0 0 ${size * 0.55} ${size * 0.55}`}>
          <Circle cx={size * 0.275} cy={size * 0.275} r={innerR} stroke="#5B8C3E" strokeWidth={1} fill="none" strokeOpacity={0.5} strokeDasharray="6 3" />
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const cx = size * 0.275 + Math.cos(rad) * innerR;
            const cy = size * 0.275 + Math.sin(rad) * innerR;
            return (
              <Circle key={`node-${angle}`} cx={cx} cy={cy} r={3} fill="#F5A623" fillOpacity={0.8} />
            );
          })}
        </Svg>
      </AnimatedView>

      <ScanLine size={size} />

      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <AnimatedView style={coreGlowStyle}>
          <View style={[styles.coreOuter, { width: coreR * 2 + 8, height: coreR * 2 + 8, borderRadius: coreR + 4 }]}>
            <LinearGradient
              colors={['#5B8C3E', '#3D6B28']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.coreGradient, { width: coreR * 2, height: coreR * 2, borderRadius: coreR }]}
            >
              <MaterialCommunityIcons name="cellphone-link" size={coreR * 0.9} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </AnimatedView>
      </View>

      <FloatingChip delay={0} size={size * 0.16} x={size * 0.02} y={size * 0.18} icon="cellphone" />
      <FloatingChip delay={600} size={size * 0.13} x={size * 0.78} y={size * 0.12} icon="laptop" />
      <FloatingChip delay={1200} size={size * 0.15} x={size * 0.8} y={size * 0.68} icon="tablet" />
      <FloatingChip delay={1800} size={size * 0.12} x={size * 0.08} y={size * 0.72} icon="watch-variant" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(91, 140, 62, 0.08)',
  },
  chip: {
    backgroundColor: 'rgba(91, 140, 62, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B8C3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  scanLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#5B8C3E',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to right, transparent, #5B8C3E, transparent)',
        backgroundColor: 'transparent',
      },
      default: {},
    }),
  },
  coreOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91, 140, 62, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(91, 140, 62, 0.3)',
  },
  coreGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B8C3E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
});
