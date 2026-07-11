"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customerSchema, type CustomerInput } from "@/lib/validations/customer";
import { apiFetch } from "@/lib/api-client";
import type { CustomerSummary } from "@/types";

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerSummary | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(customer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", companyName: "", phone: "", email: "", address: "" },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: customer?.name ?? "",
        companyName: customer?.companyName ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
        address: customer?.address ?? "",
      });
    }
  }, [open, customer, reset]);

  const mutation = useMutation({
    mutationFn: (values: CustomerInput) =>
      isEdit
        ? apiFetch(`/api/customers/${customer!.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          })
        : apiFetch("/api/customers", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success(isEdit ? "Customer updated" : "Customer created");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Customer" : "New Customer"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update customer details." : "Add a new customer to the system."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Customer Name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register("companyName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register("address")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
