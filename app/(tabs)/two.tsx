/**
 * Config Screen — Manage dynamic financial components.
 * Grouped by type, with add/edit/delete capabilities.
 */
import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable, Alert, Modal, TextInput, Platform,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { ComponentForm } from '@/src/components/ComponentForm';
import { useProfile } from '@/src/hooks/useProfile';
import { Trash2, UserPlus, Edit2, X } from 'lucide-react-native';
import type { FinancialComponent, ComponentType } from '@/src/database/schema';

const TYPE_LABELS: Record<ComponentType, string> = {
  asset: '💰 Assets',
  liability: '💳 Liabilities',
  income: '📈 Income',
  expense: '📉 Expenses',
};

const TYPE_ORDER: ComponentType[] = ['asset', 'liability', 'income', 'expense'];

export default function ConfigScreen() {
  const db = useSQLiteContext();
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
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
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
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-2xl font-inter-bold text-zinc-900 dark:text-zinc-50">Profile & Config</Text>
        <Text className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 mb-6">Configure your profile to personalize target ratios.</Text>

        {/* Profile Section */}
        {profile && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl p-5 mb-8 border border-zinc-200 dark:border-zinc-800">
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-base font-inter-medium text-zinc-900 dark:text-zinc-50">Marital Status</Text>
              <View className="flex-row bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
                <Pressable
                  className={`px-4 py-1.5 rounded-full ${profile.marital_status === 'single' ? 'bg-white dark:bg-zinc-700' : ''}`}
                  onPress={() => updateProfile({ marital_status: 'single' })}
                >
                  <Text className={`text-xs ${profile.marital_status === 'single' ? 'text-sky-600 dark:text-sky-400 font-inter-semibold' : 'text-zinc-400'}`}>Single</Text>
                </Pressable>
                <Pressable
                  className={`px-4 py-1.5 rounded-full ${profile.marital_status === 'married' ? 'bg-white dark:bg-zinc-700' : ''}`}
                  onPress={() => updateProfile({ marital_status: 'married' })}
                >
                  <Text className={`text-xs ${profile.marital_status === 'married' ? 'text-sky-600 dark:text-sky-400 font-inter-semibold' : 'text-zinc-400'}`}>Married</Text>
                </Pressable>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center py-2 mt-2">
              <Text className="text-base font-inter-medium text-zinc-900 dark:text-zinc-50">Dependents (Kids)</Text>
              <Text className="text-base font-mono-bold text-zinc-900 dark:text-zinc-50">{children.length}</Text>
            </View>

            {/* Children List */}
            {children.length > 0 && (
              <View className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                {children.map((child) => (
                  <View key={child.id} className="flex-row items-center justify-between py-1">
                    <View className="flex-1">
                      <Text className="text-sm font-inter-semibold text-zinc-900 dark:text-zinc-50">{child.name || 'Child'}</Text>
                      <Text className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{child.birth_date}</Text>
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
                      className="p-2"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {isAddingChild ? (
              <View className="mt-4 space-y-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
                <TextInput
                  className="bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-50 text-sm border border-zinc-200 dark:border-zinc-700"
                  value={newChildName}
                  onChangeText={setNewChildName}
                  placeholder="Name"
                  placeholderTextColor="#94a3b8"
                />
                <TextInput
                  className="bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-50 text-sm border border-zinc-200 dark:border-zinc-700 font-mono"
                  value={newChildBirth}
                  onChangeText={setNewChildBirth}
                  placeholder="Birth (YYYY-MM-DD)"
                  placeholderTextColor="#94a3b8"
                />
                <View className="flex-row space-x-2 mt-1">
                  <Pressable 
                    className="flex-1 bg-zinc-200 dark:bg-zinc-700 py-2 rounded-lg items-center" 
                    onPress={() => setIsAddingChild(false)}
                  >
                    <Text className="text-xs font-inter-bold text-zinc-600 dark:text-zinc-300">Cancel</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 bg-sky-600 py-2 rounded-lg items-center ml-2"
                    onPress={async () => {
                      if (newChildBirth) {
                        await addChild(newChildName, newChildBirth);
                        setNewChildName('');
                        setNewChildBirth('');
                        setIsAddingChild(false);
                      }
                    }}
                  >
                    <Text className="text-xs font-inter-bold text-white">Add</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable 
                className="flex-row items-center space-x-2 mt-4 py-2" 
                onPress={() => setIsAddingChild(true)}
              >
                <UserPlus size={16} color="#0ea5e9" />
                <Text className="text-sm font-inter-semibold text-sky-600 dark:text-sky-400 ml-2">Add Child</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text className="text-2xl font-inter-bold text-zinc-900 dark:text-zinc-50 mt-4">Financial Components</Text>
        <Text className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 mb-6">Manage your asset, liability, income, and expense categories</Text>

        {grouped.map((group) => (
          <View key={group.type} className="mb-8">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-inter-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{group.label}</Text>
              <View className="bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                <Text className="text-[10px] font-mono-bold text-zinc-500 dark:text-zinc-400">{group.items.length}</Text>
              </View>
            </View>

            {group.items.map((comp) => (
              <View key={comp.id} className="flex-row items-center bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-200 dark:border-zinc-800">
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-base font-inter-medium text-zinc-900 dark:text-zinc-50">{comp.name}</Text>
                    {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      if (comp.active_from && comp.active_from > today) {
                        return <View className="bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-md ml-2"><Text className="text-[8px] text-amber-600 font-inter-bold">FUTURE</Text></View>;
                      }
                      if (comp.active_until && comp.active_until < today) {
                        return <View className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md ml-2"><Text className="text-[8px] text-zinc-400 font-inter-bold">EXPIRED</Text></View>;
                      }
                      return null;
                    })()}
                  </View>
                  <Text className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {comp.frequency_interval} {comp.frequency_unit}s
                    {(comp.active_from || comp.active_until) && ` · ${comp.active_from ?? '...'} to ${comp.active_until ?? '...'}`}
                    {comp.type === 'asset' && (comp.is_liquid ? ' · Liquid' : ' · Non-Liquid')}
                  </Text>
                </View>
                <View className="flex-row space-x-1">
                  <Pressable className="p-2" onPress={() => handleEdit(comp)}>
                    <Edit2 size={18} color="#0ea5e9" />
                  </Pressable>
                  <Pressable className="p-2 ml-1" onPress={() => handleDelete(comp)}>
                    <X size={20} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))}

            {group.items.length === 0 && (
              <Text className="text-sm text-zinc-400 dark:text-zinc-500 italic p-4 text-center">No {group.type}s yet</Text>
            )}
          </View>
        ))}

        <View className="h-20" />
      </ScrollView>

      {/* FAB */}
      <Pressable
        className="absolute bottom-8 right-8 w-14 h-14 rounded-full bg-sky-600 dark:bg-sky-500 items-center justify-center shadow-lg shadow-sky-600/40 active:scale-90"
        onPress={handleAdd}
      >
        <Text className="text-3xl text-white dark:text-zinc-950 font-light -mt-1">+</Text>
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
