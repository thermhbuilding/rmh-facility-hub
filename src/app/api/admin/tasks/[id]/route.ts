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
    const { name, description, areaId } = await req.json();

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name.trim();
    if (description !== undefined) dataToUpdate.description = description?.trim() || null;
    if (areaId) dataToUpdate.areaId = areaId;

    const updated = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, task: updated });
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

    // Delete task instances, photos, findings, and schedules before deleting task
    const instances = await prisma.taskInstance.findMany({ where: { taskId: id }, select: { id: true } });
    const instanceIds = instances.map((i) => i.id);

    if (instanceIds.length > 0) {
      await prisma.taskPhoto.deleteMany({ where: { taskInstanceId: { in: instanceIds } } });
      await prisma.taskFinding.deleteMany({ where: { taskInstanceId: { in: instanceIds } } });
      await prisma.taskInstance.deleteMany({ where: { taskId: id } });
    }

    await prisma.taskSchedule.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Tugas berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
