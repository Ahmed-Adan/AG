import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { customerSchema } from "@/lib/validations/customer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireSession();
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            quotationNumber: true,
            projectName: true,
            status: true,
            finalTotal: true,
            date: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const data = customerSchema.partial().parse(body);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.companyName !== undefined && { companyName: data.companyName || null }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address || null }),
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireSession();
    const { id } = await params;

    const quotationCount = await prisma.quotation.count({ where: { customerId: id } });
    if (quotationCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a customer that has quotations." },
        { status: 409 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
