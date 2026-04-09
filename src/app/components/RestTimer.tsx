import { useState, useEffect, useRef, useCallback } from "react";
import { X, SkipForward } from "lucide-react";

interface Props {
  duration: number; // seconds
  onDismiss: () => void;
}

export function RestTimer({ duration, onDismiss }: Props) {
  const [remaining, setRemaining] = useState(duration);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    setDone(true);
    if (navigator.vibrate) navigator.vibrate([150, 80, 150, 80, 250]);
    setTimeout(() => {
      onDismiss();
    }, 2500);
  }, [onDismiss]);

  useEffect(() => {
    setRemaining(duration);
    setDone(false);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [duration]);

  // Trigger done state when remaining hits 0
  useEffect(() => {
    if (remaining === 0 && !done) {
      finish();
    }
  }, [remaining, done, finish]);

  const pct = Math.max(0, ((duration - remaining) / duration) * 100);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <div
      className={`fixed bottom-[76px] left-4 right-4 z-40 rounded-xl border overflow-hidden transition-all ${
        done
          ? "border-[#C8FF00]/60 bg-[#C8FF00]/10"
          : "border-[#2A2A2A] bg-[#141414]"
      }`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 bg-[#C8FF00]/5 transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />

      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* Label */}
        <div className="flex-1">
          <p className="text-[#444] text-xs font-mono tracking-widest uppercase">
            {done ? "Rest Over — Go!" : "Rest Timer"}
          </p>
          <p
            className={`text-xl font-mono tabular-nums transition-colors ${
              done ? "text-[#C8FF00]" : remaining <= 10 ? "text-orange-400" : "text-white"
            }`}
          >
            {done ? "🎯 Back to work" : label}
          </p>
        </div>

        {/* Skip */}
        {!done && (
          <button
            onClick={onDismiss}
            className="w-8 h-8 flex items-center justify-center text-[#444] hover:text-[#888] transition-colors"
            aria-label="Skip rest"
          >
            <SkipForward size={16} />
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="w-8 h-8 flex items-center justify-center text-[#333] hover:text-[#666] transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      {/* Bottom progress bar */}
      {!done && (
        <div className="h-0.5 bg-[#1A1A1A]">
          <div
            className="h-full bg-[#C8FF00] transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
