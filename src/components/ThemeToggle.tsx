"use client";

import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 left-4 z-50 px-4 py-2 rounded-full border border-muted text-muted text-sm shadow-md hover:text-primary hover:border-primary transition-colors bg-card"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
