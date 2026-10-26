"""Attachment metadata; binary storage remains a replaceable authenticated adapter."""
from dataclasses import dataclass, field
from uuid import uuid4


@dataclass(frozen=True)
class Attachment:
    owner_id: str
    content_type: str
    size_bytes: int
    storage_key: str
    id: str = field(default_factory=lambda: str(uuid4()))

    def __post_init__(self):
        if self.size_bytes < 0:
            raise ValueError("attachment size cannot be negative")
        if not self.storage_key:
            raise ValueError("storage key is required")
