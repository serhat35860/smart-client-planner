import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const updateSchema = z
  .object({
    status: z.enum(["PENDING", "DONE"]).optional(),
    notCompletedReason: z.union([z.string().max(2000), z.null()]).optional(),
    title: z.string().min(1).max(500).optional(),
    deadline: z.string().datetime().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    clientId: z.string().min(1).optional(),
    remindBeforeMinutes: z.number().int().min(0).max(10080).optional().nullable()
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.notCompletedReason !== undefined ||
      d.title !== undefined ||
      d.deadline !== undefined ||
      d.priority !== undefined ||
      d.clientId !== undefined ||
      d.remindBeforeMinutes !== undefined,
    { message: "At least one field required" }
  );

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await req.json();
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { id } = await params;

  const existing = await prisma.task.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, notCompletedReason, title, deadline, priority, clientId, remindBeforeMinutes } = parsed.data;

  if (clientId !== undefined) {
    const c = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
    if (!c) return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }

  const data: {
    status?: "PENDING" | "DONE";
    notCompletedReason?: string | null;
    title?: string;
    deadline?: Date;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    clientId?: string;
    remindBeforeMinutes?: number | null;
  } = {};

  if (status === "DONE") {
    data.status = "DONE";
    data.notCompletedReason = null;
  } else if (status === "PENDING") {
    data.status = "PENDING";
  }

  if (notCompletedReason !== undefined && status !== "DONE") {
    const normalized =
      notCompletedReason === null
        ? null
        : notCompletedReason.trim() === ""
          ? null
          : notCompletedReason.trim();
    if (normalized !== null && existing.status !== "PENDING") {
      return NextResponse.json({ error: "Reason only for pending tasks" }, { status: 400 });
    }
    if (status === undefined || status === "PENDING") {
      data.notCompletedReason = normalized;
    }
  }

  if (title !== undefined) data.title = title.trim();
  if (deadline !== undefined) data.deadline = new Date(deadline);
  if (priority !== undefined) data.priority = priority;
  if (clientId !== undefined) data.clientId = clientId;
  if (remindBeforeMinutes !== undefined) data.remindBeforeMinutes = remindBeforeMinutes;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const result = await prisma.task.updateMany({
    where: { id, userId: user.id },
    data
  });
  return NextResponse.json({ ok: result.count === 1 });
}
