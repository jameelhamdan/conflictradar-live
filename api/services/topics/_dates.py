"""Parse free-form date hints (e.g. "March 2025") into timezone-aware datetimes."""
import re
from datetime import datetime, timezone

_MONTHS = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
}


def parse_approximate_date(text: str) -> datetime | None:
    if not text:
        return None
    lower = text.strip().lower()
    for name, num in _MONTHS.items():
        if name in lower:
            m = re.search(r'\b(20\d{2}|19\d{2})\b', lower)
            year = int(m.group(1)) if m else datetime.now(timezone.utc).year
            try:
                return datetime(year, num, 1, tzinfo=timezone.utc)
            except ValueError:
                pass
    # Fall back to year-only (e.g. "2014", "2022")
    m = re.search(r'\b(20\d{2}|19\d{2})\b', lower)
    if m:
        return datetime(int(m.group(1)), 1, 1, tzinfo=timezone.utc)
    return None
