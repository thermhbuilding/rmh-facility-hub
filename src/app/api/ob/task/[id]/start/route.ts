import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskStatus } from "@prisma/client";

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

    const task = await prisma.taskInstance.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    }

    // If task is already IN_PROGRESS by someone else
    if (task.status === TaskStatus.IN_PROGRESS && task.assignedUserId !== session.id) {
      const workerName = task.assignedUser?.name || "petugas lain";
      return NextResponse.json(
        {
          error: `Tugas ini sudah diambil dan sedang dikerjakan oleh ${workerName}. Anda tidak dapat mengambil tugas ini.`,
          isLocked: true,
          lockedBy: workerName,
        },
        { status: 409 }
      );
    }

    // If task is already SUBMITTED or VERIFIED
    if (task.status === TaskStatus.SUBMITTED || task.status === TaskStatus.VERIFIED) {
      return NextResponse.json(
        {
          error: "Tugas ini sudah diselesaikan dan tidak dapat dimulai ulang.",
          task,
        },
        { status: 400 }
      );
    }

    // Atomic Claim & Lock: Update status to IN_PROGRESS and assign to current OB
    const updated = await prisma.taskInstance.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        assignedUserId: session.id, // Claim ownership to current logged-in OB
        startedAt: task.startedAt || new Date(),
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, username: true },
        },
        task: {
          include: { area: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      task: updated,
      message: `Tugas berhasil diambil oleh ${session.name}.`,
    });
  } catch (error: any) {
    console.error("Error starting/claiming task:", error);
    return NextResponse.json(
      { error: `Gagal memulai tugas: ${error?.message || "Kesalahan server"}` },
      { status: 500 }
    );
  }
}
