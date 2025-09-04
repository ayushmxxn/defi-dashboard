"use client";

import * as React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Determine which icon to show based on the current theme
  const renderIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case "system":
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  // Prevent button from retaining focus after dropdown interaction
  const handleThemeChange = (themeValue: string) => {
    setTheme(themeValue);
    // Remove focus from the button
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          title={
            theme === "dark"
              ? "Dark mode"
              : theme === "light"
              ? "Light mode"
              : "System mode"
          }
        >
          {renderIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[160px] bg-[var(--popover)] border-[var(--border)] text-[var(--popover-foreground)] rounded-md p-1.5 shadow-lg"
        align="end"
      >
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="flex items-center px-3 py-2 text-sm text-[var(--popover-foreground)] hover:bg-[var(--muted)] rounded-md cursor-pointer focus:outline-none focus:bg-[var(--muted)]"
        >
          <Sun className="h-4 w-4 mr-2" />
          Light
          {theme === "light" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="flex items-center px-3 py-2 text-sm text-[var(--popover-foreground)] hover:bg-[var(--muted)] rounded-md cursor-pointer focus:outline-none focus:bg-[var(--muted)]"
        >
          <Moon className="h-4 w-4 mr-2" />
          Dark
          {theme === "dark" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="flex items-center px-3 py-2 text-sm text-[var(--popover-foreground)] hover:bg-[var(--muted)] rounded-md cursor-pointer focus:outline-none focus:bg-[var(--muted)]"
        >
          <Monitor className="h-4 w-4 mr-2" />
          System
          {theme === "system" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
