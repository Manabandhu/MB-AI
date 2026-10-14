# ManaBandhu usability study

Status: prepared, not fielded. No participants have been recruited and no feedback has been collected. Automated checks and local development fixtures are not participant evidence.

## Study question

Can South Asian residents abroad discover relevant local help, understand listings, and complete key tasks without assistance? Test the current branch before choosing further visual changes. Do not assume an ethnicity determines visual preferences.

## Fieldwork sequence

1. Confirm the panel source, budget, participant target, supported countries, and a stable participant-facing build. The current local development server and fixture accounts are unsuitable for recruitment.
2. Pilot with 12–18 participants across newcomer and established-resident groups, primary languages, mobile operating systems, and accessibility needs. These are qualitative sessions, not population estimates.
3. Fix observed task blockers and repeat affected tasks with fresh participants.
4. Run a broader unmoderated study, initially 200–400 valid responses. Set quotas and sample size with the panel provider for the intended population and comparisons. A convenience sample cannot establish majority preference for all South Asians abroad.
5. Expand only after quality checks and costs are understood. If 300,000 is the intended research sample, obtain a recruitment and analysis plan from the provider; if it is the intended app audience, distinguish that from the study sample.

## Recruitment and handling

Recruit adults who live in supported countries and could realistically use community services. Include varied migration tenure, language preferences, and digital confidence. Language, country, device class, and newcomer status should be optional self-reported research fields. Avoid collecting visa details, identity documents, exact addresses, private messages, or financial information.

Explain purpose, session recording choices, incentive, withdrawal, retention, and who receives data before participation. Use pseudonymous participant IDs. Keep panel contact information outside the response dataset. Obtain separate permission for recordings and quotations. Set a deletion date and identify the study owner before launch.

## Moderator script

“We are testing the app, not you. Please think aloud. You can stop or skip a question. Use the supplied test data; do not enter private information. There are no right answers about appearance.”

Allow participants to explore without pointing to buttons. Record assistance separately. Rotate task order where dependencies permit. Do not ask whether the app looks like CRED or praise a preferred design before the tasks.

## Task cards

| ID | Scenario | Observable success |
| --- | --- | --- |
| T1 | You recently moved. Find rooms in your chosen supported city and inspect one listing. | Reaches Rooms, understands location and key terms, opens a listing. |
| T2 | Find a job relevant to you, inspect its requirements, and save it for later. | Opens a job detail and can retrieve the saved item. |
| T3 | Find where you would look for community connections or events near you. | Reaches the relevant directory and can explain the next step. |
| T4 | Change the interface to your preferred supported language; return home and find Rooms using search. | Finds language control, preference persists, native or English search reaches Rooms. |
| T5 | Locate immigration resources and explain whether the app supplies information or personal legal advice. | Finds resources and accurately interprets the presented service. |
| T6 | You and a flatmate share costs. Find where you would manage those expenses. | Reaches shared expenses and understands the initial action. |
| T7 | Find how to obtain help or report a safety concern. | Finds the relevant support/report entry and understands its purpose. |

Use seeded study content, reset accounts between participants, and stop before real applications, public posts, payments, or messages. Run account creation separately with study-controlled accounts if that journey is in scope.

## Questionnaire

After each task: “How easy or difficult was this task?” (1 very difficult to 7 very easy); “What, if anything, confused you?” Record completed, partial, failed, or skipped; elapsed seconds; assistance; and the screen where friction occurred.

After the session:

- What did you expect this app to help you do?
- Which part was most useful? Which part would you change first?
- How clear was navigation? (1 not clear to 5 very clear)
- How readable were text and controls? (1 difficult to 5 easy)
- How confident were you about the next action? (1 not confident to 5 confident)
- Did the language feel natural? Give an example if something felt wrong.
- What prevented you from completing a task, if anything?

If comparing visual directions, use the same content and task capabilities, randomize presentation order, and distinguish preference from task performance. Include a “neither” answer. Do not present aesthetic votes as proof of better usability.

## Analysis and upgrade decisions

Calculate success and assistance rates per task, median and upper-quartile completion time for completed tasks, and task-ease distributions. Report denominators and missing responses. Split by language/device/newcomer status only where groups are large enough to interpret; suppress tiny identifiable groups. Report sampling limitations and recruitment source.

Remove duplicates, bots, and unusable sessions using predeclared provider quality checks; retain an exclusion log. Keep failures in the denominator rather than excluding unhappy participants. Code open comments by observed problem, not by desired design conclusion.

Prioritize: blockers preventing completion; repeated confusion; readability/accessibility failures; then cosmetic preferences. For each proposed change, link task IDs and anonymized observations, state a hypothesis, and define the same task measure for retesting. Do not redesign every screen based on one participant's taste.

## Current gaps

No research-panel integration or participant-facing study deployment has been supplied. Product analytics directories currently define ownership only, with no production feedback dataset available in this workspace. Physical-device and native-speaker validation remain necessary. No UI preferences can be inferred from the existing automated test results.
