import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { HomeScreen } from "./components/HomeScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { ActiveWorkout } from "./components/ActiveWorkout";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <p className="text-[#444] text-sm font-mono">404 — Page not found</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomeScreen },
      { path: "history", Component: HistoryScreen },
    ],
  },
  {
    path: "/workout/:splitId",
    Component: ActiveWorkout,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
