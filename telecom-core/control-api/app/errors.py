class TelecomError(Exception):
    status_code = 500
    code = "TELECOM_ERROR"

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail


class TelecomValidationError(TelecomError):
    status_code = 422
    code = "TELECOM_VALIDATION_ERROR"


class TelecomUnauthorizedError(TelecomError):
    status_code = 401
    code = "TELECOM_UNAUTHORIZED"


class TelecomConfigurationError(TelecomError):
    status_code = 503
    code = "TELECOM_CONFIGURATION_ERROR"


class CarrierUnavailableError(TelecomError):
    status_code = 502
    code = "CARRIER_UNAVAILABLE"


class CarrierRejectedError(TelecomError):
    status_code = 502
    code = "CARRIER_REJECTED"


class SipAccountConflictError(TelecomError):
    status_code = 409
    code = "SIP_ACCOUNT_EXISTS"


class SipAccountNotFoundError(TelecomError):
    status_code = 404
    code = "SIP_ACCOUNT_NOT_FOUND"

class TelecomNotFoundError(TelecomError):
    status_code = 404
    code = "TELECOM_NOT_FOUND"

