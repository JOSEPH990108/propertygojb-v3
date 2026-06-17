"use client";

export type ApiResult<T extends Record<string, unknown> = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; message: string };

export async function postJson<T extends Record<string, unknown> = Record<string, never>>(
  url: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      message: data?.message ?? "Something went wrong.",
    };
  }

  return data as { ok: true } & T;
}
