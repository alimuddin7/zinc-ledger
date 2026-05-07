import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck, Activity, AlertCircle, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Wallet } from 'lucide-react-native';

interface WeatherHeroProps {
  label: string;
  value: string;
  status: 'excellent' | 'stable' | 'critical' | 'normal';
  high: string;
  low: string;
  trend?: number;
}

const STATUS_CONFIG = {
  excellent: {
    label: 'Market High / Excellent',
    icon: <ShieldCheck size={28} color="#34d399" />,
    color: 'text-emerald-400',
  },
  normal: {
    label: 'Market Balanced',
    icon: <Activity size={28} color="#38bdf8" />,
    color: 'text-sky-400',
  },
  stable: {
    label: 'Conditions Stable',
    icon: <Wallet size={28} color="#94a3b8" />,
    color: 'text-slate-400',
  },
  critical: {
    label: 'Caution: High Outflow',
    icon: <AlertCircle size={28} color="#fb7185" />,
    color: 'text-rose-400',
  },
};

export function WeatherHero({ label, value, status, high, low, trend }: WeatherHeroProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View className="items-center justify-center py-16 px-6">
      <Text className="text-[11px] font-inter-bold text-white/40 uppercase tracking-[4px] mb-4">
        {label}
      </Text>
      
      <Text className="text-7xl font-mono-bold text-white tracking-tighter leading-none">
        {value}
      </Text>

      <View className="flex-row items-center mt-6 space-x-3">
        <View className="bg-white/10 p-2 rounded-2xl">
          {config.icon}
        </View>
        <Text className={`text-lg font-inter-semibold ${config.color}`}>
          {config.label}
        </Text>
      </View>

      <View className="flex-row items-center mt-5 space-x-6">
        <View className="flex-row items-center">
          <ArrowUp size={12} color="rgba(255,255,255,0.4)" />
          <Text className="text-xs font-mono-medium text-white/50 ml-1.5 uppercase tracking-tighter">Assets: {high}</Text>
        </View>
        <View className="flex-row items-center">
          <ArrowDown size={12} color="rgba(255,255,255,0.4)" />
          <Text className="text-xs font-mono-medium text-white/50 ml-1.5 uppercase tracking-tighter">Debt: {low}</Text>
        </View>
      </View>

      {trend !== undefined && (
        <View className={`flex-row items-center mt-8 px-4 py-1.5 rounded-full glass-card`}>
          {trend >= 0 ? <TrendingUp size={14} color="#34d399" /> : <TrendingDown size={14} color="#fb7185" />}
          <Text className={`text-xs font-mono-bold ml-2 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% Performance
          </Text>
        </View>
      )}
    </View>
  );
}
