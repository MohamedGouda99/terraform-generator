from __future__ import annotations

import threading
from collections import OrderedDict

from app.models.schemas import GenerateResponse, GenerationHistory

MAX_HISTORY = 200


class HistoryStore:
    """Thread-safe, in-memory store for recent generation results."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._store: OrderedDict[str, GenerateResponse] = OrderedDict()

    def save(self, result: GenerateResponse) -> None:
        with self._lock:
            self._store[result.id] = result
            # Evict oldest entries if over limit
            while len(self._store) > MAX_HISTORY:
                self._store.popitem(last=False)

    def get(self, generation_id: str) -> GenerateResponse | None:
        with self._lock:
            return self._store.get(generation_id)

    def list_recent(self, limit: int = 20) -> list[GenerationHistory]:
        with self._lock:
            items = list(reversed(self._store.values()))[:limit]

        return [
            GenerationHistory(
                id=item.id,
                description=item.summary[:120],
                provider=item.provider,
                file_count=len(item.files),
                created_at=item.created_at,
                summary=item.summary,
            )
            for item in items
        ]


# Module-level singleton
history_store = HistoryStore()
