"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  LogOut,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Calendar,
  Layers,
  UserCheck
} from "lucide-react";

interface TaskItem {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "VERIFIED" | "REVISION_REQUIRED";
  scheduledDate: string;
  startedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  revisionNote?: string;
  task: {
    name: string;
    category?: "RUTINITAS" | "PERIODIK" | "BERKALA";
    description: string;
    area: {
      name: string;
    };
  };
  assignedUser: {
    name: string;
    username: string;
  };
  photos: Array<{ id: string; type: "BEFORE" | "AFTER"; path: string; capturedAt: string }>;
  findings: Array<{ id: string; description: string; severity: string }>;
  verifiedBy?: {
    name: string;
  };
}

export default function SupervisorDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [userName, setUserName] = useState<string>("Supervisor");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setUserName(userData.user?.name || "Supervisor");

      const res = await fetch("/api/supervisor/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    if (!selectedTask) return;
    if (action === "REJECT" && !revisionReason.trim()) {
      alert("Harap masukkan alasan perbaikan!");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/supervisor/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInstanceId: selectedTask.id,
          action,
          revisionNote: revisionReason,
        }),
      });

      if (res.ok) {
        setSelectedTask(null);
        setRevisionReason("");
        await fetchTasks();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal memproses verifikasi.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala jaringan.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    submitted: tasks.filter((t) => t.status === "SUBMITTED").length,
    verified: tasks.filter((t) => t.status === "VERIFIED").length,
    revision: tasks.filter((t) => t.status === "REVISION_REQUIRED").length,
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;
    const matchesSearch =
      task.task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task.area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedUser.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const renderStatusBadge = (status: TaskItem["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 mr-1 text-slate-500" />
            Belum Dimulai
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <PlayCircle className="w-3 h-3 mr-1 text-blue-500" />
            Sedang Dikerjakan
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
            <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
            Menunggu Verifikasi
          </span>
        );
      case "VERIFIED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Terverifikasi
          </span>
        );
      case "REVISION_REQUIRED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
            Perlu Perbaikan
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-blue-100">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              RMH Facility Hub
            </h1>
            <span className="text-xs text-slate-500 font-medium">Supervisor Control Center</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/supervisor/reports")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-xs font-semibold shadow-2xs transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Rekap & Laporan Harian</span>
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{userName}</p>
            <p className="text-[11px] text-slate-500">Supervisor Gedung RMH</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1 space-y-6">
        {/* KPI / Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tugas</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.total}</p>
            <p className="text-[11px] text-slate-500 mt-1">Seluruh pekerjaan hari ini</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Belum Mulai</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.pending}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-1">Pending pelaksana</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sedang Dikerjakan</span>
              <PlayCircle className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-blue-700 mt-2">{stats.inProgress}</p>
            <p className="text-[11px] text-blue-600 font-medium mt-1">In progress lapangan</p>
          </div>

          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Menunggu Review</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-800 mt-2">{stats.submitted}</p>
            <p className="text-[11px] text-purple-700 font-medium mt-1">Perlu tindakan verifikasi</p>
          </div>

          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Selesai & Valid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-800 mt-2">{stats.verified}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Pekerjaan terverifikasi</p>
          </div>
        </section>

        {/* Task Monitoring Table & Filter */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari tugas, area, atau OB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none w-64"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Belum Dimulai</option>
                <option value="IN_PROGRESS">Sedang Dikerjakan</option>
                <option value="SUBMITTED">Menunggu Verifikasi</option>
                <option value="VERIFIED">Terverifikasi</option>
                <option value="REVISION_REQUIRED">Perlu Revisi</option>
              </select>
            </div>

            <button
              onClick={fetchTasks}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Perbarui Data</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tugas & Area</th>
                  <th className="py-3 px-4">Pelaksana (OB)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bukti Foto</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Tidak ada tugas yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-slate-900 text-sm">{t.task.name}</p>
                          {t.task.category === "RUTINITAS" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                              Rutinitas
                            </span>
                          )}
                          {t.task.category === "PERIODIK" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                              Periodik
                            </span>
                          )}
                          {t.task.category === "BERKALA" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 shrink-0">
                              Berkala / Sabtu
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{t.task.area.name}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {t.status === "PENDING" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Tersedia (Pool Terbuka)
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px] flex items-center justify-center border border-blue-200 shrink-0">
                              {t.assignedUser?.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">
                                {t.assignedUser?.name || "-"}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                @{t.assignedUser?.username}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{renderStatusBadge(t.status)}</td>
                      <td className="py-3.5 px-4">
                        {t.photos?.length > 0 ? (
                          <span className="inline-flex items-center text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            📷 {t.photos.length} Foto
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {t.status === "SUBMITTED" ? (
                          <button
                            onClick={() => setSelectedTask(t)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-950 text-white font-semibold rounded-lg text-xs hover:bg-blue-900 shadow-2xs active:scale-95 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Periksa (Review)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedTask(t)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-200 text-slate-700 font-medium rounded-lg text-xs hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Verification / Review Modal Dialog */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedTask.task.name}</h3>
                <p className="text-xs text-slate-400">
                  Area: {selectedTask.task.area.name} &bull; Pelaksana: {selectedTask.assignedUser.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Worker & Verification Identity Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Petugas Pelaksana (OB)
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedTask.status === "PENDING"
                      ? "Belum Diambil (Pool Terbuka)"
                      : selectedTask.assignedUser?.name || "Petugas Lapangan"}
                  </p>
                </div>
                {selectedTask.verifiedBy && (
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Diverifikasi Oleh
                    </span>
                    <p className="font-semibold text-emerald-800 text-xs mt-0.5">
                      {selectedTask.verifiedBy.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Status & Timing Details */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <div className="mt-1">{renderStatusBadge(selectedTask.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Mulai</span>
                  <p className="font-semibold text-slate-800 mt-1">
                    {selectedTask.startedAt
                      ? new Date(selectedTask.startedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Dikirim</span>
                  <p className="font-semibold text-slate-800 mt-1">
                    {selectedTask.submittedAt
                      ? new Date(selectedTask.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Before and After Photo Inspection (Core PRD #10 & #13) */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Inspeksi Foto Before & After
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Before Photo */}
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      FOTO SEBELUM (BEFORE)
                    </span>
                    {selectedTask.photos?.find((p) => p.type === "BEFORE") ? (
                      <img
                        src={selectedTask.photos.find((p) => p.type === "BEFORE")?.path}
                        alt="Before"
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs">
                        Tidak ada foto before
                      </div>
                    )}
                  </div>

                  {/* After Photo */}
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      FOTO SESUDAH (AFTER)
                    </span>
                    {selectedTask.photos?.find((p) => p.type === "AFTER") ? (
                      <img
                        src={selectedTask.photos.find((p) => p.type === "AFTER")?.path}
                        alt="After"
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs">
                        Tidak ada foto after
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Revision note input if supervisor wants to reject */}
              {selectedTask.status === "SUBMITTED" && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Catatan Perbaikan (Wajib diisi jika meminta revisi)
                  </label>
                  <textarea
                    rows={2}
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="Contoh: Kaca bagian atas masih berdebu, tolong dilap ulang."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100"
              >
                Tutup
              </button>

              {selectedTask.status === "SUBMITTED" && (
                <>
                  <button
                    disabled={isSubmittingReview}
                    onClick={() => handleReview("REJECT")}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 flex items-center space-x-1 disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Minta Perbaikan (Revisi)</span>
                  </button>

                  <button
                    disabled={isSubmittingReview}
                    onClick={() => handleReview("APPROVE")}
                    className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 flex items-center space-x-1 disabled:opacity-60 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Verifikasi & Setujui</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
