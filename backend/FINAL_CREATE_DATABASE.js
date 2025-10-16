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

    // --- Create users table ---
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        role VARCHAR(20)
      )
    `);
    console.log('Created users table.');

    // --- Insert default users ---
    await connection.execute(`
      INSERT INTO users (first_name, last_name, email, role)
      VALUES
        ('John', 'Doe', 'singi26+1@episcopalacademy.org', 'teacher'),
        ('Jane', 'Smith', 'singi26+2@episcopalacademy.org', 'teacher'),
        ('Mike', 'Johnson', 'singi26+3@episcopalacademy.org', 'teacher'),
        ('Sarah', 'Williams', 'singi26+4@episcopalacademy.org', 'teacher'),
        ('Ishaan', 'Singh', 'ishaansingh779@gmail.com', 'substitute'),
        ('Admin', '', 'EAAdminea', 'admin')
      ON DUPLICATE KEY UPDATE email=email
    `);
    console.log('Inserted default users.');

    // --- Create requests table ---
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT,
        blocks_requested VARCHAR(255),
        subject VARCHAR(100),
        room VARCHAR(50),
        day VARCHAR(20),
        subs VARCHAR(255),
        notes TEXT,
        sent TEXT,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        status ENUM('uncompleted', 'completed') NOT NULL DEFAULT 'uncompleted'
      )
    `);
    console.log('Created requests table.');

    // --- Create request_assignments table ---
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
    console.log('Created request_assignments table.');

    // --- Drop old "subs" column if it exists ---
    const [columns] = await connection.execute('SHOW COLUMNS FROM requests LIKE "subs"');
    if (columns.length > 0) {
      await connection.execute('ALTER TABLE requests DROP COLUMN subs');
      console.log('Dropped subs column from requests table.');
    } else {
      console.log('subs column does not exist, skipping drop.');
    }

  } catch (err) {
    console.error('Error setting up database:', err.message);
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

setupDatabase();
