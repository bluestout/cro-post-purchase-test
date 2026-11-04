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

/** Unique orders per event type/detail (refreshes and repeat clicks count once). */
export function getEventSummary(shop: string) {
  return prisma.$queryRaw<{ type: string; detail: string; orders: bigint }[]>`
    SELECT "type", "detail", COUNT(DISTINCT "orderId") AS "orders"
    FROM "PpEvent"
    WHERE "shop" = ${shop}
    GROUP BY "type", "detail"
    ORDER BY "type", "detail"`;
}
