import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { queries } from "@/api/queries";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MiddlewareVersionBadge() {
  const { data } = useQuery({
    ...queries.middlewareVersion,
    refetchInterval: 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  if (!data || data.is_outdated !== true || !data.latest) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={data.latest.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Badge
              variant="outline"
              className="gap-1 bg-yellow-500/10 text-yellow-400 border-yellow-500/20 cursor-pointer"
            >
              <AlertCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Update available</span>
              <span className="font-mono text-[10px]">
                {data.installed} → {data.latest.version}
              </span>
            </Badge>
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed">
          A newer middleware release is available upstream. Click to open the
          release notes.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
