"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Pencil, Trash2, Copy, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/quotations/status-badge";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { QuotationDTO, QuotationStatus } from "@/types";

export default function QuotationsListPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("ALL");
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["quotations", debouncedSearch, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status !== "ALL") params.set("status", status);
      return apiFetch<{ quotations: QuotationDTO[] }>(`/api/quotations?${params.toString()}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/quotations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Quotation deleted");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ quotation: QuotationDTO }>(`/api/quotations/${id}/duplicate`, {
        method: "POST",
      }),
    onSuccess: ({ quotation }) => {
      toast.success(`Duplicated as ${quotation.quotationNumber}`);
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            Create, track, and manage all customer quotations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a
              href={`/api/quotations/export?${new URLSearchParams({
                ...(debouncedSearch ? { q: debouncedSearch } : {}),
                ...(status !== "ALL" ? { status } : {}),
              }).toString()}`}
            >
              <FileSpreadsheet /> Export Excel
            </a>
          </Button>
          <Button variant="brand" asChild>
            <Link href="/quotations/new">
              <Plus /> New Quotation
            </Link>
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by number, project, or customer..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.quotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No quotations found.
                  </TableCell>
                </TableRow>
              )}
              {data?.quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    <Link href={`/quotations/${q.id}`} className="text-secondary hover:underline">
                      {q.quotationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{q.customer.name}</TableCell>
                  <TableCell>{q.projectName}</TableCell>
                  <TableCell>{formatDate(q.date)}</TableCell>
                  <TableCell>
                    <StatusBadge status={q.status as QuotationStatus} />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(q.finalTotal)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/quotations/${q.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      {q.status !== "APPROVED" && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/quotations/${q.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateMutation.mutate(q.id)}
                      >
                        <Copy className="size-4" />
                      </Button>
                      {q.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Delete quotation ${q.quotationNumber}?`)) {
                              deleteMutation.mutate(q.id);
                            }
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
