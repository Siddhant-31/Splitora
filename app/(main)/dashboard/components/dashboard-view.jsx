"use client";

import Link from "next/link";
import { PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { greeting } from "@/lib/format";
import { BalanceHero } from "./balance-hero";
import { ExpenseSummary } from "./expense-summary";
import { BalanceSummary } from "./balance-summary";
import { GroupList } from "./group-list";
import { Panel } from "./panel";

export function DashboardView({
  firstName,
  balances,
  groups,
  totalSpent,
  monthlySpending,
}) {
  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-slate-500">
            Here's where your shared expenses stand.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full px-6">
          <Link href="/expenses/new">
            <PlusCircle />
            Add expense
          </Link>
        </Button>
      </div>

      <BalanceHero balances={balances} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ExpenseSummary
          monthlySpending={monthlySpending}
          totalSpent={totalSpent}
        />

        <div className="space-y-6">
          <Panel title="Balance details" href="/contacts">
            <BalanceSummary balances={balances} />
          </Panel>

          <Panel title="Your groups" href="/contacts">
            <GroupList groups={groups} />
            <Button
              variant="outline"
              asChild
              className="mt-5 w-full rounded-full"
            >
              <Link href="/contacts?createGroup=true">
                <Users />
                New group
              </Link>
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
