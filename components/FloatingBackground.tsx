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
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  color: string;
}

const NEON_COLORS = ['#39FF14', '#39FF14', '#39FF14', '#F5A623', '#F5A623', '#2ECC40'];

const DOTS: Dot[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: 4 + Math.random() * 18,
  x: Math.random() * (SCREEN_WIDTH - 20),
  y: Math.random() * (SCREEN_HEIGHT - 20),
  opacity: 0.12 + Math.random() * 0.2,
  driftX: -15 + Math.random() * 30,
  driftY: 15 + Math.random() * 30,
  duration: 3000 + Math.random() * 5000,
  delay: Math.random() * 2500,
  color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
}));

function FloatingDot({ dot }: { dot: Dot }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
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
    translateX.value = withDelay(
      dot.delay + 500,
      withRepeat(
        withSequence(
          withTiming(dot.driftX, { duration: dot.duration * 1.2, easing: Easing.inOut(Easing.sin) }),
          withTiming(-dot.driftX, { duration: dot.duration * 1.2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    opacityVal.value = withDelay(
      dot.delay,
      withRepeat(
        withSequence(
          withTiming(dot.opacity * 0.3, { duration: dot.duration * 0.7, easing: Easing.inOut(Easing.sin) }),
          withTiming(dot.opacity, { duration: dot.duration * 0.7, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
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
          backgroundColor: dot.color,
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
