import { useState } from "react";
import {
  ChevronDown, ChevronUp, Trash2, CalendarDays, Zap,
  BarChart2, TrendingUp, Trophy, Scale, Plus, X
} from "lucide-react";
import { useGym } from "../context/GymContext";
import { WorkoutSession } from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.toISOString().split("T")[0] === b.toISOString().split("T")[0];
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function sessionVolume(s: WorkoutSession) {
  let v = 0;
  for (const ex of s.exercises)
    for (const set of ex.sets ?? []) {
      const w = parseFloat(set.weight), r = parseInt(set.reps, 10);
      if (!isNaN(w) && !isNaN(r)) v += w * r;
    }
  return v;
}

function sessionSets(s: WorkoutSession) {
  return s.exercises.reduce((a, ex) => a + (ex.sets?.length ?? 0), 0);
}

// Compute all-time PRs across sessions
function computePRs(sessions: WorkoutSession[]) {
  const bests: Record<string, { weight: number; reps: string; date: string }> = {};
  for (const session of sessions)
    for (const ex of session.exercises)
      for (const set of ex.sets ?? []) {
        const w = parseFloat(set.weight);
        if (!isNaN(w)) {
          const current = bests[ex.exerciseName];
          if (!current || w > current.weight)
            bests[ex.exerciseName] = { weight: w, reps: set.reps, date: session.date };
        }
      }
  return Object.entries(bests)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.weight - a.weight);
}

// ── Body Weight Log ───────────────────────────────────────────────────────────

function BodyWeightPanel() {
  const { bodyWeights, logBodyWeight, deleteBodyWeight } = useGym();
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);

  function handleLog() {
    const w = parseFloat(input);
    if (isNaN(w) || w <= 0) return;
    logBodyWeight(w, "kg");
    setInput("");
  }

  const recent = bodyWeights.slice(0, expanded ? 20 : 5);

  return (
    <div className="bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gj-border-sub)]">
        <div className="flex items-center gap-2">
          <Scale size={15} className="text-[var(--gj-accent)]" />
          <span className="text-[var(--gj-text)] text-sm font-medium">Body Weight</span>
        </div>
        <span className="text-[var(--gj-text-3)] text-xs font-mono">{bodyWeights.length} entries</span>
      </div>

      {/* Log input */}
      <div className="flex gap-2 px-4 py-3 border-b border-[var(--gj-border-sub)]">
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleLog(); }}
          placeholder="Today's weight (kg)"
          className="flex-1 bg-[var(--gj-raised)] border border-[var(--gj-border)] text-[var(--gj-text)] placeholder-[var(--gj-text-4)] px-3 py-2 rounded-lg outline-none focus:border-[var(--gj-accent)] transition-colors text-sm"
        />
        <button
          onClick={handleLog}
          disabled={!input.trim()}
          className="w-10 h-10 flex items-center justify-center bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] rounded-lg hover:bg-[var(--gj-lime-hover)] disabled:opacity-30 transition-colors shrink-0"
          aria-label="Log weight"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Entries */}
      {bodyWeights.length === 0 ? (
        <p className="px-4 py-4 text-[var(--gj-text-4)] text-xs">No entries yet. Log your weight above.</p>
      ) : (
        <>
          <div className="divide-y divide-[var(--gj-border-sub)]">
            {recent.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="text-[var(--gj-text)] text-sm font-mono">{entry.weight} {entry.unit}</span>
                  <span className="text-[var(--gj-text-3)] text-xs ml-2">
                    {formatDate(entry.date)} · {formatTime(entry.date)}
                  </span>
                </div>
                <button
                  onClick={() => deleteBodyWeight(entry.id)}
                  className="w-7 h-7 flex items-center justify-center text-[var(--gj-text-4)] hover:text-[var(--gj-red)] transition-colors"
                  aria-label="Delete entry"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          {bodyWeights.length > 5 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="w-full flex items-center justify-center gap-1 py-2.5 text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)] transition-colors text-xs font-mono tracking-widest uppercase border-t border-[var(--gj-border-sub)]"
            >
              {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {bodyWeights.length - 5} more</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── PR Board ──────────────────────────────────────────────────────────────────

function PRBoard({ sessions }: { sessions: WorkoutSession[] }) {
  const [expanded, setExpanded] = useState(false);
  const prs = computePRs(sessions);
  if (prs.length === 0) return null;

  const visible = expanded ? prs : prs.slice(0, 6);

  return (
    <div className="bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--gj-border-sub)]">
        <Trophy size={15} className="text-[var(--gj-accent)]" />
        <span className="text-[var(--gj-text)] text-sm font-medium">Personal Records</span>
        <span className="ml-auto text-[var(--gj-text-3)] text-xs font-mono">{prs.length} lifts</span>
      </div>
      <div className="divide-y divide-[var(--gj-border-sub)]">
        {visible.map((pr) => (
          <div key={pr.name} className="flex items-center justify-between px-4 py-2.5">
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-[var(--gj-text)] text-sm truncate">{pr.name}</p>
              <p className="text-[var(--gj-text-3)] text-xs font-mono">{formatDate(pr.date)}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[var(--gj-accent)] text-sm font-mono">{pr.weight} kg</span>
              {pr.reps && (
                <span className="text-[var(--gj-text-3)] text-xs font-mono ml-1">× {pr.reps}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {prs.length > 6 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-center gap-1 py-2.5 text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)] transition-colors text-xs font-mono tracking-widest uppercase border-t border-[var(--gj-border-sub)]"
        >
          {expanded ? <><ChevronUp size={12} /> Collapse</> : <><ChevronDown size={12} /> Show all {prs.length}</>}
        </button>
      )}
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const volume = sessionVolume(session);
  const totalSets = sessionSets(session);
  const completed = session.exercises.filter((e) => e.completed).length;

  return (
    <div className="bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[var(--gj-text)] text-base truncate">{session.splitName}</h3>
            <p className="text-[var(--gj-text-3)] text-xs font-mono mt-0.5">
              {formatTime(session.date)} · {completed}/{session.exercises.length} exercises
            </p>
          </div>
          <button onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-4)] hover:text-[var(--gj-red)] transition-colors shrink-0">
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <BarChart2 size={11} className="text-[var(--gj-text-3)]" />
            <span className="text-[var(--gj-text-3)] text-xs font-mono">{totalSets} sets</span>
          </div>
          {volume > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={11} className="text-[var(--gj-text-3)]" />
              <span className="text-[var(--gj-text-3)] text-xs font-mono">{volume.toLocaleString()} kg vol</span>
            </div>
          )}
        </div>

        {/* Session notes */}
        {session.notes?.trim() && (
          <p className="text-[var(--gj-text-3)] text-xs italic mt-2">"{session.notes.trim()}"</p>
        )}
      </div>

      <button onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-[var(--gj-border-sub)] text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)] transition-colors">
        <span className="text-xs font-mono tracking-widest uppercase">Exercise Detail</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="border-t border-[var(--gj-border-sub)]">
          {session.exercises.map((ex, i) => (
            <div key={ex.exerciseId || i}
              className={`px-4 py-3 ${i !== session.exercises.length - 1 ? "border-b border-[var(--gj-border-sub)]" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${ex.completed ? "text-[var(--gj-accent)]" : "text-[var(--gj-text-2)]"}`}>
                  {ex.exerciseName}
                </span>
                {ex.completed && <span className="text-[var(--gj-accent)] text-xs font-mono">✓</span>}
              </div>
              {(ex.sets ?? []).length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-1">
                  {(ex.sets ?? []).map((set, j) => (
                    <div key={j} className="bg-[var(--gj-raised)] rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[var(--gj-text-4)] text-xs font-mono">Set {j + 1}</p>
                      <p className="text-[var(--gj-text)] text-xs font-mono">
                        {set.weight ? `${set.weight}×${set.reps || "?"}` : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[var(--gj-text-4)] text-xs">No sets logged</span>
              )}
              {ex.notes?.trim() && (
                <p className="text-[var(--gj-text-3)] text-xs italic mt-2">"{ex.notes.trim()}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History Screen ────────────────────────────────────────────────────────────

export function HistoryScreen() {
  const { sessions, deleteSession, getStats } = useGym();
  const stats = getStats();
  const [tab, setTab] = useState<"log" | "prs" | "weight">("log");

  const grouped: { label: string; items: WorkoutSession[] }[] = [];
  const seen = new Map<string, WorkoutSession[]>();
  for (const s of sessions) {
    const label = formatDate(s.date);
    if (!seen.has(label)) { seen.set(label, []); grouped.push({ label, items: seen.get(label)! }); }
    seen.get(label)!.push(s);
  }

  function handleDelete(id: string) {
    if (window.confirm("Delete this session? This cannot be undone.")) deleteSession(id);
  }

  return (
    <div className="min-h-screen bg-[var(--gj-bg)] text-[var(--gj-text)]">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-[var(--gj-border)] bg-[var(--gj-surface)]">
        <div className="flex items-center gap-2 mb-0.5">
          <CalendarDays size={15} className="text-[var(--gj-accent)]" />
          <span className="text-xs text-[var(--gj-accent)] tracking-widest uppercase font-mono">Workout Log</span>
        </div>
        <h1 className="text-[var(--gj-text)] mt-1">History</h1>
      </div>

      {/* Stats row */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 border-b border-[var(--gj-border)] bg-[var(--gj-surface)]">
          <div className="flex flex-col items-center justify-center py-4 border-r border-[var(--gj-border)]">
            <span className="text-[var(--gj-text)] text-lg font-mono">{stats.totalSessions}</span>
            <span className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase mt-0.5">Sessions</span>
          </div>
          <div className="flex flex-col items-center justify-center py-4 border-r border-[var(--gj-border)]">
            <div className="flex items-center gap-1">
              <Zap size={13} className="text-[var(--gj-accent)]" />
              <span className="text-[var(--gj-text)] text-lg font-mono">{stats.streak}</span>
            </div>
            <span className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase mt-0.5">Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <span className="text-[var(--gj-text)] text-lg font-mono">
              {stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : Math.round(stats.totalVolume)}
            </span>
            <span className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase mt-0.5">kg vol</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--gj-border)] bg-[var(--gj-surface)]">
        {(["log", "prs", "weight"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-mono tracking-widest uppercase transition-colors ${
              tab === t
                ? "text-[var(--gj-accent)] border-b-2 border-[var(--gj-accent)]"
                : "text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)]"
            }`}
          >
            {t === "log" ? "Workouts" : t === "prs" ? "PRs" : "Body Wt"}
          </button>
        ))}
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* WORKOUT LOG */}
        {tab === "log" && (
          sessions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[var(--gj-raised)] flex items-center justify-center mx-auto mb-4">
                <CalendarDays size={24} className="text-[var(--gj-text-4)]" />
              </div>
              <p className="text-[var(--gj-text-3)] text-sm">No workouts yet.</p>
              <p className="text-[var(--gj-text-4)] text-xs mt-1">Complete a workout to see it here.</p>
            </div>
          ) : (
            grouped.map(({ label, items }) => (
              <div key={label}>
                <p className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase mb-2.5 px-1">{label}</p>
                <div className="space-y-2">
                  {items.map((s) => (
                    <SessionCard key={s.id} session={s} onDelete={() => handleDelete(s.id)} />
                  ))}
                </div>
              </div>
            ))
          )
        )}

        {/* PR BOARD */}
        {tab === "prs" && (
          sessions.length === 0 ? (
            <div className="py-20 text-center">
              <Trophy size={32} className="text-[var(--gj-text-4)] mx-auto mb-3" />
              <p className="text-[var(--gj-text-3)] text-sm">No PRs yet.</p>
              <p className="text-[var(--gj-text-4)] text-xs mt-1">Log weights in a workout to track records.</p>
            </div>
          ) : (
            <PRBoard sessions={sessions} />
          )
        )}

        {/* BODY WEIGHT */}
        {tab === "weight" && <BodyWeightPanel />}
      </div>
    </div>
  );
}
