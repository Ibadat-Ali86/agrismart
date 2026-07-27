import { Moon, Sun } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useSettings();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative grid size-9 place-items-center rounded-full border border-border bg-background/60 text-foreground transition-all hover:scale-110 hover:bg-accent hover:text-primary hover:shadow-soft ${className}`}
    >
      <Sun className={`absolute size-4 transition-all duration-500 ${isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
      <Moon className={`absolute size-4 transition-all duration-500 ${isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
    </button>
  );
}
