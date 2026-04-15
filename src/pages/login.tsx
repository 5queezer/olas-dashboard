import { type FormEvent, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { mutations } from "@/api/queries";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/api/client";

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await mutations.login(password);
      login();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to connect to the server");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Olas Operate
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your password to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loading}
              className="bg-background"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
