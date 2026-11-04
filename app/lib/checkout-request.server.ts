import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * The thank-you page sends `gid://shopify/OrderIdentity/<id>`; the Admin API
 * order is `gid://shopify/Order/<same id>`. Accepts either and returns the
 * Admin API GID, or null for anything else.
 */
export function toOrderGid(value: unknown): string | null {
  const match =
    typeof value === "string" &&
    /^gid:\/\/shopify\/(?:Order|OrderIdentity)\/(\d+)$/.exec(value);
  if (match) return `gid://shopify/Order/${match[1]}`;

  console.warn("Rejected orderId", JSON.stringify(value)?.slice(0, 100));
  return null;
}

/**
 * Verifies the checkout session token and returns the shop domain plus the
 * CORS wrapper. Also answers the CORS preflight (it throws a 204 for OPTIONS).
 */
export async function authenticateCheckout(request: Request) {
  const { sessionToken, cors } = await authenticate.public.checkout(request);
  const { dest } = sessionToken;
  const shop = new URL(dest.startsWith("http") ? dest : `https://${dest}`)
    .hostname;

  return { shop, cors };
}

/**
 * React Router sends OPTIONS (the CORS preflight) to the loader, not the
 * action, so every checkout route exports this as its loader.
 */
export const checkoutPreflightLoader = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticateCheckout(request);
  return new Response(null, { status: 405 });
};

export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" ? body : {};
}
