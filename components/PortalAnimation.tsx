import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
import Svg, { Circle, Line, Path, Defs, RadialGradient, Stop, Ellipse, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

const AnimatedView = Animated.View;

function FloatingCoin({
  delay,
  size,
  x,
  y,
  children,
  orbitRange = 16,
  driftRange = 6,
  duration = 4000,
}: {
  delay: number;
  size: number;
  x: number;
  y: number;
  children: React.ReactNode;
  orbitRange?: number;
  driftRange?: number;
  duration?: number;
}) {
  const progress = useSharedValue(0);
  const drift = useSharedValue(0);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    drift.value = withDelay(
      delay + 200,
      withRepeat(
        withTiming(1, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    rotateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(15, { duration: duration * 0.5 }),
          withTiming(-15, { duration: duration * 0.5 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -orbitRange]) },
      { translateX: interpolate(drift.value, [0, 1], [-driftRange, driftRange]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.92, 1.1, 0.92]) },
    ],
    opacity: interpolate(progress.value, [0, 0.3, 0.7, 1], [0.7, 1, 1, 0.7]),
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.3, 0.15, 0.3]),
    transform: [
      { scaleX: interpolate(progress.value, [0, 0.5, 1], [1, 1.3, 1]) },
      { scaleY: 0.3 },
    ],
  }));

  return (
    <AnimatedView style={[{ position: 'absolute', left: x, top: y, alignItems: 'center' }, animStyle]}>
      <View style={[styles.coinOuter, { width: size, height: size, borderRadius: size / 2 }]}>
        <LinearGradient
          colors={['#6FA04A', '#3D6B28', '#2B4E1A']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.coinFace, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
        >
          {children}
        </LinearGradient>
      </View>
      <AnimatedView
        style={[
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            backgroundColor: 'rgba(0,0,0,0.12)',
            marginTop: 4,
          },
          shadowStyle,
        ]}
      />
    </AnimatedView>
  );
}

function PortalSteps({ size }: { size: number }) {
  const stepW = size * 0.55;
  const stepH = size * 0.06;
  const gap = size * 0.015;

  return (
    <View style={[styles.stepsContainer, { width: stepW, top: size * 0.82 }]}>
      {[0, 1, 2].map((i) => {
        const w = stepW - i * stepW * 0.18;
        return (
          <View key={i} style={{ alignItems: 'center', marginBottom: gap }}>
            <View
              style={[
                styles.stepTop,
                {
                  width: w,
                  height: stepH * 0.5,
                },
              ]}
            />
            <View
              style={[
                styles.stepFront,
                {
                  width: w,
                  height: stepH,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

function ScanLine({ size }: { size: number }) {
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    top: interpolate(sweep.value, [0, 1], [size * 0.2, size * 0.75]),
    opacity: interpolate(sweep.value, [0, 0.2, 0.5, 0.8, 1], [0, 0.4, 0.2, 0.4, 0]),
  }));

  return (
    <AnimatedView style={[styles.scanLine, { width: size * 0.45, left: size * 0.275 }, lineStyle]} />
  );
}

function SmallDot({ delay, x, y, dotSize }: { delay: number; x: number; y: number; dotSize: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <AnimatedView
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: '#5B8C3E',
        },
        animStyle,
      ]}
    />
  );
}

export function PortalAnimation({ size = 200 }: { size?: number }) {
  const outerRot = useSharedValue(0);
  const midRot = useSharedValue(0);
  const innerRot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const corePulse = useSharedValue(0);

  useEffect(() => {
    outerRot.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    midRot.value = withRepeat(
      withTiming(-360, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );
    innerRot.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    corePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${outerRot.value}deg` },
      { scale: interpolate(pulse.value, [0, 1], [0.98, 1.02]) },
    ],
  }));

  const midStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${midRot.value}deg` }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${innerRot.value}deg` },
      { scale: interpolate(corePulse.value, [0, 1], [0.96, 1.06]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.12, 0.35]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.92, 1.15]) }],
  }));

  const portalDepthStyle = useAnimatedStyle(() => ({
    opacity: interpolate(corePulse.value, [0, 1], [0.7, 1]),
    transform: [{ scale: interpolate(corePulse.value, [0, 1], [0.97, 1.03]) }],
  }));

  const half = size / 2;
  const outerR = half - 6;
  const midR = half * 0.7;
  const innerR = half * 0.46;

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
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#5B8C3E"
          strokeWidth={i % 5 === 0 ? 2 : 0.7}
          strokeOpacity={i % 5 === 0 ? 0.6 : 0.2}
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

  const totalHeight = size * 1.15;
  const coinSize1 = size * 0.22;
  const coinSize2 = size * 0.18;
  const coinSize3 = size * 0.16;

  return (
    <View style={[styles.container, { width: size * 1.3, height: totalHeight }]}>
      <AnimatedView
        style={[
          styles.outerGlow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            top: (totalHeight - size * 1.4) / 2 - size * 0.08,
            left: (size * 1.3 - size * 1.4) / 2,
          },
          glowStyle,
        ]}
      />

      <View style={{ position: 'absolute', left: (size * 1.3 - size) / 2, top: 0 }}>
        <AnimatedView style={outerStyle}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id="portalBg" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#2B4E1A" stopOpacity="0.9" />
                <Stop offset="40%" stopColor="#1A3A10" stopOpacity="0.95" />
                <Stop offset="70%" stopColor="#0F2A08" stopOpacity="0.85" />
                <Stop offset="100%" stopColor="#5B8C3E" stopOpacity="0.15" />
              </RadialGradient>
            </Defs>

            <Circle cx={half} cy={half} r={outerR} fill="url(#portalBg)" />

            <Circle cx={half} cy={half} r={outerR} stroke="rgba(91,140,62,0.4)" strokeWidth={3} fill="none" />
            <Circle cx={half} cy={half} r={outerR + 2} stroke="rgba(91,140,62,0.15)" strokeWidth={1} fill="none" />
            <Circle cx={half} cy={half} r={outerR - 4} stroke="rgba(91,140,62,0.12)" strokeWidth={0.5} fill="none" />

            {makeTickMarks(outerR - 1, 72, 5)}

            <Path
              d={makeArcPath(half, half, outerR - 9, 0, 80)}
              stroke="#F5A623"
              strokeWidth={2.5}
              fill="none"
              strokeOpacity={0.6}
              strokeLinecap="round"
            />
            <Path
              d={makeArcPath(half, half, outerR - 9, 160, 230)}
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="none"
              strokeOpacity={0.15}
              strokeLinecap="round"
            />
            <Path
              d={makeArcPath(half, half, outerR - 9, 280, 340)}
              stroke="#F5A623"
              strokeWidth={1.5}
              fill="none"
              strokeOpacity={0.35}
              strokeLinecap="round"
            />

            {[30, 100, 200, 310].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const cx = half + Math.cos(rad) * (outerR - 14);
              const cy = half + Math.sin(rad) * (outerR - 14);
              return (
                <Rect
                  key={`seg-${angle}`}
                  x={cx - 3}
                  y={cy - 1}
                  width={6}
                  height={2}
                  fill="#5B8C3E"
                  fillOpacity={0.5}
                  rx={1}
                />
              );
            })}
          </Svg>
        </AnimatedView>

        <AnimatedView
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, midStyle]}
        >
          <Svg width={size * 0.76} height={size * 0.76} viewBox={`0 0 ${size * 0.76} ${size * 0.76}`}>
            <Circle
              cx={size * 0.38}
              cy={size * 0.38}
              r={midR}
              stroke="#5B8C3E"
              strokeWidth={1.5}
              fill="none"
              strokeOpacity={0.35}
              strokeDasharray="4 8"
            />
            <Circle
              cx={size * 0.38}
              cy={size * 0.38}
              r={midR - 7}
              stroke="#5B8C3E"
              strokeWidth={0.7}
              fill="none"
              strokeOpacity={0.18}
              strokeDasharray="14 4 2 4"
            />
            <Path
              d={makeArcPath(size * 0.38, size * 0.38, midR + 2, 20, 110)}
              stroke="#FFFFFF"
              strokeWidth={2.5}
              fill="none"
              strokeOpacity={0.12}
              strokeLinecap="round"
            />
            <Path
              d={makeArcPath(size * 0.38, size * 0.38, midR + 2, 200, 290)}
              stroke="#FFFFFF"
              strokeWidth={2.5}
              fill="none"
              strokeOpacity={0.1}
              strokeLinecap="round"
            />
          </Svg>
        </AnimatedView>

        <AnimatedView
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, innerStyle]}
        >
          <Svg width={size * 0.52} height={size * 0.52} viewBox={`0 0 ${size * 0.52} ${size * 0.52}`}>
            <Circle
              cx={size * 0.26}
              cy={size * 0.26}
              r={innerR}
              stroke="#5B8C3E"
              strokeWidth={1}
              fill="none"
              strokeOpacity={0.4}
              strokeDasharray="6 4"
            />
            {[0, 72, 144, 216, 288].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const cx = size * 0.26 + Math.cos(rad) * innerR;
              const cy = size * 0.26 + Math.sin(rad) * innerR;
              return (
                <Circle key={`inode-${angle}`} cx={cx} cy={cy} r={2.5} fill="#F5A623" fillOpacity={0.7} />
              );
            })}
          </Svg>
        </AnimatedView>

        <ScanLine size={size} />

        <AnimatedView
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, portalDepthStyle]}
        >
          <LinearGradient
            colors={['#1A4A0F', '#0A2A06', '#051505']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.portalCenter, { width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19 }]}
          >
            <View style={[styles.portalInnerGlow, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16 }]}>
              <View style={[styles.portalHighlight, { width: size * 0.18, height: size * 0.12, borderRadius: size * 0.06, top: size * 0.03 }]} />
            </View>
          </LinearGradient>
        </AnimatedView>
      </View>

      <PortalSteps size={size} />

      <FloatingCoin
        delay={0}
        size={coinSize1}
        x={size * 0.75}
        y={size * 0.22}
        orbitRange={14}
        driftRange={5}
        duration={4200}
      >
        <Ionicons name="phone-portrait" size={coinSize1 * 0.45} color="#FFFFFF" />
      </FloatingCoin>

      <FloatingCoin
        delay={800}
        size={coinSize2}
        x={size * 0.82}
        y={size * 0.55}
        orbitRange={12}
        driftRange={7}
        duration={3800}
      >
        <Text style={[styles.coinText, { fontSize: coinSize2 * 0.3 }]}>BDTK</Text>
      </FloatingCoin>

      <FloatingCoin
        delay={400}
        size={coinSize3}
        x={size * 0.02}
        y={size * 0.35}
        orbitRange={10}
        driftRange={4}
        duration={4500}
      >
        <Text style={[styles.logoText, { fontSize: coinSize3 * 0.35 }]}>FC</Text>
      </FloatingCoin>

      <SmallDot delay={0} x={size * 0.1} y={size * 0.15} dotSize={4} />
      <SmallDot delay={500} x={size * 1.05} y={size * 0.3} dotSize={3} />
      <SmallDot delay={1000} x={size * 0.05} y={size * 0.65} dotSize={5} />
      <SmallDot delay={1500} x={size * 1.1} y={size * 0.7} dotSize={3.5} />
      <SmallDot delay={700} x={size * 0.55} y={size * 0.02} dotSize={4} />
      <SmallDot delay={1200} x={size * 0.9} y={size * 0.05} dotSize={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(91, 140, 62, 0.06)',
  },
  portalCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(91, 140, 62, 0.3)',
    shadowColor: '#0A2A06',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  portalInnerGlow: {
    backgroundColor: 'rgba(91, 140, 62, 0.08)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  portalHighlight: {
    position: 'absolute',
    backgroundColor: 'rgba(91, 140, 62, 0.12)',
  },
  coinOuter: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3D6B28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  coinFace: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  coinText: {
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logoText: {
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  stepsContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
  stepTop: {
    backgroundColor: 'rgba(200, 210, 195, 0.6)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  stepFront: {
    backgroundColor: 'rgba(180, 195, 175, 0.45)',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
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
});
