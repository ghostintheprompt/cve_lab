import unittest
from policy import assess, BASELINES


def sample(version="8.4.27", sapi="apache2handler", progress=False):
    a, b, c = map(int, version.split("."))
    return {"version": version, "version_id": a*10000+b*100+c, "sapi": sapi,
            "session_upload_progress_enabled": progress}


class ReleaseEvidenceTests(unittest.TestCase):
    def test_each_reviewed_release_boundary(self):
        for branch, patch in BASELINES.items():
            with self.subTest(branch=branch):
                self.assertEqual(assess(sample(f"{branch}.{patch-1}"))["release_evidence"], "BELOW_UPSTREAM_BASELINE")
                self.assertEqual(assess(sample(f"{branch}.{patch}"))["release_evidence"], "AT_OR_ABOVE_UPSTREAM_BASELINE")

    def test_cli_cannot_clear_web_runtime(self):
        self.assertEqual(assess(sample(sapi="cli"))["release_evidence"], "WEB_RUNTIME_NOT_ESTABLISHED")

    def test_unknown_sapi_requires_evidence(self):
        self.assertEqual(assess(sample(sapi="unknown"))["release_evidence"], "WEB_RUNTIME_NOT_ESTABLISHED")

    def test_unknown_branch_is_not_assumed_fixed(self):
        self.assertEqual(assess(sample("8.6.0"))["release_evidence"], "MANUAL_REVIEW")

    def test_vendor_suffix_requires_review(self):
        self.assertEqual(assess({"version": "8.4.26-vendor1"})["release_evidence"], "INVALID_EVIDENCE")

    def test_inconsistent_identity_rejected(self):
        data=sample(); data["version_id"]=80426
        self.assertEqual(assess(data)["release_evidence"], "INVALID_EVIDENCE")

    def test_bool_identity_rejected(self):
        data=sample(); data["version_id"]=True
        self.assertEqual(assess(data)["release_evidence"], "INVALID_EVIDENCE")

    def test_non_object_rejected(self):
        self.assertEqual(assess([])["release_evidence"], "INVALID_EVIDENCE")

    def test_non_string_version_rejected(self):
        self.assertEqual(assess({"version":80427})["release_evidence"], "INVALID_EVIDENCE")

    def test_followup_not_silently_cleared_by_fixed_version(self):
        self.assertEqual(assess(sample(progress=True))["upload_progress_review"], "REVIEW_OCT23_ADVISORY")

    def test_missing_setting_stays_unknown(self):
        data=sample(); del data["session_upload_progress_enabled"]
        self.assertEqual(assess(data)["upload_progress_review"], "SETTING_NOT_OBSERVED")

    def test_disabled_setting_is_only_an_observation(self):
        result=assess(sample())
        self.assertEqual(result["upload_progress_review"], "DISABLED_IN_OBSERVATION")
        self.assertFalse(result["exploit_tested"])
        self.assertEqual(result["worker_coverage"], "ONE_OBSERVATION_ONLY")


if __name__ == "__main__":
    unittest.main()
