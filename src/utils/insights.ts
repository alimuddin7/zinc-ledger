/**
 * Insight Engine: Lifestyle Inflation Detector
 * Compares Growth Rate of Income vs Expenses from history.
 */
import { NetWorthPoint } from '../hooks/useFinancials';

export interface InflationResult {
  hasInflation: boolean;
  incomeGrowth: number;
  expenseGrowth: number;
  severity: 'low' | 'medium' | 'high';
}

export function detectLifestyleInflation(history: NetWorthPoint[]): InflationResult | null {
  // Need at least 2 points with income/expense to compare
  const validPoints = history.filter(p => p.income !== undefined && p.expense !== undefined);
  if (validPoints.length < 2) return null;

  const first = validPoints[0];
  const last = validPoints[validPoints.length - 1];

  // Calculate total growth over the period
  const incomeGrowth = first.income && first.income > 0 
    ? (last.income! - first.income) / first.income 
    : 0;
    
  const expenseGrowth = first.expense && first.expense > 0 
    ? (last.expense! - first.expense) / first.expense 
    : 0;

  const hasInflation = expenseGrowth > incomeGrowth && expenseGrowth > 0.05; // 5% minimum movement
  
  let severity: 'low' | 'medium' | 'high' = 'low';
  const diff = expenseGrowth - incomeGrowth;
  
  if (diff > 0.20) severity = 'high';
  else if (diff > 0.10) severity = 'medium';

  return {
    hasInflation,
    incomeGrowth,
    expenseGrowth,
    severity
  };
}
