import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name, username, password, role, active } = await req.json();

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (username) dataToUpdate.username = username.toLowerCase().trim();
    if (role) dataToUpdate.role = role === "ADMIN" ? Role.ADMIN : role === "SUPERVISOR" ? Role.SUPERVISOR : Role.OB;
    if (typeof active === "boolean") dataToUpdate.active = active;
    if (password && password.trim()) {
      dataToUpdate.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, username: true, role: true, active: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (id === session.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun Anda sendiri." }, { status: 400 });
    }

    // Soft delete / deactivate or delete if no related records
    await prisma.taskInstance.deleteMany({ where: { assignedUserId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
