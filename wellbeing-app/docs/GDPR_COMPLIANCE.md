# GDPR Compliance Guide

## Overview

This document outlines how the Well-being Check-in App complies with the General Data Protection Regulation (GDPR) and provides implementation guidance for schools.

## GDPR Principles

### 1. Lawfulness, Fairness, and Transparency
**Implementation:**
- ✅ Clear privacy policy provided to parents/students
- ✅ Consent obtained before data collection
- ✅ Transparent about data usage and sharing
- ✅ Age-appropriate communication

**Code Location:**
- `mobile/src/screens/RegistrationScreen.js` - Consent checkboxes
- `docs/PRIVACY_POLICY.md` - Full transparency documentation

### 2. Purpose Limitation
**Implementation:**
- ✅ Data collected only for student well-being monitoring
- ✅ No secondary uses without additional consent
- ✅ Clear documentation of each data purpose

**Database Schema:**
```sql
-- Each table has a specific, documented purpose
-- No data repurposing without consent
```

### 3. Data Minimization
**Implementation:**
- ✅ Only first name collected (no surname)
- ✅ No photos, location, or biometric data
- ✅ Optional text fields for additional context
- ✅ Minimal metadata collection

**What We DON'T Collect:**
- Surnames or full names
- Home addresses
- Phone numbers
- Email addresses (from students)
- Location data
- Device identifiers (except app ID)
- Browsing history
- Social media data

### 4. Accuracy
**Implementation:**
- ✅ Students can update their information
- ✅ Teachers can flag incorrect data
- ✅ Data validation on input
- ✅ Right to rectification implemented

**API Endpoints:**
```javascript
PUT /api/student/:appId - Update student information
```

### 5. Storage Limitation
**Implementation:**
- ✅ Default retention: 1 year
- ✅ Automatic cleanup function
- ✅ Configurable retention periods
- ✅ Audit log of deletions

**Database Function:**
```sql
-- Auto-cleanup function in schema.sql
CREATE OR REPLACE FUNCTION cleanup_old_checkins()
-- Deletes check-ins older than retention period
```

**Configuration:**
```env
DATA_RETENTION_DAYS=365
```

### 6. Integrity and Confidentiality
**Implementation:**
- ✅ HTTPS/TLS encryption in transit
- ✅ Password-protected database
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Regular security updates

**Security Features:**
- Bcrypt password hashing
- JWT authentication
- Rate limiting
- SQL injection protection (parameterized queries)
- XSS protection (input validation)

### 7. Accountability
**Implementation:**
- ✅ Data Processing Impact Assessment (DPIA)
- ✅ Privacy by Design principles
- ✅ Regular audits
- ✅ Documentation maintained
- ✅ Data Protection Officer appointed

## Consent Management

### Parental Consent Requirements

**Under Age 16:**
```
Before registration, schools must:
1. Provide parent information sheet
2. Obtain written parental consent
3. Store consent forms securely
4. Allow consent withdrawal at any time
```

**Age 16+:**
- Students can provide their own consent
- Still recommended to inform parents
- Consent withdrawal rights apply

### Consent Form Template

```markdown
PARENT/GUARDIAN CONSENT FORM
Well-being Check-in App

Student Name: _________________
Date of Birth: _________________

I consent to my child using the Well-being Check-in App.

I understand:
☐ Purpose: Monitor my child's well-being at school
☐ Data collected: First name, age, mood, health symptoms
☐ Who sees it: Teachers and designated school staff
☐ Duration: Data kept for 1 year
☐ Rights: I can view, correct, or delete data at any time
☐ Voluntary: Participation is optional

Parent Signature: _________________ Date: _________

Consent can be withdrawn at any time by contacting:
Data Protection Officer: dpo@school.edu
```

## Data Subject Rights

### 1. Right of Access
**Implementation:**
```
GET /api/dashboard/export/:appId
- Returns all student data in JSON format
- Includes check-in history
- Processing time: Within 30 days
```

**User Action:**
Parents/students request data export via school DPO.

### 2. Right to Rectification
**Implementation:**
- Students can update their profile
- Teachers can flag and correct errors
- All corrections logged

**Process:**
1. Request sent to school DPO
2. DPO verifies identity
3. Data corrected within 30 days
4. Confirmation sent to requester

### 3. Right to Erasure
**Implementation:**
```
DELETE /api/dashboard/student/:appId
- Deletes all student data
- Cascades to all related records
- Logged in audit trail
```

**Exceptions:**
- Safeguarding concerns (legal obligation)
- Active investigations
- Legal proceedings

### 4. Right to Data Portability
**Implementation:**
- Export to JSON format
- Machine-readable
- Can be imported to other systems

### 5. Right to Object
**Implementation:**
- Students can opt out of participation
- No penalties for non-participation
- Alternative support methods available

### 6. Right to Restrict Processing
**Implementation:**
- Can pause data collection while dispute resolved
- Data marked as "restricted" in database
- No new processing until resolved

## Data Protection by Design

### Technical Measures

**1. Pseudonymization**
```javascript
// App ID instead of real names in most contexts
appId: uuid.v4() // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**2. Access Controls**
```javascript
// Teachers can only access their classroom data
WHERE classroom_id = userClassroomId
```

**3. Encryption**
- TLS 1.3 for data in transit
- Database encryption at rest (configurable)
- Encrypted backups

**4. Audit Logging**
```sql
-- All data access logged
CREATE TABLE data_access_log (
    user_id UUID,
    action VARCHAR(50),
    timestamp TIMESTAMP,
    ip_address VARCHAR(45)
);
```

### Organizational Measures

**1. Staff Training**
- Annual GDPR training for all staff
- Specific training for app users
- Data protection awareness

**2. Data Protection Impact Assessment (DPIA)**
Required because:
- Processing children's data
- Systematic monitoring
- Automated decision-making (scoring)

**DPIA Template:** See `docs/DPIA_TEMPLATE.md`

**3. Data Processing Agreement**
If using cloud hosting:
- DPA with hosting provider
- GDPR-compliant processors only
- EU-based servers preferred

**4. Incident Response Plan**
```
1. Detect → 2. Assess → 3. Contain → 4. Notify → 5. Review
```

## Third-Party Processors

### Email Provider (Nodemailer/SMTP)
- **Purpose:** Sending alert emails
- **Data Shared:** Teacher emails, student first names, scores
- **Safeguards:** TLS encryption, reputable providers
- **DPA Required:** Yes

### Cloud Database (if applicable)
- **Purpose:** Data storage
- **Data Shared:** All application data
- **Safeguards:** Encryption, EU-based, GDPR-certified
- **DPA Required:** Yes

### Mobile App Stores (Apple/Google)
- **Purpose:** App distribution
- **Data Shared:** None (all data stays on school servers)
- **Safeguards:** App stores don't access student data

## Cross-Border Data Transfers

**EU/EEA Deployment:**
- All data remains in EU/EEA
- No transfers outside EU/EEA

**UK Deployment:**
- UK GDPR applies
- Data adequacy decision in place

**Other Countries:**
- Assess local privacy laws
- Ensure adequate safeguards
- Consider Standard Contractual Clauses (SCCs)

## Breach Notification

### Detection
- Automated monitoring alerts
- Regular security audits
- Staff reporting procedures

### Response Timeline
```
Hour 0: Breach detected
Hour 1: Incident team assembled
Hour 4: Initial assessment complete
Hour 24: Containment measures implemented
Hour 72: Authority notification (if required)
```

### Notification Requirements
**To Supervisory Authority:**
- Within 72 hours
- If "likely to result in risk"
- Even if no personal data exposed

**To Data Subjects:**
- "Without undue delay"
- If "likely to result in high risk"
- Clear, plain language
- Remedial steps outlined

## Records of Processing Activities

### Required Documentation
```markdown
Activity: Student well-being monitoring
Purpose: Safeguarding and student support
Legal Basis: Consent + Legitimate Interest
Categories of Data: Name, age, emotions, health symptoms
Recipients: Teachers, DSL, school admin
Retention: 1 year
Security: Encryption, access controls
```

## Regular Reviews

### Annual GDPR Audit Checklist
- [ ] Review privacy policy
- [ ] Update consent forms
- [ ] Audit data access logs
- [ ] Test data export/deletion procedures
- [ ] Review third-party processors
- [ ] Staff training completed
- [ ] DPIA updated
- [ ] Incident response plan tested
- [ ] Data retention policy reviewed
- [ ] Security measures assessed

## School Implementation Checklist

### Before Deployment
- [ ] Appoint Data Protection Officer
- [ ] Complete DPIA
- [ ] Prepare parent information sheet
- [ ] Create consent forms
- [ ] Train staff on GDPR requirements
- [ ] Configure retention periods
- [ ] Set up secure hosting
- [ ] Sign DPAs with processors

### During Deployment
- [ ] Obtain parental consents
- [ ] Register processing activities
- [ ] Configure access controls
- [ ] Test data export functions
- [ ] Verify encryption
- [ ] Set up audit logging

### After Deployment
- [ ] Monitor for breaches
- [ ] Handle data subject requests
- [ ] Conduct annual reviews
- [ ] Update documentation
- [ ] Refresh staff training

## Resources

### Templates Provided
- Privacy Policy
- Parental Consent Form
- DPIA Template
- Data Subject Request Form
- Breach Notification Template

### External Resources
- [ICO (UK) - Children and GDPR](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/children-and-the-gdpr/)
- [EDPB Guidelines](https://edpb.europa.eu/our-work-tools/general-guidance/guidelines-recommendations-best-practices_en)
- [GDPR Official Text](https://gdpr-info.eu/)

## Contact

For GDPR compliance questions:
- Review this documentation
- Consult your Data Protection Officer
- Contact your supervisory authority
- Seek legal advice if needed

---

**This app is designed with Privacy by Design principles and GDPR compliance as a priority.**
