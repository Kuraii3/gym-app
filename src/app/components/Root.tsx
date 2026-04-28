import { Outlet, NavLink } from "react-router";
import { Dumbbell, History, Sun, Moon, Settings, Zap } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useGym } from "../context/GymContext";
import { useState, useRef } from "react";
import { SettingsModal } from "./SettingsModal";

const NAV_LINKS = [
  { to: "/", label: "Splits", icon: Dumbbell, end: true },
  { to: "/history", label: "History", icon: History, end: false },
];

/** Tooltip that pops to the left of its child */
function Tip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1 rounded-md
                     text-xs font-mono whitespace-nowrap pointer-events-none
                     bg-[var(--gj-raised)] border border-[var(--gj-border)]
                     text-[var(--gj-text-2)]"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
        >
          {label}
          {/* caret */}
          <span
            className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderLeftColor: "var(--gj-border)" }}
          />
        </div>
      )}
    </div>
  );
}

/** A single round button used in the dock */
function DockBtn({
  onClick,
  label,
  children,
  active = false,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Tip label={label}>
      <button
        onClick={onClick}
        aria-label={label}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          active
            ? "bg-[var(--gj-accent-subtle)] text-[var(--gj-accent)]"
            : "text-[var(--gj-text-3)] hover:text-[var(--gj-text)] hover:bg-[var(--gj-raised)]"
        }`}
      >
        {children}
      </button>
    </Tip>
  );
}

export function Root() {
  const { theme, toggleTheme } = useTheme();
  const { getStats } = useGym();
  const stats = getStats();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--gj-bg)]">

      {/* ── Desktop floating dock ── */}
      <div className="hidden lg:flex fixed top-5 right-5 z-40 flex-col items-end gap-2 select-none">

        {/* Pill */}
        <div
          className="flex items-center gap-0.5 p-1.5 rounded-full
                     bg-[var(--gj-surface)] border border-[var(--gj-border)]"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.14)" }}
        >
          {/* Nav icons */}
          {NAV_LINKS.map((link) => (
            <Tip key={link.to} label={link.label}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-[var(--gj-accent-subtle)] text-[var(--gj-accent)]"
                      : "text-[var(--gj-text-3)] hover:text-[var(--gj-text)] hover:bg-[var(--gj-raised)]"
                  }`
                }
              >
                <link.icon size={17} />
              </NavLink>
            </Tip>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--gj-border)] mx-0.5 shrink-0" />

          {/* Theme toggle */}
          <DockBtn
            label={theme === "dark" ? "Light mode" : "Dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </DockBtn>

          {/* Settings */}
          <DockBtn label="Settings" onClick={() => setShowSettings(true)}>
            <Settings size={16} />
          </DockBtn>
        </div>

        {/* Stats chip — only when data exists */}
        {stats.totalSessions > 0 && (
          <div
            className="flex items-center gap-3 px-3 py-1.5 rounded-full
                       bg-[var(--gj-surface)] border border-[var(--gj-border)]
                       text-[10px] font-mono tracking-wide text-[var(--gj-text-3)]"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.16)" }}
          >
            <span>{stats.totalSessions} sessions</span>
            {stats.streak > 0 && (
              <span className="flex items-center gap-1 text-[var(--gj-accent)]">
                <Zap size={9} />
                {stats.streak}d streak
              </span>
            )}
            {stats.totalVolume > 0 && (
              <span>
                {stats.totalVolume >= 1000
                  ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                  : Math.round(stats.totalVolume)}
                {" "}kg
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Main content — full canvas, centered ── */}
      <main className="pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 lg:px-6">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30
                   bg-[var(--gj-surface)]/95 backdrop-blur-md
                   border-t border-[var(--gj-border)] flex"
      >
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive
                  ? "text-[var(--gj-accent)]"
                  : "text-[var(--gj-text-3)] hover:text-[var(--gj-text-2)]"
              }`
            }
          >
            <link.icon size={20} />
            <span className="text-xs font-mono tracking-widest uppercase">
              {link.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Settings modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
