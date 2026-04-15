import { cn } from "@/lib/utils";

interface ProfitDisplayProps {
  value: number | null | undefined;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export function ProfitDisplay({
  value,
  prefix = "",
  suffix = "",
  className,
  decimals = 4,
}: ProfitDisplayProps) {
  if (value === null || value === undefined) {
    return <span className={cn("text-muted-foreground", className)}>--</span>;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        isPositive && "text-emerald-400",
        isNegative && "text-red-400",
        !isPositive && !isNegative && "text-muted-foreground",
        className,
      )}
    >
      {prefix}
      {isPositive && "+"}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
