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
  AlertTriangle,
  X,
  FlipHorizontal
} from "lucide-react";
import { compressImage } from "@/lib/compress";

interface TaskDetail {
  id: string;
  assignedUserId: string;
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
  assignedUser?: {
    id: string;
    name: string;
    username: string;
  };
  photos: Array<{ id: string; type: "BEFORE" | "AFTER"; path: string }>;
  findings: Array<{ id: string; description: string; severity: "LOW" | "MEDIUM" | "HIGH" }>;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingType, setUploadingType] = useState<"BEFORE" | "AFTER" | null>(null);

  // Findings state
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingDesc, setFindingDesc] = useState("");
  const [findingSeverity, setFindingSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");

  // Live Camera Modal State
  const [activeCameraType, setActiveCameraType] = useState<"BEFORE" | "AFTER" | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/ob/task/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setCurrentUserId(data.currentUserId || "");
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

  // Handle opening live camera stream
  const openLiveCamera = async (type: "BEFORE" | "AFTER") => {
    setActiveCameraType(type);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kamera browser tidak didukung.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "Tidak dapat mengakses kamera secara langsung. Silakan gunakan tombol 'Pilih File / Galeri' di bawah."
      );
    }
  };

  // Close live camera
  const closeLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setActiveCameraType(null);
    setCameraError(null);
  };

  // Re-attach stream when video element renders
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Flip camera between front & back
  const toggleCameraFacing = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      console.error(e);
    }
  };

  // Capture snapshot from video stream
  const captureSnapshot = async () => {
    if (!videoRef.current || !activeCameraType) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `${activeCameraType.toLowerCase()}_snapshot.jpg`, {
        type: "image/jpeg",
      });

      const type = activeCameraType;
      closeLiveCamera();
      await uploadPhotoFile(file, type);
    }, "image/jpeg", 0.85);
  };

  // Upload photo helper
  const uploadPhotoFile = async (file: File, type: "BEFORE" | "AFTER") => {
    setUploadingType(type);

    try {
      // Compress image client-side to ~200KB for lightning-fast mobile upload
      const compressed = await compressImage(file, 1280, 1280, 0.75);

      const formData = new FormData();
      formData.append("photo", compressed);
      formData.append("type", type);

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

  const handleStartTask = async () => {
    setIsStarting(true);
    try {
      const res = await fetch(`/api/ob/task/${taskId}/start`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await fetchTask();
      } else {
        alert(data.error || "Gagal memulai tugas.");
        await fetchTask();
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala saat memulai tugas.");
    } finally {
      setIsStarting(false);
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
  const isLockedByOther = task.status === "IN_PROGRESS" && task.assignedUserId !== currentUserId;
  const isReadOnly = task.status === "SUBMITTED" || task.status === "VERIFIED" || isLockedByOther;

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
            Eksekusi Tugas Lapangan
          </span>
        </header>

        {/* Locked by Other OB Alert Banner */}
        {isLockedByOther && (
          <div className="bg-amber-50 border-b border-amber-300 p-4 text-amber-900">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-amber-900">
                  🔒 Sedang Dikerjakan Petugas Lain
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Tugas ini sedang dikerjakan oleh{" "}
                  <strong>{task.assignedUser?.name || "Petugas Lain"}</strong>. Halaman ini berada
                  dalam mode <em>Lihat Saja (Read-Only)</em> agar tidak terjadi pengerjaan ganda.
                </p>
              </div>
            </div>
          </div>
        )}

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
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium flex-wrap">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.task.area.name}</span>
              </div>
              {task.task.category === "RUTINITAS" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  Rutinitas
                </span>
              )}
              {task.task.category === "PERIODIK" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  Periodik
                </span>
              )}
              {task.task.category === "BERKALA" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                  Berkala / Sabtu
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
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
                    <img src={beforePhoto.path} alt="Before" className="w-full h-48 object-cover" />
                    {!isReadOnly && (
                      <div className="absolute bottom-2 right-2 flex space-x-1.5">
                        <button
                          onClick={() => openLiveCamera("BEFORE")}
                          className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm hover:bg-slate-900"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Foto Ulang</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadingType === "BEFORE" ? (
                      <div className="h-32 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mb-1.5" />
                        <span className="text-xs font-semibold text-slate-700">Mengunggah foto...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {/* Option 1: Live Camera Stream */}
                        <button
                          type="button"
                          onClick={() => openLiveCamera("BEFORE")}
                          className="h-28 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 flex flex-col items-center justify-center p-2 text-center transition-all active:scale-95"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center mb-1 shadow-xs">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-blue-950">Buka Kamera</span>
                          <span className="text-[10px] text-blue-700">Live Snapshot</span>
                        </button>

                        {/* Option 2: Native File / Gallery Input */}
                        <label className="h-28 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer active:scale-95">
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mb-1">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Galeri / File</span>
                          <span className="text-[10px] text-slate-400">Pilih dari HP</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadPhotoFile(file, "BEFORE");
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
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
                    <img src={afterPhoto.path} alt="After" className="w-full h-48 object-cover" />
                    {!isReadOnly && (
                      <div className="absolute bottom-2 right-2 flex space-x-1.5">
                        <button
                          onClick={() => openLiveCamera("AFTER")}
                          className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm hover:bg-slate-900"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Foto Ulang</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadingType === "AFTER" ? (
                      <div className="h-32 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 text-blue-900 animate-spin mb-1.5" />
                        <span className="text-xs font-semibold text-slate-700">Mengunggah foto...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {/* Option 1: Live Camera Stream */}
                        <button
                          type="button"
                          onClick={() => openLiveCamera("AFTER")}
                          className="h-28 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 flex flex-col items-center justify-center p-2 text-center transition-all active:scale-95"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center mb-1 shadow-xs">
                            <Camera className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-blue-950">Buka Kamera</span>
                          <span className="text-[10px] text-blue-700">Live Snapshot</span>
                        </button>

                        {/* Option 2: Native File / Gallery Input */}
                        <label className="h-28 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer active:scale-95">
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mb-1">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">Galeri / File</span>
                          <span className="text-[10px] text-slate-400">Pilih dari HP</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadPhotoFile(file, "AFTER");
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
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

      {/* LIVE CAMERA VIEWFINDER MODAL */}
      {activeCameraType && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          {/* Top Camera Controls */}
          <div className="p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={closeLiveCamera}
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold uppercase tracking-wider">
              Foto {activeCameraType === "BEFORE" ? "Sebelum" : "Sesudah"}
            </span>
            <button
              onClick={toggleCameraFacing}
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
              title="Ganti Kamera Depan/Belakang"
            >
              <FlipHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* Video Stream Element */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            {cameraError ? (
              <div className="p-6 text-center text-white space-y-4 max-w-xs">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                <label className="inline-block bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
                  Pilih dari File / Galeri
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && activeCameraType) {
                        const type = activeCameraType;
                        closeLiveCamera();
                        uploadPhotoFile(file, type);
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Bottom Shutter Capture Bar */}
          {!cameraError && (
            <div className="p-8 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center z-10">
              <button
                onClick={captureSnapshot}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-90 transition-transform shadow-lg"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-slate-200"></div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
