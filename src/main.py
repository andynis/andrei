"""
Press Release AI Agent - Main Orchestrator
Automates the retrieval, rewriting, and publishing of press releases
"""

import os
import sys
import logging
from typing import Dict, Optional
from datetime import datetime
import yaml
from dotenv import load_dotenv
import schedule
import time

from email_handler import EmailHandler
from document_parser import DocumentParser
from ai_processor import AIProcessor
from wordpress_publisher import WordPressPublisher
from notifier import Notifier


class PressReleaseAgent:
    """Main orchestrator for press release automation"""

    def __init__(self, config_path: str = "config/settings.yaml"):
        """
        Initialize the press release agent

        Args:
            config_path: Path to configuration YAML file
        """
        # Load environment variables
        load_dotenv()

        # Load configuration
        self.config = self._load_config(config_path)

        # Setup logging
        self._setup_logging()

        logger.info("=" * 60)
        logger.info("Press Release AI Agent Starting")
        logger.info("=" * 60)

        # Initialize components
        self._initialize_components()

        logger.info("All components initialized successfully")

    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            print(f"Configuration loaded from {config_path}")
            return config
        except Exception as e:
            print(f"Error loading configuration: {e}")
            print("Using default configuration")
            return {}

    def _setup_logging(self):
        """Setup logging configuration"""
        log_config = self.config.get('logging', {})

        # Create logs directory
        log_file = log_config.get('file', 'logs/press_release_agent.log')
        os.makedirs(os.path.dirname(log_file), exist_ok=True)

        # Configure logging
        logging.basicConfig(
            level=getattr(logging, log_config.get('level', 'INFO')),
            format=log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s'),
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )

        global logger
        logger = logging.getLogger(__name__)

    def _initialize_components(self):
        """Initialize all components"""
        # Email Handler
        logger.info("Initializing Email Handler...")
        self.email_handler = EmailHandler(
            host=os.getenv('EMAIL_HOST'),
            port=int(os.getenv('EMAIL_PORT', 993)),
            username=os.getenv('EMAIL_USERNAME'),
            password=os.getenv('EMAIL_PASSWORD'),
            folder=os.getenv('EMAIL_FOLDER', 'INBOX'),
            temp_dir=os.getenv('TEMP_FILES_DIR', './temp'),
            processed_log=os.getenv('PROCESSED_EMAILS_LOG', './processed_emails.json')
        )

        # Document Parser
        logger.info("Initializing Document Parser...")
        parsing_config = self.config.get('parsing', {})
        self.document_parser = DocumentParser(
            max_file_size_mb=parsing_config.get('max_file_size_mb', 10)
        )

        # AI Processor
        logger.info("Initializing AI Processor...")
        ai_config = self.config.get('ai_rewriting', {})
        ai_provider = os.getenv('AI_PROVIDER', 'anthropic')

        ai_credentials = {}
        if ai_provider == 'openai':
            ai_credentials = {
                'api_key': os.getenv('OPENAI_API_KEY'),
                'model': os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
            }
        elif ai_provider == 'anthropic':
            ai_credentials = {
                'api_key': os.getenv('ANTHROPIC_API_KEY'),
                'model': os.getenv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022')
            }

        self.ai_processor = AIProcessor(
            provider=ai_provider,
            system_prompt=ai_config.get('system_prompt', ''),
            title_prompt=ai_config.get('title_generation_prompt', ''),
            description_prompt=ai_config.get('description_generation_prompt', ''),
            temperature=ai_config.get('temperature', 0.3),
            max_tokens=ai_config.get('max_tokens', 2000),
            **ai_credentials
        )

        # WordPress Publisher
        logger.info("Initializing WordPress Publisher...")
        wp_config = self.config.get('wordpress', {})
        self.wordpress = WordPressPublisher(
            site_url=os.getenv('WORDPRESS_URL'),
            username=os.getenv('WORDPRESS_USERNAME'),
            app_password=os.getenv('WORDPRESS_APP_PASSWORD'),
            default_category=os.getenv('WORDPRESS_DEFAULT_CATEGORY', wp_config.get('default_category', 'Press Releases')),
            default_tags=os.getenv('WORDPRESS_DEFAULT_TAGS', '').split(',') if os.getenv('WORDPRESS_DEFAULT_TAGS') else [],
            post_status=wp_config.get('post_status', 'draft'),
            author_id=wp_config.get('default_author_id', 1)
        )

        # Notifier
        logger.info("Initializing Notifier...")
        notif_config = self.config.get('notifications', {})
        self.notifier = Notifier(
            channels=notif_config.get('channels', {}),
            message_template=notif_config.get('message_template', ''),
            telegram_bot_token=os.getenv('TELEGRAM_BOT_TOKEN'),
            telegram_chat_id=os.getenv('TELEGRAM_CHAT_ID'),
            twilio_account_sid=os.getenv('TWILIO_ACCOUNT_SID'),
            twilio_auth_token=os.getenv('TWILIO_AUTH_TOKEN'),
            twilio_whatsapp_from=os.getenv('TWILIO_WHATSAPP_FROM'),
            twilio_whatsapp_to=os.getenv('TWILIO_WHATSAPP_TO'),
            notification_smtp_host=os.getenv('NOTIFICATION_SMTP_HOST'),
            notification_smtp_port=int(os.getenv('NOTIFICATION_SMTP_PORT', 587)),
            notification_email_from=os.getenv('NOTIFICATION_EMAIL_FROM'),
            notification_email_to=os.getenv('NOTIFICATION_EMAIL_TO'),
            email_password=os.getenv('EMAIL_PASSWORD')
        )

    def process_press_release(self, email_data: Dict) -> Optional[Dict]:
        """
        Process a single press release

        Args:
            email_data: Email data with body and/or attachments

        Returns:
            Dictionary with processing results
        """
        try:
            logger.info(f"Processing press release: {email_data['subject']}")

            # Extract text content
            text_content = ""

            # Use email body if no attachments
            if not email_data.get('attachments'):
                text_content = email_data.get('body', '')
                logger.info("Using email body as content")
            else:
                # Parse attachments
                for attachment in email_data['attachments']:
                    logger.info(f"Parsing attachment: {attachment['filename']}")
                    parsed_text = self.document_parser.parse_document(attachment['filepath'])

                    if parsed_text:
                        text_content += parsed_text + "\n\n"

                # Clean the extracted text
                text_content = self.document_parser.clean_text(text_content)

            if not text_content.strip():
                logger.error("No text content extracted")
                return None

            logger.info(f"Extracted {len(text_content)} characters of content")

            # Process with AI
            logger.info("Processing content with AI...")
            article_data = self.ai_processor.process_full_article(text_content)

            if not article_data:
                logger.error("AI processing failed")
                return None

            logger.info(f"AI processing complete - Title: {article_data['title']}")

            # Publish to WordPress
            logger.info("Publishing to WordPress...")
            wp_result = self.wordpress.create_post(
                title=article_data['title'],
                content=article_data['content'],
                excerpt=article_data['description'],
                categories=[os.getenv('WORDPRESS_DEFAULT_CATEGORY', 'Press Releases')],
                tags=article_data['keywords']
            )

            if not wp_result:
                logger.error("WordPress publishing failed")
                return None

            logger.info(f"Published to WordPress: {wp_result['url']}")

            # Send notifications
            logger.info("Sending notifications...")
            notification_results = self.notifier.notify(
                article_data=article_data,
                wordpress_data=wp_result,
                email_data=email_data
            )

            # Prepare result summary
            result = {
                'success': True,
                'email_subject': email_data['subject'],
                'article_title': article_data['title'],
                'wordpress_url': wp_result['url'],
                'wordpress_edit_url': wp_result['edit_url'],
                'wordpress_id': wp_result['id'],
                'word_count': article_data['word_count'],
                'notifications': notification_results,
                'processed_at': datetime.now().isoformat()
            }

            logger.info("=" * 60)
            logger.info("Press release processed successfully!")
            logger.info(f"Title: {result['article_title']}")
            logger.info(f"WordPress URL: {result['wordpress_url']}")
            logger.info(f"Edit URL: {result['wordpress_edit_url']}")
            logger.info("=" * 60)

            return result

        except Exception as e:
            logger.error(f"Error processing press release: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'email_subject': email_data.get('subject', 'Unknown')
            }

    def check_and_process_emails(self):
        """Check inbox and process new press releases"""
        try:
            logger.info("Checking for new press releases...")

            # Connect to email
            self.email_handler.connect()

            # Search for emails
            email_config = self.config.get('email', {})
            subject_filters = email_config.get('subject_filters', [])

            email_ids = self.email_handler.search_emails(subject_filters)

            if not email_ids:
                logger.info("No new press releases found")
                self.email_handler.disconnect()
                return

            logger.info(f"Found {len(email_ids)} press releases to process")

            # Process each email
            results = []
            for email_id in email_ids:
                email_data = self.email_handler.retrieve_email(email_id)

                if email_data:
                    result = self.process_press_release(email_data)
                    results.append(result)

                    # Mark as read if configured
                    if email_config.get('mark_as_read', True):
                        self.email_handler.mark_as_read(email_id)

                    # Cleanup temp files
                    self.email_handler.cleanup_temp_files(email_data)

                # Small delay between emails
                time.sleep(2)

            # Disconnect
            self.email_handler.disconnect()

            # Log summary
            successful = len([r for r in results if r and r.get('success')])
            logger.info(f"Batch complete: {successful}/{len(results)} processed successfully")

        except Exception as e:
            logger.error(f"Error in check_and_process_emails: {e}", exc_info=True)
            try:
                self.email_handler.disconnect()
            except:
                pass

    def run_once(self):
        """Run a single check cycle"""
        logger.info("Running single check cycle")
        self.check_and_process_emails()

    def run_scheduled(self):
        """Run on a schedule"""
        check_interval = int(os.getenv('CHECK_INTERVAL_MINUTES', 15))

        logger.info(f"Starting scheduled mode (checking every {check_interval} minutes)")
        logger.info("Press Ctrl+C to stop")

        # Schedule the job
        schedule.every(check_interval).minutes.do(self.check_and_process_emails)

        # Run immediately
        self.check_and_process_emails()

        # Keep running
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)
        except KeyboardInterrupt:
            logger.info("Stopping scheduled mode")

    def test_components(self):
        """Test all components"""
        logger.info("Testing all components...")

        # Test WordPress connection
        logger.info("Testing WordPress connection...")
        wp_ok = self.wordpress.test_connection()
        logger.info(f"WordPress: {'✓ OK' if wp_ok else '✗ FAILED'}")

        # Test notifications
        logger.info("Testing notification channels...")
        notif_results = self.notifier.test_all_channels()
        for channel, success in notif_results.items():
            logger.info(f"{channel.capitalize()}: {'✓ OK' if success else '✗ FAILED'}")

        logger.info("Component testing complete")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Press Release AI Agent - Automate press release processing'
    )
    parser.add_argument(
        '--mode',
        choices=['once', 'schedule', 'test'],
        default='once',
        help='Run mode: once (single check), schedule (continuous), test (test components)'
    )
    parser.add_argument(
        '--config',
        default='config/settings.yaml',
        help='Path to configuration file'
    )

    args = parser.parse_args()

    try:
        # Initialize agent
        agent = PressReleaseAgent(config_path=args.config)

        # Run based on mode
        if args.mode == 'once':
            agent.run_once()
        elif args.mode == 'schedule':
            agent.run_scheduled()
        elif args.mode == 'test':
            agent.test_components()

    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
