import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/permissions";
import { settingsSchema } from "@/lib/validations/settings";

async function getOrCreateSettings() {
  return prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function GET() {
  try {
    await requireSession();
    const settings = await getOrCreateSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "settings.manage");

    const body = await request.json();
    const data = settingsSchema.parse(body);

    const settings = await prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
