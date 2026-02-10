import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
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

const AV = Animated.View;
const GREEN = '#18CA51';

const coinTaka = require('@/assets/images/coin-taka.png');
const coinDollar = require('@/assets/images/coin-dollar.png');
const coinMobile = require('@/assets/images/coin-mobile.png');

function FloatingCoin({
  delay,
  sz,
  x,
  y,
  source,
  orbit = 14,
  drift = 5,
  dur = 4000,
}: {
  delay: number;
  sz: number;
  x: number;
  y: number;
  source: any;
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
      { scale: interpolate(p.value, [0, 0.5, 1], [0.95, 1.06, 0.95]) },
    ],
    opacity: interpolate(p.value, [0, 0.3, 0.7, 1], [0.85, 1, 1, 0.85]),
  }));

  return (
    <AV style={[{ position: 'absolute', left: x, top: y, width: sz, height: sz }, anim]}>
      <Image source={source} style={{ width: sz, height: sz }} resizeMode="contain" />
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

  const coinL = size * 0.32;
  const coinM = size * 0.28;
  const coinS = size * 0.25;

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

      <FloatingCoin delay={0} sz={coinL} x={size * 0.65} y={size * 0.08} orbit={16} drift={5} dur={4200} source={coinMobile} />
      <FloatingCoin delay={600} sz={coinM} x={size * 0.06} y={size * 0.05} orbit={12} drift={6} dur={4600} source={coinTaka} />
      <FloatingCoin delay={1200} sz={coinS} x={size * -0.02} y={size * 0.45} orbit={10} drift={4} dur={5000} source={coinDollar} />

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
});
