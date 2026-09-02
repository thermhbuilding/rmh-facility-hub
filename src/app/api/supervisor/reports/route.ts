import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();

  if (!session || (session.role !== "SUPERVISOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // Format: YYYY-MM-DD

    let targetDate: Date;
    if (dateParam) {
      const [y, m, d] = dateParam.split("-").map(Number);
      targetDate = new Date(Date.UTC(y, m - 1, d));
    } else {
      const now = new Date();
      const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
      const [y, m, d] = dateStr.split("-").map(Number);
      targetDate = new Date(Date.UTC(y, m - 1, d));
    }

    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const tasks = await prisma.taskInstance.findMany({
      where: {
        scheduledDate: {
          gte: targetDate,
          lt: nextDay,
        },
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
        verifiedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const metrics = {
      total: tasks.length,
      verified: tasks.filter((t) => t.status === "VERIFIED").length,
      submitted: tasks.filter((t) => t.status === "SUBMITTED").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
      revision: tasks.filter((t) => t.status === "REVISION_REQUIRED").length,
      totalFindings: tasks.reduce((acc, t) => acc + (t.findings?.length || 0), 0),
      completionRate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "VERIFIED").length / tasks.length) * 100) : 0,
    };

    return NextResponse.json({
      date: targetDate.toISOString().split("T")[0],
      metrics,
      tasks,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: `Gagal membuat laporan: ${error.message}` },
      { status: 500 }
    );
  }
}
