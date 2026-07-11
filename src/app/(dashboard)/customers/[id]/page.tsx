"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Mail, MapPin, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { CustomerDetail } from "@/types";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["customer", params.id],
    queryFn: () => apiFetch<{ customer: CustomerDetail }>(`/api/customers/${params.id}`),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!data) return <p className="text-muted-foreground">Customer not found.</p>;

  const { customer } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.companyName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="size-5 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="size-5 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{customer.email || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="size-5 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium">{customer.address || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4" /> Quotation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation No.</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.quotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No quotations yet.
                  </TableCell>
                </TableRow>
              )}
              {customer.quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    <Link href={`/quotations/${q.id}`} className="text-secondary hover:underline">
                      {q.quotationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{q.projectName}</TableCell>
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
