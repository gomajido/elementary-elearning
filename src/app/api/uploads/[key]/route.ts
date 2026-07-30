import { NextResponse } from "next/server";

import { getObject } from "@/lib/storage/client";

/**
 * Proxies object storage — the browser never talks to MinIO/R2 directly
 * for reads, only for the presigned-URL uploads (see storage/client.ts).
 * Works the same whether the bucket is public or private.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;

  try {
    const object = await getObject(decodeURIComponent(key));
    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  }
}
