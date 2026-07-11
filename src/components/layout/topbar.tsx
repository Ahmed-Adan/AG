"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { Menu, Moon, Sun, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Role } from "@/lib/permissions";

function useMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({
  name,
  role,
  onMenuClick,
}: {
  name: string;
  role: Role;
  onMenuClick: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="glass-panel sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu />
        </Button>
        <div>
          <p className="text-sm font-semibold">Quotation Management</p>
          <p className="text-xs text-muted-foreground">Alhatimi Glass and Glazing</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback>{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{name}</span>
                <span className="text-xs font-normal text-muted-foreground capitalize">
                  {role.toLowerCase()}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
