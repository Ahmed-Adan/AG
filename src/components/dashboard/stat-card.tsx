import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "primary" | "secondary" | "brand" | "approved" | "pending" | "rejected";
}) {
  const accentClasses: Record<typeof accent, string> = {
    primary: "bg-primary/10 text-primary dark:text-white",
    secondary: "bg-secondary/10 text-secondary",
    brand: "bg-brand-accent/10 text-brand-accent",
    approved: "bg-status-approved/10 text-status-approved",
    pending: "bg-status-pending/10 text-status-pending",
    rejected: "bg-status-rejected/10 text-status-rejected",
  };

  return (
    <Card className="glass-card transition-transform hover:-translate-y-0.5">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accentClasses[accent])}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
