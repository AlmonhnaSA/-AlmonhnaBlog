import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      className={`theme-mode-toggle ${className || ""}`}
      aria-label={isDark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"}
      title={isDark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="theme-mode-icon" aria-hidden="true">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
      <span>{isDark ? "ليلي" : "نهاري"}</span>
    </Button>
  );
};

export default ThemeToggle;
