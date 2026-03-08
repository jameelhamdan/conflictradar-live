"""API views — newsletter subscribe, confirm, unsubscribe, list, detail."""
import logging
import uuid

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from newsletter.models import DailyNewsletter, Subscriber
from ..serializers import (
    NewsletterDetailSerializer,
    NewsletterListSerializer,
    SubscribeSerializer,
)
from services.email import get_email_service, EmailError

logger = logging.getLogger(__name__)


class SubscribeThrottle(AnonRateThrottle):
    rate = '5/hour'


class SubscribeView(APIView):
    """POST /api/newsletter/subscribe/"""
    throttle_classes = [SubscribeThrottle]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        existing = Subscriber.objects.filter(email=email).first()

        if existing:
            if existing.is_active:
                return Response(
                    {'detail': 'This email is already subscribed.'},
                    status=status.HTTP_200_OK,
                )
            existing.token = uuid.uuid4()
            existing.is_active = False
            existing.confirmed_at = None
            existing.unsubscribed_at = None
            existing.save()
            sub = existing
        else:
            sub = Subscriber.objects.create(email=email)

        _send_confirmation_email(sub)
        return Response(
            {'detail': 'Please check your email to confirm your subscription.'},
            status=status.HTTP_201_CREATED,
        )


class ConfirmView(APIView):
    """GET /api/newsletter/confirm/<token>/"""

    def get(self, request, token):
        try:
            sub = Subscriber.objects.get(token=token, is_active=False)
        except Subscriber.DoesNotExist:
            return Response(
                {'detail': 'Invalid or already confirmed link.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        sub.is_active = True
        sub.confirmed_at = timezone.now()
        sub.save()
        return Response({'detail': 'Subscription confirmed. Welcome aboard!'})


class UnsubscribeView(APIView):
    """GET /api/newsletter/unsubscribe/<token>/"""

    def get(self, request, token):
        try:
            sub = Subscriber.objects.get(token=token)
        except Subscriber.DoesNotExist:
            return Response(
                {'detail': 'Invalid unsubscribe link.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not sub.is_active:
            return Response({'detail': 'This email is already unsubscribed.'})

        sub.is_active = False
        sub.unsubscribed_at = timezone.now()
        sub.save()
        return Response({'detail': 'You have been unsubscribed successfully.'})


class NewsletterListView(APIView):
    """GET /api/newsletter/ — list sent newsletters"""

    def get(self, request):
        newsletters = DailyNewsletter.objects.filter(
            status=DailyNewsletter.STATUS_SENT
        ).order_by('-date')
        serializer = NewsletterListSerializer(newsletters, many=True)
        return Response({'results': serializer.data, 'count': newsletters.count()})


class NewsletterLatestView(APIView):
    """GET /api/newsletter/latest/ — retrieve the most recently sent newsletter"""

    def get(self, request):
        newsletter = DailyNewsletter.objects.filter(
            status=DailyNewsletter.STATUS_SENT
        ).first()
        if not newsletter:
            return Response(
                {'detail': 'No newsletter available.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(NewsletterDetailSerializer(newsletter).data)


class NewsletterDetailView(APIView):
    """GET /api/newsletter/<date>/ — retrieve a newsletter by date (YYYY-MM-DD)"""

    def get(self, request, date):
        try:
            newsletter = DailyNewsletter.objects.get(date=date)
        except (DailyNewsletter.DoesNotExist, ValueError):
            return Response(
                {'detail': 'Newsletter not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(NewsletterDetailSerializer(newsletter).data)


def _send_confirmation_email(sub: Subscriber) -> None:
    base_url = getattr(settings, 'NEWSLETTER_BASE_URL', 'http://localhost')
    confirm_url = f'{base_url}/newsletter/confirm/{sub.token}'
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'newsletter@localhost')

    context = {'confirm_url': confirm_url}
    html = render_to_string('newsletter/confirm_email.html', context)
    text = render_to_string('newsletter/confirm_email.txt', context)

    try:
        get_email_service().send(
            to=sub.email,
            subject='Confirm your subscription — conflictradar.live',
            html=html,
            text=text,
            from_email=from_email,
        )
    except EmailError as exc:
        logger.error('Failed to send confirmation email to %s: %s', sub.email, exc)
