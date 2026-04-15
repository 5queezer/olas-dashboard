import { useState } from "react";
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { parseEther, formatEther } from "viem";
import { gnosis } from "wagmi/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PRESET_AMOUNTS = ["1", "5", "10"];

export function FundAgent({ masterEoa }: { masterEoa: string }) {
  const [amount, setAmount] = useState("");
  const { address, chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const { data: balance } = useBalance({
    address,
    chainId: gnosis.id,
  });

  const {
    sendTransaction,
    data: txHash,
    isPending: isSending,
    error: sendError,
    reset,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isWrongChain = isConnected && chain?.id !== gnosis.id;
  const parsedAmount = parseFloat(amount);
  const hasValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const balanceValue = balance ? parseFloat(formatEther(balance.value)) : 0;
  const insufficientBalance = hasValidAmount && balanceValue < parsedAmount;

  function handleSend() {
    if (!hasValidAmount) return;
    sendTransaction({
      to: masterEoa as `0x${string}`,
      value: parseEther(amount),
      chainId: gnosis.id,
    });
  }

  function handleReset() {
    reset();
    setAmount("");
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRight className="h-4 w-4 text-emerald-400" />
          Fund Agent
        </CardTitle>
        <CardDescription>
          Send xDAI from your wallet to the Master EOA on Gnosis chain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-muted-foreground">Connect your wallet to fund the agent</p>
            <ConnectButton />
          </div>
        ) : isWrongChain ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Wrong network — switch to Gnosis chain
            </div>
            <Button onClick={() => switchChain({ chainId: gnosis.id })} variant="outline" size="sm">
              Switch to Gnosis
            </Button>
          </div>
        ) : isConfirmed ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Check className="h-5 w-5" />
              <span className="font-medium">Transaction confirmed</span>
            </div>
            <a
              href={`https://gnosisscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on Gnosisscan
            </a>
            <Button onClick={handleReset} variant="outline" size="sm">
              Send another
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your balance</span>
              <span className="font-mono">
                {balance ? `${formatEther(balance.value)} xDAI` : "Loading..."}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount in xDAI"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.1"
                  disabled={isSending || isConfirming}
                />
              </div>
              <div className="flex gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setAmount(preset)}
                    disabled={isSending || isConfirming}
                  >
                    {preset} xDAI
                  </Button>
                ))}
              </div>
            </div>

            {insufficientBalance && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Insufficient balance
              </p>
            )}

            {sendError && (
              <p className="text-sm text-destructive">
                {sendError.message.includes("User rejected")
                  ? "Transaction rejected"
                  : "Transaction failed"}
              </p>
            )}

            <Button
              onClick={handleSend}
              disabled={!hasValidAmount || insufficientBalance || isSending || isConfirming}
              className="w-full"
            >
              {isSending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Confirm in wallet...</>
              ) : isConfirming ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</>
              ) : (
                `Send${hasValidAmount ? ` ${amount} xDAI` : ""}`
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
