export type SubscriberState = "none" | "email_only" | "sms_only" | "both";

// PENDING = opted in but awaiting confirmation (e.g. checkout opt-in). The
// test brief counts anyone who opted in at checkout as subscribed.
const OPTED_IN = new Set(["SUBSCRIBED", "PENDING"]);

export function toSubscriberState(
  emailState: string | null | undefined,
  smsState: string | null | undefined,
): SubscriberState {
  const email = OPTED_IN.has(emailState ?? "");
  const sms = OPTED_IN.has(smsState ?? "");

  if (email && sms) return "both";
  if (email) return "email_only";
  if (sms) return "sms_only";
  return "none";
}
