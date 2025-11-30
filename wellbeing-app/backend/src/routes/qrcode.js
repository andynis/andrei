const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../database/db');

// Generate QR code for classroom
router.get('/generate/:classroomId', async (req, res) => {
  try {
    const {classroomId} = req.params;

    // Get classroom info
    const result = await db.query(
      'SELECT id, school_id, name FROM classrooms WHERE id = $1',
      [classroomId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({error: 'Classroom not found'});
    }

    const classroom = result.rows[0];

    // Create QR code data
    const qrData = JSON.stringify({
      classroomId: classroom.id,
      schoolId: classroom.school_id,
    });

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
    });

    // Update classroom with QR code data
    await db.query('UPDATE classrooms SET qr_code_data = $1 WHERE id = $2', [
      qrData,
      classroomId,
    ]);

    res.json({
      success: true,
      classroomId: classroom.id,
      classroomName: classroom.name,
      qrCodeDataURL,
      qrData,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({error: 'Failed to generate QR code'});
  }
});

// Create a new classroom and generate QR code
router.post('/classroom', async (req, res) => {
  try {
    const {schoolId, name, gradeLevel, teacherName, teacherEmail} = req.body;

    if (!schoolId || !name || !teacherEmail) {
      return res.status(400).json({error: 'Missing required fields'});
    }

    // Create classroom
    const result = await db.query(
      `INSERT INTO classrooms (school_id, name, grade_level, teacher_name, teacher_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, school_id, name`,
      [schoolId, name, gradeLevel || null, teacherName || null, teacherEmail]
    );

    const classroom = result.rows[0];

    // Generate QR code
    const qrData = JSON.stringify({
      classroomId: classroom.id,
      schoolId: classroom.school_id,
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
    });

    // Update classroom with QR code data
    await db.query('UPDATE classrooms SET qr_code_data = $1 WHERE id = $2', [
      qrData,
      classroom.id,
    ]);

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      classroom,
      qrCodeDataURL,
    });
  } catch (error) {
    console.error('Classroom creation error:', error);
    res.status(500).json({error: 'Failed to create classroom'});
  }
});

module.exports = router;
