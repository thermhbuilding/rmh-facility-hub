import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || (session.role !== "SUPERVISOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { taskInstanceId, action, revisionNote } = await req.json();

    if (!taskInstanceId || !action) {
      return NextResponse.json(
        { error: "Data verifikasi tidak lengkap." },
        { status: 400 }
      );
    }

    if (action === "REJECT" && !revisionNote?.trim()) {
      return NextResponse.json(
        { error: "Catatan perbaikan wajib diisi ketika meminta revisi." },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.taskInstance.update({
      where: { id: taskInstanceId },
      data: {
        status: action === "APPROVE" ? TaskStatus.VERIFIED : TaskStatus.REVISION_REQUIRED,
        verifiedAt: action === "APPROVE" ? new Date() : null,
        verifiedById: action === "APPROVE" ? session.id : null,
        revisionNote: action === "REJECT" ? revisionNote : null,
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("Error verifying task:", error);
    return NextResponse.json(
      { error: "Gagal memproses verifikasi tugas." },
      { status: 500 }
    );
  }
}
