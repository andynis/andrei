# Deployment Guide

This guide covers different deployment options for the Press Release AI Agent.

## Table of Contents

1. [Manual Deployment (Development)](#manual-deployment)
2. [Systemd Service (Production Linux)](#systemd-service)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)

---

## Manual Deployment

Best for: Development and testing

### Setup

```bash
# Clone repository
git clone <repository-url>
cd andrei

# Run setup script
chmod +x setup.sh
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Configure environment
nano .env

# Test
cd src
python main.py --mode test

# Run once
python main.py --mode once
```

### Keep Running

Use `screen` or `tmux` to keep it running:

```bash
# Using screen
screen -S press-agent
source venv/bin/activate
cd src
python main.py --mode schedule

# Detach: Ctrl+A then D
# Reattach: screen -r press-agent
```

---

## Systemd Service

Best for: Production Linux servers (Ubuntu, Debian, CentOS, etc.)

### Installation

1. **Edit service file**:

```bash
nano press-release-agent.service
```

Update these fields:
- `User=your-username`
- `Group=your-group`
- `WorkingDirectory=/path/to/andrei`
- `Environment="PATH=/path/to/andrei/venv/bin"`
- `ExecStart=/path/to/andrei/venv/bin/python /path/to/andrei/src/main.py --mode schedule`
- `ReadWritePaths=/path/to/andrei/logs /path/to/andrei/temp`

2. **Install service**:

```bash
# Copy service file
sudo cp press-release-agent.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable press-release-agent

# Start service
sudo systemctl start press-release-agent
```

### Management

```bash
# Check status
sudo systemctl status press-release-agent

# View logs
sudo journalctl -u press-release-agent -f

# Restart
sudo systemctl restart press-release-agent

# Stop
sudo systemctl stop press-release-agent

# Disable from boot
sudo systemctl disable press-release-agent
```

### Update Application

```bash
# Stop service
sudo systemctl stop press-release-agent

# Update code
cd /path/to/andrei
git pull

# Update dependencies if needed
source venv/bin/activate
pip install -r requirements.txt

# Restart service
sudo systemctl start press-release-agent
```

---

## Docker Deployment

Best for: Containerized environments, easy deployment

### Build and Run

```bash
# Build image
docker build -t press-release-agent .

# Run container
docker run -d \
  --name press-release-agent \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/temp:/app/temp \
  -v $(pwd)/config:/app/config \
  --restart unless-stopped \
  press-release-agent
```

### Using Docker Compose

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart

# Update and restart
git pull
docker-compose build
docker-compose up -d
```

### Management

```bash
# View logs
docker logs -f press-release-agent

# Execute command in container
docker exec -it press-release-agent python src/main.py --mode test

# Stop container
docker stop press-release-agent

# Start container
docker start press-release-agent

# Remove container
docker rm -f press-release-agent
```

---

## Cloud Deployment

### AWS EC2

1. **Launch EC2 instance** (Ubuntu 22.04 recommended)

2. **SSH into instance**:

```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

3. **Install dependencies**:

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git
```

4. **Clone and setup**:

```bash
git clone <repository-url>
cd andrei
chmod +x setup.sh
./setup.sh
```

5. **Configure** `.env` file

6. **Install as systemd service** (see Systemd section above)

7. **Configure security group**:
   - No inbound ports needed (agent initiates all connections)
   - Allow outbound HTTPS (443) for APIs
   - Allow outbound SMTP/IMAP ports for email

### Google Cloud Platform (GCP)

1. **Create Compute Engine instance**

2. **SSH and setup** (similar to AWS)

3. **Or use Cloud Run** for containerized deployment:

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/press-release-agent

# Deploy to Cloud Run
gcloud run deploy press-release-agent \
  --image gcr.io/PROJECT_ID/press-release-agent \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated
```

Note: Cloud Run may not be ideal for scheduled tasks. Consider Cloud Scheduler + Cloud Functions as alternative.

### Azure

1. **Create VM** (Ubuntu 22.04)

2. **SSH and setup** (similar to AWS)

3. **Or use Container Instances**:

```bash
# Create container group
az container create \
  --resource-group myResourceGroup \
  --name press-release-agent \
  --image press-release-agent:latest \
  --restart-policy Always \
  --environment-variables $(cat .env)
```

### DigitalOcean

1. **Create Droplet** (Ubuntu 22.04)

2. **SSH and setup** (similar to AWS)

3. **Or use App Platform** (Dockerfile deployment)

---

## Production Best Practices

### Monitoring

1. **Set up log rotation**:

```bash
# Create /etc/logrotate.d/press-release-agent
/path/to/andrei/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 username username
    sharedscripts
    postrotate
        systemctl reload press-release-agent > /dev/null
    endscript
}
```

2. **Monitor disk space**:

```bash
# Add to crontab
0 * * * * df -h /path/to/andrei | grep -v Filesystem | awk '{if($5 > 80) print "Disk usage high: "$5}' | mail -s "Disk Alert" admin@example.com
```

3. **Set up uptime monitoring** (UptimeRobot, Pingdom, etc.)

### Security

1. **Use environment variables** - Never commit `.env`

2. **Restrict file permissions**:

```bash
chmod 600 .env
chmod 600 config/settings.yaml
chmod 700 logs/
chmod 700 temp/
```

3. **Use dedicated service account** (not root)

4. **Keep dependencies updated**:

```bash
pip list --outdated
pip install --upgrade -r requirements.txt
```

5. **Enable firewall**:

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow ssh
# No other inbound ports needed
```

### Backups

1. **Backup configuration**:

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backup-$DATE.tar.gz \
  .env \
  config/ \
  processed_emails.json

# Upload to S3 (example)
aws s3 cp backup-$DATE.tar.gz s3://my-backups/
```

2. **Schedule backups**:

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

### Scaling

For high-volume press release processing:

1. **Increase check frequency** in `.env`:
   ```env
   CHECK_INTERVAL_MINUTES=5
   ```

2. **Run multiple instances** with different email folders

3. **Use Redis/database** for processed emails log (requires code modification)

4. **Separate components**:
   - Email fetcher → Queue
   - Processor workers → Process from queue
   - Publisher → Publish completed articles

---

## Troubleshooting

### Service won't start

```bash
# Check service status
sudo systemctl status press-release-agent

# Check logs
sudo journalctl -u press-release-agent -n 50

# Check file permissions
ls -la /path/to/andrei

# Test manually
cd /path/to/andrei
source venv/bin/activate
cd src
python main.py --mode test
```

### High memory usage

- Reduce `max_tokens` in config
- Process fewer emails at once
- Cleanup temp files more frequently

### API rate limits

- Increase delays between API calls in code
- Use lower check frequency
- Consider multiple API keys with load balancing

---

## Support

For deployment issues:
1. Check logs in `logs/press_release_agent.log`
2. Run in test mode: `python main.py --mode test`
3. Review this guide
4. Check README.md for configuration help
