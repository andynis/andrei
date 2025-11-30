# Deployment Guide - Well-being Check-in App

Complete guide for deploying the Well-being Check-in App to production.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Email Configuration](#email-configuration)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Legal & Compliance
- [ ] GDPR compliance review completed
- [ ] Privacy policy finalized
- [ ] Parental consent forms prepared
- [ ] Data Protection Officer appointed
- [ ] Data Processing Impact Assessment (DPIA) completed
- [ ] Terms of service prepared

### Technical
- [ ] Domain name registered (e.g., wellbeing.yourschool.edu)
- [ ] SSL certificate obtained
- [ ] Database server provisioned
- [ ] Hosting/cloud account set up
- [ ] Email service configured
- [ ] Backups strategy defined

### Organizational
- [ ] Staff training scheduled
- [ ] Parent communication prepared
- [ ] Support procedures established
- [ ] Incident response plan ready

---

## Database Setup

### Option 1: Cloud Managed Database (Recommended)

**AWS RDS (PostgreSQL):**
```bash
# 1. Create RDS instance via AWS Console
# - Engine: PostgreSQL 13+
# - Instance size: db.t3.micro (start small)
# - Storage: 20 GB
# - Enable automated backups
# - Multi-AZ for production

# 2. Configure security group
# - Allow inbound on port 5432 from your backend server IP

# 3. Get connection details
Endpoint: your-db.region.rds.amazonaws.com
Port: 5432
Database: wellbeing_db
Username: admin
Password: [secure-password]
```

**Google Cloud SQL:**
```bash
# 1. Create Cloud SQL instance
gcloud sql instances create wellbeing-db \
  --database-version=POSTGRES_13 \
  --tier=db-f1-micro \
  --region=europe-west1

# 2. Set password
gcloud sql users set-password postgres \
  --instance=wellbeing-db \
  --password=[secure-password]

# 3. Get connection info
gcloud sql instances describe wellbeing-db
```

### Option 2: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql

CREATE DATABASE wellbeing_db;
CREATE USER wellbeing_user WITH PASSWORD 'secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE wellbeing_db TO wellbeing_user;
\q

# Configure remote access (if needed)
sudo nano /etc/postgresql/13/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Add: host wellbeing_db wellbeing_user 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Initialize Database Schema

```bash
cd wellbeing-app/backend

# Set environment variables
export DB_HOST=your-db-host
export DB_NAME=wellbeing_db
export DB_USER=wellbeing_user
export DB_PASSWORD=your-secure-password

# Run migrations
npm run migrate

# Verify
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"
```

### Seed Initial Data (Optional)

```bash
# Create a seed script
node -e "
const db = require('./src/database/db');

async function seed() {
  // Create school
  const school = await db.query(
    'INSERT INTO schools (name, contact_email) VALUES ($1, $2) RETURNING id',
    ['Your School Name', 'admin@yourschool.edu']
  );

  // Create admin user
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('change-me-123', 10);
  await db.query(
    'INSERT INTO users (email, password_hash, full_name, role, school_id) VALUES ($1, $2, $3, $4, $5)',
    ['admin@yourschool.edu', hash, 'Admin User', 'admin', school.rows[0].id]
  );

  console.log('Seed complete');
  process.exit(0);
}

seed();
"
```

---

## Backend Deployment

### Option 1: Cloud Platform (AWS, Google Cloud, Azure)

#### AWS Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
cd wellbeing-app/backend
eb init -p node.js wellbeing-backend --region eu-west-1

# 3. Create environment
eb create production-env

# 4. Configure environment variables
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  DB_HOST=your-rds-endpoint.amazonaws.com \
  DB_NAME=wellbeing_db \
  DB_USER=admin \
  DB_PASSWORD=your-password \
  JWT_SECRET=your-jwt-secret \
  EMAIL_HOST=smtp.gmail.com \
  EMAIL_USER=alerts@yourschool.edu \
  EMAIL_PASSWORD=your-email-password \
  ALERT_THRESHOLD=50

# 5. Deploy
eb deploy

# 6. Get URL
eb status
```

#### Google App Engine

```yaml
# app.yaml
runtime: nodejs18

env_variables:
  NODE_ENV: 'production'
  DB_HOST: '/cloudsql/YOUR-PROJECT:REGION:INSTANCE'
  DB_NAME: 'wellbeing_db'
  # ... other env vars

handlers:
- url: /.*
  script: auto
  secure: always
```

```bash
# Deploy
gcloud app deploy
```

### Option 2: VPS (DigitalOcean, Linode, etc.)

```bash
# 1. SSH into server
ssh root@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 (process manager)
sudo npm install -g pm2

# 4. Clone repository
cd /var/www
git clone your-repo-url wellbeing-app
cd wellbeing-app/backend

# 5. Install dependencies
npm install --production

# 6. Create .env file
sudo nano .env
# Paste your environment variables

# 7. Start with PM2
pm2 start src/server.js --name wellbeing-backend
pm2 save
pm2 startup

# 8. Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/wellbeing
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name wellbeing.yourschool.edu;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wellbeing.yourschool.edu;

    ssl_certificate /etc/letsencrypt/live/wellbeing.yourschool.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wellbeing.yourschool.edu/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/wellbeing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d wellbeing.yourschool.edu
```

---

## Mobile App Deployment

### iOS Deployment (App Store)

#### 1. Prepare for Production

```bash
cd wellbeing-app/mobile

# Update API URL
# Edit src/services/ApiService.js
const API_BASE_URL = 'https://wellbeing.yourschool.edu/api';

# Update app info
# Edit app.json
{
  "name": "WellbeingCheckin",
  "displayName": "Well-being Check-in",
  "version": "1.0.0"
}
```

#### 2. Apple Developer Setup

1. **Enroll in Apple Developer Program** ($99/year)
   - https://developer.apple.com/programs/

2. **Create App ID**
   - Developer Portal → Identifiers
   - Bundle ID: `edu.yourschool.wellbeing`

3. **Create App in App Store Connect**
   - App Store Connect → My Apps → New App
   - Name: "Well-being Check-in"
   - Bundle ID: edu.yourschool.wellbeing

#### 3. Build and Submit

```bash
# Open in Xcode
cd ios
open WellbeingCheckin.xcworkspace

# In Xcode:
# 1. Select "Generic iOS Device"
# 2. Product → Archive
# 3. Window → Organizer
# 4. Select archive → Distribute App
# 5. App Store Connect → Upload
# 6. Submit for review in App Store Connect
```

#### 4. App Store Listing

- **Privacy Policy URL:** https://wellbeing.yourschool.edu/privacy
- **Support URL:** https://yourschool.edu/support
- **Age Rating:** 4+ (Educational apps)
- **Category:** Education or Health & Fitness
- **Screenshots:** Prepare for all required sizes

### Android Deployment (Google Play)

#### 1. Prepare for Production

```bash
cd wellbeing-app/mobile/android

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore wellbeing.keystore \
  -alias wellbeing-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Edit android/gradle.properties
WELLBEING_UPLOAD_STORE_FILE=wellbeing.keystore
WELLBEING_UPLOAD_KEY_ALIAS=wellbeing-key
WELLBEING_UPLOAD_STORE_PASSWORD=****
WELLBEING_UPLOAD_KEY_PASSWORD=****
```

```gradle
// android/app/build.gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(WELLBEING_UPLOAD_STORE_FILE)
            storePassword WELLBEING_UPLOAD_STORE_PASSWORD
            keyAlias WELLBEING_UPLOAD_KEY_ALIAS
            keyPassword WELLBEING_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 2. Build Release APK

```bash
cd android
./gradlew bundleRelease

# AAB file location:
# android/app/build/outputs/bundle/release/app-release.aab
```

#### 3. Google Play Console

1. **Create Developer Account** ($25 one-time fee)
   - https://play.google.com/console

2. **Create App**
   - Play Console → Create App
   - App name: "Well-being Check-in"
   - Package name: edu.yourschool.wellbeing

3. **Upload Release**
   - Production → Create new release
   - Upload app-release.aab
   - Release notes

4. **Store Listing**
   - App details, screenshots, privacy policy
   - Content rating questionnaire
   - Target audience: Ages 5-18
   - Submit for review

---

## Email Configuration

### Option 1: Gmail SMTP

```bash
# 1. Enable 2-Step Verification
# 2. Generate App Password
#    Google Account → Security → App Passwords

# Environment variables:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=alerts@yourschool.edu
EMAIL_PASSWORD=your-16-char-app-password
```

### Option 2: SendGrid

```bash
# 1. Create SendGrid account
# 2. Create API key

EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Option 3: AWS SES

```bash
# 1. Verify email address in SES
# 2. Get SMTP credentials

EMAIL_HOST=email-smtp.eu-west-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-username
EMAIL_PASSWORD=your-ses-password
```

### Test Email Configuration

```bash
cd wellbeing-app/backend

node -e "
const EmailService = require('./src/services/EmailService');

EmailService.sendLowScoreAlert({
  teacherEmail: 'test@yourschool.edu',
  teacherName: 'Test Teacher',
  classroomName: 'Test Classroom',
  studentName: 'Test Student',
  studentAge: 10,
  wellbeingScore: 35,
  mood: 1,
  symptoms: ['headache'],
  timestamp: new Date()
}).then(() => console.log('Email sent!')).catch(console.error);
"
```

---

## Security Hardening

### Environment Variables

```bash
# Use strong, random secrets
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)

# Never commit .env files
echo ".env" >> .gitignore
```

### Database Security

```sql
-- Create restricted user
CREATE USER app_user WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE wellbeing_db TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Use this user instead of postgres
```

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Database: Allow only from backend IP
# Configure in security group or pg_hba.conf
```

### Regular Updates

```bash
# Set up automatic security updates (Ubuntu)
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Update dependencies
cd wellbeing-app/backend
npm audit
npm audit fix

cd ../mobile
npm audit
npm audit fix
```

---

## Monitoring & Maintenance

### Application Monitoring

#### PM2 Monitoring

```bash
# View logs
pm2 logs wellbeing-backend

# Monitor resources
pm2 monit

# Set up alerts
pm2 install pm2-logrotate
```

#### External Monitoring

**UptimeRobot:** Free uptime monitoring
```
Monitor URL: https://wellbeing.yourschool.edu/health
Check interval: 5 minutes
Alert via: Email
```

### Database Backups

#### Automated Backups (AWS RDS)
- Enabled by default
- Retention: 7-30 days
- Point-in-time recovery

#### Manual Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -h $DB_HOST -U $DB_USER -d wellbeing_db | \
  gzip > /backups/wellbeing_db_$DATE.sql.gz

# Keep last 30 days
find /backups -name "wellbeing_db_*.sql.gz" -mtime +30 -delete
```

```bash
# Add to cron
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

### Log Rotation

```bash
# /etc/logrotate.d/wellbeing
/var/log/wellbeing/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload wellbeing-backend
    endscript
}
```

### Health Checks

```bash
# Server health check
curl https://wellbeing.yourschool.edu/health

# Database check
psql -h $DB_HOST -U $DB_USER -d wellbeing_db -c "SELECT COUNT(*) FROM students;"

# Email test
# (See Email Configuration section)
```

### Performance Optimization

```javascript
// Backend: Enable compression (already in server.js)
app.use(compression());

// Database: Add indexes
CREATE INDEX idx_checkins_timestamp ON checkins(timestamp);
CREATE INDEX idx_checkins_wellbeing_score ON checkins(wellbeing_score);

// Caching (optional - add Redis)
const redis = require('redis');
const client = redis.createClient();
```

---

## Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Verify all services running
- [ ] Test student registration
- [ ] Test check-in submission
- [ ] Verify email alerts working
- [ ] Check dashboard loading
- [ ] Test QR code generation
- [ ] Verify SSL certificate

### Week 1
- [ ] Monitor error logs daily
- [ ] Review first check-in data
- [ ] Gather teacher feedback
- [ ] Address any issues
- [ ] Verify backups working

### Month 1
- [ ] Review usage statistics
- [ ] Analyze alert patterns
- [ ] Conduct staff training follow-up
- [ ] Review GDPR compliance
- [ ] Plan improvements

### Quarterly
- [ ] Security audit
- [ ] Update dependencies
- [ ] Review and optimize performance
- [ ] Backup testing
- [ ] User satisfaction survey

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs wellbeing-backend

# Common issues:
# - Database connection: Verify DB_* env vars
# - Port conflict: Change PORT in .env
# - Missing dependencies: npm install
```

### Database Connection Failed
```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check:
# - Firewall rules
# - Security group (cloud)
# - Credentials correct
# - Database exists
```

### Emails Not Sending
```bash
# Test SMTP
telnet smtp.gmail.com 587

# Check:
# - SMTP credentials
# - App password (if Gmail)
# - Firewall allows port 587
# - Email service quota
```

---

## Support Contacts

### Technical Issues
- Backend errors: Check logs, review API docs
- Database issues: DBA or cloud provider support
- Email delivery: SMTP provider support

### GDPR/Legal
- Data Protection Officer: dpo@yourschool.edu
- Legal counsel: legal@yourschool.edu

---

**Deployment complete! Monitor closely for the first week and gather feedback.**
