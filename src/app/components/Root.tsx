import { Outlet, NavLink } from "react-router";
import { Dumbbell, History } from "lucide-react";

export function Root() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="pb-16">
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#1E1E1E] flex">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-[#C8FF00]" : "text-[#444] hover:text-[#666]"
            }`
          }
        >
          <Dumbbell size={20} />
          <span className="text-xs font-mono tracking-widest uppercase">
            Splits
          </span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-[#C8FF00]" : "text-[#444] hover:text-[#666]"
            }`
          }
        >
          <History size={20} />
          <span className="text-xs font-mono tracking-widest uppercase">
            History
          </span>
        </NavLink>
      </nav>
    </div>
  );
}
