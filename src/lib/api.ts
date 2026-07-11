import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import { PermissionError } from "@/lib/permissions";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new PermissionError("Unauthorized", 401);
  }
  return session;
}

export function handleApiError(error: unknown) {
  if (error instanceof PermissionError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 400 }
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
