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
import Svg, {
  Circle,
  Line,
  Path,
  Defs,
  RadialGradient,
  LinearGradient as SvgLinGrad,
  Stop,
  Rect,
  G,
  Ellipse,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AV = Animated.View;
const GREEN = '#18CA51';
const GREEN_DARK = '#0D7A30';
const GREEN_DEEP = '#064A1A';
const SILVER = '#C8CDD0';
const SILVER_LIGHT = '#E0E4E6';
const SILVER_DIM = '#A0A8AC';

function Coin3D({
  delay,
  sz,
  x,
  y,
  children,
  orbit = 14,
  drift = 5,
  dur = 4000,
}: {
  delay: number;
  sz: number;
  x: number;
  y: number;
  children: React.ReactNode;
  orbit?: number;
  drift?: number;
  dur?: number;
}) {
  const p = useSharedValue(0);
  const d = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.ease) }), -1, true));
    d.value = withDelay(delay + 300, withRepeat(withTiming(1, { duration: dur * 1.2, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(p.value, [0, 1], [0, -orbit]) },
      { translateX: interpolate(d.value, [0, 1], [-drift, drift]) },
      { scale: interpolate(p.value, [0, 0.5, 1], [0.94, 1.08, 0.94]) },
    ],
    opacity: interpolate(p.value, [0, 0.3, 0.7, 1], [0.75, 1, 1, 0.75]),
  }));

  const shadowAnim = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5, 1], [0.25, 0.08, 0.25]),
    transform: [{ scaleX: interpolate(p.value, [0, 0.5, 1], [0.9, 1.4, 0.9]) }, { scaleY: 0.25 }],
  }));

  const edgeH = sz * 0.12;

  return (
    <AV style={[{ position: 'absolute', left: x, top: y, alignItems: 'center' }, anim]}>
      <View style={{ width: sz, alignItems: 'center' }}>
        <View style={[s.coinFaceWrap, { width: sz, height: sz, borderRadius: sz / 2 }]}>
          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={[s.coinFace, { width: sz - 3, height: sz - 3, borderRadius: (sz - 3) / 2 }]}
          >
            <View style={[s.coinShine, { width: sz * 0.6, height: sz * 0.25, borderRadius: sz * 0.12, top: sz * 0.08 }]} />
            {children}
          </LinearGradient>
        </View>
        <View style={[s.coinEdge, { width: sz * 0.92, height: edgeH, borderBottomLeftRadius: sz * 0.46, borderBottomRightRadius: sz * 0.46 }]}>
          <LinearGradient
            colors={['#A8D8A0', '#5CAA50', '#3D8030']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[s.coinEdgeGrad, { borderBottomLeftRadius: sz * 0.46, borderBottomRightRadius: sz * 0.46 }]}
          />
        </View>
      </View>
      <AV style={[{ width: sz * 0.6, height: sz * 0.5, borderRadius: sz * 0.3, backgroundColor: 'rgba(0,0,0,0.1)', marginTop: 2 }, shadowAnim]} />
    </AV>
  );
}

function Steps3D({ size }: { size: number }) {
  const steps = [
    { w: size * 0.42, h: size * 0.035, topH: size * 0.018 },
    { w: size * 0.35, h: size * 0.03, topH: size * 0.015 },
    { w: size * 0.28, h: size * 0.025, topH: size * 0.012 },
  ];

  return (
    <View style={[s.stepsWrap, { top: size * 0.83 }]}>
      {steps.map((st, i) => (
        <View key={i} style={{ alignItems: 'center', marginBottom: size * 0.005 }}>
          <LinearGradient
            colors={['#F2F4F3', '#E8EBE9', '#DDE0DE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: st.w,
              height: st.topH,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            }}
          />
          <LinearGradient
            colors={['#D8DBD9', '#C8CCC9', '#BCC0BD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: st.w,
              height: st.h,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
            }}
          />
        </View>
      ))}
    </View>
  );
}

function Sparkle({ delay, x, y, dotSz }: { delay: number; x: number; y: number; dotSz: number }) {
  const op = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withRepeat(withSequence(withTiming(0.8, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1, true));
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: op.value }));
  return <AV style={[{ position: 'absolute', left: x, top: y, width: dotSz, height: dotSz, borderRadius: dotSz / 2, backgroundColor: GREEN }, a]} />;
}

function InnerParticle({ delay, cx, cy, r, angle, sz }: { delay: number; cx: number; cy: number; r: number; angle: number; sz: number }) {
  const op = useSharedValue(0);
  const prog = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withRepeat(withSequence(withTiming(0.6, { duration: 2000 }), withTiming(0, { duration: 2000 })), -1, true));
    prog.value = withDelay(delay, withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false));
  }, []);
  const rad = (angle * Math.PI) / 180;
  const px = cx + Math.cos(rad) * r;
  const py = cy + Math.sin(rad) * r;
  const a = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: interpolate(op.value, [0, 0.6], [0.5, 1.2]) }],
  }));
  return <AV style={[{ position: 'absolute', left: px - sz / 2, top: py - sz / 2, width: sz, height: sz, borderRadius: sz / 2, backgroundColor: 'rgba(24, 202, 81, 0.5)' }, a]} />;
}

export function PortalAnimation({ size = 200 }: { size?: number }) {
  const outerRot = useSharedValue(0);
  const midRot = useSharedValue(0);
  const innerRot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    outerRot.value = withRepeat(withTiming(360, { duration: 25000, easing: Easing.linear }), -1, false);
    midRot.value = withRepeat(withTiming(-360, { duration: 18000, easing: Easing.linear }), -1, false);
    innerRot.value = withRepeat(withTiming(360, { duration: 10000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })), -1, true);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })), -1, true);
  }, []);

  const outerS = useAnimatedStyle(() => ({ transform: [{ rotate: `${outerRot.value}deg` }, { scale: interpolate(pulse.value, [0, 1], [0.99, 1.01]) }] }));
  const midS = useAnimatedStyle(() => ({ transform: [{ rotate: `${midRot.value}deg` }] }));
  const innerS = useAnimatedStyle(() => ({ transform: [{ rotate: `${innerRot.value}deg` }, { scale: interpolate(glow.value, [0, 1], [0.97, 1.04]) }] }));
  const glowS = useAnimatedStyle(() => ({ opacity: interpolate(pulse.value, [0, 1], [0.08, 0.25]), transform: [{ scale: interpolate(pulse.value, [0, 1], [0.95, 1.12]) }] }));
  const portalS = useAnimatedStyle(() => ({ opacity: interpolate(glow.value, [0, 1], [0.85, 1]), transform: [{ scale: interpolate(glow.value, [0, 1], [0.98, 1.02]) }] }));

  const h = size / 2;
  const oR = h - 8;
  const mR = h * 0.68;
  const iR = h * 0.44;
  const totalH = size * 1.18;

  const ticks = (radius: number, count: number, len: number, color: string, thickEvery: number) => {
    const ls = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 360;
      const r2 = (a * Math.PI) / 180;
      const thick = i % thickEvery === 0;
      ls.push(
        <Line
          key={`t${i}`}
          x1={h + Math.cos(r2) * (radius - len)}
          y1={h + Math.sin(r2) * (radius - len)}
          x2={h + Math.cos(r2) * radius}
          y2={h + Math.sin(r2) * radius}
          stroke={color}
          strokeWidth={thick ? 2 : 0.8}
          strokeOpacity={thick ? 0.7 : 0.25}
        />
      );
    }
    return ls;
  };

  const arc = (cx: number, cy: number, r: number, sa: number, ea: number) => {
    const s1 = (sa * Math.PI) / 180;
    const e1 = (ea * Math.PI) / 180;
    const la = ea - sa > 180 ? 1 : 0;
    return `M ${cx + r * Math.cos(s1)} ${cy + r * Math.sin(s1)} A ${r} ${r} 0 ${la} 1 ${cx + r * Math.cos(e1)} ${cy + r * Math.sin(e1)}`;
  };

  const coinL = size * 0.24;
  const coinM = size * 0.2;
  const coinS = size * 0.17;

  return (
    <View style={[s.container, { width: size * 1.35, height: totalH }]}>
      <AV style={[s.outerGlow, { width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75, top: (totalH - size * 1.5) / 2 - size * 0.06, left: (size * 1.35 - size * 1.5) / 2 }, glowS]} />

      <View style={{ position: 'absolute', left: (size * 1.35 - size) / 2, top: 0 }}>
        <AV style={outerS}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
              <RadialGradient id="pg" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#0A4A1E" stopOpacity="0.95" />
                <Stop offset="35%" stopColor="#064A18" stopOpacity="1" />
                <Stop offset="65%" stopColor="#033A10" stopOpacity="0.95" />
                <Stop offset="85%" stopColor="#022A0A" stopOpacity="0.8" />
                <Stop offset="100%" stopColor={SILVER_DIM} stopOpacity="0.08" />
              </RadialGradient>
              <RadialGradient id="iglow" cx="40%" cy="35%" r="60%">
                <Stop offset="0%" stopColor={GREEN} stopOpacity="0.35" />
                <Stop offset="50%" stopColor={GREEN_DARK} stopOpacity="0.15" />
                <Stop offset="100%" stopColor="#000" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            <Circle cx={h} cy={h} r={oR + 6} stroke={SILVER_LIGHT} strokeWidth={0.5} fill="none" strokeOpacity={0.4} />
            <Circle cx={h} cy={h} r={oR + 3} stroke={SILVER} strokeWidth={1} fill="none" strokeOpacity={0.3} />

            <Circle cx={h} cy={h} r={oR} fill="url(#pg)" />
            <Circle cx={h} cy={h} r={oR} fill="url(#iglow)" />

            <Circle cx={h} cy={h} r={oR} stroke={SILVER} strokeWidth={3} fill="none" strokeOpacity={0.6} />
            <Circle cx={h} cy={h} r={oR - 4} stroke={SILVER_DIM} strokeWidth={0.8} fill="none" strokeOpacity={0.25} />

            {ticks(oR - 1, 80, 6, SILVER, 5)}

            <Path d={arc(h, h, oR - 10, 5, 75)} stroke={SILVER_LIGHT} strokeWidth={3.5} fill="none" strokeOpacity={0.5} strokeLinecap="round" />
            <Path d={arc(h, h, oR - 10, 95, 135)} stroke={GREEN} strokeWidth={3} fill="none" strokeOpacity={0.6} strokeLinecap="round" />
            <Path d={arc(h, h, oR - 10, 165, 240)} stroke={SILVER_LIGHT} strokeWidth={3} fill="none" strokeOpacity={0.35} strokeLinecap="round" />
            <Path d={arc(h, h, oR - 10, 265, 310)} stroke={GREEN} strokeWidth={2.5} fill="none" strokeOpacity={0.4} strokeLinecap="round" />
            <Path d={arc(h, h, oR - 10, 330, 355)} stroke={SILVER_LIGHT} strokeWidth={2} fill="none" strokeOpacity={0.3} strokeLinecap="round" />

            {[20, 85, 150, 220, 295, 350].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <Rect key={`sg${angle}`} x={h + Math.cos(rad) * (oR - 16) - 4} y={h + Math.sin(rad) * (oR - 16) - 1.5} width={8} height={3} fill={SILVER} fillOpacity={0.5} rx={1.5} />
              );
            })}
          </Svg>
        </AV>

        <AV style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, midS]}>
          <Svg width={size * 0.78} height={size * 0.78} viewBox={`0 0 ${size * 0.78} ${size * 0.78}`}>
            <Circle cx={size * 0.39} cy={size * 0.39} r={mR} stroke={SILVER} strokeWidth={2} fill="none" strokeOpacity={0.4} strokeDasharray="5 10" />
            <Circle cx={size * 0.39} cy={size * 0.39} r={mR - 8} stroke={SILVER_DIM} strokeWidth={0.8} fill="none" strokeOpacity={0.2} strokeDasharray="16 5 3 5" />
            <Path d={arc(size * 0.39, size * 0.39, mR + 2, 15, 100)} stroke="rgba(255,255,255,0.2)" strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d={arc(size * 0.39, size * 0.39, mR + 2, 195, 280)} stroke="rgba(255,255,255,0.15)" strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d={arc(size * 0.39, size * 0.39, mR - 3, 50, 90)} stroke={GREEN} strokeWidth={2} fill="none" strokeOpacity={0.35} strokeLinecap="round" />
            <Path d={arc(size * 0.39, size * 0.39, mR - 3, 230, 270)} stroke={GREEN} strokeWidth={2} fill="none" strokeOpacity={0.25} strokeLinecap="round" />
          </Svg>
        </AV>

        <AV style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, innerS]}>
          <Svg width={size * 0.54} height={size * 0.54} viewBox={`0 0 ${size * 0.54} ${size * 0.54}`}>
            <Circle cx={size * 0.27} cy={size * 0.27} r={iR} stroke={SILVER_DIM} strokeWidth={1.2} fill="none" strokeOpacity={0.35} strokeDasharray="8 5" />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return <Circle key={`in${angle}`} cx={size * 0.27 + Math.cos(rad) * iR} cy={size * 0.27 + Math.sin(rad) * iR} r={2.5} fill={GREEN} fillOpacity={0.6} />;
            })}
          </Svg>
        </AV>

        <AV style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, portalS]}>
          <View style={[s.portalCore, { width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]}>
            <LinearGradient
              colors={['#0E5A24', '#064A18', '#023A0C', '#011A06']}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={[s.portalInner, { width: size * 0.38, height: size * 0.38, borderRadius: size * 0.19 }]}
            >
              <View style={[s.portalShine, { width: size * 0.22, height: size * 0.14, borderRadius: size * 0.07, top: size * 0.04, left: size * 0.06 }]} />
              <View style={[s.portalShine2, { width: size * 0.12, height: size * 0.18, borderRadius: size * 0.06, bottom: size * 0.05, right: size * 0.06 }]} />
            </LinearGradient>
          </View>
        </AV>

        {[30, 80, 140, 200, 260, 320].map((angle, i) => (
          <InnerParticle key={`ip${i}`} delay={i * 400} cx={h} cy={h} r={oR * 0.3 + (i % 3) * 8} angle={angle} sz={2 + (i % 3)} />
        ))}
      </View>

      <Steps3D size={size} />

      <Coin3D delay={0} sz={coinL} x={size * 0.72} y={size * 0.18} orbit={16} drift={5} dur={4200}>
        <Ionicons name="phone-portrait" size={coinL * 0.42} color="#FFFFFF" />
      </Coin3D>

      <Coin3D delay={600} sz={coinM} x={size * 0.06} y={size * 0.12} orbit={12} drift={6} dur={4600}>
        <Text style={[s.coinTxt, { fontSize: coinM * 0.28 }]}>BDTK</Text>
      </Coin3D>

      <Coin3D delay={1200} sz={coinS} x={size * 0.0} y={size * 0.52} orbit={10} drift={4} dur={5000}>
        <Text style={[s.logoTxt, { fontSize: coinS * 0.34 }]}>FC</Text>
      </Coin3D>

      <Sparkle delay={0} x={size * 0.08} y={size * 0.08} dotSz={4} />
      <Sparkle delay={400} x={size * 1.12} y={size * 0.25} dotSz={3.5} />
      <Sparkle delay={800} x={size * 0.03} y={size * 0.78} dotSz={5} />
      <Sparkle delay={1200} x={size * 1.15} y={size * 0.65} dotSz={3} />
      <Sparkle delay={600} x={size * 0.6} y={size * 0.0} dotSz={4} />
      <Sparkle delay={1000} x={size * 0.95} y={size * 0.02} dotSz={3} />
      <Sparkle delay={300} x={size * 1.2} y={size * 0.48} dotSz={2.5} />
      <Sparkle delay={900} x={size * 0.35} y={size * 0.95} dotSz={3.5} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(24, 202, 81, 0.04)',
  },
  portalCore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 74, 24, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(24, 202, 81, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  portalInner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  portalShine: {
    position: 'absolute',
    backgroundColor: 'rgba(24, 202, 81, 0.15)',
  },
  portalShine2: {
    position: 'absolute',
    backgroundColor: 'rgba(24, 202, 81, 0.08)',
  },
  coinFaceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#0D7A30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: GREEN_DARK,
  },
  coinFace: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coinShine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  coinEdge: {
    overflow: 'hidden',
    marginTop: -2,
  },
  coinEdgeGrad: {
    flex: 1,
  },
  coinTxt: {
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logoTxt: {
    fontFamily: 'HindSiliguri_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  stepsWrap: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
});
