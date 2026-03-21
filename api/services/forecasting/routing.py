"""Asset routing: map (category, location, topic_slugs) → list[symbol]."""

# topic slug → affected symbols (highest-signal routing)
TOPIC_TO_SYMBOLS: dict[str, list[str]] = {
    'ukraine-war':          ['NG=F', 'ZW=F', 'CL=F', 'GC=F'],
    'russia-ukraine':       ['NG=F', 'ZW=F', 'CL=F', 'GC=F'],
    'middle-east-conflict': ['CL=F', 'GC=F'],
    'iran':                 ['CL=F', 'GC=F'],
    'opec':                 ['CL=F'],
    'fed-rates':            ['^TNX', 'SPY', 'GC=F'],
    'us-economy':           ['SPY', '^GSPC', 'DX-Y.NYB'],
    'china-economy':        ['^HSI', 'CL=F'],
    'us-china-trade':       ['SPY', '^HSI', 'DX-Y.NYB'],
    'inflation':            ['GC=F', '^TNX', 'DX-Y.NYB'],
    'crypto':               ['BTC-USD', 'ETH-USD'],
    'bitcoin':              ['BTC-USD'],
}

# (category, region_keyword, symbols) — evaluated top-down, region='' matches all
CATEGORY_REGION_RULES: list[tuple[str, str, list[str]]] = [
    ('conflict',  'middle east', ['CL=F', 'GC=F']),
    ('conflict',  'russia',      ['NG=F', 'GC=F']),
    ('conflict',  'ukraine',     ['NG=F', 'ZW=F']),
    ('conflict',  'iran',        ['CL=F', 'GC=F']),
    ('conflict',  'israel',      ['CL=F', 'GC=F']),
    ('conflict',  'taiwan',      ['^HSI', 'TSM']),
    ('disaster',  'japan',       ['^N225']),
    ('disaster',  'gulf',        ['CL=F']),
    ('economic',  '',            ['SPY', '^GSPC', 'GC=F']),
    ('political', 'us',          ['SPY', 'DX-Y.NYB']),
    ('political', 'europe',      ['EURUSD=X', '^STOXX50E']),
    ('political', 'china',       ['^HSI', 'USDCNY=X']),
]

# fallback if no rules match
CATEGORY_DEFAULTS: dict[str, list[str]] = {
    'conflict':  ['GC=F', 'CL=F'],
    'economic':  ['SPY', 'GC=F'],
    'political': ['GC=F', 'SPY'],
    'disaster':  ['GC=F'],
    'protest':   ['GC=F'],
    'crime':     [],
    'general':   [],
}


def route_event_to_symbols(
    category: str,
    location: str,
    topic_slugs: list[str],
) -> list[str]:
    """Return a deduplicated list of symbols this event likely affects."""
    symbols: list[str] = []

    for slug in topic_slugs:
        symbols.extend(TOPIC_TO_SYMBOLS.get(slug, []))

    loc_lower = (location or '').lower()
    for cat, region, syms in CATEGORY_REGION_RULES:
        if cat == category and (not region or region in loc_lower):
            symbols.extend(syms)

    if not symbols:
        symbols.extend(CATEGORY_DEFAULTS.get(category, []))

    seen: set[str] = set()
    result: list[str] = []
    for s in symbols:
        if s not in seen:
            seen.add(s)
            result.append(s)
    return result
