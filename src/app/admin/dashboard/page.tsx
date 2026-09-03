"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  MapPin,
  ClipboardList,
  Plus,
  LogOut,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Calendar
} from "lucide-react";

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "SUPERVISOR" | "OB";
  active: boolean;
  createdAt: string;
}

interface AreaItem {
  id: string;
  name: string;
  description: string | null;
  _count?: { Tasks: number };
}

interface TaskItem {
  id: string;
  name: string;
  category?: "RUTINITAS" | "PERIODIK" | "BERKALA";
  description: string | null;
  areaId: string;
  area: { name: string };
  schedules: Array<{ id: string; dayOfWeek: number; assignedTo: string | null }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"USERS" | "AREAS" | "TASKS">("USERS");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [users, setUsers] = useState<UserItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Create Modals
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", name: "", password: "", role: "OB" });

  const [showAddArea, setShowAddArea] = useState(false);
  const [newArea, setNewArea] = useState({ name: "", description: "" });

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState<{
    name: string;
    category: "RUTINITAS" | "PERIODIK" | "BERKALA";
    description: string;
    areaId: string;
  }>({
    name: "",
    category: "RUTINITAS",
    description: "",
    areaId: "",
  });

  // Edit Modals
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserPassword, setEditUserPassword] = useState("");

  const [editingArea, setEditingArea] = useState<AreaItem | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      if (userData.user?.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      const [usersRes, areasRes, tasksRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/areas"),
        fetch("/api/admin/tasks"),
      ]);

      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (areasRes.ok) setAreas((await areasRes.json()).areas || []);
      if (tasksRes.ok) setTasks((await tasksRes.json()).tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // --- CREATE HANDLERS ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setShowAddUser(false);
        setNewUser({ username: "", name: "", password: "", role: "OB" });
        await fetchAllData();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal menambah pengguna.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArea),
      });
      if (res.ok) {
        setShowAddArea(false);
        setNewArea({ name: "", description: "" });
        await fetchAllData();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal menambah area.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setShowAddTask(false);
        setNewTask({ name: "", category: "RUTINITAS", description: "", areaId: "" });
        await fetchAllData();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal menambah tugas.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EDIT HANDLERS ---
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          username: editingUser.username,
          password: editUserPassword || undefined,
          role: editingUser.role,
          active: editingUser.active,
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        setEditUserPassword("");
        await fetchAllData();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal mengupdate pengguna.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/areas/${editingArea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingArea.name,
          description: editingArea.description,
        }),
      });
      if (res.ok) {
        setEditingArea(null);
        await fetchAllData();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal mengupdate area.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingTask.name,
          category: editingTask.category || "RUTINITAS",
          description: editingTask.description,
          areaId: editingTask.areaId,
        }),
      });
      if (res.ok) {
        setEditingTask(null);
        await fetchAllData();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal mengupdate tugas.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE HANDLERS ---
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus pengguna.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteArea = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus area "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/areas/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus area.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus program tugas "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menghapus tugas.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const obUsers = users.filter((u) => u.role === "OB");

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-blue-100">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              RMH Facility Hub
            </h1>
            <span className="text-xs text-slate-400 font-medium">Administrator Control Panel</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-rose-900/40 hover:text-rose-300 hover:border-rose-500/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1 space-y-6">
        {/* KPI Header Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
              <span className="text-[11px] text-slate-500">{obUsers.length} OB / Pelaksana Aktif</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Master Area Gedung</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{areas.length}</p>
              <span className="text-[11px] text-slate-500">Ruangan/Zona terdaftar</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Master Program Kerja</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{tasks.length}</p>
              <span className="text-[11px] text-slate-500">Tugas harian asli Excel</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/70 px-4">
            <button
              onClick={() => setActiveTab("USERS")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === "USERS"
                  ? "border-blue-900 text-blue-900 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kelola Pengguna ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("AREAS")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === "AREAS"
                  ? "border-blue-900 text-blue-900 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Master Area ({areas.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("TASKS")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === "TASKS"
                  ? "border-blue-900 text-blue-900 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Program Tugas Harian ({tasks.length})</span>
            </button>
          </div>

          {/* TAB 1: USERS */}
          {activeTab === "USERS" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daftar Akun Pengguna</h3>
                  <p className="text-xs text-slate-500">Kelola akun Admin, Supervisor, dan Pelaksana (OB).</p>
                </div>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="bg-blue-950 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-900 flex items-center space-x-1.5 shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengguna</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Peran (Role)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{u.name}</td>
                        <td className="p-3 font-mono text-slate-600">@{u.username}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : u.role === "SUPERVISOR"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.active ? (
                            <span className="text-emerald-700 flex items-center font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aktif
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center">
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditUserPassword("");
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AREAS */}
          {activeTab === "AREAS" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Master Data Area Gedung RMH</h3>
                  <p className="text-xs text-slate-500">Daftar ruangan dan zona lokasi operasional Gedung RMH.</p>
                </div>
                <button
                  onClick={() => setShowAddArea(true)}
                  className="bg-blue-950 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-900 flex items-center space-x-1.5 shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Area</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {areas.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{a.name}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingArea(a)}
                            className="p-1 text-slate-400 hover:text-blue-900 rounded"
                            title="Edit Area"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteArea(a.id, a.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Hapus Area"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        {a.description || "Tidak ada deskripsi rincian area."}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded w-fit">
                      {a._count?.Tasks || 0} Tugas Terkait
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TASKS */}
          {activeTab === "TASKS" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Master Program Kerja Harian ({tasks.length} Tugas)</h3>
                  <p className="text-xs text-slate-500">Definisi pekerjaan rutin sesuai sheet Program Harian Excel.</p>
                </div>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-blue-950 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-900 flex items-center space-x-1.5 shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tugas Baru</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {tasks.map((t, idx) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                    <div className="flex items-start space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{t.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {t.area.name}
                          </span>
                          {t.category === "RUTINITAS" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                              Rutinitas
                            </span>
                          )}
                          {t.category === "PERIODIK" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              Periodik
                            </span>
                          )}
                          {t.category === "BERKALA" && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                              Berkala / Sabtu
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                      <span className="text-[11px] text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        🌐 Pool Bersama (Semua OB)
                      </span>
                      <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        🗓️ {t.schedules?.length || 0} Hari / Minggu
                      </span>
                      <button
                        onClick={() => setEditingTask(t)}
                        className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded"
                        title="Edit Tugas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(t.id, t.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* --- MODAL EDIT USER --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdateUser} className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Edit Pengguna</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                value={editingUser.username}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ganti Password (Kosongkan jika tidak diubah)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role)</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="OB">Pelaksana (OB)</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="userActive"
                checked={editingUser.active}
                onChange={(e) => setEditingUser({ ...editingUser, active: e.target.checked })}
                className="rounded text-blue-900"
              />
              <label htmlFor="userActive" className="text-xs font-semibold text-slate-700">Akun Aktif</label>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-950 text-white text-xs font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL EDIT AREA --- */}
      {editingArea && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdateArea} className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Edit Area Gedung</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Area</label>
              <input
                type="text"
                required
                value={editingArea.name}
                onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Keterangan</label>
              <textarea
                rows={3}
                value={editingArea.description || ""}
                onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingArea(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-950 text-white text-xs font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL EDIT TASK --- */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleUpdateTask} className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Edit Program Tugas</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tugas</label>
              <input
                type="text"
                required
                value={editingTask.name}
                onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area Lokasi</label>
              <select
                required
                value={editingTask.areaId}
                onChange={(e) => setEditingTask({ ...editingTask, areaId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Program Kerja</label>
              <select
                value={editingTask.category || "RUTINITAS"}
                onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="RUTINITAS">Rutinitas (Setiap Hari Senin - Jumat)</option>
                <option value="PERIODIK">Periodik (Hari Khusus Bergantian)</option>
                <option value="BERKALA">Berkala (General Cleaning Sabtu)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi Kerja</label>
              <textarea
                rows={2}
                value={editingTask.description || ""}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-950 text-white text-xs font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- CREATE MODALS --- */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Pengguna Baru</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                placeholder="Contoh: Rian Hidayat"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="Contoh: rian"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role)</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="OB">Pelaksana (OB)</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-950 text-white text-xs font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddArea && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateArea} className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Area Baru</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Area</label>
              <input
                type="text"
                required
                placeholder="Contoh: Rooftop & Ruang Mesin"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Keterangan</label>
              <textarea
                rows={3}
                placeholder="Contoh: Area lantai atap dan akses instalasi chiller AC."
                value={newArea.description}
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddArea(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-950 text-white text-xs font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Area"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Program Tugas Harian</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tugas</label>
              <input
                type="text"
                required
                placeholder="Contoh: Pembersihan Kaca Tangga Darurat"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area Lokasi</label>
              <select
                required
                value={newTask.areaId}
                onChange={(e) => setNewTask({ ...newTask, areaId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">-- Pilih Area Gedung --</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Program Kerja</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="RUTINITAS">Rutinitas (Setiap Hari Senin - Jumat)</option>
                <option value="PERIODIK">Periodik (Hari Khusus Bergantian)</option>
                <option value="BERKALA">Berkala (General Cleaning Sabtu)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi Kerja</label>
              <textarea
                rows={2}
                placeholder="Instruksi detail untuk OB saat membersihkan."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-950 text-white text-xs font-semibold rounded-lg hover:bg-blue-900 disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Tugas"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
