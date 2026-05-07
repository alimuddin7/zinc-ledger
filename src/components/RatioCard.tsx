/**
 * RatioCard — Premium metric card with strong contrast.
 * Uses inline styles for reliability across platforms.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ShieldCheck, TrendingDown, AlertCircle, Zap } from 'lucide-react-native';

interface RatioCardProps {
  label: string;
  value: string;
  subtitle?: string;
  status: 'positive' | 'negative' | 'warning' | 'neutral';
  onPress?: () => void;
}

const STATUS_CONFIG = {
  positive: {
    valueColor: '#34d399',
    bgTint: 'rgba(16, 185, 129, 0.08)',
    borderTint: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#34d399',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    Icon: ShieldCheck,
  },
  negative: {
    valueColor: '#fb7185',
    bgTint: 'rgba(244, 63, 94, 0.08)',
    borderTint: 'rgba(244, 63, 94, 0.15)',
    iconColor: '#fb7185',
    iconBg: 'rgba(244, 63, 94, 0.15)',
    Icon: TrendingDown,
  },
  warning: {
    valueColor: '#fbbf24',
    bgTint: 'rgba(251, 191, 36, 0.08)',
    borderTint: 'rgba(251, 191, 36, 0.15)',
    iconColor: '#fbbf24',
    iconBg: 'rgba(251, 191, 36, 0.15)',
    Icon: AlertCircle,
  },
  neutral: {
    valueColor: '#a78bfa',
    bgTint: 'rgba(139, 92, 246, 0.08)',
    borderTint: 'rgba(139, 92, 246, 0.15)',
    iconColor: '#a78bfa',
    iconBg: 'rgba(139, 92, 246, 0.15)',
    Icon: Zap,
  },
};

export function RatioCard({ label, value, subtitle, status, onPress }: RatioCardProps) {
  const cfg = STATUS_CONFIG[status];
  const { Icon } = cfg;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: cfg.bgTint,
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: cfg.borderTint,
        minHeight: 120,
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 12,
        backgroundColor: cfg.iconBg,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Icon size={16} color={cfg.iconColor} />
      </View>

      <Text style={{
        fontSize: 22, fontFamily: 'JetBrainsMonoBold',
        color: cfg.valueColor, marginTop: 12, letterSpacing: -0.5,
      }}>
        {value}
      </Text>

      <Text style={{
        fontSize: 10, fontFamily: 'InterSemiBold',
        color: 'rgba(255,255,255,0.35)', marginTop: 4,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>
        {label}
      </Text>

      {subtitle && (
        <Text style={{
          fontSize: 10, fontFamily: 'Inter',
          color: 'rgba(255,255,255,0.2)', marginTop: 2,
        }}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}
