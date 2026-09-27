import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" }),

  // Expenses
  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"), // Reference to users table
    splitType: v.string(), // "equal", "percentage", "exact"
    splits: v.array(
      v.object({
        userId: v.id("users"), // Reference to users table
        amount: v.number(), // amount owed by this user
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")), // null for one-on-one expenses
    createdBy: v.id("users"), // Reference to users table
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_date", ["date"]),

  // Settlements
  settlements: defineTable({
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"), // Reference to users table
    receivedByUserId: v.id("users"), // Reference to users table
    groupId: v.optional(v.id("groups")), // null for one-on-one settlements
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))), // Which expenses this settlement covers
    createdBy: v.id("users"), // Reference to users table
    method: v.optional(v.string()), // "manual" | "stripe" — how this settlement was recorded
    status: v.optional(v.string()), // "completed" (manual settlements are always final on insert)
    stripePaymentIntentId: v.optional(v.string()), // set only for real Stripe payments; doubles as the idempotency key
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_receiver_and_group", ["receivedByUserId", "groupId"])
    .index("by_date", ["date"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"]),

  // A real payment that's been *started* via Stripe Checkout but not yet confirmed.
  // A row here does NOT mean money moved — only the webhook, once it verifies the
  // payment succeeded, turns this into a real `settlements` row.
  pendingPayments: defineTable({
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    status: v.string(), // "pending" | "completed"
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_stripe_session", ["stripeSessionId"]),

  // Every Stripe webhook event we've successfully handled, keyed by Stripe's own
  // event id. Stripe redelivers events on retry/timeout, so this is what stops
  // the same payment from ever being recorded twice.
  webhookEvents: defineTable({
    stripeEventId: v.string(),
    processedAt: v.number(),
  }).index("by_event_id", ["stripeEventId"]),

  // Groups
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"), // Reference to users table
    members: v.array(
      v.object({
        userId: v.id("users"), // Reference to users table
        role: v.string(), // "admin" or "member"
        joinedAt: v.number(),
      })
    ),
  }),
});
