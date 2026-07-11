"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import type { Role } from "@/types";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface FormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserSummary | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(user);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: { name: "", email: "", password: "", role: "STAFF" },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        password: "",
        role: user?.role ?? "STAFF",
      });
    }
  }, [open, user, reset]);

  const role = watch("role");

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? apiFetch(`/api/users/${user!.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: values.name,
              role: values.role,
              ...(values.password ? { password: values.password } : {}),
            }),
          })
        : apiFetch("/api/users", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success(isEdit ? "User updated" : "User created");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "New User"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update user details and role." : "Create a new team member account."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" disabled={isEdit} {...register("email", { required: true })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{isEdit ? "New Password (optional)" : "Password *"}</Label>
            <Input id="password" type="password" {...register("password")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setValue("role", v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
