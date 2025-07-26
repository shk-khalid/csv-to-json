const express = require('express');
const multer = require('multer');
const csvParser = require('../services/csvParser');
const db = require('../db');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /upload
 * Accepts CSV file upload, parses it, stores data to database, and prints age distribution
 */
router.post('/', upload.single('csvFile'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a CSV file using the "csvFile" field'
      });
    }

    console.log('📤 Starting CSV upload and processing...');
    console.log(`📄 Processing file: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Parse CSV file
    console.log('📄 Parsing CSV file...');
    const users = await csvParser.parseCSVFromBuffer(req.file.buffer);
    console.log(`✅ Parsed ${users.length} users from CSV`);

    if (users.length === 0) {
      return res.status(400).json({
        error: 'No valid data found',
        message: 'The uploaded CSV file contains no valid user records'
      });
    }

    // Clear existing data (optional - remove if you want to append)
    await db.clearUsers();
    console.log('🗑️ Cleared existing user data from Supabase');

    // Insert users into Supabase
    console.log('💾 Inserting users into Supabase...');
    const insertedCount = await db.insertUsers(users);
    console.log(`✅ Inserted ${insertedCount} users into Supabase`);

    // Calculate and print age distribution
    console.log('📊 Calculating age distribution...');
    const ageDistribution = await db.calculateAgeDistribution();
    
    console.log('\n📈 AGE DISTRIBUTION REPORT:');
    console.log('============================');
    console.log(`<20 years:    ${ageDistribution.under20} users`);
    console.log(`20-40 years:  ${ageDistribution.between20And40} users`);
    console.log(`40-60 years:  ${ageDistribution.between40And60} users`);
    console.log(`>60 years:    ${ageDistribution.over60} users`);
    console.log(`Total:        ${ageDistribution.total} users`);
    console.log('============================\n');

    // Return success response
    res.status(200).json({
      success: true,
      message: `CSV file "${req.file.originalname}" processed successfully`,
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalProcessed: users.length,
        totalInserted: insertedCount,
        ageDistribution: ageDistribution
      }
    });

  } catch (error) {
    console.error('❌ Upload processing error:', error.message);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'CSV file must be smaller than 10MB'
        });
      }
      return res.status(400).json({
        error: 'File upload error',
        message: error.message
      });
    }
    
    // Handle file type errors
    if (error.message === 'Only CSV files are allowed') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Please upload a valid CSV file'
      });
    }
    
    res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
});

module.exports = router;