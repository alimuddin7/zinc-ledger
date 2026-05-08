/**
 * Database Provider
 *
 * Wraps the app with expo-sqlite's SQLiteProvider.
 * Handles initialization, migrations, and seeding.
 */

import React, { Suspense } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { runMigrations } from './schema';
import { seedDatabase } from './seed';
import { Colors } from '../constants/theme';

const DB_NAME = 'financial_ledger.db';

/**
 * Initialize DB: run migrations then seed.
 */
async function initDatabase(db: import('expo-sqlite').SQLiteDatabase) {
  // WAL mode is excellent for native, but can cause NoModificationAllowedError on Web (OPFS)
  if (Platform.OS !== 'web') {
    await db.execAsync('PRAGMA journal_mode = WAL');
  } else {
    // On web, we use a simpler journal mode to avoid locking issues with OPFS
    await db.execAsync('PRAGMA journal_mode = DELETE');
  }
  
  await db.execAsync('PRAGMA foreign_keys = ON');

  await runMigrations(db);
  await seedDatabase(db);
}

function LoadingFallback() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

interface Props {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: Props) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SQLiteProvider databaseName={DB_NAME} onInit={initDatabase}>
        {children}
      </SQLiteProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
  },
});
