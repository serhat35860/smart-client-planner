import type { Prisma } from "@prisma/client";

export async function nextClientFileNumber(tx: Prisma.TransactionClient, workspaceId: string) {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const rows = await tx.client.findMany({
    where: { workspaceId, fileNumber: { startsWith: prefix } },
    select: { fileNumber: true }
  });
  let max = 0;
  for (const row of rows) {
    const value = row.fileNumber?.slice(prefix.length) ?? "";
    const num = Number.parseInt(value, 10);
    if (Number.isFinite(num) && num > max) max = num;
  }
  return `${year}-${max + 1}`;
}
