
/**
 * QUALITY EVALUATOR PRO - BACKEND SERVER
 * Technology Stack: Node.js, Express, MySQL
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database configuration - Update these with your real MySQL credentials
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qc_evaluator'
};

let pool;

async function initDB() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('Connected to MySQL Database successfully');
    
    // Create tables if they don't exist
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

    // Check for existing columns to support schema evolution
    const [columns] = await pool.query('SHOW COLUMNS FROM users');
    const hasEmail = columns.some(c => c.Field === 'email');
    const hasPassword = columns.some(c => c.Field === 'password');
    const hasPhone = columns.some(c => c.Field === 'phoneNumber');
    const hasGender = columns.some(c => c.Field === 'gender');
    
    if (!hasEmail) await pool.query('ALTER TABLE users ADD COLUMN email VARCHAR(150)');
    if (!hasPassword) await pool.query('ALTER TABLE users ADD COLUMN password VARCHAR(100) DEFAULT "123456"');
    if (!hasPhone) await pool.query('ALTER TABLE users ADD COLUMN phoneNumber VARCHAR(20)');
    if (!hasGender) await pool.query('ALTER TABLE users ADD COLUMN gender VARCHAR(20)');

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
        samples JSON,
        createdAt BIGINT
      )
    `);
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

// Simulated Email Sender
async function sendQCReportEmail(record) {
  try {
    const [users] = await pool.query('SELECT email FROM users WHERE name = ?', [record.agentName]);
    const agentEmail = users[0]?.email || 'agent@gmail.com';
    const score = record.isRework ? record.reworkScore : record.score;

    console.log(`
------------------------------------------------------------
[SIMULATED EMAIL SYSTEM]
SENDER: Portal Owner (System)
RECEIVER: ${record.agentName}
DESTINATION: ${agentEmail}
SUBJECT: Your QC Evaluation Report - ${record.date}

MESSAGE CONTENT:
Dear ${record.agentName},
Your QC evaluation report for QC Evaluation on ${record.date} is ready.

AVERAGE QC SCORE: ${score}%
TOTAL RECORDS: 1

SCORE DETAILS:
Date: ${record.date} | Slot: ${record.timeSlot} | Project: ${record.projectName} | Score: ${score}%

QC Checker: ${record.qcCheckerName}

Note: This is an automated report sent from the Quality Evaluator Portal.
------------------------------------------------------------
    `);
    return true;
  } catch (e) {
    console.error('Email simulation failed:', e);
    return false;
  }
}

// Health Check
app.get('/api/health', (req, res) => res.sendStatus(200));

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
      date: r.date.toISOString().split('T')[0],
      samples: JSON.parse(r.samples || '[]')
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
      (id, date, timeSlot, tlName, agentName, qcCheckerName, projectName, taskName, score, reworkScore, isRework, notes, noWork, manualQC, samples, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      date=?, timeSlot=?, tlName=?, agentName=?, qcCheckerName=?, projectName=?, taskName=?, score=?, reworkScore=?, isRework=?, notes=?, noWork=?, manualQC=?, samples=?`,
      [
        r.id, r.date, r.timeSlot, r.tlName, r.agentName, r.qcCheckerName, r.projectName, r.taskName, r.score, r.reworkScore, r.isRework, r.notes, r.noWork, r.manualQC, JSON.stringify(r.samples), r.createdAt,
        r.date, r.timeSlot, r.tlName, r.agentName, r.qcCheckerName, r.projectName, r.taskName, r.score, r.reworkScore, r.isRework, r.notes, r.noWork, r.manualQC, JSON.stringify(r.samples)
      ]
    );
    
    // Send email notification to agent
    await sendQCReportEmail(r);
    
    res.sendStatus(200);
  } catch (err) {
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
  app.listen(PORT, () => console.log(`QC Backend running on port ${PORT}`));
});
