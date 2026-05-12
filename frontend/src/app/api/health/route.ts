const backendBaseUrl =
  process.env.BACKEND_BASE_URL || "http://localhost:5000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${backendBaseUrl}/health`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ status: "offline", reason: "backend_unreachable" });
  }
}
