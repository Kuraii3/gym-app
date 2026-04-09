import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Split, WorkoutSession, Exercise, AppSettings } from "../types";

const SPLITS_KEY = "gj_splits";
const SESSIONS_KEY = "gj_sessions";
const SETTINGS_KEY = "gj_settings";

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const DEFAULT_SETTINGS: AppSettings = {
  restTimerEnabled: true,
  restTimerDuration: 90,
};

function getDefaultSplits(): Split[] {
  return [
    {
      id: generateId(),
      name: "Upper Body",
      exercises: [
        { id: generateId(), name: "Bench Press" },
        { id: generateId(), name: "Barbell Rows" },
        { id: generateId(), name: "Overhead Press" },
        { id: generateId(), name: "Pull-ups" },
        { id: generateId(), name: "Bicep Curls" },
        { id: generateId(), name: "Tricep Pushdowns" },
      ],
    },
    {
      id: generateId(),
      name: "Lower Body",
      exercises: [
        { id: generateId(), name: "Back Squat" },
        { id: generateId(), name: "Romanian Deadlift" },
        { id: generateId(), name: "Leg Press" },
        { id: generateId(), name: "Leg Curls" },
        { id: generateId(), name: "Calf Raises" },
      ],
    },
    {
      id: generateId(),
      name: "Full Body",
      exercises: [
        { id: generateId(), name: "Deadlift" },
        { id: generateId(), name: "Bench Press" },
        { id: generateId(), name: "Back Squat" },
        { id: generateId(), name: "Pull-ups" },
        { id: generateId(), name: "Overhead Press" },
      ],
    },
  ];
}

export interface GymStats {
  totalSessions: number;
  streak: number;
  favoriteSplit: string | null;
  totalVolume: number; // kg * reps summed across all sessions
}

interface GymContextType {
  splits: Split[];
  sessions: WorkoutSession[];
  settings: AppSettings;
  addSplit: (name: string) => Split;
  updateSplit: (splitId: string, name: string, exercises: Exercise[]) => void;
  deleteSplit: (splitId: string) => void;
  saveSession: (session: WorkoutSession) => void;
  deleteSession: (sessionId: string) => void;
  getLastSession: (splitId: string) => WorkoutSession | null;
  getPR: (exerciseName: string) => number | null;
  getStats: () => GymStats;
  updateSettings: (s: Partial<AppSettings>) => void;
  importData: (data: { splits?: Split[]; sessions?: WorkoutSession[]; settings?: AppSettings }) => void;
}

const GymContext = createContext<GymContextType | null>(null);

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [splits, setSplits] = useState<Split[]>(() => {
    try {
      const stored = localStorage.getItem(SPLITS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return getDefaultSplits();
  });

  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => { localStorage.setItem(SPLITS_KEY, JSON.stringify(splits)); }, [splits]);
  useEffect(() => { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  const addSplit = useCallback((name: string): Split => {
    const newSplit: Split = { id: generateId(), name, exercises: [] };
    setSplits((prev) => [...prev, newSplit]);
    return newSplit;
  }, []);

  const updateSplit = useCallback((splitId: string, name: string, exercises: Exercise[]) => {
    setSplits((prev) => prev.map((s) => (s.id === splitId ? { ...s, name, exercises } : s)));
  }, []);

  const deleteSplit = useCallback((splitId: string) => {
    setSplits((prev) => prev.filter((s) => s.id !== splitId));
  }, []);

  const saveSession = useCallback((session: WorkoutSession) => {
    setSessions((prev) => [session, ...prev]);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, []);

  const getLastSession = useCallback(
    (splitId: string): WorkoutSession | null => {
      return sessions.find((s) => s.splitId === splitId) ?? null;
    },
    [sessions]
  );

  const getPR = useCallback(
    (exerciseName: string): number | null => {
      let max: number | null = null;
      const nameNorm = exerciseName.trim().toLowerCase();
      for (const session of sessions) {
        for (const exLog of session.exercises) {
          if (exLog.exerciseName.trim().toLowerCase() === nameNorm) {
            for (const set of exLog.sets ?? []) {
              const w = parseFloat(set.weight);
              if (!isNaN(w) && (max === null || w > max)) max = w;
            }
          }
        }
      }
      return max;
    },
    [sessions]
  );

  const getStats = useCallback((): GymStats => {
    const totalSessions = sessions.length;

    // Streak: consecutive workout days ending today (or yesterday)
    const workoutDates = new Set(
      sessions.map((s) => s.date.split("T")[0])
    );
    let streak = 0;
    const today = new Date();
    // Check if today has a workout; if not, start from yesterday
    const todayStr = today.toISOString().split("T")[0];
    const startFromYesterday = !workoutDates.has(todayStr);
    const cursor = new Date(today);
    if (startFromYesterday) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const ds = cursor.toISOString().split("T")[0];
      if (workoutDates.has(ds)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }

    // Favorite split
    const splitCount: Record<string, number> = {};
    sessions.forEach((s) => {
      splitCount[s.splitName] = (splitCount[s.splitName] ?? 0) + 1;
    });
    const favoriteSplit =
      Object.entries(splitCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Total volume (weight × reps summed)
    let totalVolume = 0;
    for (const session of sessions) {
      for (const exLog of session.exercises) {
        for (const set of exLog.sets ?? []) {
          const w = parseFloat(set.weight);
          const r = parseInt(set.reps, 10);
          if (!isNaN(w) && !isNaN(r)) totalVolume += w * r;
        }
      }
    }

    return { totalSessions, streak, favoriteSplit, totalVolume };
  }, [sessions]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const importData = useCallback(
    (data: { splits?: Split[]; sessions?: WorkoutSession[]; settings?: AppSettings }) => {
      if (data.splits) setSplits(data.splits);
      if (data.sessions) setSessions(data.sessions);
      if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    },
    []
  );

  return (
    <GymContext.Provider
      value={{
        splits,
        sessions,
        settings,
        addSplit,
        updateSplit,
        deleteSplit,
        saveSession,
        deleteSession,
        getLastSession,
        getPR,
        getStats,
        updateSettings,
        importData,
      }}
    >
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used within GymProvider");
  return ctx;
}
