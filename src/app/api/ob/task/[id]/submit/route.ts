import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskStatus, Severity } from "@prisma/client";

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
    const body = await req.json().catch(() => ({}));
    const { findingDescription, findingSeverity } = body;

    const task = await prisma.taskInstance.findUnique({
      where: { id },
      include: {
        photos: true,
        assignedUser: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    }

    // Ownership Concurrency Check
    if (task.assignedUserId !== session.id && session.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: `Hanya petugas pelaksana (${task.assignedUser?.name || "petugas terdaftar"}) yang dapat mengirim laporan tugas ini.`,
        },
        { status: 403 }
      );
    }

    // Validation rules (PRD Section 12 & 24)
    const hasBefore = task.photos.some((p) => p.type === "BEFORE");
    const hasAfter = task.photos.some((p) => p.type === "AFTER");

    if (!hasBefore) {
      return NextResponse.json(
        { error: "Foto Sebelum (Before) wajib diunggah sebelum mengirim tugas." },
        { status: 400 }
      );
    }

    if (!hasAfter) {
      return NextResponse.json(
        { error: "Foto Sesudah (After) wajib diunggah sebelum mengirim tugas." },
        { status: 400 }
      );
    }

    // If finding provided, save it
    if (findingDescription && findingDescription.trim()) {
      let severity: Severity = Severity.LOW;
      if (findingSeverity === "MEDIUM") severity = Severity.MEDIUM;
      if (findingSeverity === "HIGH") severity = Severity.HIGH;

      await prisma.taskFinding.create({
        data: {
          taskInstanceId: id,
          description: findingDescription.trim(),
          severity,
        },
      });
    }

    // Update status to SUBMITTED
    const updated = await prisma.taskInstance.update({
      where: { id },
      data: {
        status: TaskStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      task: updated,
      message: "Tugas berhasil diselesaikan dan dikirim ke Supervisor.",
    });
  } catch (error: any) {
    console.error("Error submitting task:", error);
    return NextResponse.json(
      { error: `Gagal mengirim tugas: ${error?.message || "Kesalahan server"}` },
      { status: 500 }
    );
  }
}
