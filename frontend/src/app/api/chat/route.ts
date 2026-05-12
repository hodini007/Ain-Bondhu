import { NextRequest } from "next/server";

const backendBaseUrl =
  process.env.BACKEND_BASE_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${backendBaseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
}
