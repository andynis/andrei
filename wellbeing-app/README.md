# Student Well-being Check-in App

A comprehensive mobile and web application for monitoring student well-being in schools, with GDPR compliance, automated alerts, and teacher dashboards.

## 🌟 Features

### For Students (Mobile App)
- **Quick Check-ins:** 30-60 second well-being surveys
- **Age-Appropriate Interface:** Emoji scales and visual indicators
- **QR Code Classroom Connection:** Scan to link check-in to classroom
- **Privacy-First:** Optional participation, minimal data collection
- **Multi-Platform:** iOS and Android support

### For Teachers (Web Dashboard)
- **Real-Time Monitoring:** View student well-being in real-time
- **Automated Alerts:** Email notifications for students needing attention
- **Trend Analysis:** 7-day charts and pattern recognition
- **QR Code Generation:** Create classroom QR codes
- **Privacy Controls:** Role-based access, GDPR-compliant

### Key Measurements
**Emotional Well-being:**
- Mood (6-point emoji scale)
- Energy levels
- Social comfort

**Physical Health:**
- General wellness (yes/no)
- Symptom reporting (headache, fatigue, etc.)
- Optional notes

## 📱 Screenshots

```
[Student App]          [Teacher Dashboard]
┌─────────────┐       ┌──────────────────┐
│ 😊 How are  │       │ Today's Stats    │
│  you today? │       │ ✅ 25 check-ins  │
│             │       │ 📈 Avg: 78/100   │
│ [Scan QR]   │       │ ⚠️  3 alerts     │
└─────────────┘       └──────────────────┘
```

## 🏗️ Architecture

```
┌─────────────────┐
│   Mobile App    │ (React Native - iOS/Android)
│  (Students)     │
└────────┬────────┘
         │
         │ HTTPS/REST API
         ↓
┌─────────────────┐
│  Backend API    │ (Node.js + Express)
│   + Database    │ (PostgreSQL)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Teacher Dashboard│ (Web - HTML/JS)
│  Email Alerts   │ (Nodemailer)
└─────────────────┘
```

## 📋 Prerequisites

### Mobile App
- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)

### Backend
- Node.js 18+
- PostgreSQL 13+
- SMTP email account

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd wellbeing-app/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and email credentials

# Set up database
npm run migrate

# Start server
npm run dev
```

Server runs on: http://localhost:3000

### 2. Mobile App Setup

```bash
cd wellbeing-app/mobile

# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

### 3. Access Teacher Dashboard

Open browser: http://localhost:3000/dashboard.html

## ⚙️ Configuration

### Environment Variables (Backend)

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_NAME=wellbeing_db
DB_USER=postgres
DB_PASSWORD=your_password

# Email Alerts
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password

# Alert Threshold
ALERT_THRESHOLD=50  # Score below 50 triggers alert

# Data Retention
DATA_RETENTION_DAYS=365
```

### Mobile App Configuration

Edit `mobile/src/services/ApiService.js`:

```javascript
const API_BASE_URL = 'https://your-school-domain.com/api';
```

## 📊 Using the System

### For Students

1. **First Time:**
   - Download app from App Store/Play Store
   - Register with first name and age
   - Parent/guardian provides consent

2. **Daily Check-in:**
   - Open app
   - Tap "Start Check-in"
   - Scan classroom QR code
   - Answer 4-5 quick questions
   - Submit (takes 30-60 seconds)

3. **Privacy:**
   - Participation is optional
   - Can skip check-ins
   - Data is confidential

### For Teachers

1. **Setup Classroom:**
   - Log in to dashboard
   - Create classroom
   - Generate and print QR code
   - Display QR code in classroom

2. **Monitor Students:**
   - View real-time check-ins
   - Check daily statistics
   - Review 7-day trends
   - Identify patterns

3. **Respond to Alerts:**
   - Receive email when score < 50
   - Check in with student privately
   - Provide support as needed
   - Follow school safeguarding procedures

### For School Administrators

1. **Initial Setup:**
   - Create school in database
   - Set up teacher accounts
   - Configure email alerts
   - Distribute parent consent forms

2. **Ongoing:**
   - Review school-wide statistics
   - Generate reports
   - Manage data retention
   - Handle data subject requests

## 🔐 Privacy & GDPR Compliance

This app is designed with GDPR compliance and student privacy as top priorities.

### Key Privacy Features
- ✅ Minimal data collection (first name only)
- ✅ Parental consent required
- ✅ Data retention limits (1 year default)
- ✅ Right to access, rectify, delete
- ✅ No third-party sharing
- ✅ Encryption in transit and at rest
- ✅ Audit logging

### Documentation
- [Privacy Policy](docs/PRIVACY_POLICY.md)
- [GDPR Compliance Guide](docs/GDPR_COMPLIANCE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

### Data Subject Rights
Students/parents can:
- Request data export
- Correct inaccurate data
- Delete all data
- Withdraw consent
- Object to processing

Contact: dpo@yourschool.edu

## 📧 Email Alerts

Automated emails are sent when a student's well-being score falls below the threshold (default: 50/100).

**Alert Email Includes:**
- Student first name and age
- Well-being score
- Mood and symptoms
- Timestamp
- Recommended actions

**Configuration:**
```env
ALERT_THRESHOLD=50
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=alerts@school.edu
EMAIL_PASSWORD=app-specific-password
```

## 📈 Scoring Algorithm

Well-being score (0-100) calculated from:

- **Mood:** 30% weight (0-5 scale)
- **Energy Level:** 20% weight (0-5 scale)
- **Social Comfort:** 20% weight (0-5 scale)
- **Physical Health:** 30% weight (symptoms reduce score)

Example:
```javascript
Mood: 4/5 → 24/30 points
Energy: 3/5 → 12/20 points
Social: 4/5 → 16/20 points
Symptoms: 1 (headache) → 25/30 points
-----------------
Total: 77/100
```

## 🗄️ Database Schema

```sql
schools          → School information
classrooms       → Classrooms with QR codes
students         → Registered app users
checkins         → Daily check-in responses
alerts           → Alert log
users            → Teachers/admin accounts
```

See: `backend/src/database/schema.sql`

## 🔧 API Endpoints

### Check-ins
- `POST /api/checkins` - Submit check-in
- `GET /api/checkins/:appId` - Get history
- `GET /api/checkins/:appId/stats` - Get statistics

### Authentication
- `POST /api/auth/register` - Register device
- `POST /api/auth/login` - Teacher login

### Dashboard
- `GET /api/dashboard/classroom/:id` - Classroom overview
- `GET /api/dashboard/school/:id` - School statistics
- `GET /api/dashboard/export/:appId` - Export student data
- `DELETE /api/dashboard/student/:appId` - Delete student

### QR Codes
- `GET /api/qrcode/generate/:classroomId` - Generate QR code
- `POST /api/qrcode/classroom` - Create classroom with QR

Full API documentation: [API.md](docs/API.md)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Mobile App Tests
```bash
cd mobile
npm test
```

### Manual Testing Checklist
- [ ] Student registration
- [ ] QR code scanning
- [ ] Check-in submission
- [ ] Alert email delivery
- [ ] Dashboard data display
- [ ] Data export
- [ ] Data deletion

## 🚢 Deployment

See detailed deployment guide: [DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Production Checklist
- [ ] Set up production database
- [ ] Configure SSL/HTTPS
- [ ] Set environment variables
- [ ] Configure email SMTP
- [ ] Deploy backend to cloud
- [ ] Submit apps to App Store/Play Store
- [ ] Set up backups
- [ ] Configure monitoring
- [ ] Test all features
- [ ] Train staff

### Recommended Hosting
- **Backend:** AWS, Google Cloud, Azure, or DigitalOcean
- **Database:** Managed PostgreSQL (AWS RDS, Google Cloud SQL)
- **Email:** SendGrid, AWS SES, or school SMTP
- **Mobile Apps:** Apple App Store, Google Play Store

## 🛠️ Troubleshooting

### Common Issues

**Mobile app can't connect to backend:**
- Check API_BASE_URL in ApiService.js
- Verify backend is running
- Check firewall/network settings

**Email alerts not sending:**
- Verify EMAIL_* environment variables
- Check SMTP credentials
- Test with nodemailer test account

**Database connection fails:**
- Verify PostgreSQL is running
- Check DB_* environment variables
- Ensure database exists

**QR code won't scan:**
- Check camera permissions
- Ensure good lighting
- Regenerate QR code

## 📞 Support

### For Technical Issues
- Check documentation in `/docs`
- Review error logs
- Contact IT support

### For Privacy/GDPR Questions
- Contact Data Protection Officer
- Review Privacy Policy
- See GDPR Compliance Guide

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Standards
- ES6+ JavaScript
- Clear variable names
- Comments for complex logic
- Error handling
- Security best practices

## 📄 License

[Specify your license - e.g., MIT, GPL, Proprietary]

## ⚠️ Important Notes

### Not a Replacement for Professional Care
This app is a monitoring tool, not a diagnostic or treatment tool. Students showing concerning patterns should be referred to appropriate professional services.

### Safeguarding Procedures
Always follow your school's safeguarding and child protection policies. This app supplements, but does not replace, existing procedures.

### Data Protection
Schools are responsible for GDPR compliance. Review all documentation and consult with your Data Protection Officer before deployment.

## 🎯 Roadmap

### Planned Features
- [ ] Multi-language support
- [ ] Parent portal
- [ ] Integration with school information systems
- [ ] Advanced analytics and ML insights
- [ ] Voice input for check-ins
- [ ] Accessibility improvements
- [ ] Offline mode

## 📚 Documentation

- [README.md](README.md) - This file
- [PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) - Privacy policy
- [GDPR_COMPLIANCE.md](docs/GDPR_COMPLIANCE.md) - GDPR guide
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment instructions
- [USER_GUIDE.md](docs/USER_GUIDE.md) - User manual
- [API.md](docs/API.md) - API documentation

## 📊 Project Statistics

```
Mobile App:     ~2,500 lines (React Native)
Backend:        ~1,500 lines (Node.js)
Database:       ~250 lines (SQL)
Documentation:  ~5,000 lines (Markdown)
Total:          ~9,250 lines
```

## 🙏 Acknowledgments

Built with:
- React Native
- Node.js & Express
- PostgreSQL
- Chart.js
- Nodemailer
- QRCode

---

**For questions, support, or feedback:**
Email: support@yourschool.edu
