import type { HealthcheckData } from "@/api/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getHealthStatus(healthcheck: HealthcheckData | null | undefined): {
  color: string;
  label: string;
} {
  if (!healthcheck) {
    return { color: "bg-zinc-500", label: "No data" };
  }

  const seconds = healthcheck.seconds_since_last_transition;
  if (seconds !== undefined && seconds !== null) {
    if (seconds < 120) {
      return { color: "bg-emerald-400", label: "Healthy" };
    }
    if (seconds < 300) {
      return { color: "bg-yellow-400", label: "Slow" };
    }
    return { color: "bg-red-400", label: "Stalled" };
  }

  if (healthcheck.is_transitioning_fast === true) {
    return { color: "bg-emerald-400", label: "Healthy" };
  }
  if (healthcheck.is_transitioning_fast === false) {
    return { color: "bg-red-400", label: "Stalled" };
  }

  return { color: "bg-zinc-500", label: "Unknown" };
}

export function HealthIndicator({
  healthcheck,
}: {
  healthcheck: HealthcheckData | null | undefined;
}) {
  const { color, label } = getHealthStatus(healthcheck);

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex cursor-help">
        <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
        {healthcheck?.seconds_since_last_transition !== undefined && (
          <p className="text-xs opacity-70">
            {healthcheck.seconds_since_last_transition}s since last transition
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
