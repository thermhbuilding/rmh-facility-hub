import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch task instances assigned to this OB for today
    const tasks = await prisma.taskInstance.findMany({
      where: {
        assignedUserId: session.id,
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
        photos: true,
        findings: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching OB tasks:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar tugas harian." },
      { status: 500 }
    );
  }
}
