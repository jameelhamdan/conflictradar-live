import datetime
from typing_extensions import TypedDict
from typing import Iterator, TYPE_CHECKING

if TYPE_CHECKING:
    import core.models


class _ArticleDatumRequired(TypedDict):
    source_url: str
    author: str
    author_slug: str
    title: str
    content: str
    published_on: datetime.datetime
    extra_data: dict


class ArticleDatum(_ArticleDatumRequired, total=False):
    """Required base fields plus optional banner_image_url."""
    banner_image_url: str


class ClientServiceException(Exception):
    code = 'data_client_error'


class BaseClientService:
    """
    Define base class for data services and base interfaces
    """

    def __init__(self, source: 'core.models.Source'):
        self.source = source

    def fetch_data(self, start_date: datetime.datetime) -> Iterator[ArticleDatum]:
        yield from []
