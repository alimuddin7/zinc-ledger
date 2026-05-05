/**
 * RatioCard — Glassmorphism financial ratio display card.
 * Color-coded by health status.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface RatioCardProps {
  label: string;
  value: string;
  subtitle?: string;
  status: 'positive' | 'negative' | 'warning' | 'neutral';
  onPress?: () => void;
}

const STATUS_TEXT = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-sky-600 dark:text-sky-400',
};

const STATUS_BORDER = {
  positive: 'border-emerald-200 dark:border-emerald-900/50',
  negative: 'border-rose-200 dark:border-rose-900/50',
  warning: 'border-amber-200 dark:border-amber-900/50',
  neutral: 'border-sky-200 dark:border-sky-900/50',
};

const STATUS_GLOW = {
  positive: 'bg-emerald-500/10',
  negative: 'bg-rose-500/10',
  warning: 'bg-amber-500/10',
  neutral: 'bg-sky-500/10',
};

export function RatioCard({ label, value, subtitle, status, onPress }: RatioCardProps) {
  const textColor = STATUS_TEXT[status];
  const borderColor = STATUS_BORDER[status];
  const glowBg = STATUS_GLOW[status];

  return (
    <Pressable
      onPress={onPress}
      className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-4 border relative overflow-hidden active:opacity-85 active:scale-[0.98] ${borderColor}`}
    >
      <View className={`absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-50 ${glowBg}`} />
      <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{label}</Text>
      <Text className={`text-2xl font-mono-bold mt-1 ${textColor}`}>{value}</Text>
      {subtitle && <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{subtitle}</Text>}
    </Pressable>
  );
}
