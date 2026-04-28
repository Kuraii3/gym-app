import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Split, Exercise } from "../types";
import { useGym } from "../context/GymContext";

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface Props {
  split: Split | null;
  initialName?: string;
  onClose: () => void;
  onSaved?: (split: Split) => void;
}

export function EditRoutineModal({ split, initialName, onClose, onSaved }: Props) {
  const { addSplit, updateSplit } = useGym();
  const [name, setName] = useState(split?.name ?? initialName ?? "");
  const [exercises, setExercises] = useState<Exercise[]>(split?.exercises ?? []);
  const [newExerciseName, setNewExerciseName] = useState("");
  const newExerciseRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleAddExercise() {
    const trimmed = newExerciseName.trim();
    if (!trimmed) return;
    setExercises((prev) => [...prev, { id: genId(), name: trimmed }]);
    setNewExerciseName("");
    setTimeout(() => newExerciseRef.current?.focus(), 0);
  }

  function handleExerciseNameChange(id: string, val: string) {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, name: val } : ex)));
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
    if (!trimmedName) { nameRef.current?.focus(); return; }
    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (split) {
      updateSplit(split.id, trimmedName, validExercises);
      onSaved?.({ ...split, name: trimmedName, exercises: validExercises });
    } else {
      const newSplit = addSplit(trimmedName);
      updateSplit(newSplit.id, trimmedName, validExercises);
      onSaved?.({ ...newSplit, name: trimmedName, exercises: validExercises });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[var(--gj-scrim)] backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--gj-border)] shrink-0">
          <span className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono">
            {split ? "Edit Routine" : "New Routine"}
          </span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text)] transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono">Split Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push Day"
              className="w-full bg-[var(--gj-raised)] border border-[var(--gj-border)] text-[var(--gj-text)] placeholder-[var(--gj-text-4)] px-4 py-3 rounded-lg outline-none focus:border-[var(--gj-accent)] transition-colors text-sm"
            />
          </div>

          {/* Exercises */}
          <div className="space-y-2">
            <label className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono">
              Exercises ({exercises.length})
            </label>

            {exercises.length === 0 && (
              <p className="text-[var(--gj-text-4)] text-sm py-2">No exercises yet. Add one below.</p>
            )}

            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={ex.id} className="flex items-center gap-2 bg-[var(--gj-raised)] border border-[var(--gj-border)] rounded-lg px-3 py-2">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      className="text-[var(--gj-text-3)] hover:text-[var(--gj-text)] disabled:opacity-20 transition-colors">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === exercises.length - 1}
                      className="text-[var(--gj-text-3)] hover:text-[var(--gj-text)] disabled:opacity-20 transition-colors">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <span className="text-[var(--gj-text-4)] text-xs w-5 text-right shrink-0 font-mono">{i + 1}</span>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => handleExerciseNameChange(ex.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") newExerciseRef.current?.focus(); }}
                    className="flex-1 bg-transparent text-[var(--gj-text)] placeholder-[var(--gj-text-4)] outline-none text-sm"
                    placeholder="Exercise name"
                  />
                  <button onClick={() => handleRemoveExercise(ex.id)}
                    className="text-[var(--gj-text-4)] hover:text-[var(--gj-red)] transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add exercise */}
            <div className="flex gap-2 mt-1">
              <input
                ref={newExerciseRef}
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddExercise(); }}
                placeholder="Add exercise..."
                className="flex-1 bg-[var(--gj-raised)] border border-dashed border-[var(--gj-border)] text-[var(--gj-text)] placeholder-[var(--gj-text-4)] px-4 py-2.5 rounded-lg outline-none focus:border-[var(--gj-accent)] transition-colors text-sm"
              />
              <button onClick={handleAddExercise}
                className="w-10 h-10 flex items-center justify-center bg-[var(--gj-raised)] border border-dashed border-[var(--gj-border)] text-[var(--gj-text-3)] hover:text-[var(--gj-accent)] hover:border-[var(--gj-accent)] rounded-lg transition-colors shrink-0">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--gj-border)] shrink-0">
          <button onClick={handleSave}
            className="w-full bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] py-3.5 rounded-lg text-sm tracking-widest uppercase hover:bg-[var(--gj-lime-hover)] active:scale-[0.98] transition-all font-mono">
            Save Routine
          </button>
        </div>
      </div>
    </div>
  );
}
