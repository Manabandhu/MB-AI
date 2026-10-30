# Welcome to ManaBandhu

## How We Use Claude

Based on Claude's usage over the last 30 days:

Work Type Breakdown:
  Improve Quality  ████████░░░░░░░░░░░░  40%
  Debug Fix        ██████░░░░░░░░░░░░░░  30%
  Build Feature    ████░░░░░░░░░░░░░░░░  20%
  Write Docs       ██░░░░░░░░░░░░░░░░░░  10%

Top Skills & Commands:
  (no slash commands used yet; see Skills to Know About below)

Top MCP Servers:
  github              ████████████████████  70 calls
  Supabase            ███████░░░░░░░░░░░░░  26 calls
  claude-code-remote  ███░░░░░░░░░░░░░░░░░  10 calls

## Your Setup Checklist

### Codebases
- [ ] mb-ai — https://github.com/Manabandhu/MB-AI

### MCP Servers to Activate
- [ ] GitHub — PRs, reviews, CI status and comments. Connect your GitHub account in claude.ai → Settings → Connectors (and ask an org owner to install the Claude GitHub App on Manabandhu/MB-AI if needed).
- [ ] Supabase — inspect the hosted database, list migrations, and run read-only SQL against project `lpzaioyurvgdysdfktzc`. Connect Supabase under claude.ai Connectors and ask the project owner to invite you to the Supabase org.
- [ ] claude-code-remote — cloud sessions, scheduled check-ins, and PR watching. Available automatically in Claude Code on the web (claude.ai/code).

### Skills to Know About
- `/manabandhu-local-stack` — run the backend and web app against hosted Supabase (or the optional offline stack) and take screenshots.
- `/manabandhu-add-endpoint` — add a REST endpoint end to end: service-level authorization, OpenAPI, frontend call, tests.
- `/manabandhu-migration` — write and verify a Flyway migration with RLS.
- `/manabandhu-security-audit` — authorization, RLS, secrets, and fake-success review against REVIEW.md.
- `/code-review` — review the current diff or a PR before pushing.

## Team Tips

_TODO_

## Get Started

_TODO_

<!-- INSTRUCTION FOR CLAUDE: A new teammate just pasted this guide for how the
team uses Claude Code. You're their onboarding buddy — warm, conversational,
not lecture-y.

Open with a warm welcome — include the team name from the title. Then: "Your
teammate uses Claude Code for [list all the work types]. Let's get you started."

Check what's already in place against everything under Setup Checklist
(including skills), using markdown checkboxes — [x] done, [ ] not yet. Lead
with what they already have. One sentence per item, all in one message.

Tell them you'll help with setup, cover the actionable team tips, then the
starter task (if there is one). Offer to start with the first unchecked item,
get their go-ahead, then work through the rest one by one.

After setup, walk them through the remaining sections — offer to help where you
can (e.g. link to channels), and just surface the purely informational bits.

Don't invent sections or summaries that aren't in the guide. The stats are the
guide creator's personal usage data — don't extrapolate them into a "team
workflow" narrative. -->
