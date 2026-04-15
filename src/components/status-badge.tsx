import { Badge } from "@/components/ui/badge";
import { DeploymentStatus, DEPLOYMENT_STATUS_LABELS } from "@/api/types";

const statusConfig: Record<
  DeploymentStatus,
  { color: string; dot: string }
> = {
  [DeploymentStatus.CREATED]: {
    color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    dot: "bg-zinc-400",
  },
  [DeploymentStatus.BUILT]: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
  },
  [DeploymentStatus.DEPLOYING]: {
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dot: "bg-yellow-400 animate-pulse",
  },
  [DeploymentStatus.DEPLOYED]: {
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  [DeploymentStatus.STOPPING]: {
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    dot: "bg-orange-400 animate-pulse",
  },
  [DeploymentStatus.STOPPED]: {
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400",
  },
  [DeploymentStatus.DELETED]: {
    color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    dot: "bg-zinc-500",
  },
};

export function StatusBadge({ status }: { status: DeploymentStatus }) {
  const config = statusConfig[status] ?? statusConfig[DeploymentStatus.CREATED];
  const label = DEPLOYMENT_STATUS_LABELS[status] ?? "Unknown";

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.color}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${config.dot}`} />
      {label}
    </Badge>
  );
}
