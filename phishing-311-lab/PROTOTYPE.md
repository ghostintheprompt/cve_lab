# The Duelist: a folder with handling rules

A loopback-only review prototype for synthetic message fixtures. Node.js 22+, standard library, no packages or accounts.

From phishing-311-lab:

```sh
node --test test.mjs quarantine.test.mjs
node evaluate.mjs
node server.mjs
```

Open the printed 127.0.0.1 URL. The server uses a random port. Stop with Ctrl-C. Operator actions persist to `.local-state/state.json`; optionally pass a different state directory as the first argument. To start fresh, choose a new directory. No mail is imported, sent, or fetched. No provider report is submitted.

## Handling

Messages enter Inbox or Phishing through an explicit rule classifier. Both views display plain text. Original HTML can be expanded as text, never inserted as HTML. Embedded forms, images, scripts, and links never become interactive, including after a release. Sender text is unverified. There are no attachment objects in this version; it does not parse MIME, inspect attachment bytes, or claim attachment-sanitization coverage.

Mark as incorrectly quarantined moves the message back to the local Inbox and records an event. Move to Phishing reverses that action. Classification reasons remain visible so a manual move does not erase the original decision. No message-deletion action exists.

Report locally creates one UUID receipt and UTC timestamp per message. Repeating it returns the same receipt. Review must follow received; closure must follow reviewing. Closure says resolved_locally. Provider action stays UNKNOWN. One local operator role exercises all steps; this is not a staffed queue or separation-of-duties system. SHA-256 covers the JSON message fields excluding ground truth, not an original MIME message or forensic custody chain. History is editable local JSON, not a tamper-evident audit log.

Requests require the exact loopback Host; API calls require a random process token; writes additionally require same Origin and JSON, with a 4 KiB body limit. Responses prohibit storage caching and use CSP with nonce scripts, no external resources, no framing, and no form submissions. The state file is private-mode JSON. These controls do not defend against another process already controlling the local account. Persistence is single-process; no multi-user deployment or real private email handling is supported.

## Evaluation

Twelve authored scenarios, six phishing and six benign. Labels describe scenario intent, including one coded malicious message whose wording is indistinguishable from an innocent note without extra context. This is a deliberate limit, not a claim that text rules can identify intent. No held-out set, user study, model call, or provider benchmark.

| Detector | True positive | False negative | False positive | True negative |
| --- | ---: | ---: | ---: | ---: |
| Subject-only baseline | 2 | 4 | 1 | 5 |
| Broader text rules | 5 | 1 | 1 | 5 |

The training quotation is falsely quarantined by both rules. The coded message is missed by both. A storage hostname or HTML table alone does not trigger the broader rules. Saved per-case evaluation permits disagreement with each label and decision. The rules were developed with these fixtures visible; these numbers do not estimate performance on real mail.

Fifteen additional checks pass, including persistent recovery/receipts, invalid status transitions, exact-body preservation, evaluation errors, and loopback UI/API controls. Together with the original fragment suite: 27 passing automated tests. Browser check additionally confirmed literal HTML inspection, report → review → local closure, UNKNOWN provider action, and release of the wrongly quarantined training message. Screenshot: evidence/prototype-browser.png. Browser state is synthetic and is not a real abuse report.

## Operational handoff

In a real service, intake would preserve original MIME privately, classification would provide an evidence-linked suspicion, review would distinguish mail handling from provider enforcement, and escalation would route to the responsible provider or the user's chosen authority. User correction must preserve the original decision and permit reassessment. The prototype demonstrates state transitions; it does not establish legal reporting obligations or send to police.

Measure analyst minutes per reviewed message, arrival volume, oldest open report, time to first review, corrected false positives, recurrence after closure, and harmful interactions from quarantine. Review hours per day = daily review arrivals × measured mean review minutes ÷ 60. Staffing must additionally cover peaks, shifts, absence, escalation, and quality checks. No staffing or dollar figure is asserted without those measurements. Reimbursement eligibility, fraud adjudication, appeals, and payment are policy/implementation work, not features here.

Next evidence: blinded independently labeled messages, MIME/attachment parsing boundaries, bounded adversarial variants, browser request instrumentation, older-user accessibility/usability sessions, and measured queue workload. This prototype cannot stand in for those studies.
