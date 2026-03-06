"""
Stream registry — non-text data ingestion (prices, NOTAMs, earthquakes, forex).

Usage:
    from services.streams import run_stream, STREAM_CLASSES
    count = run_stream('prices')
"""
from .base import BaseStream
from .prices import PriceStream
from .notam import NotamStream
from .earthquakes import EarthquakeStream
from .forex import ForexStream

STREAM_CLASSES: dict[str, type[BaseStream]] = {
    'prices':      PriceStream,
    'notam':       NotamStream,
    'earthquakes': EarthquakeStream,
    'forex':       ForexStream,
}


def run_stream(key: str) -> int:
    """Instantiate and run a named stream. Returns the count of records saved."""
    cls = STREAM_CLASSES[key]
    return cls().run()
