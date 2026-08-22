import { CourseType, PrismaClient, Semester, UserRole } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const ENTRY_SESSION = "2021/2022";

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gradelis.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@gradelis.com",
      passwordHash: password,
      role: UserRole.SYSTEM_ADMIN,
    },
  });

  const hod = await prisma.user.upsert({
    where: { email: "hod@gradelis.com" },
    update: {},
    create: {
      name: "HOD",
      email: "hod@gradelis.com",
      passwordHash: password,
      role: UserRole.HOD,
    },
  });

  const lecturer = await prisma.user.upsert({
    where: { email: "lecturer@gradelis.com" },
    update: {},
    create: {
      name: "John Lecturer",
      email: "lecturer@gradelis.com",
      passwordHash: password,
      role: UserRole.LECTURER,
    },
  });

  // Courses the HOD owns. Uploads match against these by code.
  const courses = [
    { code: "CSC401", title: "Software Engineering", creditUnits: 3, level: 400, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "CSC403", title: "Operating Systems", creditUnits: 3, level: 400, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "CSC405", title: "Computer Networks", creditUnits: 2, level: 400, semester: Semester.SECOND, courseType: CourseType.COMPULSORY },
    { code: "CSC407", title: "Machine Learning", creditUnits: 2, level: 400, semester: Semester.SECOND, courseType: CourseType.ELECTIVE },
    { code: "CSC301", title: "Data Structures", creditUnits: 3, level: 300, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: { ...course, createdById: hod.id },
    });
  }

  // Students in one graduating cohort.
  const students = [
    { matricNumber: "U2021/3020001", fullName: "Ada Okonkwo" },
    { matricNumber: "U2021/3020002", fullName: "Bello Ibrahim" },
    { matricNumber: "U2021/3020003", fullName: "Chidi Nwosu" },
    { matricNumber: "U2021/3020004", fullName: "Dami Adeyemi" },
    { matricNumber: "U2021/3020005", fullName: "Efe Otobo" },
    { matricNumber: "U2021/3020006", fullName: "Funke Salami" },
    { matricNumber: "U2021/3020007", fullName: "Gbenga Alabi" },
    { matricNumber: "U2021/3020008", fullName: "Halima Sani" },
  ];

  for (const student of students) {
    await prisma.student.upsert({
      where: { matricNumber: student.matricNumber },
      update: {},
      create: {
        ...student,
        entrySession: ENTRY_SESSION,
        currentLevel: 400,
        createdById: lecturer.id,
      },
    });
  }

  console.log(
    `seeded: ${[admin, hod, lecturer].length} users, ${courses.length} courses, ${students.length} students`,
  );
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
