import { useEffect, useRef } from "react";
import { X, Download, Upload, Moon, Sun } from "lucide-react";
import { useGym } from "../context/GymContext";
import { useTheme } from "../context/ThemeContext";

interface Props {
  onClose: () => void;
}

const DURATIONS = [
  { label: "45s", value: 45 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
  { label: "2m",  value: 120 },
  { label: "3m",  value: 180 },
  { label: "5m",  value: 300 },
];

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, importData } = useGym();
  const { theme, toggleTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function handleExport() {
    const data = {
      splits:      JSON.parse(localStorage.getItem("gj_splits")      || "[]"),
      sessions:    JSON.parse(localStorage.getItem("gj_sessions")    || "[]"),
      settings:    JSON.parse(localStorage.getItem("gj_settings")    || "{}"),
      bodyWeights: JSON.parse(localStorage.getItem("gj_bodyweight")  || "[]"),
      version: 2,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gym-journal-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.splits && !data.sessions) { alert("Invalid backup file."); return; }
        if (window.confirm("This will replace your current data. Continue?")) {
          importData(data);
          onClose();
        }
      } catch { alert("Could not parse the file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-[var(--gj-scrim)] backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-[var(--gj-surface)] border border-[var(--gj-border)] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--gj-border)] shrink-0">
          <span className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono">Settings</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[var(--gj-text-3)] hover:text-[var(--gj-text)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-8">

          {/* Appearance */}
          <section>
            <h3 className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono mb-4">Appearance</h3>
            <div className="flex items-center justify-between py-3 border-b border-[var(--gj-border-sub)]">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon size={15} className="text-[var(--gj-text-2)]" /> : <Sun size={15} className="text-[var(--gj-text-2)]" />}
                <span className="text-[var(--gj-text)] text-sm">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  theme === "dark" ? "bg-[var(--gj-lime)]" : "bg-[var(--gj-border)]"
                }`}
                role="switch"
                aria-checked={theme === "dark"}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-[var(--gj-lime-fg)] transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </section>

          {/* Bar weight */}
          <section>
            <h3 className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono mb-4">Equipment</h3>
            <div className="space-y-2">
              <p className="text-[var(--gj-text-3)] text-xs font-mono">BARBELL WEIGHT</p>
              <div className="flex gap-2">
                {[15, 20].map((w) => (
                  <button key={w}
                    onClick={() => updateSettings({ barWeight: w })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-mono tracking-widest transition-colors border ${
                      (settings.barWeight ?? 20) === w
                        ? "bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] border-transparent"
                        : "bg-[var(--gj-raised)] text-[var(--gj-text-2)] border-[var(--gj-border)] hover:border-[var(--gj-accent)]"
                    }`}
                  >
                    {w} kg
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Rest Timer */}
          <section>
            <h3 className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono mb-4">Rest Timer</h3>
            <div className="flex items-center justify-between py-3 border-b border-[var(--gj-border-sub)]">
              <span className="text-[var(--gj-text)] text-sm">Auto-start rest timer</span>
              <button
                onClick={() => updateSettings({ restTimerEnabled: !settings.restTimerEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.restTimerEnabled ? "bg-[var(--gj-lime)]" : "bg-[var(--gj-border)]"
                }`}
                role="switch"
                aria-checked={settings.restTimerEnabled}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-[var(--gj-lime-fg)] transition-transform ${
                  settings.restTimerEnabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
            <div className="pt-4">
              <p className="text-[var(--gj-text-3)] text-xs font-mono mb-3">REST DURATION</p>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button key={d.value}
                    onClick={() => updateSettings({ restTimerDuration: d.value })}
                    disabled={!settings.restTimerEnabled}
                    className={`py-2.5 rounded-lg text-sm font-mono tracking-widest transition-colors disabled:opacity-30 border ${
                      settings.restTimerDuration === d.value
                        ? "bg-[var(--gj-lime)] text-[var(--gj-lime-fg)] border-transparent"
                        : "bg-[var(--gj-raised)] text-[var(--gj-text-2)] border-[var(--gj-border)] hover:border-[var(--gj-accent)]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Data */}
          <section>
            <h3 className="text-[var(--gj-text-3)] text-xs tracking-widest uppercase font-mono mb-4">Data</h3>
            <p className="text-[var(--gj-text-3)] text-xs mb-4">
              All data is stored locally on this device. Export regularly to keep a backup.
            </p>
            <div className="space-y-2">
              <button onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-[var(--gj-raised)] border border-[var(--gj-border)] rounded-lg text-[var(--gj-text)] hover:border-[var(--gj-accent)] transition-colors text-sm">
                <Download size={16} className="text-[var(--gj-accent)] shrink-0" />
                Export backup (JSON)
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-[var(--gj-raised)] border border-[var(--gj-border)] rounded-lg text-[var(--gj-text)] hover:border-[var(--gj-text-3)] transition-colors text-sm">
                <Upload size={16} className="text-[var(--gj-text-3)] shrink-0" />
                Import from backup
              </button>
              <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
