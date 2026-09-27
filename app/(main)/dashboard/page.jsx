"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { useUser } from "@clerk/nextjs";
import { BarLoader } from "react-spinners";
import { DashboardView } from "./components/dashboard-view";

export default function Dashboard() {
  const { user } = useUser();

  const { data: balances, isLoading: balancesLoading } = useConvexQuery(
    api.dashboard.getUserBalances
  );

  const { data: groups, isLoading: groupsLoading } = useConvexQuery(
    api.dashboard.getUserGroups
  );

  const { data: totalSpent, isLoading: totalSpentLoading } = useConvexQuery(
    api.dashboard.getTotalSpent
  );

  const { data: monthlySpending, isLoading: monthlySpendingLoading } =
    useConvexQuery(api.dashboard.getMonthlySpending);

  const isLoading =
    balancesLoading ||
    groupsLoading ||
    totalSpentLoading ||
    monthlySpendingLoading;

  if (isLoading) {
    return (
      <div className="w-full py-12 flex justify-center">
        <BarLoader width={"100%"} color="#5B4BDB" />
      </div>
    );
  }

  return (
    <DashboardView
      firstName={user?.firstName}
      balances={balances}
      groups={groups}
      totalSpent={totalSpent}
      monthlySpending={monthlySpending}
    />
  );
}
