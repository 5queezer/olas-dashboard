import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Info, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/client";
import { queries } from "@/api/queries";
import type { AgentPerformance } from "@/api/types";

interface ChatuiParams {
  trading_strategy?: string;
  initial_trading_strategy?: string;
  allowed_tools?: string[] | null;
  fixed_bet_size?: number;
  max_bet_size?: number;
  [key: string]: unknown;
}

const STRATEGIES = [
  { value: "kelly_criterion", label: "Kelly Criterion", description: "Optimal bet sizing based on edge and odds" },
  { value: "fixed_bet", label: "Fixed Bet", description: "Always bet the same fixed amount" },
];

function weiToXdai(wei: number): string {
  return (wei / 1e18).toFixed(4);
}

function xdaiToWei(xdai: string): number {
  return Math.round(parseFloat(xdai) * 1e18);
}

export function SettingsPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();

  const { data: params, isLoading } = useQuery({
    queryKey: ["chatui-params", id],
    queryFn: () => api.get<ChatuiParams>(`/api/v2/service/${id}/chatui_params`),
  });

  const { data: performance } = useQuery({
    ...queries.agentPerformance(id),
    refetchInterval: 60_000,
  });

  const perf = performance as AgentPerformance & { agent_behavior?: string } | undefined;

  const [strategy, setStrategy] = useState("");
  const [fixedBet, setFixedBet] = useState("");
  const [maxBet, setMaxBet] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params) {
      setStrategy(params.trading_strategy ?? "kelly_criterion");
      setFixedBet(params.fixed_bet_size ? weiToXdai(params.fixed_bet_size) : "0.025");
      setMaxBet(params.max_bet_size ? weiToXdai(params.max_bet_size) : "2.0");
    }
  }, [params]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await api.patch<ChatuiParams>(`/api/v2/service/${id}/chatui_params`, {
        trading_strategy: strategy,
        fixed_bet_size: xdaiToWei(fixedBet),
        max_bet_size: xdaiToWei(maxBet),
      });
      queryClient.invalidateQueries({ queryKey: ["chatui-params", id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/service/$id" params={{ id }}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure trading parameters. Restart the agent after saving for changes to take effect.
          </p>
        </div>
      </div>

      {perf?.agent_behavior && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-muted-foreground" />
              Current Agent Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {perf.agent_behavior}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Trading Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {STRATEGIES.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                strategy === s.value
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <input
                type="radio"
                name="strategy"
                value={s.value}
                checked={strategy === s.value}
                onChange={() => setStrategy(s.value)}
                className="mt-0.5 accent-primary"
              />
              <div>
                <div className="font-medium text-sm">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.description}</div>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Bet Sizing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Fixed Bet Size (xDAI)
            </label>
            <Input
              type="number"
              step="0.001"
              min="0.001"
              value={fixedBet}
              onChange={(e) => setFixedBet(e.target.value)}
              className="bg-background max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Amount to bet per trade when using fixed bet strategy
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Max Bet Size (xDAI)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={maxBet}
              onChange={(e) => setMaxBet(e.target.value)}
              className="bg-background max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Maximum amount per trade regardless of strategy
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Settings
        </Button>

        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-500">
            <RotateCcw className="h-3 w-3" />
            Saved — restart agent to apply
          </span>
        )}

        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
