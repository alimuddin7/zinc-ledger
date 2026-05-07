/**
 * SQLite Schema & Migrations
 *
 * Tables:
 *  - financial_components: dynamic categories (assets, liabilities, income, expenses)
 *  - financial_records: temporal records using Close-and-Insert pattern
 *
 * Schema versioning uses PRAGMA user_version.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

// Current schema version
export const SCHEMA_VERSION = 5;

/**
 * Component types enum for type safety.
 */
export type ComponentType = 'asset' | 'liability' | 'income' | 'expense';

/**
 * Frequency units for normalization.
 */
export type FrequencyUnit = 'day' | 'week' | 'month' | 'year';

/**
 * TypeScript interfaces matching the DB schema.
 */
export interface FinancialComponent {
  id: number;
  name: string;
  type: ComponentType;
  frequency_interval: number;
  frequency_unit: FrequencyUnit;
  is_liquid: number; // 0 or 1 (SQLite boolean)
  is_short_term: number; // 0 or 1
  is_essential: number; // 0 or 1
  depreciation_rate: number; // e.g. 0.1 for 10%
  monthly_installment: number; // For liabilities: periodic payment
  active_from: string | null;
  active_until: string | null;
  metadata: string | null;
  created_at: string;
}

export interface FinancialRecord {
  id: number;
  component_id: number;
  amount: number;
  start_date: string;
  end_date: string | null;
  note: string | null;
}

/**
 * User Profile for dynamic targets
 */
export interface UserProfile {
  id: number;
  marital_status: 'single' | 'married';
  dependents: number;
  updated_at: string;
}

export interface DependentDetail {
  id: number;
  profile_id: number;
  name: string;
  birth_date: string;
}

/**
 * Combined view for UI display.
 */
export interface ComponentWithBalance extends FinancialComponent {
  current_amount: number;
  record_id: number | null;
}

/**
 * Run all pending migrations.
 * Called from the DatabaseProvider on init.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateV1(db);
  }
  if (currentVersion < 2) {
    await migrateV2(db);
  }
  if (currentVersion < 3) {
    await migrateV3(db);
  }
  if (currentVersion < 4) {
    await migrateV4(db);
  }
  if (currentVersion < 5) {
    await migrateV5(db);
  }
}

/**
 * Migration V1: Create initial tables.
 */
async function migrateV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS financial_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('asset','liability','income','expense')),
      frequency TEXT NOT NULL DEFAULT 'monthly'
        CHECK(frequency IN ('daily','weekly','bimonthly','monthly','yearly')),
      is_liquid INTEGER NOT NULL DEFAULT 0,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_id INTEGER NOT NULL REFERENCES financial_components(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      start_date TEXT NOT NULL DEFAULT (datetime('now')),
      end_date TEXT,
      note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_records_component
      ON financial_records(component_id);

    CREATE INDEX IF NOT EXISTS idx_records_active
      ON financial_records(component_id, end_date)
      WHERE end_date IS NULL;

    PRAGMA user_version = 1;
  `);
}

/**
 * Migration V2: Custom frequencies, dates, and user profile.
 */
async function migrateV2(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE financial_components ADD COLUMN frequency_interval INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE financial_components ADD COLUMN frequency_unit TEXT NOT NULL DEFAULT 'month';
    ALTER TABLE financial_components ADD COLUMN active_from TEXT;
    ALTER TABLE financial_components ADD COLUMN active_until TEXT;

    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      marital_status TEXT NOT NULL DEFAULT 'single',
      dependents INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO user_profile (id, marital_status, dependents) VALUES (1, 'single', 0);

    PRAGMA user_version = 2;
  `);
}

/**
 * Migration V3: Financial classification and depreciation.
 */
async function migrateV3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE financial_components ADD COLUMN is_short_term INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE financial_components ADD COLUMN depreciation_rate REAL NOT NULL DEFAULT 0;

    PRAGMA user_version = 3;
  `);
}

/**
 * Migration V4: Detailed dependents for Education Reserve.
 */
async function migrateV4(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dependents_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL DEFAULT 1,
      name TEXT,
      birth_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    PRAGMA user_version = 4;
  `);
}

/**
 * Migration V5: Installment amounts for Liabilities.
 */
async function migrateV5(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE financial_components ADD COLUMN monthly_installment REAL NOT NULL DEFAULT 0;
    PRAGMA user_version = 5;
  `);
}


