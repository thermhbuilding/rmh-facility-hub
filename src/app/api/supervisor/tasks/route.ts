import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session || (session.role !== "SUPERVISOR" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
    }).format(now);
    const [year, month, day] = dateStr.split("-").map(Number);
    const todayDate = new Date(Date.UTC(year, month - 1, day));

    // Fetch all task instances for today with assigned user, area, photos, and findings
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
        verifiedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        status: "asc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Error fetching supervisor tasks:", error);
    return NextResponse.json(
      { error: `Gagal memuat monitoring supervisor: ${error.message}` },
      { status: 500 }
    );
  }
}
