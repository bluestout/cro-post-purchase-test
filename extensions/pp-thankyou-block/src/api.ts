import {BACKEND_URL} from './config';

export type SubscriberState = 'none' | 'email_only' | 'sms_only' | 'both';

async function post(path: string, body: object): Promise<Response> {
  const token = await shopify.sessionToken.get();
  return fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/** Asks the backend which block to show. Returns null on any failure. */
export async function fetchSubscriberState(
  orderId: string,
): Promise<SubscriberState | null> {
  try {
    const response = await post('/api/status', {orderId});
    if (!response.ok) return null;

    const {state} = await response.json();
    return state ?? null;
  } catch {
    return null;
  }
}

/** Returns null on success, otherwise the backend's error code. */
export async function signup(
  orderId: string,
  contact: {email?: string; phone?: string},
): Promise<string | null> {
  try {
    const response = await post('/api/signup', {orderId, ...contact});
    if (response.ok) return null;

    const {error} = await response.json().catch(() => ({}));
    return error ?? 'generic';
  } catch {
    return 'generic';
  }
}

/** Fire-and-forget event for reporting; failures are ignored. */
export function track(
  orderId: string,
  type: 'impression' | 'social_click',
  detail: string,
) {
  post('/api/track', {orderId, type, detail}).catch(() => {});
}
