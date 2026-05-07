/**
 * Simulation Mode (What-If Sandbox)
 * 
 * Allows users to project asset purchases, debt impact, and DSR changes
 * in a dedicated sandbox environment.
 */
import React from 'react';
import { ScrollView, View, Text, Pressable, StatusBar, TextInput, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinancials } from '@/src/hooks/useFinancials';
import { useAppStore } from '@/src/store/useAppStore';
import { HeroCard } from '@/src/components/HeroCard';
import { 
  Zap, Info, TrendingUp, TrendingDown, 
  Calculator, PieChart, Activity
} from 'lucide-react-native';

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} Mlyr`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(1)} Rb`;
  return `Rp ${n.toFixed(0)}`;
}

export default function SimulationScreen() {
  const { summary } = useFinancials();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { 
    isSimActive, setSimActive,
    simPurchase, setSimPurchase,
    simType, setSimType,
    simTenor, setSimTenor,
    simRate, setSimRate
  } = useAppStore();

  // Simulation Logic
  const simMonthlyInstallment = (isSimActive && simType === 'debt' && simPurchase > 0)
    ? (simPurchase + (simPurchase * (simRate / 100) * (simTenor / 12))) / simTenor
    : 0;

  const projectedDSR = summary.totalIncome > 0 
    ? (summary.totalMonthlyInstallment + simMonthlyInstallment) / summary.totalIncome 
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
        <View className="px-6 pt-16 pb-2">
          <Text className="text-white/60 text-[11px] font-inter-semibold uppercase tracking-[2px]">Sandbox</Text>
          <Text className="text-white text-2xl font-inter-bold mt-0.5">Financial Simulator</Text>
        </View>

        <View className="h-4" />

        <HeroCard
          balance={formatCurrency(isSimActive && simPurchase > 0 ? simulatedNetWorth : summary.netWorth)}
          assets={formatCurrency(summary.totalAssets + (isSimActive && simPurchase > 0 ? simPurchase : 0))}
          liabilities={formatCurrency(summary.totalLiabilities + (isSimActive && simType === 'debt' ? simPurchase : 0))}
          trend={0}
        />

        <View className="px-5 mt-8">
          <View className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <View className="flex-row justify-between items-center mb-8">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-500/10 items-center justify-center mr-4">
                  <Calculator size={20} color="#7c3aed" />
                </View>
                <View>
                  <Text className="text-zinc-800 dark:text-zinc-100 font-inter-bold text-base">What-If Scenario</Text>
                  <Text className="text-[10px] text-zinc-400 uppercase tracking-wider font-inter-medium mt-0.5">Asset Purchase Project</Text>
                </View>
              </View>
              <Pressable 
                onPress={() => setSimActive(!isSimActive)}
                className={`w-12 h-6 rounded-full px-1 justify-center ${isSimActive ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
              >
                <View className={`w-4 h-4 rounded-full bg-white shadow-sm ${isSimActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </Pressable>
            </View>

            <View className={isSimActive ? 'opacity-100' : 'opacity-40'}>
              {/* Asset Price */}
              <View className="bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-5 mb-6 border border-zinc-200 dark:border-zinc-700">
                <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">Price of Asset (Rp)</Text>
                <TextInput
                  className="text-2xl text-zinc-900 dark:text-white font-mono-bold"
                  value={simPurchase.toString()}
                  onChangeText={(t) => isSimActive && setSimPurchase(parseInt(t.replace(/[^0-9]/g, '')) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                  editable={isSimActive}
                />
              </View>

              {/* Purchase Mode */}
              <View className="flex-row mb-8 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                <Pressable 
                  onPress={() => isSimActive && setSimType('cash')}
                  className={`flex-1 py-3 rounded-xl items-center ${simType === 'cash' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                >
                  <Text className={`text-[11px] font-inter-bold ${simType === 'cash' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>CASH PURCHASE</Text>
                </Pressable>
                <Pressable 
                  onPress={() => isSimActive && setSimType('debt')}
                  className={`flex-1 py-3 rounded-xl items-center ${simType === 'debt' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
                >
                  <Text className={`text-[11px] font-inter-bold ${simType === 'debt' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>TAKE A LOAN</Text>
                </Pressable>
              </View>

              {simType === 'debt' && (
                <View className="flex-row gap-4 mb-8">
                  <View className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-700">
                    <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">Tenor (Months)</Text>
                    <TextInput
                      className="text-2xl text-zinc-900 dark:text-white font-mono-bold"
                      value={simTenor.toString()}
                      onChangeText={(t) => isSimActive && setSimTenor(parseInt(t.replace(/[^0-9]/g, '')) || 0)}
                      keyboardType="numeric"
                      editable={isSimActive}
                    />
                  </View>
                  <View className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-700">
                    <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">Interest (% p.a)</Text>
                    <TextInput
                      className="text-2xl text-zinc-900 dark:text-white font-mono-bold"
                      value={simRate.toString()}
                      onChangeText={(t) => isSimActive && setSimRate(parseFloat(t) || 0)}
                      keyboardType="numeric"
                      editable={isSimActive}
                    />
                  </View>
                </View>
              )}

              {/* Results / Impact */}
              {isSimActive && simPurchase > 0 && (
                <View className="mt-4 p-6 bg-violet-600 rounded-3xl shadow-xl shadow-violet-600/40">
                   <View className="flex-row items-center mb-6">
                      <Activity size={18} color="#fff" strokeWidth={2.5} />
                      <Text className="text-white font-inter-bold ml-3">Impact Analysis</Text>
                   </View>

                   {simType === 'debt' ? (
                     <View className="space-y-6">
                        <View>
                           <Text className="text-white/60 text-[10px] font-inter-bold uppercase tracking-wider mb-1">Estimated Monthly Bill</Text>
                           <Text className="text-white text-3xl font-mono-bold">{formatCurrency(simMonthlyInstallment)}</Text>
                        </View>
                        <View className="flex-row justify-between pt-4 border-t border-white/10">
                           <View>
                              <Text className="text-white/60 text-[10px] font-inter-bold uppercase tracking-wider mb-1">Projected DSR</Text>
                              <Text className={`text-xl font-mono-bold ${projectedDSR > 0.35 ? 'text-amber-300' : 'text-emerald-300'}`}>
                                {(projectedDSR * 100).toFixed(1)}%
                              </Text>
                           </View>
                           <View className="items-end">
                              <Text className="text-white/60 text-[10px] font-inter-bold uppercase tracking-wider mb-1">Status</Text>
                              <Text className={`text-xs font-inter-bold uppercase ${projectedDSR > 0.35 ? 'text-amber-300' : 'text-emerald-300'}`}>
                                {projectedDSR > 0.35 ? '⚠️ Risky' : '✅ Safe'}
                              </Text>
                           </View>
                        </View>
                     </View>
                   ) : (
                     <View className="space-y-6">
                        <View>
                           <Text className="text-white/60 text-[10px] font-inter-bold uppercase tracking-wider mb-1">Remaining Liquid Assets</Text>
                           <Text className="text-white text-3xl font-mono-bold">{formatCurrency(simulatedLiquid)}</Text>
                        </View>
                        <View className="pt-4 border-t border-white/10">
                           <Text className="text-white/80 text-xs font-inter-medium leading-relaxed">
                             {simulatedLiquid < summary.totalMonthlyOutflow * 3 
                               ? '⚠️ Warning: Pembelian tunai ini akan menguras dana likuid Anda di bawah batas aman 3 bulan.' 
                               : '✅ Safe: Anda masih memiliki dana likuid yang cukup setelah pembelian tunai ini.'}
                           </Text>
                        </View>
                     </View>
                   )}
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="px-5 mt-8">
           <View className="flex-row items-center mb-4 ml-1">
              <Info size={16} color="#a1a1aa" />
              <Text className="text-zinc-400 text-[11px] font-inter-bold uppercase tracking-[2px] ml-2">How it works</Text>
           </View>
           <Text className="text-zinc-500 text-xs font-inter-medium leading-relaxed px-1">
             Sandbox Simulator membantu Anda memproyeksikan keputusan besar sebelum mengeksekusinya. 
             Aktifkan saklar untuk melihat dampak instan pada Net Worth dan rasio kesehatan finansial (DSR) Anda. 
             Semua data di layar ini bersifat sementara dan tidak akan mengubah catatan asli Anda.
           </Text>
        </View>
      </ScrollView>
    </View>
  );
}
