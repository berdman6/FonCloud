import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AV = Animated.View;
const GREEN = '#18CA51';
const GREEN_DARK = '#0D7A30';

function Coin3D({
  delay,
  sz,
  x,
  y,
  children,
  orbit = 14,
  drift = 5,
  dur = 4000,
  tilt = 8,
}: {
  delay: number;
  sz: number;
  x: number;
  y: number;
  children: React.ReactNode;
  orbit?: number;
  drift?: number;
  dur?: number;
  tilt?: number;
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
    opacity: interpolate(p.value, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.8]),
  }));

  const shadowAnim = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5, 1], [0.2, 0.06, 0.2]),
    transform: [{ scaleX: interpolate(p.value, [0, 0.5, 1], [0.85, 1.3, 0.85]) }, { scaleY: 0.22 }],
  }));

  const edgeH = sz * 0.14;

  return (
    <AV style={[{ position: 'absolute', left: x, top: y, alignItems: 'center' }, anim]}>
      <View style={{ width: sz, alignItems: 'center' }}>
        <View style={[st.coinWrap, { width: sz, height: sz, borderRadius: sz / 2 }]}>
          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={[st.coinFace, { width: sz - 3, height: sz - 3, borderRadius: (sz - 3) / 2 }]}
          >
            <View style={[st.coinShine, { width: sz * 0.55, height: sz * 0.22, borderRadius: sz * 0.11, top: sz * 0.08 }]} />
            {children}
          </LinearGradient>
        </View>
        <View style={[st.coinEdge, { width: sz * 0.88, height: edgeH, borderBottomLeftRadius: sz * 0.44, borderBottomRightRadius: sz * 0.44 }]}>
          <LinearGradient
            colors={['#98D898', '#4CAA4C', '#2D8030']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1, borderBottomLeftRadius: sz * 0.44, borderBottomRightRadius: sz * 0.44 }}
          />
        </View>
      </View>
      <AV style={[{ width: sz * 0.55, height: sz * 0.45, borderRadius: sz * 0.28, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 3 }, shadowAnim]} />
    </AV>
  );
}

function Sparkle({ delay, x, y, dotSz }: { delay: number; x: number; y: number; dotSz: number }) {
  const op = useSharedValue(0);
  useEffect(() => {
    op.value = withDelay(delay, withRepeat(withSequence(withTiming(0.7, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1, true));
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: op.value }));
  return <AV style={[{ position: 'absolute', left: x, top: y, width: dotSz, height: dotSz, borderRadius: dotSz / 2, backgroundColor: GREEN }, a]} />;
}

export function PortalAnimation({ size = 200 }: { size?: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const imgAnim = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.99, 1.01]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.95, 1]),
  }));

  const coinL = size * 0.22;
  const coinM = size * 0.19;
  const coinS = size * 0.17;

  const imgSize = size * 1.0;
  const totalW = size * 1.2;
  const totalH = size * 1.1;

  return (
    <View style={[st.container, { width: totalW, height: totalH }]}>
      <AV style={[{ position: 'absolute', left: (totalW - imgSize) / 2, top: (totalH - imgSize) / 2 - size * 0.04, width: imgSize, height: imgSize }, imgAnim]}>
        <Image
          source={require('@/assets/images/portal-base.png')}
          style={{ width: imgSize, height: imgSize }}
          resizeMode="contain"
        />
      </AV>

      <Coin3D delay={0} sz={coinL} x={size * 0.68} y={size * 0.12} orbit={14} drift={4} dur={4200}>
        <Ionicons name="phone-portrait" size={coinL * 0.42} color="#FFFFFF" />
      </Coin3D>

      <Coin3D delay={600} sz={coinM} x={size * 0.12} y={size * 0.08} orbit={12} drift={5} dur={4600}>
        <Text style={[st.coinTxt, { fontSize: coinM * 0.42 }]}>৳</Text>
      </Coin3D>

      <Coin3D delay={1200} sz={coinS} x={size * 0.04} y={size * 0.48} orbit={10} drift={4} dur={5000}>
        <Text style={[st.logoTxt, { fontSize: coinS * 0.42 }]}>$</Text>
      </Coin3D>

      <Sparkle delay={0} x={size * 0.06} y={size * 0.06} dotSz={4.5} />
      <Sparkle delay={400} x={size * 1.02} y={size * 0.22} dotSz={3.5} />
      <Sparkle delay={800} x={size * 0.02} y={size * 0.78} dotSz={5} />
      <Sparkle delay={1200} x={size * 1.05} y={size * 0.58} dotSz={3} />
      <Sparkle delay={600} x={size * 0.55} y={size * -0.02} dotSz={4} />
      <Sparkle delay={1000} x={size * 0.88} y={size * 0.0} dotSz={3} />
      <Sparkle delay={300} x={size * 1.08} y={size * 0.42} dotSz={2.5} />
      <Sparkle delay={900} x={size * 0.3} y={size * 0.88} dotSz={3.5} />
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: GREEN_DARK,
    shadowColor: '#0D7A30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  coinFace: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coinShine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  coinEdge: {
    overflow: 'hidden',
    marginTop: -2,
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
});
