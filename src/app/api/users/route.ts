import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { createUserSchema } from "@/lib/validations/user";

export async function GET() {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "users.manage");

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "users.manage");

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new PermissionError("A user with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, role: data.role },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
