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
    const areas = await prisma.area.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { Tasks: true },
        },
      },
    });

    return NextResponse.json({ areas });
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
    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama area wajib diisi." }, { status: 400 });
    }

    const newArea = await prisma.area.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, area: newArea });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
