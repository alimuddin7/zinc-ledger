/**
 * Skeleton Loader — Adaptive shimmer placeholders.
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
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className="bg-zinc-200 dark:bg-zinc-800"
      style={[{ width: width as any, height, borderRadius, opacity }, style]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View
      className="bg-white dark:bg-zinc-900 rounded-3xl p-6 mb-4 border border-zinc-100 dark:border-zinc-800"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
    >
      <SkeletonLoader width="50%" height={12} />
      <SkeletonLoader width="70%" height={28} style={{ marginTop: 12 }} />
      <SkeletonLoader width="40%" height={10} style={{ marginTop: 12 }} />
    </View>
  );
}

export function SkeletonHero() {
  return (
    <View className="mx-5 mt-4 mb-6 bg-violet-200 dark:bg-violet-900/30 rounded-[28px] p-7">
      <SkeletonLoader width="40%" height={10} style={{ alignSelf: 'center' }} borderRadius={6} />
      <SkeletonLoader width="60%" height={36} style={{ marginTop: 16, alignSelf: 'center' }} borderRadius={8} />
      <View className="flex-row justify-between mt-8">
        <SkeletonLoader width="30%" height={10} />
        <SkeletonLoader width="30%" height={10} />
      </View>
    </View>
  );
}
