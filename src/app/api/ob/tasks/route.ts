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

    // 1. Check active schedules for this dayOfWeek
    const schedules = await prisma.taskSchedule.findMany({
      where: {
        active: true,
        dayOfWeek: dayOfWeek === 0 ? 1 : dayOfWeek, // Fallback to Monday if Sunday for testing
      },
    });

    // 2. Fetch all existing task instances for today (SHARED POOL across all users)
    const existingInstances = await prisma.taskInstance.findMany({
      where: {
        scheduledDate: todayDate,
      },
      select: { taskId: true },
    });
    const existingTaskIds = new Set(existingInstances.map((i) => i.taskId));

    // Bulk insert missing task instances for the shared pool
    const missingSchedules = schedules.filter((s) => !existingTaskIds.has(s.taskId));
    if (missingSchedules.length > 0) {
      await prisma.taskInstance.createMany({
        data: missingSchedules.map((s) => ({
          taskId: s.taskId,
          assignedUserId: s.assignedTo || session.id, // Default PIC or current creator
          scheduledDate: todayDate,
          status: TaskStatus.PENDING,
        })),
        skipDuplicates: true,
      });
    }

    // 3. If still no tasks generated for today, populate from active master tasks
    const currentCount = await prisma.taskInstance.count({
      where: {
        scheduledDate: todayDate,
      },
    });

    if (currentCount === 0) {
      const allTasks = await prisma.task.findMany({
        where: { active: true },
        take: 10,
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

    // 4. Fetch ALL shared tasks for today with assigned user, photos, and findings
    const tasks = await prisma.taskInstance.findMany({
      where: {
        scheduledDate: todayDate,
      },
      include: {
        task: {
          include: {
            area: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        photos: true,
        findings: true,
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({
      tasks,
      currentUserId: session.id,
      currentUserName: session.name,
    });
  } catch (error: any) {
    console.error("Error fetching OB tasks:", error);
    return NextResponse.json(
      { error: `Gagal memuat tugas: ${error.message}` },
      { status: 500 }
    );
  }
}
