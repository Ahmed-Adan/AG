"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { apiFetch } from "@/lib/api-client";
import type { CustomerSummary } from "@/types";

export function CustomerSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (customerId: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { data, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiFetch<{ customers: CustomerSummary[] }>("/api/customers"),
  });

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select a customer" />
        </SelectTrigger>
        <SelectContent>
          {data?.customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name}
              {customer.companyName ? ` — ${customer.companyName}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" size="icon" onClick={() => setDialogOpen(true)}>
        <Plus className="size-4" />
      </Button>
      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) refetch();
        }}
      />
    </div>
  );
}
