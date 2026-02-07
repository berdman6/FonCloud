import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Dot {
  id: number;
  size: number;
  x: number;
  y: number;
  opacity: number;
  driftY: number;
  duration: number;
  delay: number;
}

const DOTS: Dot[] = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  size: 6 + Math.random() * 14,
  x: Math.random() * (SCREEN_WIDTH - 20),
  y: Math.random() * (SCREEN_HEIGHT - 20),
  opacity: 0.06 + Math.random() * 0.09,
  driftY: 10 + Math.random() * 20,
  duration: 3000 + Math.random() * 4000,
  delay: Math.random() * 2000,
}));

function FloatingDot({ dot }: { dot: Dot }) {
  const translateY = useSharedValue(0);
  const opacityVal = useSharedValue(dot.opacity);

  useEffect(() => {
    translateY.value = withDelay(
      dot.delay,
      withRepeat(
        withSequence(
          withTiming(-dot.driftY, { duration: dot.duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(dot.driftY, { duration: dot.duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    opacityVal.value = withDelay(
      dot.delay,
      withRepeat(
        withSequence(
          withTiming(dot.opacity * 0.5, { duration: dot.duration * 0.8, easing: Easing.inOut(Easing.sin) }),
          withTiming(dot.opacity, { duration: dot.duration * 0.8, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacityVal.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: dot.x,
          top: dot.y,
          width: dot.size,
          height: dot.size,
          borderRadius: dot.size / 2,
          backgroundColor: '#5B8C3E',
        },
        animStyle,
      ]}
    />
  );
}

export function FloatingBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {DOTS.map((dot) => (
        <FloatingDot key={dot.id} dot={dot} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
