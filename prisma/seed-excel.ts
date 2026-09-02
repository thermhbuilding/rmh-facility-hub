import { PrismaClient, Role, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai migrasi data mentah dari Excel ke Supabase...");

  // 1. Bersihkan data lama jika diperlukan
  await prisma.taskFinding.deleteMany();
  await prisma.taskPhoto.deleteMany();
  await prisma.taskInstance.deleteMany();
  await prisma.taskSchedule.deleteMany();
  await prisma.task.deleteMany();
  await prisma.area.deleteMany();
  await prisma.user.deleteMany();

  // 2. Buat Akun Standar
  const adminPassword = await bcrypt.hash("admin123", 10);
  const spvPassword = await bcrypt.hash("spv123", 10);
  const obPassword = await bcrypt.hash("ob123", 10);

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
      name: "Hendra Pratama",
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

  console.log("👤 4 User default berhasil dibuat.");

  // 3. Buat Master Area Lengkap Sesuai Excel
  const areaData = [
    { name: "Lobby Utama & Kaca Masuk", description: "Area resepsionis, pintu kaca, lantai granit, dan ruang tunggu tamu." },
    { name: "Toilet Lt. 1 & Lt. 2", description: "Kloset, wastafel, cermin, urinoir, dan exhaust fan toilet pria & wanita." },
    { name: "Mushola & Tempat Wudhu", description: "Ruang ibadah sholat, karpet sajadah, rak mukena, dan kran tempat wudhu." },
    { name: "Ruang Kerja Staff & Meja Kantor", description: "Area workstation staff, meja kerja, kursi, dan lemari file arsip." },
    { name: "Area Pantry & Dispenser", description: "Dapur bersih, wastafel cuci piring, kulkas, meja makan, dan dispenser air." },
    { name: "Teras Balkon & Taman Tengah", description: "Balkon lantai 2, taman tengah, tanaman hias/plastik, dan gradensa." },
    { name: "Tangga, Selasar & List Kayu", description: "Anak tangga, pegangan handle tangga, railing, list kayu dinding, dan koridor." },
    { name: "Pos Security & Gerbang Pagar", description: "Pos jaga keamanan, gerbang utama, dan daun pagar luar." },
    { name: "Garasi & Area Parkir Motor", description: "Area parkir kendaraan roda 2 dan roda 4, lantai garasi samping, dan gazebo." },
    { name: "Dak Atas, Ruang Mesin & Luar", description: "Area lantai atap dak, canopy kaca, dan talang pembuangan air." },
  ];

  const areaMap = new Map<string, string>();
  for (const a of areaData) {
    const created = await prisma.area.create({ data: a });
    areaMap.set(a.name, created.id);
  }
  console.log(`🏢 ${areaMap.size} Master Area berhasil dibuat.`);

  // 4. Buat Master Task & Jadwal (Rutinitas, Periodik, dan Berkala)
  const taskDefinitions = [
    // --- RUTINITAS (Senin - Jumat: Days 1, 2, 3, 4, 5) ---
    {
      name: "Pengecekan dan Pembersihan Mushola",
      area: "Mushola & Tempat Wudhu",
      desc: "Vacuum karpet sajadah, rapikan mukena/sarung, dan bersihkan area sholat.",
      days: [1, 2, 3, 4, 5],
      assignedTo: obSiti.id,
    },
    {
      name: "Pengecekan dan Pembersihan Toilet",
      area: "Toilet Lt. 1 & Lt. 2",
      desc: "Sikat kloset, bersihkan wastafel, lap cermin, isi ulang sabun, dan pel lantai.",
      days: [1, 2, 3, 4, 5],
      assignedTo: obBudi.id,
    },
    {
      name: "Pembersihan & Mopping Lobby",
      area: "Lobby Utama & Kaca Masuk",
      desc: "Sapu dan pel lantai granit lobby utama serta bersihkan kaca pintu masuk.",
      days: [1, 2, 3, 4, 5],
      assignedTo: obBudi.id,
    },
    {
      name: "Pembersihan Meja-Meja Kantor",
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap permukaan meja kerja staff, bersihkan dari debu tanpa menggeser dokumen penting.",
      days: [1, 2, 3, 4, 5],
      assignedTo: obSiti.id,
    },
    {
      name: "Pengambilan Sampah Kantor",
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Kosongkan semua tempat sampah ruangan kerja dan ganti plastik sampah baru.",
      days: [1, 2, 3, 4, 5],
      assignedTo: obBudi.id,
    },
    {
      name: "Pembersihan Anak Tangga & Selasar",
      area: "Tangga, Selasar & List Kayu",
      desc: "Sapu dan pel seluruh anak tangga dari lantai 1 hingga lantai 2.",
      days: [1, 2, 3, 4, 5],
      assignedTo: obSiti.id,
    },

    // --- PERIODIK SENIN (Day 1) ---
    {
      name: "Pembersihan Kaki-Kaki Kursi",
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap debu pada roda dan kaki besi kursi kerja staff.",
      days: [1],
      assignedTo: obBudi.id,
    },
    {
      name: "Pembersihan Sawang Laba-Laba",
      area: "Lobby Utama & Kaca Masuk",
      desc: "Bersihkan sawang laba-laba di plafon dan sudut-sudut dinding tinggi.",
      days: [1, 5],
      assignedTo: obBudi.id,
    },
    {
      name: "Pengelapan Handle Tangga & Pintu",
      area: "Tangga, Selasar & List Kayu",
      desc: "Disinfeksi dan lap bersih handle tangga serta gagang pintu.",
      days: [1, 5],
      assignedTo: obSiti.id,
    },
    {
      name: "Pembersihan Kaca Luar",
      area: "Lobby Utama & Kaca Masuk",
      desc: "Bersihkan permukaan kaca gedung bagian luar dengan wiper kaca.",
      days: [1],
      assignedTo: obBudi.id,
    },
    {
      name: "Pengecekan & Pembersihan APAR",
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap tabung APAR dari debu dan cek posisi jarum tekanan.",
      days: [1, 5],
      assignedTo: obSiti.id,
    },

    // --- PERIODIK SELASA (Day 2) ---
    {
      name: "Pembersihan Area Pantry & Sink",
      area: "Area Pantry & Dispenser",
      desc: "Bersihkan wastafel cuci piring, lap meja makan pantry, dan tata peralatan dapur.",
      days: [2],
      assignedTo: obSiti.id,
    },
    {
      name: "Pembersihan Pos Security",
      area: "Pos Security & Gerbang Pagar",
      desc: "Sapu, pel, dan bersihkan meja pos jaga keamanan.",
      days: [2],
      assignedTo: obBudi.id,
    },
    {
      name: "Pengelapan Daun Gerbang Pagar",
      area: "Pos Security & Gerbang Pagar",
      desc: "Lap debu pada jeruji gerbang pagar besi depan.",
      days: [2],
      assignedTo: obBudi.id,
    },
    {
      name: "Pembersihan Gradensa & Tanaman Plastik",
      area: "Teras Balkon & Taman Tengah",
      desc: "Lap debu pada daun tanaman hias plastik dan lemari gradensa.",
      days: [2],
      assignedTo: obSiti.id,
    },

    // --- PERIODIK RABU (Day 3) ---
    {
      name: "Pembersihan Teras Taman Tengah",
      area: "Teras Balkon & Taman Tengah",
      desc: "Sapu dedaunan kering di taman tengah dan rapikan batu coral.",
      days: [3],
      assignedTo: obBudi.id,
    },
    {
      name: "Pembersihan Area Tempat Wudhu Lt. 1 & 2",
      area: "Mushola & Tempat Wudhu",
      desc: "Sikat lantai tempat wudhu, bersihkan kran air, dan buang genangan air.",
      days: [3],
      assignedTo: obSiti.id,
    },
    {
      name: "Pembersihan & Sanitasi Dispenser",
      area: "Area Pantry & Dispenser",
      desc: "Kuras dan bersihkan tatakan air dispenser serta ganti galon jika kosong.",
      days: [3],
      assignedTo: obSiti.id,
    },
    {
      name: "Pengelapan Stop Kontak & Saklar",
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap bersih saklar lampu dan stop kontak dinding menggunakan kain kering.",
      days: [3],
      assignedTo: obBudi.id,
    },

    // --- PERIODIK KAMIS (Day 4) ---
    {
      name: "Pengelapan Lemari File & Arsip",
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap permukaan atas dan handle lemari file arsip kantor.",
      days: [4],
      assignedTo: obSiti.id,
    },
    {
      name: "Pembersihan Area Dak Atas",
      area: "Dak Atas, Ruang Mesin & Luar",
      desc: "Sapu sampah daun pada saluran talang dak atap agar tidak mampet.",
      days: [4],
      assignedTo: obBudi.id,
    },
    {
      name: "Pembersihan Teras Balkon Lt. 2",
      area: "Teras Balkon & Taman Tengah",
      desc: "Sapu dan pel lantai teras balkon lantai 2.",
      days: [4],
      assignedTo: obSiti.id,
    },

    // --- PERIODIK JUM'AT (Day 5) ---
    {
      name: "Pembersihan Kaca Bagian Dalam",
      area: "Lobby Utama & Kaca Masuk",
      desc: "Lap kaca partisi dan jendela bagian dalam menggunakan cairan pembersih kaca.",
      days: [5],
      assignedTo: obBudi.id,
    },
    {
      name: "Pengelapan List Kayu Dinding",
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap debu pada list kayu dinding koridor lantai 1 dan 2.",
      days: [5],
      assignedTo: obSiti.id,
    },

    // --- BERKALA / GENERAL CLEANING SABTU (Day 6) ---
    {
      name: "General Cleaning Toilet Total",
      area: "Toilet Lt. 1 & Lt. 2",
      desc: "Penyikatan kerak lantai toilet, dinding keramik, dan pembersihan exhaust fan.",
      days: [6],
      assignedTo: obBudi.id,
    },
    {
      name: "General Cleaning Mushola Total",
      area: "Mushola & Tempat Wudhu",
      desc: "Pencucian sajadah, pembersihan menyeluruh karpet sholat, dan pel lantai.",
      days: [6],
      assignedTo: obSiti.id,
    },
    {
      name: "Penyikatan Lantai Garasi & Gazebo",
      area: "Garasi & Area Parkir Motor",
      desc: "Sikat lantai semen/paving garasi samping dan area gazebo dengan sabun lantai.",
      days: [6],
      assignedTo: obBudi.id,
    },
    {
      name: "Penyikatan Lantai Granit Teras Lobby",
      area: "Lobby Utama & Kaca Masuk",
      desc: "Sikat dan buffing ringan lantai granit teras depan lobby.",
      days: [6],
      assignedTo: obSiti.id,
    },
    {
      name: "Pembersihan & Cuci Kaca Kanopi",
      area: "Dak Atas, Ruang Mesin & Luar",
      desc: "Cuci kaca kanopi depan dari lumut dan kotoran debu luar.",
      days: [6],
      assignedTo: obBudi.id,
    },
    {
      name: "Pencucian Seluruh Tempat Sampah Gedung",
      area: "Garasi & Area Parkir Motor",
      desc: "Cuci bersih seluruh wadah tong sampah luar dan dalam dengan disinfektan.",
      days: [6],
      assignedTo: obSiti.id,
    },
  ];

  let taskCount = 0;
  for (const t of taskDefinitions) {
    const areaId = areaMap.get(t.area);
    if (!areaId) continue;

    const createdTask = await prisma.task.create({
      data: {
        name: t.name,
        description: t.desc,
        areaId,
      },
    });
    taskCount++;

    // Buat jadwal untuk hari-hari terkait
    for (const day of t.days) {
      await prisma.taskSchedule.create({
        data: {
          taskId: createdTask.id,
          dayOfWeek: day,
          assignedTo: t.assignedTo,
        },
      });
    }
  }

  console.log(`📋 ${taskCount} Master Program Kerja Asli Excel berhasil di-generate beserta jadwalnya.`);

  // 5. Generate Tugas Hari Ini (Today) untuk demo langsung
  const today = new Date();
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(today);
  const [year, month, day] = dateStr.split("-").map(Number);
  const todayDate = new Date(Date.UTC(year, month - 1, day));
  const currentDayOfWeek = todayDate.getUTCDay() === 0 ? 1 : todayDate.getUTCDay();

  const todaySchedules = await prisma.taskSchedule.findMany({
    where: { dayOfWeek: currentDayOfWeek },
    include: { task: true },
  });

  for (const s of todaySchedules) {
    await prisma.taskInstance.create({
      data: {
        taskId: s.taskId,
        assignedUserId: s.assignedTo || obBudi.id,
        scheduledDate: todayDate,
        status: TaskStatus.PENDING,
      },
    });
  }

  console.log(`✨ ${todaySchedules.length} Tugas Hari Ini (WIB) berhasil digenerate.`);
  console.log("🎉 Migrasi data Excel selesai 100%!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding excel data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
