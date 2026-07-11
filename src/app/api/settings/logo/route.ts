import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { requirePermission, PermissionError } from "@/lib/permissions";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "settings.manage");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new PermissionError("Unsupported image type. Use PNG, JPG, WEBP, or SVG.", 400);
    }
    if (file.size > MAX_SIZE) {
      throw new PermissionError("Logo file must be smaller than 5MB.", 400);
    }

    const extension = path.extname(file.name) || ".png";
    const fileName = `logo-${Date.now()}${extension}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadsDir, fileName), buffer);

    const logoUrl = `/uploads/${fileName}`;
    await prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: { logoUrl },
      create: { id: "singleton", logoUrl },
    });

    return NextResponse.json({ logoUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
