import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validations/user";

type RouteContext = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "users.manage");
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "users.manage");
    const { id } = await params;

    const body = await request.json();
    const data = updateUserSchema.parse(body);

    if (id === session.user.id && (data.isActive === false || (data.role && data.role !== "ADMIN"))) {
      throw new PermissionError("You cannot deactivate or demote your own account.");
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(passwordHash && { passwordHash }),
      },
      select: userSelect,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "users.manage");
    const { id } = await params;

    if (id === session.user.id) {
      throw new PermissionError("You cannot deactivate your own account.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
