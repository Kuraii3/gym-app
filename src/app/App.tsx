import { RouterProvider } from "react-router";
import { router } from "./routes";
import { GymProvider } from "./context/GymContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <GymProvider>
        <RouterProvider router={router} />
      </GymProvider>
    </ThemeProvider>
  );
}
