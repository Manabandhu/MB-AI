import io
import json

import httpx
import pytest

from app.config import Settings
from app.providers.embeddings import BedrockTitanEmbedder, OpenAICompatEmbedder
from app.providers.llm import BedrockLLM, OpenAICompatLLM
from app.providers.stt import DeepgramTranscriber, parse_deepgram_response
from app.providers.types import ProviderError


def settings(**kw) -> Settings:
    return Settings(_env_file=None, **kw)


def test_parse_deepgram_utterances_with_speakers():
    data = {
        "results": {
            "utterances": [
                {"start": 0.5, "end": 2.0, "transcript": "Morning all.", "speaker": 0, "channel": 0},
                {"start": 2.2, "end": 4.0, "transcript": "  ", "speaker": 1},
                {"start": 4.1, "end": 6.0, "transcript": "I'm blocked on firewall.", "speaker": 1},
            ]
        }
    }
    segs = parse_deepgram_response(data, diarize=True)
    assert [(s.speaker, s.text) for s in segs] == [("dg0", "Morning all."), ("dg1", "I'm blocked on firewall.")]
    assert parse_deepgram_response(data, diarize=False)[0].speaker is None


def test_parse_deepgram_falls_back_to_channel_transcript():
    data = {"results": {"channels": [{"alternatives": [{"transcript": "hello", "words": [{"start": 1, "end": 2}]}]}]}}
    segs = parse_deepgram_response(data, diarize=False)
    assert segs[0].text == "hello" and segs[0].start == 1


def test_deepgram_params_use_keyterm_for_nova3():
    t = DeepgramTranscriber(settings(deepgram_api_key="k", glossary="Kubernetes, Terraform"), client=httpx.Client())
    params = t.build_params(diarize=True)
    assert ("keyterm", "Kubernetes") in params and ("diarize", "true") in params
    t2 = DeepgramTranscriber(
        settings(deepgram_api_key="k", deepgram_model="nova-2", glossary="X"), client=httpx.Client()
    )
    assert ("keywords", "X") in t2.build_params(diarize=False)


def test_deepgram_requires_key():
    with pytest.raises(ProviderError):
        DeepgramTranscriber(settings(deepgram_api_key=""))


def test_deepgram_uploads_audio(tmp_path):
    wav = tmp_path / "a.wav"
    wav.write_bytes(b"RIFF....fake")
    seen = {}

    def handler(request: httpx.Request):
        seen["auth"] = request.headers["authorization"]
        seen["body"] = request.read()
        return httpx.Response(
            200, json={"results": {"utterances": [{"start": 0, "end": 1, "transcript": "ok", "speaker": 0}]}}
        )

    t = DeepgramTranscriber(
        settings(deepgram_api_key="secret"), client=httpx.Client(transport=httpx.MockTransport(handler))
    )
    segs = t.transcribe(wav, diarize=True)
    assert seen["auth"] == "Token secret" and seen["body"] == b"RIFF....fake"
    assert segs[0].speaker == "dg0"


def test_openai_compat_llm_falls_back_when_json_mode_rejected():
    bodies = []

    def handler(request: httpx.Request):
        body = json.loads(request.content)
        bodies.append(body)
        if "response_format" in body:
            return httpx.Response(400, json={"error": "response_format not supported"})
        return httpx.Response(200, json={"choices": [{"message": {"content": '{"ok": true}'}}]})

    llm = OpenAICompatLLM(settings(llm_model="m"), client=httpx.Client(transport=httpx.MockTransport(handler)))
    assert llm.complete("sys", [{"role": "user", "content": "hi"}], json_mode=True) == '{"ok": true}'
    assert bodies[0]["messages"][0] == {"role": "system", "content": "sys"}
    assert "response_format" not in bodies[1]
    # remembered: no second rejected attempt next time
    llm.complete("sys", [{"role": "user", "content": "hi"}], json_mode=True)
    assert len(bodies) == 3


def test_openai_compat_llm_unreachable_is_a_provider_error():
    def handler(request):
        raise httpx.ConnectError("refused")

    llm = OpenAICompatLLM(settings(), client=httpx.Client(transport=httpx.MockTransport(handler)))
    with pytest.raises(ProviderError, match="unreachable"):
        llm.complete("s", [{"role": "user", "content": "x"}])


def test_embedder_adds_nomic_prefixes_and_checks_dimension():
    seen = []

    def handler(request):
        body = json.loads(request.content)
        seen.extend(body["input"])
        return httpx.Response(
            200, json={"data": [{"index": i, "embedding": [0.1] * 4} for i in range(len(body["input"]))]}
        )

    emb = OpenAICompatEmbedder(
        settings(embed_model="nomic-embed-text", embed_dim=4),
        client=httpx.Client(transport=httpx.MockTransport(handler)),
    )
    assert len(emb.embed(["a", "b"], kind="document")) == 2
    emb.embed(["q"], kind="query")
    assert seen == ["search_document: a", "search_document: b", "search_query: q"]

    wrong = OpenAICompatEmbedder(
        settings(embed_model="other", embed_dim=8), client=httpx.Client(transport=httpx.MockTransport(handler))
    )
    with pytest.raises(ProviderError, match="EMBED_DIM"):
        wrong.embed(["a"], kind="document")


class StubBedrock:
    def __init__(self):
        self.calls = []

    def converse(self, **kw):
        self.calls.append(kw)
        return {"output": {"message": {"content": [{"text": "hello "}, {"text": "world"}]}}}

    def invoke_model(self, **kw):
        self.calls.append(kw)
        dims = json.loads(kw["body"])["dimensions"]
        return {"body": io.BytesIO(json.dumps({"embedding": [0.0] * dims}).encode())}


def test_bedrock_llm_uses_converse():
    stub = StubBedrock()
    llm = BedrockLLM(settings(bedrock_model_id="some-claude-profile"), client=stub)
    out = llm.complete("sys", [{"role": "user", "content": "hi"}], json_mode=True, max_tokens=50)
    assert out == "hello world"
    call = stub.calls[0]
    assert call["modelId"] == "some-claude-profile"
    assert call["messages"] == [{"role": "user", "content": [{"text": "hi"}]}]
    assert "JSON" in call["system"][0]["text"]
    assert call["inferenceConfig"]["maxTokens"] == 50


def test_bedrock_needs_a_model_id():
    with pytest.raises(ProviderError):
        BedrockLLM(settings(bedrock_model_id=""), client=StubBedrock())


def test_titan_embedder_validates_dims():
    with pytest.raises(ProviderError):
        BedrockTitanEmbedder(settings(embed_dim=768), client=StubBedrock())
    emb = BedrockTitanEmbedder(settings(embed_dim=256), client=StubBedrock())
    assert len(emb.embed(["x", "y"], kind="document")[1]) == 256
