/**
 * Skeleton Loader
 *
 * Animated placeholder while data loads from SQLite.
 * Uses Animated API for a subtle shimmer effect.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  style,
  borderRadius = 12,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className="bg-zinc-200 dark:bg-zinc-800"
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-4 border border-zinc-200 dark:border-zinc-800">
      <SkeletonLoader width="60%" height={14} />
      <SkeletonLoader width="40%" height={28} style={{ marginTop: 8 }} />
      <SkeletonLoader width="50%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}
