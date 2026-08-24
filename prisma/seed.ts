import {
  CourseType,
  PrismaClient,
  Semester,
  StudentStatus,
  UserRole,
  AdviserAssignmentStatus,
} from "@/generated/prisma";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const ENTRY_SESSION = "2021/2022";

async function main() {
  const password = await bcrypt.hash("password123", 10);

  // 1. Core Users
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
      name: "Prof. Ibrahim Musa",
      email: "hod@gradelis.com",
      passwordHash: password,
      role: UserRole.HOD,
    },
  });

  const lecturer = await prisma.user.upsert({
    where: { email: "lecturer@gradelis.com" },
    update: {},
    create: {
      name: "Dr. Kelvin Bello",
      email: "lecturer@gradelis.com",
      passwordHash: password,
      role: UserRole.LECTURER,
    },
  });

  // 2. Seed Adviser Assignments for Multiple Sets
  const setsToAssign = ["U2021", "U2020", "U2019", "U2018", "U2022"];
  for (const setStr of setsToAssign) {
    const existing = await prisma.adviserAssignment.findFirst({
      where: {
        lecturerId: lecturer.id,
        entrySession: setStr,
      },
    });

    if (!existing) {
      await prisma.adviserAssignment.create({
        data: {
          lecturerId: lecturer.id,
          assignedById: hod.id,
          entrySession: setStr,
          status: AdviserAssignmentStatus.ACTIVE,
          startDate: new Date("2021-09-01"),
        },
      });
    }
  }

  // 3. Courses (Uploads match against these by code)
  const courses = [
    { code: "CSC401", title: "Software Engineering", creditUnits: 3, level: 400, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "CSC403", title: "Operating Systems", creditUnits: 3, level: 400, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "CSC405", title: "Computer Networks", creditUnits: 2, level: 400, semester: Semester.SECOND, courseType: CourseType.COMPULSORY },
    { code: "CSC407", title: "Machine Learning", creditUnits: 2, level: 400, semester: Semester.SECOND, courseType: CourseType.ELECTIVE },
    { code: "CSC301", title: "Data Structures", creditUnits: 3, level: 300, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "ENG101", title: "Engineering Mathematics I", creditUnits: 3, level: 100, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "PHY101", title: "General Physics I", creditUnits: 3, level: 100, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "ECE201", title: "Circuit Theory I", creditUnits: 3, level: 200, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "ECE301", title: "Electromagnetic Theory", creditUnits: 3, level: 300, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "ECE401", title: "Control Engineering I", creditUnits: 3, level: 400, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "ECE402", title: "Digital Electronics & VLSI", creditUnits: 3, level: 400, semester: Semester.SECOND, courseType: CourseType.COMPULSORY },
    { code: "ECE501", title: "Advanced Control Systems", creditUnits: 3, level: 500, semester: Semester.FIRST, courseType: CourseType.COMPULSORY },
    { code: "ECE599", title: "Final Year Capstone Project", creditUnits: 6, level: 500, semester: Semester.SECOND, courseType: CourseType.COMPULSORY },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: { ...course, createdById: hod.id },
    });
  }

  // 4. Sample Students across Sets
  const sampleStudentData = [
    { matric: "U2021/3020001", name: "Ada Okonkwo", set: "U2021", level: 400, status: StudentStatus.ACTIVE },
    { matric: "U2021/3020002", name: "Bello Ibrahim", set: "U2021", level: 400, status: StudentStatus.ACTIVE },
    { matric: "U2021/3020003", name: "Chidi Nwosu", set: "U2021", level: 400, status: StudentStatus.ACTIVE },
    { matric: "U2021/3020004", name: "Dami Adeyemi", set: "U2021", level: 400, status: StudentStatus.ACTIVE },
    { matric: "U2021/3020005", name: "Efe Otobo", set: "U2021", level: 400, status: StudentStatus.ACTIVE },
    { matric: "U2020/3020001", name: "Fatima Abubakar", set: "U2020", level: 500, status: StudentStatus.ACTIVE },
    { matric: "U2020/3020002", name: "Chinedu Eze", set: "U2020", level: 500, status: StudentStatus.ACTIVE },
    { matric: "U2018/3020001", name: "Emmanuel Okonkwo", set: "U2018", level: 500, status: StudentStatus.GRADUATED },
    { matric: "U2018/3020002", name: "Blessing Okafor", set: "U2018", level: 500, status: StudentStatus.GRADUATED },
    { matric: "U2018/3020003", name: "Ahmed Bello", set: "U2018", level: 500, status: StudentStatus.ACTIVE },
  ];

  for (const s of sampleStudentData) {
    await prisma.student.upsert({
      where: { matricNumber: s.matric },
      update: {},
      create: {
        matricNumber: s.matric,
        fullName: s.name,
        entrySession: s.set,
        currentLevel: s.level,
        status: s.status,
        createdById: admin.id,
      },
    });
  }

  console.log(
    `seeded: ${[admin, hod, lecturer].length} users, ${courses.length} courses, ${sampleStudentData.length} students`
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
