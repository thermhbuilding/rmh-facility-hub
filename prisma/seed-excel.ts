import { PrismaClient, Role, TaskStatus, TaskCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Menyinkronkan dataset Excel 100% presisi (Rutinitas, Periodik, & Berkala)...");

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

  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPassword,
      name: "Administrator Sistem",
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
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

  await prisma.user.create({
    data: {
      username: "siti",
      passwordHash: obPassword,
      name: "Siti Rahma",
      role: Role.OB,
    },
  });

  console.log("👤 User default berhasil dibuat.");

  // 3. Master Area Gedung RMH
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

  // 4. Exact Dataset Sesuai Sheet Program Harian Excel
  const exactTaskDefinitions: Array<{
    name: string;
    category: TaskCategory;
    area: string;
    desc: string;
    days: number[]; // 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
  }> = [
    // --- RUTINITAS (Harian Umum: Senin s/d Jumat) ---
    {
      name: "Pengecekan dan pembersihan Mushola",
      category: TaskCategory.RUTINITAS,
      area: "Mushola & Tempat Wudhu",
      desc: "Vacuum karpet sajadah, rapikan mukena/sarung, dan bersihkan area sholat.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pengecekan dan pembersihan Toilet",
      category: TaskCategory.RUTINITAS,
      area: "Toilet Lt. 1 & Lt. 2",
      desc: "Sikat kloset, bersihkan wastafel, lap cermin, isi ulang sabun, dan pel lantai.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Loby",
      category: TaskCategory.RUTINITAS,
      area: "Lobby Utama & Kaca Masuk",
      desc: "Sapu dan pel lantai granit lobby utama serta jaga kebersihan ruang tunggu tamu.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Meja Meja Kantor",
      category: TaskCategory.RUTINITAS,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap permukaan meja kerja staff, bersihkan dari debu tanpa menggeser dokumen penting.",
      days: [1, 2, 3, 4, 5],
    },
    {
      name: "Pembersihan Kaca Loby",
      category: TaskCategory.RUTINITAS,
      area: "Lobby Utama & Kaca Masuk",
      desc: "Lap kaca pintu masuk dan dinding kaca lobby agar bebas dari sidik jari/debu.",
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

    // --- RUTINITAS BERGILIR (Harian Tertentu Sesuai Tabel Excel) ---
    {
      name: "Pembersihan Anak Tangga",
      category: TaskCategory.RUTINITAS,
      area: "Tangga, Selasar & List Kayu",
      desc: "Sapu dan pel setiap anak tangga penghubung lantai 1 dan lantai 2.",
      days: [1], // Hanya Senin
    },
    {
      name: "Pembersihan Area Pantry",
      category: TaskCategory.RUTINITAS,
      area: "Area Pantry & Dispenser",
      desc: "Bersihkan wastafel cuci piring, lap meja makan dapur, dan rapikan peralatan pantry.",
      days: [2], // Hanya Selasa
    },
    {
      name: "Pembersihan Teras Taman Tengah",
      category: TaskCategory.RUTINITAS,
      area: "Teras Balkon & Taman Tengah",
      desc: "Sapu area taman tengah dan rapikan daun-daun kering.",
      days: [3], // Hanya Rabu
    },
    {
      name: "Pembersihan Tanaman Plastik dan gradensa",
      category: TaskCategory.RUTINITAS,
      area: "Teras Balkon & Taman Tengah",
      desc: "Lap debu pada tanaman hias plastik, pot bunga, dan rak gradensa.",
      days: [4], // Hanya Kamis
    },
    {
      name: "Pembersihan Sawang Laba laba",
      category: TaskCategory.RUTINITAS,
      area: "Tangga, Selasar & List Kayu",
      desc: "Bersihkan sarang laba-laba di sudut plafon, tangga, dan ventilasi udara.",
      days: [1, 5], // Senin & Jumat
    },

    // --- PERIODIK (Tugas Perawatan Khusus Harian) ---
    // SENIN
    {
      name: "Pembersihan Kaki Kursi",
      category: TaskCategory.PERIODIK,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap dan bersihkan debu pada rangka dan roda kaki-kaki kursi kerja staff.",
      days: [1],
    },
    {
      name: "Pengelapan Handle Tangga Dan Pintu",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Sanitasi dan lap pegangan handle tangga dan handle pintu utama.",
      days: [1],
    },
    {
      name: "Pengelapan List Kayu",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap profil list kayu dinding koridor dan selasar lantai 1 & 2.",
      days: [1],
    },
    {
      name: "Pembersihan Kaca Luar",
      category: TaskCategory.PERIODIK,
      area: "Dak Atas, Canopy & Luar",
      desc: "Bersihkan permukaan luar jendela kaca lantai 1 & lantai 2.",
      days: [1],
    },

    // SELASA
    {
      name: "Pengelapaan Handle Pintu",
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
      name: "Pengelapan Kaki Kaki Kursi",
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
      days: [2],
    },

    // RABU
    {
      name: "Pengelapan Diding Pintu",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap kusen dan dinding sekitar pintu dari noda/debu yang menempel.",
      days: [3],
    },
    {
      name: "Pembersihan Area Tempat Wudhu lt 1&2",
      category: TaskCategory.PERIODIK,
      area: "Mushola & Tempat Wudhu",
      desc: "Sikat lantai tempat wudhu, bersihkan kran air, dan buang kotoran saluran air.",
      days: [3],
    },
    {
      name: "Pembersihan Dispenser",
      category: TaskCategory.PERIODIK,
      area: "Area Pantry & Dispenser",
      desc: "Kuras baki tetesan air dispenser, lap bodi dispenser, dan sanitasi kran.",
      days: [3],
    },
    {
      name: "Pembersihan Batu Coral",
      category: TaskCategory.PERIODIK,
      area: "Teras Balkon & Taman Tengah",
      desc: "Cuci dan tata rapi hamparan batu coral di area taman dalam/tengah.",
      days: [3],
    },

    // KAMIS
    {
      name: "Pengelapan Lemari File",
      category: TaskCategory.PERIODIK,
      area: "Ruang Kerja Staff & Meja Kantor",
      desc: "Lap bagian luar lemari dokumen dan rak arsip kantor staff.",
      days: [4],
    },
    {
      name: "Pembersihan Dak",
      category: TaskCategory.PERIODIK,
      area: "Dak Atas, Canopy & Luar",
      desc: "Sapu lantai dak atas dan bersihkan saluran drainase dari sampah/daun kering.",
      days: [4],
    },
    {
      name: "Pembersihan Teras Balkon (Periodik)",
      category: TaskCategory.PERIODIK,
      area: "Teras Balkon & Taman Tengah",
      desc: "Perawatan periodik mendalam pada lantai dan railing teras balkon.",
      days: [4],
    },

    // JUMAT
    {
      name: "Pembersihan Kaca Dalam",
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
      name: "Pembersihan Apar",
      category: TaskCategory.PERIODIK,
      area: "Tangga, Selasar & List Kayu",
      desc: "Lap debu tabung pemadam api (APAR) dan cek posisi pin pengaman.",
      days: [5],
    },

    // --- BERKALA (General Cleaning Mingguan - Khusus Hari Sabtu: Day 6) ---
    {
      name: "General cleaning Toilet",
      category: TaskCategory.BERKALA,
      area: "Toilet Lt. 1 & Lt. 2",
      desc: "Deep cleaning dinding keramik, lantai, kloset, exhaust fan, dan desinfeksi total.",
      days: [6],
    },
    {
      name: "General Clening Mushola",
      category: TaskCategory.BERKALA,
      area: "Mushola & Tempat Wudhu",
      desc: "Pembersihan total karpet mushola, lap dinding, cuci mukena/sarung, dan wewangian.",
      days: [6],
    },
    {
      name: "Peyikatan lantai teras balkon",
      category: TaskCategory.BERKALA,
      area: "Teras Balkon & Taman Tengah",
      desc: "Sikat lantai balkon lantai 2 dengan cairan pembersih lantai dan bilas bersih.",
      days: [6],
    },
    {
      name: "Penyikatan lantai Teras Garasi",
      category: TaskCategory.BERKALA,
      area: "Garasi & Area Parkir Motor",
      desc: "Sikat noda minyak/debu pada lantai paving garasi samping dan gazebo santai.",
      days: [6],
    },
    {
      name: "Penyikatan lantai teras loby",
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
      name: "Penyikatan Lantai tempat Wudhu",
      category: TaskCategory.BERKALA,
      area: "Mushola & Tempat Wudhu",
      desc: "Sikat kerak lumut dan bersihkan lantai serta dinding area tempat wudhu.",
      days: [6],
    },
  ];

  console.log(`📋 Memproses ${exactTaskDefinitions.length} Master Tugas...`);

  // 5. Simpan Master Task & Jadwal (TaskSchedule)
  const today = new Date();
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(today);
  const [y, m, d] = dateStr.split("-").map(Number);
  const todayDate = new Date(Date.UTC(y, m - 1, d));
  const todayDayOfWeek = todayDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat

  let createdTasksCount = 0;
  let createdSchedulesCount = 0;
  let todayInstancesCount = 0;

  const effectiveTodayDay = todayDayOfWeek === 0 ? 1 : todayDayOfWeek;

  for (const t of exactTaskDefinitions) {
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

    // Jika jadwal tugas aktif hari ini (4 = Kamis):
    if (t.days.includes(effectiveTodayDay)) {
      await prisma.taskInstance.create({
        data: {
          taskId: createdTask.id,
          assignedUserId: obBudi.id, // Placeholder until claimed
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
  console.log(`   - Tugas Aktif Hari Ini (Day ${effectiveTodayDay}): ${todayInstancesCount} tugas di Pool Bersama`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
