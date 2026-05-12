import os
from typing import List

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "ain_bondhu_laws")
EMBED_MODEL = os.getenv(
    "EMBED_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

_client = None
_model = None


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        if QDRANT_API_KEY:
            _client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        else:
            _client = QdrantClient(url=QDRANT_URL)
    return _client


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def retrieve_chunks(query: str, top_k: int) -> List[str]:
    client = _get_client()
    model = _get_model()
    try:
        query_vector = model.encode(query).tolist()
        search_result = client.search(
            collection_name=QDRANT_COLLECTION,
            query_vector=query_vector,
            limit=top_k,
        )
    except Exception:
        return []

    citations: List[str] = []
    for hit in search_result:
        payload = hit.payload or {}
        source = payload.get("source", "")
        page = payload.get("page", "")
        text = payload.get("text", "")
        citation = f"{source} (পৃষ্ঠা {page}): {text[:160]}"
        citations.append(citation)

    return citations
