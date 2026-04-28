import { useState } from "react";
import { Plus, Pencil, Play, Trash2, Dumbbell, Settings, Sun, Moon, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";
import { useGym } from "../context/GymContext";
import { useTheme } from "../context/ThemeContext";
import { Split } from "../types";
import { EditRoutineModal } from "./EditRoutineModal";
import { SettingsModal } from "./SettingsModal";

export function HomeScreen() {
  const { splits, deleteSplit, getStats } = useGym();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [newSplitName, setNewSplitName] = useState("");
  const [editTarget, setEditTarget] = useState<Split | null | "new">(null);
  const [pendingName, setPendingName] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const stats = getStats();

  function handleAddSplit() {
    const trimmed = newSplitName.trim();
    if (!trimmed) return;
    setPendingName(trimmed);
    setEditTarget("new");
  }

  function handleDelete(splitId: string) {
    if (window.confirm("Delete this split? This cannot be undone.")) deleteSplit(splitId);
  }

  return (
    <div className="min-h-screen bg-[var(--gj-bg)] text-[var(--gj-text)]">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-5 border-b border-[var(--gj-border)] bg-[var(--gj-surface)]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-md bg-[var(--gj-lime)] flex items-center justify-center">
                <Dumbbell size={13} className="text-[var(--gj-lime-fg)]" />
              </div>
              <span className="text-xs text-[var(--gj-accent)] tracking-widest uppercase font-mono">
                Gym Journal
              </span>
            </div>
            <h1 className="text-[var(--gj-text)] mt-1">My Splits</h1>
          </div>

          {/* Mobile-only controls (desktop shows in sidebar) */}
          <div className="flex items-center gap-1 lg:hidden mt-9">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text)] hover:bg-[var(--gj-raised)] rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text)] hover:bg-[var(--gj-raised)] rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {stats.totalSessions > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--gj-border-sub)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--gj-text)] text-sm font-mono">{stats.totalSessions}</span>
              <span className="text-[var(--gj-text-3)] text-xs">sessions</span>
            </div>
            {stats.streak > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap size={13} className="text-[var(--gj-accent)]" />
                <span className="text-[var(--gj-text)] text-sm font-mono">{stats.streak}</span>
                <span className="text-[var(--gj-text-3)] text-xs">day streak</span>
              </div>
            )}
            {stats.totalVolume > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-[var(--gj-text-3)]" />
                <span className="text-[var(--gj-text)] text-sm font-mono">
                  {stats.totalVolume >= 1000
                    ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                    : Math.round(stats.totalVolume)}kg
                </span>
                <span className="text-[var(--gj-text-3)] text-xs">total volume</span>
              </div>
            )}
            {stats.favoriteSplit && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[var(--gj-text-3)] text-xs truncate">
                  Fav: <span className="text-[var(--gj-text-2)]">{stats.favoriteSplit}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add split ── */}
      <div className="px-5 py-4 border-b border-[var(--gj-border)] bg-[var(--gj-surface)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSplitName}
            onChange={(e) => setNewSplitName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddSplit(); }}
            placeholder="New split name..."
            className="flex-1 bg-[var(--gj-raised)] border border-[var(--gj-border)] text-[var(--gj-text)] placeholder-[var(--gj-text-4)] px-4 py-3 rounded-lg outline-none focus:border-[var(--gj-accent)] transition-colors text-sm"
          />
          <button
            onClick={handleAddSplit}
            disabled={!newSplitName.trim()}
            className="flex items-center gap-2 px-4 py-3 bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] rounded-lg text-sm tracking-widest uppercase font-mono hover:bg-[var(--gj-lime-hover)] active:scale-[0.97] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* ── Split list ── */}
      <div className="px-5 py-5 space-y-3">
        {splits.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--gj-raised)] flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={24} className="text-[var(--gj-text-4)]" />
            </div>
            <p className="text-[var(--gj-text-3)] text-sm">No splits yet.</p>
            <p className="text-[var(--gj-text-4)] text-xs mt-1">Add your first routine above.</p>
          </div>
        )}

        {splits.map((split) => (
          <SplitCard
            key={split.id}
            split={split}
            onEdit={() => setEditTarget(split)}
            onDelete={() => handleDelete(split.id)}
            onStart={() => navigate(`/workout/${split.id}`)}
          />
        ))}
      </div>

      {/* Modals */}
      {editTarget !== null && (
        <EditRoutineModal
          split={editTarget === "new" ? null : editTarget}
          initialName={editTarget === "new" ? pendingName : undefined}
          onClose={() => { setEditTarget(null); setNewSplitName(""); setPendingName(""); }}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function SplitCard({
  split,
  onEdit,
  onDelete,
  onStart,
}: {
  split: Split;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}) {
  return (
    <div className="bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-xl overflow-hidden hover:border-[var(--gj-accent)]/50 transition-colors">
      {/* Info row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0 mr-3">
          <h2 className="text-[var(--gj-text)] text-base truncate">{split.name}</h2>
          <p className="text-[var(--gj-text-3)] text-xs mt-0.5 font-mono">
            {split.exercises.length} exercise{split.exercises.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text)] hover:bg-[var(--gj-raised)] rounded-lg transition-colors"
            aria-label={`Edit ${split.name}`}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-red)] hover:bg-[var(--gj-raised)] rounded-lg transition-colors"
            aria-label={`Delete ${split.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Exercise preview */}
      {split.exercises.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[var(--gj-text-4)] text-xs font-mono truncate">
            {split.exercises.slice(0, 5).map((ex) => ex.name).join(" · ")}
            {split.exercises.length > 5 && ` · +${split.exercises.length - 5} more`}
          </p>
        </div>
      )}

      {/* Start button */}
      <div className="border-t border-[var(--gj-border-sub)] px-4 py-3">
        <button
          onClick={onStart}
          disabled={split.exercises.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] py-3 rounded-lg text-sm tracking-widest uppercase font-mono hover:bg-[var(--gj-lime-hover)] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Play size={14} fill="currentColor" />
          Start Workout
        </button>
      </div>
    </div>
  );
}
