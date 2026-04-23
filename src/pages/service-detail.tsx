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
  Zap,
  RefreshCw,
  Search,
  Brain,
  CheckCircle,
  Check,
  Info,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Trading</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
                        Paused when the staking KPI is already met for the
                        current checkpoint period — the agent skips placing
                        new bets to protect bankroll and resumes after the
                        next checkpoint. Disabled means trading is turned off
                        in the agent config.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm">
                  {hc.agent_health.is_staking_kpi_met === true ? (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Paused · KPI met</Badge>
                  ) : hc.agent_health.is_staking_kpi_met === false ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                  ) : "--"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Agent Funded</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
                        True when the agent&apos;s on-chain balance is above
                        its configured gas/operations threshold. No means a
                        top-up from the Master Safe is warranted. Stale while
                        trading is paused — the agent skips the transaction
                        rounds that refresh this value.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm">
                  {hc.agent_health.has_required_funds === false ? (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                      {hc.agent_health.is_staking_kpi_met === true ? "No · Stale" : "No"}
                    </Badge>
                  ) : hc.agent_health.is_staking_kpi_met === true ? (
                    <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20" title="Not refreshed while trading is paused">Stale</Badge>
                  ) : hc.agent_health.has_required_funds === true ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Yes</Badge>
                  ) : "--"}
                </p>
              </div>
            </>
          )}
        </div>
        {hc?.rounds && hc.rounds.length > 0 && (
          <div className="mt-4">
            <RoundPipeline
              rounds={hc.rounds as string[]}
              isTradingPaused={hc.agent_health?.is_staking_kpi_met === true}
            />
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
      id: "market",
      accessorKey: "market.title",
      header: "Market",
      cell: ({ row }) => (
        <a
          href={row.original.market.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary block truncate text-sm"
          title={row.original.market.title}
        >
          {row.original.market.title}
        </a>
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
      id: "closes",
      header: "Closes",
      accessorFn: (row) => {
        if (row.status.toLowerCase() !== "pending") return -1;
        const dl = parseDeadlineMs(row.market.title);
        return dl ?? Infinity;
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          <CloseDate title={row.original.market.title} status={row.original.status} />
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
        <Table className="min-w-[640px] table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.id === "market"
                          ? "40%"
                          : header.column.columnDef.size,
                    }}
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

function CloseDate({ title, status }: { title: string; status: string }) {
  if (status.toLowerCase() !== "pending") return <span>--</span>;

  const ms = parseDeadlineMs(title);
  if (ms === null) return <span>--</span>;

  if (ms <= Date.now()) {
    return <span className="text-yellow-400">Resolving</span>;
  }

  const label = new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return <span>{label}</span>;
}

const PIPELINE_PHASES = [
  {
    id: "setup",
    label: "Setup",
    icon: Settings,
    rounds: [
      "registration_startup_round",
      "registration_round",
      "fetch_performance_data_round",
      "update_achievements_round",
      "chatui_load_round",
    ],
  },
  {
    id: "research",
    label: "Research",
    icon: Search,
    rounds: [
      "mech_version_detection_round",
      "mech_information_round",
      "check_benchmarking_mode_round",
      "fetch_markets_router_round",
    ],
  },
  {
    id: "decide",
    label: "Decide",
    icon: Brain,
    rounds: [
      "randomness_round",
      "sampling_round",
      "tool_selection_round",
      "decision_request_round",
      "mech_request_round",
      "mech_response_round",
      "decision_receive_round",
    ],
  },
  {
    id: "trade",
    label: "Trade",
    icon: TrendingUp,
    rounds: [
      "update_bets_round",
      "check_stop_trading_round",
      "bet_placement_round",
      "sell_outcome_tokens_round",
      "pre_tx_settlement_round",
      "collect_signature_round",
      "finalization_round",
      "validate_transaction_round",
      "post_tx_settlement_round",
      "handle_failed_tx_round",
    ],
  },
  {
    id: "settle",
    label: "Settle",
    icon: CheckCircle,
    rounds: [
      "redeem_round",
      "redeem_router_round",
      "call_checkpoint_round",
      "reset_and_pause_round",
      "service_evicted_round",
    ],
  },
] as const;

function getPhaseStatus(rounds: string[]) {
  const currentRound = rounds[rounds.length - 1];
  let activePhaseIndex = -1;

  for (let i = 0; i < PIPELINE_PHASES.length; i++) {
    if ((PIPELINE_PHASES[i].rounds as readonly string[]).includes(currentRound)) {
      activePhaseIndex = i;
      break;
    }
  }

  // If current round not found in any phase, default to first phase
  if (activePhaseIndex === -1) activePhaseIndex = 0;

  return { activePhaseIndex, currentRound };
}

const PAUSE_ROUNDS = new Set([
  "reset_and_pause_round",
  "call_checkpoint_round",
  "check_stop_trading_round",
]);
const TRADING_PAUSED_CAPTION =
  "Trading paused — staking KPI met. Resumes after next checkpoint.";

function RoundPipeline({
  rounds,
  isTradingPaused = false,
}: {
  rounds: string[];
  isTradingPaused?: boolean;
}) {
  const { activePhaseIndex, currentRound } = getPhaseStatus(rounds);
  const description =
    isTradingPaused && PAUSE_ROUNDS.has(currentRound)
      ? TRADING_PAUSED_CAPTION
      : ROUND_DESCRIPTIONS[currentRound] ??
        currentRound.replace(/_round$/, "").replaceAll("_", " ");

  return (
    <>
      {/* Desktop: horizontal pipeline */}
      <div className="hidden sm:block">
        <div className="flex items-start">
          {PIPELINE_PHASES.map((phase, i) => {
            const status =
              i < activePhaseIndex
                ? "completed"
                : i === activePhaseIndex
                  ? "active"
                  : "pending";
            const Icon = phase.icon;

            return (
              <div key={phase.id} className="flex flex-1 items-start">
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div className="relative">
                    {status === "active" && (
                      <div className="absolute inset-0 -m-1 rounded-full border-2 border-primary animate-pulse" />
                    )}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : status === "active"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {status === "completed" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {/* Label */}
                  <span
                    className={`mt-1.5 text-xs font-medium ${
                      status === "completed"
                        ? "text-emerald-400"
                        : status === "active"
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {phase.label}
                  </span>
                </div>
                {/* Connecting line */}
                {i < PIPELINE_PHASES.length - 1 && (
                  <div
                    className={`mt-4 h-0 flex-1 border-t-2 ${
                      i < activePhaseIndex
                        ? "border-emerald-500"
                        : "border-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-primary">{description}</p>
      </div>

      {/* Mobile: compact dot progress */}
      <div className="flex items-center gap-2 sm:hidden">
        <span className="shrink truncate text-xs text-muted-foreground">
          {PIPELINE_PHASES[activePhaseIndex]?.label}:{" "}
          <span className="text-primary">{description}</span>
        </span>
        <div className="flex items-center gap-1">
          {PIPELINE_PHASES.map((phase, i) => {
            const status =
              i < activePhaseIndex
                ? "completed"
                : i === activePhaseIndex
                  ? "active"
                  : "pending";
            return (
              <span
                key={phase.id}
                className={`inline-block rounded-full ${
                  status === "completed"
                    ? "h-2 w-2 bg-emerald-400"
                    : status === "active"
                      ? "h-2.5 w-2.5 bg-primary animate-pulse"
                      : "h-2 w-2 bg-muted-foreground/30"
                }`}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

const ROUND_DESCRIPTIONS: Record<string, string> = {
  registration_startup_round: "Starting up",
  registration_round: "Registering agent",
  fetch_performance_data_round: "Fetching performance data",
  update_achievements_round: "Updating achievements",
  chatui_load_round: "Loading chat configuration",
  mech_version_detection_round: "Detecting the priority mech's version",
  mech_information_round: "Fetching mech information",
  check_benchmarking_mode_round: "Checking benchmarking mode",
  fetch_markets_router_round: "Routing to market fetching",
  update_bets_round: "Updating trade list",
  check_stop_trading_round: "Checking if trading should stop",
  randomness_round: "Gathering randomness",
  sampling_round: "Sampling a trade",
  tool_selection_round: "Choosing prediction tool",
  decision_request_round: "Requesting trade outcome",
  decision_receive_round: "Making a prediction",
  mech_request_round: "Requesting outcome data",
  mech_response_round: "Receiving outcome data",
  bet_placement_round: "Opening a trade",
  redeem_round: "Preparing to redeem winnings",
  redeem_router_round: "Deciding between redeem tools",
  call_checkpoint_round: "Checking reward status",
  reset_and_pause_round: "Taking a short break",
  pre_tx_settlement_round: "Preparing settlement",
  collect_signature_round: "Signing a transaction",
  finalization_round: "Completing the action",
  validate_transaction_round: "Validating a transaction",
  post_tx_settlement_round: "Finalizing transaction settlement",
  handle_failed_tx_round: "Handling a failed transaction",
  sell_outcome_tokens_round: "Selling tokens of unresolved trades",
  service_evicted_round: "Agent evicted from staking",
};

function getRoundDescription(
  round: string,
  roundsInfo?: Record<string, { name?: string; description?: string }>,
  isTradingPaused = false,
): string {
  if (isTradingPaused && PAUSE_ROUNDS.has(round)) return TRADING_PAUSED_CAPTION;
  if (roundsInfo?.[round]?.description) return roundsInfo[round].description!;
  if (ROUND_DESCRIPTIONS[round]) return ROUND_DESCRIPTIONS[round];
  return round.replace(/_round$/, "").replaceAll("_", " ");
}

function CurrentAction({ serviceId }: { serviceId: string }) {
  const { data: deployment } = useQuery({
    ...queries.deployment(serviceId),
    refetchInterval: 5_000,
  });

  const hc = deployment?.healthcheck;
  const rounds = hc?.rounds as string[] | undefined;
  const roundsInfo = (hc as Record<string, unknown>)?.rounds_info as Record<string, { name?: string; description?: string }> | undefined;
  const currentRound = rounds?.[rounds.length - 1];
  const isDeployed = deployment?.status === 3;

  if (!isDeployed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-2.5">
        <Square className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Agent is not running</span>
      </div>
    );
  }

  if (!currentRound) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-2.5">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Starting up...</span>
      </div>
    );
  }

  const isTradingPaused = hc?.agent_health?.is_staking_kpi_met === true;
  const description = getRoundDescription(currentRound, roundsInfo, isTradingPaused);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
      <RefreshCw className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "3s" }} />
      <span className="text-sm">
        <span className="text-muted-foreground">Current action: </span>
        <span className="text-primary font-medium">{description}</span>
      </span>
    </div>
  );
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
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
            <Zap className="h-3 w-3" />
            Auto-run is on
          </Badge>
          <Link to="/service/$id/settings" params={{ id }}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <ServiceControls serviceId={id} />
        </div>
      </div>

      <CurrentAction serviceId={id} />

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
