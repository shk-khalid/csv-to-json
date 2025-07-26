const express = require('express');
const csvParser = require('../services/csvParser');
const db = require('../db');

const router = express.Router();

/**
 * POST /upload
 * Parses CSV file, stores data to database, and prints age distribution
 */
router.post('/', async (req, res) => {
  try {
    console.log('📤 Starting CSV upload and processing...');
    
    // Parse CSV file
    console.log('📄 Parsing CSV file...');
    const users = await csvParser.parseCSV();
    console.log(`✅ Parsed ${users.length} users from CSV`);

    if (users.length === 0) {
      return res.status(400).json({
        error: 'No valid data found',
        message: 'The CSV file contains no valid user records'
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
      message: 'CSV data processed successfully',
      data: {
        totalProcessed: users.length,
        totalInserted: insertedCount,
        ageDistribution: ageDistribution
      }
    });

  } catch (error) {
    console.error('❌ Upload processing error:', error.message);
    res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
});

module.exports = router;