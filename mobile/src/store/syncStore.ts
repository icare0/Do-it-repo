import { create } from 'zustand';
import { SyncStatus } from '@/types';

interface SyncState extends SyncStatus {
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  startSync: () => void;
  finishSync: (error?: string) => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSync: undefined,
  pendingChanges: 0,
  isSyncing: false,
  error: undefined,

  setSyncStatus: (status) => set(status),

  startSync: () => set({ isSyncing: true, error: undefined }),

  finishSync: (error) => set({
    isSyncing: false,
    lastSync: error ? undefined : new Date(),
    error
  }),

  incrementPendingChanges: () => set((state) => ({
    pendingChanges: state.pendingChanges + 1
  })),

  decrementPendingChanges: () => set((state) => ({
    pendingChanges: Math.max(0, state.pendingChanges - 1)
  })),
}));
