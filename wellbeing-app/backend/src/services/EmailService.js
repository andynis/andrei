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
}

module.exports = new EmailService();
