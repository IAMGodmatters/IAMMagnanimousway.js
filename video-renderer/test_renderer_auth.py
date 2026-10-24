import unittest

from renderer_auth import renderer_authorization_status


class RendererAuthorizationTests(unittest.TestCase):
    def test_correct_server_token(self):
        self.assertEqual(renderer_authorization_status("Bearer private-test-token", "private-test-token", True), 200)

    def test_no_token_or_malformed_token_is_denied(self):
        for value in ["", "private-test-token", "Bearer private-test-token-extra", "Basic private-test-token"]:
            with self.subTest(value=value):
                self.assertEqual(renderer_authorization_status(value, "private-test-token"), 401)

    def test_strict_mode_fails_closed_without_secret(self):
        self.assertEqual(renderer_authorization_status("", "", True), 503)

    def test_compatibility_mode_preserves_existing_free_rendering(self):
        self.assertEqual(renderer_authorization_status("", "", False), 200)

    def test_paid_mux_write_must_not_use_compatibility_mode(self):
        self.assertEqual(renderer_authorization_status("", "", required=True), 503)


if __name__ == "__main__":
    unittest.main()
