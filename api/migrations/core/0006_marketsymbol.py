# Hand-written: adds the MarketSymbol config model — the single source of truth for
# what the price streams fetch, what the forecasting layer targets, and what the
# Markets UI shows. Replaces hardcoded symbol lists in streams/prices.py,
# forecasting/history.py, forecasting/routing.py, and ui/src/lib/symbols.ts.
# Includes an idempotent data seed (update_or_create by symbol).

import django_mongodb_backend.fields
from django.db import migrations, models


# (symbol, name, stream_key, provider, provider_id, group,
#  is_active, is_forecast, is_popular, rank, display_order)
SEED = [
    # ── Forecast base panel (is_forecast=True) ──────────────────────────────
    ('CL=F',     'Crude Oil',          'commodity', 'yahoo',     '',            'resource',   True, True,  True, 1, 1),
    ('GC=F',     'Gold',               'commodity', 'yahoo',     '',            'resource',   True, True,  True, 0, 0),
    ('BTC-USD',  'Bitcoin',            'crypto',    'coingecko', 'bitcoin',     'top_crypto', True, True,  True, 0, 0),
    ('SPY',      'S&P 500 ETF',        'stock',     'yahoo',     '',            'top_stock',  True, True,  True, 0, 0),
    ('EURUSD=X', 'EUR/USD',            'forex',     'yahoo',     '',            'forex',      True, True,  True, 0, 0),

    # ── Resources / commodities ─────────────────────────────────────────────
    ('NG=F',     'Natural Gas',        'commodity', 'yahoo',     '',            'resource',   True, False, True, 2, 2),
    ('ZW=F',     'Wheat',              'commodity', 'yahoo',     '',            'resource',   True, False, False, 0, 3),
    ('ZC=F',     'Corn',               'commodity', 'yahoo',     '',            'resource',   True, False, False, 0, 4),
    ('SI=F',     'Silver',             'commodity', 'yahoo',     '',            'resource',   True, False, True, 3, 5),

    # ── Top stocks ──────────────────────────────────────────────────────────
    ('QQQ',      'Nasdaq ETF',         'stock',     'yahoo',     '',            'top_stock',  True, False, True, 1, 1),

    # ── Indices ─────────────────────────────────────────────────────────────
    ('^GSPC',    'S&P 500',            'stock',     'yahoo',     '',            'index',      True, False, True, 4, 0),
    ('^FTSE',    'FTSE 100',           'stock',     'yahoo',     '',            'index',      True, False, False, 0, 1),
    ('^GDAXI',   'DAX',                'stock',     'yahoo',     '',            'index',      True, False, False, 0, 2),
    ('^N225',    'Nikkei 225',         'stock',     'yahoo',     '',            'index',      True, False, False, 0, 3),
    ('000001.SS','Shanghai Composite', 'stock',     'yahoo',     '',            'index',      True, False, False, 0, 4),

    # ── Top crypto ──────────────────────────────────────────────────────────
    ('ETH-USD',  'Ethereum',           'crypto',    'coingecko', 'ethereum',    'top_crypto', True, False, True, 1, 1),
    ('XRP-USD',  'XRP',                'crypto',    'coingecko', 'ripple',      'top_crypto', True, False, False, 0, 2),
    ('SOL-USD',  'Solana',             'crypto',    'coingecko', 'solana',      'top_crypto', True, False, True, 5, 3),
    ('BNB-USD',  'BNB',                'crypto',    'coingecko', 'binancecoin', 'top_crypto', True, False, False, 0, 4),

    # ── Forex (ECB pairs already produced by forex.py) ──────────────────────
    ('USD/EUR',  'US Dollar / Euro',     'forex',   'ecb',       '',            'forex',      True, False, False, 0, 1),
    ('JPY/EUR',  'Japanese Yen / Euro',  'forex',   'ecb',       '',            'forex',      True, False, False, 0, 2),
    ('GBP/EUR',  'British Pound / Euro', 'forex',   'ecb',       '',            'forex',      True, False, False, 0, 3),
    ('CNY/EUR',  'Chinese Yuan / Euro',  'forex',   'ecb',       '',            'forex',      True, False, False, 0, 4),
    ('CHF/EUR',  'Swiss Franc / Euro',   'forex',   'ecb',       '',            'forex',      True, False, False, 0, 5),

    # ── Bonds / index gauges ────────────────────────────────────────────────
    ('^TNX',     'US 10Y Treasury',    'bond',      'yahoo',     '',            'bond',       True, False, False, 0, 0),
    ('^TYX',     'US 30Y Treasury',    'bond',      'yahoo',     '',            'bond',       True, False, False, 0, 1),
    ('^VIX',     'Volatility Index',   'index',     'yahoo',     '',            'index',      True, False, False, 0, 5),
    ('DX-Y.NYB', 'US Dollar Index',    'index',     'yahoo',     '',            'index',      True, False, False, 0, 6),
]


def seed_symbols(apps, schema_editor):
    MarketSymbol = apps.get_model('core', 'MarketSymbol')
    created = 0
    for (symbol, name, stream_key, provider, provider_id, group,
         is_active, is_forecast, is_popular, rank, display_order) in SEED:
        _, was_created = MarketSymbol.objects.update_or_create(
            symbol=symbol,
            defaults=dict(
                name=name, stream_key=stream_key, provider=provider,
                provider_id=provider_id, group=group, is_active=is_active,
                is_forecast=is_forecast, is_popular=is_popular, rank=rank,
                display_order=display_order,
            ),
        )
        created += int(was_created)
    print(f'\n[migration] Seeded {created} market symbol(s) ({len(SEED) - created} existing).')


def unseed_symbols(apps, schema_editor):
    MarketSymbol = apps.get_model('core', 'MarketSymbol')
    MarketSymbol.objects.filter(symbol__in=[row[0] for row in SEED]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_event_topics_source'),
    ]

    operations = [
        migrations.CreateModel(
            name='MarketSymbol',
            fields=[
                ('id', django_mongodb_backend.fields.ObjectIdAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('symbol', models.CharField(max_length=32, unique=True)),
                ('name', models.CharField(max_length=128)),
                ('stream_key', models.CharField(choices=[('stock', 'Stock'), ('crypto', 'Crypto'), ('commodity', 'Commodity'), ('forex', 'Forex'), ('bond', 'Bond'), ('index', 'Index')], default='stock', max_length=16)),
                ('provider', models.CharField(choices=[('yahoo', 'Yahoo Finance'), ('coingecko', 'CoinGecko'), ('ecb', 'ECB (forex)')], default='yahoo', max_length=16)),
                ('provider_id', models.CharField(blank=True, max_length=64)),
                ('group', models.CharField(choices=[('top_stock', 'Top Stock'), ('top_crypto', 'Top Crypto'), ('resource', 'Resource / Commodity'), ('forex', 'Forex'), ('bond', 'Bond'), ('index', 'Index'), ('other', 'Other')], default='other', max_length=16)),
                ('is_active', models.BooleanField(default=True)),
                ('is_forecast', models.BooleanField(default=False)),
                ('is_popular', models.BooleanField(default=False)),
                ('rank', models.IntegerField(default=0)),
                ('display_order', models.IntegerField(default=0)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_on', models.DateTimeField(auto_now_add=True)),
                ('updated_on', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['group', 'display_order', 'symbol'],
                'indexes': [
                    models.Index(fields=['stream_key', 'is_active'], name='core_market_strm_act_idx'),
                    models.Index(fields=['is_forecast'], name='core_market_forecast_idx'),
                    models.Index(fields=['group'], name='core_market_group_idx'),
                ],
            },
        ),
        migrations.RunPython(seed_symbols, unseed_symbols),
    ]
