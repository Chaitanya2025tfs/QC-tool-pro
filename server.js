
/**
 * QUALITY EVALUATOR PRO - BACKEND SERVER
 * Technology Stack: Node.js, Express, MySQL
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// Enhanced CORS for production
const allowedOrigins = [
  'http://localhost:5173', // Vite default
  'http://localhost:3000',
  process.env.FRONTEND_URL // Your live frontend URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json({ limit: '50mb' }));

// Database configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qc_evaluator',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

let pool;

async function initDB() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log(`--- SYSTEM STATUS: Connected to MySQL Database at ${dbConfig.host} ---`);
    
    // Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        project VARCHAR(100),
        email VARCHAR(150),
        password VARCHAR(100),
        phoneNumber VARCHAR(20),
        gender VARCHAR(20)
      )
    `);

    // Create Records Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        timeSlot VARCHAR(10) NOT NULL,
        tlName VARCHAR(100),
        agentName VARCHAR(100),
        qcCheckerName VARCHAR(100),
        projectName VARCHAR(100),
        taskName TEXT,
        score FLOAT,
        reworkScore FLOAT,
        isRework BOOLEAN,
        notes TEXT,
        noWork BOOLEAN,
        manualQC BOOLEAN,
        manualErrors JSON,
        manualFeedback TEXT,
        samples JSON,
        samplingRange JSON,
        createdAt BIGINT
      )
    `);

    console.log('--- SCHEMA STATUS: Database tables verified and ready ---');
  } catch (err) {
    console.error('CRITICAL ERROR: Database initialization failed:', err.message);
    console.log('--- FAILOVER: System will continue but database features may be unavailable ---');
  }
}

// Health Check API
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'connected', provider: 'MySQL', environment: process.env.NODE_ENV || 'development' });
  } catch (e) {
    res.status(500).json({ status: 'disconnected', provider: 'Fallback Mode' });
  }
});

// --- USER ROUTES ---
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { id, name, role, project, email, password, phoneNumber, gender } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (id, name, role, project, email, password, phoneNumber, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, role=?, project=?, email=?, password=?, phoneNumber=?, gender=?',
      [id, name, role, project, email, password, phoneNumber, gender, name, role, project, email, password, phoneNumber, gender]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RECORD ROUTES ---
app.get('/api/records', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM records ORDER BY createdAt DESC');
    const formatted = rows.map(r => ({
      ...r,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      samples: typeof r.samples === 'string' ? JSON.parse(r.samples) : (r.samples || []),
      manualErrors: typeof r.manualErrors === 'string' ? JSON.parse(r.manualErrors) : (r.manualErrors || []),
      samplingRange: typeof r.samplingRange === 'string' ? JSON.parse(r.samplingRange) : (r.samplingRange || {})
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', async (req, res) => {
  const r = req.body;
  try {
    await pool.query(
      `INSERT INTO records 
      (id, date, timeSlot, tlName, agentName, qcCheckerName, projectName, taskName, score, reworkScore, isRework, notes, noWork, manualQC, manualErrors, manualFeedback, samples, samplingRange, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      date=?, timeSlot=?, tlName=?, agentName=?, qcCheckerName=?, projectName=?, taskName=?, score=?, reworkScore=?, isRework=?, notes=?, noWork=?, manualQC=?, manualErrors=?, manualFeedback=?, samples=?, samplingRange=?`,
      [
        r.id, r.date, r.timeSlot, r.tlName, r.agentName, r.qcCheckerName, r.projectName, r.taskName, r.score, r.reworkScore, r.isRework, r.notes, r.noWork, r.manualQC, JSON.stringify(r.manualErrors || []), r.manualFeedback, JSON.stringify(r.samples || []), JSON.stringify(r.samplingRange || {}), r.createdAt,
        r.date, r.timeSlot, r.tlName, r.agentName, r.qcCheckerName, r.projectName, r.taskName, r.score, r.reworkScore, r.isRework, r.notes, r.noWork, r.manualQC, JSON.stringify(r.manualErrors || []), r.manualFeedback, JSON.stringify(r.samples || []), JSON.stringify(r.samplingRange || {})
      ]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('[STORAGE ERROR] Failed to save record:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM records WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`QC Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
