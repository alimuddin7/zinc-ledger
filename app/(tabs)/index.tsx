import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, StatusBar, useColorScheme, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinancials } from '@/src/hooks/useFinancials';
import { useProfile } from '@/src/hooks/useProfile';
import { useAppStore } from '@/src/store/useAppStore';
import { RatioCard } from '@/src/components/RatioCard';
import { HeroCard } from '@/src/components/HeroCard';
import { NetWorthChart } from '@/src/components/NetWorthChart';
import { SkeletonCard, SkeletonHero } from '@/src/components/SkeletonLoader';
import { detectLifestyleInflation } from '@/src/utils/insights';
import { calculateStressTest, StressTestResult } from '@/src/utils/stressTest';
import {
  AlertCircle, AlertTriangle, DollarSign, GraduationCap,
  ChevronRight, Wallet, CreditCard, TrendingUp as TrendUp, Receipt,
  Plus, Zap, Flame, ShieldAlert, Timer, Info, X
} from 'lucide-react-native';
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
  asset: 'Assets',
  liability: 'Liabilities',
  income: 'Income',
  expense: 'Expenses',
};

const TYPE_ICONS: Record<ComponentType, React.ReactNode> = {
  asset: <Wallet size={18} color="#7c3aed" />,
  liability: <CreditCard size={18} color="#e11d48" />,
  income: <TrendUp size={18} color="#059669" />,
  expense: <Receipt size={18} color="#d97706" />,
};

const TYPE_ORDER: ComponentType[] = ['asset', 'liability', 'income', 'expense'];

export default function DashboardScreen() {
  const { isLoading, summary, components, netWorthHistory, alerts, refetch, deleteComponent } = useFinancials();
  const { profile, children, isLoading: isLoadingProf, refetch: refetchProfile } = useProfile();
  const openCalibration = useAppStore((s) => s.openCalibration);
  
  // Global Simulation State
  const { 
    isSimActive, simPurchase, simType, simTenor, simRate 
  } = useAppStore();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showStressTest, setShowStressTest] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchProfile();
    }, [refetch, refetchProfile])
  );

  const handleComponentPress = (comp: { id: number; name: string; current_amount: number; type: string }) => {
    openCalibration({ id: comp.id, name: comp.name, amount: comp.current_amount, type: comp.type });
    router.push('/modal');
  };

  if (isLoading || isLoadingProf) {
    return (
      <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View className="p-5 pt-16">
          <SkeletonHero />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  const stressResult = calculateStressTest(components, profile?.dependents ?? 0);
  const inflation = detectLifestyleInflation(netWorthHistory);
  const allAlerts = [...alerts];

  // Simulation Logic
  const simMonthlyInstallment = (isSimActive && simType === 'debt' && simPurchase > 0)
    ? (simPurchase + (simPurchase * (simRate / 100) * (simTenor / 12))) / simTenor
    : 0;

  const projectedDSR = summary.totalIncome > 0 
    ? (summary.totalMonthlyInstallment + simMonthlyInstallment) / summary.totalIncome 
    : 0;

  if (isSimActive && simType === 'debt' && projectedDSR > 0.35) {
    allAlerts.push({
      type: 'red',
      message: `Simulasi: DSR melonjak ke ${(projectedDSR * 100).toFixed(1)}% (Batas Aman: 35%)`,
      suggestion: 'Saran: Tinjau kembali di tab Sandbox.'
    });
  }
  
  if (inflation?.hasInflation) {
    allAlerts.unshift({
      type: 'red',
      message: `Lifestyle Inflation: Pengeluaran tumbuh ${(inflation.expenseGrowth * 100).toFixed(0)}% vs Pendapatan ${(inflation.incomeGrowth * 100).toFixed(0)}%!`,
      suggestion: 'Saran: Tinjau kembali anggaran gaya hidup dan alokasi tabungan.'
    });
  }

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: components.filter((c) => c.type === type),
  })).filter((g) => g.items.length > 0);

  // EF Target Logic
  let efTarget = 6;
  if (profile?.marital_status === 'married') {
    efTarget = profile.dependents > 0 ? 12 + profile.dependents : 9;
  }

  const emergencyFundRatio = summary.totalExpenses > 0
    ? summary.liquidAssets / summary.totalExpenses
    : 0;

  const lastTwo = netWorthHistory.slice(-2);
  const trendPercent = lastTwo.length === 2 && lastTwo[0].value !== 0
    ? ((lastTwo[1].value - lastTwo[0].value) / Math.abs(lastTwo[0].value)) * 100
    : 0;

  const simulatedNetWorth = simType === 'cash' 
    ? summary.netWorth 
    : summary.netWorth - simPurchase;

  const simulatedLiquid = (summary.liquidAssets || 0) - simPurchase;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={['#4F359B', '#6D52C1', '#8B6FD8'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between items-center px-6 pt-16 pb-2">
          <View>
            <Text className="text-white/60 text-[11px] font-inter-semibold uppercase tracking-[2px]">Zinc Ledger</Text>
            <Text className="text-white text-2xl font-inter-bold mt-0.5">Dashboard</Text>
          </View>
          <Pressable 
            onPress={() => setShowStressTest(true)}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20 active:bg-white/20"
          >
            <Flame size={20} color="#FFBF00" />
          </Pressable>
        </View>

        <View className="h-4" />

        <HeroCard
          balance={formatCurrency(isSimActive && simPurchase > 0 ? simulatedNetWorth : summary.netWorth)}
          assets={formatCurrency(summary.totalAssets + (isSimActive && simPurchase > 0 ? simPurchase : 0))}
          liabilities={formatCurrency(summary.totalLiabilities + (isSimActive && simType === 'debt' ? simPurchase : 0))}
          trend={trendPercent}
        />

        {isSimActive && simPurchase > 0 && (
          <View className="mx-6 -mt-3 mb-6 bg-amber-500 py-1.5 rounded-full items-center shadow-lg shadow-amber-500/30">
            <Text className="text-[10px] font-inter-bold text-zinc-900 uppercase tracking-widest">Simulation Mode Active</Text>
          </View>
        )}

        {allAlerts.length > 0 && (
          <View className="px-5 mb-5 flex-row flex-wrap gap-2">
            {allAlerts.map((alert, i) => (
              <View
                key={i}
                className={`flex-row items-center px-3 py-1.5 rounded-full ${
                  alert.type === 'red'
                    ? 'bg-rose-500/10 border border-rose-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                {alert.type === 'red'
                  ? <AlertCircle size={10} color="#fb7185" />
                  : <AlertTriangle size={10} color="#fbbf24" />}
                <Text className={`text-[10px] font-inter-bold ml-1.5 ${
                  alert.type === 'red' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {alert.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="px-5 mb-8">
          <View className="flex-row gap-4">
            <View className="w-[48%]">
              <RatioCard
                label="Debt-to-Asset"
                value={formatPercent(summary.debtToAssetRatio)}
                subtitle="Max: 30%"
                status={summary.debtToAssetRatio > 0.3 ? 'negative' : 'positive'}
              />
            </View>
            <View className="w-[48%]">
              <RatioCard
                label="Emergency Fund"
                value={formatRatio(emergencyFundRatio)}
                subtitle={`Target: ${efTarget}x`}
                status={getEmergencyStatus(emergencyFundRatio, efTarget)}
              />
            </View>
          </View>
        </View>

        <View className="px-5">
          <Text className="text-[11px] font-inter-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[2px] mb-4 ml-1">
            Financial Health
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%]">
              <RatioCard
                label="Burn Rate"
                value={formatCurrency(summary.totalMonthlyOutflow)}
                subtitle="Expenses + Installments"
                status={summary.totalMonthlyOutflow > summary.totalIncome ? 'negative' : 'warning'}
              />
            </View>
            <View className="w-[48%]">
              <RatioCard
                label="Savings Rate"
                value={formatPercent(summary.savingsRate)}
                subtitle="Target: ≥ 20%"
                status={getSavingsStatus(summary.savingsRate, profile?.marital_status ?? 'single')}
              />
            </View>
            <View className="w-[48%]">
              <RatioCard
                label="Debt Ratio"
                value={formatPercent(summary.dsr)}
                subtitle="Limit: 35%"
                status={getDSRStatus(summary.dsr)}
              />
            </View>
            <View className="w-[48%]">
              <RatioCard
                label="Emergency Fund"
                value={formatRatio(emergencyFundRatio)}
                subtitle={`Target: ${efTarget}x`}
                status={getEmergencyStatus(emergencyFundRatio, efTarget)}
              />
            </View>
          </View>
        </View>

        {summary.educationReserve > 0 && (
          <View className="px-5 mt-2">
            <View
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
            >
              <View className="flex-row items-center space-x-3 mb-2">
                <View className="p-2 bg-violet-100 dark:bg-violet-500/10 rounded-xl">
                  <GraduationCap size={20} color="#7c3aed" />
                </View>
                <Text className="text-sm font-inter-bold text-zinc-800 dark:text-zinc-200 ml-3">Education Reserve</Text>
              </View>
              <Text className="text-3xl font-mono-bold text-zinc-900 dark:text-white">
                {formatCurrency(summary.educationReserve)}
              </Text>
              <Text className="text-[11px] text-zinc-400 mt-1">
                Projected future cost for {children.length} dependents
              </Text>
            </View>
          </View>
        )}

        <View className="px-5 mt-8">
          <Text className="text-[11px] font-inter-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[2px] mb-4 ml-1">
            Net Worth Trend
          </Text>
          <View
            className="bg-white dark:bg-zinc-900 p-3 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
          >
            <NetWorthChart data={netWorthHistory} height={200} />
          </View>
        </View>

        <View className="px-5 mt-10">
          <Text className="text-[11px] font-inter-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[2px] mb-6 ml-1">
            Financial Components
          </Text>

          {components.length === 0 ? (
            <View
              className="p-10 items-center justify-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800"
            >
              <DollarSign size={48} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} strokeWidth={1} />
              <Text className="text-lg font-inter-bold text-zinc-800 dark:text-white mt-4">No data yet</Text>
              <Pressable
                className="bg-violet-600 px-8 py-3 rounded-2xl mt-6 active:opacity-80"
                onPress={() => router.push('/two')}
              >
                <Text className="text-white font-inter-bold text-sm">Get Started</Text>
              </Pressable>
            </View>
          ) : (
            grouped.map((group) => (
              <View key={group.type} className="mb-8">
                <View className="flex-row justify-between items-center mb-3 px-1">
                  <View className="flex-row items-center">
                    {TYPE_ICONS[group.type]}
                    <Text className="text-base font-inter-bold text-zinc-800 dark:text-zinc-200 ml-2">{group.label}</Text>
                  </View>
                  <View className="bg-violet-100 dark:bg-violet-500/10 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-mono-bold text-violet-600 dark:text-violet-400">{group.items.length}</Text>
                  </View>
                </View>

                {group.items.map((comp) => (
                  <Pressable
                    key={comp.id}
                    className="flex-row justify-between items-center bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-2.5 border border-zinc-100 dark:border-zinc-800 active:scale-[0.98]"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
                    onPress={() => handleComponentPress(comp)}
                  >
                    <View className="flex-1">
                      <Text className="text-[15px] font-inter-semibold text-zinc-800 dark:text-zinc-100">{comp.name}</Text>
                      <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wider font-inter-medium">
                        {comp.frequency_interval} {comp.frequency_unit}s
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className={`text-base font-mono-bold mr-2 ${
                        comp.type === 'asset' || comp.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {formatCurrency(comp.current_amount)}
                      </Text>
                      <ChevronRight size={16} color={isDark ? '#52525b' : '#d4d4d8'} />
                    </View>
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
      {/* Stress Test Modal */}
      <Modal visible={showStressTest} animationType="fade" transparent>
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="bg-zinc-900 rounded-[32px] border border-zinc-800 overflow-hidden shadow-2xl">
            <View className="p-8 bg-zinc-800/50">
              <View className="flex-row justify-between items-center mb-6">
                <ShieldAlert size={28} color="#FFBF00" strokeWidth={2.5} />
                <Pressable onPress={() => setShowStressTest(false)} className="w-8 h-8 rounded-full bg-white/5 items-center justify-center">
                  <X size={16} color="#52525b" />
                </Pressable>
              </View>
              
              <Text className="text-white text-2xl font-inter-bold">Crisis Simulator</Text>
              <Text className="text-zinc-500 text-sm mt-1 font-inter-medium">Stress test your financial survival capacity.</Text>
            </View>

            <ScrollView className="p-8 space-y-8" contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Survival Countdown */}
              <View className="items-center">
                <View className="w-48 h-48 rounded-full border-4 border-rose-500/20 items-center justify-center">
                  <View className="w-40 h-40 rounded-full bg-rose-500/10 items-center justify-center border border-rose-500/30">
                    <Text className="text-5xl font-mono-bold text-rose-500">{stressResult.survivalDays}</Text>
                    <Text className="text-[10px] font-inter-bold text-rose-400/60 uppercase tracking-[2px] mt-1">DAYS LEFT</Text>
                  </View>
                </View>
                <View className="mt-6 flex-row items-center bg-rose-500/10 px-4 py-2 rounded-xl">
                  <Timer size={14} color="#fb7185" />
                  <Text className="text-rose-400 text-xs font-inter-bold ml-2">Survival with Liquid Assets Only</Text>
                </View>
              </View>

              {/* Fire Sale Impact */}
              <View className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-zinc-100 font-inter-bold">Fire Sale Liquidation</Text>
                  <View className="bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <Text className="text-emerald-400 text-[10px] font-inter-bold">+ {(stressResult.fireSaleDays - stressResult.survivalDays)} DAYS</Text>
                  </View>
                </View>
                <Text className="text-zinc-500 text-xs font-inter-medium mb-4">Masa bertahan jika aset keras (mobil/emas) dijual cepat dengan diskon 20%.</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-3xl font-mono-bold">{stressResult.fireSaleDays}</Text>
                  <Text className="text-zinc-500 text-sm ml-2 font-inter-medium">Days</Text>
                </View>
              </View>

              {/* Dependents Factor */}
              <View className="bg-violet-500/10 p-6 rounded-3xl border border-violet-500/20">
                <View className="flex-row items-center mb-2">
                  <GraduationCap size={16} color="#8b5cf6" />
                  <Text className="text-violet-400 font-inter-bold ml-2">Dependents Risk Factor</Text>
                </View>
                <Text className="text-zinc-400 text-xs font-inter-medium">
                  Setiap anak menambah multiplier risiko 1.5x pada kebutuhan dana cadangan.
                </Text>
                <View className="mt-4 flex-row justify-between">
                  <Text className="text-zinc-500 text-xs font-inter-medium">EF Needed (Safe)</Text>
                  <Text className="text-zinc-100 font-mono-bold">{formatCurrency(stressResult.emergencyFundNeeded)}</Text>
                </View>
              </View>

              {/* Recommendations */}
              <View>
                <View className="flex-row items-center mb-4">
                  <Info size={16} color="#FFBF00" />
                  <Text className="text-zinc-100 font-inter-bold ml-2">Actionable Advice</Text>
                </View>
                {stressResult.recommendations.map((rec, i) => (
                  <View key={i} className="bg-zinc-800 p-4 rounded-2xl mb-2 flex-row items-start border border-zinc-700">
                    <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-3" />
                    <Text className="text-zinc-300 text-xs flex-1 font-inter-medium leading-relaxed">{rec}</Text>
                  </View>
                ))}
                {stressResult.recommendations.length === 0 && (
                  <View className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
                    <Text className="text-emerald-400 text-xs text-center font-inter-medium">Posisi finansial Anda aman untuk 6 bulan ke depan.</Text>
                  </View>
                )}
              </View>

              <Pressable 
                onPress={() => setShowStressTest(false)}
                className="bg-violet-600 py-5 rounded-2xl items-center shadow-lg shadow-violet-600/30 active:opacity-90"
              >
                <Text className="text-white font-inter-bold text-base">Back to Dashboard</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
