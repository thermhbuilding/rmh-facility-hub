import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const taskInstance = await prisma.taskInstance.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            area: true,
          },
        },
        photos: {
          orderBy: { uploadedAt: "asc" },
        },
        findings: true,
        assignedUser: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!taskInstance) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan." },
        { status: 404 }
      );
    }

    const isMyTask = taskInstance.assignedUserId === session.id;
    const isLockedByOther =
      taskInstance.status === "IN_PROGRESS" && taskInstance.assignedUserId !== session.id;

    return NextResponse.json({
      task: taskInstance,
      currentUserId: session.id,
      currentUserName: session.name,
      isMyTask,
      isLockedByOther,
    });
  } catch (error) {
    console.error("Error fetching task detail:", error);
    return NextResponse.json(
      { error: "Gagal memuat rincian tugas." },
      { status: 500 }
    );
  }
}
