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
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404 });
    }

    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.REVISION_REQUIRED) {
      return NextResponse.json({
        success: true,
        task,
        message: "Tugas sudah dimulai sebelumnya.",
      });
    }

    const updated = await prisma.taskInstance.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        startedAt: task.startedAt || new Date(),
      },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("Error starting task:", error);
    return NextResponse.json(
      { error: "Gagal memulai tugas." },
      { status: 500 }
    );
  }
}
