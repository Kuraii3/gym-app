import { useState, useEffect, useRef, useCallback } from "react";
import { X, SkipForward } from "lucide-react";

interface Props {
  duration: number;
  onDismiss: () => void;
}

export function RestTimer({ duration, onDismiss }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    setDone(true);
    if (navigator.vibrate) navigator.vibrate([150, 80, 150, 80, 250]);
    setTimeout(onDismiss, 2800);
  }, [onDismiss]);

  useEffect(() => {
    setRemaining(duration);
    setDone(false);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [duration]);

  useEffect(() => {
    if (remaining === 0 && !done) finish();
  }, [remaining, done, finish]);

  const pct = Math.max(0, ((duration - remaining) / duration) * 100);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <div
      className={`fixed bottom-[76px] left-4 right-4 z-40 rounded-xl border overflow-hidden transition-all ${
        done
          ? "border-[var(--gj-accent-border)] bg-[var(--gj-accent-subtle)]"
          : "border-[var(--gj-border)] bg-[var(--gj-surface)]"
      }`}
      style={{ maxWidth: "640px", left: "50%", right: "auto", transform: "translateX(-50%)", width: "calc(100% - 2rem)" }}
    >
      {/* Background progress fill */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          width: `${pct}%`,
          backgroundColor: "var(--gj-accent)",
          opacity: 0.06,
        }}
      />

      <div className="relative flex items-center gap-3 px-4 py-3">
        <div className="flex-1">
          <p className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase">
            {done ? "Rest Over — Get back to it!" : "Rest Timer"}
          </p>
          <p
            className={`text-xl font-mono tabular-nums ${
              done
                ? "text-[var(--gj-accent)]"
                : remaining <= 10
                ? "text-orange-400"
                : "text-[var(--gj-text)]"
            }`}
          >
            {done ? "🎯 Back to work" : label}
          </p>
        </div>

        {!done && (
          <button
            onClick={onDismiss}
            className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)] transition-colors"
            aria-label="Skip rest"
          >
            <SkipForward size={16} />
          </button>
        )}

        <button
          onClick={onDismiss}
          className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-4)] hover:text-[var(--gj-text-3)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {!done && (
        <div className="h-0.5 bg-[var(--gj-raised)]">
          <div
            className="h-full bg-[var(--gj-accent)] transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
