import type { ActionFunctionArgs } from "react-router";
import { unauthenticated } from "../shopify.server";
import {
  ORDER_GID,
  authenticateCheckout,
  checkoutPreflightLoader,
  readJsonBody,
} from "../lib/checkout-request.server";
import { getAttentiveSubscriptions } from "../lib/attentive.server";
import { toSubscriberState } from "../lib/subscriber-status.server";

const SUBSCRIBER_STATUS_QUERY = `#graphql
  query PpSubscriberStatus($id: ID!) {
    order(id: $id) {
      customer {
        defaultEmailAddress {
          emailAddress
          marketingState
        }
        defaultPhoneNumber {
          phoneNumber
          smsMarketingConsent {
            state
          }
        }
      }
    }
  }`;

export const loader = checkoutPreflightLoader;

/**
 * POST /api/status — called by the thank-you extension for variant orders.
 * Body: { orderId: "gid://shopify/Order/123" }
 * A channel counts as subscribed if Shopify consent OR Attentive says so.
 * Returns only the subscriber state, never the customer's email or phone.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, cors } = await authenticateCheckout(request);

  const { orderId } = await readJsonBody(request);
  if (typeof orderId !== "string" || !ORDER_GID.test(orderId)) {
    return cors(Response.json({ error: "Invalid orderId" }, { status: 400 }));
  }

  const { admin } = await unauthenticated.admin(shop);
  const response = await admin.graphql(SUBSCRIBER_STATUS_QUERY, {
    variables: { id: orderId },
  });
  const { data } = await response.json();
  const order = data?.order;

  if (!order) {
    return cors(Response.json({ error: "Order not found" }, { status: 404 }));
  }

  const email = order.customer?.defaultEmailAddress;
  const phone = order.customer?.defaultPhoneNumber;
  const attentive = await getAttentiveSubscriptions({
    email: email?.emailAddress,
    phone: phone?.phoneNumber,
  });

  const state = toSubscriberState({
    email: isOptedIn(email?.marketingState) || attentive.email,
    sms: isOptedIn(phone?.smsMarketingConsent?.state) || attentive.sms,
  });

  return cors(Response.json({ state }));
};

// PENDING = opted in but awaiting confirmation (e.g. checkout opt-in). The
// test brief counts anyone who opted in at checkout as subscribed.
function isOptedIn(state: string | null | undefined) {
  return state === "SUBSCRIBED" || state === "PENDING";
}
