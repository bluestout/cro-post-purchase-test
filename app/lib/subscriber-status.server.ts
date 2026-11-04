export type SubscriberState = "none" | "email_only" | "sms_only" | "both";

export function toSubscriberState({
  email,
  sms,
}: {
  email: boolean;
  sms: boolean;
}): SubscriberState {
  if (email && sms) return "both";
  if (email) return "email_only";
  if (sms) return "sms_only";
  return "none";
}
