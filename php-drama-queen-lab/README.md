# Drama Queen Lab: PHP patch evidence

A Sunday incident-triage lab, built October 25, 2026. Turn an advisory into a small, reviewable deployment-evidence record. The joke is the name; the classifications have controls.

## Scope

This is a **release-evidence and web-runtime verification lab**, not a reproduction of either PHP RCE. It exercises a real Apache/mod_php before/after pair and a separate offline policy checker. No exploit, memory-corruption trigger, shell, account access, or production target is involved.

The PHP project announced fixes for CVE-2026-109618 and CVE-2026-109619 on October 21. Its upstream release thresholds are 8.2.35, 8.3.36, 8.4.27, and 8.5.12. Distribution backports require the vendor's own package evidence; this tool cannot infer their status from the upstream version string.

The October 23 follow-up concerns an unusual serializer-switch path while session upload progress remains enabled. We record that setting separately. An enabled value prompts review, not a claim that the configuration is exploitable. The snapshot cannot see application calls that change serializers later.

Sources: [PHP announcements, October 21 and 23](https://www.php.net/archive/2026.php), [OOM advisory](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w), [stale-state advisory](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp).

## Run

Python 3 standard library for policy checks:

```sh
python3 -m unittest discover -s tests -v
```

Docker Engine and Compose for the HTTP pair. Choose your actual Docker context (`docker context ls`). For a standard default context:

```sh
python3 verify.py --context default
```

The recorded Mac run used `--context colima-drama-queen-lab`. The verifier builds two small derived images, publishes only random loopback ports, waits for JSON, checks the two responses, records observations/image identities, then tears down the compose project. Each container is limited to 192 MiB, half a CPU, and 96 processes. No existing PHP service is changed. The local Docker profile, if any, is managed separately.

`compose.yaml` defaults to the immutable official-image digests recorded in the checked run. `PHP_BEFORE_IMAGE` and `PHP_AFTER_IMAGE` can override them for a deliberate rerun; the evidence records the selected base references. The after image changes both the runtime release and a startup INI setting. These are independently observed controls, not evidence that upgrading automatically disables upload progress.

To assess a saved local observation:

```sh
python3 policy.py observation.json
```

Exit zero means the observed web version reaches this dated upstream baseline. It does **not** mean a deployment is secure, every worker is updated, or follow-up configuration review is complete. Other outcomes exit 2.

## Recorded result

`evidence/local-run.json` contains the actual October 25 run, not example output. Both services returned HTTP 200 JSON and `apache2handler`:

| Observation | Before | After |
|---|---|---|
| PHP | 8.4.26 | 8.4.27 |
| Release decision | BELOW_UPSTREAM_BASELINE | AT_OR_ABOVE_UPSTREAM_BASELINE |
| Upload progress | enabled | disabled |
| Model/exploit test | none | none |

Twelve offline tests pass. They cover the four branch boundaries, malformed/inconsistent evidence, CLI/unknown SAPI rejection, unknown branches/vendor strings, and separate follow-up-setting review. The container run checks two HTTP responses, two SAPIs, two release decisions, and the disabled-setting control. These are checks of the evidence workflow, not seven vulnerability reproductions.

## Limits that belong in the handoff

One request per image observes one process in each container. It does not enumerate every worker or production pool. The endpoint self-reports process data; it is not remote attestation. A version threshold does not verify a binary's provenance or test the CVE fix. Vendor builds, unknown branches, and suffixed versions require manual review. New advisories can supersede this dated policy.

The probe returns only version, SAPI, PID, memory limit, upload-progress setting, and serializer name. It intentionally avoids a full phpinfo dump. Keep it in this isolated lab. An actual engagement needs an approved collection method, an inventory of serving pools/images, vendor package records, and sampling appropriate to those worker cohorts.

No claim of exclusive discovery. The value is an inspectable handoff that separates a patch announcement, a process observation, and a deployment decision.
