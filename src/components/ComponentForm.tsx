/**
 * ComponentForm — Add/edit financial components (categories).
 * Purple FinTech design with adaptive Light/Dark mode.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StatusBar, useColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Calendar, Clock, Layers, Type } from 'lucide-react-native';
import type { ComponentType, FrequencyUnit, FinancialComponent } from '../database/schema';

interface ComponentFormProps {
  editingComponent?: FinancialComponent | null;
  onComplete: () => void;
  onCancel: () => void;
}

const TYPES: { label: string; value: ComponentType }[] = [
  { label: 'Asset', value: 'asset' },
  { label: 'Liability', value: 'liability' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];

const TYPE_DESCRIPTIONS: Record<ComponentType, string> = {
  asset: 'Owned value (Savings, Gold, Car, Property).',
  liability: 'Debts or installments (Credit Card, Mortgage, Loans).',
  income: 'Recurring revenue (Salary, Passive Income).',
  expense: 'Recurring outflows (Rent, Utilities, Food).',
};

const FREQUENCY_UNITS: { label: string; value: FrequencyUnit }[] = [
  { label: 'D', value: 'day' },
  { label: 'W', value: 'week' },
  { label: 'M', value: 'month' },
  { label: 'Y', value: 'year' },
];

function formatDisplayNumber(text: string): string {
  const clean = text.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function ComponentForm({ editingComponent, onComplete, onCancel }: ComponentFormProps) {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isEditing = !!editingComponent;

  const [name, setName] = useState(editingComponent?.name ?? '');
  const [type, setType] = useState<ComponentType>((editingComponent?.type as ComponentType) ?? 'asset');
  const [frequencyInterval, setFrequencyInterval] = useState(editingComponent?.frequency_interval?.toString() ?? '1');
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>((editingComponent?.frequency_unit as FrequencyUnit) ?? 'month');
  const [activeFrom, setActiveFrom] = useState(editingComponent?.active_from ?? '');
  const [activeUntil, setActiveUntil] = useState(editingComponent?.active_until ?? '');
  const [isLiquid, setIsLiquid] = useState(editingComponent?.is_liquid === 1);
  const [isShortTerm, setIsShortTerm] = useState(editingComponent?.is_short_term === 1);
  const [isEssential, setIsEssential] = useState(editingComponent?.is_essential === 1);
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
          `UPDATE financial_components SET name = ?, type = ?, frequency_interval = ?, frequency_unit = ?, is_liquid = ?, is_short_term = ?, is_essential = ?, depreciation_rate = ?, monthly_installment = ?, active_from = ?, active_until = ? WHERE id = ?`,
          [trimmed, type, interval, frequencyUnit, isLiquid ? 1 : 0, isShortTerm ? 1 : 0, isEssential ? 1 : 0, rate, installment, fromDate, untilDate, editingComponent.id]
        );
      } else {
        const result = await db.runAsync(
          `INSERT INTO financial_components (name, type, frequency_interval, frequency_unit, is_liquid, is_short_term, is_essential, depreciation_rate, monthly_installment, active_from, active_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [trimmed, type, interval, frequencyUnit, isLiquid ? 1 : 0, isShortTerm ? 1 : 0, isEssential ? 1 : 0, rate, installment, fromDate, untilDate]
        );
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

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <View className="flex-row items-center mb-4 mt-2">
      <View className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/10 items-center justify-center">
        <Icon size={16} color="#7c3aed" strokeWidth={2.5} />
      </View>
      <Text className="text-[11px] font-inter-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[2px] ml-3">
        {title}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        <Text className="text-3xl font-inter-bold text-zinc-900 dark:text-zinc-50 mb-1">{isEditing ? 'Edit Category' : 'New Category'}</Text>
        <Text className="text-sm text-zinc-400 dark:text-zinc-500 mb-10 font-inter-medium">Configure your financial component details.</Text>

        <View className="space-y-10">
          {/* Identity Section */}
          <View>
            <SectionTitle icon={Type} title="Identity" />
            <View className="space-y-4">
              <TextInput
                className="bg-white dark:bg-zinc-900 rounded-3xl px-6 py-5 text-lg text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 font-inter-semibold shadow-sm"
                value={name}
                onChangeText={(t) => { setError(null); setName(t); }}
                placeholder="Category Name (e.g. Salary)"
                placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                autoFocus
              />
              <View className="flex-row flex-wrap gap-2.5">
                {TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    className={`px-5 py-3.5 rounded-2xl border ${type === t.value ? 'bg-violet-600 border-violet-600 shadow-md shadow-violet-600/30' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                    onPress={() => setType(t.value)}
                  >
                    <Text className={`text-[13px] ${type === t.value ? 'text-white font-inter-bold' : 'text-zinc-500 dark:text-zinc-400 font-inter-medium'}`}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-[12px] text-zinc-400 dark:text-zinc-500 ml-1 font-inter-medium italic leading-relaxed">
                {TYPE_DESCRIPTIONS[type]}
              </Text>
            </View>
          </View>

          {/* Logic Section */}
          <View>
            <SectionTitle icon={Layers} title="Component Logic" />
            
            {/* Asset Logic */}
            {type === 'asset' && (
              <View className="space-y-4">
                <Pressable 
                  className={`flex-row items-center p-5 rounded-3xl border ${isLiquid ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`} 
                  onPress={() => setIsLiquid(!isLiquid)}
                >
                  <View className="flex-1">
                    <Text className="text-base font-inter-bold text-zinc-800 dark:text-zinc-200">Liquid Asset</Text>
                    <Text className="text-[11px] text-zinc-400 mt-0.5 uppercase tracking-wider font-inter-medium">Cash, Bank, MM</Text>
                  </View>
                  <View className={`w-7 h-7 rounded-lg items-center justify-center ${isLiquid ? 'bg-emerald-500 shadow-md' : 'border-2 border-zinc-200 dark:border-zinc-800'}`}>
                    {isLiquid && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                </Pressable>
                <View className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
                  <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">Growth / Depr (%)</Text>
                  <TextInput
                    className="text-xl text-zinc-900 dark:text-white font-mono-bold"
                    value={depRate}
                    onChangeText={setDepRate}
                    keyboardType="numbers-and-punctuation"
                    placeholder="0"
                    placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                  />
                </View>
              </View>
            )}

            {/* Liability Logic */}
            {type === 'liability' && (
              <View className="space-y-4">
                <Pressable 
                  className={`flex-row items-center p-5 rounded-3xl border ${isShortTerm ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500/30' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`} 
                  onPress={() => setIsShortTerm(!isShortTerm)}
                >
                  <View className="flex-1">
                    <Text className="text-base font-inter-bold text-zinc-800 dark:text-zinc-200">Short-term Debt</Text>
                    <Text className="text-[11px] text-zinc-400 mt-0.5 uppercase tracking-wider font-inter-medium">Credit Cards, Paylater</Text>
                  </View>
                  <View className={`w-7 h-7 rounded-lg items-center justify-center ${isShortTerm ? 'bg-rose-500 shadow-md' : 'border-2 border-zinc-200 dark:border-zinc-800'}`}>
                    {isShortTerm && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                </Pressable>
                <View className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
                  <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">Monthly Payment (Cicilan)</Text>
                  <View className="flex-row items-center">
                    <Text className="text-lg text-zinc-400 font-inter-bold mr-2">Rp</Text>
                    <TextInput
                      className="flex-1 text-2xl text-zinc-900 dark:text-white font-mono-bold"
                      value={monthlyInstallment}
                      onChangeText={(text) => setMonthlyInstallment(formatDisplayNumber(text))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Frequency Logic */}
            {(type === 'income' || type === 'expense') && (
              <View className="space-y-4">
                {type === 'expense' && (
                  <Pressable 
                    className={`flex-row items-center p-5 rounded-3xl border ${isEssential ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500/30' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`} 
                    onPress={() => setIsEssential(!isEssential)}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-inter-bold text-zinc-800 dark:text-zinc-200">Essential Expense</Text>
                      <Text className="text-[11px] text-zinc-400 mt-0.5 uppercase tracking-wider font-inter-medium">Rent, Food, Basic Health</Text>
                    </View>
                    <View className={`w-7 h-7 rounded-lg items-center justify-center ${isEssential ? 'bg-amber-500 shadow-md' : 'border-2 border-zinc-200 dark:border-zinc-800'}`}>
                      {isEssential && <Text className="text-zinc-900 text-xs font-bold">✓</Text>}
                    </View>
                  </Pressable>
                )}
                <View className="flex-row gap-4">
                  <View className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
                    <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">Every</Text>
                    <TextInput
                      className="text-2xl text-zinc-900 dark:text-white font-mono-bold"
                      value={frequencyInterval}
                      onChangeText={setFrequencyInterval}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                    />
                  </View>
                  <View className="flex-[2] flex-row flex-wrap gap-2 items-center justify-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-2">
                    {FREQUENCY_UNITS.map((u) => (
                      <Pressable
                        key={u.value}
                        className={`w-10 h-10 rounded-full items-center justify-center border ${frequencyUnit === u.value ? 'bg-violet-600 border-violet-600' : 'bg-transparent border-zinc-100 dark:border-zinc-800'}`}
                        onPress={() => setFrequencyUnit(u.value)}
                      >
                        <Text className={`text-[11px] font-inter-bold ${frequencyUnit === u.value ? 'text-white' : 'text-zinc-400'}`}>{u.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Date Range Section */}
          <View>
            <SectionTitle icon={Calendar} title="Temporal Range" />
            <View className="flex-row gap-4">
              <View className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
                <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">Start Date</Text>
                <TextInput
                  className="text-[13px] text-zinc-900 dark:text-white font-mono-bold"
                  value={activeFrom}
                  onChangeText={setActiveFrom}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                />
              </View>
              <View className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800">
                <Text className="text-[10px] font-inter-bold text-zinc-400 uppercase tracking-wider mb-2">End Date (Opt)</Text>
                <TextInput
                  className="text-[13px] text-zinc-900 dark:text-white font-mono-bold"
                  value={activeUntil}
                  onChangeText={setActiveUntil}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
                />
              </View>
            </View>
          </View>

          {error && <Text className="text-rose-500 text-sm font-inter-bold text-center">{error}</Text>}

          {/* Actions */}
          <View className="flex-row space-x-4">
            <Pressable 
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 py-5 rounded-[24px] items-center active:opacity-70" 
              onPress={onCancel}
            >
              <Text className="text-zinc-500 dark:text-zinc-400 font-inter-bold text-base">Cancel</Text>
            </Pressable>
            <Pressable 
              className="flex-[2] py-5 rounded-[24px] items-center ml-4 active:opacity-80 shadow-lg shadow-[#FFBF00]/30" 
              style={{ backgroundColor: '#FFBF00' }}
              onPress={handleSave}
            >
              <Text className="text-zinc-900 font-inter-bold text-base">{isEditing ? 'Update' : 'Create'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
