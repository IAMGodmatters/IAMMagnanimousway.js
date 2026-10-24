"""Authentication policy for the external Magnanimous video renderer.

Keep this module dependency-free so the policy can be tested without starting
FFmpeg or the FastAPI application.
"""

import hmac


def renderer_authorization_status(authorization: str, token: str, required: bool = False) -> int:
    """Return 200, 401, or 503 for a renderer request.

    The compatibility mode (no configured token, not required) is temporary.
    Production should set VIDEO_RENDERER_TOKEN on both services and turn on
    VIDEO_RENDERER_REQUIRE_TOKEN once the shared secret has been verified.
    """
    secret = (token or "").strip()
    if not secret:
        return 503 if required else 200
    # Treat the entire header as an opaque value; do not accept prefixes,
    # duplicate values, or credentials appended by an untrusted client.
    expected = f"Bearer {secret}"
    return 200 if hmac.compare_digest(authorization or "", expected) else 401
