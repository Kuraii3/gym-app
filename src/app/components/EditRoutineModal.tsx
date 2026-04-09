import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Split, Exercise } from "../types";
import { useGym } from "../context/GymContext";

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface Props {
  split: Split | null; // null = create new
  initialName?: string;
  onClose: () => void;
  onSaved?: (split: Split) => void;
}

export function EditRoutineModal({ split, initialName, onClose, onSaved }: Props) {
  const { addSplit, updateSplit } = useGym();
  const [name, setName] = useState(split?.name ?? initialName ?? "");
  const [exercises, setExercises] = useState<Exercise[]>(
    split?.exercises ?? []
  );
  const [newExerciseName, setNewExerciseName] = useState("");
  const newExerciseRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleAddExercise() {
    const trimmed = newExerciseName.trim();
    if (!trimmed) return;
    setExercises((prev) => [...prev, { id: genId(), name: trimmed }]);
    setNewExerciseName("");
    setTimeout(() => newExerciseRef.current?.focus(), 0);
  }

  function handleExerciseNameChange(id: string, val: string) {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, name: val } : ex))
    );
  }

  function handleRemoveExercise(id: string) {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === exercises.length - 1) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      nameRef.current?.focus();
      return;
    }
    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (split) {
      updateSplit(split.id, trimmedName, validExercises);
      onSaved?.({ ...split, name: trimmedName, exercises: validExercises });
    } else {
      const newSplit = addSplit(trimmedName);
      // update with exercises
      updateSplit(newSplit.id, trimmedName, validExercises);
      onSaved?.({ ...newSplit, name: trimmedName, exercises: validExercises });
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-[#2A2A2A] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] shrink-0">
          <span className="text-[#888] text-xs tracking-widest uppercase">
            {split ? "Edit Routine" : "New Routine"}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {/* Split name */}
          <div className="space-y-2">
            <label className="text-xs text-[#888] tracking-widest uppercase">
              Split Name
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push Day"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-[#3A3A3A] px-4 py-3 rounded-lg outline-none focus:border-[#C8FF00] transition-colors"
            />
          </div>

          {/* Exercise list */}
          <div className="space-y-2">
            <label className="text-xs text-[#888] tracking-widest uppercase">
              Exercises ({exercises.length})
            </label>

            {exercises.length === 0 && (
              <p className="text-[#3A3A3A] text-sm py-2">
                No exercises yet. Add one below.
              </p>
            )}

            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2"
                >
                  {/* Order buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="text-[#444] hover:text-[#888] disabled:opacity-20 transition-colors"
                      aria-label="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === exercises.length - 1}
                      className="text-[#444] hover:text-[#888] disabled:opacity-20 transition-colors"
                      aria-label="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Exercise number */}
                  <span className="text-[#3A3A3A] text-xs w-5 text-right shrink-0 font-mono">
                    {i + 1}
                  </span>

                  {/* Exercise name input */}
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) =>
                      handleExerciseNameChange(ex.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") newExerciseRef.current?.focus();
                    }}
                    className="flex-1 bg-transparent text-white placeholder-[#3A3A3A] outline-none text-sm"
                    placeholder="Exercise name"
                  />

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveExercise(ex.id)}
                    className="text-[#3A3A3A] hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remove exercise"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new exercise */}
            <div className="flex gap-2 mt-1">
              <input
                ref={newExerciseRef}
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddExercise();
                }}
                placeholder="Add exercise..."
                className="flex-1 bg-[#1A1A1A] border border-dashed border-[#2A2A2A] text-white placeholder-[#3A3A3A] px-4 py-2.5 rounded-lg outline-none focus:border-[#C8FF00] transition-colors text-sm"
              />
              <button
                onClick={handleAddExercise}
                className="w-10 h-10 flex items-center justify-center bg-[#1A1A1A] border border-dashed border-[#2A2A2A] text-[#555] hover:text-[#C8FF00] hover:border-[#C8FF00] rounded-lg transition-colors shrink-0"
                aria-label="Add exercise"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2A2A2A] shrink-0">
          <button
            onClick={handleSave}
            className="w-full bg-[#C8FF00] text-black py-3.5 rounded-lg text-sm tracking-widest uppercase hover:bg-[#D8FF40] active:scale-[0.98] transition-all font-mono"
          >
            Save Routine
          </button>
        </div>
      </div>
    </div>
  );
}