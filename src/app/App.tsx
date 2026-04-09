import { RouterProvider } from "react-router";
import { router } from "./routes";
import { GymProvider } from "./context/GymContext";

export default function App() {
  return (
    <GymProvider>
      <RouterProvider router={router} />
    </GymProvider>
  );
}
