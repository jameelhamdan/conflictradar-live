"""Newsletter generation business logic."""

import json
import logging
from datetime import datetime, timezone as dt_timezone

from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# Placeholder replaced per-subscriber at send time
UNSUB_PLACEHOLDER = '__UNSUBSCRIBE_URL__'


def day_bounds(date) -> tuple[datetime, datetime]:
    start = datetime(date.year, date.month, date.day, 0, 0, 0, tzinfo=dt_timezone.utc)
    end = datetime(date.year, date.month, date.day, 23, 59, 59, 999999, tzinfo=dt_timezone.utc)
    return start, end


def render_email(subject: str, paragraphs: list[str], date_str: str,
                 base_url: str, unsubscribe_url: str) -> tuple[str, str]:
    """Return (html_body, text_body) rendered from Django templates."""
    context = {
        'subject': subject,
        'paragraphs': paragraphs,
        'date_str': date_str,
        'base_url': base_url,
        'unsubscribe_url': unsubscribe_url,
    }
    html = render_to_string('newsletter/briefing.html', context)
    text = render_to_string('newsletter/briefing.txt', context)
    return html, text


def generate_newsletter(date_str: str | None = None) -> str:
    """
    Generate a DailyNewsletter for the given date (YYYY-MM-DD) or today.
    Idempotent — skips if a newsletter already exists for that date.
    Returns a status message string.
    """
    from django.utils import timezone
    from core import models as core_models
    from newsletter.models import DailyNewsletter
    from services.llm import get_llm_service, LLMError

    if date_str:
        from datetime import date
        target_date = date.fromisoformat(date_str)
    else:
        target_date = timezone.now().date()

    if DailyNewsletter.objects.filter(date=target_date).exists():
        return f'Newsletter for {target_date} already exists — skipped.'

    start, end = day_bounds(target_date)
    events = list(
        core_models.Event.objects.filter(
            started_at__gte=start,
            started_at__lt=end,
        ).order_by('-article_count')
    )

    if not events:
        return f'No events found for {target_date} — newsletter not generated.'

    lines = [
        f'{i}. [{ev.category.upper()}] {ev.title} — {ev.location_name} '
        f'({ev.article_count} article{"s" if ev.article_count != 1 else ""})'
        for i, ev in enumerate(events, 1)
    ]
    events_text = "\n".join(lines)

    prompt_user = (
        f"Today is {target_date.strftime('%B %d, %Y')}. "
        f"Here are today's {len(events)} global news events:\n\n"
        f"{events_text}\n\n"
        "Write a daily news briefing for a geopolitical intelligence newsletter. "
        "Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:\n"
        '{"subject": "<compelling headline, max 80 chars>", '
        '"paragraphs": ["<paragraph 1>", "<paragraph 2>", "<paragraph 3>"]}'
    )

    try:
        llm = get_llm_service()
        raw = llm.chat([
            {'role': 'system', 'content': (
                'You are a senior editor at a geopolitical intelligence newsletter. '
                'Write clear, factual, professional summaries. '
                'Always respond with valid JSON only — no markdown fences, no extra text.'
            )},
            {'role': 'user', 'content': prompt_user},
        ])
        raw = raw.strip().lstrip('`').rstrip('`')
        if raw.startswith('json'):
            raw = raw[4:].strip()
        data = json.loads(raw)
        subject = str(data.get('subject', f'Daily Briefing — {target_date}')).strip()
        paragraphs = [str(p).strip() for p in data.get('paragraphs', []) if str(p).strip()]
        if not paragraphs:
            paragraphs = [raw]
    except (LLMError, json.JSONDecodeError, KeyError) as exc:
        logger.warning('Newsletter LLM generation failed (%s) — using fallback summary.', exc)
        subject = f'Daily Briefing — {target_date.strftime("%B %d, %Y")}'
        paragraphs = (
            [f"Today's briefing covers {len(events)} events across "
             f"{len({e.category for e in events})} categories."]
            + [f'{ev.title} ({ev.location_name})' for ev in events[:5]]
        )

    base_url = getattr(settings, 'NEWSLETTER_BASE_URL', 'http://localhost')
    date_str_display = target_date.strftime('%A, %B %d, %Y')

    html_body, text_body = render_email(
        subject, paragraphs, date_str_display, base_url, UNSUB_PLACEHOLDER
    )

    newsletter = DailyNewsletter.objects.create(
        date=target_date,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        status=DailyNewsletter.STATUS_DRAFT,
        event_count=len(events),
    )
    logger.info('Generated newsletter %s: "%s" (%d events)', newsletter.date, subject, len(events))
    return f'Generated newsletter for {target_date}: "{subject}"'
