import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function okJson<T extends Record<string, unknown>>(data: T = {} as T) {
  return NextResponse.json({
    ok: true,
    ...data,
  });
}

export function errorJson(message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    },
  );
}

export function parseApiError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid request.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
