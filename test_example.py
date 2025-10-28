#!/usr/bin/env python3
"""
Example test script for Press Release AI Agent
Demonstrates how to use individual components
"""

import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from ai_processor import AIProcessor
from wordpress_publisher import WordPressPublisher
from notifier import Notifier


def test_ai_rewriting():
    """Test AI rewriting with sample press release"""
    load_dotenv()

    print("=" * 60)
    print("Testing AI Rewriting")
    print("=" * 60)

    # Sample press release
    sample_press_release = """
    FOR IMMEDIATE RELEASE

    Acme Corporation Announces Revolutionary New Product

    SAN FRANCISCO, CA - Acme Corporation, the industry-leading provider of
    innovative solutions, is proud to announce the launch of our groundbreaking
    new product, the Acme Widget 3000. This revolutionary device represents a
    quantum leap forward in widget technology and demonstrates our unwavering
    commitment to excellence and innovation.

    "We are absolutely thrilled and excited to bring this game-changing product
    to market," said John Smith, CEO of Acme Corporation. "The Acme Widget 3000
    is truly revolutionary and will transform the industry as we know it."

    The Acme Widget 3000 features cutting-edge technology, best-in-class
    performance, and world-class design. With its innovative features and
    unparalleled capabilities, this product is set to revolutionize the market.

    For more information about Acme Corporation and our revolutionary products,
    please visit our website or contact our world-class customer service team.

    About Acme Corporation:
    Acme Corporation is a leading provider of innovative solutions and has been
    serving customers with excellence for over 20 years. We are committed to
    delivering best-in-class products and maintaining our position as an
    industry leader.

    Contact:
    Jane Doe
    PR Manager
    jane@acme.com
    """

    try:
        # Initialize AI processor
        provider = os.getenv('AI_PROVIDER', 'anthropic')

        ai_credentials = {}
        if provider == 'openai':
            ai_credentials = {
                'api_key': os.getenv('OPENAI_API_KEY'),
                'model': os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
            }
        elif provider == 'anthropic':
            ai_credentials = {
                'api_key': os.getenv('ANTHROPIC_API_KEY'),
                'model': os.getenv('ANTHROPIC_MODEL', 'claude-3-5-sonnet-20241022')
            }

        processor = AIProcessor(
            provider=provider,
            system_prompt="""You are an expert journalist. Rewrite this press release
            removing jargon and promotional language while maintaining facts.""",
            title_prompt="Generate a clear, factual headline (8-12 words).",
            description_prompt="Generate a 150-160 character meta description.",
            temperature=0.3,
            max_tokens=2000,
            **ai_credentials
        )

        # Process the article
        print("\nProcessing sample press release...\n")
        result = processor.process_full_article(sample_press_release)

        if result:
            print("\n" + "=" * 60)
            print("RESULTS")
            print("=" * 60)
            print(f"\nTitle: {result['title']}")
            print(f"\nDescription: {result['description']}")
            print(f"\nKeywords: {', '.join(result['keywords'])}")
            print(f"\nWord Count: {result['word_count']}")
            print(f"\nRewritten Content:\n")
            print(result['content'])
            print("\n" + "=" * 60)
            print("Test completed successfully!")
            print("=" * 60)
        else:
            print("❌ AI processing failed")

    except Exception as e:
        print(f"❌ Error: {e}")


def test_wordpress_connection():
    """Test WordPress connection"""
    load_dotenv()

    print("\n" + "=" * 60)
    print("Testing WordPress Connection")
    print("=" * 60 + "\n")

    try:
        publisher = WordPressPublisher(
            site_url=os.getenv('WORDPRESS_URL'),
            username=os.getenv('WORDPRESS_USERNAME'),
            app_password=os.getenv('WORDPRESS_APP_PASSWORD')
        )

        if publisher.test_connection():
            print("✓ WordPress connection successful!")

            # Get categories
            categories = publisher.get_categories()
            print(f"\nFound {len(categories)} categories:")
            for cat in categories[:5]:
                print(f"  - {cat['name']}")

        else:
            print("❌ WordPress connection failed")

    except Exception as e:
        print(f"❌ Error: {e}")


def test_notifications():
    """Test notification channels"""
    load_dotenv()

    print("\n" + "=" * 60)
    print("Testing Notifications")
    print("=" * 60 + "\n")

    try:
        notifier = Notifier(
            channels={
                'telegram': os.getenv('TELEGRAM_BOT_TOKEN') is not None,
                'email': os.getenv('NOTIFICATION_EMAIL_FROM') is not None,
                'whatsapp': os.getenv('TWILIO_ACCOUNT_SID') is not None
            },
            message_template="Test notification from Press Release Agent",
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

        results = notifier.test_all_channels()

        print("Notification test results:")
        for channel, success in results.items():
            status = "✓" if success else "❌"
            print(f"  {status} {channel.capitalize()}")

    except Exception as e:
        print(f"❌ Error: {e}")


def main():
    """Run all tests"""
    print("""
╔══════════════════════════════════════════════════════════╗
║     Press Release AI Agent - Component Testing          ║
╚══════════════════════════════════════════════════════════╝
    """)

    # Check for .env file
    if not os.path.exists('.env'):
        print("❌ Error: .env file not found!")
        print("Please copy .env.example to .env and configure it.")
        return

    # Run tests
    test_ai_rewriting()
    test_wordpress_connection()
    test_notifications()

    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()
