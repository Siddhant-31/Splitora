import Link from "next/link";
import { money } from "@/lib/format";

const TILES = [
  "bg-lilac text-brand",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-700",
];

function tileFor(name = "") {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return TILES[sum % TILES.length];
}

export function GroupList({ groups }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="rounded-xl bg-mist px-4 py-8 text-center">
        <p className="font-medium text-ink">No groups yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Create a group to start tracking shared expenses.
        </p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group) => {
        const balance = group.balance || 0;
        const memberCount = group.members.length;

        return (
          <Link
            href={`/groups/${group.id}`}
            key={group.id}
            className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-mist focus-visible:outline-2 focus-visible:outline-brand"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-semibold ${tileFor(group.name)}`}
              >
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {group.name}
                </p>
                <p className="text-xs text-slate-500">
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </p>
              </div>
            </div>

            {balance !== 0 && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
                  balance > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {balance > 0 ? "+" : "\u2212"}
                {money(Math.abs(balance))}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
