import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Stripe posts here directly — this is a raw HTTP endpoint, not a Convex
// query/mutation/action called from the browser. The URL is:
//   <your Convex deployment's HTTP Actions URL>/webhooks/stripe
// (printed by `npx convex dev`, or under Settings in the Convex dashboard).
http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Signature verification needs the exact raw bytes Stripe sent, so this
    // reads the body as text rather than parsing it as JSON first.
    const body = await request.text();

    try {
      await ctx.runAction(internal.stripeActions.verifyAndProcessWebhook, {
        body,
        signature,
      });
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Stripe webhook error:", err.message);
      // A non-2xx tells Stripe to retry — appropriate for a transient error,
      // and harmless for a bad signature since a forged request should never
      // succeed regardless of how many times it's retried.
      return new Response(`Webhook error: ${err.message}`, { status: 400 });
    }
  }),
});

export default http;
