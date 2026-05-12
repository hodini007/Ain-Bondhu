# Ain-Bondhu Backend

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
uvicorn app.main:app --reload --port 8001
```

## Environment

Create a `.env` file with:

```
RUNPOD_API_BASE=https://your-runpod-endpoint/v1
RUNPOD_API_KEY=your_key
MODEL_NAME=your_model
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=ain_bondhu_laws
EMBED_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```
