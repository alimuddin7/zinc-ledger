/**
 * Stress Test Engine (Crisis Simulator)
 */
import { ComponentWithBalance } from '../database/schema';

export interface StressTestResult {
  survivalDays: number;
  fireSaleDays: number;
  dailyEssentialBurn: number;
  emergencyFundNeeded: number;
  recommendations: string[];
}

export function calculateStressTest(
  components: ComponentWithBalance[], 
  dependents: number = 0
): StressTestResult {
  let liquidAssets = 0;
  let nonLiquidAssets: { name: string; amount: number }[] = [];
  let dailyEssentialBurn = 0;

  // Multiplier from rules: 1.5x per kid for emergency needs
  const riskMultiplier = 1 + (dependents * 0.5);

  components.forEach(c => {
    if (c.type === 'asset') {
      if (c.is_liquid) liquidAssets += c.current_amount;
      else nonLiquidAssets.push({ name: c.name, amount: c.current_amount });
    } else if (c.type === 'expense' && c.is_essential) {
      // Normalize to daily
      const monthly = normalizeToMonthly(c.current_amount, c.frequency_interval, c.frequency_unit);
      dailyEssentialBurn += monthly / 30.44;
    }
  });

  const survivalDays = dailyEssentialBurn > 0 ? liquidAssets / dailyEssentialBurn : 9999;
  
  // Fire Sale: Non-liquid sold at 20% discount
  const fireSaleValue = nonLiquidAssets.reduce((acc, a) => acc + (a.amount * 0.8), 0);
  const fireSaleDays = dailyEssentialBurn > 0 ? (liquidAssets + fireSaleValue) / dailyEssentialBurn : 9999;

  // Emergency Fund Needed (based on monthly burn * risk multiplier * 6 months default)
  const monthlyBurn = dailyEssentialBurn * 30.44;
  const emergencyFundNeeded = monthlyBurn * 6 * riskMultiplier;

  const recommendations: string[] = [];
  if (survivalDays < 180) { // Less than 6 months
    const neededDays = 180 - survivalDays;
    const neededAmount = neededDays * dailyEssentialBurn;
    
    // Find best asset to sell
    const bestAsset = nonLiquidAssets.sort((a, b) => b.amount - a.amount).find(a => a.amount * 0.8 >= neededAmount);
    if (bestAsset) {
      recommendations.push(`Jual aset ${bestAsset.name} untuk menambah masa bertahan hingga 6 bulan.`);
    } else if (nonLiquidAssets.length > 0) {
      recommendations.push(`Pertimbangkan melikuidasi beberapa aset non-likuid untuk memperpanjang masa bertahan.`);
    }
  }

  return {
    survivalDays: Math.floor(survivalDays),
    fireSaleDays: Math.floor(fireSaleDays),
    dailyEssentialBurn,
    emergencyFundNeeded,
    recommendations
  };
}

// Helper (re-implemented to avoid circular deps if needed, or import from useFinancials)
const NORMALIZE_TO_MONTHLY: Record<string, number> = {
  day: 30.44,
  week: 4.33,
  month: 1,
  year: 1 / 12,
};

function normalizeToMonthly(amount: number, interval: number, unit: string): number {
  const multiplier = NORMALIZE_TO_MONTHLY[unit] ?? 1;
  const intervalVal = Math.max(1, interval);
  return (amount / intervalVal) * multiplier;
}
