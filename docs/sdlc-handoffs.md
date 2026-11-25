# SDLC handoffs

1. BA or Product creates a Product enhancement issue, defines acceptance criteria, and assigns the developer.
2. The developer opens a PR linked to the issue, records verification and QA instructions, and marks it ready.
3. QA submits a GitHub approval review with `SDLC: QA` on its own line and records test evidence. A request for changes returns the work to development.
4. A different BA or Product reviewer submits an approval with `SDLC: PRODUCT` on its own line after QA approves. Include the acceptance decision and any follow-up issues.
5. Merge after sign-off and the applicable CI checks pass. A new commit requires fresh QA and Product approvals.

## Activation

Set repository Actions variables `SDLC_QA_REVIEWERS` and `SDLC_PRODUCT_REVIEWERS` to comma- or space-separated GitHub logins. Use authenticated reviewer identities with repository review access. The PR author cannot satisfy either role. Until both variables are set, the check reports progress without enforcing sign-off.

After this workflow lands on main, test it on a ready PR that targets main. Verify the check fails before QA, fails after QA alone, passes after a separate Product approval, and returns to QA after a new commit. Then add `QA and Product sign-off` as a required check in the main branch ruleset alongside applicable CI. A merge queue needs equivalent validation on its merge-group event before this check can be required there.

In ChatGPT, ask for the ManaBandhu SDLC board to summarize GitHub issues and PRs when repository access is available. GitHub Actions evaluates handoff state on PR and review events. Automated agent execution requires a separate integration with authenticated agent identities and an approved runner for each role.
