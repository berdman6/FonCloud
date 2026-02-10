import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AV = Animated.View;

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

  const imgSize = size * 1.0;

  return (
    <View style={[st.container, { width: imgSize, height: imgSize }]}>
      <AV style={[{ width: imgSize, height: imgSize }, imgAnim]}>
        <Image
          source={require('@/assets/images/portal-base.png')}
          style={{ width: imgSize, height: imgSize }}
          resizeMode="contain"
        />
      </AV>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
