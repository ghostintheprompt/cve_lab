<p align="center">
  <img src="cve_lab.png" width="500" alt="CVE Lab artwork: a magnifying glass reveals a fractured chip beside an intact chip">
</p>

# cve_lab

Docker-based vulnerability and security-configuration labs, one per directory. Each case states the condition it tests and the boundary it does not reproduce. Verification pairs a functionality check with a security-boundary check. The llama-cpp-python case compares upstream vulnerable and patched versions; the Ray case compares authentication configurations on one pinned version. Built to demonstrate the exact work a vulnerability-reproduction/remediation QA role evaluates - reproduction fidelity, fix soundness, verification rigor - on real code, not described.

Scope: mostly AI/ML-adjacent CVEs (model-serving frameworks, inference libraries, training-pipeline tooling), since that's the current target market, but not exclusively.

## Cases

- [`llama-cpp-python-cve-2024-34359`](./llama-cpp-python-cve-2024-34359/) — unsandboxed Jinja2 chat-template rendering (SSTI, CWE-94/1336). Fixed in `0.2.72`.
- [`ray-cve-2025-62593`](./ray-cve-2025-62593/) — Ray 2.59.0 Jobs API authentication configuration: direct local HTTP probes with token authentication disabled and enabled. This is not a reproduction of CVE-2025-62593's browser/DNS-rebinding path, patched upstream in 2.52.0. The historical directory name remains for existing links; see the case's scope correction.

- [`php-drama-queen-lab`](./php-drama-queen-lab/) — October 2026 PHP release-evidence triage. Two digest-pinned Apache images, 12 offline policy tests, and a real loopback HTTP before/after record. This is a patch-evidence workflow, not an RCE reproduction or production clearance.

## Standing rules for every case added here

- Versions and configurations are pinned and inspected directly. A configuration comparison must not be described as a reproduction of a separately patched CVE.
- Exploit demonstrations are non-destructive probes (proving a boundary holds or doesn't), never a weaponized payload. The public disclosure already proves full exploitability where that's been established; re-deriving a working exploit chain isn't the point of this lab and isn't something it ships.
- Every claim about what a lab does gets actually run before it's written down as fact. If Docker wasn't available when a case was built, that's stated plainly rather than assumed to work.
