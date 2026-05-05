/**
 * ComponentForm — Add/edit financial components (categories).
 * Supports dynamic type, frequency, and liquidity selection.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import type { ComponentType, FrequencyUnit, ComponentWithBalance } from '../database/schema';

interface ComponentFormProps {
  editingComponent?: ComponentWithBalance | null;
  onComplete: () => void;
  onCancel: () => void;
}

const TYPES: { label: string; value: ComponentType }[] = [
  { label: '💰 Asset', value: 'asset' },
  { label: '💳 Liability', value: 'liability' },
  { label: '📈 Income', value: 'income' },
  { label: '📉 Expense', value: 'expense' },
];

const TYPE_DESCRIPTIONS: Record<ComponentType, string> = {
  asset: 'Harta yang Anda miliki (Tabungan, Emas, Mobil, Properti).',
  liability: 'Hutang atau cicilan yang harus dilunasi (Kartu Kredit, KPR, Pinjol).',
  income: 'Pendapatan rutin bulanan (Gaji, Passive Income, Hasil Usaha).',
  expense: 'Pengeluaran rutin untuk kebutuhan hidup (Makan, Listrik, SPP).',
};

const FREQUENCY_UNITS: { label: string; value: FrequencyUnit }[] = [
  { label: 'Days', value: 'day' },
  { label: 'Weeks', value: 'week' },
  { label: 'Months', value: 'month' },
  { label: 'Years', value: 'year' },
];

function formatDisplayNumber(text: string): string {
  const clean = text.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function ComponentForm({ editingComponent, onComplete, onCancel }: ComponentFormProps) {
  const db = useSQLiteContext();
  const isEditing = !!editingComponent;

  const [name, setName] = useState(editingComponent?.name ?? '');
  const [type, setType] = useState<ComponentType>((editingComponent?.type as ComponentType) ?? 'asset');
  const [frequencyInterval, setFrequencyInterval] = useState(editingComponent?.frequency_interval?.toString() ?? '1');
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>((editingComponent?.frequency_unit as FrequencyUnit) ?? 'month');
  const [activeFrom, setActiveFrom] = useState(editingComponent?.active_from ?? '');
  const [activeUntil, setActiveUntil] = useState(editingComponent?.active_until ?? '');
  const [isLiquid, setIsLiquid] = useState(editingComponent?.is_liquid === 1);
  const [isShortTerm, setIsShortTerm] = useState(editingComponent?.is_short_term === 1);
  const [depRate, setDepRate] = useState(editingComponent?.depreciation_rate?.toString() ?? '0');
  const [monthlyInstallment, setMonthlyInstallment] = useState(editingComponent ? formatDisplayNumber(editingComponent.monthly_installment.toString()) : '0');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }

    try {
      const interval = parseInt(frequencyInterval, 10) || 1;
      const fromDate = activeFrom.trim() || null;
      const untilDate = activeUntil.trim() || null;
      const rate = parseFloat(depRate) || 0;
      const installment = type === 'liability' ? parseFloat(monthlyInstallment.replace(/\./g, '')) || 0 : 0;

      if (isEditing && editingComponent) {
        await db.runAsync(
          `UPDATE financial_components SET name = ?, type = ?, frequency_interval = ?, frequency_unit = ?, is_liquid = ?, is_short_term = ?, depreciation_rate = ?, monthly_installment = ?, active_from = ?, active_until = ? WHERE id = ?`,
          [trimmed, type, interval, frequencyUnit, isLiquid ? 1 : 0, isShortTerm ? 1 : 0, rate, installment, fromDate, untilDate, editingComponent.id]
        );
      } else {
        const result = await db.runAsync(
          `INSERT INTO financial_components (name, type, frequency_interval, frequency_unit, is_liquid, is_short_term, depreciation_rate, monthly_installment, active_from, active_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [trimmed, type, interval, frequencyUnit, isLiquid ? 1 : 0, isShortTerm ? 1 : 0, rate, installment, fromDate, untilDate]
        );
        // Create initial zero record
        await db.runAsync(
          `INSERT INTO financial_records (component_id, amount, start_date) VALUES (?, 0, datetime('now'))`,
          [result.lastInsertRowId]
        );
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6">
      <Text className="text-2xl font-inter-bold text-zinc-900 dark:text-zinc-50 mb-8">{isEditing ? 'Edit Component' : 'New Component'}</Text>

      <View className="gap-y-6">
        {/* Name */}
        <View>
          <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 ml-1">Name</Text>
          <TextInput
            className="bg-white dark:bg-zinc-900 rounded-2xl px-5 py-4 text-base text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800"
            value={name}
            onChangeText={(t) => { setError(null); setName(t); }}
            placeholder="e.g. Savings Account"
            placeholderTextColor="#94a3b8"
            autoFocus
          />
        </View>

        {/* Type */}
        <View>
          <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 ml-1">Component Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {TYPES.map((t) => (
              <Pressable
                key={t.value}
                className={`flex-[1_1_45%] min-w-[140px] px-4 py-3 rounded-xl border ${type === t.value ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-600 dark:border-sky-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                onPress={() => setType(t.value)}
              >
                <Text className={`text-sm text-center ${type === t.value ? 'text-sky-600 dark:text-sky-400 font-inter-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-3 ml-1 italic">
            {TYPE_DESCRIPTIONS[type]}
          </Text>
        </View>

        {/* Frequency - Only for Income and Expense */}
        {(type === 'income' || type === 'expense') && (
          <View>
            <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 ml-1">Frequency</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <TextInput
                  className="bg-white dark:bg-zinc-900 rounded-2xl px-5 py-4 text-base text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 font-mono"
                  value={frequencyInterval}
                  onChangeText={setFrequencyInterval}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View className="flex-[2] flex-row flex-wrap gap-2">
                {FREQUENCY_UNITS.map((u) => (
                  <Pressable
                    key={u.value}
                    className={`px-3 py-2 rounded-lg border ${frequencyUnit === u.value ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-600 dark:border-sky-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                    onPress={() => setFrequencyUnit(u.value)}
                  >
                    <Text className={`text-[10px] ${frequencyUnit === u.value ? 'text-sky-600 dark:text-sky-400 font-inter-semibold' : 'text-zinc-500 dark:text-zinc-400'}`}>{u.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Active Period - Hide for Assets */}
        {type !== 'asset' && (
          <View>
            <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 ml-1">Active Period (Optional)</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <TextInput
                  className="bg-white dark:bg-zinc-900 rounded-2xl px-5 py-3 text-sm text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 font-mono"
                  value={activeFrom}
                  onChangeText={setActiveFrom}
                  placeholder="Start (YYYY-MM-DD)"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View className="flex-1">
                <TextInput
                  className="bg-white dark:bg-zinc-900 rounded-2xl px-5 py-3 text-sm text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 font-mono"
                  value={activeUntil}
                  onChangeText={setActiveUntil}
                  placeholder="End (YYYY-MM-DD)"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>
        )}

        {/* Dynamic Fields */}
        {type === 'asset' && (
          <View className="gap-y-4">
            <Pressable 
              className="flex-row items-center gap-x-3 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800" 
              onPress={() => setIsLiquid(!isLiquid)}
            >
              <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${isLiquid ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                {isLiquid && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <View className="ml-3">
                <Text className="text-sm font-inter-semibold text-zinc-900 dark:text-zinc-50">Liquid Asset</Text>
                <Text className="text-[10px] text-zinc-400">Cash, Bank, Money Market</Text>
              </View>
            </Pressable>
            
            <View>
              <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 ml-1">Annual Growth / Loss (%)</Text>
              <TextInput
                className="bg-white dark:bg-zinc-900 rounded-2xl px-5 py-3 text-base text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 font-mono"
                value={depRate}
                onChangeText={setDepRate}
                keyboardType="numbers-and-punctuation"
                placeholder="Contoh: 5 (Naik) atau -10 (Turun)"
                placeholderTextColor="#94a3b8"
              />
              <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 ml-1 italic">
                Positif (+) untuk kenaikan (Emas/Rumah), Negatif (-) untuk penyusutan (Mobil).
              </Text>
            </View>
          </View>
        )}

        {type === 'liability' && (
          <View className="space-y-4">
            <Pressable 
              className="flex-row items-center gap-x-3 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800" 
              onPress={() => setIsShortTerm(!isShortTerm)}
            >
              <View className={`w-6 h-6 rounded-md border-2 items-center justify-center ${isShortTerm ? 'bg-rose-500 border-rose-500' : 'border-zinc-300 dark:border-zinc-700'}`}>
                {isShortTerm && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <View className="ml-3">
                <Text className="text-sm font-inter-semibold text-zinc-900 dark:text-zinc-50">Short-term Liability</Text>
                <Text className="text-[10px] text-zinc-400">Credit Card, Paylater</Text>
              </View>
            </Pressable>

            <View>
              <Text className="text-[10px] font-inter-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 ml-1">Monthly Installment (Cicilan)</Text>
              <View className="flex-row items-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4">
                <Text className="text-sm text-zinc-400 font-inter-bold mr-2">Rp</Text>
                <TextInput
                  className="flex-1 text-base font-mono-bold text-zinc-900 dark:text-zinc-50 py-4"
                  value={monthlyInstallment}
                  onChangeText={(text) => setMonthlyInstallment(formatDisplayNumber(text))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 ml-1 italic">
                Digunakan untuk perhitungan DSR (Debt Service Ratio).
              </Text>
            </View>
          </View>
        )}

        {error && <Text className="text-rose-500 text-sm font-inter-medium mt-2 text-center">{error}</Text>}

        {/* Actions */}
        <View className="flex-row gap-x-4 mt-8 pb-10">
          <Pressable className="flex-1 bg-zinc-200 dark:bg-zinc-800 py-4 rounded-2xl items-center active:opacity-70" onPress={onCancel}>
            <Text className="text-zinc-600 dark:text-zinc-300 font-inter-bold text-base">Cancel</Text>
          </Pressable>
          <Pressable className="flex-[2] bg-sky-600 dark:bg-sky-500 py-4 rounded-2xl items-center active:opacity-70 shadow-lg shadow-sky-600/30" onPress={handleSave}>
            <Text className="text-white dark:text-zinc-950 font-inter-bold text-base">{isEditing ? 'Update' : 'Create'}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
