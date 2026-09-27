"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettlementResultPage() {
  const params = useSearchParams();
  const cancelled = params.get("status") === "cancelled";

  return (
    <div className="container mx-auto max-w-md py-20 text-center">
      {cancelled ? (
        <>
          <XCircle className="mx-auto h-14 w-14 text-rose-500" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            Payment cancelled
          </h1>
          <p className="mt-2 text-slate-500">
            No charge was made. You can try again or record the settlement
            manually instead.
          </p>
        </>
      ) : (
        <>
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
            Payment received
          </h1>
          <p className="mt-2 text-slate-500">
            Stripe is confirming the payment with our server now. Your
            balance updates on its own within a few seconds — no need to
            refresh.
          </p>
        </>
      )}

      <Button asChild className="mt-6 rounded-full">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
