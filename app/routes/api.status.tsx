import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate, unauthenticated } from "../shopify.server";
import { toSubscriberState } from "../lib/subscriber-status.server";

const ORDER_GID = /^gid:\/\/shopify\/Order\/\d+$/;

const SUBSCRIBER_STATUS_QUERY = `#graphql
  query PpSubscriberStatus($id: ID!) {
    order(id: $id) {
      customer {
        defaultEmailAddress {
          marketingState
        }
        defaultPhoneNumber {
          smsMarketingConsent {
            state
          }
        }
      }
    }
  }`;

/**
 * React Router sends OPTIONS (the CORS preflight) to the loader, not the
 * action. The auth helper answers it with 204 + CORS headers.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.checkout(request);
  return new Response(null, { status: 405 });
};

/**
 * POST /api/status — called by the thank-you extension for variant orders.
 * Body: { orderId: "gid://shopify/Order/123" }
 * Returns only the subscriber state, never the customer's email or phone.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // Verifies the checkout session token; also answers the CORS preflight.
  const { sessionToken, cors } = await authenticate.public.checkout(request);

  const body = await request.json().catch(() => null);
  const orderId: unknown = body?.orderId;
  if (typeof orderId !== "string" || !ORDER_GID.test(orderId)) {
    return cors(Response.json({ error: "Invalid orderId" }, { status: 400 }));
  }

  const shop = new URL(
    sessionToken.dest.startsWith("http")
      ? sessionToken.dest
      : `https://${sessionToken.dest}`,
  ).hostname;
  const { admin } = await unauthenticated.admin(shop);

  const response = await admin.graphql(SUBSCRIBER_STATUS_QUERY, {
    variables: { id: orderId },
  });
  const { data } = await response.json();
  const order = data?.order;

  if (!order) {
    return cors(Response.json({ error: "Order not found" }, { status: 404 }));
  }

  const state = toSubscriberState(
    order.customer?.defaultEmailAddress?.marketingState,
    order.customer?.defaultPhoneNumber?.smsMarketingConsent?.state,
  );

  return cors(Response.json({ state }));
};
