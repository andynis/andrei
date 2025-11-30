const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendLowScoreAlert(data) {
    const {
      teacherEmail,
      teacherName,
      classroomName,
      studentName,
      studentAge,
      wellbeingScore,
      mood,
      symptoms,
      additionalNotes,
      timestamp,
    } = data;

    const moodLabels = [
      'Very sad',
      'Sad',
      'Okay',
      'Good',
      'Happy',
      'Very happy',
    ];
    const moodText = moodLabels[mood] || 'Unknown';

    const symptomsText =
      symptoms && symptoms.length > 0 ? symptoms.join(', ') : 'None reported';

    const emailSubject = `🚨 Well-being Alert: Student Needs Attention`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #E74C3C; color: white; padding: 20px; border-radius: 5px; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .score { font-size: 48px; font-weight: bold; color: #E74C3C; text-align: center; margin: 20px 0; }
    .detail { margin: 10px 0; padding: 10px; background-color: white; border-left: 4px solid #E74C3C; }
    .footer { margin-top: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Student Well-being Alert</h1>
    </div>

    <div class="content">
      <p>Dear ${teacherName || 'Teacher'},</p>

      <p>A student in your classroom <strong>${classroomName}</strong> has completed a well-being check-in with a score below the alert threshold.</p>

      <div class="score">${wellbeingScore}/100</div>

      <div class="detail">
        <strong>Student:</strong> ${studentName} (Age: ${studentAge})
      </div>

      <div class="detail">
        <strong>Time:</strong> ${new Date(timestamp).toLocaleString()}
      </div>

      <div class="detail">
        <strong>Mood:</strong> ${moodText}
      </div>

      <div class="detail">
        <strong>Symptoms:</strong> ${symptomsText}
      </div>

      ${
        additionalNotes
          ? `
      <div class="detail">
        <strong>Additional Notes:</strong><br>
        "${additionalNotes}"
      </div>
      `
          : ''
      }

      <p style="margin-top: 20px; padding: 15px; background-color: #FFF3CD; border-left: 4px solid #FFC107;">
        <strong>⚠️ Recommended Action:</strong><br>
        Please check in with this student when you have a moment. They may need some extra support or attention today.
      </p>
    </div>

    <div class="footer">
      <p>This is an automated alert from the Student Well-being Check-in System.</p>
      <p><strong>Privacy Notice:</strong> This information is confidential and should be handled according to your school's privacy and safeguarding policies.</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Well-being System" <${process.env.EMAIL_USER}>`,
        to: teacherEmail,
        subject: emailSubject,
        html: emailBody,
      });

      console.log(`✅ Alert email sent to ${teacherEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  async sendDailySummary(data) {
    const {teacherEmail, teacherName, classroomName, date, stats} = data;

    const emailSubject = `📊 Daily Well-being Summary for ${classroomName}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4A90E2; color: white; padding: 20px; border-radius: 5px; }
    .stat-box { background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #4A90E2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Well-being Summary</h1>
      <p>${classroomName} - ${date}</p>
    </div>

    <div class="stat-box">
      <div class="stat-value">${stats.totalCheckins}</div>
      <div>Total Check-ins</div>
    </div>

    <div class="stat-box">
      <div class="stat-value">${Math.round(stats.averageScore)}/100</div>
      <div>Average Well-being Score</div>
    </div>

    <div class="stat-box">
      <div class="stat-value">${stats.studentsNeedingAttention}</div>
      <div>Students Needing Attention</div>
    </div>

    <p>Have a great day!</p>
  </div>
</body>
</html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Well-being System" <${process.env.EMAIL_USER}>`,
        to: teacherEmail,
        subject: emailSubject,
        html: emailBody,
      });

      console.log(`✅ Daily summary sent to ${teacherEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  async sendBullyingAlert(data) {
    const {
      teacherEmail,
      teacherName,
      classroomName,
      studentName,
      studentAge,
      bullyingLevel,
      bullyingRiskLevel,
      bullyingIndicators,
      wellbeingScore,
      additionalNotes,
      timestamp,
      additionalRecipients = [],
    } = data;

    const riskLevelColors = {
      moderate: {bg: '#FFF3CD', border: '#FFC107', text: 'MODERATE RISK'},
      high: {bg: '#FFE5E5', border: '#FF6B6B', text: 'HIGH RISK'},
      critical: {bg: '#FFD4D4', border: '#E74C3C', text: 'CRITICAL - IMMEDIATE ACTION REQUIRED'},
    };

    const alertStyle = riskLevelColors[bullyingRiskLevel] || riskLevelColors.moderate;

    // Format bullying indicators for email
    const indicatorsHtml = Object.entries(bullyingIndicators)
      .map(([key, value]) => `<li>${value.label || key}</li>`)
      .join('');

    const emailSubject = `🚨 URGENT: Possible Bullying Indicators Detected - ${bullyingRiskLevel.toUpperCase()}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 650px; margin: 0 auto; padding: 20px; }
    .header { background-color: #E74C3C; color: white; padding: 25px; border-radius: 5px; text-align: center; }
    .urgent { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .content { background-color: #f9f9f9; padding: 25px; margin-top: 20px; border-radius: 5px; }
    .risk-level {
      font-size: 28px;
      font-weight: bold;
      color: #E74C3C;
      text-align: center;
      margin: 20px 0;
      padding: 15px;
      background-color: ${alertStyle.bg};
      border-left: 6px solid ${alertStyle.border};
    }
    .score { font-size: 48px; font-weight: bold; color: #E74C3C; text-align: center; margin: 20px 0; }
    .detail { margin: 15px 0; padding: 15px; background-color: white; border-left: 4px solid #E74C3C; }
    .indicators { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .indicators ul { margin: 10px 0; padding-left: 20px; }
    .indicators li { margin: 5px 0; color: #E74C3C; }
    .action-box {
      margin-top: 20px;
      padding: 20px;
      background-color: #FFE5E5;
      border: 3px solid #E74C3C;
      border-radius: 5px;
    }
    .action-box h3 { color: #E74C3C; margin-top: 0; }
    .action-box ul { margin: 10px 0; padding-left: 20px; }
    .action-box li { margin: 8px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #777; }
    .confidential {
      background-color: #FFF3CD;
      padding: 15px;
      margin-top: 20px;
      border-left: 4px solid #FFC107;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="urgent">🚨 URGENT SAFEGUARDING ALERT 🚨</div>
      <h2>Possible Bullying Indicators Detected</h2>
    </div>

    <div class="risk-level">${alertStyle.text}</div>

    <div class="content">
      <p><strong>Dear ${teacherName || 'Teacher'},</strong></p>

      <p>A student in <strong>${classroomName}</strong> has completed a well-being check-in showing <strong>multiple indicators</strong> that may suggest they are experiencing bullying or other serious concerns.</p>

      <div class="score">Bullying Risk Score: ${bullyingLevel}/18</div>

      <div class="detail">
        <strong>Student:</strong> ${studentName} (Age: ${studentAge})
      </div>

      <div class="detail">
        <strong>Time:</strong> ${new Date(timestamp).toLocaleString()}
      </div>

      <div class="detail">
        <strong>Overall Well-being Score:</strong> ${wellbeingScore}/100
      </div>

      <div class="indicators">
        <strong>⚠️ Concerning Responses:</strong>
        <ul>
          ${indicatorsHtml}
        </ul>
      </div>

      ${
        additionalNotes
          ? `
      <div class="detail">
        <strong>Student's Comments:</strong><br>
        "${additionalNotes}"
      </div>
      `
          : ''
      }

      <div class="action-box">
        <h3>🚨 IMMEDIATE ACTIONS REQUIRED:</h3>
        <ul>
          <li><strong>Within 1 Hour:</strong> Discreetly observe the student</li>
          <li><strong>Within 24 Hours:</strong> Conduct a private, sensitive conversation with the student</li>
          <li><strong>Immediately:</strong> Notify the Designated Safeguarding Lead</li>
          <li><strong>Document:</strong> All observations and conversations</li>
          <li><strong>Do NOT:</strong> Discuss with other students or in public</li>
          <li><strong>Do NOT:</strong> Confront potential perpetrators without proper investigation</li>
        </ul>
      </div>

      <div class="confidential">
        ⚠️ CONFIDENTIAL SAFEGUARDING INFORMATION
        <p style="margin-top: 10px; font-weight: normal;">
          This alert contains sensitive safeguarding information. Handle according to your school's child protection procedures.
          These indicators do NOT confirm bullying - they require professional assessment and investigation.
        </p>
      </div>

      <p style="margin-top: 20px;">
        <strong>Next Steps:</strong><br>
        1. Contact your Designated Safeguarding Lead immediately<br>
        2. Review the school's anti-bullying and safeguarding policies<br>
        3. Follow established investigation procedures<br>
        4. Provide appropriate support to the student
      </p>
    </div>

    <div class="footer">
      <p><strong>This is an automated URGENT alert from the Student Well-being Check-in System.</strong></p>
      <p>Privacy Notice: This information is highly confidential and must be handled according to GDPR and child protection legislation.</p>
      <p>For support: Contact your Designated Safeguarding Lead or school administration.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Compile recipients
    const allRecipients = [teacherEmail, ...additionalRecipients].filter(Boolean);

    try {
      await this.transporter.sendMail({
        from: `"Well-being System - URGENT" <${process.env.EMAIL_USER}>`,
        to: teacherEmail,
        cc: additionalRecipients.length > 0 ? additionalRecipients.join(', ') : undefined,
        subject: emailSubject,
        html: emailBody,
        priority: 'high',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
        },
      });

      console.log(`🚨 BULLYING ALERT sent to ${allRecipients.join(', ')}`);
      return true;
    } catch (error) {
      console.error('❌ Bullying alert email failed:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
