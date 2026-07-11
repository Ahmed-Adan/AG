"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import type { Role } from "@/lib/permissions";

export function Sidebar({ role, className }: { role: Role; className?: string }) {
  const pathname = usePathname();
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: { logoUrl: string | null } }>("/api/settings"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <aside
      className={cn(
        "glass-card flex h-full w-64 flex-col gap-1 p-4",
        className
      )}
    >
      <Link href="/dashboard" className="mb-4 flex items-center gap-3 px-2">
        <Image
          src={data?.settings.logoUrl || "/logo.jpg"}
          alt="Alhatimi Glass and Glazing"
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <div className="leading-tight">
          <p className="text-sm font-bold text-primary dark:text-white">Alhatimi</p>
          <p className="text-[11px] text-muted-foreground">Glass &amp; Glazing</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(
          (item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          }
        )}
      </nav>
    </aside>
  );
}
