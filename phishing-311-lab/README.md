# The Duelist

A local URL-fragment and reporting-evidence lab. The [quarantine prototype](PROTOTYPE.md) now adds a browser interface, persistent local receipts, recovery, and a scored synthetic evaluation. Node.js 22 or later; no packages, account, API key, browser extension, or cloud deployment.

```sh
node --test test.mjs
node lab.mjs
```

The server prints an ephemeral loopback URL. Open it manually to see a literal fragment marker. Change the marker after `#`. The page never navigates elsewhere, collects credentials, or loads external resources. Stop with Ctrl-C.

`describeLink` separates the full link's fragment from its request URL without fetching anything. `summarizeReport` accepts an operator record containing sample SHA-256, UTC report time, channel, and optional timestamped HTTP-status observation. It leaves provider action, warning coverage, and victim outcome UNKNOWN. It does not submit reports or check URLs. Do not put private message content or victim identifiers into public records.

## Recorded scope

October 25, 2026, Node v24.20.0: 12 tests passed. The integration test made two HTTP requests to a temporary 127.0.0.1 server, observed `/fixture` for both fragment variants, and compared returned bodies. Client script checks execute JavaScript against a stub DOM using Node vm. They are not browser rendering tests. The initial restricted run could not bind a port; the approved local-network rerun passed. Saved output: evidence/local-tests.txt. Hashes: evidence/run.json.

The fixture intentionally permits its own inline script. Its CSP limits resources, forms, framing, and base URLs; it does not establish a general navigation-blocking policy. The marker is assigned through textContent, never interpreted as HTML.

No Gmail delivery, spam filtering, Safe Browsing verdict, Google Cloud resource, abuse report, takedown, or actual phishing sample was tested. A 404 can result from many causes and is not proof of enforcement. Fragment omission from HTTP does not hide the fragment from an email scanner that has the original link. It takes application logic to interpret a fragment.
