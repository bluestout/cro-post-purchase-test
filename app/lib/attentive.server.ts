/**
 * Attentive Subscribers API (https://docs.attentive.com/reference/subscribers.md)
 *
 * Env:
 *   ATTENTIVE_API_KEY                  bearer token (subscriptions:read + subscriptions:write)
 *   ATTENTIVE_EMAIL_SIGN_UP_SOURCE_ID  dedicated API sign-up unit for thank-you email signups
 *   ATTENTIVE_SMS_SIGN_UP_SOURCE_ID    dedicated API sign-up unit for thank-you SMS signups
 *
 * Without ATTENTIVE_API_KEY, lookups report "not subscribed" (Shopify consent
 * alone decides) and signups are rejected as not configured.
 */
const SUBSCRIPTIONS_URL = "https://api.attentivemobile.com/v1/subscriptions";

export type Channel = "email" | "sms";

export function isAttentiveConfigured() {
  return Boolean(process.env.ATTENTIVE_API_KEY);
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.ATTENTIVE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Is this email/phone subscribed to marketing on each channel in Attentive? */
export async function getAttentiveSubscriptions({
  email,
  phone,
}: {
  email?: string | null;
  phone?: string | null;
}): Promise<{ email: boolean; sms: boolean }> {
  if (!isAttentiveConfigured()) return { email: false, sms: false };

  const [emailSubscribed, smsSubscribed] = await Promise.all([
    email ? isMarketingEligible({ email }, "EMAIL") : false,
    phone ? isMarketingEligible({ phone }, "TEXT") : false,
  ]);

  return { email: emailSubscribed, sms: smsSubscribed };
}

async function isMarketingEligible(
  query: { email: string } | { phone: string },
  channel: "EMAIL" | "TEXT",
): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUBSCRIPTIONS_URL}?${new URLSearchParams(query)}`,
      { headers: headers() },
    );
    // 404 = Attentive doesn't know this user.
    if (response.status === 404) return false;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { subscriptionEligibilities = [] } = await response.json();
    return subscriptionEligibilities.some(
      (item: {
        subscription?: { type?: string; channel?: string };
        eligibility?: { isEligible?: boolean };
      }) =>
        item.subscription?.type === "MARKETING" &&
        item.subscription?.channel === channel &&
        item.eligibility?.isEligible === true,
    );
  } catch (error) {
    // Fall back to Shopify consent alone rather than hiding the block.
    console.error(`Attentive ${channel} lookup failed`, error);
    return false;
  }
}

/**
 * Subscribes one channel through its dedicated sign-up unit. Attentive sends
 * the double opt-in text for SMS (singleOptIn stays false).
 */
export async function subscribe(
  channel: Channel,
  user: { email: string } | { phone: string },
): Promise<void> {
  const signUpSourceId =
    channel === "email"
      ? process.env.ATTENTIVE_EMAIL_SIGN_UP_SOURCE_ID
      : process.env.ATTENTIVE_SMS_SIGN_UP_SOURCE_ID;
  if (!signUpSourceId) {
    throw new Error(`Missing Attentive sign-up source ID for ${channel}`);
  }

  const response = await fetch(SUBSCRIPTIONS_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ user, signUpSourceId, singleOptIn: false }),
  });
  if (!response.ok) {
    throw new Error(`Attentive ${channel} signup failed: HTTP ${response.status}`);
  }
}
