import hmac

from .config import TelecomSettings
from .errors import TelecomConfigurationError, TelecomUnauthorizedError


class TelecomTokenAuthenticator:
    def __init__(self, settings: TelecomSettings):
        self._settings = settings

    def verify(self, authorization: str | None) -> None:
        configured = self._settings.api_token
        if not configured:
            raise TelecomConfigurationError("Telecom API authentication is not configured.")
        supplied = ""
        if authorization and authorization.lower().startswith("bearer "):
            supplied = authorization[7:].strip()
        if not supplied or not hmac.compare_digest(supplied, configured):
            raise TelecomUnauthorizedError("Invalid telecom API token.")
