"""Text embeddings for search and chat.

Open source: any OpenAI-compatible /embeddings server. Paid: Titan on Bedrock.
"""

import json
from typing import Literal, Protocol

import httpx

from ..config import Settings
from .types import ProviderError

Kind = Literal["document", "query"]


class Embedder(Protocol):
    name: str
    dim: int

    def embed(self, texts: list[str], kind: Kind) -> list[list[float]]: ...


def _check_dim(vectors: list[list[float]], dim: int, name: str) -> list[list[float]]:
    for v in vectors:
        if len(v) != dim:
            raise ProviderError(
                f"{name} returned {len(v)}-dim vectors but EMBED_DIM={dim}. Set EMBED_DIM to {len(v)} and re-index."
            )
    return vectors


class OpenAICompatEmbedder:
    batch_size = 32

    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        self.settings = settings
        self.dim = settings.embed_dim
        self.name = f"openai-compat:{settings.embed_model}"
        self.base = settings.embed_base_url.rstrip("/")
        self.client = client or httpx.Client(timeout=httpx.Timeout(120.0, connect=15.0))
        # nomic-embed-text is trained with task prefixes and scores noticeably better with them.
        self._prefixes = "nomic" in settings.embed_model.lower()

    def embed(self, texts: list[str], kind: Kind) -> list[list[float]]:
        if self._prefixes:
            prefix = "search_query: " if kind == "query" else "search_document: "
            texts = [prefix + t for t in texts]
        out: list[list[float]] = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            try:
                resp = self.client.post(
                    f"{self.base}/embeddings",
                    json={"model": self.settings.embed_model, "input": batch},
                    headers={"Authorization": f"Bearer {self.settings.embed_api_key}"},
                )
            except httpx.HTTPError as e:
                raise ProviderError(f"embedding server at {self.base} is unreachable: {e}") from e
            if resp.status_code >= 400:
                raise ProviderError(f"embedding error {resp.status_code}: {resp.text[:300]}")
            data = sorted(resp.json()["data"], key=lambda d: d.get("index", 0))
            out.extend(d["embedding"] for d in data)
        return _check_dim(out, self.dim, self.name)


class BedrockTitanEmbedder:
    def __init__(self, settings: Settings, client=None):
        if settings.embed_dim not in (256, 512, 1024):
            raise ProviderError("Titan Text Embeddings v2 supports EMBED_DIM of 256, 512 or 1024")
        self.settings = settings
        self.dim = settings.embed_dim
        self.name = f"bedrock:{settings.bedrock_embed_model_id}"
        if client is None:
            import boto3

            client = boto3.client("bedrock-runtime", region_name=settings.effective_bedrock_region)
        self.client = client

    def embed(self, texts: list[str], kind: Kind) -> list[list[float]]:
        out = []
        for text in texts:  # Titan v2 embeds one text per call
            try:
                resp = self.client.invoke_model(
                    modelId=self.settings.bedrock_embed_model_id,
                    body=json.dumps({"inputText": text[:20000], "dimensions": self.dim, "normalize": True}),
                    contentType="application/json",
                    accept="application/json",
                )
            except Exception as e:
                raise ProviderError(f"Bedrock embedding error: {e}") from e
            out.append(json.loads(resp["body"].read())["embedding"])
        return _check_dim(out, self.dim, self.name)
