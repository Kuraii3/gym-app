import { useState } from "react";
import { X, Calculator } from "lucide-react";
import { useGym } from "../context/GymContext";

interface Props {
  initialWeight?: string;
  onClose: () => void;
}

const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25];

const PLATE_STYLES: Record<number, { bg: string; text: string; h: string }> = {
  25:   { bg: "#EF4444", text: "#fff",     h: "h-16" },
  20:   { bg: "#3B82F6", text: "#fff",     h: "h-14" },
  15:   { bg: "#EAB308", text: "#0f0f0f",  h: "h-12" },
  10:   { bg: "#22C55E", text: "#fff",     h: "h-10" },
  5:    { bg: "#E5E7EB", text: "#111",     h: "h-9"  },
  2.5:  { bg: "#F97316", text: "#fff",     h: "h-7"  },
  1.25: { bg: "#374151", text: "#fff",     h: "h-6"  },
};

function calcPlates(targetKg: number, barKg: number): number[] {
  const perSide = (targetKg - barKg) / 2;
  if (perSide < 0) return [];
  const plates: number[] = [];
  let remaining = perSide;
  for (const p of PLATE_SIZES) {
    while (remaining >= p - 0.001) {
      plates.push(p);
      remaining = Math.round((remaining - p) * 1000) / 1000;
    }
  }
  return plates;
}

function PlateVisual({ plates }: { plates: number[] }) {
  const sleeve = plates.slice(0, 6); // max 6 visible per side
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {/* Left mirror */}
      {[...sleeve].reverse().map((p, i) => {
        const style = PLATE_STYLES[p];
        return (
          <div
            key={`l-${i}`}
            className={`${style.h} w-5 rounded-sm flex items-end justify-center pb-0.5 shadow`}
            style={{ backgroundColor: style.bg }}
            title={`${p}kg`}
          >
            <span
              className="text-[8px] font-bold"
              style={{ color: style.text, transform: "rotate(-90deg)", lineHeight: 1 }}
            >
              {p}
            </span>
          </div>
        );
      })}

      {/* Bar */}
      <div className="h-3 w-20 rounded-full bg-[var(--gj-text-3)] opacity-60" />

      {/* Right side */}
      {sleeve.map((p, i) => {
        const style = PLATE_STYLES[p];
        return (
          <div
            key={`r-${i}`}
            className={`${style.h} w-5 rounded-sm flex items-end justify-center pb-0.5 shadow`}
            style={{ backgroundColor: style.bg }}
            title={`${p}kg`}
          >
            <span
              className="text-[8px] font-bold"
              style={{ color: style.text, transform: "rotate(-90deg)", lineHeight: 1 }}
            >
              {p}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PlateCalculator({ initialWeight, onClose }: Props) {
  const { settings } = useGym();
  const [input, setInput] = useState(initialWeight ?? "");
  const [barKg, setBarKg] = useState(settings.barWeight ?? 20);

  const targetKg = parseFloat(input);
  const valid = !isNaN(targetKg) && targetKg > 0;
  const plates = valid ? calcPlates(targetKg, barKg) : [];
  const loadable = barKg + plates.reduce((a, b) => a + b, 0) * 2;
  const remainder = valid ? Math.round((targetKg - loadable) * 1000) / 1000 : 0;

  // Group plates for display
  const plateCounts: Partial<Record<number, number>> = {};
  plates.forEach((p) => { plateCounts[p] = (plateCounts[p] ?? 0) + 1; });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-[var(--gj-scrim)] backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--gj-border)]">
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-[var(--gj-accent)]" />
            <span className="text-[var(--gj-text)] text-sm font-medium">Plate Calculator</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {/* Target weight input */}
          <div className="space-y-2">
            <label className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase">
              Target Weight (kg)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 100"
              autoFocus
              className="w-full bg-[var(--gj-raised)] border border-[var(--gj-border)] text-[var(--gj-text)] placeholder-[var(--gj-text-4)] px-4 py-3 rounded-lg outline-none focus:border-[var(--gj-accent)] transition-colors text-sm"
            />
          </div>

          {/* Bar weight */}
          <div className="space-y-2">
            <label className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase">
              Bar Weight
            </label>
            <div className="flex gap-2">
              {[15, 20].map((w) => (
                <button
                  key={w}
                  onClick={() => setBarKg(w)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-mono tracking-widest transition-colors border ${
                    barKg === w
                      ? "bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] border-transparent"
                      : "bg-[var(--gj-raised)] text-[var(--gj-text-2)] border-[var(--gj-border)] hover:border-[var(--gj-accent)]"
                  }`}
                >
                  {w} kg
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          {valid && (
            <>
              {/* Bar visualization */}
              <div className="bg-[var(--gj-raised)] rounded-xl overflow-hidden">
                {plates.length > 0 ? (
                  <PlateVisual plates={plates} />
                ) : (
                  <div className="py-6 text-center text-[var(--gj-text-3)] text-sm">
                    Bar only — {barKg} kg
                  </div>
                )}
              </div>

              {/* Plate list */}
              {plates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[var(--gj-text-3)] text-xs font-mono tracking-widest uppercase">
                    Per side
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(plateCounts).map(([p, count]) => {
                      const style = PLATE_STYLES[Number(p)];
                      return (
                        <div
                          key={p}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono"
                          style={{ backgroundColor: style.bg + "22", color: "var(--gj-text)" }}
                        >
                          <span
                            className="w-3 h-3 rounded-sm inline-block shrink-0"
                            style={{ backgroundColor: style.bg }}
                          />
                          {count}× {p}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-[var(--gj-raised)] rounded-xl px-4 py-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--gj-text-3)] text-xs">Bar</span>
                  <span className="text-[var(--gj-text-2)] text-xs font-mono">{barKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gj-text-3)] text-xs">Plates (×2)</span>
                  <span className="text-[var(--gj-text-2)] text-xs font-mono">
                    {(plates.reduce((a, b) => a + b, 0) * 2).toFixed(2)} kg
                  </span>
                </div>
                <div className="h-px bg-[var(--gj-border)]" />
                <div className="flex justify-between">
                  <span className="text-[var(--gj-text)] text-xs font-medium">Total</span>
                  <span className="text-[var(--gj-accent)] text-xs font-mono font-medium">{loadable} kg</span>
                </div>
                {Math.abs(remainder) > 0.001 && (
                  <p className="text-[var(--gj-text-3)] text-xs">
                    ≈ {remainder > 0 ? `${remainder} kg under` : `${Math.abs(remainder)} kg over`} target
                  </p>
                )}
              </div>
            </>
          )}

          {/* Color legend */}
          <div className="grid grid-cols-4 gap-2">
            {PLATE_SIZES.map((p) => {
              const style = PLATE_STYLES[p];
              return (
                <div key={p} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: style.bg }} />
                  <span className="text-[var(--gj-text-3)] text-xs">{p}kg</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
