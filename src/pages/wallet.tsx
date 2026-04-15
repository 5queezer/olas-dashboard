import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, Wallet as WalletIcon, Shield, Check } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CHAIN_EXPLORERS: Record<string, string> = {
  ethereum: "https://etherscan.io/address/",
  gnosis: "https://gnosisscan.io/address/",
  base: "https://basescan.org/address/",
  optimism: "https://optimistic.etherscan.io/address/",
  mode: "https://modescan.io/address/",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

function AddressDisplay({
  address,
  chain,
}: {
  address: string;
  chain?: string;
}) {
  const explorer = chain ? CHAIN_EXPLORERS[chain.toLowerCase()] : undefined;

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-sm">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
      <CopyButton text={address} />
      {explorer && (
        <a
          href={`${explorer}${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function formatBalance(wei: number): string {
  return (wei / 1e18).toFixed(4);
}

function BalanceTable({
  balances,
  chain,
}: {
  balances: Record<string, number>;
  chain?: string;
}) {
  const entries = Object.entries(balances).filter(
    ([, v]) => v !== undefined && v !== null,
  );

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No balances available</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map(([asset, balance]) => (
          <TableRow key={asset}>
            <TableCell className="font-mono text-xs">
              {asset === "0x0000000000000000000000000000000000000000" ? (
                <span className="flex items-center gap-1">
                  Native
                  {chain && (
                    <Badge variant="secondary" className="text-[10px]">
                      {chain}
                    </Badge>
                  )}
                </span>
              ) : (
                <span>
                  {asset.slice(0, 6)}...{asset.slice(-4)}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {formatBalance(balance)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function WalletPage() {
  const {
    data: wallets,
    isLoading: walletsLoading,
    error: walletsError,
    refetch: refetchWallets,
  } = useQuery({
    ...queries.wallet,
    refetchInterval: 30_000,
  });

  const { data: extendedWallets } = useQuery({
    ...queries.walletExtended,
    refetchInterval: 30_000,
  });

  if (walletsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (walletsError) {
    return (
      <ErrorDisplay
        message="Failed to load wallet info"
        onRetry={() => void refetchWallets()}
      />
    );
  }

  if (!wallets || wallets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Manage your wallets and balances
          </p>
        </div>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <WalletIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              No wallets found. Create one to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Manage your wallets and balances
        </p>
      </div>

      {wallets.map((wallet, idx) => {
        const extended = extendedWallets?.[idx];

        return (
          <div key={wallet.address} className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <WalletIcon className="h-4 w-4 text-primary" />
                  Master EOA
                </CardTitle>
                <CardDescription className="capitalize">
                  {wallet.ledger_type}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">Address</p>
                  <AddressDisplay
                    address={wallet.address}
                    chain={wallet.ledger_type}
                  />
                </div>

                {extended?.balances && (
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      EOA Balances
                    </p>
                    {Object.entries(extended.balances).map(
                      ([addr, balances]) => (
                        <BalanceTable
                          key={addr}
                          balances={balances}
                          chain={wallet.ledger_type}
                        />
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {wallet.safes && Object.keys(wallet.safes).length > 0 && (
              <div className="space-y-4">
                {Object.entries(wallet.safes).map(([chain, safeAddress]) => (
                  <Card key={chain} className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="h-4 w-4 text-primary" />
                        Master Safe
                        <Badge variant="secondary" className="capitalize">
                          {chain}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Safe Address
                        </p>
                        <AddressDisplay
                          address={safeAddress}
                          chain={chain}
                        />
                      </div>

                      {extended?.safe_balances?.[chain] && (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">
                            Safe Balances
                          </p>
                          {Object.entries(extended.safe_balances[chain]).map(
                            ([addr, balances]) => (
                              <BalanceTable
                                key={addr}
                                balances={balances}
                                chain={chain}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
