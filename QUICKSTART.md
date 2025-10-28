# Quick Start Guide

Get the Press Release AI Agent running in 5 minutes!

## Step 1: Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Create Environment File

```bash
cp .env.example .env
```

## Step 3: Configure Minimum Required Settings

Edit `.env` and add these **required** values:

```env
# Email (REQUIRED)
EMAIL_HOST=imap.gmail.com
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# AI Provider (REQUIRED - choose one)
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# OR use OpenAI instead:
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-xxxxx

# WordPress (REQUIRED)
WORDPRESS_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your-wp-username
WORDPRESS_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

## Step 4: Test the Setup

```bash
cd src
python main.py --mode test
```

This will verify:
- WordPress connection
- Notification channels (if configured)

## Step 5: Run Your First Check

```bash
python main.py --mode once
```

This will:
1. Check your email inbox for press releases
2. Process any new ones found
3. Publish drafts to WordPress
4. Send notifications (if configured)

## Step 6: (Optional) Set Up Notifications

### Telegram

1. Create a bot with @BotFather
2. Get your bot token
3. Get your chat ID from @userinfobot
4. Add to `.env`:

```env
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id
```

5. Enable in `config/settings.yaml`:

```yaml
notifications:
  channels:
    telegram: true
```

### Email Notifications

Add to `.env`:

```env
NOTIFICATION_EMAIL_FROM=notifications@example.com
NOTIFICATION_EMAIL_TO=editorial@example.com
NOTIFICATION_SMTP_HOST=smtp.gmail.com
NOTIFICATION_SMTP_PORT=587
```

Enable in `config/settings.yaml`:

```yaml
notifications:
  channels:
    email: true
```

### WhatsApp (via Twilio)

1. Sign up for Twilio
2. Get credentials from console
3. Add to `.env`:

```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+1234567890
```

4. Enable in `config/settings.yaml`:

```yaml
notifications:
  channels:
    whatsapp: true
```

## Step 7: Run Continuously

To check every 15 minutes (or custom interval):

```bash
python main.py --mode schedule
```

Press Ctrl+C to stop.

## Tips

### Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Select "Mail" and generate
5. Use this password (not your Gmail password!)

### WordPress App Password

1. Log into WordPress admin
2. Go to Users → Profile
3. Scroll to "Application Passwords"
4. Enter name and "Add New"
5. Copy the generated password

### Testing Without Processing

To test email connection without processing:

```python
# In Python shell:
from src.email_handler import EmailHandler
import os
from dotenv import load_dotenv

load_dotenv()
handler = EmailHandler(
    host=os.getenv('EMAIL_HOST'),
    port=int(os.getenv('EMAIL_PORT', 993)),
    username=os.getenv('EMAIL_USERNAME'),
    password=os.getenv('EMAIL_PASSWORD')
)
handler.connect()
emails = handler.search_emails()
print(f"Found {len(emails)} unread emails")
handler.disconnect()
```

## Common Issues

### "Authentication failed"
- Use app password, not regular password
- Check username is correct (full email for Gmail)
- Verify IMAP is enabled

### "No new emails found"
- Check subject filters in `config/settings.yaml`
- Ensure emails are unread
- Verify folder name (INBOX vs Inbox)

### "AI processing failed"
- Verify API key is valid
- Check you have credits/quota
- Review API provider status

### "WordPress connection failed"
- Verify URL is correct (https://site.com not https://site.com/)
- Check REST API is enabled (WP 4.7+)
- Ensure app password is correct
- Test with: `curl https://your-site.com/wp-json/wp/v2/posts`

## Next Steps

1. Customize AI prompts in `config/settings.yaml`
2. Set up automated running (cron job or systemd)
3. Configure email filters for your press release format
4. Set up monitoring and alerting
5. Review and publish your first processed article!

## Get Help

- Check logs in `logs/press_release_agent.log`
- Run in test mode: `python main.py --mode test`
- Review main README.md for detailed documentation
