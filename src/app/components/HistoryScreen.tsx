import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, CalendarDays, Zap, BarChart2, TrendingUp } from "lucide-react";
import { useGym } from "../context/GymContext";
import { WorkoutSession } from "../types";

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.toISOString().split("T")[0] === b.toISOString().split("T")[0];

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function calcVolume(session: WorkoutSession): number {
  let v = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets ?? []) {
      const w = parseFloat(set.weight);
      const r = parseInt(set.reps, 10);
      if (!isNaN(w) && !isNaN(r)) v += w * r;
    }
  }
  return v;
}

function calcSets(session: WorkoutSession): number {
  return session.exercises.reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0);
}

function SessionCard({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const volume = calcVolume(session);
  const totalSets = calcSets(session);
  const completedExercises = session.exercises.filter((e) => e.completed).length;

  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden">
      {/* Session header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-base truncate">{session.splitName}</h3>
            <p className="text-[#444] text-xs font-mono mt-0.5">
              {formatTime(session.date)} · {completedExercises}/{session.exercises.length} exercises
            </p>
          </div>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-[#2E2E2E] hover:text-red-500 transition-colors shrink-0"
            aria-label="Delete session"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <BarChart2 size={11} className="text-[#333]" />
            <span className="text-[#444] text-xs font-mono">
              {totalSets} sets
            </span>
          </div>
          {volume > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={11} className="text-[#333]" />
              <span className="text-[#444] text-xs font-mono">
                {volume.toLocaleString()} kg vol
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-[#1A1A1A] text-[#333] hover:text-[#555] transition-colors"
      >
        <span className="text-xs font-mono tracking-widest uppercase">
          Exercise Detail
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#0D0D0D]">
          {session.exercises.map((ex, i) => (
            <div
              key={ex.exerciseId || i}
              className={`px-4 py-3 ${
                i !== session.exercises.length - 1
                  ? "border-b border-[#141414]"
                  : ""
              }`}
            >
              {/* Exercise name + completion badge */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm ${
                    ex.completed ? "text-[#C8FF00]" : "text-[#666]"
                  }`}
                >
                  {ex.exerciseName}
                </span>
                {ex.completed && (
                  <span className="text-[#C8FF00] text-xs font-mono">✓</span>
                )}
              </div>

              {/* Sets */}
              {(ex.sets ?? []).length > 0 ? (
                <div className="space-y-1">
                  {(ex.sets ?? []).map((set, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-2"
                    >
                      <span className="text-[#2E2E2E] text-xs font-mono w-4">
                        {j + 1}
                      </span>
                      <span className="text-[#444] text-xs font-mono">
                        {set.weight
                          ? `${set.weight} × ${set.reps || "—"}`
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[#2E2E2E] text-xs font-mono">
                  No sets logged
                </span>
              )}

              {/* Notes */}
              {ex.notes?.trim() && (
                <p className="text-[#333] text-xs font-mono mt-2 italic">
                  "{ex.notes.trim()}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoryScreen() {
  const { sessions, deleteSession, getStats } = useGym();
  const stats = getStats();

  // Group sessions by date label
  const grouped: { label: string; sessions: WorkoutSession[] }[] = [];
  const seen = new Map<string, WorkoutSession[]>();

  for (const s of sessions) {
    const label = formatSessionDate(s.date);
    if (!seen.has(label)) {
      seen.set(label, []);
      grouped.push({ label, sessions: seen.get(label)! });
    }
    seen.get(label)!.push(s);
  }

  function handleDelete(sessionId: string) {
    if (window.confirm("Delete this session log? This cannot be undone.")) {
      deleteSession(sessionId);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={16} className="text-[#C8FF00]" />
          <span className="text-xs text-[#C8FF00] tracking-widest uppercase font-mono">
            Workout Log
          </span>
        </div>
        <h1 className="text-2xl text-white mt-1">History</h1>
      </div>

      {/* Stats summary */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 border-b border-[#1E1E1E]">
          <div className="flex flex-col items-center justify-center py-4 border-r border-[#1E1E1E]">
            <span className="text-white text-lg font-mono">{stats.totalSessions}</span>
            <span className="text-[#333] text-xs font-mono tracking-widest uppercase mt-0.5">
              Sessions
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 border-r border-[#1E1E1E]">
            <div className="flex items-center gap-1">
              <Zap size={13} className="text-[#C8FF00]" />
              <span className="text-white text-lg font-mono">{stats.streak}</span>
            </div>
            <span className="text-[#333] text-xs font-mono tracking-widest uppercase mt-0.5">
              Day streak
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <span className="text-white text-lg font-mono">
              {stats.totalVolume >= 1000
                ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                : Math.round(stats.totalVolume)}
            </span>
            <span className="text-[#333] text-xs font-mono tracking-widest uppercase mt-0.5">
              kg volume
            </span>
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="px-4 py-4 space-y-6">
        {sessions.length === 0 && (
          <div className="py-20 text-center">
            <CalendarDays size={32} className="text-[#222] mx-auto mb-3" />
            <p className="text-[#444] text-sm">No workouts yet.</p>
            <p className="text-[#333] text-xs mt-1">
              Complete a workout to see it here.
            </p>
          </div>
        )}

        {grouped.map(({ label, sessions: groupSessions }) => (
          <div key={label}>
            <p className="text-[#333] text-xs font-mono tracking-widest uppercase mb-2 px-1">
              {label}
            </p>
            <div className="space-y-2">
              {groupSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDelete={() => handleDelete(session.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
