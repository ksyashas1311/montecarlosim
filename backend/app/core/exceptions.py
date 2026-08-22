from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class FinTwinException(Exception):
    def __init__(self, detail: str, reference_code: str = "ERR-GENERIC", status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.detail = detail
        self.reference_code = reference_code
        self.status_code = status_code

async def fintwin_exception_handler(request: Request, exc: FinTwinException):
    logger.error(f"FinTwinException: {exc.detail} - Ref: {exc.reference_code} at {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": f"An error occurred. Reference: {exc.reference_code}"},
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)} at {request.url}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "An internal server error occurred. Reference: ERR-UNHANDLED"},
    )
