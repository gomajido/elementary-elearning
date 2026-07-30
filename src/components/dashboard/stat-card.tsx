import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            tone === "warning" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
