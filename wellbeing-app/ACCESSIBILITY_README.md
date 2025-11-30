# Accessibility & Bullying Detection Features

## Overview
The Well-being Check-in App now includes comprehensive accessibility features for blind and deaf students, plus an indirect bullying indicator system.

---

## 🦯 Accessibility for Blind Students

### Screen Reader Support
- **Full VoiceOver (iOS) and TalkBack (Android) compatibility**
- All UI elements properly labeled with accessibility labels
- Logical navigation order throughout the app
- Semantic HTML roles for proper screen reader interpretation

### Text-to-Speech (TTS)
- Automatic reading of questions and options
- Voice confirmation of selections
- Spoken feedback for all actions
- Navigation announcements

**Example:**
```
"How are you feeling? Choose the emoji that best matches your mood"
[Student selects "Happy"]
"Answer selected: Happy"
```

### Voice Input
- Voice-to-text for optional notes section
- Hands-free interaction capability
- Speech recognition for natural input

### Audio Feedback
- Spoken confirmations for each action
- Success/error announcements
- Question reading on demand

### Large Touch Targets
- Minimum 44x44 point touch areas (WCAG AAA compliant)
- High contrast mode support
- Clear focus indicators

---

## 🤟 Accessibility for Deaf Students

### Visual Feedback
- All audio replaced with visual cues
- Color-coded status indicators
- Animated confirmations
- Progress indicators

### Vibration Patterns
Different haptic feedback for different actions:
- **Short vibration:** Selection confirmed
- **Double vibration:** Error occurred
- **Success pattern:** Check-in submitted
- **Alert pattern:** Important notification

**Vibration Patterns:**
```javascript
Short:   [0, 100]           // Quick tap
Long:    [0, 500]           // Hold
Success: [0, 50, 100, 50]   // Double tap
Error:   [0, 100, 100, 100] // Triple tap
Alert:   [0, 200, 100, 200] // Pulse pattern
```

### Visual Communication
- Icon-based navigation
- Emoji for emotional expression
- Color scales for intensity
- Clear visual progress

### No Audio Dependencies
- All information available visually
- Captions for any instructional content
- Visual alerts replace audio notifications

---

## 🛡️ Indirect Bullying Detection

### Philosophy
**Why Indirect Questions?**

Children who are being bullied often:
- Don't recognize it as "bullying"
- Feel ashamed or embarrassed
- Fear retaliation if they report
- Don't want to be labeled as victims

**Solution:** Ask questions about feelings and experiences that indicate bullying WITHOUT using the word "bullying."

### Age-Appropriate Question Sets

#### Ages 5-7 (4 questions)
1. "Do you have friends to play with?"
2. "Do you want to come to school?"
3. "Do other kids let you join in games?"
4. "Do you sleep well and eat well?"

#### Ages 8-12 (7 questions)
All of the above, plus:
5. "Do you feel safe at school?"
6. "Are there places in school you try to avoid?"
7. "Do you look forward to tomorrow at school?"

#### Ages 13-18 (8 questions)
All of the above, plus:
8. "Have your belongings been taken or damaged?"

### Scoring System

**Risk Levels:**
- **0-3 points:** Low risk (Green) - No significant indicators
- **4-7 points:** Moderate risk (Yellow) - Some concerns, monitor
- **8-11 points:** High risk (Orange) - Multiple indicators, investigate
- **12+ points:** Critical risk (Red) - Immediate intervention needed

**Example Calculation:**
```
Question: "Do you feel safe at school?"
Answer: "Sometimes unsafe" = +3 points

Question: "Are there places you avoid?"
Answer: "Several places" = +3 points

Question: "Do you look forward to tomorrow?"
Answer: "Not really" = +2 points

Total: 8 points = HIGH RISK
```

### What Questions Detect

**Social Isolation:**
- Lack of friends
- Exclusion from activities
- Avoiding certain areas

**Fear & Anxiety:**
- Not wanting to come to school
- Feeling unsafe
- Sleep/appetite disturbances

**Avoidance Behaviors:**
- Avoiding specific locations
- Not looking forward to school
- Withdrawing from activities

**Physical Indicators:**
- Belongings damaged/stolen
- Physical symptoms (stress-related)
- Changes in sleep/appetite

---

## 🚨 Alert System

### Standard Alerts (Score < 50)
- Email to classroom teacher
- Standard well-being concern format
- Monitor and support recommended

### Bullying Alerts (High or Critical Risk)

**Recipients:**
- Classroom teacher (primary)
- Designated Safeguarding Lead (CC)
- School Principal (for critical only)
- School counselor

**Alert Email Includes:**
- Bullying Risk Score (0-18)
- Risk Level (Moderate/High/Critical)
- Specific concerning responses
- Overall well-being score
- Student's optional notes
- Immediate action checklist

**Priority:**
- Marked as HIGH PRIORITY email
- Red header with urgent designation
- Clear action timeline

**Sample Alert:**
```
Subject: 🚨 URGENT: Possible Bullying Indicators - HIGH RISK

BULLYING RISK SCORE: 9/18
RISK LEVEL: HIGH RISK

Student: Emma (Age 11)
Time: 9:15 AM
Well-being Score: 42/100

Concerning Responses:
• Feels unsafe at school sometimes
• Avoids several places in school
• Doesn't look forward to tomorrow
• Has few friends to play with

IMMEDIATE ACTIONS REQUIRED:
✓ Within 1 hour: Discreetly observe student
✓ Within 24 hours: Private conversation
✓ Immediately: Notify Safeguarding Lead
✓ Document all observations
```

---

## 📊 Updated Scoring Algorithm

### New Weighting (with Bullying Indicator)

**Components:**
1. **Mood:** 25% (was 30%)
2. **Energy Level:** 15% (was 20%)
3. **Social Comfort:** 15% (was 20%)
4. **Physical Health:** 25% (was 30%)
5. **Bullying Indicator:** 20% (NEW)

**Bullying Score Conversion:**
- 0-3 points (Low): 100/100 = No impact
- 4-7 points (Moderate): 60/100 = Some concern
- 8-11 points (High): 30/100 = Significant concern
- 12+ points (Critical): 0/100 = Urgent concern

**Example Calculation:**
```
Mood: 3/5 = 15/25 points
Energy: 4/5 = 12/15 points
Social: 2/5 = 6/15 points
Physical: Good, no symptoms = 25/25 points
Bullying: 8 points (High) = 30/100 → 6/20 points

Total: 64/100
```

---

## 🔒 Privacy & Safeguarding

### Data Protection

**Bullying Indicator Data:**
- Stored separately with restricted access
- Encrypted in database (JSONB field)
- Accessed only by authorized staff
- Subject to enhanced GDPR protections

**Access Controls:**
- Teachers: Own classroom only
- Safeguarding Lead: All students
- Admin: System management
- Regular teachers: NO access to bullying details (only alerts)

### Confidentiality

**What Teachers See:**
- Alert that student may need support
- General risk level
- Student's responses to questions
- Recommended actions

**What Teachers DON'T See:**
- Label of "bullying victim"
- Comparison with other students
- Historical patterns (without permission)

### Ethical Use

**DO:**
✓ Use as an early warning system
✓ Investigate sensitively and privately
✓ Follow established safeguarding procedures
✓ Involve parents appropriately
✓ Document all actions
✓ Provide support to student

**DON'T:**
✗ Label or stigmatize students
✗ Share alerts publicly
✗ Confront suspected bullies without investigation
✗ Make assumptions without assessment
✗ Discuss with unauthorized staff
✗ Ignore high-risk alerts

---

## 👥 Staff Training Requirements

### Before Launch

**All Staff:**
- Accessibility features overview
- How to support blind/deaf students
- Bullying indicator interpretation
- Response procedures

**Teachers:**
- Dashboard navigation with accessibility data
- Reading and responding to bullying alerts
- When to escalate to Safeguarding Lead
- Confidentiality requirements

**Safeguarding Team:**
- In-depth bullying indicator training
- Investigation procedures
- Documented response protocols
- Legal and ethical considerations

---

## 📱 Student Experience

### For Blind Students
1. Open app (screen reader announces)
2. Voice reads: "Start Check-in"
3. Scan QR code (audio guidance)
4. Each question is read aloud
5. Options are spoken
6. Selections confirmed with audio
7. Submit (voice confirmation)
8. Success announcement

### For Deaf Students
1. Open app (visual animation)
2. Clear visual "Start Check-in" button
3. Scan QR code (visual frame guide)
4. Each question with large text & icons
5. Options with clear visual indicators
6. Selections confirmed with animation + vibration
7. Submit (visual confirmation + success vibration)
8. Animated success screen

### For All Students (Bullying Questions)
- **Never** uses the word "bullying"
- Framed as "school experience" questions
- Mixed with other well-being questions
- Non-stigmatizing language
- Age-appropriate wording
- Optional participation

---

## 🎯 Success Metrics

### Accessibility Metrics
- % of students with disabilities successfully using app
- Completion rate for blind/deaf students
- User feedback on accessibility features
- Time to complete check-in (should be similar)

### Bullying Detection Metrics
- Number of alerts generated
- Response time to alerts
- Intervention outcomes
- Reduction in serious incidents
- Student safety perception improvements

### Quality Metrics
- False positive rate (alerts that weren't bullying)
- False negative rate (missed cases)
- Early detection rate
- Successful intervention rate

---

## 📋 Implementation Checklist

### Technical Setup
- [ ] Install accessibility dependencies (TTS, Voice)
- [ ] Test screen reader compatibility
- [ ] Verify vibration patterns work
- [ ] Test on devices used by blind/deaf students
- [ ] Update database schema (done)
- [ ] Deploy updated backend (done)

### Staff Preparation
- [ ] Train safeguarding team
- [ ] Train teachers on alerts
- [ ] Create response procedures
- [ ] Establish escalation pathways
- [ ] Document all processes

### Student Rollout
- [ ] Test with students with disabilities
- [ ] Gather accessibility feedback
- [ ] Adjust based on testing
- [ ] Gradual rollout
- [ ] Ongoing support

### Monitoring
- [ ] Weekly review of alerts
- [ ] Monthly effectiveness assessment
- [ ] Quarterly question validity review
- [ ] Annual professional review
- [ ] Continuous improvement

---

## 🆘 Support Resources

### For Accessibility Questions
- iOS VoiceOver Guide: [Apple Accessibility](https://www.apple.com/accessibility/voiceover/)
- Android TalkBack Guide: [Android Accessibility](https://support.google.com/accessibility/android)
- WCAG Guidelines: [W3C Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)

### For Bullying Response
- National Bullying Prevention Center
- StopBullying.gov
- School's anti-bullying policy
- Designated Safeguarding Lead
- Local child protection services

### Technical Support
- Accessibility testing: accessibility@yourschool.edu
- Bullying alert issues: safeguarding@yourschool.edu
- App technical issues: support@yourschool.edu

---

**Remember:**
- Accessibility is a legal requirement and moral imperative
- Bullying indicators are tools, not diagnoses
- Professional judgment is always required
- Student safety is the priority
- Continuous improvement is essential

For detailed technical documentation, see:
- [ACCESSIBILITY_BULLYING.md](docs/ACCESSIBILITY_BULLYING.md)
- [PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)
- [USER_GUIDE.md](docs/USER_GUIDE.md)
