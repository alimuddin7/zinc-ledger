/**
 * Dashboard Screen
 * Displays 3 key financial ratios, net worth chart, and component list.
 */
import React, { useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFinancials } from '@/src/hooks/useFinancials';
import { useProfile } from '@/src/hooks/useProfile';
import { useAppStore } from '@/src/store/useAppStore';
import { RatioCard } from '@/src/components/RatioCard';
import { NetWorthChart } from '@/src/components/NetWorthChart';
import { SkeletonCard } from '@/src/components/SkeletonLoader';
import { AlertCircle, AlertTriangle, TrendingUp, TrendingDown, DollarSign, GraduationCap } from 'lucide-react-native';
import type { ComponentType } from '@/src/database/schema';

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} Mlyr`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(1)} Rb`;
  return `Rp ${n.toFixed(0)}`;
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatRatio(n: number): string {
  return `${n.toFixed(1)}x`;
}

function getNetWorthStatus(v: number) {
  return v >= 0 ? 'positive' : 'negative' as const;
}

function getSavingsStatus(v: number, maritalStatus: string) {
  if (v >= 0.2) return 'positive' as const;
  if (v >= 0.15 || (maritalStatus === 'single' && v >= 0.1)) return 'warning' as const;
  return 'negative' as const;
}

function getDSRStatus(v: number) {
  if (v <= 0.3) return 'positive' as const;
  if (v <= 0.35) return 'warning' as const;
  return 'negative' as const;
}

function getEmergencyStatus(v: number, target: number) {
  if (v >= target) return 'positive' as const;
  if (v >= target * 0.5) return 'warning' as const;
  return 'negative' as const;
}

const TYPE_LABELS: Record<ComponentType, string> = {
  asset: '💰 Assets',
  liability: '💳 Liabilities',
  income: '📈 Income',
  expense: '📉 Expenses',
};

const TYPE_ORDER: ComponentType[] = ['asset', 'liability', 'income', 'expense'];

export default function DashboardScreen() {
  const { isLoading: isLoadingFin, summary, components, netWorthHistory, alerts, refetch } = useFinancials();
  const { profile, children, isLoading: isLoadingProf, refetch: refetchProfile } = useProfile();
  const openCalibration = useAppStore((s) => s.openCalibration);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchProfile();
    }, [refetch, refetchProfile])
  );

  // EF Target Logic from rules
  let efTarget = 6;
  if (profile?.marital_status === 'married') {
    efTarget = profile.dependents > 0 ? 12 + profile.dependents : 9;
  }

  // Emergency Fund Ratio calculation (Liquid Assets / Total Monthly Outflow)
  const emergencyFundRatio = summary.totalExpenses > 0 
    ? summary.liquidAssets / summary.totalExpenses 
    : 0;
  
  // Merge EF ratio into summary for UI consistency
  const summaryWithEF = { ...summary, emergencyFundRatio };

  const handleComponentPress = (comp: { id: number; name: string; current_amount: number; type: string }) => {
    openCalibration({ id: comp.id, name: comp.name, amount: comp.current_amount, type: comp.type });
    router.push('/modal');
  };

  if (isLoadingFin || isLoadingProf) {
    return (
      <ScrollView className="flex-1 bg-zinc-50 dark:bg-zinc-950" contentContainerStyle={{ padding: 24 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  // Group components by type
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: components.filter((c) => c.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <ScrollView 
      className="flex-1 bg-zinc-50 dark:bg-zinc-950" 
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <View className="mb-6 space-y-3">
          {alerts.map((alert, i) => (
            <View 
              key={i} 
              className={`p-4 rounded-2xl border-l-4 ${
                alert.type === 'red' 
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-500' 
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-500'
              }`}
            >
              <View className="flex-row items-center space-x-2 mb-1">
                {alert.type === 'red' 
                  ? <AlertCircle size={18} color="#ef4444" /> 
                  : <AlertTriangle size={18} color="#f59e0b" />}
                <Text 
                  className={`text-sm font-inter-bold ${
                    alert.type === 'red' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {alert.message}
                </Text>
              </View>
              <Text 
                className={`text-[12px] font-inter-medium leading-relaxed ${
                  alert.type === 'red' ? 'text-red-600/80 dark:text-red-400/80' : 'text-amber-600/80 dark:text-amber-400/80'
                }`}
              >
                {alert.suggestion}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Key Ratios */}
      <Text className="text-lg font-inter-bold text-zinc-900 dark:text-zinc-50 mb-4 mt-2">Financial Health</Text>

      <RatioCard
        label="Total Net Worth"
        value={formatCurrency(summary.netWorth)}
        subtitle={`Assets ${formatCurrency(summary.totalAssets)} − Liabilities ${formatCurrency(summary.totalLiabilities)}`}
        status={getNetWorthStatus(summary.netWorth)}
      />

      <View className="flex-row space-x-4 mb-4">
        <View className="flex-1">
          <RatioCard
            label="Liquid Net Worth"
            value={formatCurrency(summary.liquidNetWorth)}
            subtitle={`Liquid Assets ${formatCurrency(summary.liquidAssets)}`}
            status={getNetWorthStatus(summary.liquidNetWorth)}
          />
        </View>
        <View className="flex-1 ml-4">
          <RatioCard
            label="Savings Rate"
            value={formatPercent(summary.savingsRate)}
            subtitle={`Target: ≥ 20%`}
            status={getSavingsStatus(summary.savingsRate, profile?.marital_status ?? 'single')}
          />
        </View>
      </View>

      <View className="flex-row space-x-4 mb-4">
        <View className="flex-1">
          <RatioCard
            label="DSR (Debt Ratio)"
            value={formatPercent(summary.dsr)}
            subtitle="Limit: 35%"
            status={getDSRStatus(summary.dsr)}
          />
        </View>
        <View className="flex-1 ml-4">
          <RatioCard
            label="Emergency Fund"
            value={formatRatio(summaryWithEF.emergencyFundRatio)}
            subtitle={`Target: ${efTarget}x Outflow`}
            status={getEmergencyStatus(summaryWithEF.emergencyFundRatio, efTarget)}
          />
        </View>
      </View>

      {/* Planning & Goals */}
      {summary.educationReserve > 0 && (
        <>
          <Text className="text-lg font-inter-bold text-zinc-900 dark:text-zinc-50 mb-4 mt-4">Future Planning</Text>
          <View className="bg-white dark:bg-zinc-900 rounded-2xl p-6 mb-4 border border-zinc-200 dark:border-zinc-800">
            <View className="flex-row items-center space-x-2 mb-1">
              <GraduationCap size={20} color="#0ea5e9" />
              <Text className="text-sm font-inter-semibold text-zinc-600 dark:text-zinc-400">Education Reserve</Text>
            </View>
            <Text className="text-2xl font-mono-bold text-sky-600 dark:text-sky-400">
              {formatCurrency(summary.educationReserve)}
            </Text>
            <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              Total future cost for {children.length} kids (Inflation: 10%/yr)
            </Text>
          </View>
        </>
      )}

      {/* Net Worth Chart */}
      <Text className="text-lg font-inter-bold text-zinc-900 dark:text-zinc-50 mb-4 mt-4">Net Worth Trend</Text>
      <NetWorthChart data={netWorthHistory} height={200} />

      {/* Component List */}
      <Text className="text-lg font-inter-bold text-zinc-900 dark:text-zinc-50 mb-4 mt-4">Components</Text>
      <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-4 -mt-3">Tap any value to calibrate</Text>

      {components.length === 0 ? (
        <View className="p-8 items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl mt-4 border border-zinc-200 dark:border-zinc-800 border-dashed">
          <DollarSign size={48} color="#94a3b8" strokeWidth={1} />
          <Text className="text-lg font-inter-bold text-zinc-900 dark:text-zinc-50 mt-4">No components yet</Text>
          <Text className="text-sm text-zinc-400 dark:text-zinc-500 text-center mt-1 mb-8">Start by adding your first asset or income stream.</Text>
          <Pressable 
            className="bg-sky-600 dark:bg-sky-500 px-8 py-3 rounded-xl" 
            onPress={() => router.push('/two')}
          >
            <Text className="text-white dark:text-zinc-950 font-inter-bold text-base">Add Your First Asset</Text>
          </Pressable>
        </View>
      ) : (
      grouped.map((group) => {
      const totalForGroup = group.items.reduce((acc, comp) => {
        const today = new Date().toISOString().split('T')[0];
        const isActive = (!comp.active_from || comp.active_from <= today) && (!comp.active_until || comp.active_until >= today);
        return isActive ? acc + comp.current_amount : acc;
      }, 0);

      return (
        <View key={group.type} className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-inter-semibold text-zinc-500 dark:text-zinc-400">{group.label}</Text>
            <Text className="text-[11px] font-mono-bold text-zinc-400 dark:text-zinc-500">{formatCurrency(totalForGroup)}</Text>
          </View>
            {group.items.map((comp) => (
              <Pressable
                key={comp.id}
                className="flex-row justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2 border border-zinc-200 dark:border-zinc-800"
                onPress={() => handleComponentPress(comp)}
              >
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-base font-inter-medium text-zinc-900 dark:text-zinc-50">{comp.name}</Text>
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      if (comp.active_from && comp.active_from > today) {
                        return <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-md ml-2"><Text className="text-[8px] text-amber-600 font-inter-bold">FUTURE</Text></View>;
                      }
                      if (comp.active_until && comp.active_until < today) {
                        return <View className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md ml-2"><Text className="text-[8px] text-zinc-400 font-inter-bold">EXPIRED</Text></View>;
                      }
                      return null;
                    })()}
                  </View>
                  <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {comp.frequency_interval} {comp.frequency_unit}s
                    {(comp.active_from || comp.active_until) && ` · ${comp.active_from ?? '...'} to ${comp.active_until ?? '...'}`}
                  </Text>
                </View>
                <Text
                  className={`text-lg font-mono-bold ${
                    (() => {
                      const today = new Date().toISOString().split('T')[0];
                      const isActive = (!comp.active_from || comp.active_from <= today) && (!comp.active_until || comp.active_until >= today);
                      if (!isActive) return 'text-zinc-300 dark:text-zinc-700';
                      return comp.type === 'asset' || comp.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : comp.type === 'liability'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400';
                    })()
                  }`}
                >
                  {formatCurrency(comp.current_amount)}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })
      )}

      <View className="h-10" />
    </ScrollView>
  );
}



