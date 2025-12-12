"""
Email service for sending emails via Lettermint API.

Lettermint API:
POST https://api.lettermint.co/v1/send
Headers:
  - Content-Type: application/json
  - x-lettermint-token: <api_token>
  - Accept: application/json
Body:
  {
    "text": "Plain text content",
    "subject": "Email subject",
    "to": ["recipient@example.com"],
    "from": "Sender Name <sender@example.com>",
    "html": "<p>Optional HTML content</p>"
  }
"""

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Lettermint API"""

    API_URL = "https://api.lettermint.co/v1/send"

    def __init__(self):
        self.api_token = settings.LETTERMINT_API_TOKEN
        self.from_email = settings.LETTERMINT_FROM_EMAIL
        self.from_name = settings.LETTERMINT_FROM_NAME
        self.survey_base_url = f"{settings.FRONTEND_HOST}/survey"

    @property
    def from_address(self) -> str:
        return f"{self.from_name} <{self.from_email}>"

    async def send_email(
        self,
        to: str | list[str],
        subject: str,
        text: str,
        html: str | None = None,
    ) -> dict[str, Any]:
        """
        Send an email via Lettermint API.

        Args:
            to: Recipient email address(es)
            subject: Email subject
            text: Plain text content
            html: Optional HTML content

        Returns:
            API response as dict

        Raises:
            httpx.HTTPError: If the request fails
        """
        if isinstance(to, str):
            to = [to]

        payload: dict[str, Any] = {
            "to": to,
            "subject": subject,
            "text": text,
            "from": self.from_address,
        }

        if html:
            payload["html"] = html

        headers = {
            "Content-Type": "application/json",
            "x-lettermint-token": self.api_token,
            "Accept": "application/json",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.API_URL,
                json=payload,
                headers=headers,
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()

    async def send_survey_invitation(
        self,
        student_email: str,
        student_name: str,
        token: str,
        week_number: int,
    ) -> dict[str, Any]:
        """
        Send weekly survey invitation to a student.

        Args:
            student_email: Student's email address
            student_name: Student's name for personalization
            token: Unique survey session token
            week_number: Week number for the survey

        Returns:
            API response as dict
        """
        survey_link = f"{self.survey_base_url}/{token}"

        subject = f"Trivselstjek - Uge {week_number}"

        text = f"""Hej {student_name},

Det er tid til dit ugentlige trivselstjek.

Klik på linket herunder for at besvare spørgeskemaet (tager under 1 minut):

{survey_link}

Linket er gyldigt i 4 dage.

Venlig hilsen,
TrivselsTracker
"""

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf9f7;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 4px 40px rgba(0,0,0,0.06); border: 1px solid #f0ebe4;">
                    <tr>
                        <td style="padding: 40px 36px;">
                            <!-- Header with week badge -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <span style="display: inline-block; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); color: #2e7d32; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                                            Uge {week_number}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Title -->
                            <h1 style="font-family: 'Fraunces', Georgia, serif; font-size: 28px; font-weight: 500; color: #2c2c2c; text-align: center; margin: 0 0 16px 0; line-height: 1.3;">
                                Tid til trivselstjek
                            </h1>

                            <!-- Greeting -->
                            <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; color: #7a7a7a; text-align: center; margin: 0 0 32px 0; line-height: 1.6;">
                                Hej {student_name.split()[0]}, hvordan har du det i dag?
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px 0;">
                                        <a href="{survey_link}" style="display: inline-block; background: linear-gradient(135deg, #9dc59f 0%, #7ab77e 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 14px; font-family: 'DM Sans', -apple-system, sans-serif; font-size: 16px; font-weight: 500; box-shadow: 0 4px 14px rgba(122, 183, 126, 0.4);">
                                            Start trivselstjek
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info text -->
                            <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 14px; color: #a0a0a0; text-align: center; margin: 0; line-height: 1.6;">
                                Det tager under 1 minut at besvare.<br>
                                Linket er gyldigt i 4 dage.
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
                    <tr>
                        <td style="padding: 24px 36px 0 36px; text-align: center;">
                            <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 13px; color: #c0c0c0; margin: 0;">
                                TrivselsTracker
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        logger.info(f"Sending survey invitation to {student_email} for week {week_number}")
        return await self.send_email(
            to=student_email,
            subject=subject,
            text=text,
            html=html,
        )

    async def send_survey_reminder(
        self,
        student_email: str,
        student_name: str,
        token: str,
        week_number: int,
        reminder_number: int,
    ) -> dict[str, Any]:
        """
        Send reminder for incomplete survey.

        Args:
            student_email: Student's email address
            student_name: Student's name for personalization
            token: Unique survey session token
            week_number: Week number for the survey
            reminder_number: Which reminder this is (1 or 2)

        Returns:
            API response as dict
        """
        survey_link = f"{self.survey_base_url}/{token}"

        subject = f"Påmindelse: Trivselstjek - Uge {week_number}"

        text = f"""Hej {student_name},

Vi mangler stadig dit svar på denne uges trivselstjek.

Klik på linket herunder for at besvare (tager under 1 minut):

{survey_link}

Dit svar hjælper os med at støtte dig bedst muligt.

Venlig hilsen,
TrivselsTracker
"""

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f59e0b; padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Påmindelse: Trivselstjek</h1>
    </div>

    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hej <strong>{student_name}</strong>,</p>

        <p style="font-size: 16px;">Vi mangler stadig dit svar på denne uges trivselstjek.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{survey_link}"
               style="display: inline-block; background: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 600;">
                Besvar nu
            </a>
        </div>

        <p style="font-size: 14px; color: #666;">
            Det tager under 1 minut, og dit svar hjælper os med at støtte dig bedst muligt.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 12px; color: #9ca3af;">
            Venlig hilsen,<br>
            TrivselsTracker
        </p>
    </div>
</body>
</html>
"""

        logger.info(
            f"Sending reminder {reminder_number} to {student_email} for week {week_number}"
        )
        return await self.send_email(
            to=student_email,
            subject=subject,
            text=text,
            html=html,
        )

    async def send_mentor_notification(
        self,
        mentor_email: str,
        mentor_name: str,
        student_name: str,
        notification_type: str,
        message: str,
    ) -> dict[str, Any]:
        """
        Send notification email to a mentor about a student.

        Args:
            mentor_email: Mentor's email address
            mentor_name: Mentor's name for personalization
            student_name: Name of the student the notification is about
            notification_type: Type of notification (critical_score, score_drop, non_response)
            message: Notification message

        Returns:
            API response as dict
        """
        type_labels = {
            "critical_score": "Kritisk score",
            "score_drop": "Fald i trivsel",
            "non_response": "Manglende besvarelse",
            "weekly_summary": "Ugentlig opsummering",
        }

        type_label = type_labels.get(notification_type, notification_type)
        subject = f"TrivselsTracker: {type_label} - {student_name}"

        text = f"""Hej {mentor_name},

Der er en opdatering om {student_name}:

{type_label}
{message}

Log ind på TrivselsTracker for at se flere detaljer og registrere din indsats.

Venlig hilsen,
TrivselsTracker
"""

        # Determine color based on notification type
        color = "#ef4444"  # Red for critical
        if notification_type == "non_response":
            color = "#f59e0b"  # Yellow/amber

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: {color}; padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">{type_label}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{student_name}</p>
    </div>

    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hej <strong>{mentor_name}</strong>,</p>

        <div style="background: white; border-left: 4px solid {color}; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">{message}</p>
        </div>

        <p style="font-size: 14px; color: #666;">
            Log ind på TrivselsTracker for at se flere detaljer og registrere din indsats.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 12px; color: #9ca3af;">
            Venlig hilsen,<br>
            TrivselsTracker
        </p>
    </div>
</body>
</html>
"""

        logger.info(
            f"Sending {notification_type} notification to {mentor_email} about {student_name}"
        )
        return await self.send_email(
            to=mentor_email,
            subject=subject,
            text=text,
            html=html,
        )


    async def send_consent_request(
        self,
        student_email: str,
        student_name: str,
        consent_token: str,
    ) -> dict[str, Any]:
        """
        Send consent request email to a new student with accept/decline options.

        Args:
            student_email: Student's email address
            student_name: Student's name for personalization
            consent_token: Unique token for consent action

        Returns:
            API response as dict
        """
        base_url = settings.FRONTEND_HOST
        accept_link = f"{base_url}/consent/{consent_token}/accept"
        decline_link = f"{base_url}/consent/{consent_token}/decline"

        subject = "Velkommen til TrivselsTracker"

        text = f"""Hej {student_name},

Du er blevet inviteret til TrivselsTracker.

Hver uge sender vi dig et kort trivselstjek (under 1 minut), så vi bedre kan støtte dig i dit forløb.

Vil du deltage?

Ja, jeg vil gerne deltage: {accept_link}

Nej tak: {decline_link}

Venlig hilsen,
TrivselsTracker
"""

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #faf9f7; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 480px; margin: 0 auto; border-collapse: collapse;">
                    <!-- Logo/Brand -->
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px;">
                            <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #9dc59f 0%, #7ab77e 100%); border-radius: 50%;"></div>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" style="width: 100%; background: #ffffff; border-radius: 24px; box-shadow: 0 4px 40px rgba(0,0,0,0.06); border: 1px solid #f0ebe4; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 48px 40px;">
                                        <!-- Greeting -->
                                        <p style="margin: 0 0 24px 0; color: #7a7a7a; font-size: 15px; font-family: 'DM Sans', sans-serif;">
                                            Hej {student_name}
                                        </p>

                                        <!-- Title -->
                                        <h1 style="margin: 0 0 16px 0; color: #2c2c2c; font-size: 28px; font-weight: 500; font-family: 'Fraunces', Georgia, serif; line-height: 1.3;">
                                            Du er inviteret til TrivselsTracker
                                        </h1>

                                        <!-- Description -->
                                        <p style="margin: 0 0 32px 0; color: #7a7a7a; font-size: 16px; line-height: 1.6; font-family: 'DM Sans', sans-serif;">
                                            Hver uge sender vi dig et kort trivselstjek, så vi bedre kan støtte dig i dit forløb. Det tager under 1 minut.
                                        </p>

                                        <!-- Divider -->
                                        <div style="height: 1px; background: linear-gradient(to right, transparent, #e0d4c3, transparent); margin: 0 0 32px 0;"></div>

                                        <!-- Question -->
                                        <p style="margin: 0 0 24px 0; color: #2c2c2c; font-size: 17px; font-weight: 500; text-align: center; font-family: 'DM Sans', sans-serif;">
                                            Vil du deltage?
                                        </p>

                                        <!-- Accept Button -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="text-align: center; padding-bottom: 12px;">
                                                    <a href="{accept_link}"
                                                       style="display: inline-block; background: linear-gradient(135deg, #9dc59f 0%, #7ab77e 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 500; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 14px rgba(122, 183, 126, 0.3);">
                                                        Ja, jeg vil gerne deltage
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Decline Link -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="text-align: center; padding-top: 8px;">
                                                    <a href="{decline_link}"
                                                       style="color: #a0a0a0; font-size: 14px; text-decoration: none; font-family: 'DM Sans', sans-serif;">
                                                        Nej tak, jeg ønsker ikke at deltage
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="text-align: center; padding-top: 32px;">
                            <p style="margin: 0 0 8px 0; color: #c0c0c0; font-size: 13px; font-family: 'DM Sans', sans-serif;">
                                TrivselsTracker
                            </p>
                            <p style="margin: 0; color: #d4d4d4; font-size: 12px; font-family: 'DM Sans', sans-serif;">
                                Kontakt din mentor hvis du har spørgsmål
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""

        logger.info(f"Sending consent request to {student_email}")
        return await self.send_email(
            to=student_email,
            subject=subject,
            text=text,
            html=html,
        )


# Singleton instance
email_service = EmailService()
