"""
Notification Module
Sends notifications via Telegram, Email, and WhatsApp
"""

import logging
from typing import Dict, List, Optional
import asyncio
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


class Notifier:
    """Sends notifications through multiple channels"""

    def __init__(
        self,
        channels: Dict[str, bool] = None,
        message_template: str = "",
        **credentials
    ):
        """
        Initialize notifier

        Args:
            channels: Dictionary of enabled channels (telegram, email, whatsapp)
            message_template: Template for notification messages
            **credentials: API credentials for various services
        """
        self.channels = channels or {
            'telegram': False,
            'email': False,
            'whatsapp': False
        }
        self.message_template = message_template
        self.credentials = credentials

        # Initialize clients for enabled channels
        if self.channels.get('telegram'):
            self._init_telegram()

        if self.channels.get('whatsapp'):
            self._init_whatsapp()

        logger.info(f"Initialized notifier with channels: {list(self.channels.keys())}")

    def _init_telegram(self):
        """Initialize Telegram bot"""
        try:
            from telegram import Bot
            self.telegram_bot = Bot(token=self.credentials.get('telegram_bot_token'))
            self.telegram_chat_id = self.credentials.get('telegram_chat_id')
            logger.info("Telegram bot initialized")
        except ImportError:
            logger.error("python-telegram-bot not installed. Run: pip install python-telegram-bot")
            self.channels['telegram'] = False
        except Exception as e:
            logger.error(f"Failed to initialize Telegram: {e}")
            self.channels['telegram'] = False

    def _init_whatsapp(self):
        """Initialize WhatsApp (via Twilio)"""
        try:
            from twilio.rest import Client
            self.twilio_client = Client(
                self.credentials.get('twilio_account_sid'),
                self.credentials.get('twilio_auth_token')
            )
            self.whatsapp_from = self.credentials.get('twilio_whatsapp_from')
            self.whatsapp_to = self.credentials.get('twilio_whatsapp_to')
            logger.info("WhatsApp (Twilio) initialized")
        except ImportError:
            logger.error("twilio not installed. Run: pip install twilio")
            self.channels['whatsapp'] = False
        except Exception as e:
            logger.error(f"Failed to initialize WhatsApp: {e}")
            self.channels['whatsapp'] = False

    def notify(
        self,
        article_data: Dict,
        wordpress_data: Dict,
        email_data: Dict
    ) -> Dict[str, bool]:
        """
        Send notifications across all enabled channels

        Args:
            article_data: Processed article data (title, content, etc.)
            wordpress_data: WordPress post data (URL, ID, etc.)
            email_data: Original email data

        Returns:
            Dictionary with success status for each channel
        """
        results = {}

        # Format the message
        message = self._format_message(article_data, wordpress_data, email_data)

        # Send to each enabled channel
        if self.channels.get('telegram'):
            results['telegram'] = self.send_telegram(message)

        if self.channels.get('email'):
            results['email'] = self.send_email(
                subject=f"New Article Draft: {article_data.get('title', 'Untitled')}",
                message=message
            )

        if self.channels.get('whatsapp'):
            results['whatsapp'] = self.send_whatsapp(message)

        # Log summary
        successful = [ch for ch, success in results.items() if success]
        failed = [ch for ch, success in results.items() if not success]

        if successful:
            logger.info(f"Notifications sent successfully: {', '.join(successful)}")
        if failed:
            logger.warning(f"Notifications failed: {', '.join(failed)}")

        return results

    def _format_message(
        self,
        article_data: Dict,
        wordpress_data: Dict,
        email_data: Dict
    ) -> str:
        """Format notification message using template"""
        try:
            message = self.message_template.format(
                title=article_data.get('title', 'Untitled'),
                wordpress_url=wordpress_data.get('edit_url', wordpress_data.get('url', 'N/A')),
                email_subject=email_data.get('subject', 'N/A'),
                timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                word_count=article_data.get('word_count', 0),
                description=article_data.get('description', '')[:100]
            )
            return message
        except Exception as e:
            logger.error(f"Error formatting message: {e}")
            # Fallback message
            return f"""New Press Release Processed
Title: {article_data.get('title', 'Untitled')}
WordPress: {wordpress_data.get('url', 'N/A')}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"""

    def send_telegram(self, message: str) -> bool:
        """Send Telegram notification"""
        if not self.channels.get('telegram'):
            logger.debug("Telegram notifications disabled")
            return False

        try:
            # Use async context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def send():
                await self.telegram_bot.send_message(
                    chat_id=self.telegram_chat_id,
                    text=message,
                    parse_mode='Markdown'
                )

            loop.run_until_complete(send())
            loop.close()

            logger.info("Telegram notification sent successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")
            return False

    def send_email(
        self,
        subject: str,
        message: str,
        html: bool = False
    ) -> bool:
        """Send email notification"""
        if not self.channels.get('email'):
            logger.debug("Email notifications disabled")
            return False

        try:
            smtp_host = self.credentials.get('notification_smtp_host')
            smtp_port = self.credentials.get('notification_smtp_port', 587)
            from_email = self.credentials.get('notification_email_from')
            to_email = self.credentials.get('notification_email_to')
            password = self.credentials.get('email_password')  # Use same as inbox or separate

            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Subject'] = subject

            # Add body
            if html:
                msg.attach(MIMEText(message, 'html'))
            else:
                msg.attach(MIMEText(message, 'plain'))

            # Send email
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                if password:
                    server.login(from_email, password)
                server.send_message(msg)

            logger.info(f"Email notification sent to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return False

    def send_whatsapp(self, message: str) -> bool:
        """Send WhatsApp notification via Twilio"""
        if not self.channels.get('whatsapp'):
            logger.debug("WhatsApp notifications disabled")
            return False

        try:
            # Twilio WhatsApp has a 1600 character limit
            if len(message) > 1600:
                message = message[:1597] + "..."

            msg = self.twilio_client.messages.create(
                from_=self.whatsapp_from,
                body=message,
                to=self.whatsapp_to
            )

            logger.info(f"WhatsApp notification sent (SID: {msg.sid})")
            return True

        except Exception as e:
            logger.error(f"Failed to send WhatsApp notification: {e}")
            return False

    def send_custom(
        self,
        channel: str,
        message: str,
        **kwargs
    ) -> bool:
        """Send notification to specific channel with custom message"""
        if channel == 'telegram':
            return self.send_telegram(message)
        elif channel == 'email':
            return self.send_email(
                subject=kwargs.get('subject', 'Notification'),
                message=message,
                html=kwargs.get('html', False)
            )
        elif channel == 'whatsapp':
            return self.send_whatsapp(message)
        else:
            logger.error(f"Unknown channel: {channel}")
            return False

    def test_all_channels(self) -> Dict[str, bool]:
        """Test all configured notification channels"""
        results = {}
        test_message = f"Test notification from Press Release AI Agent - {datetime.now()}"

        logger.info("Testing all notification channels...")

        if self.channels.get('telegram'):
            results['telegram'] = self.send_telegram(test_message)

        if self.channels.get('email'):
            results['email'] = self.send_email(
                subject="Test Notification - Press Release Agent",
                message=test_message
            )

        if self.channels.get('whatsapp'):
            results['whatsapp'] = self.send_whatsapp(test_message)

        return results
