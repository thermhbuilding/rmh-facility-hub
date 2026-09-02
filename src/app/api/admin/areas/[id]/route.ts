import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, description } = await req.json();

    const updated = await prisma.area.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, area: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if area has tasks
    const tasksCount = await prisma.task.count({ where: { areaId: id } });
    if (tasksCount > 0) {
      return NextResponse.json(
        { error: `Area tidak dapat dihapus karena memiliki ${tasksCount} tugas terkait. Hapus tugas terkait terlebih dahulu.` },
        { status: 400 }
      );
    }

    await prisma.area.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Area berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
