import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

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
import type { ProfitDataPoint, PredictionItem } from "@/api/types";
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
            <p className="text-sm text-muted-foreground">Tendermint</p>
            <p className="text-sm">
              {hc?.is_tm_healthy === true ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Healthy</Badge>
              ) : hc?.is_tm_healthy === false ? (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">Unhealthy</Badge>
              ) : "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="font-mono text-sm">{hc?.period ?? "--"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Transition</p>
            <p className="font-mono text-sm">
              {hc?.seconds_since_last_transition !== undefined
                ? `${formatDuration(hc.seconds_since_last_transition)} ago`
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transitioning</p>
            <p className="text-sm">
              {hc?.is_transitioning_fast === true ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Fast</Badge>
              ) : hc?.is_transitioning_fast === false ? (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">Slow</Badge>
              ) : "--"}
            </p>
          </div>
          {hc?.agent_health && (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Staking</p>
                <p className="font-mono text-sm">{hc.agent_health.staking_status ?? "--"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Has Funds</p>
                <p className="text-sm">
                  {hc.agent_health.has_required_funds === true ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Yes</Badge>
                  ) : hc.agent_health.has_required_funds === false ? (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">No</Badge>
                  ) : "--"}
                </p>
              </div>
            </>
          )}
        </div>
        {hc?.rounds && hc.rounds.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted-foreground">Current Rounds</p>
            <div className="flex flex-wrap gap-1">
              {hc.rounds.slice(-8).map((round: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs font-mono">
                  {round.replace(/_round$/, "").replaceAll("_", " ")}
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

  const ap = performance?.agent_performance;
  const stats = ap?.stats;

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
              value={ap?.metrics.all_time_profit}
              suffix={` ${ap?.currency ?? "USD"}`}
              decimals={2}
              className="text-lg font-semibold"
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Funds Used</p>
            <p className="text-lg font-semibold">
              {ap?.metrics.all_time_funds_used !== undefined
                ? `${ap.metrics.all_time_funds_used.toFixed(2)} ${ap.currency}`
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-lg font-semibold">
              {stats?.prediction_accuracy !== undefined
                ? `${(stats.prediction_accuracy * 100).toFixed(0)}%`
                : "--"}
              {stats?.predictions_made !== undefined && (
                <span className="ml-1 text-sm text-muted-foreground">
                  ({stats.predictions_made} trades)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Available Funds</span>
            <span className="font-mono text-sm">{ap?.metrics.available_funds?.toFixed(2) ?? "--"} {ap?.currency ?? ""}</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
            <span className="text-sm text-muted-foreground">Locked in Markets</span>
            <span className="font-mono text-sm">{ap?.metrics.funds_locked_in_markets?.toFixed(2) ?? "--"} {ap?.currency ?? ""}</span>
          </div>
        </div>

        {performance?.metrics && performance.metrics.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {performance.metrics.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
              >
                <span className="text-sm text-muted-foreground">{m.name}</span>
                <span className="font-mono text-sm">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {performance?.profit_over_time?.data_points &&
          performance.profit_over_time.data_points.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Cumulative Profit
              </p>
              <ProfitChart data={performance.profit_over_time.data_points} />
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function ProfitChart({ data }: { data: ProfitDataPoint[] }) {
  if (data.length < 2) return null;

  const maxProfit = Math.max(...data.map((d) => d.cumulative_profit));
  const minProfit = Math.min(...data.map((d) => d.cumulative_profit));
  const range = maxProfit - minProfit || 1;
  const h = 120;
  const w = 400;
  const padding = 4;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (w - 2 * padding);
    const y = h - padding - ((d.cumulative_profit - minProfit) / range) * (h - 2 * padding);
    return `${x},${y}`;
  });

  const zeroY = h - padding - ((0 - minProfit) / range) * (h - 2 * padding);
  const isNegative = data[data.length - 1].cumulative_profit < 0;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md" preserveAspectRatio="none">
        {minProfit < 0 && maxProfit > 0 && (
          <line
            x1={padding} y1={zeroY} x2={w - padding} y2={zeroY}
            stroke="currentColor" strokeOpacity={0.15} strokeDasharray="4,4"
          />
        )}
        <polyline
          fill="none"
          stroke={isNegative ? "oklch(0.637 0.237 25.33)" : "oklch(0.696 0.17 162.48)"}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(" ")}
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

function parseDeadlineMs(title: string): number | null {
  const match = title.match(/(?:on or )?before\s+(\w+\s+\d{1,2},?\s+\d{4})/i);
  if (!match) return null;
  const d = new Date(match[1]);
  if (isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function TradesPanel({ serviceId }: { serviceId: string }) {
  const { data: performance } = useQuery({
    ...queries.agentPerformance(serviceId),
    refetchInterval: 15_000,
  });

  const trades = performance?.prediction_history?.items;

  const columns: ColumnDef<PredictionItem>[] = useMemo(() => [
    {
      accessorKey: "market.title",
      header: "Market",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <a
            href={row.original.market.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary text-sm line-clamp-1"
            title={row.original.market.title}
          >
            {row.original.market.title}
          </a>
        </div>
      ),
    },
    {
      accessorKey: "prediction_side",
      header: "Side",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.prediction_side === "yes"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }
        >
          {row.original.prediction_side.toUpperCase()}
        </Badge>
      ),
      size: 70,
    },
    {
      accessorKey: "bet_amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.bet_amount.toFixed(3)}</span>
      ),
      size: 80,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <TradeStatusBadge status={row.original.status} />,
      size: 80,
    },
    {
      id: "remaining",
      header: "Remaining",
      accessorFn: (row) => {
        if (row.status.toLowerCase() !== "pending") return -1;
        const dl = parseDeadlineMs(row.market.title);
        return dl ? dl - Date.now() : Infinity;
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          <TimeRemaining title={row.original.market.title} status={row.original.status} />
        </span>
      ),
      size: 90,
    },
    {
      accessorKey: "net_profit",
      header: "Profit",
      cell: ({ row }) => (
        <ProfitDisplay value={row.original.net_profit} decimals={3} className="text-sm" />
      ),
      size: 80,
    },
  ], []);

  const table = useReactTable({
    data: trades ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
      sorting: [{ id: "remaining", desc: false }],
    },
  });

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
          <p className="py-8 text-center text-muted-foreground">No trades recorded yet</p>
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
        <CardDescription>
          {performance?.prediction_history?.total_predictions ?? trades.length} predictions total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={`cursor-pointer select-none hover:text-foreground ${
                        ["bet_amount", "net_profit"].includes(header.id) ? "text-right" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: " \u2191", desc: " \u2193" }[header.column.getIsSorted() as string] ?? ""}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        ["bet_amount", "net_profit"].includes(cell.column.id) ? "text-right" : ""
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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

function TimeRemaining({ title, status }: { title: string; status: string }) {
  if (status.toLowerCase() !== "pending") return <span>--</span>;

  // Parse "on or before April 16, 2026" or "before April 15, 2026" from the title
  const match = title.match(/(?:on or )?before\s+(\w+\s+\d{1,2},?\s+\d{4})/i);
  if (!match) return <span>--</span>;

  const deadline = new Date(match[1]);
  if (isNaN(deadline.getTime())) return <span>--</span>;

  // Set to end of day
  deadline.setHours(23, 59, 59, 999);

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return <span className="text-yellow-400">Resolving</span>;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return <span>{days}d {remainingHours}h</span>;
  }
  return <span className="text-yellow-400">{hours}h</span>;
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
    <div className="space-y-6 overflow-x-hidden">
      <div className="space-y-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                {service.name || service.service_config_id.slice(0, 20)}
              </h1>
              {deployment && <StatusBadge status={deployment.status} />}
            </div>
            <p className="font-mono text-xs text-muted-foreground truncate">
              {service.service_config_id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/service/$id/settings" params={{ id }}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <ServiceControls serviceId={id} />
        </div>
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
              value={performance?.agent_performance?.metrics.all_time_profit}
              suffix={` ${performance?.agent_performance?.currency ?? "USD"}`}
              decimals={2}
            />
          }
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Accuracy"
          value={
            performance?.agent_performance?.stats.prediction_accuracy !== undefined
              ? `${(performance.agent_performance.stats.prediction_accuracy * 100).toFixed(0)}%`
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
