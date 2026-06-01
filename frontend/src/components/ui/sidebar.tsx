import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "4rem";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider.");
  return context;
}

export const SidebarProvider = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, style, children, ...props }, ref) => {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(true);
    const state = open ? "expanded" : "collapsed";

    const toggleSidebar = React.useCallback(() => setOpen((prev) => !prev), []);

    return (
      <SidebarContext.Provider value={{ state, open, setOpen, isMobile, toggleSidebar }}>
        <TooltipProvider delayDuration={0}>
          <div
            style={{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON, ...style } as React.CSSProperties}
            className={cn("flex min-h-screen w-full bg-background", className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);

export const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { collapsible?: "icon" | "none" }>(
  ({ className, children, collapsible = "icon", ...props }, ref) => {
    const { isMobile, open, setOpen } = useSidebar();

    if (isMobile) {
      return (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground">
            <SheetHeader className="sr-only"><SheetTitle>Sidebar</SheetTitle></SheetHeader>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col h-screen border-r bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out shrink-0",
          open ? "w-(--sidebar-width)" : "w-(--sidebar-width-icon)",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const SidebarTrigger = React.forwardRef<React.ElementRef<typeof Button>, React.ComponentProps<typeof Button>>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", className)}
        onClick={(e) => { onClick?.(e); toggleSidebar(); }}
        {...props}
      >
        <PanelLeft className="h-4 w-4" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    );
  }
);

export const SidebarContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-1 flex-col overflow-y-auto", className)} {...props} />
);

export const SidebarHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col p-2", className)} {...props} />
);

export const SidebarFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn("flex flex-col p-2 mt-auto", className)} {...props} />
);

export const SidebarMenu = ({ className, ...props }: React.ComponentProps<"ul">) => (
  <ul className={cn("flex w-full flex-col gap-1", className)} {...props} />
);

export const SidebarMenuItem = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li className={cn("px-2", className)} {...props} />
);

export const SidebarMenuButton = ({ className, isActive, children, ...props }: any) => (
  <button
    className={cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
      className
    )}
    {...props}
  >
    {children}
  </button>
);
