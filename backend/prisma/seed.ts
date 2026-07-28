import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const users: { name: string; email: string; role: Role }[] = [
    { name: "Admin User", email: "admin@example.com", role: "ADMIN" },
    { name: "Sales User", email: "sales@example.com", role: "SALES" },
    { name: "Warehouse User", email: "warehouse@example.com", role: "WAREHOUSE" },
    { name: "Accounts User", email: "accounts@example.com", role: "ACCOUNTS" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password },
    });
  }

  console.log("Seeded 4 test users (password for all: password123):");
  users.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
