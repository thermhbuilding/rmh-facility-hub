import { PrismaClient, Role, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding database...");

  // 1. Clean existing data (optional for fresh start)
  await prisma.taskFinding.deleteMany();
  await prisma.taskPhoto.deleteMany();
  await prisma.taskInstance.deleteMany();
  await prisma.taskSchedule.deleteMany();
  await prisma.task.deleteMany();
  await prisma.area.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Data lama berhasil dibersihkan.");

  // 2. Hash default passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const spvPassword = await bcrypt.hash("spv123", 10);
  const obPassword = await bcrypt.hash("ob123", 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPassword,
      name: "Administrator Sistem",
      role: Role.ADMIN,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      username: "supervisor",
      passwordHash: spvPassword,
      name: "Hendra Pratama (Supervisor)",
      role: Role.SUPERVISOR,
    },
  });

  const obBudi = await prisma.user.create({
    data: {
      username: "budi",
      passwordHash: obPassword,
      name: "Budi Santoso",
      role: Role.OB,
    },
  });

  const obSiti = await prisma.user.create({
    data: {
      username: "siti",
      passwordHash: obPassword,
      name: "Siti Rahma",
      role: Role.OB,
    },
  });

  console.log("👤 4 User berhasil dibuat (Admin, Supervisor, OB Budi, OB Siti).");

  // 4. Create Areas
  const areaLobby = await prisma.area.create({
    data: {
      name: "Lobby Utama Lt. 1",
      description: "Area resepsionis, pintu kaca utama, dan ruang tunggu tamu.",
    },
  });

  const areaToilet1 = await prisma.area.create({
    data: {
      name: "Toilet Lt. 1",
      description: "Toilet pria & wanita lantai 1 beserta wastafel.",
    },
  });

  const areaMushola = await prisma.area.create({
    data: {
      name: "Mushola Lt. 2",
      description: "Ruang ibadah, tempat wudhu, dan rak mukena.",
    },
  });

  const areaMeeting = await prisma.area.create({
    data: {
      name: "Ruang Rapat Utama Lt. 2",
      description: "Ruang rapat besar, meja board, TV display, dan whiteboard.",
    },
  });

  console.log("🏢 4 Master Area berhasil dibuat.");

  // 5. Create Master Tasks
  const taskToilet = await prisma.task.create({
    data: {
      name: "Pembersihan & Sanitasi Toilet",
      description: "Pengecekan dan pembersihan area kloset, wastafel, cermin, dan lantai.",
      areaId: areaToilet1.id,
    },
  });

  const taskMushola = await prisma.task.create({
    data: {
      name: "Pengecekan & Pembersihan Mushola",
      description: "Pengecekan tempat wudhu, vacuum karpet sajadah, dan perapihan mukena/sarung.",
      areaId: areaMushola.id,
    },
  });

  const taskLobby = await prisma.task.create({
    data: {
      name: "Sweeping & Mopping Lobby",
      description: "Menyapu dan mengepel lantai utama serta pembersihan kaca pintu masuk.",
      areaId: areaLobby.id,
    },
  });

  const taskMeeting = await prisma.task.create({
    data: {
      name: "Pembersihan Ruang Rapat",
      description: "Mengelap meja meeting, merapikan kursi, dan pembersihan whiteboard.",
      areaId: areaMeeting.id,
    },
  });

  console.log("📋 4 Master Task Program Harian berhasil dibuat.");

  // 6. Create Task Schedules (Senin-Sabtu)
  for (let day = 1; day <= 6; day++) {
    await prisma.taskSchedule.createMany({
      data: [
        { taskId: taskToilet.id, dayOfWeek: day, assignedTo: obBudi.id },
        { taskId: taskLobby.id, dayOfWeek: day, assignedTo: obBudi.id },
        { taskId: taskMushola.id, dayOfWeek: day, assignedTo: obSiti.id },
        { taskId: taskMeeting.id, dayOfWeek: day, assignedTo: obSiti.id },
      ],
    });
  }

  console.log("📅 Jadwal mingguan berhasil digenerate.");

  // 7. Create Task Instances for TODAY
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Task 1: Budi - Pending
  await prisma.taskInstance.create({
    data: {
      taskId: taskToilet.id,
      assignedUserId: obBudi.id,
      scheduledDate: today,
      status: TaskStatus.PENDING,
    },
  });

  // Task 2: Budi - In Progress
  const startedAt = new Date();
  startedAt.setMinutes(startedAt.getMinutes() - 30);
  await prisma.taskInstance.create({
    data: {
      taskId: taskLobby.id,
      assignedUserId: obBudi.id,
      scheduledDate: today,
      status: TaskStatus.IN_PROGRESS,
      startedAt: startedAt,
    },
  });

  // Task 3: Siti - Pending
  await prisma.taskInstance.create({
    data: {
      taskId: taskMushola.id,
      assignedUserId: obSiti.id,
      scheduledDate: today,
      status: TaskStatus.PENDING,
    },
  });

  // Task 4: Siti - Submitted (ready for supervisor review)
  const sitiStarted = new Date();
  sitiStarted.setHours(sitiStarted.getHours() - 1);
  const sitiSubmitted = new Date();
  sitiSubmitted.setMinutes(sitiSubmitted.getMinutes() - 15);

  const submittedInstance = await prisma.taskInstance.create({
    data: {
      taskId: taskMeeting.id,
      assignedUserId: obSiti.id,
      scheduledDate: today,
      status: TaskStatus.SUBMITTED,
      startedAt: sitiStarted,
      submittedAt: sitiSubmitted,
    },
  });

  // Add dummy Before and After photos for submitted task
  await prisma.taskPhoto.createMany({
    data: [
      {
        taskInstanceId: submittedInstance.id,
        type: "BEFORE",
        path: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600&auto=format&fit=crop&q=60",
        capturedAt: sitiStarted,
      },
      {
        taskInstanceId: submittedInstance.id,
        type: "AFTER",
        path: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=60",
        capturedAt: sitiSubmitted,
      },
    ],
  });

  console.log("✨ Data tugas hari ini (Today's Tasks) berhasil digenerate!");
  console.log("🎉 Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
