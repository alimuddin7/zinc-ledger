import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { UserProfile, DependentDetail } from '../database/schema';

export function useProfile() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [children, setChildren] = useState<DependentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const row = await db.getFirstAsync<UserProfile>('SELECT * FROM user_profile WHERE id = 1');
      if (row) {
        setProfile(row);
      }
      const childrenRows = await db.getAllAsync<DependentDetail>('SELECT * FROM dependents_details WHERE profile_id = 1');
      setChildren(childrenRows);
    } catch (e) {
      console.error('[useProfile] fetch error', e);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      const maritalStatus = updates.marital_status ?? profile?.marital_status ?? 'single';
      const dependents = updates.dependents ?? profile?.dependents ?? 0;

      await db.runAsync(
        `UPDATE user_profile SET marital_status = ?, dependents = ?, updated_at = datetime('now') WHERE id = 1`,
        [maritalStatus, dependents]
      );
      await fetchProfile();
      return { success: true };
    } catch (e) {
      console.error('[useProfile] update error', e);
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [db, profile, fetchProfile]);

  const addChild = useCallback(async (name: string, birthDate: string) => {
    try {
      await db.runAsync('INSERT INTO dependents_details (name, birth_date) VALUES (?, ?)', [name, birthDate]);
      await fetchProfile();
    } catch (e) {
      console.error('[useProfile] addChild error', e);
    }
  }, [db, fetchProfile]);

  const removeChild = useCallback(async (id: number) => {
    try {
      await db.runAsync('DELETE FROM dependents_details WHERE id = ?', [id]);
      await fetchProfile();
    } catch (e) {
      console.error('[useProfile] removeChild error', e);
    }
  }, [db, fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, children, isLoading, updateProfile, addChild, removeChild, refetch: fetchProfile };
}
