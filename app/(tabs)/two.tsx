import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable, Alert, Modal, TextInput, Platform, StatusBar, useColorScheme
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentForm } from '@/src/components/ComponentForm';
import { useProfile } from '@/src/hooks/useProfile';
import { SwipeableItem } from '@/src/components/SwipeableItem';
import { Trash2, UserPlus, Plus, Wallet, CreditCard, TrendingUp, Receipt } from 'lucide-react-native';
import type { FinancialComponent, ComponentType } from '@/src/database/schema';

const TYPE_LABELS: Record<ComponentType, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  income: 'Income',
  expense: 'Expenses',
};

const TYPE_ICONS: Record<ComponentType, (isDark: boolean) => React.ReactNode> = {
  asset: (isDark) => <Wallet size={16} color={isDark ? '#a78bfa' : '#7c3aed'} />,
  liability: (isDark) => <CreditCard size={16} color={isDark ? '#fb7185' : '#e11d48'} />,
  income: (isDark) => <TrendingUp size={16} color={isDark ? '#34d399' : '#059669'} />,
  expense: (isDark) => <Receipt size={16} color={isDark ? '#fbbf24' : '#d97706'} />,
};

const TYPE_ORDER: ComponentType[] = ['asset', 'liability', 'income', 'expense'];

export default function ConfigScreen() {
  const db = useSQLiteContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [components, setComponents] = useState<FinancialComponent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinancialComponent | null>(null);
  const { profile, children, updateProfile, addChild, removeChild } = useProfile();

  const [newChildName, setNewChildName] = useState('');
  const [newChildBirth, setNewChildBirth] = useState('');
  const [isAddingChild, setIsAddingChild] = useState(false);

  const fetchComponents = useCallback(async () => {
    const rows = await db.getAllAsync<FinancialComponent>(
      'SELECT * FROM financial_components ORDER BY type, name'
    );
    setComponents(rows);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchComponents();
    }, [fetchComponents])
  );

  const handleDelete = async (comp: FinancialComponent) => {
    const performDelete = async () => {
      try {
        await db.runAsync('DELETE FROM financial_records WHERE component_id = ?', [comp.id]);
        await db.runAsync('DELETE FROM financial_components WHERE id = ?', [comp.id]);
        await fetchComponents();
      } catch (e) {
        console.error('Delete failed', e);
        if (Platform.OS === 'web') {
          alert('Delete failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
        } else {
          Alert.alert('Delete Failed', e instanceof Error ? e.message : 'Unknown error');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${comp.name}"? All records will be lost.`)) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Delete Component',
        `Are you sure you want to delete "${comp.name}"? All records will be lost.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleEdit = (comp: FinancialComponent) => {
    setEditing(comp);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleFormComplete = () => {
    setShowForm(false);
    setEditing(null);
    fetchComponents();
  };

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: components.filter((c) => c.type === type),
  }));

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Purple Header */}
      <LinearGradient
        colors={['#4F359B', '#6D52C1', '#8B6FD8'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-16 pb-8">
          <Text className="text-white/60 text-[11px] font-inter-semibold uppercase tracking-[2px]">Zinc Ledger</Text>
          <Text className="text-white text-2xl font-inter-bold mt-0.5">Profile & Config</Text>
          <Text className="text-white/50 text-sm font-inter-medium mt-1">Manage your family profile and categories.</Text>
        </View>

        {/* Profile Section */}
        {profile && (
          <View className="mx-5 mb-8">
            <View
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
            >
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-[15px] font-inter-semibold text-zinc-800 dark:text-zinc-200">Marital Status</Text>
                <View className="flex-row bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
                  <Pressable
                    className={`px-4 py-1.5 rounded-full ${profile.marital_status === 'single' ? 'bg-violet-600' : ''}`}
                    onPress={() => updateProfile({ marital_status: 'single' })}
                  >
                    <Text className={`text-xs font-inter-bold ${profile.marital_status === 'single' ? 'text-white' : 'text-zinc-400'}`}>Single</Text>
                  </Pressable>
                  <Pressable
                    className={`px-4 py-1.5 rounded-full ${profile.marital_status === 'married' ? 'bg-violet-600' : ''}`}
                    onPress={() => updateProfile({ marital_status: 'married' })}
                  >
                    <Text className={`text-xs font-inter-bold ${profile.marital_status === 'married' ? 'text-white' : 'text-zinc-400'}`}>Married</Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row justify-between items-center py-2 mt-4">
                <Text className="text-[15px] font-inter-semibold text-zinc-800 dark:text-zinc-200">Dependents (Kids)</Text>
                <View className="bg-violet-100 dark:bg-violet-500/10 px-3 py-1 rounded-lg">
                  <Text className="text-base font-mono-bold text-violet-600 dark:text-violet-400">{children.length}</Text>
                </View>
              </View>

              {/* Children List */}
              {children.length > 0 && (
                <View className="mt-4 space-y-2">
                  {children.map((child) => (
                    <View key={child.id} className="flex-row items-center justify-between py-3 px-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                      <View className="flex-1">
                        <Text className="text-sm font-inter-bold text-zinc-800 dark:text-zinc-200">{child.name || 'Child'}</Text>
                        <Text className="text-[10px] text-zinc-400 font-mono-medium mt-0.5">{child.birth_date}</Text>
                      </View>
                      <Pressable
                        onPress={async () => {
                          const msg = `Are you sure you want to remove ${child.name || 'this child'}?`;
                          if (Platform.OS === 'web') {
                            if (window.confirm(msg)) await removeChild(child.id);
                          } else {
                            Alert.alert('Remove Child', msg, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Remove', style: 'destructive', onPress: () => removeChild(child.id) }
                            ]);
                          }
                        }}
                        className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-full"
                      >
                        <Trash2 size={14} color={isDark ? '#fb7185' : '#e11d48'} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {isAddingChild ? (
                <View className="mt-6 space-y-3 bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl">
                  <TextInput
                    className="bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 text-zinc-800 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700"
                    value={newChildName}
                    onChangeText={setNewChildName}
                    placeholder="Child's Name"
                    placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                  />
                  <TextInput
                    className="bg-white dark:bg-zinc-900 rounded-xl px-4 py-3 text-zinc-800 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700 font-mono-medium"
                    value={newChildBirth}
                    onChangeText={setNewChildBirth}
                    placeholder="Birth (YYYY-MM-DD)"
                    placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                  />
                  <View className="flex-row space-x-2 mt-2">
                    <Pressable
                      className="flex-1 bg-zinc-200 dark:bg-zinc-700 py-3 rounded-xl items-center"
                      onPress={() => setIsAddingChild(false)}
                    >
                      <Text className="text-xs font-inter-bold text-zinc-600 dark:text-zinc-300">Cancel</Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 bg-violet-600 py-3 rounded-xl items-center ml-2"
                      onPress={async () => {
                        if (newChildBirth) {
                          await addChild(newChildName, newChildBirth);
                          setNewChildName('');
                          setNewChildBirth('');
                          setIsAddingChild(false);
                        }
                      }}
                    >
                      <Text className="text-xs font-inter-bold text-white">Add Child</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  className="flex-row items-center justify-center space-x-2 mt-6 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700"
                  onPress={() => setIsAddingChild(true)}
                >
                  <UserPlus size={16} color="#7c3aed" />
                  <Text className="text-sm font-inter-bold text-violet-600 dark:text-violet-400 ml-2">Add Dependent</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Categories Header */}
        <View className="px-6 mb-6">
          <Text className="text-[11px] font-inter-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[2px] ml-1">
            Categories
          </Text>
        </View>

        {/* Category Groups */}
        <View className="px-5">
          {grouped.map((group) => (
            <View key={group.type} className="mb-8">
              <View className="flex-row justify-between items-center mb-3 px-1">
                <View className="flex-row items-center">
                  {TYPE_ICONS[group.type](isDark)}
                  <Text className="text-base font-inter-bold text-zinc-800 dark:text-zinc-200 ml-2">{group.label}</Text>
                </View>
                <View className="bg-violet-100 dark:bg-violet-500/10 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-mono-bold text-violet-600 dark:text-violet-400">{group.items.length}</Text>
                </View>
              </View>

              {group.items.map((comp) => (
                <SwipeableItem key={comp.id} onDelete={() => handleDelete(comp)}>
                  <Pressable
                    className="w-full flex-row items-center bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 active:opacity-90"
                    onPress={() => handleEdit(comp)}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-[15px] font-inter-semibold text-zinc-800 dark:text-zinc-100">{comp.name}</Text>
                        {(() => {
                          const today = new Date().toISOString().split('T')[0];
                          if (comp.active_from && comp.active_from > today) {
                            return (
                              <View className="bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-md ml-2">
                                <Text className="text-[8px] text-amber-700 dark:text-amber-400 font-inter-bold">FUTURE</Text>
                              </View>
                            );
                          }
                          if (comp.active_until && comp.active_until < today) {
                            return (
                              <View className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md ml-2">
                                <Text className="text-[8px] text-zinc-400 font-inter-bold">EXPIRED</Text>
                              </View>
                            );
                          }
                          return null;
                        })()}
                      </View>
                      <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wider font-inter-medium">
                        {comp.frequency_interval} {comp.frequency_unit}s
                        {comp.type === 'asset' && (comp.is_liquid ? ' · Liquid' : ' · Fixed')}
                      </Text>
                    </View>
                  </Pressable>
                </SwipeableItem>
              ))}

              {group.items.length === 0 && (
                <View className="p-6 items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <Text className="text-xs text-zinc-400 italic font-inter-medium">No {group.type} categories defined</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        className="absolute bottom-20 right-5 w-14 h-14 rounded-2xl items-center justify-center active:scale-90"
        style={{ 
          backgroundColor: '#FFBF00', 
          shadowColor: '#FFBF00', 
          shadowOffset: { width: 0, height: 6 }, 
          shadowOpacity: 0.4, 
          shadowRadius: 12, 
          elevation: 10,
          zIndex: 100 
        }}
        onPress={handleAdd}
      >
        <Plus size={26} color="#1a1a1a" strokeWidth={3} />
      </Pressable>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ComponentForm
          editingComponent={editing}
          onComplete={handleFormComplete}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      </Modal>
    </View>
  );
}
