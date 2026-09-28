"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the active theme after mount (avoids SSR/client mismatch).
    const dark = document.documentElement.classList.contains("dark");
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsDark(dark);
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function toggle() {
    const d = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    d.classList.toggle("dark", next);
    d.classList.toggle("light", !next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* Private browsing may disable storage. */ }
  }

  return (
    <button
      onClick={toggle}
      className="shrink-0 rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      aria-label="Toggle theme"
      title="Toggle light / dark"
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch. */}
      {mounted && isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
