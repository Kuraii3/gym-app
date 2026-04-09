import { useState } from "react";
import { Plus, Pencil, Play, Trash2, Dumbbell, Settings, Zap } from "lucide-react";
import { useNavigate } from "react-router";
import { useGym } from "../context/GymContext";
import { Split } from "../types";
import { EditRoutineModal } from "./EditRoutineModal";
import { SettingsModal } from "./SettingsModal";

export function HomeScreen() {
  const { splits, deleteSplit, getStats } = useGym();
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

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAddSplit();
  }

  function handleStartWorkout(split: Split) {
    navigate(`/workout/${split.id}`);
  }

  function handleDelete(splitId: string) {
    if (window.confirm("Delete this split? This cannot be undone.")) {
      deleteSplit(splitId);
    }
  }

  const isEditOpen = editTarget !== null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 border-b border-[#1E1E1E]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={16} className="text-[#C8FF00]" />
              <span className="text-xs text-[#C8FF00] tracking-widest uppercase font-mono">
                Gym Journal
              </span>
            </div>
            <h1 className="text-2xl text-white mt-0.5">My Splits</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center text-[#333] hover:text-[#666] transition-colors mt-10"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Stats bar */}
        {stats.totalSessions > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-[#1A1A1A]">
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-mono">
                {stats.totalSessions}
              </span>
              <span className="text-[#333] text-xs font-mono">sessions</span>
            </div>
            {stats.streak > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-[#C8FF00]" />
                <span className="text-white text-sm font-mono">
                  {stats.streak}
                </span>
                <span className="text-[#333] text-xs font-mono">day streak</span>
              </div>
            )}
            {stats.favoriteSplit && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[#333] text-xs font-mono truncate">
                  Fav:{" "}
                  <span className="text-[#555]">{stats.favoriteSplit}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add new split */}
      <div className="px-5 py-4 border-b border-[#1E1E1E]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSplitName}
            onChange={(e) => setNewSplitName(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="New split name..."
            className="flex-1 bg-[#141414] border border-[#2A2A2A] text-white placeholder-[#333] px-4 py-3 rounded-lg outline-none focus:border-[#C8FF00] transition-colors text-sm"
          />
          <button
            onClick={handleAddSplit}
            disabled={!newSplitName.trim()}
            className="flex items-center gap-2 px-4 py-3 bg-[#C8FF00] text-black rounded-lg text-sm tracking-widest uppercase font-mono hover:bg-[#D8FF40] active:scale-[0.97] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Splits list */}
      <div className="px-5 py-4 space-y-3">
        {splits.length === 0 && (
          <div className="py-16 text-center">
            <Dumbbell size={32} className="text-[#222] mx-auto mb-3" />
            <p className="text-[#444] text-sm">No splits yet.</p>
            <p className="text-[#333] text-xs mt-1">
              Add your first routine above.
            </p>
          </div>
        )}

        {splits.map((split) => (
          <div
            key={split.id}
            className="bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden"
          >
            {/* Split info */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-white text-base truncate">{split.name}</h2>
                <p className="text-[#444] text-xs mt-0.5 font-mono">
                  {split.exercises.length} exercise
                  {split.exercises.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditTarget(split)}
                  className="w-9 h-9 flex items-center justify-center text-[#444] hover:text-white hover:bg-[#1E1E1E] rounded-lg transition-colors"
                  aria-label={`Edit ${split.name}`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(split.id)}
                  className="w-9 h-9 flex items-center justify-center text-[#444] hover:text-red-500 hover:bg-[#1E1E1E] rounded-lg transition-colors"
                  aria-label={`Delete ${split.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Exercise preview */}
            {split.exercises.length > 0 && (
              <div className="px-4 pb-3">
                <p className="text-[#2E2E2E] text-xs font-mono truncate">
                  {split.exercises
                    .slice(0, 4)
                    .map((ex) => ex.name)
                    .join(" · ")}
                  {split.exercises.length > 4 &&
                    ` · +${split.exercises.length - 4} more`}
                </p>
              </div>
            )}

            {/* Start button */}
            <div className="border-t border-[#1A1A1A] px-4 py-3">
              <button
                onClick={() => handleStartWorkout(split)}
                disabled={split.exercises.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#C8FF00] text-black py-3 rounded-lg text-sm tracking-widest uppercase font-mono hover:bg-[#D8FF40] active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Play size={14} fill="currentColor" />
                Start Workout
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit routine modal */}
      {isEditOpen && (
        <EditRoutineModal
          split={editTarget === "new" ? null : editTarget}
          initialName={editTarget === "new" ? pendingName : undefined}
          onClose={() => {
            setEditTarget(null);
            setNewSplitName("");
            setPendingName("");
          }}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
