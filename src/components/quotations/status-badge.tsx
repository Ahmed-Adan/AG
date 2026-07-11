import { Badge } from "@/components/ui/badge";
import type { QuotationStatus } from "@/types";

const STATUS_CONFIG: Record<QuotationStatus, { label: string; variant: "draft" | "pending" | "approved" | "rejected" }> = {
  DRAFT: { label: "Draft", variant: "draft" },
  PENDING: { label: "Pending", variant: "pending" },
  APPROVED: { label: "Approved", variant: "approved" },
  REJECTED: { label: "Rejected", variant: "rejected" },
};

export function StatusBadge({ status }: { status: QuotationStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
