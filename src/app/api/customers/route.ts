import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { customerSchema } from "@/lib/validations/customer";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const q = request.nextUrl.searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { quotations: true } } },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const data = customerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        companyName: data.companyName || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
