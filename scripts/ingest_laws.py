import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import List

import pdfplumber
from langdetect import detect
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "laws"
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "ain_bondhu_laws")

MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


@dataclass
class Chunk:
    text: str
    source: str
    page: int
    lang: str


def read_pdf_text(path: Path) -> List[Chunk]:
    chunks: List[Chunk] = []
    with pdfplumber.open(path) as pdf:
        for idx, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            text = " ".join(text.split())
            if not text:
                continue

            lang = "bn"
            try:
                lang = detect(text)
            except Exception:
                lang = "bn"

            for piece in split_text(text):
                chunks.append(Chunk(text=piece, source=path.name, page=idx, lang=lang))
    return chunks


def split_text(text: str) -> List[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + CHUNK_SIZE, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - CHUNK_OVERLAP
        if start < 0:
            start = 0
        if start >= len(words):
            break
    return chunks


def get_client() -> QdrantClient:
    if QDRANT_API_KEY:
        return QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    return QdrantClient(url=QDRANT_URL)


def ingest():
    client = get_client()
    model = SentenceTransformer(MODEL_NAME)

    files = sorted(DATA_DIR.glob("*.pdf"))
    all_chunks: List[Chunk] = []
    for file in files:
        all_chunks.extend(read_pdf_text(file))

    vectors = model.encode([c.text for c in all_chunks], show_progress_bar=True).tolist()

    if not client.collection_exists(QDRANT_COLLECTION):
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=qmodels.VectorParams(
                size=len(vectors[0]),
                distance=qmodels.Distance.COSINE,
            ),
        )

    points = []
    for idx, (chunk, vector) in enumerate(zip(all_chunks, vectors)):
        points.append(
            qmodels.PointStruct(
                id=idx,
                vector=vector,
                payload={
                    "text": chunk.text,
                    "source": chunk.source,
                    "page": chunk.page,
                    "lang": chunk.lang,
                },
            )
        )

    client.upsert(collection_name=QDRANT_COLLECTION, points=points)

    print(f"Ingested {len(points)} chunks into {QDRANT_COLLECTION}")


if __name__ == "__main__":
    ingest()
