# Ain-Bondhu (Gemma 4 Good Hackathon)

Bangla-first worker rights assistant with offline demo mode, RAG citations, and formal complaint letter generation.

## Project Structure

`
frontend/  Next.js UI
backend/   FastAPI API
scripts/   RAG ingestion scripts
data/      Law PDFs + demo scenarios
`

## Quick Start

### Backend

`powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
`

### Frontend

`powershell
cd frontend
npm install
npm run dev
`

Open: http://localhost:3000

## Demo-only Model Use

Set RunPod variables in ackend/.env when you want live inference:

`
RUNPOD_API_BASE=https://your-runpod-endpoint/v1
RUNPOD_API_KEY=your_key
MODEL_NAME=your_model
`

If the model is offline, the UI automatically switches to interactive demo mode.

## RAG Ingestion

Start Qdrant locally:

`powershell
docker run -p 6333:6333 qdrant/qdrant
`

Run ingestion:

`powershell
python scripts\ingest_laws.py
`

## Notes

- PDFs are in data/laws (mixed Bangla/English).
- Demo scenarios are in data/demo/scenarios.json.
