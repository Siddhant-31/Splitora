"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";

function people(n) {
  return `${n} ${n === 1 ? "person" : "people"}`;
}

export function BalanceHero({ balances }) {
  const owed = balances?.youAreOwed ?? 0;
  const owe = balances?.youOwe ?? 0;
  const net = balances?.totalBalance ?? 0;
  const owedCount = balances?.oweDetails?.youAreOwedBy?.length ?? 0;
  const oweCount = balances?.oweDetails?.youOwe?.length ?? 0;
  const hasAny = owed > 0 || owe > 0;

  // The one animated moment on the page: the bar opens as an even split,
  // then settles on the real ratio between what you're owed and what you owe.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSettled(true), 120);
    return () => clearTimeout(id);
  }, []);

  const total = owed + owe;
  const owedShare = total > 0 ? owed / total : 0.5;
  const oweShare = total > 0 ? owe / total : 0.5;

  const sign = net > 0 ? "+" : net < 0 ? "\u2212" : "";
  const headline = `${sign}${money(Math.abs(net))}`;
  const status =
    net > 0
      ? "You're owed money overall"
      : net < 0
        ? "You owe money overall"
        : "You're all settled up";

  return (
    <section
      aria-label="Balance overview"
      className="rounded-3xl bg-ink px-6 py-7 text-white sm:px-10 sm:py-10"
    >
      <p className="text-sm text-white/70">Your balance</p>
      <p className="mt-1 font-display text-5xl font-semibold tracking-tight tabular-nums sm:text-7xl">
        {headline}
      </p>
      <p className="mt-2 text-base text-white/75">{status}</p>

      <div className="mt-9">
        {hasAny ? (
          <div
            className="flex h-4 gap-1.5"
            role="img"
            aria-label={`Owed to you ${money(owed)}. You owe ${money(owe)}.`}
          >
            {owed > 0 && (
              <div
                className="min-w-3 rounded-full bg-mint transition-[flex-grow] duration-1000 ease-out motion-reduce:transition-none"
                style={{ flexGrow: settled ? owedShare : 0.5, flexBasis: 0 }}
              />
            )}
            {owe > 0 && (
              <div
                className="min-w-3 rounded-full bg-coral transition-[flex-grow] duration-1000 ease-out motion-reduce:transition-none"
                style={{ flexGrow: settled ? oweShare : 0.5, flexBasis: 0 }}
              />
            )}
          </div>
        ) : (
          <div className="h-4 rounded-full border border-dashed border-white/25" />
        )}

        <div className="mt-5 flex items-start justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm text-white/70">
              <span className="h-2 w-2 rounded-full bg-mint" />
              Owed to you
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {money(owed)}
            </p>
            <p className="text-sm text-white/60">
              {owedCount > 0 ? `from ${people(owedCount)}` : "No one owes you yet"}
            </p>
          </div>

          <div className="text-right">
            <p className="flex items-center justify-end gap-2 text-sm text-white/70">
              You owe
              <span className="h-2 w-2 rounded-full bg-coral" />
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {money(owe)}
            </p>
            <p className="text-sm text-white/60">
              {oweCount > 0 ? `to ${people(oweCount)}` : "You don't owe anyone"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
