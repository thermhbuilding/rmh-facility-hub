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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all task instances for today with assigned user, area, photos, and findings
    const tasks = await prisma.taskInstance.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
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
        status: "asc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching supervisor tasks:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar monitoring supervisor." },
      { status: 500 }
    );
  }
}
