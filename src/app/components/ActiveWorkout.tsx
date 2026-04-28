import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, ChevronDown, ChevronUp, CheckSquare, Square,
  Clock, Check, Plus, X, Timer, Calculator,
} from "lucide-react";
import { useGym } from "../context/GymContext";
import { ExerciseLog, SetLog, WorkoutSession } from "../types";
import { RestTimer } from "./RestTimer";
import { PlateCalculator } from "./PlateCalculator";

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

type WorkingLog = {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  notes: string;
  completed: boolean;
  lastSets: SetLog[];
  currentPR: number | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/** Epley 1RM estimate — only meaningful for reps 1-12 */
function estimate1RM(sets: SetLog[]): number | null {
  let best: number | null = null;
  for (const s of sets) {
    const w = parseFloat(s.weight), r = parseInt(s.reps, 10);
    if (!isNaN(w) && !isNaN(r) && r > 0 && r <= 12) {
      const e = Math.round(w * (1 + r / 30) * 10) / 10;
      if (best === null || e > best) best = e;
    }
  }
  return best;
}

function ElapsedTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return <>{h}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</>;
  return <>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</>;
}

// ── Exercise Card ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  log: WorkingLog;
  onChange: (u: WorkingLog) => void;
  onStartRest: () => void;
}

function ExerciseCard({ log, onChange, onStartRest }: ExerciseCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [showPlates, setShowPlates] = useState(false);

  function updateSet(i: number, field: "weight" | "reps", value: string) {
    const newSets = log.sets.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    onChange({ ...log, sets: newSets });
  }

  function addSet() {
    const last = log.sets[log.sets.length - 1];
    const prevLast = log.lastSets[log.sets.length];
    onChange({ ...log, sets: [...log.sets, { weight: last?.weight || prevLast?.weight || "", reps: last?.reps || prevLast?.reps || "" }] });
  }

  function removeSet(i: number) {
    if (log.sets.length <= 1) return;
    onChange({ ...log, sets: log.sets.filter((_, idx) => idx !== i) });
  }

  const hasPR = log.currentPR !== null && log.sets.some((s) => {
    const w = parseFloat(s.weight);
    return !isNaN(w) && w > log.currentPR!;
  });

  const est1RM = estimate1RM(log.sets);

  // Best weight currently typed (for plate calculator default)
  const bestWeight = log.sets.reduce((best, s) => {
    const w = parseFloat(s.weight);
    return !isNaN(w) && w > best ? w : best;
  }, 0);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        log.completed
          ? "border-[var(--gj-accent-border)] bg-[var(--gj-accent-subtle)]"
          : "border-[var(--gj-border)] bg-[var(--gj-surface)]"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
        <button
          onClick={() => onChange({ ...log, completed: !log.completed })}
          className={`shrink-0 transition-colors ${log.completed ? "text-[var(--gj-accent)]" : "text-[var(--gj-text-4)] hover:text-[var(--gj-text-3)]"}`}
        >
          {log.completed ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>

        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          <h3 className={`text-base leading-tight transition-colors ${log.completed ? "text-[var(--gj-accent)]" : "text-[var(--gj-text)]"}`}>
            {log.exerciseName}
          </h3>
          {hasPR && (
            <span className="text-[var(--gj-accent)] text-xs font-mono border border-[var(--gj-accent-border)] px-1.5 py-0.5 rounded shrink-0">
              ★ PR
            </span>
          )}
          {est1RM !== null && (
            <span className="text-[var(--gj-text-3)] text-xs font-mono shrink-0">
              ≈{est1RM} kg 1RM
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowPlates(true)}
            className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-4)] hover:text-[var(--gj-accent)] transition-colors"
            aria-label="Plate calculator"
            title="Plate calculator"
          >
            <Calculator size={14} />
          </button>
          <button
            onClick={onStartRest}
            className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-4)] hover:text-[var(--gj-accent)] transition-colors"
            aria-label="Start rest timer"
            title="Start rest timer"
          >
            <Timer size={14} />
          </button>
        </div>
      </div>

      {/* Sets table */}
      <div className="px-4 pb-3">
        {/* Column headers */}
        <div className="grid grid-cols-[20px_60px_1fr_1fr_24px] gap-x-2 mb-1.5 px-1">
          <span className="text-[var(--gj-text-4)] text-xs font-mono text-center">#</span>
          <span className="text-[var(--gj-text-4)] text-xs font-mono">PREV</span>
          <span className="text-[var(--gj-text-4)] text-xs font-mono text-center">KG</span>
          <span className="text-[var(--gj-text-4)] text-xs font-mono text-center">REPS</span>
          <span />
        </div>

        <div className="space-y-1.5">
          {log.sets.map((set, i) => {
            const prev = log.lastSets[i];
            const isPRSet = log.currentPR !== null && parseFloat(set.weight) > log.currentPR;
            return (
              <div key={i} className="grid grid-cols-[20px_60px_1fr_1fr_24px] gap-x-2 items-center">
                <span className="text-[var(--gj-text-4)] text-xs font-mono text-center">{i + 1}</span>
                <span className="text-[var(--gj-text-4)] text-xs font-mono truncate">
                  {prev ? (prev.weight ? `${prev.weight}×${prev.reps || "?"}` : "—") : "—"}
                </span>
                <input
                  type="text" inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => updateSet(i, "weight", e.target.value)}
                  placeholder={prev?.weight || "0"}
                  className={`w-full bg-[var(--gj-raised)] border rounded py-1.5 text-sm font-mono text-center outline-none transition-colors placeholder-[var(--gj-text-4)] text-[var(--gj-text)] ${
                    isPRSet ? "border-[var(--gj-accent-border)] focus:border-[var(--gj-accent)]" : "border-[var(--gj-border)] focus:border-[var(--gj-accent)]"
                  }`}
                />
                <input
                  type="text" inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(i, "reps", e.target.value)}
                  placeholder={prev?.reps || "0"}
                  className="w-full bg-[var(--gj-raised)] border border-[var(--gj-border)] rounded py-1.5 text-sm font-mono text-center outline-none focus:border-[var(--gj-accent)] transition-colors placeholder-[var(--gj-text-4)] text-[var(--gj-text)]"
                />
                <button
                  onClick={() => removeSet(i)}
                  disabled={log.sets.length <= 1}
                  className="flex justify-center text-[var(--gj-text-4)] hover:text-[var(--gj-red)] transition-colors disabled:opacity-20"
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
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[var(--gj-border)] rounded-lg text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)] hover:border-[var(--gj-text-3)] transition-colors text-xs font-mono tracking-widest uppercase"
        >
          <Plus size={12} /> Add Set
        </button>
      </div>

      {/* Notes collapsible */}
      <div className="border-t border-[var(--gj-border-sub)]">
        <button
          onClick={() => setNotesOpen((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)] transition-colors"
        >
          <span className="text-xs font-mono tracking-widest uppercase">Exercise Notes</span>
          {notesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {notesOpen && (
          <div className="px-4 pb-4">
            <textarea
              value={log.notes}
              onChange={(e) => onChange({ ...log, notes: e.target.value })}
              placeholder="Form cues, adjustments..."
              rows={3}
              className="w-full bg-[var(--gj-bg)] border border-[var(--gj-border)] text-[var(--gj-text)] placeholder-[var(--gj-text-4)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--gj-accent)] transition-colors resize-none font-mono"
            />
          </div>
        )}
      </div>

      {/* Plate Calculator modal */}
      {showPlates && (
        <PlateCalculator
          initialWeight={bestWeight > 0 ? String(bestWeight) : ""}
          onClose={() => setShowPlates(false)}
        />
      )}
    </div>
  );
}

// ── Active Workout Screen ─────────────────────────────────────────────────────

export function ActiveWorkout() {
  const { splitId } = useParams<{ splitId: string }>();
  const navigate = useNavigate();
  const { splits, getLastSession, getPR, saveSession, settings } = useGym();

  const split = splits.find((s) => s.id === splitId);
  const lastSession = splitId ? getLastSession(splitId) : null;
  const [startTime] = useState(() => new Date());

  const [logs, setLogs] = useState<WorkingLog[]>(() => {
    if (!split) return [];
    return split.exercises.map((ex) => {
      const lastExLog = lastSession?.exercises.find(
        (l) => l.exerciseId === ex.id || l.exerciseName === ex.name
      );
      const lastSets: SetLog[] = lastExLog?.sets ?? [];
      const initialCount = lastSets.length > 0 ? lastSets.length : 3;
      const sets: SetLog[] = Array.from({ length: initialCount }, () => ({ weight: "", reps: "" }));
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

  const [sessionNotes, setSessionNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [restActive, setRestActive] = useState(false);
  const [restKey, setRestKey] = useState(0);
  const [notesExpanded, setNotesExpanded] = useState(false);

  function startRest() {
    if (!settings.restTimerEnabled) return;
    setRestKey((k) => k + 1);
    setRestActive(true);
  }

  const completedCount = logs.filter((l) => l.completed).length;
  const progressPct = logs.length > 0 ? (completedCount / logs.length) * 100 : 0;

  function handleFinish() {
    const cleanLogs: ExerciseLog[] = logs.map(({ lastSets: _ls, currentPR: _pr, ...rest }) => rest);
    const session: WorkoutSession = {
      id: genId(),
      splitId: split!.id,
      splitName: split!.name,
      date: new Date().toISOString(),
      exercises: cleanLogs,
      notes: sessionNotes.trim() || undefined,
    };
    saveSession(session);
    setSaved(true);
    setTimeout(() => navigate("/"), 1800);
  }

  if (!split) {
    return (
      <div className="min-h-screen bg-[var(--gj-bg)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--gj-text-3)] text-sm mb-4">Split not found.</p>
          <button onClick={() => navigate("/")} className="text-[var(--gj-accent)] text-sm underline underline-offset-4">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-[var(--gj-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--gj-lime)] flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-[var(--gj-lime-fg)]" />
          </div>
          <p className="text-[var(--gj-text)] text-lg mb-1">Workout Saved</p>
          <p className="text-[var(--gj-text-3)] text-xs font-mono">Returning to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gj-bg)] text-[var(--gj-text)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[var(--gj-surface)]/95 backdrop-blur-md border-b border-[var(--gj-border)]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-4 pt-10 pb-3">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text)] hover:bg-[var(--gj-raised)] rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase">
                {formatDate(new Date())}
              </p>
              <h1 className="text-[var(--gj-text)] text-base truncate leading-tight">{split.name}</h1>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--gj-text-3)] shrink-0">
              <Clock size={12} />
              <span className="text-xs font-mono tabular-nums">
                <ElapsedTimer startTime={startTime} />
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[var(--gj-text-3)] text-xs font-mono">
                {completedCount}/{logs.length} exercises
              </span>
              <span className="text-[var(--gj-text-3)] text-xs font-mono">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1 bg-[var(--gj-raised)] w-full rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--gj-accent)] transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="px-4 py-4 space-y-3 pb-56">
        {logs.map((log, i) => (
          <ExerciseCard
            key={log.exerciseId}
            log={log}
            onChange={(u) => setLogs((prev) => prev.map((l, idx) => (idx === i ? u : l)))}
            onStartRest={startRest}
          />
        ))}

        {/* Session notes */}
        <div className="bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-xl overflow-hidden">
          <button
            onClick={() => setNotesExpanded((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)] transition-colors"
          >
            <span className="text-xs font-mono tracking-widest uppercase">Session Notes</span>
            {notesExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {notesExpanded && (
            <div className="px-4 pb-4 border-t border-[var(--gj-border-sub)]">
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Overall workout notes, how you felt, sleep quality..."
                rows={4}
                className="w-full mt-3 bg-[var(--gj-bg)] border border-[var(--gj-border)] text-[var(--gj-text)] placeholder-[var(--gj-text-4)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--gj-accent)] transition-colors resize-none font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Rest timer */}
      {restActive && (
        <RestTimer key={restKey} duration={settings.restTimerDuration} onDismiss={() => setRestActive(false)} />
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--gj-surface)]/95 backdrop-blur-md border-t border-[var(--gj-border)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={handleFinish}
            className="w-full bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] py-4 rounded-xl text-sm tracking-widest uppercase font-mono hover:bg-[var(--gj-lime-hover)] active:scale-[0.98] transition-all"
          >
            Finish &amp; Save Workout
          </button>
          {completedCount < logs.length && (
            <p className="text-center text-[var(--gj-text-4)] text-xs font-mono mt-2">
              {logs.length - completedCount} exercise{logs.length - completedCount !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      </div>
    </div>
  );
}