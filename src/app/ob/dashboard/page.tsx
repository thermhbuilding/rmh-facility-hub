"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  LogOut,
  MapPin,
  ClipboardList,
  Sparkles,
  ChevronRight,
  RefreshCw,
  User,
  History,
  Home
} from "lucide-react";

interface TaskItem {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "VERIFIED" | "REVISION_REQUIRED";
  scheduledDate: string;
  startedAt?: string;
  task: {
    name: string;
    description: string;
    area: {
      name: string;
    };
  };
  photos: Array<{ id: string; type: string; path: string }>;
  findings: Array<{ id: string; description: string; severity: string }>;
}

export default function OBDashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [userName, setUserName] = useState<string>("Pelaksana");
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // Check auth profile
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setUserName(userData.user?.name || "Pelaksana");

      // Fetch today tasks
      const res = await fetch("/api/ob/tasks");
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

  const getTodayFormatted = () => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    submitted: tasks.filter((t) => t.status === "SUBMITTED").length,
    verified: tasks.filter((t) => t.status === "VERIFIED").length,
  };

  const renderStatusBadge = (status: TaskItem["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Belum Dikerjakan
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <PlayCircle className="w-3 h-3 mr-1" />
            Sedang Berjalan
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3 h-3 mr-1" />
            Menunggu Verifikasi
          </span>
        );
      case "VERIFIED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Terverifikasi
          </span>
        );
      case "REVISION_REQUIRED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Perlu Perbaikan
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center pb-24 font-sans selection:bg-blue-100">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl border-x border-slate-200 flex flex-col">
        {/* Mobile Header */}
        <header className="bg-slate-900 text-white px-5 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-100">RMH Facility Hub</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{getTodayFormatted()}</p>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                Halo, {userName} 👋
              </h2>
            </div>
            <button
              onClick={fetchTasks}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors active:scale-95"
              title="Refresh Tugas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Task Summary Metrics */}
        <section className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Ringkasan Tugas Hari Ini
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="block text-lg font-black text-slate-900">{stats.total}</span>
              <span className="text-[10px] font-semibold text-slate-500">Total</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-blue-200 text-center shadow-2xs">
              <span className="block text-lg font-black text-blue-700">{stats.inProgress}</span>
              <span className="text-[10px] font-semibold text-blue-600">Berjalan</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center shadow-2xs">
              <span className="block text-lg font-black text-purple-700">{stats.submitted}</span>
              <span className="text-[10px] font-semibold text-purple-600">Dikirim</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center shadow-2xs">
              <span className="block text-lg font-black text-emerald-700">{stats.verified}</span>
              <span className="text-[10px] font-semibold text-emerald-600">Selesai</span>
            </div>
          </div>
        </section>

        {/* Today's Tasks List */}
        <main className="p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Daftar Pekerjaan</h3>
            <span className="text-xs text-slate-500 font-medium">
              {tasks.filter((t) => t.status === "VERIFIED").length} dari {tasks.length} Selesai
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white animate-pulse space-y-2.5">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 mt-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Tidak ada tugas hari ini</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
                Semua pekerjaan terjadwal telah selesai atau belum ditugaskan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      {renderStatusBadge(item.status)}
                      <span className="text-[11px] font-semibold text-slate-400">
                        {item.photos?.length > 0 ? `📷 ${item.photos.length} Foto` : "Belum ada foto"}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.task.name}
                    </h4>

                    <div className="flex items-center text-xs text-slate-500 mt-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span className="truncate">{item.task.area.name}</span>
                    </div>

                    {item.task.description && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                        {item.task.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {item.status === "PENDING" && (
                      <button
                        onClick={() => router.push(`/ob/task/${item.id}`)}
                        className="w-full bg-blue-950 text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-900 flex items-center justify-center space-x-1.5 active:scale-[0.98] transition-all shadow-xs"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Mulai Tugas (Ambil Foto Before)</span>
                      </button>
                    )}

                    {item.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => router.push(`/ob/task/${item.id}`)}
                        className="w-full bg-blue-600 text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-1.5 active:scale-[0.98] transition-all shadow-xs"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Selesaikan (Ambil Foto After)</span>
                      </button>
                    )}

                    {item.status === "SUBMITTED" && (
                      <button
                        onClick={() => router.push(`/ob/task/${item.id}`)}
                        className="w-full text-center py-2 px-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-800 text-xs font-medium border border-purple-100 flex items-center justify-center transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                        <span>Menunggu Review (Lihat Detail)</span>
                      </button>
                    )}

                    {item.status === "VERIFIED" && (
                      <button
                        onClick={() => router.push(`/ob/task/${item.id}`)}
                        className="w-full text-center py-2 px-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-800 text-xs font-medium border border-emerald-100 flex items-center justify-center transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        <span>Selesai & Terverifikasi</span>
                      </button>
                    )}

                    {item.status === "REVISION_REQUIRED" && (
                      <button
                        onClick={() => router.push(`/ob/task/${item.id}`)}
                        className="w-full bg-rose-600 text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-rose-700 flex items-center justify-center space-x-1.5 active:scale-[0.98] transition-all"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Perbaiki Pekerjaan (Ada Catatan Revisi)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-around z-30 shadow-lg">
          <button className="flex flex-col items-center text-blue-950 font-bold">
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Tugas Hari Ini</span>
          </button>
          <button
            onClick={() => alert("Riwayat pekerjaan akan tersedia di menu ini.")}
            className="flex flex-col items-center text-slate-400 hover:text-slate-700 font-medium transition-colors"
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Riwayat</span>
          </button>
          <button
            onClick={() => alert("Profil pengguna.")}
            className="flex flex-col items-center text-slate-400 hover:text-slate-700 font-medium transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Profil</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
