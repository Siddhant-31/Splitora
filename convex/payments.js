import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/* ============================================================================
 *  These are all `internal*` — the browser can never call them directly.
 *  The only way in is through the `createCheckoutSession` action
 *  (convex/stripeActions.js) and the Stripe webhook, which is the whole point:
 *  a settlement created this way can only ever be the result of a real,
 *  Stripe-confirmed payment.
 * ========================================================================= */

// Start a pending payment. Called from the Stripe action BEFORE the Checkout
// session is created, so we have something to attach the session id to.
export const createPendingPayment = internalMutation({
  args: {
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.runQuery(internal.users.getCurrentUser);

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.paidByUserId === args.receivedByUserId) {
      throw new Error("Payer and receiver cannot be the same user");
    }
    // Unlike a manual settlement, a card payment can only be started by the
    // person whose card is actually being charged.
    if (caller._id !== args.paidByUserId) {
      throw new Error("Only the payer can start a card payment");
    }

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");
      const isMember = (uid) => group.members.some((m) => m.userId === uid);
      if (!isMember(args.paidByUserId) || !isMember(args.receivedByUserId)) {
        throw new Error("Both parties must be members of the group");
      }
    }

    return await ctx.db.insert("pendingPayments", {
      amount: args.amount,
      note: args.note,
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      status: "pending",
      createdBy: caller._id,
    });
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

export const attachStripeSession = internalMutation({
  args: {
    pendingPaymentId: v.id("pendingPayments"),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pendingPaymentId, {
      stripeSessionId: args.stripeSessionId,
    });
  },
});

// Called ONLY from the webhook handler, after Stripe's signature has been
// verified. This is where "mark as paid" becomes a real settlement row —
// and it's written to be safe if Stripe redelivers the same event.
export const completePendingPayment = internalMutation({
  args: {
    pendingPaymentId: v.id("pendingPayments"),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Idempotency guard #1: this exact payment already produced a settlement.
    const existingSettlement = await ctx.db
      .query("settlements")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .first();
    if (existingSettlement) return existingSettlement._id;

    const pending = await ctx.db.get(args.pendingPaymentId);
    if (!pending) throw new Error("Pending payment not found");

    // Idempotency guard #2: this pending payment was already completed
    // (covers a race between two near-simultaneous webhook deliveries).
    if (pending.status === "completed") return null;

    const settlementId = await ctx.db.insert("settlements", {
      amount: pending.amount,
      note: pending.note,
      date: Date.now(),
      paidByUserId: pending.paidByUserId,
      receivedByUserId: pending.receivedByUserId,
      groupId: pending.groupId,
      createdBy: pending.createdBy,
      method: "stripe",
      status: "completed",
      stripePaymentIntentId: args.stripePaymentIntentId,
    });

    await ctx.db.patch(args.pendingPaymentId, {
      status: "completed",
      stripePaymentIntentId: args.stripePaymentIntentId,
    });

    return settlementId;
  },
});

// ---- Webhook-event-level idempotency (separate from the payment-level guard
// above: this stops us from even re-running the handler for a duplicate
// delivery of the same Stripe event). ----

export const wasEventProcessed = internalQuery({
  args: { stripeEventId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();
    return !!existing;
  },
});

export const markEventProcessed = internalMutation({
  args: { stripeEventId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      stripeEventId: args.stripeEventId,
      processedAt: Date.now(),
    });
  },
});
