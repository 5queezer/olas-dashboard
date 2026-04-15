import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
import {
  ArrowLeft,
  Clock,
  Heart,
  Loader2,
  Play,
  Square,
  TrendingUp,
  Target,
  Coins,
  Activity,
  Settings,
} from "lucide-react";
import { queries, mutations } from "@/api/queries";
import { DeploymentStatus } from "@/api/types";
import type { TradeEntry } from "@/api/types";
import { StatusBadge } from "@/components/status-badge";
import { ProfitDisplay } from "@/components/profit-display";
import { StatCard } from "@/components/stat-card";
import { ServiceDetailSkeleton } from "@/components/loading-skeleton";
import { ErrorDisplay } from "@/components/error-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function HealthPanel({
  serviceId,
}: {
  serviceId: string;
}) {
  const { data: deployment } = useQuery({
    ...queries.deployment(serviceId),
    refetchInterval: 15_000,
  });

  const hc = deployment?.healthcheck;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-primary" />
          Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Current Round</p>
            <p className="font-mono text-sm">
              {hc?.current_round ?? "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="font-mono text-sm">{hc?.period ?? "--"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Seconds Since Last Transition
            </p>
            <p className="font-mono text-sm">
              {hc?.seconds_since_last_transition !== undefined
                ? formatDuration(hc.seconds_since_last_transition)
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transitioning</p>
            <p className="text-sm">
              {hc?.is_transitioning_fast === true ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  Fast
                </Badge>
              ) : hc?.is_transitioning_fast === false ? (
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-400 border-red-500/20"
                >
                  Slow
                </Badge>
              ) : (
                "--"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Healthy Rounds</p>
            <p className="font-mono text-sm">
              {hc?.healthy_round_count ?? "--"}
            </p>
          </div>
        </div>
        {hc?.round_sequence && hc.round_sequence.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Round Sequence
            </p>
            <div className="flex flex-wrap gap-1">
              {hc.round_sequence.slice(-10).map((round, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-mono">
                  {round}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PerformancePanel({ serviceId }: { serviceId: string }) {
  const { data: performance } = useQuery({
    ...queries.agentPerformance(serviceId),
    refetchInterval: 15_000,
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <ProfitDisplay
              value={performance?.total_profit}
              suffix=" xDAI"
              decimals={4}
              className="text-lg font-semibold"
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ROI</p>
            <p className="text-lg font-semibold">
              {performance?.roi !== undefined && performance.roi !== null ? (
                <ProfitDisplay
                  value={performance.roi * 100}
                  suffix="%"
                  decimals={2}
                />
              ) : (
                <span className="text-muted-foreground">--</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-lg font-semibold">
              {performance?.accuracy !== undefined &&
              performance.accuracy !== null
                ? `${(performance.accuracy * 100).toFixed(1)}%`
                : "--"}
            </p>
          </div>
        </div>

        {performance?.metrics && performance.metrics.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted-foreground">Metrics</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {performance.metrics.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {m.name}
                  </span>
                  <span className="font-mono text-sm">
                    {m.value}
                    {m.unit ? ` ${m.unit}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {performance?.profit_over_time &&
          performance.profit_over_time.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Profit Over Time
              </p>
              <ProfitChart data={performance.profit_over_time} />
            </div>
          )}

        {performance?.last_activity && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Last Activity</p>
            <p className="text-sm">{performance.last_activity}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfitChart({ data }: { data: { timestamp: number; profit: number }[] }) {
  if (data.length < 2) return null;

  const maxProfit = Math.max(...data.map((d) => d.profit));
  const minProfit = Math.min(...data.map((d) => d.profit));
  const range = maxProfit - minProfit || 1;
  const h = 120;
  const w = 400;
  const padding = 4;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
    const y = h - padding - ((d.profit - minProfit) / range) * (h - 2 * padding);
    return `${x},${y}`;
  });

  const zeroY = h - padding - ((0 - minProfit) / range) * (h - 2 * padding);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md" preserveAspectRatio="none">
      {minProfit < 0 && maxProfit > 0 && (
        <line
          x1={padding}
          y1={zeroY}
          x2={w - padding}
          y2={zeroY}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="4,4"
        />
      )}
      <polyline
        fill="none"
        stroke="oklch(0.696 0.17 162.48)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points.join(" ")}
      />
    </svg>
  );
}

function TradesPanel({ serviceId }: { serviceId: string }) {
  const { data: performance } = useQuery({
    ...queries.agentPerformance(serviceId),
    refetchInterval: 15_000,
  });

  const trades = performance?.trades;

  if (!trades || trades.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4 text-primary" />
            Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">
            No trades recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4 text-primary" />
          Trades
        </CardTitle>
        <CardDescription>{trades.length} trades total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade: TradeEntry, i: number) => (
                <TableRow key={i}>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {trade.title || trade.market || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {trade.side ? (
                      <Badge
                        variant="outline"
                        className={
                          trade.side.toUpperCase() === "YES"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }
                      >
                        {trade.side}
                      </Badge>
                    ) : (
                      "--"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {trade.amount !== undefined
                      ? trade.amount.toFixed(4)
                      : "--"}
                  </TableCell>
                  <TableCell>
                    <TradeStatusBadge status={trade.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ProfitDisplay
                      value={trade.profit}
                      decimals={4}
                      className="text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeStatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-muted-foreground">--</span>;

  const lower = status.toLowerCase();
  if (lower === "won") {
    return (
      <Badge
        variant="outline"
        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      >
        Won
      </Badge>
    );
  }
  if (lower === "lost") {
    return (
      <Badge
        variant="outline"
        className="bg-red-500/10 text-red-400 border-red-500/20"
      >
        Lost
      </Badge>
    );
  }
  if (lower === "pending") {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      >
        Pending
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

function ServiceControls({ serviceId }: { serviceId: string }) {
  const queryClient = useQueryClient();
  const { data: deployment } = useQuery({
    ...queries.deployment(serviceId),
    refetchInterval: 15_000,
  });

  const deployMutation = useMutation({
    mutationFn: () => mutations.deployService(serviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["deployment", serviceId],
      });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => mutations.stopService(serviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["deployment", serviceId],
      });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const status = deployment?.status;
  const canStart =
    status === DeploymentStatus.BUILT ||
    status === DeploymentStatus.STOPPED ||
    status === DeploymentStatus.CREATED;
  const canStop = status === DeploymentStatus.DEPLOYED;
  const isActing =
    status === DeploymentStatus.DEPLOYING ||
    status === DeploymentStatus.STOPPING ||
    deployMutation.isPending ||
    stopMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="gap-2"
        disabled={!canStart || isActing}
        onClick={() => deployMutation.mutate()}
      >
        {deployMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        Start
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-2"
        disabled={!canStop || isActing}
        onClick={() => stopMutation.mutate()}
      >
        {stopMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        Stop
      </Button>
      {(deployMutation.isError || stopMutation.isError) && (
        <p className="text-sm text-destructive">
          {(deployMutation.error ?? stopMutation.error)?.message}
        </p>
      )}
    </div>
  );
}

export function ServiceDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };

  const {
    data: service,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...queries.service(id),
    refetchInterval: 15_000,
  });

  const { data: deployment } = useQuery({
    ...queries.deployment(id),
    refetchInterval: 15_000,
  });

  const { data: performance } = useQuery({
    ...queries.agentPerformance(id),
    refetchInterval: 15_000,
  });

  if (isLoading) return <ServiceDetailSkeleton />;
  if (error)
    return (
      <ErrorDisplay
        message="Failed to load service"
        onRetry={() => void refetch()}
      />
    );
  if (!service) return <ErrorDisplay message="Service not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {service.name || service.service_config_id.slice(0, 20)}
            </h1>
            {deployment && <StatusBadge status={deployment.status} />}
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            {service.service_config_id}
          </p>
        </div>
        <Link to="/service/$id/settings" params={{ id }}>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <ServiceControls serviceId={id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Status"
          value={
            deployment ? (
              <StatusBadge status={deployment.status} />
            ) : (
              "--"
            )
          }
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Total Profit"
          value={
            <ProfitDisplay
              value={performance?.total_profit}
              suffix=" xDAI"
              decimals={4}
            />
          }
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Accuracy"
          value={
            performance?.accuracy !== undefined &&
            performance.accuracy !== null
              ? `${(performance.accuracy * 100).toFixed(1)}%`
              : "--"
          }
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Last Transition"
          value={
            deployment?.healthcheck?.seconds_since_last_transition !== undefined
              ? `${formatDuration(deployment.healthcheck.seconds_since_last_transition)} ago`
              : "--"
          }
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HealthPanel serviceId={id} />
        <PerformancePanel serviceId={id} />
      </div>

      <TradesPanel serviceId={id} />

      <FundingPanel serviceId={id} />
    </div>
  );
}

function FundingPanel({ serviceId }: { serviceId: string }) {
  const { data: requirements } = useQuery({
    ...queries.fundingRequirements(serviceId),
    refetchInterval: 15_000,
  });

  if (
    !requirements ||
    (Array.isArray(requirements) && requirements.length === 0)
  ) {
    return null;
  }

  const items = Array.isArray(requirements) ? requirements : [];
  if (items.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4 text-primary" />
          Funding Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chain</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Shortfall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((req, i) => (
                <TableRow key={i}>
                  <TableCell className="capitalize">{req.chain}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {req.address.slice(0, 6)}...{req.address.slice(-4)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {req.asset === "0x0000000000000000000000000000000000000000"
                      ? "Native"
                      : `${req.asset.slice(0, 6)}...${req.asset.slice(-4)}`}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {(req.balance / 1e18).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {(req.required / 1e18).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProfitDisplay
                      value={-(req.shortfall / 1e18)}
                      decimals={4}
                      className="text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
