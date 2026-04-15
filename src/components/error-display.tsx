import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({
  message = "Something went wrong",
  onRetry,
}: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-center text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
