/**
 * HeroCard — Purple gradient balance card (FinTech style).
 * Clean display of Net Worth with Assets/Liabilities breakdown.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface HeroCardProps {
  balance: string;
  assets: string;
  liabilities: string;
  trend?: number;
}

export function HeroCard({ balance, assets, liabilities, trend }: HeroCardProps) {
  return (
    <View className="mx-5 mb-6" style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    }}>
      <LinearGradient
        colors={['#4F359B', '#6D52C1', '#8B6FD8'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ 
          borderRadius: 24, 
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.15)' 
        }}
      >
        {/* Balance Label */}
        <Text className="text-white/60 text-[11px] font-inter-semibold uppercase tracking-[3px] text-center">
          Main Balance
        </Text>

        {/* Balance Value */}
        <Text className="text-white text-4xl font-mono-bold text-center mt-3 tracking-tight">
          {balance}
        </Text>

        {/* Trend Badge */}
        {trend !== undefined && trend !== 0 && (
          <View className="flex-row items-center justify-center mt-3">
            <View className={`flex-row items-center px-3 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-400/20' : 'bg-rose-400/20'}`}>
              {trend >= 0
                ? <TrendingUp size={12} strokeWidth={3} color="#6ee7b7" />
                : <TrendingDown size={12} strokeWidth={3} color="#fda4af" />
              }
              <Text className={`text-[11px] font-mono-bold ml-1.5 ${trend >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {/* Assets / Liabilities */}
        <View className="flex-row justify-between mt-6 px-2">
          <View>
            <Text className="text-white/40 text-[10px] font-inter-semibold uppercase tracking-wider">Assets</Text>
            <Text className="text-white text-sm font-mono-medium mt-0.5">{assets}</Text>
          </View>
          <View className="items-end">
            <Text className="text-white/40 text-[10px] font-inter-semibold uppercase tracking-wider">Liabilities</Text>
            <Text className="text-white text-sm font-mono-medium mt-0.5">{liabilities}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
