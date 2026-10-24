<p align="center">
  <img src="cve_lab.png" width="500" alt="CVE Lab artwork: a magnifying glass reveals a fractured chip beside an intact chip">
</p>

# cve_lab

Real CVE reproductions, one per directory: faithful Docker-based repro of the exploitable condition, the real upstream fix applied and verified, and two-part verification (a functionality test that the fix doesn't break the feature, a vulnerability test that the hole is actually closed). Built to demonstrate the exact work a vulnerability-reproduction/remediation QA role evaluates - reproduction fidelity, fix soundness, verification rigor - on real code, not described.

Scope: mostly AI/ML-adjacent CVEs (model-serving frameworks, inference libraries, training-pipeline tooling), since that's the current target market, but not exclusively.

## Cases

- [`llama-cpp-python-cve-2024-34359`](./llama-cpp-python-cve-2024-34359/) — unsandboxed Jinja2 chat-template rendering (SSTI, CWE-94/1336). Fixed in `0.2.72`.
- [`ray-cve-2025-62593`](./ray-cve-2025-62593/) — Ray Jobs API ships with no authentication by default, still true on the current latest release (`2.59.0`) at time of writing. CISA KEV-listed, actively exploited. Mitigation is an opt-in config (`RAY_AUTH_MODE=token`), not a version bump - the lab's structure reflects that (one image, two configs, not two images).

## Standing rules for every case added here

- The vulnerable and patched versions are both real, pinned, installed, and read directly - no behavior described from a writeup without confirming it against the actual source.
- Exploit demonstrations are non-destructive probes (proving a boundary holds or doesn't), never a weaponized payload. The public disclosure already proves full exploitability where that's been established; re-deriving a working exploit chain isn't the point of this lab and isn't something it ships.
- Every claim about what a lab does gets actually run before it's written down as fact. If Docker wasn't available when a case was built, that's stated plainly rather than assumed to work.
