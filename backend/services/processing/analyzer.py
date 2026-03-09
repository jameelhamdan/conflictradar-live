import functools
import json
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

_CATEGORIES = {'conflict', 'protest', 'disaster', 'political', 'economic', 'crime', 'general'}

_SUB_CATEGORIES: dict[str, set[str]] = {
    'conflict':  {'airstrike', 'ground_offensive', 'naval', 'siege', 'ceasefire', 'casualties', 'other'},
    'protest':   {'rally', 'riot', 'strike', 'blockade', 'march', 'other'},
    'disaster':  {'earthquake', 'flood', 'wildfire', 'explosion', 'epidemic', 'storm', 'other'},
    'political': {'election', 'coup', 'legislation', 'diplomacy', 'sanction', 'other'},
    'economic':  {'trade', 'inflation', 'energy', 'markets', 'fiscal', 'supply_chain', 'other'},
    'crime':     {'murder', 'fraud', 'corruption', 'trafficking', 'arrest', 'other'},
    'general':   {'other'},
}

_SYSTEM_PROMPT = """\
You are a news article analyzer. Extract structured information from the article and respond \
with a single valid JSON object — no markdown, no explanation, just JSON.

Schema:
{
  "category":     one of: conflict | protest | disaster | political | economic | crime | general,
  "sub_category": sub-category slug for the chosen category (see list below), or null,
  "country":      country name in English as a string, or null if not determinable,
  "city":         city or region name in English as a string, or null if not determinable,
  "translations": {
    "en": {
      "title":   the article title translated to English (keep original if already English),
      "summary": a 2-3 sentence factual summary in English,
      "country": country name in English, or null,
      "city":    city or region name in English, or null
    },
    "ar": {
      "title":   the article title translated to Arabic,
      "summary": a 2-3 sentence factual summary in Arabic,
      "country": country name in Arabic, or null,
      "city":    city or region name in Arabic, or null
    }
  }
}

Category and sub-category definitions:

- conflict  [airstrike | ground_offensive | naval | siege | ceasefire | casualties | other]
    Armed conflict, military attack, war, frontline operations.
    USE THIS whenever a deliberate armed or military action is involved — including missile
    strikes, drone attacks, artillery shelling, airstrikes, cross-border attacks, or clashes
    between two nations or armed groups — even if the outcome involves explosions, fires,
    casualties, or mass destruction. An event where Country A attacks Country B is ALWAYS
    conflict, never disaster.

- protest   [rally | riot | strike | blockade | march | other]
    Demonstration, civil unrest, uprising, civilian strike.

- disaster  [earthquake | flood | wildfire | explosion | epidemic | storm | other]
    Natural catastrophe (earthquake, flood, storm, wildfire) or a purely accidental
    industrial/infrastructure event (factory explosion, chemical spill, pipeline leak)
    where there is NO deliberate military or armed aggressor.
    IMPORTANT: If an explosion, fire, or mass-casualty event was caused by a military
    strike, bombing, or armed attack, use conflict — not disaster.

- political [election | coup | legislation | diplomacy | sanction | other]
    Government decisions, diplomatic summits, elections, coups, sanctions.

- economic  [trade | inflation | energy | markets | fiscal | supply_chain | other]
    Finance, trade, markets, energy policy.

- crime     [murder | fraud | corruption | trafficking | arrest | other]
    Police investigations, criminal acts not involving military actors.

- general   [other]
    Anything that does not clearly fit the above categories.

Decision rule — conflict vs disaster:
  Ask: "Was this caused by a deliberate armed/military action?"
  YES → conflict (even if buildings burned, people died, or infrastructure was destroyed)
  NO  → disaster (natural event or purely accidental)\
"""


@dataclass
class ArticleAnalysis:
    category: str             # one of _CATEGORIES
    sub_category: str | None  # sub-category slug within category, or None
    country: str | None       # e.g. "Ukraine"
    city: str | None          # e.g. "Kyiv"
    latitude: float | None
    longitude: float | None
    llm_data: dict            # raw parsed LLM response for storage in extra_data
    translations: dict        # i18n subdocument: {"en": {...}, "ar": {...}}


@functools.lru_cache(maxsize=1)
def _city_index() -> dict[str, tuple[float, float]]:
    """Lowercase city name → (lat, lon) of the most populous city with that name."""
    import geonamescache
    # population → (lat, lon) per name; keeps highest-population entry on collision
    best: dict[str, tuple[int, float, float]] = {}
    for c in geonamescache.GeonamesCache().get_cities().values():
        name = c['name'].lower()
        pop = int(c.get('population') or 0)
        if name not in best or pop > best[name][0]:
            best[name] = (pop, float(c['latitude']), float(c['longitude']))
    return {name: (lat, lon) for name, (_, lat, lon) in best.items()}


@functools.lru_cache(maxsize=1)
def _country_index() -> dict[str, tuple[float, float]]:
    """
    Lowercase country name → (lat, lon).

    Strategy per country:
      1. Try the capital city name against the city index (fast, usually works).
      2. Fall back to the most populous city in that country by country code
         (robust against capital-name spelling mismatches like Kiev/Kyiv).
    """
    import geonamescache
    gc = geonamescache.GeonamesCache()
    city_idx = _city_index()

    # country_code → (population, lat, lon) for the most populous city
    top_by_cc: dict[str, tuple[int, float, float]] = {}
    for c in gc.get_cities().values():
        cc = c.get('countrycode', '')
        pop = int(c.get('population') or 0)
        lat, lon = float(c['latitude']), float(c['longitude'])
        if cc and (cc not in top_by_cc or pop > top_by_cc[cc][0]):
            top_by_cc[cc] = (pop, lat, lon)

    index: dict[str, tuple[float, float]] = {}
    for iso, cdata in gc.get_countries().items():
        country_lower = cdata['name'].lower()
        capital = (cdata.get('capital') or '').strip()

        # 1. try capital name match
        coords: tuple[float, float] | None = city_idx.get(capital.lower()) if capital else None

        # 2. fall back to most populous city in this country
        if not coords and iso in top_by_cc:
            _, lat, lon = top_by_cc[iso]
            coords = (lat, lon)

        if coords:
            index[country_lower] = coords

    return index


def _geocode(city: str | None, country: str | None = None) -> tuple[float | None, float | None]:
    """
    Try city first; fall back to the country's main city if city is absent or unknown.
    Returns (None, None) if neither resolves.
    """
    if city:
        coords = _city_index().get(city.lower())
        if coords:
            return coords
    if country:
        coords = _country_index().get(country.lower())
        if coords:
            return coords
    return None, None


class ArticleAnalyzer:
    """
    Uses the LLM to extract category, country, city, and coordinates from article text.

    Requires OPENROUTER_API_KEYS to be configured.
    Falls back to ArticleAnalysis(category='general', ...) on any failure.

    Usage:
        analyzer = ArticleAnalyzer()
        result = analyzer.analyze('Explosions were reported near Kyiv overnight...')
        # ArticleAnalysis(category='conflict', country='Ukraine', city='Kyiv', latitude=50.45, longitude=30.52)
    """

    _MAX_CHARS = 2000

    def __init__(self) -> None:
        from services.llm import get_llm_service
        self._llm = get_llm_service()

    def analyze(self, text: str) -> ArticleAnalysis:
        """
        Analyze article text and return category + location.
        Returns a zeroed-out ArticleAnalysis on any failure.
        """
        try:
            raw = self._llm.chat(
                messages=[
                    {'role': 'system', 'content': _SYSTEM_PROMPT},
                    {'role': 'user', 'content': text[: self._MAX_CHARS]},
                ],
                temperature=0,
            )
            return self._parse(raw)
        except Exception:
            logger.exception('ArticleAnalyzer.analyze failed')
            return ArticleAnalysis(
                category='general', sub_category=None,
                country=None, city=None,
                latitude=None, longitude=None,
                llm_data={},
                translations={},
            )

    def _parse(self, raw: str) -> ArticleAnalysis:
        data = json.loads(raw.strip())
        category = data.get('category', 'general')
        if category not in _CATEGORIES:
            category = 'general'
        raw_sub = data.get('sub_category') or None
        valid_subs = _SUB_CATEGORIES.get(category, {'other'})
        sub_category = raw_sub if raw_sub in valid_subs else None
        country = data.get('country') or None
        city = data.get('city') or None
        lat, lon = _geocode(city, country)
        translations = data.get('translations') or {}
        # Sanitise: ensure each language entry is a dict
        if not isinstance(translations, dict):
            translations = {}
        for lang_key in list(translations.keys()):
            if not isinstance(translations[lang_key], dict):
                del translations[lang_key]
        llm_data = {
            'category': category,
            'sub_category': sub_category,
            'country': country,
            'city': city,
        }
        return ArticleAnalysis(
            category=category, sub_category=sub_category,
            country=country, city=city,
            latitude=lat, longitude=lon,
            llm_data=llm_data,
            translations=translations,
        )
