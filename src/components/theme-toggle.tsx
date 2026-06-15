"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the active theme after mount (avoids SSR/client mismatch).
    const stored = localStorage.getItem("theme");
    const dark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
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
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      aria-label="Toggle theme"
      title="Toggle light / dark"
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch. */}
      {mounted && isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
