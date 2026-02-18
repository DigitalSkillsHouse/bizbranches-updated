import { NextRequest, NextResponse } from "next/server";

import { getBackendUrl } from '@/lib/api';

export const dynamic = 'force-static'

/**
 * GET /api/business/[id] - Proxy to backend for single business by slug or MongoDB _id.
 * Backend resolves both slug (pretty URL) and 24-char ObjectId.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Business id or slug is required" },
        { status: 400 }
      );
    }
    const backendUrl = `${getBackendUrl()}/api/business/${encodeURIComponent(id)}`;
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({ ok: false, error: "Invalid response" }));
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error) {
    console.error("Business [id] API proxy error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}
