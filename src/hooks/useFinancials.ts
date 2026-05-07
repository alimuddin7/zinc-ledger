/**
 * useFinancials Hook
 *
 * Core hook that queries SQLite and applies the Normalization Engine.
 * Computes: Net Worth, Savings Rate, Emergency Fund Ratio, Debt-to-Asset Ratio.
 * Also provides historical net worth data for charting.
 *
 * Architecture: Data pulled directly from SQLite via this hook (not Zustand).
 */

import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useAppStore } from '../store/useAppStore';
import { useProfile } from './useProfile';
import type { ComponentWithBalance, ComponentType } from '../database/schema';

/**
 * Normalization multipliers to convert any frequency to monthly.
 * Per precision.md rules.
 */
const NORMALIZE_TO_MONTHLY: Record<string, number> = {
  day: 30.44,
  week: 4.33,
  month: 1,
  year: 1 / 12,
};

export interface FinancialSummary {
  netWorth: number;
  liquidNetWorth: number;
  savingsRate: number;
  dsr: number; // Debt Service Ratio
  debtToAssetRatio: number;
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  totalMonthlyAssets: number; // Monthly growth/interest
  totalMonthlyInstallment: number; // Monthly installments
  totalMonthlyOutflow: number; // Expenses + Installments
  liquidAssets: number;
  shortTermLiabilities: number;
  educationReserve: number;
}

export interface NetWorthPoint {
  date: string;
  value: number;
  income?: number;
  expense?: number;
}

export interface UseFinancialsReturn {
  isLoading: boolean;
  summary: FinancialSummary;
  components: ComponentWithBalance[];
  netWorthHistory: NetWorthPoint[];
  alerts: { type: 'red' | 'yellow'; message: string; suggestion: string }[];
  isNetWorthDeclining: boolean;
  refetch: () => Promise<void>;
  deleteComponent: (id: number) => Promise<void>;
}

function normalizeToMonthly(amount: number, interval: number, unit: string): number {
  const multiplier = NORMALIZE_TO_MONTHLY[unit] ?? 1;
  // If interval is 2 and unit is month, it happens every 2 months, so per month it's amount / 2
  const intervalVal = Math.max(1, interval);
  return (amount / intervalVal) * multiplier;
}

/**
 * Groups components by type and returns normalized totals.
 * Only includes components that are currently active (today is within active_from/until).
 */
function computeSummary(components: ComponentWithBalance[]): FinancialSummary {
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalIncome = 0;
  let totalExpenses = 0;
  let liquidAssets = 0;
  let shortTermLiabilities = 0;
  let totalMonthlyAssets = 0;
  let totalMonthlyInstallment = 0;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const comp of components) {
    // Check if component is active today
    const isActive = (!comp.active_from || comp.active_from <= todayStr) && 
                     (!comp.active_until || comp.active_until >= todayStr);
    
    if (!isActive) continue;

    const monthlyAmount = normalizeToMonthly(comp.current_amount, comp.frequency_interval, comp.frequency_unit);

    switch (comp.type) {
      case 'asset':
        totalAssets += comp.current_amount;
        if (comp.is_liquid) {
          liquidAssets += comp.current_amount;
        }
        // Monthly growth (if rate is 5% annual, monthly is balance * 0.05 / 12)
        if (comp.depreciation_rate !== 0) {
          totalMonthlyAssets += (comp.current_amount * comp.depreciation_rate) / 12;
        }
        break;
      case 'liability':
        totalLiabilities += comp.current_amount;
        if (comp.is_short_term) {
          shortTermLiabilities += comp.current_amount;
        }
        // Use monthly_installment for DSR, not the total balance
        totalMonthlyInstallment += comp.monthly_installment;
        break;
      case 'income':
        totalIncome += monthlyAmount;
        break;
      case 'expense':
        totalExpenses += monthlyAmount;
        break;
    }
  }

  const netWorth = totalAssets - totalLiabilities;
  const liquidNetWorth = liquidAssets - shortTermLiabilities;
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  const dsr = totalIncome > 0 ? totalMonthlyInstallment / totalIncome : 0;
  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  const totalMonthlyOutflow = totalExpenses + totalMonthlyInstallment;

  return {
    netWorth,
    liquidNetWorth,
    savingsRate,
    dsr,
    debtToAssetRatio,
    totalAssets,
    totalLiabilities,
    totalIncome,
    totalExpenses,
    totalMonthlyAssets,
    totalMonthlyInstallment,
    totalMonthlyOutflow,
    liquidAssets,
    shortTermLiabilities,
    educationReserve: 0,
  };
}

export function useFinancials(): UseFinancialsReturn {
  const db = useSQLiteContext();
  const optimisticBalances = useAppStore((s) => s.optimisticBalances);
  const [isLoading, setIsLoading] = useState(true);
  const [dbComponents, setDbComponents] = useState<ComponentWithBalance[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthPoint[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all components with their current (active) balance
      const rows = await db.getAllAsync<ComponentWithBalance & { start_date: string }>(`
        SELECT
          c.*,
          COALESCE(r.amount, 0) as current_amount,
          r.id as record_id,
          r.start_date
        FROM financial_components c
        LEFT JOIN financial_records r
          ON r.component_id = c.id AND r.end_date IS NULL
        ORDER BY c.type, c.name
      `);

      const now = new Date();
      const processedRows = rows.map(comp => {
        // Apply appreciation/depreciation for assets (e.g. 10% per year)
        // Positive rate = Growth (Appreciation), Negative rate = Loss (Depreciation)
        if (comp.type === 'asset' && comp.depreciation_rate !== 0 && comp.start_date) {
          const startDate = new Date(comp.start_date);
          const yearsDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (yearsDiff > 0) {
            // New formula: 1 + rate. So 5% growth is 1.05, 10% loss is 0.90
            const updatedAmount = comp.current_amount * Math.pow(1 + comp.depreciation_rate, yearsDiff);
            return { ...comp, current_amount: updatedAmount };
          }
        }
        return comp;
      });

      setDbComponents(processedRows);

      // Build net worth history from closed + active records
      // Group by date, compute cumulative net worth at each point
      const historyRows = await db.getAllAsync<{
        snapshot_date: string;
        asset_total: number;
        liability_total: number;
        income_total: number;
        expense_total: number;
      }>(`
        WITH record_events AS (
          SELECT
            date(r.start_date) as event_date,
            c.type,
            c.frequency_interval,
            c.frequency_unit,
            r.amount
          FROM financial_records r
          JOIN financial_components c ON c.id = r.component_id
        ),
        distinct_dates AS (
          SELECT DISTINCT event_date FROM record_events ORDER BY event_date
        ),
        snapshots AS (
          SELECT
            dd.event_date as snapshot_date,
            COALESCE(SUM(
              CASE WHEN c.type = 'asset'
              THEN (
                SELECT fr.amount FROM financial_records fr
                WHERE fr.component_id = c.id
                  AND date(fr.start_date) <= dd.event_date
                  AND (fr.end_date IS NULL OR date(fr.end_date) > dd.event_date)
                LIMIT 1
              ) ELSE 0 END
            ), 0) as asset_total,
            COALESCE(SUM(
              CASE WHEN c.type = 'liability'
              THEN (
                SELECT fr.amount FROM financial_records fr
                WHERE fr.component_id = c.id
                  AND date(fr.start_date) <= dd.event_date
                  AND (fr.end_date IS NULL OR date(fr.end_date) > dd.event_date)
                LIMIT 1
              ) ELSE 0 END
            ), 0) as liability_total,
            COALESCE(SUM(
              CASE WHEN c.type = 'income'
              THEN (
                SELECT fr.amount FROM financial_records fr
                WHERE fr.component_id = c.id
                  AND date(fr.start_date) <= dd.event_date
                  AND (fr.end_date IS NULL OR date(fr.end_date) > dd.event_date)
                LIMIT 1
              ) ELSE 0 END
            ), 0) as income_total,
            COALESCE(SUM(
              CASE WHEN c.type = 'expense'
              THEN (
                SELECT fr.amount FROM financial_records fr
                WHERE fr.component_id = c.id
                  AND date(fr.start_date) <= dd.event_date
                  AND (fr.end_date IS NULL OR date(fr.end_date) > dd.event_date)
                LIMIT 1
              ) ELSE 0 END
            ), 0) as expense_total
          FROM distinct_dates dd
          CROSS JOIN financial_components c
          GROUP BY dd.event_date
        )
        SELECT * FROM snapshots ORDER BY snapshot_date
      `);

      const history: NetWorthPoint[] = historyRows.map(row => ({
        date: row.snapshot_date,
        value: row.asset_total - row.liability_total,
        income: row.income_total,
        expense: row.expense_total,
      }));

      setNetWorthHistory(history);
    } catch (error) {
      console.error('[useFinancials] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Merge optimistic balances
  const components = dbComponents.map((comp) => ({
    ...comp,
    current_amount: optimisticBalances[comp.id] ?? comp.current_amount,
  }));

  const summary = computeSummary(components);
  const { profile, children } = useProfile();

  // Health Check: Net Worth down 3 points consecutively
  const isNetWorthDeclining = netWorthHistory.length >= 3 &&
    netWorthHistory[netWorthHistory.length - 1].value < netWorthHistory[netWorthHistory.length - 2].value &&
    netWorthHistory[netWorthHistory.length - 2].value < netWorthHistory[netWorthHistory.length - 3].value;

  const alerts: { type: 'red' | 'yellow'; message: string; suggestion: string }[] = [];
  
  // EF Target Logic from rules
  let efTarget = 6;
  if (profile?.marital_status === 'married') {
    efTarget = profile.dependents > 0 ? 12 + profile.dependents : 9;
  }
  const efRatio = summary.totalExpenses > 0 ? summary.liquidAssets / summary.totalExpenses : 0;

  if (summary.dsr > 0.35) {
    alerts.push({ 
      type: 'red', 
      message: 'DSR > 35%: Beban hutang terlalu tinggi!',
      suggestion: 'Saran: Kurangi cicilan baru atau lunasi hutang bunga tinggi lebih awal.'
    });
  }
  
  if (summary.savingsRate < 0) {
    alerts.push({ 
      type: 'red', 
      message: 'Savings Rate < 0%: Defisit Bulanan!',
      suggestion: 'Saran: Evaluasi pengeluaran gaya hidup atau cari pendapatan tambahan.'
    });
  }
  
  const srThreshold = profile?.marital_status === 'married' ? 0.15 : 0.10;
  if (summary.savingsRate < srThreshold && summary.savingsRate >= 0) {
    alerts.push({ 
      type: 'yellow', 
      message: `Tabungan < ${srThreshold * 100}%: Di bawah batas aman.`,
      suggestion: 'Saran: Otomatisasi tabungan di awal bulan tepat setelah gajian.'
    });
  }

  if (efRatio < efTarget * 0.5) {
    alerts.push({ 
      type: 'yellow', 
      message: `Dana Darurat < 50% dari Target (${efTarget}x).`,
      suggestion: 'Saran: Prioritaskan pengisian Dana Darurat sebelum berinvestasi.'
    });
  }

  // Future DSR Warning
  const todayStr = new Date().toISOString().split('T')[0];
  let futureMonthlyDebt = 0;
  for (const comp of components) {
    if (comp.type === 'liability' && comp.active_from && comp.active_from > todayStr) {
      futureMonthlyDebt += comp.monthly_installment;
    }
  }
  
  if (futureMonthlyDebt > 0 && summary.totalIncome > 0) {
    const activeDebt = summary.dsr * summary.totalIncome;
    const projectedDsr = (activeDebt + futureMonthlyDebt) / summary.totalIncome;
    if (projectedDsr > 0.35) {
      alerts.push({ 
        type: 'yellow', 
        message: `Waspada: DSR akan menjadi ${(projectedDsr * 100).toFixed(0)}% di masa depan.`,
        suggestion: 'Saran: Tunda cicilan baru atau pelajari restrukturisasi hutang.'
      });
    }
  }

  if (isNetWorthDeclining) {
    alerts.push({ 
      type: 'yellow', 
      message: 'Kekayaan Bersih turun 3 bulan berturut-turut.',
      suggestion: 'Saran: Periksa apakah ada penurunan nilai aset atau biaya tak terduga.'
    });
  }

  // Education Reserve Calculation
  const educationReserve = children.reduce((acc, child) => {
    const birth = new Date(child.birth_date);
    const age = new Date().getFullYear() - birth.getFullYear();
    const targets = [7, 12, 15, 18];
    const nextTarget = targets.find(t => t > age);
    
    if (nextTarget) {
      const yearsToTarget = nextTarget - age;
      const currentCost = 50_000_000; // Default base cost (e.g. 50M IDR)
      const futureCost = currentCost * Math.pow(1.10, yearsToTarget);
      return acc + futureCost;
    }
    return acc;
  }, 0);

  summary.educationReserve = educationReserve;

  const deleteComponent = useCallback(async (id: number) => {
    try {
      await db.runAsync('DELETE FROM financial_components WHERE id = ?', [id]);
      await fetchData();
    } catch (e) {
      console.error('Error deleting component:', e);
    }
  }, [db, fetchData]);

  return {
    isLoading,
    summary,
    components,
    netWorthHistory,
    alerts,
    isNetWorthDeclining,
    refetch: fetchData,
    deleteComponent,
  };
}
