import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Bot,
  TrendingUp,
  Target,
  ChevronRight,
} from "lucide-react";
import { queries } from "@/api/queries";
import type {
  AgentPerformance,
  DeploymentInfo,
  ServiceSummary,
} from "@/api/types";
import { DeploymentStatus } from "@/api/types";
import { StatusBadge } from "@/components/status-badge";
import { HealthIndicator } from "@/components/health-indicator";
import { ProfitDisplay } from "@/components/profit-display";
import { StatCard } from "@/components/stat-card";
import { DashboardSkeleton } from "@/components/loading-skeleton";
import { ErrorDisplay } from "@/components/error-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/client";

function useAllDeployments(services: ServiceSummary[] | undefined) {
  return useQuery({
    queryKey: ["all-deployments"],
    queryFn: async () => {
      if (!services?.length) return {};
      const result: Record<string, DeploymentInfo> = {};
      const responses = await Promise.allSettled(
        services.map(async (s) => {
          const dep = await api.get<DeploymentInfo>(
            `/api/v2/service/${s.service_config_id}/deployment`,
          );
          return { id: s.service_config_id, dep };
        }),
      );
      for (const r of responses) {
        if (r.status === "fulfilled") {
          result[r.value.id] = r.value.dep;
        }
      }
      return result;
    },
    enabled: !!services?.length,
    refetchInterval: 30_000,
  });
}

function useAllPerformances(services: ServiceSummary[] | undefined) {
  return useQuery({
    queryKey: ["all-performances"],
    queryFn: async () => {
      if (!services?.length) return {};
      const result: Record<
        string,
        { total_profit?: number; accuracy?: number }
      > = {};
      const responses = await Promise.allSettled(
        services.map(async (s) => {
          const perf = await api.get<AgentPerformance>(
            `/api/v2/service/${s.service_config_id}/agent_performance`,
          );
          return {
            id: s.service_config_id,
            perf: {
              total_profit: perf.agent_performance?.metrics.all_time_profit,
              accuracy: perf.agent_performance?.stats.prediction_accuracy,
            },
          };
        }),
      );
      for (const r of responses) {
        if (r.status === "fulfilled") {
          result[r.value.id] = r.value.perf;
        }
      }
      return result;
    },
    enabled: !!services?.length,
    refetchInterval: 30_000,
  });
}

export function DashboardPage() {
  const {
    data: services,
    isLoading,
    error,
    refetch,
  } = useQuery({
    ...queries.services,
    refetchInterval: 30_000,
  });

  const { data: deployments } = useAllDeployments(services);
  const { data: performances } = useAllPerformances(services);

  if (isLoading) return <DashboardSkeleton />;
  if (error)
    return (
      <ErrorDisplay
        message="Failed to load services"
        onRetry={() => void refetch()}
      />
    );

  const serviceCount = services?.length ?? 0;
  const deployedCount =
    services?.filter((s) => {
      const dep = deployments?.[s.service_config_id];
      return dep?.status === DeploymentStatus.DEPLOYED;
    }).length ?? 0;

  const totalProfit =
    services?.reduce((sum, s) => {
      const perf = performances?.[s.service_config_id];
      return sum + (perf?.total_profit ?? 0);
    }, 0) ?? 0;

  const accuracies =
    services
      ?.map((s) => performances?.[s.service_config_id]?.accuracy)
      .filter((a): a is number => a !== undefined && a !== null) ?? [];
  const avgAccuracy =
    accuracies.length > 0
      ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your autonomous agents
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Services"
          value={serviceCount}
          icon={<Bot className="h-4 w-4" />}
        />
        <StatCard
          label="Active"
          value={deployedCount}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Total Profit"
          value={<ProfitDisplay value={totalProfit} suffix=" xDAI" decimals={2} />}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Avg Accuracy"
          value={
            avgAccuracy !== null ? (
              `${(avgAccuracy * 100).toFixed(1)}%`
            ) : (
              <span className="text-muted-foreground">--</span>
            )
          }
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Services</h2>
        {serviceCount === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center gap-2 py-12">
              <Bot className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No services found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services?.map((service) => {
              const dep = deployments?.[service.service_config_id];
              const perf = performances?.[service.service_config_id];

              return (
                <Link
                  key={service.service_config_id}
                  to="/service/$id"
                  params={{ id: service.service_config_id }}
                  className="block"
                >
                  <Card className="border-border/50 transition-colors hover:border-border hover:bg-card/80">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <HealthIndicator
                            healthcheck={dep?.healthcheck}
                          />
                          <CardTitle className="text-base">
                            {service.name ||
                              service.service_config_id.slice(0, 20)}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {dep && <StatusBadge status={dep.status} />}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">
                          {service.service_config_id}
                        </span>
                        {perf?.total_profit !== undefined && (
                          <span className="flex items-center gap-1">
                            Profit:{" "}
                            <ProfitDisplay
                              value={perf.total_profit}
                              suffix=" xDAI"
                              decimals={2}
                            />
                          </span>
                        )}
                        {perf?.accuracy !== undefined && (
                          <span>
                            Accuracy: {(perf.accuracy * 100).toFixed(1)}%
                          </span>
                        )}
                        {service.home_chain && (
                          <span className="capitalize">
                            {service.home_chain}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
