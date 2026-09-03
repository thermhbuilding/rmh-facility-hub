"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Printer,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Sparkles,
  Layers,
  MapPin,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  X
} from "lucide-react";

interface ReportTask {
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
  photos: Array<{ id: string; type: "BEFORE" | "AFTER"; path: string }>;
  findings: Array<{ id: string; description: string; severity: string }>;
}

export default function SupervisorReportsPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
  });

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    metrics: {
      total: number;
      verified: number;
      submitted: number;
      inProgress: number;
      pending: number;
      revision: number;
      totalFindings: number;
      completionRate: number;
    };
    tasks: ReportTask[];
  } | null>(null);

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fetchReport = async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/supervisor/reports?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        alert("Gagal memuat laporan.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split("T")[0];
    setSelectedDate(newDateStr);
  };

  const getFormattedDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  };

  const renderStatusBadge = (status: ReportTask["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
            Belum Mulai
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
            Berjalan
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
            Menunggu Review
          </span>
        );
      case "VERIFIED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
            ✓ Selesai & Valid
          </span>
        );
      case "REVISION_REQUIRED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
            Perlu Revisi
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-blue-100 print:bg-white">
      {/* Top Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/supervisor/dashboard")}
            className="flex items-center space-x-1 text-xs text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Monitoring</span>
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <span className="text-xs font-bold text-slate-300">Laporan & Rekapitulasi Harian</span>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1 space-y-6 print:p-0 print:max-w-full">
        {/* Date Filter & Report Title Header */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <Building2 className="w-5 h-5 text-blue-900" />
              <h1 className="text-xl font-black tracking-tight">GEDUNG RMH — LAPORAN PROGRAM HARIAN</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Rekapitulasi operasional kebersihan & pemeliharaan fasilitas harian.
            </p>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden print:block text-right">
            <span className="text-xs font-bold text-slate-700">Tanggal Laporan:</span>
            <p className="text-sm font-black text-slate-900">{getFormattedDate(selectedDate)}</p>
          </div>
        </section>

        {/* Selected Date Banner */}
        <div className="flex items-center justify-between bg-blue-950 text-white px-5 py-3 rounded-xl shadow-xs print:hidden">
          <div className="flex items-center space-x-2 text-xs">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Menampilkan Laporan Tanggal:</span>
            <span className="font-bold text-blue-200">{getFormattedDate(selectedDate)}</span>
          </div>
          <span className="text-xs font-bold bg-blue-800/80 px-2.5 py-1 rounded-md">
            Ketercapaian: {reportData?.metrics.completionRate || 0}%
          </span>
        </div>

        {/* KPI Metrics Cards */}
        {reportData && (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Tugas</span>
              <p className="text-xl font-black text-slate-900 mt-1">{reportData.metrics.total}</p>
            </div>
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Terverifikasi</span>
              <p className="text-xl font-black text-emerald-800 mt-1">{reportData.metrics.verified}</p>
            </div>
            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-200 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Review SPV</span>
              <p className="text-xl font-black text-purple-800 mt-1">{reportData.metrics.submitted}</p>
            </div>
            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Sedang Berjalan</span>
              <p className="text-xl font-black text-blue-800 mt-1">{reportData.metrics.inProgress}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Belum Dimulai</span>
              <p className="text-xl font-black text-slate-700 mt-1">{reportData.metrics.pending}</p>
            </div>
            <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Temuan Kendala</span>
              <p className="text-xl font-black text-amber-800 mt-1">{reportData.metrics.totalFindings}</p>
            </div>
          </section>
        )}

        {/* Detailed Activity Table */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden print:border print:shadow-none">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rincian Hasil Pekerjaan Pelaksana (OB)
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Total {reportData?.tasks.length || 0} Baris Kegiatan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">No</th>
                  <th className="p-3">Program / Pekerjaan</th>
                  <th className="p-3">Area Gedung</th>
                  <th className="p-3">Pelaksana (OB)</th>
                  <th className="p-3">Waktu Pelaksanaan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Bukti Foto</th>
                  <th className="p-3">Temuan Kendala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-900" />
                      Memuat laporan...
                    </td>
                  </tr>
                ) : !reportData || reportData.tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                      Tidak ada data kegiatan yang tercatat pada tanggal ini.
                    </td>
                  </tr>
                ) : (
                  reportData.tasks.map((t, idx) => {
                    const before = t.photos.find((p) => p.type === "BEFORE");
                    const after = t.photos.find((p) => p.type === "AFTER");

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span>{t.task.name}</span>
                            {t.task.category === "RUTINITAS" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                Rutinitas
                              </span>
                            )}
                            {t.task.category === "PERIODIK" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                Periodik
                              </span>
                            )}
                            {t.task.category === "BERKALA" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                                Berkala
                              </span>
                            )}
                          </div>
                          {t.revisionNote && (
                            <p className="text-[10px] text-rose-700 font-normal mt-0.5">
                              Revisi: &ldquo;{t.revisionNote}&rdquo;
                            </p>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 font-semibold">{t.task.area.name}</td>
                        <td className="p-3">
                          {t.status === "PENDING" ? (
                            <span className="text-slate-400 text-xs italic">Belum Diambil (Pool Terbuka)</span>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900 block">{t.assignedUser?.name || "-"}</span>
                              <span className="text-[10px] text-slate-500">@{t.assignedUser?.username}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <div>
                            Mulai:{" "}
                            {t.startedAt
                              ? new Date(t.startedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                              : "-"}
                          </div>
                          <div>
                            Selesai:{" "}
                            {t.submittedAt
                              ? new Date(t.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                              : "-"}
                          </div>
                        </td>
                        <td className="p-3">{renderStatusBadge(t.status)}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            {before ? (
                              <img
                                src={before.path}
                                alt="Before"
                                onClick={() => setPreviewPhoto(before.path)}
                                className="w-8 h-8 rounded object-cover border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                                title="Foto Sebelum (Klik untuk perbesar)"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                            {after ? (
                              <img
                                src={after.path}
                                alt="After"
                                onClick={() => setPreviewPhoto(after.path)}
                                className="w-8 h-8 rounded object-cover border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                                title="Foto Sesudah (Klik untuk perbesar)"
                              />
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3">
                          {t.findings?.length > 0 ? (
                            <div className="space-y-1">
                              {t.findings.map((f) => (
                                <span
                                  key={f.id}
                                  className="inline-block bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]"
                                >
                                  ⚠️ {f.description} ({f.severity})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures for Print View */}
          <div className="hidden print:grid grid-cols-2 gap-8 p-8 pt-12 text-center text-xs">
            <div>
              <p className="font-semibold text-slate-700">Dibuat Oleh (Pelaksana Lapangan),</p>
              <div className="h-20"></div>
              <p className="font-bold border-t border-slate-400 pt-1 inline-block min-w-[150px]">
                Pelaksana Tugas (OB)
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Mengetahui & Memverifikasi,</p>
              <div className="h-20"></div>
              <p className="font-bold border-t border-slate-400 pt-1 inline-block min-w-[150px]">
                Supervisor / Building Manager
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative max-w-xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 bg-slate-900/70 text-white p-1.5 rounded-full hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhoto} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
