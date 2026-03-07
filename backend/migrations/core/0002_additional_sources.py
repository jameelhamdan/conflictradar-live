"""
Data migration — additional news sources and static reference points.

Sources added:
  World:    reuters-world, ap-top, voa-world (were referenced in 0001 rollback but never created),
            politico-eu, the-hindu, japan-times, africa-news, bbc-middle-east,
            straits-times, foreign-policy
  Business: ft-world, bloomberg-markets, forbes-business, wsj-markets,
            business-insider
  Economic: imf-news, world-bank-blog, project-syndicate, brookings, oecd-news
  Crime:    guardian-crime, reuters-crime, interpol-news, un-crime, propublica, occrp
  Tech:     venturebeat, zdnet, ieee-spectrum, engadget, cnet-tech

Static points added:
  Exchanges (20): NYSE, NASDAQ, LSE, TSE, SSE, HKEX, XETRA, EURONEXT-PAR, TSX, BSE,
                  SGX, KRX, SIX, MOEX, ASX, DFM, JSE, B3, TADAWUL, BIST
  Commodity exchanges (7): CME, NYMEX, LME, ICE-LON, DCE, SHFE, TOCOM
  Major ports (20): Rotterdam, Singapore, Shanghai, Shenzhen, Hong Kong, Ningbo, Busan,
                    Jebel Ali, Los Angeles, Hamburg, Antwerp, New York, Guangzhou,
                    Kaohsiung, Santos, Durban, Mumbai, Felixstowe, Suez/Port Said, Colombo
  Central banks (21): FED, ECB, BOE, BOJ, PBOC, RBA, SNB, BOC, RBI, CBR, BCB, SARB,
                      BOK, MAS, SAMA, BANXICO, TCMB, CBE, NORGES, RIKSBANK, BI
"""
import json
import os

from django.db import migrations

_FIXTURES_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'core', 'fixtures')
)

_NEW_SOURCE_CODES = [
    'reuters-world', 'ap-top', 'voa-world',
    'politico-eu', 'the-hindu', 'japan-times', 'africa-news', 'bbc-middle-east',
    'straits-times', 'foreign-policy',
    'ft-world', 'bloomberg-markets', 'forbes-business', 'wsj-markets', 'business-insider',
    'imf-news', 'world-bank-blog', 'project-syndicate', 'brookings', 'oecd-news',
    'guardian-crime', 'reuters-crime', 'interpol-news', 'un-crime', 'propublica', 'occrp',
    'venturebeat', 'zdnet', 'ieee-spectrum', 'engadget', 'cnet-tech',
]

_NEW_POINT_CODES = [
    'NYSE', 'NASDAQ', 'LSE', 'TSE', 'SSE', 'HKEX', 'XETRA', 'EURONEXT-PAR', 'TSX', 'BSE',
    'SGX', 'KRX', 'SIX', 'MOEX', 'ASX', 'DFM', 'JSE', 'B3', 'TADAWUL', 'BIST',
    'CME', 'NYMEX', 'LME', 'ICE-LON', 'DCE', 'SHFE', 'TOCOM',
    'PORT-ROTTERDAM', 'PORT-SINGAPORE', 'PORT-SHANGHAI', 'PORT-SHENZHEN', 'PORT-HONGKONG',
    'PORT-NINGBO', 'PORT-BUSAN', 'PORT-JEBEL-ALI', 'PORT-LA', 'PORT-HAMBURG',
    'PORT-ANTWERP', 'PORT-NY', 'PORT-GUANGZHOU', 'PORT-KAOHSIUNG', 'PORT-SANTOS',
    'PORT-DURBAN', 'PORT-MUMBAI', 'PORT-FELIXSTOWE', 'PORT-SUEZ', 'PORT-COLOMBO',
    'FED', 'ECB', 'BOE', 'BOJ', 'PBOC', 'RBA', 'SNB', 'BOC', 'RBI', 'CBR', 'BCB',
    'SARB', 'BOK', 'MAS', 'SAMA', 'BANXICO', 'TCMB', 'CBE', 'NORGES', 'RIKSBANK', 'BI',
]


def load_additional_sources(apps, schema_editor):
    Source = apps.get_model('core', 'Source')
    with open(os.path.join(_FIXTURES_DIR, 'additional_sources.json'), encoding='utf-8') as f:
        entries = json.load(f)
    existing = set(Source.objects.values_list('code', flat=True))
    created = 0
    for entry in entries:
        fields = entry['fields']
        if fields['code'] not in existing:
            Source.objects.create(**fields)
            created += 1
    print(f'\n[migration] Created {created} source(s), skipped {len(entries) - created} existing.')


def unload_additional_sources(apps, schema_editor):
    Source = apps.get_model('core', 'Source')
    deleted, _ = Source.objects.filter(code__in=_NEW_SOURCE_CODES).delete()
    print(f'\n[migration] Deleted {deleted} source(s).')


def load_static_points(apps, schema_editor):
    StaticPoint = apps.get_model('core', 'StaticPoint')
    with open(os.path.join(_FIXTURES_DIR, 'static_points.json'), encoding='utf-8') as f:
        entries = json.load(f)
    existing = set(StaticPoint.objects.values_list('code', flat=True))
    created = 0
    for entry in entries:
        fields = entry['fields']
        if fields['code'] not in existing:
            StaticPoint.objects.create(**fields)
            created += 1
    print(f'\n[migration] Created {created} static point(s), skipped {len(entries) - created} existing.')


def unload_static_points(apps, schema_editor):
    StaticPoint = apps.get_model('core', 'StaticPoint')
    deleted, _ = StaticPoint.objects.filter(code__in=_NEW_POINT_CODES).delete()
    print(f'\n[migration] Deleted {deleted} static point(s).')


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(load_additional_sources, reverse_code=unload_additional_sources),
        migrations.RunPython(load_static_points, reverse_code=unload_static_points),
    ]
