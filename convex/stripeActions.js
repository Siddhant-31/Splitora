"use node";
// Stripe's SDK needs Node APIs, so this file opts out of Convex's default
// (faster, but browser-like) action runtime. See convex/payments.js for the
// database side of this flow, and convex/http.js for the webhook route.

import { v } from "convex/values";
import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe isn't configured yet — set STRIPE_SECRET_KEY with `npx convex env set STRIPE_SECRET_KEY sk_test_...`"
    );
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
}

/**
 * Called from the browser when someone clicks "Pay now with card".
 * Creates a `pendingPayments` row, then a Stripe Checkout session that
 * carries that row's id in its metadata — that's the thread the webhook
 * later pulls to know which settlement to create.
 */
export const createCheckoutSession = action({
  args: {
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();

    const pendingPaymentId = await ctx.runMutation(
      internal.payments.createPendingPayment,
      args
    );

    const receiver = await ctx.runQuery(internal.payments.getUserById, {
      userId: args.receivedByUserId,
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const paymentMethodTypes = (
      process.env.STRIPE_PAYMENT_METHOD_TYPES || "card"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(args.amount * 100),
            product_data: {
              name: receiver ? `Settle up with ${receiver.name}` : "Settle up",
              description: args.note || undefined,
            },
          },
          quantity: 1,
        },
      ],
      // This is how the webhook finds its way back to the right row — Stripe
      // hands this metadata back verbatim on the completed-session event.
      metadata: { pendingPaymentId },
      success_url: `${appUrl}/settlements/success?status=success`,
      cancel_url: `${appUrl}/settlements/success?status=cancelled`,
    });

    await ctx.runMutation(internal.payments.attachStripeSession, {
      pendingPaymentId,
      stripeSessionId: session.id,
    });

    return { url: session.url };
  },
});

/**
 * Called only from convex/http.js, after the raw request body and signature
 * have been pulled off the incoming HTTP request. Verifying the signature
 * here (not in the browser, not trusted from the client) is what makes this
 * a real webhook integration rather than a client telling us "trust me, I paid".
 */
export const verifyAndProcessWebhook = internalAction({
  args: { body: v.string(), signature: v.string() },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET is not set — set it with `npx convex env set`"
      );
    }

    // Throws if the signature doesn't match — that's what proves this
    // request really came from Stripe and wasn't forged by a client.
    const event = stripe.webhooks.constructEvent(
      args.body,
      args.signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const alreadyHandled = await ctx.runQuery(
      internal.payments.wasEventProcessed,
      { stripeEventId: event.id }
    );
    if (alreadyHandled) {
      return { received: true, duplicate: true };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const pendingPaymentId = session.metadata?.pendingPaymentId;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? session.id);

      if (pendingPaymentId) {
        await ctx.runMutation(internal.payments.completePendingPayment, {
          pendingPaymentId,
          stripePaymentIntentId: paymentIntentId,
        });
      }
    }

    await ctx.runMutation(internal.payments.markEventProcessed, {
      stripeEventId: event.id,
    });

    return { received: true };
  },
});
