# Press Release AI Agent

An intelligent automation system that retrieves press releases from email, rewrites them in journalistic style using AI, and publishes them to WordPress with multi-channel notifications.

## Features

- **Automated Email Retrieval**: Connects to designated email inbox and retrieves press releases
- **Multi-Format Support**: Processes DOC, DOCX, PDF, and plain text documents
- **AI-Powered Rewriting**: Uses OpenAI GPT-4 or Anthropic Claude to:
  - Remove repetitions and corporate jargon
  - Convert official tone to clear, balanced journalistic style
  - Maintain complete fidelity to original facts
  - Generate compelling titles and SEO-friendly descriptions
  - Extract relevant keywords/tags
- **WordPress Integration**: Automatically publishes as drafts with proper metadata
- **Multi-Channel Notifications**: Alerts editorial team via Telegram, Email, and WhatsApp
- **Scheduled Operation**: Runs continuously or on-demand
- **Comprehensive Logging**: Tracks all operations and errors

## Architecture

```
Press Release AI Agent
│
├── Email Handler         → Retrieves press releases from inbox
├── Document Parser       → Extracts text from various formats
├── AI Processor         → Rewrites content in journalistic style
├── WordPress Publisher  → Publishes drafts with metadata
└── Notifier            → Sends notifications to editorial team
```

## Prerequisites

- Python 3.8 or higher
- Email account with IMAP access (Gmail, Outlook, etc.)
- WordPress site with REST API enabled
- AI API key (OpenAI or Anthropic)
- (Optional) Telegram Bot Token
- (Optional) Twilio account for WhatsApp

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd andrei
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Email Configuration
EMAIL_HOST=imap.gmail.com
EMAIL_USERNAME=your-email@example.com
EMAIL_PASSWORD=your-app-password

# AI Provider (choose openai or anthropic)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-api-key

# WordPress
WORDPRESS_URL=https://your-site.com
WORDPRESS_USERNAME=your-username
WORDPRESS_APP_PASSWORD=your-app-password

# Notifications (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

See `.env.example` for all available options.

### 4. Configure Settings

Edit `config/settings.yaml` to customize:
- Email subject filters
- AI rewriting instructions
- WordPress categories/tags
- Notification templates

## Usage

### Run Once (Single Check)

Process any new press releases immediately:

```bash
cd src
python main.py --mode once
```

### Run Scheduled (Continuous)

Check for new press releases every N minutes (configured in `.env`):

```bash
cd src
python main.py --mode schedule
```

### Test Components

Verify all integrations are working:

```bash
cd src
python main.py --mode test
```

## How It Works

### 1. Email Retrieval

The agent connects to your email inbox and searches for messages matching configured filters (e.g., subject contains "press release"). It downloads:
- Email body text
- PDF attachments
- DOC/DOCX attachments
- Plain text attachments

### 2. Document Parsing

All content is extracted and cleaned:
- PDFs parsed with pdfplumber and PyPDF2
- DOCX files parsed with python-docx
- Text normalized and formatted

### 3. AI Processing

The AI rewrites the content following these principles:
- Remove corporate jargon and promotional language
- Eliminate repetitions
- Convert to objective, journalistic tone
- Use inverted pyramid structure
- Maintain all factual information
- Generate compelling headline
- Create SEO-optimized meta description
- Extract relevant keywords

### 4. WordPress Publishing

The processed article is published to WordPress:
- Status: Draft (configurable)
- Categories and tags applied
- SEO metadata included
- Edit URL generated for review

### 5. Notifications

The editorial team is notified via:
- **Telegram**: Instant message with article details
- **Email**: Detailed notification with edit link
- **WhatsApp**: Mobile alert via Twilio

## Configuration

### Email Filters

Configure which emails to process in `config/settings.yaml`:

```yaml
email:
  subject_filters:
    - "press release"
    - "comunicado de prensa"
    - "nota de prensa"
  mark_as_read: true
```

### AI Rewriting Behavior

Customize the AI's instructions:

```yaml
ai_rewriting:
  system_prompt: |
    You are an expert journalist and editor...
  temperature: 0.3  # Lower = more consistent
  max_tokens: 2000
```

### WordPress Settings

```yaml
wordpress:
  post_status: draft
  default_category: Press Releases
  auto_tags: true
  max_tags: 10
```

### Notification Templates

Customize notification messages:

```yaml
notifications:
  message_template: |
    📰 New Press Release Processed

    Title: {title}
    WordPress URL: {wordpress_url}

    Please review and publish when ready.
```

## API Setup Guides

### Gmail Setup

1. Enable IMAP in Gmail settings
2. Create an App Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password for "Mail"
3. Use the app password in `.env`

### WordPress Setup

1. Ensure REST API is enabled (default in WP 4.7+)
2. Create Application Password:
   - Go to Users → Profile
   - Scroll to "Application Passwords"
   - Generate new password
3. Use username and app password in `.env`

### Telegram Bot Setup

1. Message @BotFather on Telegram
2. Create new bot with `/newbot`
3. Get bot token
4. Get your chat ID:
   - Message @userinfobot
   - Or use: `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Twilio WhatsApp Setup

1. Sign up for Twilio account
2. Get Account SID and Auth Token
3. Set up WhatsApp Sandbox for testing
4. Use sandbox number in `.env`

## Project Structure

```
andrei/
├── config/
│   └── settings.yaml          # Main configuration
├── src/
│   ├── email_handler.py       # Email inbox connection
│   ├── document_parser.py     # Document parsing
│   ├── ai_processor.py        # AI rewriting
│   ├── wordpress_publisher.py # WordPress integration
│   ├── notifier.py           # Multi-channel notifications
│   └── main.py               # Main orchestrator
├── logs/                      # Application logs
├── temp/                      # Temporary file storage
├── .env                       # Environment variables (create from .env.example)
├── .env.example              # Environment template
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

## Logging

Logs are stored in `logs/press_release_agent.log` and include:
- Email retrieval status
- Document parsing results
- AI processing details
- WordPress publishing outcomes
- Notification delivery status
- All errors and warnings

Configure logging level in `config/settings.yaml`:

```yaml
logging:
  level: INFO  # DEBUG, INFO, WARNING, ERROR
```

## Troubleshooting

### Email Connection Issues

- Verify IMAP is enabled
- Check firewall/network settings
- Ensure app password (not regular password) is used
- Test with: `python main.py --mode test`

### AI Processing Fails

- Check API key is valid
- Verify sufficient API credits/quota
- Review API provider status page
- Check logs for detailed error messages

### WordPress Publishing Fails

- Verify REST API is accessible
- Test credentials with WordPress API directly
- Check user has permission to create posts
- Ensure site URL is correct (with https://)

### No Notifications Sent

- Run test mode to verify each channel
- Check API credentials
- Review notification logs
- Verify network connectivity

## Security Best Practices

1. **Never commit `.env` file** - it contains sensitive credentials
2. **Use app passwords** - not your main account passwords
3. **Restrict WordPress user** - create dedicated user with minimal permissions
4. **Secure API keys** - rotate regularly
5. **Monitor logs** - watch for unauthorized access attempts
6. **Use HTTPS** - for WordPress and all API connections

## Performance Optimization

- Default check interval: 15 minutes (configurable)
- Processes one email at a time to avoid rate limits
- Includes retry logic for transient failures
- Automatic cleanup of temporary files
- Keeps log of processed emails to avoid duplicates

## Customization

### Adding Custom Document Formats

Edit `src/document_parser.py` to add new parsers.

### Changing AI Behavior

Modify prompts in `config/settings.yaml` to adjust:
- Writing style
- Tone and voice
- Headline format
- Keyword extraction logic

### Adding Notification Channels

Extend `src/notifier.py` to add services like:
- Slack
- Discord
- SMS
- Custom webhooks

## License

[Your License Here]

## Support

For issues and questions:
- Check logs in `logs/` directory
- Review configuration in `config/settings.yaml`
- Run test mode: `python main.py --mode test`
- Open an issue on GitHub

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Changelog

### Version 1.0.0
- Initial release
- Email retrieval with multi-format support
- AI-powered content rewriting
- WordPress integration
- Multi-channel notifications
- Scheduled operation
