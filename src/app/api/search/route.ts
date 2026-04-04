import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ clients: [], notes: [] });

  const [clients, notes] = await Promise.all([
    prisma.client.findMany({
      where: {
        userId: user.id,
        OR: [{ companyName: { contains: q } }, { contactPerson: { contains: q } }]
      },
      take: 10,
      orderBy: { createdAt: "desc" }
    }),
    prisma.note.findMany({
      where: {
        userId: user.id,
        OR: [
          { content: { contains: q } },
          { title: { contains: q } },
          { tags: { some: { tag: { name: { contains: q } } } } }
        ]
      },
      include: { client: true, tags: { include: { tag: true } } },
      take: 20,
      orderBy: { createdAt: "desc" }
    })
  ]);

  return NextResponse.json({ clients, notes });
}
