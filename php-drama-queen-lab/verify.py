"""Run only the local compose pair and record bounded release observations."""
import argparse
import hashlib
import json
import subprocess
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from policy import assess

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--context", default="colima-drama-queen-lab")
    parser.add_argument("--output", type=Path, default=ROOT / "evidence" / "local-run.json")
    args = parser.parse_args()
    docker = ["docker", "--context", args.context]
    compose = docker + ["compose", "-p", "drama-queen-lab", "-f", str(ROOT / "compose.yaml")]

    def command(*parts):
        return subprocess.check_output(compose + list(parts), cwd=ROOT, text=True).strip()

    observed = {}
    try:
        command("up", "-d", "--build", "--wait")
        for service in ("before", "after"):
            address = command("port", service, "80")
            if not address.startswith("127.0.0.1:") or not address.rsplit(":", 1)[1].isdigit():
                raise RuntimeError("Refusing a non-loopback mapping")
            url = f"http://{address}/"
            deadline = time.monotonic() + 30
            while True:
                try:
                    with urllib.request.urlopen(url, timeout=2) as response:
                        if response.status != 200:
                            raise RuntimeError("Functionality check failed")
                        payload = json.loads(response.read(8192))
                    break
                except (OSError, ValueError):
                    if time.monotonic() > deadline:
                        raise
                    time.sleep(0.25)
            assert payload["sapi"] == "apache2handler", payload
            verdict = assess(payload)
            container = command("ps", "-q", service)
            inspection = json.loads(subprocess.check_output(docker + ["inspect", container], text=True))[0]
            image = json.loads(subprocess.check_output(docker + ["image", "inspect", inspection["Image"]], text=True))[0]
            observed[service] = {
                "observation": payload,
                "assessment": verdict,
                "image_id": inspection["Image"],
                "base_image": image.get("Config", {}).get("Labels", {}).get("lab.php.base"),
                "repo_digests": image.get("RepoDigests", []),
            }
        assert observed["before"]["assessment"]["release_evidence"] == "BELOW_UPSTREAM_BASELINE"
        assert observed["after"]["assessment"]["release_evidence"] == "AT_OR_ABOVE_UPSTREAM_BASELINE"
        assert observed["after"]["assessment"]["upload_progress_review"] == "DISABLED_IN_OBSERVATION"
        report = {
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "scope": "One HTTP process observation per image; no exploit or all-worker claim",
            "probe_sha256": hashlib.sha256((ROOT / "site" / "index.php").read_bytes()).hexdigest(),
            "services": observed,
            "checks": {"http_functionality": 2, "web_sapi": 2, "release_decisions": 2, "upload_control": 1},
        }
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n")
        print("PASS: two HTTP responses, two web SAPIs, two release decisions, one upload-progress control")
        print(args.output)
    finally:
        command("down", "--remove-orphans")


if __name__ == "__main__":
    main()
