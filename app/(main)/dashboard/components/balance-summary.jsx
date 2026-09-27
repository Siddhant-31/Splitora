import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { money } from "@/lib/format";

function PersonRow({ item, owedToYou }) {
  return (
    <Link
      href={`/person/${item.userId}`}
      className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-mist focus-visible:outline-2 focus-visible:outline-brand"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={item.imageUrl} />
          <AvatarFallback className="bg-lilac font-medium text-brand">
            {item.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-ink">
          {item.name}
        </span>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
          owedToYou ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
        }`}
      >
        {owedToYou ? "+" : "\u2212"}
        {money(item.amount)}
      </span>
    </Link>
  );
}

export function BalanceSummary({ balances }) {
  if (!balances) return null;

  const { oweDetails } = balances;
  const hasOwed = oweDetails.youAreOwedBy.length > 0;
  const hasOwing = oweDetails.youOwe.length > 0;

  if (!hasOwed && !hasOwing) {
    return (
      <div className="rounded-xl bg-mist px-4 py-8 text-center">
        <p className="font-medium text-ink">You're all settled up</p>
        <p className="mt-1 text-sm text-slate-500">
          Balances with your friends will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasOwed && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">
            Owed to you
          </h3>
          <div>
            {oweDetails.youAreOwedBy.map((item) => (
              <PersonRow key={item.userId} item={item} owedToYou />
            ))}
          </div>
        </div>
      )}

      {hasOwing && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-500">You owe</h3>
          <div>
            {oweDetails.youOwe.map((item) => (
              <PersonRow key={item.userId} item={item} owedToYou={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
