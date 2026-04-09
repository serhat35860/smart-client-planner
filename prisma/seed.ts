import { PrismaClient, ClientStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays, addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@smartclientplanner.com" },
    update: { passwordHash, username: "demo" },
    create: {
      email: "demo@smartclientplanner.com",
      username: "demo",
      name: "Demo User",
      passwordHash
    }
  });

  let workspaceId: string;
  const existingMember = await prisma.workspaceMember.findUnique({ where: { userId: user.id } });
  if (existingMember) {
    workspaceId = existingMember.workspaceId;
  } else {
    const ws = await prisma.workspace.create({
      data: {
        name: "Demo team",
        members: { create: { userId: user.id, role: "ADMIN" } }
      }
    });
    workspaceId = ws.id;
  }

  await prisma.task.deleteMany({ where: { workspaceId } });
  await prisma.note.deleteMany({ where: { workspaceId } });
  await prisma.client.deleteMany({ where: { workspaceId } });
  await prisma.tag.deleteMany({ where: { workspaceId } });

  const tags = await Promise.all(
    ["payment", "production", "complaint", "meeting", "support"].map((name) =>
      prisma.tag.create({ data: { name, workspaceId, createdByUserId: user.id } })
    )
  );

  const clientA = await prisma.client.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      companyName: "Northwind Textiles",
      contactPerson: "Elif Kaya",
      phone: "+90 555 123 45 67",
      email: "elif@northwind.com",
      sector: "Manufacturing",
      generalNotes: "High potential. Interested in quarterly planning package.",
      status: ClientStatus.ACTIVE
    }
  });

  const clientB = await prisma.client.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      companyName: "BluePeak Logistics",
      contactPerson: "Mert Demir",
      phone: "+90 555 987 65 43",
      email: "mert@bluepeak.com",
      sector: "Logistics",
      generalNotes: "Needs response speed improvements for support requests.",
      status: ClientStatus.POTENTIAL
    }
  });

  const note1 = await prisma.note.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      clientId: clientA.id,
      title: "Kickoff and planning",
      content: "Reviewed current workflow. Shared first draft timeline and pricing.",
      nextActionDate: addDays(new Date(), 1),
      remindBeforeMinutes: 15,
      color: "yellow",
      tags: { create: [{ tagId: tags[3].id }, { tagId: tags[1].id }] },
      createdAt: subDays(new Date(), 1)
    }
  });

  await prisma.task.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      clientId: clientA.id,
      noteId: note1.id,
      title: "Send finalized proposal",
      deadline: addDays(new Date(), 1),
      priority: TaskPriority.HIGH
    }
  });

  await prisma.note.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      clientId: clientA.id,
      title: "Payment clarification",
      content: "Client requested revised milestone payment split and invoice format.",
      nextActionDate: addDays(new Date(), 3),
      remindBeforeMinutes: 60,
      color: "blue",
      tags: { create: [{ tagId: tags[0].id }] },
      createdAt: subDays(new Date(), 2)
    }
  });

  await prisma.note.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      clientId: clientB.id,
      title: "Support pain points",
      content: "Discussed late feedback loops and need for weekly checkpoint.",
      nextActionDate: addDays(new Date(), 2),
      remindBeforeMinutes: 30,
      color: "green",
      tags: { create: [{ tagId: tags[4].id }, { tagId: tags[2].id }] },
      createdAt: subDays(new Date(), 1)
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
