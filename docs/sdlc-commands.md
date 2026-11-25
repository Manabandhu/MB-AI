# ManaBandhu SDLC commands

Type these commands as messages in a ChatGPT or Codex conversation with the ManaBandhu repository connected. Use one enhancement issue as the durable record and carry its number through design, development, QA, sign-off, and release. The pilot integration branch is `feat/sdlc-handoffs`.

| Command | Role | Action and output |
| --- | --- | --- |
| `/mb-idea <idea>` | Product Analyst | Clarify the user problem, success measure, proposed scope, and unresolved decisions. Draft an enhancement issue. |
| `/mb-plan <issue>` | BA and Architect | Read the issue and relevant code. Write acceptance criteria, a technical approach, dependencies, and a verification plan. |
| `/mb-build <issue>` | Developer | Check the plan, branch from the pilot, implement, run relevant checks, and prepare a linked draft PR when publication is authorized. |
| `/mb-review <pr>` | Engineer | Review the exact PR diff and relevant call sites. Record findings by severity with evidence and locations. |
| `/mb-qa <pr>` | QA | Map acceptance criteria to checks, run available checks, report pass/fail/blocked with evidence and the tested commit SHA. |
| `/mb-signoff <pr>` | Product Owner | Compare the issue, current PR, and QA evidence. Record an approval recommendation or return gaps to Development. |
| `/mb-ship <pr>` | Release Engineer | Verify the target branch, unchanged reviewed head, required checks, authenticated QA and Product approvals, and rollout notes. Merge only with authorization and passing gates. |
| `/mb-status [issue-or-pr]` | Delivery Lead | Read current GitHub issues, PRs, reviews, and checks. Show owner, stage, blocker, and next action. |
| `/mb-sprint <issue>` | Delivery Lead | Run the applicable roles in sequence. Reuse existing artifacts and stop at a genuine decision, missing evidence, or approval gate. |

## Handoff rules

- Use GitHub issue and PR numbers, links, and commit SHAs as references. Keep assumptions and unresolved decisions visible.
- Drafts and recommendations can come from agents. For a GitHub approval gate, record the actual authenticated reviewer and the commit they approved.
- A new commit invalidates previous commit-specific QA and Product evidence. Re-run the affected verification before shipping.
- For `/mb-status`, derive the stage from repository evidence. An issue without a PR can be in planning or development. A draft PR is in development. A ready PR with current-commit QA pending is in QA. With QA approved and Product pending, it is in Product sign-off. Show merged only when GitHub reports the merge.
- Report results only for checks actually run. Use blocked when a fixture, environment, tool, or permission is unavailable.
- The command names are chat conventions. The GitHub Actions runner has its own activation and event lifecycle documented in [SDLC handoffs](sdlc-handoffs.md).
