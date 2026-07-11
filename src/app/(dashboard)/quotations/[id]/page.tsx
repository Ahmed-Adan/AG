"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Pencil,
  Printer,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/quotations/status-badge";
import { WhatsAppShareButton } from "@/components/quotations/whatsapp-share-button";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { QuotationDTO } from "@/types";

export default function QuotationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: authSession } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["quotation", params.id],
    queryFn: () => apiFetch<{ quotation: QuotationDTO }>(`/api/quotations/${params.id}`),
  });

  const statusMutation = useMutation({
    mutationFn: (status: "PENDING" | "APPROVED" | "REJECTED") =>
      apiFetch<{ quotation: QuotationDTO }>(`/api/quotations/${params.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success("Quotation status updated");
      queryClient.invalidateQueries({ queryKey: ["quotation", params.id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ quotation: QuotationDTO }>(`/api/quotations/${params.id}/duplicate`, {
        method: "POST",
      }),
    onSuccess: ({ quotation }) => {
      toast.success(`Duplicated as ${quotation.quotationNumber}`);
      router.push(`/quotations/${quotation.id}/edit`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/api/quotations/${params.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Quotation deleted");
      router.push("/quotations");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!data) return <p className="text-muted-foreground">Quotation not found.</p>;

  const { quotation } = data;
  const role = authSession?.user?.role;
  const canApprove = role ? can(role, "quotation.approve") : false;
  const isOwner = authSession?.user?.id === quotation.preparedById;
  const canEdit = quotation.status !== "APPROVED" && (isOwner || (role && can(role, "quotation.editAny")));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/quotations">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{quotation.quotationNumber}</h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p className="text-sm text-muted-foreground">{quotation.projectName}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {quotation.status === "DRAFT" && isOwner && (
            <Button variant="brand" onClick={() => statusMutation.mutate("PENDING")}>
              <Send /> Submit for Approval
            </Button>
          )}
          {quotation.status === "PENDING" && canApprove && (
            <>
              <Button variant="brand" onClick={() => statusMutation.mutate("APPROVED")}>
                <CheckCircle2 /> Approve
              </Button>
              <Button variant="destructive" onClick={() => statusMutation.mutate("REJECTED")}>
                <XCircle /> Reject
              </Button>
            </>
          )}
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/quotations/${quotation.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => duplicateMutation.mutate()}>
            <Copy /> Duplicate
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`/api/quotations/${quotation.id}/pdf`}
              download={`${quotation.quotationNumber}.pdf`}
            >
              <Download /> Download PDF
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/api/quotations/${quotation.id}/pdf`, "_blank")}
          >
            <Printer /> Print
          </Button>
          <WhatsAppShareButton quotation={quotation} />
          {quotation.status === "DRAFT" && isOwner && (
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm(`Delete quotation ${quotation.quotationNumber}?`)) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Customer" value={quotation.customer.name} sub={quotation.customer.companyName} />
        <InfoCard label="Project Location" value={quotation.projectLocation || "—"} />
        <InfoCard label="Date" value={formatDate(quotation.date)} />
        <InfoCard
          label="Valid Until"
          value={quotation.validUntil ? formatDate(quotation.validUntil) : "—"}
        />
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Width (m)</TableHead>
                <TableHead>Height (m)</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Area (m²)</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.position}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{formatNumber(item.width, 3)}</TableCell>
                  <TableCell>{formatNumber(item.height, 3)}</TableCell>
                  <TableCell>{formatNumber(item.quantity, 0)}</TableCell>
                  <TableCell>{formatNumber(item.area, 3)}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>
                    {Number(item.discountValue) > 0
                      ? item.discountType === "PERCENT"
                        ? `${formatNumber(item.discountValue, 0)}%`
                        : formatCurrency(item.discountValue)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="ml-auto mt-6 flex w-full max-w-xs flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(quotation.subTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatCurrency(quotation.discountAmount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Grand Total</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT ({formatNumber(quotation.vatPercent, 0)}%)</span>
              <span>{formatCurrency(quotation.vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-brand-accent">
              <span>Final Total</span>
              <span>{formatCurrency(quotation.finalTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {(quotation.notes || quotation.termsAndConditions) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {quotation.notes && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {quotation.notes}
              </CardContent>
            </Card>
          )}
          {quotation.termsAndConditions && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Terms &amp; Conditions</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                {quotation.termsAndConditions}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
