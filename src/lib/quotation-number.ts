import type { Prisma } from "@/generated/prisma/client";

/**
 * Atomically allocates the next sequence number for a given year using a
 * single-statement Postgres upsert (row-level lock during INSERT .. ON CONFLICT),
 * so concurrent quotation creation for the same year can never collide.
 * Must be called inside the same transaction as the Quotation.create so
 * counter increment and insert commit/rollback together.
 */
export async function allocateQuotationSequence(
  tx: Prisma.TransactionClient,
  year: number
): Promise<number> {
  const rows = await tx.$queryRaw<{ lastSequence: number }[]>`
    INSERT INTO "QuotationCounter" (year, "lastSequence")
    VALUES (${year}, 1)
    ON CONFLICT (year)
    DO UPDATE SET "lastSequence" = "QuotationCounter"."lastSequence" + 1
    RETURNING "lastSequence"
  `;
  return rows[0].lastSequence;
}

export function formatQuotationNumber(year: number, sequence: number): string {
  return `ALH-${year}-${String(sequence).padStart(4, "0")}`;
}
