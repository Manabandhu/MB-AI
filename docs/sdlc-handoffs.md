# SDLC handoffs

1. BA or Product creates a Product enhancement issue, defines acceptance criteria, and assigns the developer.
2. The developer opens a PR linked to the issue, records verification and QA instructions, and marks it ready.
3. QA submits a GitHub approval review with `SDLC: QA` on its own line and records test evidence. A request for changes returns the work to development.
4. A different BA or Product reviewer submits an approval with `SDLC: PRODUCT` on its own line after QA approves. Include the acceptance decision and any follow-up issues.
5. Merge after sign-off and the applicable CI checks pass. A new commit requires fresh QA and Product approvals.

## Activation

Set repository Actions variables `SDLC_QA_REVIEWERS` and `SDLC_PRODUCT_REVIEWERS` to comma- or space-separated GitHub logins. Use authenticated reviewer identities with repository review access. The PR author cannot satisfy either role. Until both variables are set, the check reports progress without enforcing sign-off.

Test the workflow on a ready PR that targets `feat/sdlc-handoffs`. Verify the check fails before QA, fails after QA alone, passes after a separate Product approval, and returns to QA after a new commit. Then add `QA and Product sign-off` as a required check in the pilot branch ruleset alongside applicable CI. A merge queue needs equivalent validation on its merge-group event before this check can be required there.

In ChatGPT, ask for the ManaBandhu SDLC board to summarize GitHub issues and PRs when repository access is available. GitHub Actions evaluates handoff state on PR and review events. Automated agent execution requires a separate integration with authenticated agent identities and an approved runner for each role.

## Codex agent runs

Once the agent workflow is available on the GitHub default branch, store a project API key in the Actions secret `OPENAI_API_KEY`, then set the Actions variable `SDLC_AGENTS_ENABLED` to `true` to enable billable runs. Dispatch the workflow from the default branch for a specific role and issue or PR number, or use these event triggers:

| Role | Trigger | Artifact |
| --- | --- | --- |
| BA | Apply `sdlc:ba` to an issue | Scope and acceptance criteria |
| Developer | Apply `sdlc:developer` after the requirements handoff | Proposed patch and verification notes |
| QA | Mark a same-repository PR labeled `sdlc:qa` ready for review, or apply the label to an already-ready PR | Findings and proposed tests for the captured commit |
| Product | Apply `sdlc:product` after QA or dispatch manually | Draft acceptance decision |

Runs use the trusted pilot branch checkout. Reviews receive the PR diff as data. Results are available in the Actions run artifacts for seven days. Apply developer patches on a feature branch after review. QA and Product artifacts support the authenticated reviews required by the sign-off workflow.

The pilot integration branch is `feat/sdlc-handoffs`. Keep GitHub’s existing default branch unless explicitly changing repository settings. GitHub requires the agent workflow on the default branch for issue-label and manual-dispatch triggers. A default-branch bootstrap can contain the agent workflow while feature PRs continue targeting the pilot branch. Protect the pilot branch because agent jobs check out its code.
