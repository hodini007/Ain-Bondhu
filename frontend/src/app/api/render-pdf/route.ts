const backendBaseUrl =
  process.env.BACKEND_BASE_URL || "http://localhost:5000";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const res = await fetch(`${backendBaseUrl}/render-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return new Response("PDF render failed", { status: 502 });
    }
    const blob = await res.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="abhiyogpatra.pdf"',
      },
    });
  } catch {
    return new Response("Backend unreachable", { status: 502 });
  }
}
