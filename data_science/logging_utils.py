"""Small, dependency-free helpers for keeping application logs PII-safe."""

from __future__ import annotations

import re
import logging
from typing import Any


_EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
_PHONE = re.compile(r"(?<!\d)(?:\+?\d[\s().-]?){8,}\d(?!\d)")
_CARD = re.compile(r"(?<!\d)(?:\d[ -]?){13,19}(?!\d)")
_BEARER = re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+")
_SECRET = re.compile(
    r"(?i)(\b(?:password|passwd|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*)[^\s,;]+"
)


def redact_pii(value: Any) -> str:
    """Return text safe for logs without preserving personal values."""

    text = str(value)
    text = _SECRET.sub(r"\1[REDACTED]", text)
    text = _BEARER.sub(r"\1[REDACTED]", text)
    text = _EMAIL.sub("[REDACTED_EMAIL]", text)
    text = _CARD.sub("[REDACTED_NUMBER]", text)
    return _PHONE.sub("[REDACTED_PHONE]", text)


def exception_type(error: BaseException) -> str:
    """Expose diagnostic type information without exposing exception text."""

    return type(error).__name__


class PiiSafeFormatter(logging.Formatter):
    """Redact the complete rendered record, including exception tracebacks."""

    def format(self, record: logging.LogRecord) -> str:
        return redact_pii(super().format(record))
