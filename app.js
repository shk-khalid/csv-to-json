require('dotenv').config();
const express = require('express');
const uploadRoutes = require('./routes/upload');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// file upload routes
app.use('/upload', uploadRoutes);

// quick health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CSV-to-JSON Converter API is operational',
    timestamp: new Date().toISOString()
  });
});

// basic API info
app.get('/', (req, res) => {
  res.json({
    name: 'CSV-to-JSON Converter',
    version: '1.0.0',
    endpoints: {
      'POST /upload': {
        description: 'Upload and process CSV file',
        field: 'csvFile',
        maxSize: '10MB',
        accepts: '.csv'
      },
      'GET /health': {
        description: 'Service health check'
      }
    },
    example: 'curl -X POST -F "csvFile=@data.csv" http://localhost:' + PORT + '/upload'
  });
});

// error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred'
  });
});

// catch-all for nonexistent routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint does not exist'
  });
});

async function startServer() {
  try {
    await db.testConnection();
    console.log('Connected to Supabase database');
    await db.createUsersTable();
    console.log('Ensured users table exists');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      console.log(`Upload endpoint at http://localhost:${PORT}/upload`);
    });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

// graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  try {
    await db.closeConnection();
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Shutdown error:', err.message);
    process.exit(1);
  }
});

startServer();
