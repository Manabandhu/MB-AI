---
name: manabandhu-ai
description: Maintain ManaBandhu AI assistant and chatbot capabilities, including model routing, retrieval, tools, prompts, safety, privacy, evaluations, cost controls, citations, feedback, and human escalation. Use for any generative-AI or agentic workflow.
---

# AI

Frontend assistant experiences belong to `frontend/src/modules/ai-assistant`; orchestration and evaluation infrastructure remain under `services/ai-orchestrator` and `platform/ai`.

1. Read `platform/ai/MODULE.md` and `services/ai-orchestrator/MODULE.md`.
2. Keep model providers behind ports; version prompts, models, tools, policies, and evaluation datasets.
3. Authorize every tool call using the verified user and conversation scope. Treat model output and retrieved content as untrusted.
4. Minimize PII, prevent secrets from entering prompts/logs, moderate inputs/outputs, cite retrieval, and support deletion/retention.
5. Define latency, token, cost, quality, and fallback budgets before production use.
6. Add deterministic tests plus offline evaluations for safety and task quality.
7. Update this skill when providers, tools, policies, prompts, evaluations, or AI data flow change.
