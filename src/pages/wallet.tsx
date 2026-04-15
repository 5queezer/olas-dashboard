import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, Wallet as WalletIcon, Shield, Check, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import { queries } from "@/api/queries";
import { ErrorDisplay } from "@/components/error-display";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProfitDisplay } from "@/components/profit-display";
import { FundAgent } from "@/components/fund-agent";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CHAIN_EXPLORERS: Record<string, string> = {
  ethereum: "https://etherscan.io/address/",
  gnosis: "https://gnosisscan.io/address/",
  base: "https://basescan.org/address/",
  optimism: "https://optimistic.etherscan.io/address/",
  mode: "https://modescan.io/address/",
};

// Known Gnosis chain tokens
const TOKEN_NAMES: Record<string, { name: string; symbol: string; decimals: number }> = {
  "0x0000000000000000000000000000000000000000": { name: "xDAI", symbol: "xDAI", decimals: 18 },
  "0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f": { name: "OLAS", symbol: "OLAS", decimals: 18 },
  "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83": { name: "USDC", symbol: "USDC", decimals: 6 },
  "0x2a22f9c3b484c3629090FeED35F17Ff8F88f76F0": { name: "USDT", symbol: "USDT", decimals: 6 },
  "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d": { name: "wxDAI", symbol: "wxDAI", decimals: 18 },
};

function getTokenInfo(address: string) {
  const lower = address.toLowerCase();
  for (const [key, info] of Object.entries(TOKEN_NAMES)) {
    if (key.toLowerCase() === lower) return info;
  }
  return { name: `${address.slice(0, 6)}...${address.slice(-4)}`, symbol: "?", decimals: 18 };
}

function formatTokenBalance(weiStr: string, decimals: number): number {
  return parseInt(weiStr, 10) / Math.pow(10, decimals);
}

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function AddressDisplay({ address, chain }: { address: string; chain?: string }) {
  const explorer = chain ? CHAIN_EXPLORERS[chain.toLowerCase()] : undefined;
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</span>
      <CopyButton text={address} />
      {explorer && (
        <a href={`${explorer}${address}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function BalanceRow({ token, weiStr }: { token: string; weiStr: string }) {
  const info = getTokenInfo(token);
  const balance = formatTokenBalance(weiStr, info.decimals);
  if (balance < 0.0001 && balance > 0) return null; // hide dust
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{info.symbol}</span>
      <span className={`font-mono text-sm ${balance > 0 ? "text-foreground" : "text-muted-foreground"}`}>
        {balance.toFixed(balance < 1 ? 4 : 2)}
      </span>
    </div>
  );
}

function BalanceCard({ balances }: { balances: Record<string, string> }) {
  const entries = Object.entries(balances).filter(([, v]) => {
    const val = parseInt(v, 10);
    return val > 0;
  });

  if (entries.length === 0) {
    return <p className="text-sm text-yellow-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> No funds</p>;
  }

  return (
    <div className="divide-y divide-border/30">
      {entries.map(([token, wei]) => (
        <BalanceRow key={token} token={token} weiStr={wei} />
      ))}
    </div>
  );
}

export function WalletPage() {
  const {
    data: wallets,
    isLoading: walletsLoading,
    error: walletsError,
    refetch: refetchWallets,
  } = useQuery({ ...queries.wallet, refetchInterval: 30_000 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: extendedRaw } = useQuery<any[]>({
    ...queries.walletExtended,
    refetchInterval: 30_000,
  });

  if (walletsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card className="border-border/50"><CardContent className="py-12"><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (walletsError) {
    return <ErrorDisplay message="Failed to load wallet info" onRetry={() => void refetchWallets()} />;
  }

  if (!wallets || wallets.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <WalletIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No wallets found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const extended = extendedRaw?.[0];

  // EOA balances: extended.balances.gnosis["0xEOA"] = {token: "wei", ...}
  const eoaBalances = extended?.balances?.gnosis?.[wallets[0].address] as Record<string, string> | undefined;

  // Safe info: extended.safes.gnosis["0xSafe"] = {backup_owners: [], balances: {token: "wei"}}
  const safes = extended?.safes?.gnosis as Record<string, { backup_owners?: string[]; balances?: Record<string, string> }> | undefined;

  // Calculate total xDAI across all wallets
  const xdaiToken = "0x0000000000000000000000000000000000000000";
  let totalXdai = 0;
  if (eoaBalances?.[xdaiToken]) totalXdai += parseInt(eoaBalances[xdaiToken], 10) / 1e18;
  if (safes) {
    for (const safe of Object.values(safes)) {
      if (safe.balances?.[xdaiToken]) totalXdai += parseInt(safe.balances[xdaiToken], 10) / 1e18;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Total xDAI across all wallets:{" "}
          <ProfitDisplay value={totalXdai} suffix=" xDAI" decimals={4} className="font-semibold" />
        </p>
      </div>

      {/* Fund Agent */}
      <FundAgent masterEoa={wallets[0].address} />

      {/* Master EOA */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WalletIcon className="h-4 w-4 text-primary" />
            Master EOA
            <InfoTip text="Your main wallet key. Send xDAI here to fund the agent. The middleware automatically moves funds from here → Master Safe → Agent Safe." />
          </CardTitle>
          <CardDescription>
            <AddressDisplay address={wallets[0].address} chain="gnosis" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eoaBalances ? <BalanceCard balances={eoaBalances} /> : <p className="text-sm text-muted-foreground">Loading balances...</p>}
        </CardContent>
      </Card>

      {/* Safes */}
      {safes && Object.entries(safes).map(([safeAddress, safeInfo]) => (
        <Card key={safeAddress} className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Master Safe
              <Badge variant="secondary">gnosis</Badge>
              <InfoTip text="A Gnosis Safe (2-of-2 multisig) that securely holds your funds. Automatically funded from Master EOA and forwards funds to the Agent Safe." />
            </CardTitle>
            <CardDescription>
              <AddressDisplay address={safeAddress} chain="gnosis" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            {safeInfo.balances ? <BalanceCard balances={safeInfo.balances} /> : <p className="text-sm text-muted-foreground">No balances</p>}
          </CardContent>
        </Card>
      ))}

      {/* Agent Safe — from service config */}
      <AgentSafeCard />
    </div>
  );
}

function AgentSafeCard() {
  const { data: services } = useQuery({ ...queries.services, refetchInterval: 60_000 });

  if (!services || services.length === 0) return null;

  const service = services[0];
  const gnosis = service.chain_configs?.gnosis;
  const agentSafe = gnosis?.chain_data?.multisig;

  if (!agentSafe) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-emerald-400" />
          Agent Safe
          <InfoTip text="The agent's operating wallet. Funded automatically from Master Safe. Used to place trades, pay for mech requests, and cover gas fees." />
          <Badge variant="secondary">gnosis</Badge>
        </CardTitle>
        <CardDescription>
          <AddressDisplay address={agentSafe} chain="gnosis" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Funded from Master Safe. Check balance on{" "}
          <a
            href={`https://gnosisscan.io/address/${agentSafe}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Gnosisscan
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
