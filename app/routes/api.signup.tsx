import type { ActionFunctionArgs } from "react-router";
import {
  ORDER_GID,
  authenticateCheckout,
  checkoutPreflightLoader,
  readJsonBody,
} from "../lib/checkout-request.server";
import {
  type Channel,
  isAttentiveConfigured,
  subscribe,
} from "../lib/attentive.server";
import { normalizeEmail, normalizePhone } from "../lib/contact.server";
import { recordEvent } from "../lib/events.server";

export const loader = checkoutPreflightLoader;

/**
 * POST /api/signup — thank-you signup form (variant orders).
 * Body: { orderId, email?, phone? } — each field present subscribes that
 * channel through its dedicated Attentive sign-up unit.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, cors } = await authenticateCheckout(request);
  const fail = (error: string, status: number) =>
    cors(Response.json({ error }, { status }));

  if (!isAttentiveConfigured()) return fail("not_configured", 503);

  const body = await readJsonBody(request);
  const { orderId } = body;
  if (typeof orderId !== "string" || !ORDER_GID.test(orderId)) {
    return fail("invalid_order", 400);
  }

  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = rawEmail ? normalizeEmail(rawEmail) : null;
  const phone = rawPhone ? normalizePhone(rawPhone) : null;

  if (rawEmail && !email) return fail("invalid_email", 400);
  if (rawPhone && !phone) return fail("invalid_phone", 400);
  if (!email && !phone) return fail("missing_contact", 400);

  const signups: [Channel, { email: string } | { phone: string }][] = [];
  if (email) signups.push(["email", { email }]);
  if (phone) signups.push(["sms", { phone }]);

  const results = await Promise.allSettled(
    signups.map(([channel, user]) => subscribe(channel, user)),
  );

  let failed = false;
  for (const [index, result] of results.entries()) {
    const channel = signups[index][0];
    if (result.status === "fulfilled") {
      await recordEvent(shop, orderId, "signup", channel);
    } else {
      failed = true;
      console.error(result.reason);
    }
  }

  if (failed) return fail("signup_failed", 502);
  return cors(Response.json({ ok: true }));
};
