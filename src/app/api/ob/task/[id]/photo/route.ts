import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PhotoType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const type = (formData.get("type") as string) || "BEFORE";

    if (!file) {
      return NextResponse.json(
        { error: "File foto tidak ditemukan dalam permintaan." },
        { status: 400 }
      );
    }

    const task = await prisma.taskInstance.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    }

    // Concurrency Check: If task is claimed/in-progress by someone else
    if (
      task.status === "IN_PROGRESS" &&
      task.assignedUserId !== session.id &&
      session.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error: `Anda tidak dapat mengunggah foto karena tugas ini sedang dikerjakan oleh ${task.assignedUser?.name || "petugas lain"}.`,
        },
        { status: 403 }
      );
    }

    // If task was still PENDING or REVISION_REQUIRED, auto-claim to current OB
    if (task.status === "PENDING" || (task.status === "REVISION_REQUIRED" && task.assignedUserId !== session.id)) {
      await prisma.taskInstance.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          assignedUserId: session.id,
          startedAt: task.startedAt || new Date(),
        },
      });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${id}/${type.toLowerCase()}_${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let photoUrl = "";

    try {
      // Upload to Supabase Storage 'task-photos'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("task-photos")
        .upload(filename, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("task-photos")
          .getPublicUrl(filename);
        photoUrl = publicUrlData.publicUrl;
      }
    } catch (storageErr) {
      console.warn("Storage upload warning, fallback to local buffer url:", storageErr);
    }

    // Fallback if storage bucket is not yet created or public
    if (!photoUrl) {
      const base64 = buffer.toString("base64");
      photoUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;
    }

    // Save or update photo in database
    // Delete existing photo of same type if re-taking
    await prisma.taskPhoto.deleteMany({
      where: {
        taskInstanceId: id,
        type: type === "BEFORE" ? PhotoType.BEFORE : PhotoType.AFTER,
      },
    });

    const photoRecord = await prisma.taskPhoto.create({
      data: {
        taskInstanceId: id,
        type: type === "BEFORE" ? PhotoType.BEFORE : PhotoType.AFTER,
        path: photoUrl,
        capturedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      photo: photoRecord,
      message: `Foto ${type === "BEFORE" ? "Sebelum" : "Sesudah"} berhasil disimpan.`,
    });
  } catch (error: any) {
    console.error("Error uploading task photo:", error);
    return NextResponse.json(
      { error: `Gagal mengunggah foto: ${error?.message || "Kesalahan server"}` },
      { status: 500 }
    );
  }
}
