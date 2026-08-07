
import { PrismaClient, UserRole } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@gradelis.com",
    },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@gradelis.com",
      passwordHash: password,
      role: UserRole.SYSTEM_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "hod@gradelis.com",
    },
    update: {},
    create: {
      name: "HOD",
      email: "hod@gradelis.com",
      passwordHash: password,
      role: UserRole.HOD,
    },
  });

  await prisma.user.upsert({
    where: {
      email: "lecturer@gradelis.com",
    },
    update: {},
    create: {
      name: "John Lecturer",
      email: "lecturer@gradelis.com",
      passwordHash: password,
      role: UserRole.LECTURER,
    },
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
