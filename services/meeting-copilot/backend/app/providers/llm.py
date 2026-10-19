"""Text generation. Open source: any OpenAI-compatible server (Ollama, vLLM, LM Studio). Paid: Claude on Bedrock."""

import json
import logging
from collections.abc import Iterator
from typing import Protocol

import httpx

from ..config import Settings
from .types import ProviderError

log = logging.getLogger(__name__)


class LLM(Protocol):
    name: str

    def complete(
        self,
        system: str,
        messages: list[dict],
        *,
        max_tokens: int = 4000,
        temperature: float = 0.2,
        json_mode: bool = False,
    ) -> str:
        """messages: [{"role": "user"|"assistant", "content": str}, ...]"""
        ...


def stream_text(llm, system: str, messages: list[dict], *, max_tokens: int = 400) -> Iterator[str]:
    """Token deltas when the provider streams; the whole reply in one piece when it doesn't."""
    stream = getattr(llm, "stream", None)
    if stream is None:
        yield llm.complete(system, messages, max_tokens=max_tokens)
        return
    yield from stream(system, messages, max_tokens=max_tokens)


class OpenAICompatLLM:
    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        self.settings = settings
        self.name = f"openai-compat:{settings.llm_model}"
        self.base = settings.llm_base_url.rstrip("/")
        self.client = client or httpx.Client(timeout=httpx.Timeout(settings.llm_timeout_s, connect=15.0))
        self._json_mode_supported = True

    def complete(self, system, messages, *, max_tokens=4000, temperature=0.2, json_mode=False) -> str:
        body = {
            "model": self.settings.llm_model,
            "messages": [{"role": "system", "content": system}, *messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode and self._json_mode_supported:
            body["response_format"] = {"type": "json_object"}
        headers = {"Authorization": f"Bearer {self.settings.llm_api_key}"}
        try:
            resp = self.client.post(f"{self.base}/chat/completions", json=body, headers=headers)
            if resp.status_code == 400 and "response_format" in body:
                # Some servers reject response_format; fall back to prompt-only JSON.
                self._json_mode_supported = False
                body.pop("response_format")
                resp = self.client.post(f"{self.base}/chat/completions", json=body, headers=headers)
        except httpx.HTTPError as e:
            raise ProviderError(f"LLM server at {self.base} is unreachable: {e}") from e
        if resp.status_code >= 400:
            raise ProviderError(f"LLM error {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise ProviderError(f"unexpected LLM response: {str(data)[:300]}") from e
        if not content:
            raise ProviderError("LLM returned an empty answer (raise max_tokens if the model reasons first)")
        return content

    def stream(self, system, messages, *, max_tokens=400, temperature=0.2) -> Iterator[str]:
        body = {
            "model": self.settings.llm_model,
            "messages": [{"role": "system", "content": system}, *messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        headers = {"Authorization": f"Bearer {self.settings.llm_api_key}"}
        try:
            with self.client.stream("POST", f"{self.base}/chat/completions", json=body, headers=headers) as resp:
                if resp.status_code >= 400:
                    raise ProviderError(f"LLM error {resp.status_code}: {resp.read()[:300]!r}")
                for line in resp.iter_lines():
                    if not line.startswith("data:"):
                        continue
                    payload = line[5:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        delta = json.loads(payload)["choices"][0]["delta"].get("content")
                    except (KeyError, IndexError, ValueError):
                        continue
                    if delta:
                        yield delta
        except httpx.HTTPError as e:
            raise ProviderError(f"LLM server at {self.base} is unreachable: {e}") from e


class BedrockLLM:
    def __init__(self, settings: Settings, client=None):
        if not settings.bedrock_model_id:
            raise ProviderError("BEDROCK_MODEL_ID is required when LLM_PROVIDER=bedrock")
        self.settings = settings
        self.name = f"bedrock:{settings.bedrock_model_id}"
        if client is None:
            import boto3

            client = boto3.client("bedrock-runtime", region_name=settings.effective_bedrock_region)
        self.client = client

    def complete(self, system, messages, *, max_tokens=4000, temperature=0.2, json_mode=False) -> str:
        if json_mode:
            system = system + "\n\nRespond with a single JSON object and nothing else."
        converse_messages = [{"role": m["role"], "content": [{"text": m["content"]}]} for m in messages]
        try:
            resp = self.client.converse(
                modelId=self.settings.bedrock_model_id,
                system=[{"text": system}],
                messages=converse_messages,
                inferenceConfig={"maxTokens": max_tokens, "temperature": temperature},
            )
        except Exception as e:  # botocore raises many specific types
            raise ProviderError(f"Bedrock error: {e}") from e
        blocks = resp.get("output", {}).get("message", {}).get("content", [])
        text = "".join(b.get("text", "") for b in blocks)
        if not text:
            raise ProviderError("Bedrock returned an empty answer")
        return text

    def stream(self, system, messages, *, max_tokens=400, temperature=0.2) -> Iterator[str]:
        converse_messages = [{"role": m["role"], "content": [{"text": m["content"]}]} for m in messages]
        try:
            resp = self.client.converse_stream(
                modelId=self.settings.bedrock_model_id,
                system=[{"text": system}],
                messages=converse_messages,
                inferenceConfig={"maxTokens": max_tokens, "temperature": temperature},
            )
            for event in resp["stream"]:
                text = event.get("contentBlockDelta", {}).get("delta", {}).get("text")
                if text:
                    yield text
        except Exception as e:
            raise ProviderError(f"Bedrock error: {e}") from e
