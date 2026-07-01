"""Shared harness for this package's dependency-light self-tests.

Every ``tests_*.py`` module here is standalone-runnable
(``python -m tests.tests_x``) and plain assert-based — no pytest, no
``unittest.TestCase``. This module factors out the two things every one of
them repeats: getting Django set up, and the PASS/FAIL loop that runs a list
of ``test_*`` functions.
"""

import os
import sys
import traceback


def bootstrap_django() -> bool:
    """Best-effort Django setup so Django-dependent imports work when a test
    module is run standalone. Returns True if Django ended up configured."""
    try:
        import django
        from django.conf import settings
        if not settings.configured:
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings.base')
        django.setup()
        return True
    except Exception:
        return False


def run(tests: list) -> None:
    """Run each test_* function, print PASS/FAIL (with a traceback on failure),
    and exit 1 if any failed."""
    passed = failed = 0
    for fn in tests:
        try:
            fn()
            print(f'  PASS  {fn.__name__}')
            passed += 1
        except Exception as exc:
            print(f'  FAIL  {fn.__name__}: {exc}')
            traceback.print_exc()
            failed += 1
    print(f'\n{passed} passed / {failed} failed')
    sys.exit(1 if failed else 0)
