import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
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
    const { username, password, name, role } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: "Username, password, dan nama wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username sudah digunakan. Pilih username lain." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = (role === "ADMIN" ? Role.ADMIN : role === "SUPERVISOR" ? Role.SUPERVISOR : Role.OB);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        passwordHash,
        name,
        role: userRole,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
