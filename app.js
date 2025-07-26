const dotenv = require('dotenv').config()

const express = require('express');
const uploadRoutes = require('./routes/upload');
const db = require('./db');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Kelp Global CSV-to-JSON Converter API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test Supabase connection
    await db.testConnection();
    console.log('✅ Supabase connection established');

    // Check users table (create via Supabase if needed)
    await db.createUsersTable();
    console.log('✅ Users table ready');

    app.listen(PORT, () => {
      console.log(`🚀 Kelp Global CSV-to-JSON Converter API running on port ${PORT}`);
      console.log(`🗄️  Using Supabase database`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📤 Upload endpoint: http://localhost:${PORT}/upload`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await db.closeConnection();
    console.log('✅ Supabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

startServer();