"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { formatCurrency } from "@/lib/format";

export function RevenueChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.6} />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="currentColor"
          opacity={0.6}
          tickFormatter={(v) => formatCurrency(v).replace(".00", "")}
          width={80}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value ?? 0))}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(148,163,184,0.3)",
            backgroundColor: "var(--card)",
            color: "var(--card-foreground)",
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#F97316"
          strokeWidth={2.5}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
