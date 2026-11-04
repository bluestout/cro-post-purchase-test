import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const ORDER_GID = /^gid:\/\/shopify\/Order\/\d+$/;

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
