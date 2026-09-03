import { PrismaClient, Role, TaskStatus, TaskCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai migrasi data lengkap Excel (Rutinitas, Periodik, & Berkala) ke Supabase...");

  // 1. Bersihkan data lama
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

  // 3. Buat Master Area Gedung RMH
  const areaData = [
    { name: "Lobby Utama & Kaca Masuk", description: "Area resepsionis, pintu kaca, lantai granit, dan ruang tunggu tamu." },
    { name: "Toilet Lt. 1 & Lt. 2", description: "Kloset, wastafel, cermin, urinoir, dan exhaust fan toilet pria & wanita." },
    { name: "Mushola & Tempat Wudhu", description: "Ruang ibadah sholat, karpet sajadah, rak mukena, dan kran tempat wudhu." },
    { name: "Ruang Kerja Staff & Meja Kantor", description: "Area workstation staff, meja kerja, kursi, dan lemari file arsip." },
    { name: "Area Pantry & Dispenser", description: "Dapur bersih, wastafel cuci piring, kulkas, meja makan, dan dispenser air." },
    { name: "Teras Balkon & Taman Tengah", description: "Balkon lantai 2, taman tengah, tanaman hias/plastik, batu coral, dan gradensa." },
    { name: "Tangga, Selasar & List Kayu", description: "Anak tangga, pegangan handle tangga, railing, list kayu dinding, dan koridor." },
    { name: "Pos Security & Gerbang Pagar", description: "Pos jaga keamanan, gerbang utama, dan daun pagar luar." },
    { name: "Garasi & Area Parkir Motor", description: "Area parkir kendaraan roda 2 dan roda 4, lantai garasi samping, dan gazebo." },
    { name: "Dak Atas, Canopy & Luar", description: "Area lantai atap dak, canopy kaca, dan talang pembuangan air." },
  ];

  const areaMap = new Map<string, string>();
  for (const a of areaData) {
    const created = await prisma.area.create({ data: a });
    areaMap.set(a.name, created.id);
  }
  console.log(`🏢 ${areaMap.size} Master Area berhasil dibuat.`);

  // 4. Dataset Master Task Excel (Sheet Program Harian: Rutinitas, Periodik, & Berkala)
  const taskDefinitions: Array<{
    name: string;
    category: TaskCategory;
    area: string;
    desc: string;
    days: number[]; // 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
  }> = [
    // === A. KELOMPOK RUTINITAS (Setiap Hari Senin - Jumat: Days 1, 2, 3, 4, 5) ===
    {
      name: "Pengecekan dan Pembersihan Mushola",
      category: TaskCategory.RUTINITAS,
      area: "Mushola & Tempat Wudhu",
      desc: "Vacuum karpet sajadah, rapikan mukena/sarung, dan bersihkan area sholat.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pengecekan dan Pembersihan Toilet",
      category: TaskCategory.RUTINITAS,
      area: "Toilet Lt. 1 & Lt. 2",
      desc: "Sikat kloset, bersihkan wastafel, lap cermin, isi ulang sabun, dan pel lantai.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Lobby",
      category: TaskCategory.RUTINITAS,
      area: "Lobby Utama & Kaca Masuk",
      desc: "Sapu dan pel lantai granit lobby utama serta jaga kebersihan ruang tunggu tamu.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Meja-Meja Kantor",
      category: TaskCategory.RUTINITAS,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap permukaan meja kerja staff, bersihkan dari debu tanpa menggeser dokumen penting.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Kaca Lobby",
      category: TaskCategory.RUTINITAS,
      area: "Lobby Utama & Kaca Masuk",
      desc: "Lap kaca pintu masuk dan dinding kaca lobby agar bebas dari bekas sidik jari/debu.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Teras Balkon",
      category: TaskCategory.RUTINITAS,
      area: "Teras Balkon & Taman Tengah",
      desc: "Sapu dan pel lantai teras balkon lantai 2 dari debu luar ruangan.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pengambilan Sampah Kantor",
      category: TaskCategory.RUTINITAS,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Kosongkan semua tempat sampah ruangan kerja dan ganti plastik sampah baru.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Anak Tangga",
      category: TaskCategory.RUTINITAS,
      area: "Tangga, Selasar & List Kayu",
      desc: "Sapu dan pel setiap anak tangga penghubung lantai 1 dan 2.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Area Pantry",
      category: TaskCategory.RUTINITAS,
      area: "Area Pantry & Dispenser",
      desc: "Bersihkan wastafel cuci piring, lap meja makan dapur, dan rapikan peralatan.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Teras Taman Tengah",
      category: TaskCategory.RUTINITAS,
      area: "Teras Balkon & Taman Tengah",
      desc: "Sapu area taman tengah dan rapikan daun-daun gugur.",
      days: [1, 2, 3, 4, 5],
    },

    // === B. KELOMPOK PERIODIK (Tugas Spesifik Per Hari Kerja) ===
    // SENIN (Day 1)
    {
      name: "Pembersihan Kaki Kursi",
      category: TaskCategory.PERIODIK,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap dan bersihkan debu pada rangka dan roda kaki-kaki kursi kerja staff.",
      days: [1],
    },
    {
      name: "Pembersihan Sawang Laba-laba",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Bersihkan sarang laba-laba di sudut plafon, tangga, dan ventilasi udara.",
      days: [1, 5],
    },
    {
      name: "Pengelapan Handle Tangga Dan Pintu",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Sanitasi dan lap seluruh pegangan handle tangga dan handle pintu utama.",
      days: [1],
    },
    {
      name: "Pengelapan List Kayu",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap profil list kayu dinding koridor dan selasar lantai 1 & 2.",
      days: [1, 5],
    },
    {
      name: "Pembersihan Kaca Luar",
      category: TaskCategory.PERIODIK,
      area: "Dak Atas, Canopy & Luar",
      desc: "Bersihkan permukaan luar jendela kaca lantai 1 & lantai 2.",
      days: [1],
    },

    // SELASA (Day 2)
    {
      name: "Pengelapan Handle Pintu",
      category: TaskCategory.PERIODIK,
      area: "Lobby Utama & Kaca Masuk",
      desc: "Lap dan desinfeksi seluruh handle pintu ruang kerja dan ruangan meeting.",
      days: [2],
    },
    {
      name: "Pembersihan Pos Security",
      category: TaskCategory.PERIODIK,
      area: "Pos Security & Gerbang Pagar",
      desc: "Sapu, pel lantai pos jaga security, dan bersihkan kaca pos satpam.",
      days: [2],
    },
    {
      name: "Pengelapan Daun Gerbang Pagar",
      category: TaskCategory.PERIODIK,
      area: "Pos Security & Gerbang Pagar",
      desc: "Lap dan bersihkan debu/kotoran pada daun pintu gerbang besi utama.",
      days: [2],
    },
    {
      name: "Pengelapan Kaki-Kaki Kursi",
      category: TaskCategory.PERIODIK,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Pembersihan mendalam kaki-kaki kursi ruang meeting dan tamu.",
      days: [2],
    },
    {
      name: "Pembersihan Gradensa Dan Pohon Plastik",
      category: TaskCategory.PERIODIK,
      area: "Teras Balkon & Taman Tengah",
      desc: "Lap debu pada tanaman hias plastik, pot bunga, dan rak gradensa.",
      days: [2, 4],
    },

    // RABU (Day 3)
    {
      name: "Pengelapan Dinding Pintu",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap kusen dan dinding sekitar pintu dari noda/debu yang menempel.",
      days: [3],
    },
    {
      name: "Pembersihan Area Tempat Wudhu Lt. 1 & 2",
      category: TaskCategory.PERIODIK,
      area: "Mushola & Tempat Wudhu",
      desc: "Sikat lantai tempat wudhu, bersihkan kran air, dan buang kotoran saluran air.",
      days: [3],
    },
    {
      name: "Pembersihan Dispenser Air",
      category: TaskCategory.PERIODIK,
      area: "Area Pantry & Dispenser",
      desc: "Kuras baki tetesan air dispenser, lap bodi dispenser, dan sanitasi kran.",
      days: [3],
    },
    {
      name: "Pembersihan Batu Coral Taman",
      category: TaskCategory.PERIODIK,
      area: "Teras Balkon & Taman Tengah",
      desc: "Cuci dan tata rapi hamparan batu coral di area taman dalam/tengah.",
      days: [3],
    },

    // KAMIS (Day 4)
    {
      name: "Pengelapan Lemari File & Arsip",
      category: TaskCategory.PERIODIK,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap bagian luar lemari dokumen dan rak arsip kantor staff.",
      days: [4],
    },
    {
      name: "Pembersihan Dak Lantai Atap",
      category: TaskCategory.PERIODIK,
      area: "Dak Atas, Canopy & Luar",
      desc: "Sapu lantai dak atas dan bersihkan saluran drainase dari sampah/daun kering.",
      days: [4],
    },

    // JUMAT (Day 5)
    {
      name: "Pembersihan Kaca Dalam Ruangan",
      category: TaskCategory.PERIODIK,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap kaca partisi ruangan meeting, pintu kaca dalam, dan jendela dalam.",
      days: [5],
    },
    {
      name: "Pengelapan Handle Tangga",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Sanitasi dan lap mendalam seluruh railing dan handle tangga utama.",
      days: [5],
    },
    {
      name: "Pembersihan Tabung APAR",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap debu tabung pemadam api (APAR) dan cek posisi pin pengaman.",
      days: [5],
    },

    // === C. KELOMPOK BERKALA (General Cleaning Mingguan - Khusus Hari Sabtu: Day 6) ===
    {
      name: "General Cleaning Toilet",
      category: TaskCategory.BERKALA,
      area: "Toilet Lt. 1 & Lt. 2",
      desc: "Deep cleaning dinding keramik, lantai, kloset, exhaust fan, dan desinfeksi total.",
      days: [6],
    },
    {
      name: "General Cleaning Mushola",
      category: TaskCategory.BERKALA,
      area: "Mushola & Tempat Wudhu",
      desc: "Pembersihan total karpet mushola, lap dinding, cuci mukena/sarung, dan wewangian.",
      days: [6],
    },
    {
      name: "Penyikatan Lantai Teras Balkon",
      category: TaskCategory.BERKALA,
      area: "Teras Balkon & Taman Tengah",
      desc: "Sikat lantai balkon lantai 2 dengan cairan pembersih lantai dan bilas bersih.",
      days: [6],
    },
    {
      name: "Penyikatan Lantai Teras Garasi & Gazebo",
      category: TaskCategory.BERKALA,
      area: "Garasi & Area Parkir Motor",
      desc: "Sikat noda minyak/debu pada lantai paving garasi samping dan gazebo santai.",
      days: [6],
    },
    {
      name: "Penyikatan Lantai Teras Lobby",
      category: TaskCategory.BERKALA,
      area: "Lobby Utama & Kaca Masuk",
      desc: "Penyikatan mendalam lantai granit luar dan selasar teras lobby utama.",
      days: [6],
    },
    {
      name: "Pembersihan Kaca Canopy",
      category: TaskCategory.BERKALA,
      area: "Dak Atas, Canopy & Luar",
      desc: "Cuci dan bersihkan permukaan kaca kanopi depan dari lumut/debu.",
      days: [6],
    },
    {
      name: "Penyikatan Lantai Tempat Wudhu",
      category: TaskCategory.BERKALA,
      area: "Mushola & Tempat Wudhu",
      desc: "Sikat kerak lumut dan bersihkan lantai serta dinding area tempat wudhu.",
      days: [6],
    },
    {
      name: "Pencucian Tempat-Tempat Sampah",
      category: TaskCategory.BERKALA,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Cuci dan sikat seluruh wadah tempat sampah kantor dengan sabun dan keringkan.",
      days: [6],
    },
  ];

  console.log(`📋 Memproses ${taskDefinitions.length} Master Tugas...`);

  // 5. Simpan Master Task & Jadwal (TaskSchedule)
  const today = new Date();
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(today);
  const [y, m, d] = dateStr.split("-").map(Number);
  const todayDate = new Date(Date.UTC(y, m - 1, d));
  const todayDayOfWeek = todayDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  let createdTasksCount = 0;
  let createdSchedulesCount = 0;
  let todayInstancesCount = 0;

  for (const t of taskDefinitions) {
    const areaId = areaMap.get(t.area);
    if (!areaId) {
      console.warn(`⚠️ Area tidak ditemukan untuk tugas: ${t.name} (Area: ${t.area})`);
      continue;
    }

    const createdTask = await prisma.task.create({
      data: {
        name: t.name,
        category: t.category,
        description: t.desc,
        areaId,
        active: true,
      },
    });
    createdTasksCount++;

    // Buat jadwal mingguan (Pool Terbuka: assignedTo = null)
    for (const dayOfWeek of t.days) {
      await prisma.taskSchedule.create({
        data: {
          taskId: createdTask.id,
          dayOfWeek,
          assignedTo: null, // Open pool for all OBs
          active: true,
        },
      });
      createdSchedulesCount++;
    }

    // Jika jadwal tugas aktif hari ini (atau jika hari ini Minggu, generate jadwal Senin untuk testing)
    const effectiveTodayDay = todayDayOfWeek === 0 ? 1 : todayDayOfWeek;
    if (t.days.includes(effectiveTodayDay)) {
      await prisma.taskInstance.create({
        data: {
          taskId: createdTask.id,
          assignedUserId: obBudi.id, // Default placeholder until claimed
          scheduledDate: todayDate,
          status: TaskStatus.PENDING,
        },
      });
      todayInstancesCount++;
    }
  }

  console.log(`\n🎉 Migrasi Selesai Sukses!`);
  console.log(`   - Master Tugas: ${createdTasksCount} tugas`);
  console.log(`   - Jadwal Mingguan: ${createdSchedulesCount} jadwal`);
  console.log(`   - Tugas Aktif Hari Ini: ${todayInstancesCount} tugas di Pool Bersama`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
