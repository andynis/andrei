# Quick Start Guide - Well-being Check-in App

Get up and running in 15 minutes!

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- React Native development environment (for mobile testing)

## 1. Backend Setup (5 minutes)

```bash
# Navigate to backend
cd wellbeing-app/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings (minimum required):
# DB_HOST=localhost
# DB_NAME=wellbeing_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# EMAIL_HOST=smtp.gmail.com
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASSWORD=your_app_password

# Create database
createdb wellbeing_db

# Run migrations
npm run migrate

# Start server
npm run dev
```

Server running at: http://localhost:3000

## 2. Mobile App Setup (5 minutes)

```bash
# Navigate to mobile app
cd wellbeing-app/mobile

# Install dependencies
npm install

# Update API URL (edit src/services/ApiService.js)
const API_BASE_URL = 'http://localhost:3000/api';
# For iOS simulator use: http://localhost:3000/api
# For Android emulator use: http://10.0.2.2:3000/api

# iOS
npm run ios

# Android
npm run android
```

## 3. Test the System (5 minutes)

### Create Test Data

```bash
cd wellbeing-app/backend

# Create school and classroom
node -e "
const db = require('./src/database/db');
const bcrypt = require('bcrypt');

async function seed() {
  // Create school
  const school = await db.query(
    'INSERT INTO schools (name, contact_email) VALUES ($1, $2) RETURNING id',
    ['Test School', 'admin@test.edu']
  );
  const schoolId = school.rows[0].id;

  // Create classroom
  const classroom = await db.query(
    'INSERT INTO classrooms (school_id, name, teacher_name, teacher_email) VALUES ($1, $2, $3, $4) RETURNING id',
    [schoolId, 'Test Classroom', 'Test Teacher', 'teacher@test.edu']
  );
  console.log('Classroom ID:', classroom.rows[0].id);

  // Create admin user
  const hash = await bcrypt.hash('password123', 10);
  await db.query(
    'INSERT INTO users (email, password_hash, full_name, role, school_id) VALUES ($1, $2, $3, $4, $5)',
    ['admin@test.edu', hash, 'Admin User', 'admin', schoolId]
  );

  console.log('✅ Test data created!');
  console.log('Login: admin@test.edu / password123');
  process.exit(0);
}

seed().catch(console.error);
"
```

### Test Flow

1. **Mobile App:**
   - Open app in simulator/emulator
   - Register with a test name
   - Get classroom ID from above
   - Manually create a QR code with that classroom ID
   - Complete a check-in

2. **Dashboard:**
   - Open http://localhost:3000/dashboard.html
   - Login with admin@test.edu / password123
   - View check-in data

## Next Steps

✅ **You're now running the system!**

**To deploy to production:**
- Read [DEPLOYMENT.md](docs/DEPLOYMENT.md)

**To understand features:**
- Read [USER_GUIDE.md](docs/USER_GUIDE.md)

**For GDPR compliance:**
- Read [GDPR_COMPLIANCE.md](docs/GDPR_COMPLIANCE.md)
- Read [PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)

## Troubleshooting

**Database connection fails:**
```bash
# Ensure PostgreSQL is running
sudo service postgresql start  # Linux
brew services start postgresql # Mac

# Create database
createdb wellbeing_db
```

**Mobile app can't connect:**
- Check API_BASE_URL in ApiService.js
- For Android emulator: use http://10.0.2.2:3000/api
- For iOS simulator: use http://localhost:3000/api
- For real device: use your computer's IP

**Email not sending:**
- Use Gmail app password (not regular password)
- Enable "Less secure app access" (if needed)
- Or use a test email service like Ethereal

## Quick Commands Reference

```bash
# Backend
npm run dev          # Start development server
npm run migrate      # Run database migrations
npm test            # Run tests

# Mobile
npm run ios         # Run iOS simulator
npm run android     # Run Android emulator
npm test           # Run tests

# Database
npm run migrate     # Create tables
psql wellbeing_db   # Access database
```

## Project Structure

```
wellbeing-app/
├── mobile/              # React Native app
│   ├── src/
│   │   ├── screens/    # App screens
│   │   ├── components/ # Reusable components
│   │   └── services/   # API service
│   └── package.json
├── backend/             # Node.js API
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── database/   # Database config
│   │   └── services/   # Email, etc.
│   ├── public/         # Teacher dashboard
│   └── package.json
└── docs/               # Documentation
    ├── README.md
    ├── DEPLOYMENT.md
    ├── PRIVACY_POLICY.md
    └── USER_GUIDE.md
```

## Need Help?

- Check the [README.md](README.md) for detailed information
- Review [USER_GUIDE.md](docs/USER_GUIDE.md) for usage instructions
- See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup

---

**That's it! You're ready to start developing or deploying the Well-being Check-in App!** 🎉
