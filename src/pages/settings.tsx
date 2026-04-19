import { useState, useEffect, type FormEvent } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Info, RotateCcw, Send, MessageSquare, Download, Check, ArrowUpCircle, GitFork } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/client";
import { queries } from "@/api/queries";
import type { AgentPerformance, ServiceSummary } from "@/api/types";
import { Badge } from "@/components/ui/badge";

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

      <AgentVersionCheck serviceId={id} />

      <ChatInstructions serviceId={id} onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["agent-performance", id] });
        queryClient.invalidateQueries({ queryKey: ["chatui-params", id] });
      }} />

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

function ChatInstructions({ serviceId, onSuccess }: { serviceId: string; onSuccess: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);

  // Poll queue status when a prompt is queued
  useEffect(() => {
    if (!queued) return;
    const interval = setInterval(async () => {
      try {
        const status = await api.get<{ status: string; result?: Record<string, unknown>; prompt?: string }>(
          `/api/v2/service/${serviceId}/chat/status`,
        );
        if (status.status === "delivered") {
          setQueued(false);
          setResponse("Instruction delivered to the agent successfully.");
          onSuccess();
        } else if (status.status === "failed") {
          setQueued(false);
          setChatError(
            status.result?.error
              ? String(status.result.error)
              : "Failed to deliver instruction after retrying.",
          );
        }
      } catch {
        // ignore poll errors
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [queued, serviceId, onSuccess]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setSending(true);
    setChatError(null);
    setResponse(null);
    setQueued(false);

    try {
      const result = await api.post<Record<string, unknown>>(
        `/api/v2/service/${serviceId}/chat`,
        { prompt: prompt.trim() },
      );

      if (result.status === "queued") {
        setQueued(true);
        setResponse(String(result.message));
        setPrompt("");
      } else if (result.error) {
        setChatError(String(result.error));
      } else {
        setResponse(
          result.message
            ? String(result.message)
            : "Instructions sent successfully. The agent will update its behavior.",
        );
        setPrompt("");
        onSuccess();
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-primary" />
          Change Agent Behavior
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Describe how the agent should trade in natural language. The agent uses AI to interpret
          your instructions and update its trading strategy, bet sizes, and tool preferences.
        </p>
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Focus on crypto markets, max bet 0.5 xDAI, avoid sports"
            disabled={sending || queued}
            className="bg-background flex-1"
          />
          <Button type="submit" disabled={sending || queued || !prompt.trim()} size="sm">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {queued && (
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            {response}
          </div>
        )}
        {!queued && response && (
          <p className="text-sm text-emerald-500">{response}</p>
        )}
        {chatError && (
          <p className="text-sm text-destructive">{chatError}</p>
        )}
      </CardContent>
    </Card>
  );
}

const PEARL_TEMPLATE_URLS: Record<string, string> = {
  trader:
    "https://raw.githubusercontent.com/valory-xyz/olas-operate-app/main/frontend/constants/serviceTemplates/service/trader.ts",
};

// Services running a custom fork — Pearl's "Update to vX" would clobber our code.
// Remove an entry to re-enable the upstream update check for that repo.
const LOCKED_REPOS: ReadonlySet<string> = new Set(["trader"]);

// GitHub owner for the active fork, used to link out from CustomAgentCard.
// Override per-deployment if you're running someone else's fork.
const FORK_OWNER = "5queezer";

function formatRelative(ts: number): string {
  const diffSec = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (diffSec < 90) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 90) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 48) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function truncateHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function CustomAgentCard({
  service,
}: {
  service?: ServiceSummary & {
    hash_history?: Record<string, string>;
    agent_release?: { repository?: { owner?: string; name?: string } };
  };
}) {
  const repo = service?.agent_release?.repository;
  const repoName = repo?.name;
  const hash = service?.hash ?? "";
  const history = service?.hash_history ?? {};
  const latestTs = Object.keys(history)
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a)[0];

  // Prefer the user's fork; fall back to repo.owner if somehow different.
  const owner = repo?.owner === "valory-xyz" ? FORK_OWNER : (repo?.owner ?? FORK_OWNER);
  const forkPath = repoName ? `${owner}/${repoName}` : null;
  const forkUrl = forkPath ? `https://github.com/${forkPath}` : null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitFork className="h-4 w-4 text-primary" />
          Custom Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Fork:</span>
          {forkUrl ? (
            <a
              href={forkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:underline"
            >
              {forkPath}
            </a>
          ) : (
            <span className="text-muted-foreground">unknown</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">IPFS hash:</span>
          <Badge variant="outline" className="font-mono" title={hash}>
            {truncateHash(hash)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Last deployed:</span>
          <span className="font-mono">
            {latestTs ? formatRelative(latestTs) : "unknown"}
          </span>
        </div>
        <p className="pt-1 text-xs text-muted-foreground">
          Running a custom fork. Upstream version checks are disabled — manage
          updates by publishing a new IPFS hash and patching this service.
        </p>
      </CardContent>
    </Card>
  );
}

interface LatestVersion {
  hash: string;
  version: string;
}

async function fetchLatestVersion(
  repoName: string,
): Promise<LatestVersion | null> {
  const url = PEARL_TEMPLATE_URLS[repoName];
  if (!url) return null;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const hashMatch = text.match(/hash:\s*'(bafybei[a-z0-9]+)'/);
    const versionMatch = text.match(/service_version:\s*'(v[\d.]+[^']*)'/);
    if (hashMatch && versionMatch) {
      return { hash: hashMatch[1], version: versionMatch[1] };
    }
    return null;
  } catch {
    return null;
  }
}

function AgentVersionCheck({ serviceId }: { serviceId: string }) {
  const queryClient = useQueryClient();
  const { data: service } = useQuery(queries.service(serviceId));
  const [latest, setLatest] = useState<LatestVersion | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const repo = (
    service as ServiceSummary & {
      agent_release?: { repository?: { name?: string; version?: string } };
    }
  )?.agent_release?.repository;
  const currentVersion = repo?.version;
  const currentRepoName = repo?.name;
  const currentHash = service?.hash;
  const isLocked = !!currentRepoName && LOCKED_REPOS.has(currentRepoName);
  const versionCheckSupported =
    !isLocked
    && !!currentRepoName
    && currentRepoName in PEARL_TEMPLATE_URLS;

  async function checkForUpdate() {
    if (!currentRepoName || !versionCheckSupported) return;
    setChecking(true);
    setUpdateResult(null);
    setUpdateError(null);
    const v = await fetchLatestVersion(currentRepoName);
    setLatest(v);
    setChecking(false);
  }

  useEffect(() => {
    if (versionCheckSupported) checkForUpdate();
  }, [versionCheckSupported, currentRepoName]);

  const hasUpdate = latest && currentHash && latest.hash !== currentHash;

  if (isLocked) {
    return (
      <CustomAgentCard
        service={
          service as ServiceSummary & {
            hash_history?: Record<string, string>;
            agent_release?: { repository?: { owner?: string; name?: string } };
          }
        }
      />
    );
  }

  async function applyUpdate() {
    if (!latest || !currentRepoName) return;
    setUpdating(true);
    setUpdateError(null);
    setUpdateResult(null);

    try {
      await api.patch(`/api/v2/service/${serviceId}`, {
        hash: latest.hash,
        agent_release: {
          is_aea: true,
          repository: {
            owner: "valory-xyz",
            name: currentRepoName,
            version: latest.version,
          },
        },
      });
      setUpdateResult(`Updated to ${latest.version}. Stop and start the agent to apply.`);
      queryClient.invalidateQueries({ queryKey: ["service", serviceId] });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpCircle className="h-4 w-4 text-primary" />
          Agent Version
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current:</span>
              <Badge variant="outline" className="font-mono">{currentVersion ?? "unknown"}</Badge>
              {currentRepoName && (
                <span className="text-xs text-muted-foreground">({currentRepoName})</span>
              )}
            </div>
            {versionCheckSupported && latest && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Latest:</span>
                <Badge variant="outline" className={`font-mono ${hasUpdate ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}`}>
                  {latest.version}
                </Badge>
                {!hasUpdate && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
            )}
          </div>

          {versionCheckSupported ? (
            hasUpdate ? (
              <Button onClick={applyUpdate} disabled={updating} size="sm">
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Update to {latest.version}
              </Button>
            ) : (
              <Button onClick={checkForUpdate} disabled={checking} variant="outline" size="sm">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check for updates"}
              </Button>
            )
          ) : null}
        </div>

        {!versionCheckSupported && (
          <p className="text-xs text-muted-foreground">
            Automatic update checking isn&apos;t wired up for this agent yet.
            Check the {currentRepoName ?? "agent"} repository on GitHub for
            releases.
          </p>
        )}
        {updateResult && (
          <p className="flex items-center gap-1 text-sm text-emerald-500">
            <Check className="h-3 w-3" /> {updateResult}
          </p>
        )}
        {updateError && (
          <p className="text-sm text-destructive">{updateError}</p>
        )}
      </CardContent>
    </Card>
  );
}
