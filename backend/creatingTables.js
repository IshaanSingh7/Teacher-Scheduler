const mysql = require('mysql2');

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost', // Replace with your host
  user: 'sub_app',      // Replace with your MySQL username
  password: 'ea1785ea',      // Replace with your MySQL password
  database: 'scheduling_app'   // Replace with your database name
});

// Connect to the database
connection.connect(err => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// Create 'users' table with the required columns
const createUsersTableQuery = `
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20)
  );
`;

connection.query(createUsersTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating table: ' + err.stack);
    return;
  }
  console.log('Table created successfully.');
});

// Insert users with specific emails and roles
const insertUsersQuery = `
  INSERT INTO users (first_name, last_name, email, role)
  VALUES
    ('John', 'Doe', 'singi26+1@episcopalacademy.org', 'teacher'),
    ('Jane', 'Smith', 'singi26+2@episcopalacademy.org', 'teacher'),
    ('Mike', 'Johnson', 'singi26+3@episcopalacademy.org', 'teacher'),
    ('Sarah', 'Williams', 'singi26+4@episcopalacademy.org', 'teacher'),
    ('Ishaan', 'Singh', 'ishaansingh779@gmail.com', 'substitute'),
    ('Admin', '', 'EAAdminea', 'admin');
`;

connection.query(insertUsersQuery, (err, results) => {
  if (err) {
    console.error('Error inserting users: ' + err.stack);
    return;
  }
  console.log('Users inserted successfully.');
});

const createRequestTableQuery = `
  CREATE TABLE requests (
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
  );
`;

connection.query(createRequestTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating request table: ' + err.stack);
    return;
  }
  console.log('Request table created successfully.');
});

connection.end();