"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog, type UserSummary } from "@/components/users/user-form-dialog";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

export default function UsersPage() {
  const { data: authSession } = useSession();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserSummary | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<{ users: UserSummary[] }>("/api/users"),
    enabled: authSession?.user.role === "ADMIN",
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (authSession && authSession.user.role !== "ADMIN") {
    return <p className="text-muted-foreground">You do not have access to User Management.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage team accounts and role-based access.
          </p>
        </div>
        <Button
          variant="brand"
          onClick={() => {
            setEditingUser(null);
            setDialogOpen(true);
          }}
        >
          <Plus /> New User
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader />
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
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
              {data?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role.toLowerCase()}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "approved" : "draft"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingUser(user);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={user.id === authSession?.user.id}
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })
                        }
                      >
                        {user.isActive ? (
                          <UserX className="size-4 text-destructive" />
                        ) : (
                          <UserCheck className="size-4 text-status-approved" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </div>
  );
}
