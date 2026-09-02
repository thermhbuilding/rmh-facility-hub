import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        area: true,
        schedules: true,
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, areaId, assignedToUserId } = await req.json();

    if (!name?.trim() || !areaId) {
      return NextResponse.json(
        { error: "Nama tugas dan Area wajib diisi." },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        areaId,
      },
    });

    // Automatically create Monday-Saturday schedules
    if (assignedToUserId) {
      for (let day = 1; day <= 6; day++) {
        await prisma.taskSchedule.create({
          data: {
            taskId: newTask.id,
            dayOfWeek: day,
            assignedTo: assignedToUserId,
          },
        });
      }

      // Also create instance for today so it shows immediately
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.taskInstance.create({
        data: {
          taskId: newTask.id,
          assignedUserId: assignedToUserId,
          scheduledDate: today,
        },
      });
    }

    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
