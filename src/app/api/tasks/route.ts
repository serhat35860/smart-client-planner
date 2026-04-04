import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const createSchema = z.object({
  clientId: z.string().min(1),
  noteId: z.string().optional().nullable(),
  title: z.string().min(1),
  deadline: z.string().datetime(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  remindBeforeMinutes: z.number().int().min(0).max(10080).optional()
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { client: true }
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      clientId: parsed.data.clientId,
      noteId: parsed.data.noteId,
      title: parsed.data.title,
      deadline: new Date(parsed.data.deadline),
      priority: parsed.data.priority,
      remindBeforeMinutes: parsed.data.remindBeforeMinutes ?? 15
    }
  });
  return NextResponse.json(task, { status: 201 });
}
