# Ain-Bondhu — বাঙালি শ্রমিকের অধিকার সহায়ক

A Bangla‑first AI assistant that helps Bangladeshi workers understand their legal rights and generate formal complaint letters, powered by **Gemma 4** on RunPod.

## ✨ Features

- **🤖 Chat‑based AI assistant** — Workers describe their problem in Bangla, the assistant explains their rights and suggests next steps
- **📄 Complaint letter generator** — Generate a formal complaint letter in Bangla with one click
- **🎤 Voice input** — Speak in Bangla using browser speech recognition (bn‑BD)
- **⚙️ Live RunPod switcher** — Update the model URL/API key from the UI — no redeploy needed
- **📥 PDF export** — Download complaint letters as formatted PDF with Bengali font
- **🌙 Dark theme** — Easy on the eyes, designed for readability

## 🧱 Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Netlify      │────▶│  FastAPI      │────▶│  RunPod          │
│  Next.js UI   │     │  Backend      │     │  vLLM + Gemma 4  │
│  (Bangla)     │     │  Port 5000    │     │  Port 8000       │
└──────────────┘     └──────────────┘     └──────────────────┘
```

| Layer | Tech | Hosting |
|-------|------|---------|
| Frontend | Next.js (React, Tailwind, TypeScript) | Netlify (free) |
| Backend | FastAPI (Python) | Any server / RunPod / Render |
| Model | Gemma 4 (google/gemma‑4‑E4B‑it) via vLLM | RunPod GPU (free tier) |
| RAG | Qdrant + multilingual embeddings | Local / Docker |
| PDF | WeasyPrint with Noto Sans Bengali | Backend |

## 🚀 Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate      # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Model (RunPod)

```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model google/gemma-4-E4B-it \
  --host 0.0.0.0 \
  --port 8000 \
  --api-key anda
```

Tunnel port 8000, then paste the URL into the app settings (⚙️).

## ⚙️ Settings

After deployment, click the **gear icon** (⚙️) in the header to set:

| Field | Example |
|-------|---------|
| Base URL | `https://xxx-8000.proxy.runpod.net/v1` |
| API Key | `anda` |
| Model Name | `google/gemma-4-E4B-it` |

Settings are saved in your browser — you only need to update them when you spin up a new RunPod pod.

## 🎯 Usage

1. Open the app
2. Type or speak your problem in Bangla (e.g. "আমি দুই মাস ধরে বেতন পাচ্ছি না")
3. The AI asks clarifying questions and explains your rights
4. Click **অভিযোগপত্র** to generate a formal complaint letter
5. Copy the letter or download as PDF

## 📁 Project Structure

```
hackathon/
├── frontend/          # Next.js chat UI
│   └── src/app/       # Pages, API routes, components
├── backend/           # FastAPI server
│   └── app/           # main.py, rag.py, pdf.py
├── scripts/           # RAG ingestion (ingest_laws.py)
├── data/              # Law PDFs, demo scenarios
├── docs/              # Architecture notes, writeup draft
└── .env.example       # Environment template
```

## 📝 Hackathon Writeup

See [`docs/writeup.md`](docs/writeup.md) for the Kaggle submission draft.

## 🛡️ Disclaimer

This tool provides **general informational guidance only**. It is **not a substitute for professional legal advice**. Users should consult a qualified lawyer for specific legal matters.
