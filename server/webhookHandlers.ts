import { getStripeClient } from "./stripeClient.js";
import { db } from "./db.js";
import { subscriptions } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        await db
          .insert(subscriptions)
          .values({
            userId,
            stripeCustomerId: sub.customer,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items?.data?.[0]?.price?.id ?? null,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items?.data?.[0]?.price?.id ?? null,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
              updatedAt: new Date(),
            },
          });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        await db
          .update(subscriptions)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));
        break;
      }

      default:
        // Unhandled event types are fine — just ignore them
        break;
    }
  }
}
