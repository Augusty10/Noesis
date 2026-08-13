import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

async function handleRequest(req: NextRequest, params: { path: string[] }) {
  try {
    const { userId } = await auth();
    
    // Check if it is a public endpoint (e.g. webhooks)
    const pathStr = params.path ? params.path.join("/") : "";
    const isPublic = pathStr.startsWith("webhooks/");
    
    if (!userId && !isPublic) {
      return NextResponse.json({ message: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:5005";
    const searchParams = req.nextUrl.search;
    const url = `${backendUrl}/api/${pathStr}${searchParams}`;

    // Forward standard headers
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key !== "host" && key !== "connection") {
        headers.set(key, value);
      }
    });

    if (userId) {
      headers.set("x-user-id", userId);
    }

    // Read body
    let body: any = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        body = req.body;
      } else {
        body = await req.text();
      }
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
      // @ts-ignore
      duplex: 'half',
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await props.params);
}
export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await props.params);
}
export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await props.params);
}
export async function PATCH(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await props.params);
}
export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await props.params);
}
export async function OPTIONS(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await props.params);
}
export async function HEAD(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await props.params);
}
