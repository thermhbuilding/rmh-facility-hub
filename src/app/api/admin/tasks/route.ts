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
    const { name, description, areaId } = await req.json();

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

    // Automatically create Monday-Saturday open schedules (Pool Bersama)
    for (let day = 1; day <= 6; day++) {
      await prisma.taskSchedule.create({
        data: {
          taskId: newTask.id,
          dayOfWeek: day,
          assignedTo: null, // Open pool for all OBs
        },
      });
    }

    // Determine today's date in WIB
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
    }).format(now);
    const [year, month, day] = dateStr.split("-").map(Number);
    const todayDate = new Date(Date.UTC(year, month - 1, day));

    // Also create task instance for today so it appears in today's shared pool immediately
    await prisma.taskInstance.create({
      data: {
        taskId: newTask.id,
        assignedUserId: session.id, // Placeholder until claimed by an OB
        scheduledDate: todayDate,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
