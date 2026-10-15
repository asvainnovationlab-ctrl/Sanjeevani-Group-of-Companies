"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8m10.6 10.6 1.8 1.8M2 12h2.5m15 0H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("sanjeevani-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
    }
  }, []);

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("sanjeevani-theme", nextTheme);
  }

  return (
    <div className="theme-switcher" role="group" aria-label="Colour theme">
      <button type="button" aria-label="Day mode" aria-pressed={theme === "light"} onClick={() => changeTheme("light")}><SunIcon /></button>
      <button type="button" aria-label="Night mode" aria-pressed={theme === "dark"} onClick={() => changeTheme("dark")}><MoonIcon /></button>
    </div>
  );
}
