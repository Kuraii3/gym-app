import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Clock,
  Check,
  Plus,
  X,
  Timer,
} from "lucide-react";
import { useGym } from "../context/GymContext";
import { ExerciseLog, SetLog, WorkoutSession } from "../types";
import { RestTimer } from "./RestTimer";

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

type WorkingLog = {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  notes: string;
  completed: boolean;
  lastSets: SetLog[]; // reference from previous session
  currentPR: number | null; // all-time best weight before this session
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function ElapsedTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)),
      1000
    );
    return () => clearInterval(iv);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0)
    return <>{h}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</>;
  return <>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</>;
}

// ─── Exercise Card ──────────────────────────────────────────────────────────

interface ExerciseCardProps {
  log: WorkingLog;
  onChange: (updated: WorkingLog) => void;
  onStartRest: () => void;
}

function ExerciseCard({ log, onChange, onStartRest }: ExerciseCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);

  function updateSet(index: number, field: "weight" | "reps", value: string) {
    const newSets = log.sets.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onChange({ ...log, sets: newSets });
  }

  function addSet() {
    const last = log.sets[log.sets.length - 1];
    const prevLast = log.lastSets[log.sets.length];
    // Pre-fill weight from current last set (or last session next set)
    const newSet: SetLog = {
      weight: last?.weight || prevLast?.weight || "",
      reps: last?.reps || prevLast?.reps || "",
    };
    onChange({ ...log, sets: [...log.sets, newSet] });
  }

  function removeSet(index: number) {
    if (log.sets.length <= 1) return;
    onChange({ ...log, sets: log.sets.filter((_, i) => i !== index) });
  }

  function toggleComplete() {
    onChange({ ...log, completed: !log.completed });
  }

  // Detect PR: any set weight > all-time PR
  const hasPR =
    log.currentPR !== null &&
    log.sets.some((s) => {
      const w = parseFloat(s.weight);
      return !isNaN(w) && w > log.currentPR!;
    });

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors duration-200 ${
        log.completed
          ? "border-[#C8FF00]/30 bg-[#C8FF00]/5"
          : "border-[#1E1E1E] bg-[#111]"
      }`}
    >
      {/* Exercise header */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
        <button
          onClick={toggleComplete}
          className={`shrink-0 transition-colors ${
            log.completed ? "text-[#C8FF00]" : "text-[#2E2E2E] hover:text-[#555]"
          }`}
          aria-label={log.completed ? "Mark incomplete" : "Mark complete"}
        >
          {log.completed ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h3
            className={`text-base leading-tight truncate transition-colors ${
              log.completed ? "text-[#C8FF00]" : "text-white"
            }`}
          >
            {log.exerciseName}
          </h3>
          {hasPR && (
            <span className="shrink-0 text-[#C8FF00] text-xs font-mono border border-[#C8FF00]/30 px-1.5 py-0.5 rounded">
              ★ PR
            </span>
          )}
        </div>

        {/* Rest timer trigger */}
        <button
          onClick={onStartRest}
          className="shrink-0 w-8 h-8 flex items-center justify-center text-[#333] hover:text-[#C8FF00] transition-colors"
          aria-label="Start rest timer"
          title="Start rest timer"
        >
          <Timer size={15} />
        </button>
      </div>

      {/* Sets table */}
      <div className="px-4 pb-3">
        {/* Column headers */}
        <div className="grid grid-cols-[20px_60px_1fr_1fr_24px] gap-x-2 mb-1.5">
          <span className="text-[#2E2E2E] text-xs font-mono text-center">#</span>
          <span className="text-[#2E2E2E] text-xs font-mono">PREV</span>
          <span className="text-[#444] text-xs font-mono text-center">KG</span>
          <span className="text-[#444] text-xs font-mono text-center">REPS</span>
          <span />
        </div>

        {/* Set rows */}
        <div className="space-y-1.5">
          {log.sets.map((set, i) => {
            const prev = log.lastSets[i];
            const isPRSet =
              log.currentPR !== null &&
              parseFloat(set.weight) > log.currentPR;

            return (
              <div
                key={i}
                className="grid grid-cols-[20px_60px_1fr_1fr_24px] gap-x-2 items-center"
              >
                {/* Set number */}
                <span className="text-[#2E2E2E] text-xs font-mono text-center">
                  {i + 1}
                </span>

                {/* Previous session reference */}
                <span className="text-[#2E2E2E] text-xs font-mono truncate">
                  {prev
                    ? prev.weight
                      ? `${prev.weight}×${prev.reps || "?"}`
                      : "—"
                    : "—"}
                </span>

                {/* Weight input */}
                <input
                  type="text"
                  inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => updateSet(i, "weight", e.target.value)}
                  placeholder={prev?.weight || "0"}
                  className={`w-full bg-[#1A1A1A] border rounded py-1.5 text-sm font-mono text-center outline-none transition-colors placeholder-[#2A2A2A] text-white ${
                    isPRSet
                      ? "border-[#C8FF00]/60 focus:border-[#C8FF00]"
                      : "border-[#222] focus:border-[#C8FF00]"
                  }`}
                />

                {/* Reps input */}
                <input
                  type="text"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(i, "reps", e.target.value)}
                  placeholder={prev?.reps || "0"}
                  className="w-full bg-[#1A1A1A] border border-[#222] rounded py-1.5 text-sm font-mono text-center outline-none focus:border-[#C8FF00] transition-colors placeholder-[#2A2A2A] text-white"
                />

                {/* Remove set */}
                <button
                  onClick={() => removeSet(i)}
                  disabled={log.sets.length <= 1}
                  className="flex justify-center text-[#2E2E2E] hover:text-red-500 transition-colors disabled:opacity-20"
                  aria-label="Remove set"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add set */}
        <button
          onClick={addSet}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[#1E1E1E] rounded-lg text-[#333] hover:text-[#555] hover:border-[#333] transition-colors text-xs font-mono tracking-widest uppercase"
        >
          <Plus size={12} />
          Add Set
        </button>
      </div>

      {/* Notes */}
      <div className="border-t border-[#141414]">
        <button
          onClick={() => setNotesOpen((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-[#333] hover:text-[#555] transition-colors"
        >
          <span className="text-xs font-mono tracking-widest uppercase">
            Notes
          </span>
          {notesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {notesOpen && (
          <div className="px-4 pb-4">
            <textarea
              value={log.notes}
              onChange={(e) => onChange({ ...log, notes: e.target.value })}
              placeholder="Form cues, how it felt, adjustments..."
              rows={3}
              className="w-full bg-[#0D0D0D] border border-[#1A1A1A] text-white placeholder-[#222] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#C8FF00] transition-colors resize-none font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Active Workout Screen ──────────────────────────────────────────────────

export function ActiveWorkout() {
  const { splitId } = useParams<{ splitId: string }>();
  const navigate = useNavigate();
  const { splits, getLastSession, getPR, saveSession, settings } = useGym();

  const split = splits.find((s) => s.id === splitId);
  const lastSession = splitId ? getLastSession(splitId) : null;
  const [startTime] = useState(() => new Date());

  // Initialise working logs
  const [logs, setLogs] = useState<WorkingLog[]>(() => {
    if (!split) return [];
    return split.exercises.map((ex) => {
      const lastExLog = lastSession?.exercises.find(
        (l) => l.exerciseId === ex.id || l.exerciseName === ex.name
      );
      const lastSets: SetLog[] = lastExLog?.sets ?? [];
      // Start with same number of sets as last time, else 3 blank sets
      const initialCount = lastSets.length > 0 ? lastSets.length : 3;
      const sets: SetLog[] = Array.from({ length: initialCount }, () => ({
        weight: "",
        reps: "",
      }));
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets,
        notes: "",
        completed: false,
        lastSets,
        currentPR: getPR(ex.name),
      };
    });
  });

  const [saved, setSaved] = useState(false);

  // Rest timer state
  const [restActive, setRestActive] = useState(false);
  const [restKey, setRestKey] = useState(0); // force re-mount to reset

  function startRest() {
    if (!settings.restTimerEnabled) return;
    setRestKey((k) => k + 1);
    setRestActive(true);
  }

  if (!split) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#444] text-sm mb-4">Split not found.</p>
          <button
            onClick={() => navigate("/")}
            className="text-[#C8FF00] text-sm underline underline-offset-4"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const completedCount = logs.filter((l) => l.completed).length;
  const progressPct = logs.length > 0 ? (completedCount / logs.length) * 100 : 0;

  function updateLog(index: number, updated: WorkingLog) {
    setLogs((prev) => prev.map((l, i) => (i === index ? updated : l)));
  }

  function handleFinish() {
    const cleanLogs: ExerciseLog[] = logs.map(
      ({ lastSets: _ls, currentPR: _pr, ...rest }) => rest
    );
    const session: WorkoutSession = {
      id: genId(),
      splitId: split!.id,
      splitName: split!.name,
      date: new Date().toISOString(),
      exercises: cleanLogs,
    };
    saveSession(session);
    setSaved(true);
    setTimeout(() => navigate("/"), 1800);
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#C8FF00] flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-black" />
          </div>
          <p className="text-white text-lg mb-1">Workout Saved</p>
          <p className="text-[#444] text-xs font-mono">Returning to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#1E1E1E]">
        <div className="flex items-center gap-3 px-4 pt-10 pb-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 flex items-center justify-center text-[#444] hover:text-white transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[#555] text-xs font-mono tracking-widest uppercase">
              {formatDate(new Date())}
            </p>
            <h1 className="text-white text-base truncate leading-tight">
              {split.name}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-[#2E2E2E] shrink-0">
            <Clock size={12} />
            <span className="text-xs font-mono tabular-nums">
              <ElapsedTimer startTime={startTime} />
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[#2E2E2E] text-xs font-mono">
              {completedCount}/{logs.length} exercises
            </span>
            <span className="text-[#2E2E2E] text-xs font-mono">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-px bg-[#181818] w-full rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8FF00] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="px-4 py-4 space-y-3 pb-36">
        {logs.map((log, i) => (
          <ExerciseCard
            key={log.exerciseId}
            log={log}
            onChange={(updated) => updateLog(i, updated)}
            onStartRest={startRest}
          />
        ))}
      </div>

      {/* Rest timer (above footer) */}
      {restActive && (
        <RestTimer
          key={restKey}
          duration={settings.restTimerDuration}
          onDismiss={() => setRestActive(false)}
        />
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#1E1E1E] px-4 py-4">
        <button
          onClick={handleFinish}
          className="w-full bg-[#C8FF00] text-black py-4 rounded-xl text-sm tracking-widest uppercase font-mono hover:bg-[#D8FF40] active:scale-[0.98] transition-all"
        >
          Finish &amp; Save Workout
        </button>
        {completedCount < logs.length && (
          <p className="text-center text-[#222] text-xs font-mono mt-2">
            {logs.length - completedCount} exercise
            {logs.length - completedCount !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>
    </div>
  );
}
