/**
 * Seed Data
 *
 * Inserts default financial components and initial zero-balance records.
 * Only runs when the database is freshly created (no existing components).
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { ComponentType, FrequencyUnit } from './schema';

interface SeedComponent {
  name: string;
  type: ComponentType;
  frequency_interval: number;
  frequency_unit: FrequencyUnit;
  is_liquid: number;
}

const DEFAULT_COMPONENTS: SeedComponent[] = [
  // Assets — Liquid
  { name: 'Cash',          type: 'asset',     frequency_interval: 1, frequency_unit: 'month', is_liquid: 1 },
  { name: 'Bank Account',  type: 'asset',     frequency_interval: 1, frequency_unit: 'month', is_liquid: 1 },
  { name: 'Investment',    type: 'asset',     frequency_interval: 1, frequency_unit: 'month', is_liquid: 1 },
  // Assets — Non-Liquid
  { name: 'Property',      type: 'asset',     frequency_interval: 1, frequency_unit: 'month', is_liquid: 0 },
  // Liabilities
  { name: 'Credit Card',   type: 'liability', frequency_interval: 1, frequency_unit: 'month', is_liquid: 0 },
  { name: 'Loan',          type: 'liability', frequency_interval: 1, frequency_unit: 'month', is_liquid: 0 },
  // Income
  { name: 'Salary',        type: 'income',    frequency_interval: 1, frequency_unit: 'month', is_liquid: 0 },
  // Expenses
  { name: 'Food',          type: 'expense',   frequency_interval: 1, frequency_unit: 'month', is_liquid: 0 },
  { name: 'Electricity',   type: 'expense',   frequency_interval: 1, frequency_unit: 'month', is_liquid: 0 },
  { name: 'Transport',     type: 'expense',   frequency_interval: 1, frequency_unit: 'month', is_liquid: 0 },
];

/**
 * Seeds the database with default components if none exist.
 */
export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  // Check if already seeded
  const count = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM financial_components'
  );

  if (count && count.cnt > 0) {
    return; // Already has data
  }

  for (const comp of DEFAULT_COMPONENTS) {
    const result = await db.runAsync(
      `INSERT INTO financial_components (name, type, frequency_interval, frequency_unit, is_liquid)
       VALUES (?, ?, ?, ?, ?)`,
      [comp.name, comp.type, comp.frequency_interval, comp.frequency_unit, comp.is_liquid]
    );

    // Create initial record with 0 amount
    await db.runAsync(
      `INSERT INTO financial_records (component_id, amount, start_date)
       VALUES (?, 0, datetime('now'))`,
      [result.lastInsertRowId]
    );
  }
}
