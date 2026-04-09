import { rm } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const projectRoot = process.cwd();
const templateDbPath = join(projectRoot, "desktop-template.db");
const DEFAULT_ADMIN = {
  email: "admin@smartclientplanner.local",
  username: "admin",
  name: "Admin",
  password: "admin123"
};

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env }
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  await rm(templateDbPath, { force: true });
  const dbUrl = `file:${templateDbPath.replaceAll("\\", "/")}`;
  run("npx", ["prisma", "db", "push", "--skip-generate"], { DATABASE_URL: dbUrl });
  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    }
  });
  try {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    const existingByEmail = await prisma.user.findUnique({ where: { email: DEFAULT_ADMIN.email } });
    const existingByUsername = await prisma.user.findUnique({ where: { username: DEFAULT_ADMIN.username } });
    const targetUser = existingByEmail ?? existingByUsername;
    const user = targetUser
      ? await prisma.user.update({
          where: { id: targetUser.id },
          data: {
            email: DEFAULT_ADMIN.email,
            username: DEFAULT_ADMIN.username,
            name: DEFAULT_ADMIN.name,
            passwordHash
          }
        })
      : await prisma.user.create({
          data: {
            email: DEFAULT_ADMIN.email,
            username: DEFAULT_ADMIN.username,
            name: DEFAULT_ADMIN.name,
            passwordHash
          }
        });

    const member = await prisma.workspaceMember.findUnique({ where: { userId: user.id } });
    if (!member) {
      await prisma.workspace.create({
        data: {
          name: "Admin workspace",
          members: {
            create: {
              userId: user.id,
              role: "ADMIN"
            }
          }
        }
      });
    } else if (member.role !== "ADMIN" || !member.isActive) {
      await prisma.workspaceMember.update({
        where: { userId: user.id },
        data: { role: "ADMIN", isActive: true }
      });
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log("[desktop] Desktop template database prepared.");
}

main().catch((error) => {
  console.error("[desktop] Failed to prepare desktop database.");
  console.error(error);
  process.exit(1);
});
