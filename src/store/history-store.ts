import { create } from "zustand";
import { WorkflowRun } from "@/types/workflow";

interface HistoryState {
    runs: WorkflowRun[];
    selectedRunId: string | null;
    isHistoryMode: boolean;

    // Actions
    addRun: (run: WorkflowRun) => void;
    updateRun: (runId: string, updates: Partial<WorkflowRun>) => void;
    selectRun: (runId: string | null) => void;
    enterHistoryMode: (runId: string) => void;
    exitHistoryMode: () => void;
    clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
    runs: [],
    selectedRunId: null,
    isHistoryMode: false,

    addRun: (run) => {
        set({ runs: [run, ...get().runs] });
    },

    updateRun: (runId, updates) => {
        set({
            runs: get().runs.map((r) =>
                r.id === runId ? { ...r, ...updates } : r
            ),
        });
    },

    selectRun: (runId) => {
        set({ selectedRunId: runId });
    },

    enterHistoryMode: (runId) => {
        set({ selectedRunId: runId, isHistoryMode: true });
    },

    exitHistoryMode: () => {
        set({ selectedRunId: null, isHistoryMode: false });
    },

    clearHistory: () => {
        set({ runs: [], selectedRunId: null, isHistoryMode: false });
    },
}));
