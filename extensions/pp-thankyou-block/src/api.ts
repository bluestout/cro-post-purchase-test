import {BACKEND_URL} from './config';

export type SubscriberState = 'none' | 'email_only' | 'sms_only' | 'both';

/** Asks the backend which block to show. Returns null on any failure. */
export async function fetchSubscriberState(
  orderId: string,
): Promise<SubscriberState | null> {
  try {
    const token = await shopify.sessionToken.get();
    const response = await fetch(`${BACKEND_URL}/api/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({orderId}),
    });
    if (!response.ok) return null;

    const {state} = await response.json();
    return state ?? null;
  } catch {
    return null;
  }
}
