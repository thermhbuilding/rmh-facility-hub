"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlayCircle,
  Sparkles,
  MapPin,
  Upload,
  RefreshCw,
  Send,
  Loader2,
  FileText,
  AlertTriangle
} from "lucide-react";

interface TaskDetail {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "VERIFIED" | "REVISION_REQUIRED";
  scheduledDate: string;
  startedAt?: string;
  submittedAt?: string;
  verifiedAt?: string;
  revisionNote?: string;
  task: {
    name: string;
    description: string;
    area: {
      name: string;
    };
  };
  photos: Array<{ id: string; type: "BEFORE" | "AFTER"; path: string }>;
  findings: Array<{ id: string; description: string; severity: "LOW" | "MEDIUM" | "HIGH" }>;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingType, setUploadingType] = useState<"BEFORE" | "AFTER" | null>(null);

  // Findings state
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingDesc, setFindingDesc] = useState("");
  const [findingSeverity, setFindingSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/ob/task/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      } else {
        alert("Tugas tidak ditemukan.");
        router.push("/ob/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) fetchTask();
  }, [taskId]);

  const handleStartTask = async () => {
    setIsStarting(true);
    try {
      const res = await fetch(`/api/ob/task/${taskId}/start`, { method: "POST" });
      if (res.ok) {
        await fetchTask();
      } else {
        alert("Gagal memulai tugas.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "BEFORE" | "AFTER") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("type", type);

    try {
      const res = await fetch(`/api/ob/task/${taskId}/photo`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchTask();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengunggah foto.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat upload foto.");
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmitTask = async () => {
    const beforePhoto = task?.photos.find((p) => p.type === "BEFORE");
    const afterPhoto = task?.photos.find((p) => p.type === "AFTER");

    if (!beforePhoto) {
      alert("Wajib mengambil Foto Sebelum (Before) terlebih dahulu!");
      return;
    }
    if (!afterPhoto) {
      alert("Wajib mengambil Foto Sesudah (After) terlebih dahulu!");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menyelesaikan dan mengirim tugas ini ke Supervisor?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/ob/task/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingDescription: findingDesc,
          findingSeverity,
        }),
      });

      if (res.ok) {
        alert("Tugas berhasil dikirim ke Supervisor!");
        router.push("/ob/dashboard");
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengirim tugas.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat mengirim tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !task) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Memuat rincian tugas...</p>
        </div>
      </div>
    );
  }

  const beforePhoto = task.photos.find((p) => p.type === "BEFORE");
  const afterPhoto = task.photos.find((p) => p.type === "AFTER");
  const isReadOnly = task.status === "SUBMITTED" || task.status === "VERIFIED";

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center pb-28 font-sans selection:bg-blue-100">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl border-x border-slate-200 flex flex-col">
        {/* Sticky Mobile Header */}
        <header className="bg-slate-900 text-white px-4 py-3.5 sticky top-0 z-20 flex items-center justify-between shadow-sm">
          <button
            onClick={() => router.push("/ob/dashboard")}
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Kembali</span>
          </button>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Eksekusi Tugas
          </span>
        </header>

        {/* Revision Alert Banner */}
        {task.status === "REVISION_REQUIRED" && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 text-rose-800">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-rose-900">
                  Perlu Perbaikan (Revisi dari Supervisor)
                </h4>
                <p className="text-xs text-rose-800 mt-1 bg-white p-2.5 rounded-lg border border-rose-200 font-medium">
                  &ldquo;{task.revisionNote || "Harap periksa dan perbaiki kembali pekerjaan ini."}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task Title & Status Card */}
        <section className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{task.task.area.name}</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {task.status}
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {task.task.name}
          </h2>

          {task.task.description && (
            <div className="mt-2.5 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-700 block mb-0.5 text-[11px] uppercase tracking-wide">
                Instruksi Kerja:
              </span>
              {task.task.description}
            </div>
          )}
        </section>

        {/* Execution Flow */}
        <main className="p-4 space-y-5 flex-1">
          {/* Step 1: Start Task */}
          {task.status === "PENDING" && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-900">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Siap Mengerjakan Tugas?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik tombol di bawah untuk mencatat waktu mulai dan mengambil foto sebelum.
                </p>
              </div>
              <button
                disabled={isStarting}
                onClick={handleStartTask}
                className="w-full bg-blue-950 text-white font-semibold py-3 px-4 rounded-xl text-xs hover:bg-blue-900 flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-all"
              >
                {isStarting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    <span>Mulai Pekerjaan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2 & 3: Before & After Photo Capture */}
          {task.status !== "PENDING" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bukti Foto Operasional (Wajib)
                </h3>
                <span className="text-[11px] text-slate-500">
                  {beforePhoto && afterPhoto ? "2/2 Lengkap" : beforePhoto ? "1/2 Terisi" : "0/2 Terisi"}
                </span>
              </div>

              {/* 1. Before Photo Box */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-slate-900">Foto SEBELUM (Before)</span>
                  </div>
                  {beforePhoto ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Tersimpan
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center bg-amber-50 px-2 py-0.5 rounded-full">
                      Belum Ada
                    </span>
                  )}
                </div>

                {beforePhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img src={beforePhoto.path} alt="Before" className="w-full h-44 object-cover" />
                    {!isReadOnly && (
                      <button
                        onClick={() => beforeInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm hover:bg-slate-900"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Ambil Ulang</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => !isReadOnly && beforeInputRef.current?.click()}
                    className="h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/70 hover:border-slate-300 transition-all p-4 text-center"
                  >
                    {uploadingType === "BEFORE" ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mb-1.5" />
                        <span className="text-xs font-semibold text-slate-600">Mengunggah foto...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mb-1.5">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Ambil Foto Sebelum</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Kondisi area sebelum dibersihkan</span>
                      </>
                    )}
                  </div>
                )}

                {/* Hidden File Input for Before */}
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, "BEFORE")}
                />
              </div>

              {/* 2. After Photo Box */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-slate-900">Foto SESUDAH (After)</span>
                  </div>
                  {afterPhoto ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Tersimpan
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center bg-amber-50 px-2 py-0.5 rounded-full">
                      Belum Ada
                    </span>
                  )}
                </div>

                {afterPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img src={afterPhoto.path} alt="After" className="w-full h-44 object-cover" />
                    {!isReadOnly && (
                      <button
                        onClick={() => afterInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm hover:bg-slate-900"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Ambil Ulang</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => !isReadOnly && afterInputRef.current?.click()}
                    className="h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/70 hover:border-slate-300 transition-all p-4 text-center"
                  >
                    {uploadingType === "AFTER" ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mb-1.5" />
                        <span className="text-xs font-semibold text-slate-600">Mengunggah foto...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mb-1.5">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Ambil Foto Sesudah</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Kondisi area setelah selesai dikerjakan</span>
                      </>
                    )}
                  </div>
                )}

                {/* Hidden File Input for After */}
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, "AFTER")}
                />
              </div>

              {/* Step 4: Optional Findings Report (PRD #11) */}
              {!isReadOnly && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                  <div
                    onClick={() => setShowFindingForm(!showFindingForm)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Catatan / Laporan Temuan Kendala (Opsional)
                      </span>
                    </div>
                    <span className="text-xs text-blue-900 font-bold">
                      {showFindingForm ? "Tutup" : "+ Tambah"}
                    </span>
                  </div>

                  {showFindingForm && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Deskripsi Temuan / Masalah
                        </label>
                        <textarea
                          rows={2}
                          value={findingDesc}
                          onChange={(e) => setFindingDesc(e.target.value)}
                          placeholder="Contoh: Kran wastafel bocor, lampu koridor redup, atau sabun habis."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Tingkat Keparahan (Severity)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["LOW", "MEDIUM", "HIGH"] as const).map((sev) => (
                            <button
                              key={sev}
                              type="button"
                              onClick={() => setFindingSeverity(sev)}
                              className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                findingSeverity === sev
                                  ? sev === "HIGH"
                                    ? "bg-rose-600 border-rose-600 text-white"
                                    : sev === "MEDIUM"
                                    ? "bg-amber-600 border-amber-600 text-white"
                                    : "bg-blue-900 border-blue-900 text-white"
                                  : "bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Existing Findings List (if already submitted) */}
              {task.findings?.length > 0 && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Temuan Tersimpan:</h4>
                  {task.findings.map((f) => (
                    <div key={f.id} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900">Kendala Lapangan</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-slate-600">{f.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sticky Submit Footer */}
        {task.status !== "PENDING" && !isReadOnly && (
          <div className="fixed bottom-0 max-w-md w-full bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-30 shadow-lg">
            <button
              disabled={isSubmitting || !beforePhoto || !afterPhoto}
              onClick={handleSubmitTask}
              className="w-full bg-blue-950 text-white text-xs font-bold py-3.5 px-4 rounded-xl hover:bg-blue-900 flex items-center justify-center space-x-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Hasil Pekerjaan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Selesaikan & Kirim ke Supervisor</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
