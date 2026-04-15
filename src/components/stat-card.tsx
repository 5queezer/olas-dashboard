import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
