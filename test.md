                                                                                                                                                                                                                                                                                             
  ---                                                                                                                                                                                                                                                                                        
  Refactoring Findings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
  High Impact — Fix These                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
  1. Duplicate _STOP frozenset (matcher.py:49 and current_events.py:94)                                                                                                                                                                                                                      
  Nearly identical (matcher has 2 extra words: 'says', 'said', 'two', 'three'). Extract to api/services/topics/_text.py and import in both. The slightly different sets suggest drift — easy to accidentally diverge further.

  2. Duplicate _parse_int() function (api/api/views/events.py:40 and api/api/views/forecasts.py:12)
  Byte-for-byte identical. Move to api/api/views/_utils.py and import in both.

  3. source_map query repeated 3× (events.py:95, :124, :393)
  Same {s.code: s.name for s in Source.objects.only('code', 'name')} call in three different views. Extract as a module-level helper function in events.py (it doesn't need to move files, just stop being inlined).

  4. Dead types in ui/src/types.ts:166–180
  NewsletterSummary and NewsletterDetail are defined there but never imported — all code imports them from ui/src/api/newsletter.ts instead. The two definitions have diverged (html_body/text_body/sent_count vs body/generated_at). The types.ts versions are dead code — delete lines     
  166–180.

  ---
  Medium Impact — Worth Doing

  5. _redis_cache() wrapper (events.py:20–21)
  Single-line function def _redis_cache(): return caches['redis-cache'] exists only to save typing caches['redis-cache']. The wrapper adds indirection for zero benefit. Either inline it everywhere or just assign _cache = caches['redis-cache'] at module level as a constant.

  6. Duplicate NewsletterSummary/NewsletterDetail in newsletter.ts:16–32
  These should live only in types.ts. The newsletter.ts module should import and re-export them, not redefine them. Right now both files define the same interfaces with different fields — one of them is wrong.

  7. f-strings in log calls (workflow.py:88–90 and scattered elsewhere)
  Multiple places use logger.error(f'... {e}', exc_info=e). Best practice is logger.error('... %s', e, exc_info=e) — the f-string eagerly formats the string even if the log level is disabled.

  ---
  Low Impact — Optional

  8. _NameProxy in dedup.py:17–24
  A small wrapper class that exists only to give SemanticClusterer a .title attribute to read. If the clusterer were modified to also accept dict with a 'name' key this class could be eliminated. Low value relative to the churn.

  9. topics_list Python-side filter (events.py — source_ids filter after list(qs))
  Topics are fetched into memory then filtered in Python. For small datasets this is fine, but it could be pushed to the ORM as qs.filter(source_ids__contains=source_id) before materializing.

  ---
  Summary

  ┌─────────────────────────────────┬─────────────────────────────────────┬─────────────────────────┐
  │              Issue              │               File(s)               │          Type           │
  ├─────────────────────────────────┼─────────────────────────────────────┼─────────────────────────┤
  │ Duplicate _STOP frozenset       │ matcher.py, current_events.py       │ Duplication             │
  ├─────────────────────────────────┼─────────────────────────────────────┼─────────────────────────┤
  │ Duplicate _parse_int            │ views/events.py, views/forecasts.py │ Duplication             │
  ├─────────────────────────────────┼─────────────────────────────────────┼─────────────────────────┤
  │ source_map inlined 3×           │ views/events.py                     │ Duplication             │
  ├─────────────────────────────────┼─────────────────────────────────────┼─────────────────────────┤
  │ Dead newsletter types           │ ui/src/types.ts:166                 │ Dead code               │
  ├─────────────────────────────────┼─────────────────────────────────────┼─────────────────────────┤
  │ _redis_cache() wrapper          │ views/events.py:20                  │ Unnecessary abstraction │
  ├─────────────────────────────────┼─────────────────────────────────────┼─────────────────────────┤
  │ Duplicate newsletter interfaces │ ui/src/api/newsletter.ts            │ Duplication             │
  ├─────────────────────────────────┼─────────────────────────────────────┼─────────────────────────┤
  │ f-strings in log calls          │ workflow.py, others                 │ Code quality            │
  └─────────────────────────────────┴─────────────────────────────────────┴─────────────────────────┘
