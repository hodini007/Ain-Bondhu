import os
from typing import AsyncGenerator, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from datetime import datetime
from typing import Optional

from .rag import retrieve_chunks

load_dotenv()

RUNPOD_API_BASE = os.getenv("RUNPOD_API_BASE", "")
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "")

DISCLAIMER_BN = "এটি সাধারণ তথ্যভিত্তিক সহায়তা; এটি আইনগত পরামর্শ নয়।"

app = FastAPI(title="Ain-Bondhu API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class RunpodConfig(BaseModel):
    base_url: str = ""
    api_key: str = ""
    model: str = ""


class ChatRequest(BaseModel):
    messages: List[Message]
    citations: Optional[List[str]] = None
    runpod_config: Optional[RunpodConfig] = None


class LetterRequest(BaseModel):
    name: str
    address: str
    employer_name: str
    employer_address: str
    issue_summary: str
    requested_action: str
    runpod_config: Optional[RunpodConfig] = None


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = Field(default=5, ge=1, le=10)


class HealthCheckRequest(BaseModel):
    runpod_config: Optional[RunpodConfig] = None


def resolve_runpod_config(runpod_config: Optional[RunpodConfig]) -> tuple:
    if runpod_config and runpod_config.base_url:
        return (
            runpod_config.base_url,
            runpod_config.api_key or "none",
            runpod_config.model or "default",
        )
    return RUNPOD_API_BASE, RUNPOD_API_KEY, MODEL_NAME


@app.post("/health")
async def health(req: Optional[HealthCheckRequest] = None):
    cfg = req.runpod_config if req else None
    base, key, model = resolve_runpod_config(cfg)
    if not base or not key or not model:
        return {"status": "offline", "reason": "missing_config"}

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"{base}/models",
                headers={"Authorization": f"Bearer {key}"},
            )
            if resp.status_code != 200:
                return {"status": "offline", "reason": "model_unreachable"}
    except Exception:
        return {"status": "offline", "reason": "model_unreachable"}

    return {"status": "online", "model": model, "base": base}


@app.get("/health")
async def health_get():
    return await health(None)


async def stream_chat(
    messages: List[Message], base_url: str, api_key: str, model: str
) -> AsyncGenerator[str, None]:
    if not base_url or not api_key or not model:
        raise HTTPException(status_code=503, detail="Model not configured")

    payload = {
        "model": model,
        "stream": True,
        "messages": [m.model_dump() for m in messages],
        "temperature": 0.4,
    }

    headers = {"Authorization": f"Bearer {api_key}"}

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            f"{base_url}/chat/completions",
            json=payload,
            headers=headers,
        ) as response:
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Model error")

            async for line in response.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data = line.removeprefix("data: ")
                    if data.strip() == "[DONE]":
                        break
                    yield data


@app.post("/chat")
async def chat(req: ChatRequest):
    citations_text = ""
    if req.citations:
        citations_text = "\n\nউপযোগী সূত্রসমূহ:\n" + "\n".join(req.citations)

    base_url, api_key, model = resolve_runpod_config(req.runpod_config)

    system_prefix = {
        "role": "system",
        "content": (
            "আপনি একজন শ্রমিক অধিকার সহায়ক। আপনি শুধুমাত্র বাংলা ভাষায় উত্তর দেবেন। "
            "প্রথমে পরিস্থিতি পরিষ্কার করতে প্রশ্ন করবেন, তারপর অধিকার ও করণীয় ব্যাখ্যা করবেন। "
            "কোনো আইনি নিশ্চয়তা দেবেন না। উত্তর শুরুতে এই ডিসক্লেইমার দিন: "
            f"{DISCLAIMER_BN}"
            f"{citations_text}"
        ),
    }

    messages = [Message(**system_prefix)] + req.messages

    return EventSourceResponse(stream_chat(messages, base_url, api_key, model))


@app.post("/letter")
async def letter(req: LetterRequest):
    base_url, api_key, model = resolve_runpod_config(req.runpod_config)

    system_message = Message(
        role="system",
        content=(
            "আপনি একটি আনুষ্ঠানিক অভিযোগপত্র লিখবেন। "
            "ভাষা বাংলা, টোন আনুষ্ঠানিক, সংক্ষিপ্ত, এবং ভদ্র। "
            f"শুরুতেই এই ডিসক্লেইমার দিন: {DISCLAIMER_BN}"
        ),
    )

    user_message = Message(
        role="user",
        content=(
            "একটি আনুষ্ঠানিক অভিযোগপত্র লিখুন।\n"
            f"নাম: {req.name}\n"
            f"ঠিকানা: {req.address}\n"
            f"নিয়োগকর্তার নাম: {req.employer_name}\n"
            f"নিয়োগকর্তার ঠিকানা: {req.employer_address}\n"
            f"সমস্যার সারাংশ: {req.issue_summary}\n"
            f"প্রত্যাশিত পদক্ষেপ: {req.requested_action}\n"
        ),
    )

    payload = {
        "model": model,
        "stream": False,
        "messages": [system_message.model_dump(), user_message.model_dump()],
        "temperature": 0.2,
    }

    headers = {"Authorization": f"Bearer {api_key}"}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{base_url}/chat/completions",
            json=payload,
            headers=headers,
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Model error")

    data = response.json()
    content = data["choices"][0]["message"]["content"]
    return {"letter": content}


@app.post("/retrieve")
async def retrieve(req: RetrieveRequest):
    citations = retrieve_chunks(req.query, req.top_k)
    return {"citations": citations, "query": req.query}


class RenderPDFRequest(BaseModel):
    letter: str
    footer: Optional[str] = None


@app.post("/render-pdf")
async def render_pdf(req: RenderPDFRequest):
    try:
        from weasyprint import CSS, HTML

        date_str = datetime.now().strftime("%d-%m-%Y")
        footer = req.footer or "এই নথিটি সাধারণ তথ্যভিত্তিক সহায়তা।"

        html = f"""
        <html lang="bn">
          <head>
            <meta charset="utf-8" />
            <style>
              @font-face {{
                font-family: 'NotoSerifBengali';
                src: url('https://fonts.gstatic.com/ea/notosansbengali/v6/NotoSansBengali-Regular.ttf');
              }}
              body {{
                font-family: 'NotoSerifBengali', serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #1f1b16;
              }}
              .date {{ text-align: right; margin-bottom: 16px; }}
              .footer {{ margin-top: 32px; font-size: 10pt; color: #6d5b4a; }}
            </style>
          </head>
          <body>
            <div class="date">তারিখ: {date_str}</div>
            <div>{req.letter.replace(chr(10), '<br />')}</div>
            <div class="footer">{footer}</div>
          </body>
        </html>
        """

        pdf = HTML(string=html).write_pdf(
            stylesheets=[CSS(string="@page { size: A4; margin: 24mm; }")]
        )
        from fastapi.responses import Response

        return Response(pdf, media_type="application/pdf")
    except ImportError:
        raise HTTPException(status_code=501, detail="PDF rendering not available")
