/**
 * CalibrationModal — Quick balance update using Close-and-Insert pattern.
 * Shows current value, accepts new amount, runs atomic transaction.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCalibration } from '../hooks/useCalibration';
import { useAppStore } from '../store/useAppStore';

interface CalibrationModalContentProps {
  onComplete: () => void;
  onCancel: () => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function formatDisplayNumber(text: string): string {
  const clean = text.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function CalibrationModalContent({ onComplete, onCancel }: CalibrationModalContentProps) {
  const target = useAppStore((s) => s.calibrationTarget);
  const { calibrate, isCalibrating } = useCalibration();
  const db = useSQLiteContext();

  const [inputValue, setInputValue] = useState(target ? formatDisplayNumber(target.amount.toString()) : '0');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ amount: number; start_date: string }[]>([]);

  useEffect(() => {
    if (target) {
      db.getAllAsync<{ amount: number; start_date: string }>(
        'SELECT amount, start_date FROM financial_records WHERE component_id = ? ORDER BY start_date DESC',
        [target.id]
      ).then((rows) => setHistory(rows));
    }
  }, [target, db]);

  if (!target) return null;

  const handleSubmit = async () => {
    const numericValue = parseFloat(inputValue.replace(/\./g, ''));
    if (isNaN(numericValue)) {
      setError('Please enter a valid number');
      return;
    }

    const result = await calibrate(target.id, numericValue);
    if (result.success) {
      onComplete();
    } else {
      setError(result.error ?? 'Calibration failed');
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-inter-bold text-zinc-900 dark:text-zinc-50">Calibrate Balance</Text>
          <Text className="text-base text-violet-600 dark:text-violet-400 font-inter-medium mt-1">{target.name}</Text>
        </View>

        {/* Current Value */}
        <View className="bg-white dark:bg-zinc-900 rounded-2xl p-6 items-center border border-zinc-200 dark:border-zinc-800">
          <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Current Value</Text>
          <Text className="text-3xl font-mono-bold text-zinc-900 dark:text-zinc-100 mt-2">{formatCurrency(target.amount)}</Text>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
          <Text className="mx-4 text-violet-500 text-lg">↓</Text>
          <View className="flex-1 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
        </View>

        {/* New Value Input */}
        <View className="mb-8">
          <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 ml-1">New Value</Text>
          <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-2xl border-2 border-violet-600/50 dark:border-violet-400/30 px-4">
            <Text className="text-xl text-zinc-400 font-inter-bold mr-2">Rp</Text>
            <TextInput
              className="flex-1 text-2xl font-mono-bold text-zinc-900 dark:text-zinc-50 py-4"
              value={inputValue}
              onChangeText={(text) => {
                setError(null);
                setInputValue(formatDisplayNumber(text));
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#94a3b8"
              autoFocus
              selectTextOnFocus
            />
          </View>
          {error && <Text className="text-rose-500 text-sm font-inter-medium mt-2 ml-1">{error}</Text>}
        </View>

        {/* Actions */}
        <View className="flex-row space-x-4 mb-10">
          <Pressable
            className="flex-1 bg-zinc-200 dark:bg-zinc-800 py-4 rounded-xl items-center active:opacity-70"
            onPress={handleCancel}
          >
            <Text className="text-zinc-600 dark:text-zinc-300 font-inter-bold text-base">Cancel</Text>
          </Pressable>
          <Pressable
            className="flex-[2] bg-violet-600 py-4 rounded-xl items-center ml-4 active:opacity-70"
            onPress={handleSubmit}
            disabled={isCalibrating}
          >
            {isCalibrating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white dark:text-zinc-950 font-inter-bold text-base">Update</Text>
            )}
          </Pressable>
        </View>

        {/* History */}
        {history.length > 0 && (
          <View className="mt-4 pb-10">
            <Text className="text-base font-inter-bold text-zinc-900 dark:text-zinc-50 mb-3">Calibration History</Text>
            <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {history.map((record, index) => (
                <View 
                  key={index} 
                  className={`flex-row justify-between p-4 ${index !== history.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}`}
                >
                  <Text className="text-zinc-500 dark:text-zinc-400 text-sm font-inter-medium">{new Date(record.start_date).toLocaleDateString()}</Text>
                  <Text className="text-zinc-900 dark:text-zinc-50 text-sm font-mono-bold">{formatCurrency(record.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
