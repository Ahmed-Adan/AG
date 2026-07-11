"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportTable, type ReportColumn } from "@/components/reports/report-table";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

const REPORT_TABS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "customer", label: "Customer" },
  { value: "sales", label: "Sales" },
  { value: "product", label: "Product" },
] as const;

type TimeRow = { period: string; count: number; total: number };
type CustomerRow = { customerId: string; name: string; companyName: string | null; count: number; total: number };
type ProductRow = { description: string; category: string | null; count: number; quantity: number; area: number; amount: number };
type SalesData = {
  statusBreakdown: { status: string; count: number; total: number }[];
  totalCount: number;
  approvedCount: number;
  approvedRevenue: number;
  approvalRate: number;
  averageApprovedValue: number;
  trend: TimeRow[];
};

const timeColumns: ReportColumn<TimeRow>[] = [
  { key: "period", header: "Period", render: (r) => formatDate(r.period) },
  { key: "count", header: "Quotations", align: "right" },
  { key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) },
];

const customerColumns: ReportColumn<CustomerRow>[] = [
  { key: "name", header: "Customer" },
  { key: "companyName", header: "Company" },
  { key: "count", header: "Quotations", align: "right" },
  { key: "total", header: "Total", align: "right", render: (r) => formatCurrency(r.total) },
];

const productColumns: ReportColumn<ProductRow>[] = [
  { key: "description", header: "Description" },
  { key: "category", header: "Category" },
  { key: "count", header: "Count", align: "right" },
  { key: "quantity", header: "Quantity", align: "right", render: (r) => formatNumber(r.quantity, 0) },
  { key: "area", header: "Area (m²)", align: "right", render: (r) => formatNumber(r.area, 2) },
  { key: "amount", header: "Revenue", align: "right", render: (r) => formatCurrency(r.amount) },
];

export default function ReportsPage() {
  const { data: authSession } = useSession();
  const [tab, setTab] = React.useState<string>("monthly");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [status, setStatus] = React.useState("");

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (status) params.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["report", tab, from, to, status],
    queryFn: () => apiFetch<{ type: string; data: unknown }>(`/api/reports/${tab}?${params.toString()}`),
  });

  if (authSession && authSession.user.role === "STAFF") {
    return <p className="text-muted-foreground">You do not have access to Reports.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Analyze quotations by time period, customer, sales performance, and product.
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <Button variant="outline" className="ml-auto" asChild>
            <a href={`/api/reports/${tab}?${params.toString()}&format=excel`}>
              <FileSpreadsheet /> Export Excel
            </a>
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {REPORT_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {["daily", "weekly", "monthly", "yearly"].map((t) => (
          <TabsContent key={t} value={t}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>{REPORT_TABS.find((r) => r.value === t)?.label} Report</CardTitle>
              </CardHeader>
              <CardContent>
                {!isLoading && tab === t && Array.isArray(data?.data) && data.data.length > 0 && (
                  <div className="mb-6">
                    <RevenueChart
                      data={[...(data.data as TimeRow[])]
                        .reverse()
                        .map((row) => ({ month: formatDate(row.period), total: row.total }))}
                    />
                  </div>
                )}
                <ReportTable
                  columns={timeColumns}
                  rows={tab === t ? ((data?.data as TimeRow[]) ?? []) : []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="customer">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Customer Report</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportTable
                columns={customerColumns}
                rows={tab === "customer" ? ((data?.data as CustomerRow[]) ?? []) : []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Product Report</CardTitle>
              <p className="text-xs text-muted-foreground">
                Aggregated by line-item description across all matching quotations.
              </p>
            </CardHeader>
            <CardContent>
              <ReportTable
                columns={productColumns}
                rows={tab === "product" ? ((data?.data as ProductRow[]) ?? []) : []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <SalesReportView data={tab === "sales" ? (data?.data as SalesData | undefined) : undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SalesReportView({ data }: { data?: SalesData }) {
  if (!data) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approved Revenue</p>
            <p className="text-xl font-bold">{formatCurrency(data.approvedRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approval Rate</p>
            <p className="text-xl font-bold">{(data.approvalRate * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg. Approved Value</p>
            <p className="text-xl font-bold">{formatCurrency(data.averageApprovedValue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart
            data={data.trend.map((row) => ({ month: formatDate(row.period), total: row.total }))}
          />
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportTable
            columns={[
              { key: "status", header: "Status" },
              { key: "count", header: "Quotations", align: "right" },
              {
                key: "total",
                header: "Total",
                align: "right",
                render: (r: { status: string; count: number; total: number }) => formatCurrency(r.total),
              },
            ]}
            rows={data.statusBreakdown}
          />
        </CardContent>
      </Card>
    </div>
  );
}
