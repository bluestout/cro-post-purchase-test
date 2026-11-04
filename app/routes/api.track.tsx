import type { ActionFunctionArgs } from "react-router";
import {
  authenticateCheckout,
  checkoutPreflightLoader,
  readJsonBody,
  toOrderGid,
} from "../lib/checkout-request.server";
import { type EventType, recordEvent } from "../lib/events.server";

const TRACKED_TYPES = new Set<EventType>(["impression", "social_click"]);
const DETAIL = /^[a-z_]{1,32}$/;

export const loader = checkoutPreflightLoader;

/**
 * POST /api/track — thank-you block impressions and social clicks.
 * Body: { orderId, type: "impression" | "social_click", detail }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, cors } = await authenticateCheckout(request);

  const body = await readJsonBody(request);
  const orderId = toOrderGid(body.orderId);
  const { type, detail } = body;
  if (
    !orderId ||
    !TRACKED_TYPES.has(type as EventType) ||
    typeof detail !== "string" ||
    !DETAIL.test(detail)
  ) {
    return cors(Response.json({ error: "Invalid event" }, { status: 400 }));
  }

  await recordEvent(shop, orderId, type as EventType, detail);
  return cors(new Response(null, { status: 204 }));
};
