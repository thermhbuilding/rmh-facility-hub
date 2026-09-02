import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Determine today's date in WIB (Asia/Jakarta)
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
    }).format(now);
    const [year, month, day] = dateStr.split("-").map(Number);
    const todayDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = todayDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // 1. Check active schedules for this OB on this dayOfWeek
    const schedules = await prisma.taskSchedule.findMany({
      where: {
        active: true,
        dayOfWeek: dayOfWeek === 0 ? 1 : dayOfWeek, // Fallback to Monday if Sunday for testing
        OR: [
          { assignedTo: session.id },
          { assignedTo: null },
        ],
      },
    });

    // 2. Auto-generate task instances for today if not yet created
    for (const sched of schedules) {
      const existing = await prisma.taskInstance.findFirst({
        where: {
          taskId: sched.taskId,
          assignedUserId: session.id,
          scheduledDate: todayDate,
        },
      });

      if (!existing) {
        await prisma.taskInstance.create({
          data: {
            taskId: sched.taskId,
            assignedUserId: session.id,
            scheduledDate: todayDate,
            status: TaskStatus.PENDING,
          },
        });
      }
    }

    // 3. If still no tasks (e.g. newly created user), assign all available active master tasks for today
    const currentCount = await prisma.taskInstance.count({
      where: {
        assignedUserId: session.id,
        scheduledDate: todayDate,
      },
    });

    if (currentCount === 0) {
      const allTasks = await prisma.task.findMany({
        where: { active: true },
        take: 3,
      });

      for (const t of allTasks) {
        await prisma.taskInstance.create({
          data: {
            taskId: t.id,
            assignedUserId: session.id,
            scheduledDate: todayDate,
            status: TaskStatus.PENDING,
          },
        });
      }
    }

    // 4. Fetch all tasks assigned to this OB for today
    const tasks = await prisma.taskInstance.findMany({
      where: {
        assignedUserId: session.id,
        scheduledDate: todayDate,
      },
      include: {
        task: {
          include: {
            area: true,
          },
        },
        photos: true,
        findings: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Error fetching OB tasks:", error);
    return NextResponse.json(
      { error: `Gagal memuat tugas: ${error.message}` },
      { status: 500 }
    );
  }
}
