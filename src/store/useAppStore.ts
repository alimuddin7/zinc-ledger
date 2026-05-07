/**
 * Zustand UI Store
 *
 * Manages UI-only state: calibration modal target, theme preferences, etc.
 * Financial data is NOT stored here — it comes from SQLite via hooks.
 */

import { create } from 'zustand';

interface CalibrationTarget {
  id: number;
  name: string;
  amount: number;
  type: string;
}

interface AppState {
  // Calibration Modal
  calibrationTarget: CalibrationTarget | null;
  openCalibration: (target: CalibrationTarget) => void;
  closeCalibration: () => void;

  // Component Form Modal
  isComponentFormOpen: boolean;
  editingComponent: { id: number; name: string; type: string; frequency: string; is_liquid: number } | null;
  openComponentForm: (component?: AppState['editingComponent']) => void;
  closeComponentForm: () => void;

  // Optimistic UI
  optimisticBalances: Record<number, number>;
  setOptimisticBalance: (componentId: number, amount: number) => void;
  clearOptimisticBalance: (componentId: number) => void;

  // Simulation State (Global)
  isSimActive: boolean;
  simPurchase: number;
  simType: 'cash' | 'debt';
  simTenor: number;
  simRate: number;
  setSimActive: (active: boolean) => void;
  setSimPurchase: (amount: number) => void;
  setSimType: (type: 'cash' | 'debt') => void;
  setSimTenor: (tenor: number) => void;
  setSimRate: (rate: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Calibration
  calibrationTarget: null,
  openCalibration: (target) => set({ calibrationTarget: target }),
  closeCalibration: () => set({ calibrationTarget: null }),

  // Component Form
  isComponentFormOpen: false,
  editingComponent: null,
  openComponentForm: (component) =>
    set({
      isComponentFormOpen: true,
      editingComponent: component ?? null,
    }),
  closeComponentForm: () =>
    set({
      isComponentFormOpen: false,
      editingComponent: null,
    }),

  // Optimistic UI
  optimisticBalances: {},
  setOptimisticBalance: (id, amount) => 
    set((s) => ({ optimisticBalances: { ...s.optimisticBalances, [id]: amount } })),
  clearOptimisticBalance: (id) => 
    set((s) => {
      const next = { ...s.optimisticBalances };
      delete next[id];
      return { optimisticBalances: next };
    }),

  // Simulation
  isSimActive: false,
  simPurchase: 0,
  simType: 'cash',
  simTenor: 36,
  simRate: 10,
  setSimActive: (isSimActive) => set({ isSimActive }),
  setSimPurchase: (simPurchase) => set({ simPurchase }),
  setSimType: (simType) => set({ simType }),
  setSimTenor: (simTenor) => set({ simTenor }),
  setSimRate: (simRate) => set({ simRate }),
}));
