const express = require('express');
const multer = require('multer');
const csvParser = require('../services/csvParser');
const db = require('../db');

const router = express.Router();

// file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv');
    cb(ok ? null : new Error('Only CSV files are allowed'), ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Upload a CSV in "csvFile"'
      });
    }

    console.log(`Processing ${req.file.originalname} (${req.file.size} bytes)`);
    const users = await csvParser.parseCSVFromBuffer(req.file.buffer);
    console.log(`Parsed ${users.length} records`);
    if (!users.length) {
      return res.status(400).json({
        error: 'Empty CSV',
        message: 'No valid records found'
      });
    }

    await db.clearUsers();
    console.log('Cleared existing users');

    const insertedCount = await db.insertUsers(users);
    console.log(`Inserted ${insertedCount} users`);

    const ageDistribution = await db.calculateAgeDistribution();
    console.log('Age distribution:', ageDistribution);

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        totalProcessed: users.length,
        totalInserted: insertedCount,
        ageDistribution
      }
    });
  } catch (err) {
    console.error('Error:', err.message);

    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'CSV must be under 10MB'
        : err.message;
      return res.status(400).json({ error: 'Upload error', message: msg });
    }

    if (err.message === 'Only CSV files are allowed') {
      return res.status(400).json({ error: 'Invalid file type', message: err.message });
    }

    res.status(500).json({ error: 'Processing failed', message: err.message });
  }
});

module.exports = router;
