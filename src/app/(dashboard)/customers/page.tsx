"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { apiFetch } from "@/lib/api-client";
import type { CustomerSummary } from "@/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export default function CustomersPage() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<CustomerSummary | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch],
    queryFn: () =>
      apiFetch<{ customers: CustomerSummary[] }>(
        `/api/customers${debouncedSearch ? `?q=${encodeURIComponent(debouncedSearch)}` : ""}`
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openCreate = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const openEdit = (customer: CustomerSummary) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer profiles and view their quotation history.
          </p>
        </div>
        <Button variant="brand" onClick={openCreate}>
          <Plus /> New Customer
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Quotations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
              {data?.customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.companyName || "—"}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.email || "—"}</TableCell>
                  <TableCell>{customer._count?.quotations ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/customers/${customer.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete customer "${customer.name}"?`)) {
                            deleteMutation.mutate(customer.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
      />
    </div>
  );
}
