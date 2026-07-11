"use client";

import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/permissions";

export function DashboardShell({
  name,
  role,
  children,
}: {
  name: string;
  role: Role;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar role={role} className="fixed inset-y-4 left-4 hidden lg:flex" />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar role={role} className="relative z-50 m-4 flex" />
        </div>
      )}

      <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col lg:pl-72")}>
        <Topbar name={name} role={role} onMenuClick={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
