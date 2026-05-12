const backendBaseUrl =
  process.env.BACKEND_BASE_URL || "http://localhost:5000";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const res = await fetch(`${backendBaseUrl}/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
