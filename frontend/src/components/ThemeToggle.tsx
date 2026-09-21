import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Icon } from "./ui";

/**
 * Theme switch.
 *
 * Previously a 56×32 sliding pill, which was the widest control in the nav and
 * read as the most important one — for a preference that gets set once. It is
 * now the same square icon button as the notification bell beside it, and the
 * glyph cross-fades rather than sliding, so the two controls form an even rail.
 */
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-50 transition-all duration-200 ease-soft hover:bg-white/10 active:scale-95"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <Icon
        name="sun"
        size={19}
        className={`absolute transition-all duration-300 ease-spring ${
          isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Icon
        name="moon"
        size={19}
        className={`absolute transition-all duration-300 ease-spring ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
