import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, LayoutDashboard, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function NavHeader() {
  const { logout } = useAuth();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2 text-primary shrink-0">
            <Activity className="h-5 w-5" />
            <span className="hidden sm:inline text-lg font-semibold tracking-tight">
              Olas Operate
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 text-muted-foreground hover:text-foreground",
                    currentPath === to && "text-foreground bg-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground shrink-0"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
