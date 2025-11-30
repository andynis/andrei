const express = require('express');
const router = express.Router();
const db = require('../database/db');
const EmailService = require('../services/EmailService');

// Submit a check-in
router.post('/', async (req, res) => {
  try {
    const {
      appId,
      classroomId,
      schoolId,
      mood,
      energyLevel,
      socialComfort,
      symptoms,
      feelingOkay,
      bullyingIndicators,
      bullyingLevel,
      bullyingRiskLevel,
      additionalNotes,
      wellbeingScore,
      studentAge,
    } = req.body;

    // Validate required fields
    if (
      !appId ||
      !classroomId ||
      !schoolId ||
      mood === undefined ||
      energyLevel === undefined ||
      socialComfort === undefined ||
      feelingOkay === undefined ||
      wellbeingScore === undefined
    ) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Insert check-in
    const result = await db.query(
      `INSERT INTO checkins (
        app_id, classroom_id, school_id,
        mood, energy_level, social_comfort,
        feeling_okay, symptoms,
        bullying_indicators, bullying_level, bullying_risk_level,
        additional_notes,
        wellbeing_score, student_age
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        appId,
        classroomId,
        schoolId,
        mood,
        energyLevel,
        socialComfort,
        feelingOkay,
        JSON.stringify(symptoms || []),
        JSON.stringify(bullyingIndicators || {}),
        bullyingLevel || 0,
        bullyingRiskLevel || 'low',
        additionalNotes || null,
        wellbeingScore,
        studentAge,
      ]
    );

    const checkin = result.rows[0];

    // Check if score is below threshold and send alert
    const threshold = parseInt(process.env.ALERT_THRESHOLD || 50);
    if (wellbeingScore < threshold) {
      try {
        // Get classroom/teacher info
        const classroomResult = await db.query(
          'SELECT teacher_email, teacher_name, name FROM classrooms WHERE id = $1',
          [classroomId]
        );

        if (classroomResult.rows.length > 0) {
          const classroom = classroomResult.rows[0];

          // Get student info
          const studentResult = await db.query(
            'SELECT first_name, age FROM students WHERE app_id = $1',
            [appId]
          );

          const student = studentResult.rows[0] || {
            first_name: 'A student',
            age: studentAge,
          };

          // Send alert email
          await EmailService.sendLowScoreAlert({
            teacherEmail: classroom.teacher_email,
            teacherName: classroom.teacher_name,
            classroomName: classroom.name,
            studentName: student.first_name,
            studentAge: student.age,
            wellbeingScore,
            mood,
            symptoms,
            additionalNotes,
            timestamp: checkin.timestamp,
          });

          // Log alert
          await db.query(
            `INSERT INTO alerts (
              checkin_id, app_id, classroom_id,
              teacher_email, wellbeing_score, email_status
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              checkin.id,
              appId,
              classroomId,
              classroom.teacher_email,
              wellbeingScore,
              'sent',
            ]
          );

          // Update checkin alert status
          await db.query(
            'UPDATE checkins SET alert_sent = true, alert_sent_at = CURRENT_TIMESTAMP WHERE id = $1',
            [checkin.id]
          );
        }
      } catch (alertError) {
        console.error('Alert sending failed:', alertError);
        // Don't fail the check-in if alert fails
      }
    }

    // Check for bullying indicators (high or critical risk)
    if (bullyingRiskLevel === 'high' || bullyingRiskLevel === 'critical') {
      try {
        // Get classroom/teacher info
        const classroomResult = await db.query(
          'SELECT teacher_email, teacher_name, name, school_id FROM classrooms WHERE id = $1',
          [classroomId]
        );

        if (classroomResult.rows.length > 0) {
          const classroom = classroomResult.rows[0];

          // Get student info
          const studentResult = await db.query(
            'SELECT first_name, age FROM students WHERE app_id = $1',
            [appId]
          );

          const student = studentResult.rows[0] || {
            first_name: 'A student',
            age: studentAge,
          };

          // Get school admin/safeguarding lead emails
          const schoolResult = await db.query(
            'SELECT email FROM users WHERE school_id = $1 AND (role = \'admin\' OR role = \'safeguarding_lead\')',
            [classroom.school_id]
          );

          const additionalRecipients = schoolResult.rows.map(row => row.email);

          // Send bullying alert email
          await EmailService.sendBullyingAlert({
            teacherEmail: classroom.teacher_email,
            teacherName: classroom.teacher_name,
            classroomName: classroom.name,
            studentName: student.first_name,
            studentAge: student.age,
            bullyingLevel,
            bullyingRiskLevel,
            bullyingIndicators,
            wellbeingScore,
            additionalNotes,
            timestamp: checkin.timestamp,
            additionalRecipients, // DSL, principal, etc.
          });

          // Log bullying alert
          await db.query(
            `INSERT INTO alerts (
              checkin_id, app_id, classroom_id,
              teacher_email, wellbeing_score, email_status
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              checkin.id,
              appId,
              classroomId,
              classroom.teacher_email,
              wellbeingScore,
              'sent',
            ]
          );

          // Update bullying alert status
          await db.query(
            'UPDATE checkins SET bullying_alert_sent = true WHERE id = $1',
            [checkin.id]
          );
        }
      } catch (bullyingAlertError) {
        console.error('Bullying alert sending failed:', bullyingAlertError);
        // Don't fail the check-in if alert fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully',
      checkinId: checkin.id,
      wellbeingScore: checkin.wellbeing_score,
      alertSent: checkin.alert_sent,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({error: 'Failed to record check-in'});
  }
});

// Get check-in history for a student
router.get('/:appId', async (req, res) => {
  try {
    const {appId} = req.params;
    const {limit = 30, offset = 0} = req.query;

    const result = await db.query(
      `SELECT * FROM checkins
       WHERE app_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [appId, limit, offset]
    );

    res.json({
      success: true,
      checkins: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({error: 'Failed to retrieve check-ins'});
  }
});

// Get statistics for a student
router.get('/:appId/stats', async (req, res) => {
  try {
    const {appId} = req.params;

    const result = await db.query(
      `SELECT
        COUNT(*) as total_checkins,
        AVG(wellbeing_score) as average_score,
        MIN(wellbeing_score) as lowest_score,
        MAX(wellbeing_score) as highest_score,
        AVG(mood) as average_mood,
        AVG(energy_level) as average_energy
       FROM checkins
       WHERE app_id = $1`,
      [appId]
    );

    res.json({
      success: true,
      stats: result.rows[0],
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({error: 'Failed to retrieve statistics'});
  }
});

module.exports = router;
