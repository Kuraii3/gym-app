import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("gj_theme");
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") {
      el.classList.add("dark");
    } else {
      el.classList.remove("dark");
    }
    localStorage.setItem("gj_theme", theme);
  }, [theme]);

  // Apply on initial mount
  useEffect(() => {
    const stored = localStorage.getItem("gj_theme");
    if (stored !== "light") document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
