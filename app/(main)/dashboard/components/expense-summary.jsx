"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { Panel } from "./panel";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function ExpenseSummary({ monthlySpending, totalSpent }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const chartData =
    monthlySpending?.map((item) => {
      const date = new Date(item.month);
      return {
        name: MONTHS[date.getMonth()],
        month: date.getMonth(),
        amount: item.total,
      };
    }) || [];

  const hasSpending = chartData.some((d) => d.amount > 0);
  const monthTotal = monthlySpending?.[currentMonth]?.total ?? 0;

  return (
    <Panel
      fill
      title={`Spending in ${currentYear}`}
      description="Your share of every expense, month by month"
    >
      <div className="flex flex-wrap gap-x-12 gap-y-4">
        <div>
          <p className="text-sm text-slate-500">This month</p>
          <p className="font-display text-3xl font-semibold tabular-nums text-ink">
            {money(monthTotal)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">This year</p>
          <p className="font-display text-3xl font-semibold tabular-nums text-ink">
            {money(totalSpent)}
          </p>
        </div>
      </div>

      <div className="relative mt-6 min-h-64 flex-1">
        <div className="absolute inset-0">
        {hasSpending ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ECEAF7" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
                width={52}
              />
              <Tooltip
                cursor={{ fill: "rgba(91,75,219,0.07)" }}
                formatter={(value) => [money(value), "Your share"]}
                labelFormatter={(label) => `${label} ${currentYear}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #DED9FB",
                  boxShadow: "none",
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={36}>
                {chartData.map((d) => (
                  <Cell
                    key={d.month}
                    fill={d.month === currentMonth ? "#5B4BDB" : "#DED9FB"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-mist px-6 text-center">
            <p className="font-medium text-ink">No spending recorded yet</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Add your first expense and your monthly totals will show up here.
            </p>
            <Button asChild size="sm" className="mt-4 rounded-full">
              <Link href="/expenses/new">
                <PlusCircle />
                Add expense
              </Link>
            </Button>
          </div>
        )}
        </div>
      </div>
    </Panel>
  );
}
