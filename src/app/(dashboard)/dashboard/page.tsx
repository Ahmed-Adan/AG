"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Plus,
  UserPlus,
} from "lucide-react";

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
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusBadge } from "@/components/quotations/status-badge";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { QuotationDTO } from "@/types";

interface DashboardSummary {
  counts: { total: number; approved: number; pending: number; rejected: number; draft: number };
  totalSales: number;
  monthlyRevenue: number;
  revenueTrend: { month: string; total: number }[];
  recentQuotations: QuotationDTO[];
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your quotations, sales, and revenue.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/customers">
              <UserPlus /> New Customer
            </Link>
          </Button>
          <Button variant="brand" asChild>
            <Link href="/quotations/new">
              <Plus /> New Quotation
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Quotations"
          value={String(data?.counts.total ?? (isLoading ? "…" : 0))}
          icon={FileText}
          accent="primary"
        />
        <StatCard
          label="Approved"
          value={String(data?.counts.approved ?? (isLoading ? "…" : 0))}
          icon={CheckCircle2}
          accent="approved"
        />
        <StatCard
          label="Pending"
          value={String(data?.counts.pending ?? (isLoading ? "…" : 0))}
          icon={Clock}
          accent="pending"
        />
        <StatCard
          label="Rejected"
          value={String(data?.counts.rejected ?? (isLoading ? "…" : 0))}
          icon={XCircle}
          accent="rejected"
        />
        <StatCard
          label="Total Sales"
          value={formatCurrency(data?.totalSales ?? 0)}
          icon={DollarSign}
          accent="brand"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(data?.monthlyRevenue ?? 0)}
          icon={TrendingUp}
          accent="secondary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend (Approved Quotations)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.revenueTrend.length ? (
              <RevenueChart data={data.revenueTrend} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No approved revenue yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/quotations/new">
                <Plus /> Create Quotation
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/customers">
                <UserPlus /> Add Customer
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/quotations?status=PENDING">
                <Clock /> Review Pending
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/reports">
                <TrendingUp /> View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!data || data.recentQuotations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {isLoading ? "Loading..." : "No quotations yet."}
                  </TableCell>
                </TableRow>
              )}
              {data?.recentQuotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    <Link href={`/quotations/${q.id}`} className="text-secondary hover:underline">
                      {q.quotationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{q.customer.name}</TableCell>
                  <TableCell>{formatDate(q.date)}</TableCell>
                  <TableCell>
                    <StatusBadge status={q.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(q.finalTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
