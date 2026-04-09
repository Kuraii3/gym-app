import { useEffect, useRef } from "react";
import { X, Download, Upload } from "lucide-react";
import { useGym } from "../context/GymContext";

interface Props {
  onClose: () => void;
}

const DURATIONS = [
  { label: "45s", value: 45 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
  { label: "2m", value: 120 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
];

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, importData } = useGym();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleExport() {
    const data = {
      splits: JSON.parse(localStorage.getItem("gj_splits") || "[]"),
      sessions: JSON.parse(localStorage.getItem("gj_sessions") || "[]"),
      settings: JSON.parse(localStorage.getItem("gj_settings") || "{}"),
      version: 1,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
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
        if (!data.splits && !data.sessions) {
          alert("Invalid backup file.");
          return;
        }
        if (
          window.confirm(
            "This will replace your current splits, sessions, and settings. Continue?"
          )
        ) {
          importData(data);
          onClose();
        }
      } catch {
        alert("Could not parse the file. Make sure it is a valid gym journal backup.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported if needed
    e.target.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-[#2A2A2A] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] shrink-0">
          <span className="text-[#888] text-xs tracking-widest uppercase">
            Settings
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-8">
          {/* Rest Timer section */}
          <section>
            <h3 className="text-[#888] text-xs tracking-widest uppercase mb-4">
              Rest Timer
            </h3>

            {/* Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-[#1A1A1A]">
              <span className="text-white text-sm">Auto-start rest timer</span>
              <button
                onClick={() =>
                  updateSettings({ restTimerEnabled: !settings.restTimerEnabled })
                }
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.restTimerEnabled ? "bg-[#C8FF00]" : "bg-[#2A2A2A]"
                }`}
                role="switch"
                aria-checked={settings.restTimerEnabled}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                    settings.restTimerEnabled
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Duration picker */}
            <div className="pt-4">
              <p className="text-[#444] text-xs font-mono mb-3">
                REST DURATION
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() =>
                      updateSettings({ restTimerDuration: d.value })
                    }
                    disabled={!settings.restTimerEnabled}
                    className={`py-2.5 rounded-lg text-sm font-mono tracking-widest transition-colors disabled:opacity-30 ${
                      settings.restTimerDuration === d.value
                        ? "bg-[#C8FF00] text-black"
                        : "bg-[#1A1A1A] text-[#666] hover:text-white border border-[#2A2A2A]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Data section */}
          <section>
            <h3 className="text-[#888] text-xs tracking-widest uppercase mb-4">
              Data
            </h3>
            <p className="text-[#333] text-xs font-mono mb-4">
              All data is stored locally on this device. Export regularly to
              keep a backup.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white hover:border-[#C8FF00] transition-colors text-sm"
              >
                <Download size={16} className="text-[#C8FF00] shrink-0" />
                Export backup (JSON)
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white hover:border-[#888] transition-colors text-sm"
              >
                <Upload size={16} className="text-[#555] shrink-0" />
                Import from backup
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
