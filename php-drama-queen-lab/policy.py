"""Offline PHP release-evidence triage. No scanning, code execution, or attestation."""
import argparse
import json
import re
from pathlib import Path

REVIEWED_ON = "2026-10-25"
BASELINES = {"8.2": 35, "8.3": 36, "8.4": 27, "8.5": 12}
SOURCE = "https://www.php.net/archive/2026.php#2026-10-21-5"
WEB_SAPIS = {"apache2handler", "fpm-fcgi", "cgi-fcgi", "frankenphp", "litespeed"}


def assess(observation):
    result = {
        "policy_reviewed_on": REVIEWED_ON,
        "source": SOURCE,
        "release_evidence": "INVALID_EVIDENCE",
        "worker_coverage": "ONE_OBSERVATION_ONLY",
        "exploit_tested": False,
        "notes": [],
    }
    if not isinstance(observation, dict):
        result["notes"].append("Expected a JSON object.")
        return result
    version = observation.get("version")
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", version or "") if isinstance(version, str) else None
    if not match:
        result["notes"].append("Expected an unmodified stable upstream version; inspect vendor builds separately.")
        return result
    major, minor, patch = map(int, match.groups())
    identity = observation.get("version_id")
    if type(identity) is not int or identity != major * 10000 + minor * 100 + patch:
        result["notes"].append("PHP version and PHP_VERSION_ID disagree or are missing.")
        return result
    sapi = observation.get("sapi")
    if sapi not in WEB_SAPIS:
        result["release_evidence"] = "WEB_RUNTIME_NOT_ESTABLISHED"
        result["notes"].append("A CLI/unknown SAPI observation cannot clear a web deployment.")
        return result
    branch = f"{major}.{minor}"
    if branch not in BASELINES:
        result["release_evidence"] = "MANUAL_REVIEW"
        result["notes"].append("Branch outside this dated policy; no inference from a higher/lower version alone.")
        return result
    result["release_evidence"] = (
        "AT_OR_ABOVE_UPSTREAM_BASELINE" if patch >= BASELINES[branch]
        else "BELOW_UPSTREAM_BASELINE"
    )
    if patch < BASELINES[branch]:
        result["notes"].append("Update or obtain explicit vendor-backport evidence; version alone cannot evaluate a backport.")
    else:
        result["notes"].append("Matches the reviewed release threshold, not proof of exploit resistance or complete deployment coverage.")
    progress = observation.get("session_upload_progress_enabled")
    result["upload_progress_review"] = (
        "DISABLED_IN_OBSERVATION" if progress is False
        else "REVIEW_OCT23_ADVISORY" if progress is True
        else "SETTING_NOT_OBSERVED"
    )
    result["notes"].append("The Oct 23 serializer-switch condition requires application/configuration review; this snapshot cannot detect it.")
    result["notes"].append("Self-reported process data; sample every relevant pool/image/worker cohort and verify package provenance independently.")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("observation", type=Path, help="Local JSON from the provided PHP probe")
    args = parser.parse_args()
    result = assess(json.loads(args.observation.read_text()))
    print(json.dumps(result, indent=2))
    return 0 if result["release_evidence"] == "AT_OR_ABOVE_UPSTREAM_BASELINE" else 2


if __name__ == "__main__":
    raise SystemExit(main())
