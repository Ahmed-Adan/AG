import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart3,
  UserCog,
} from "lucide-react";
import type { Role } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quotations", label: "Quotations", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
  { href: "/users", label: "Users", icon: UserCog, roles: ["ADMIN"] },
];
