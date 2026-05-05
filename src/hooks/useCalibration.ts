/**
 * useCalibration Hook
 *
 * Implements the Close-and-Insert (temporal) workflow for balance updates.
 * Per calibration.md:
 *  1. Find active record (end_date IS NULL) for the component
 *  2. Close it by setting end_date = now
 *  3. Insert new record with new amount and start_date = now
 */

import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useAppStore } from '../store/useAppStore';

interface CalibrationResult {
  success: boolean;
  error?: string;
}

export function useCalibration() {
  const db = useSQLiteContext();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const setOptimistic = useAppStore((s) => s.setOptimisticBalance);

  /**
   * Perform a balance calibration using Close-and-Insert pattern.
   * Runs inside a transaction for atomicity.
   */
  const calibrate = useCallback(
    async (componentId: number, newAmount: number, note?: string): Promise<CalibrationResult> => {
      // Optimistic Update
      setOptimistic(componentId, newAmount);
      setIsCalibrating(true);

      try {
        await db.withTransactionAsync(async () => {
          // Step 1: Close the active record
          await db.runAsync(
            `UPDATE financial_records
             SET end_date = datetime('now')
             WHERE component_id = ? AND end_date IS NULL`,
            [componentId]
          );

          // Step 2: Insert new record with updated amount
          await db.runAsync(
            `INSERT INTO financial_records (component_id, amount, start_date, note)
             VALUES (?, ?, datetime('now'), ?)`,
            [componentId, newAmount, note ?? null]
          );
        });

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[useCalibration] Error:', message);
        return { success: false, error: message };
      } finally {
        setIsCalibrating(false);
      }
    },
    [db]
  );

  return { calibrate, isCalibrating };
}
