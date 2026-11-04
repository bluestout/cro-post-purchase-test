import prisma from "../db.server";

export type EventType = "impression" | "signup" | "social_click";

export function recordEvent(
  shop: string,
  orderId: string,
  type: EventType,
  detail: string,
) {
  return prisma.ppEvent.create({ data: { shop, orderId, type, detail } });
}
