"""Per-record pipeline stage tracking helpers (WA3.6).

Each per-record worker calls ``mark_stage(record, stage, ok=..., error=...)`` to
record the outcome of a pipeline step on the record's ``stage_status`` JSON. This
makes the *reason* a step is missing visible (not just that it's missing) and feeds
the admin dashboard's pipeline-coverage panel.

Shape written onto ``stage_status``:
    {"<stage>": {"ok": bool, "at": "ISO-8601", "error": str | None}, ...}

The caller is responsible for persisting the record (e.g. including
``'stage_status'`` in ``save(update_fields=...)``).
"""
from __future__ import annotations

from datetime import datetime, timezone


def mark_stage(record, stage: str, ok: bool, error: str | None = None) -> dict:
    """Record ``stage``'s outcome on ``record.stage_status`` (in place). Returns the dict."""
    status = dict(getattr(record, 'stage_status', None) or {})
    status[stage] = {
        'ok': bool(ok),
        'at': datetime.now(timezone.utc).isoformat(),
        'error': (error or None) if not ok else None,
    }
    record.stage_status = status
    return status
