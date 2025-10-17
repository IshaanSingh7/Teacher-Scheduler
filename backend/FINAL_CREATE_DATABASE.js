// setupDatabase.js
require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'sub_app',
    password: process.env.DATABASE_PASSWORD || 'ea1785ea',
    database: process.env.DATABASE_NAME || 'scheduling_app',
  });

  try {
    console.log('Connected to database.');

    // === USERS TABLE ===
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(20),
        departments TEXT NOT NULL,
        phone_number VARCHAR(20),
        UNIQUE KEY unique_email (email)
      )
    `);
    console.log('✅ Created users table.');

    // --- Default user data ---
    await connection.execute(`
      INSERT INTO users (first_name, last_name, email, role, departments, phone_number)
      VALUES
        ('John', 'Doe', 'singi26+1@episcopalacademy.org', 'teacher', 'Upper School, Math', ''),
        ('Jane', 'Smith', 'singi26+2@episcopalacademy.org', 'teacher', 'Upper School, English', ''),
        ('Mike', 'Johnson', 'singi26+3@episcopalacademy.org', 'teacher', 'Middle School, Science', ''),
        ('Sarah', 'Williams', 'singi26+4@episcopalacademy.org', 'teacher', 'Lower School, Art', ''),
        ('Ishaan', 'Singh', 'ishaansingh779@gmail.com', 'substitute', 'All Divisions, Other', ''),
        ('Admin', '', 'EAAdminea', 'admin', 'Administration, Other', '')
      ON DUPLICATE KEY UPDATE email = email
    `);
    console.log('✅ Inserted default users.');

    // === REQUESTS TABLE ===
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT,
        blocks_requested VARCHAR(255),
        subject VARCHAR(100),
        room VARCHAR(50),
        day VARCHAR(20),
        notes TEXT,
        sent TEXT,
        status ENUM('uncompleted', 'completed') NOT NULL DEFAULT 'uncompleted',
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created requests table.');

    // === REQUEST_ASSIGNMENTS TABLE ===
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS request_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        block VARCHAR(255) NOT NULL,
        sub_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
        FOREIGN KEY (sub_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_assignment (request_id, block)
      )
    `);
    console.log('✅ Created request_assignments table.');

  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
  } finally {
    await connection.end();
    console.log('🔒 Database connection closed.');
  }
}

setupDatabase();
