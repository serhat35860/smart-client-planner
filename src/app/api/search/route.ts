import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creatorSelect } from "@/lib/creator-preview";
import { requireWorkspace } from "@/lib/workspace";

const noteSearchInclude = {
  client: true,
  tags: {
    include: {
      tag: { select: { name: true, createdBy: { select: creatorSelect } } }
    }
  },
  mentions: {
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  },
  createdBy: { select: creatorSelect },
  updatedBy: { select: creatorSelect }
} as const;

export async function GET(req: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const mentionedUserId = (url.searchParams.get("mentionedUserId") || "").trim() || null;

  if (!q && !mentionedUserId) {
    return NextResponse.json({ clients: [], notes: [] });
  }

  const qTag = q.toLowerCase();

  const clientsPromise =
    q.length > 0
      ? prisma.client.findMany({
          where: {
            workspaceId: ctx.workspace.id,
            OR: [{ companyName: { contains: q } }, { contactPerson: { contains: q } }]
          },
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: creatorSelect } }
        })
      : Promise.resolve([]);

  const notesQueries = mentionedUserId
    ? [
      prisma.note.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          mentions: { some: { userId: mentionedUserId } },
          ...(q.length > 0
            ? {
                OR: [{ content: { contains: q } }, { title: { contains: q } }]
              }
            : {})
        },
        include: noteSearchInclude,
        take: 30,
        orderBy: { createdAt: "desc" }
      })
    ]
    : [
      prisma.note.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          OR: [{ content: { contains: q } }, { title: { contains: q } }]
        },
        include: noteSearchInclude,
        take: 30,
        orderBy: { createdAt: "desc" }
      }),
      prisma.note.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          tags: { some: { tag: { name: { contains: qTag } } } }
        },
        include: noteSearchInclude,
        take: 30,
        orderBy: { createdAt: "desc" }
      }),
      prisma.note.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          mentions: {
            some: {
              user: {
                OR: [{ name: { contains: q } }, { email: { contains: q } }]
              }
            }
          }
        },
        include: noteSearchInclude,
        take: 30,
        orderBy: { createdAt: "desc" }
      })
    ];

  const [clients, ...noteArrays] = await Promise.all([clientsPromise, ...notesQueries]);

  type NoteRow = Awaited<ReturnType<typeof prisma.note.findMany>>[number];
  const byId = new Map<string, NoteRow>();
  for (const arr of noteArrays) {
    for (const n of arr) {
      byId.set(n.id, n);
    }
  }
  const notes = Array.from(byId.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20);

  return NextResponse.json({ clients, notes });
}
