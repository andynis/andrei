const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get classroom overview
router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const {classroomId} = req.params;
    const {startDate, endDate} = req.query;

    let dateFilter = '';
    const params = [classroomId];

    if (startDate && endDate) {
      dateFilter = 'AND timestamp BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    }

    // Get today's check-ins
    const todayResult = await db.query(
      `SELECT
        COUNT(*) as total_checkins,
        AVG(wellbeing_score) as average_score,
        COUNT(CASE WHEN wellbeing_score < 50 THEN 1 END) as low_scores,
        COUNT(CASE WHEN alert_sent = true THEN 1 END) as alerts_sent
       FROM checkins
       WHERE classroom_id = $1
       AND DATE(timestamp) = CURRENT_DATE`,
      [classroomId]
    );

    // Get recent check-ins with low scores
    const lowScoreResult = await db.query(
      `SELECT
        c.id,
        c.wellbeing_score,
        c.mood,
        c.energy_level,
        c.symptoms,
        c.timestamp,
        c.alert_sent,
        s.first_name,
        s.age
       FROM checkins c
       JOIN students s ON c.app_id = s.app_id
       WHERE c.classroom_id = $1
       AND c.wellbeing_score < 50
       ORDER BY c.timestamp DESC
       LIMIT 10`,
      [classroomId]
    );

    // Get trend data (last 7 days)
    const trendResult = await db.query(
      `SELECT
        DATE(timestamp) as date,
        COUNT(*) as checkins,
        AVG(wellbeing_score) as avg_score,
        AVG(mood) as avg_mood,
        AVG(energy_level) as avg_energy
       FROM checkins
       WHERE classroom_id = $1
       AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(timestamp)
       ORDER BY date ASC`,
      [classroomId]
    );

    // Get symptom frequency
    const symptomResult = await db.query(
      `SELECT
        jsonb_array_elements_text(symptoms) as symptom,
        COUNT(*) as count
       FROM checkins
       WHERE classroom_id = $1
       AND symptoms != '[]'::jsonb
       AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY symptom
       ORDER BY count DESC`,
      [classroomId]
    );

    res.json({
      success: true,
      today: todayResult.rows[0],
      lowScoreAlerts: lowScoreResult.rows,
      trend: trendResult.rows,
      symptoms: symptomResult.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({error: 'Failed to load dashboard data'});
  }
});

// Get school-wide statistics
router.get('/school/:schoolId', async (req, res) => {
  try {
    const {schoolId} = req.params;

    // Overall stats
    const statsResult = await db.query(
      `SELECT
        COUNT(DISTINCT c.id) as total_checkins,
        COUNT(DISTINCT c.app_id) as active_students,
        AVG(c.wellbeing_score) as average_score,
        COUNT(CASE WHEN c.wellbeing_score < 50 THEN 1 END) as students_needing_attention
       FROM checkins c
       WHERE c.school_id = $1
       AND DATE(c.timestamp) = CURRENT_DATE`,
      [schoolId]
    );

    // Classroom breakdown
    const classroomResult = await db.query(
      `SELECT
        cl.id,
        cl.name,
        cl.teacher_name,
        COUNT(c.id) as checkins_today,
        AVG(c.wellbeing_score) as avg_score,
        COUNT(CASE WHEN c.wellbeing_score < 50 THEN 1 END) as low_scores
       FROM classrooms cl
       LEFT JOIN checkins c ON cl.id = c.classroom_id AND DATE(c.timestamp) = CURRENT_DATE
       WHERE cl.school_id = $1
       GROUP BY cl.id, cl.name, cl.teacher_name
       ORDER BY low_scores DESC, avg_score ASC`,
      [schoolId]
    );

    res.json({
      success: true,
      stats: statsResult.rows[0],
      classrooms: classroomResult.rows,
    });
  } catch (error) {
    console.error('School dashboard error:', error);
    res.status(500).json({error: 'Failed to load school data'});
  }
});

// Get individual student history (for detailed view)
router.get('/student/:appId', async (req, res) => {
  try {
    const {appId} = req.params;
    const {days = 30} = req.query;

    // Student info
    const studentResult = await db.query(
      'SELECT first_name, age, registered_at FROM students WHERE app_id = $1',
      [appId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({error: 'Student not found'});
    }

    // Check-in history
    const historyResult = await db.query(
      `SELECT * FROM checkins
       WHERE app_id = $1
       AND timestamp >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
       ORDER BY timestamp DESC`,
      [appId]
    );

    // Calculate trends
    const trendsResult = await db.query(
      `SELECT
        AVG(wellbeing_score) as avg_score,
        AVG(mood) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(social_comfort) as avg_social
       FROM checkins
       WHERE app_id = $1
       AND timestamp >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'`,
      [appId]
    );

    res.json({
      success: true,
      student: studentResult.rows[0],
      history: historyResult.rows,
      trends: trendsResult.rows[0],
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({error: 'Failed to load student data'});
  }
});

// Export data for GDPR compliance
router.get('/export/:appId', async (req, res) => {
  try {
    const {appId} = req.params;

    // Get all student data
    const studentResult = await db.query(
      'SELECT * FROM students WHERE app_id = $1',
      [appId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({error: 'Student not found'});
    }

    const checkinsResult = await db.query(
      'SELECT * FROM checkins WHERE app_id = $1 ORDER BY timestamp DESC',
      [appId]
    );

    res.json({
      success: true,
      export_date: new Date().toISOString(),
      student: studentResult.rows[0],
      checkins: checkinsResult.rows,
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({error: 'Failed to export data'});
  }
});

// Delete student data (GDPR right to erasure)
router.delete('/student/:appId', async (req, res) => {
  try {
    const {appId} = req.params;

    // Delete student (cascades to checkins)
    const result = await db.query(
      'DELETE FROM students WHERE app_id = $1 RETURNING id',
      [appId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Student not found'});
    }

    res.json({
      success: true,
      message: 'Student data deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({error: 'Failed to delete data'});
  }
});

module.exports = router;
