import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const itemClass =
  "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold cursor-pointer";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          className={cn(
            "h-9 w-9 rounded-xl border bg-white/60 border-white/60 text-slate-500",
            "hover:bg-white hover:text-primary",
            "dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300",
            "dark:hover:bg-slate-800/80 dark:hover:text-primary",
            "transition-colors",
            className,
          )}
        >
          <motion.span
            key={isDark ? "dark" : "light"}
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </motion.span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-2xl">
        <DropdownMenuLabel className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => setTheme("light")}
          className={cn(itemClass, theme === "light" && "bg-primary/10 text-primary")}
        >
          <Sun className="h-4 w-4" />
          <span className="flex-1">Light</span>
          {theme === "light" && <span className="text-primary text-xs">on</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme("dark")}
          className={cn(itemClass, theme === "dark" && "bg-primary/10 text-primary")}
        >
          <Moon className="h-4 w-4" />
          <span className="flex-1">Dark</span>
          {theme === "dark" && <span className="text-primary text-xs">on</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme("system")}
          className={cn(itemClass, theme === "system" && "bg-primary/10 text-primary")}
        >
          <Monitor className="h-4 w-4" />
          <span className="flex-1">System</span>
          {theme === "system" && <span className="text-primary text-xs">on</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
