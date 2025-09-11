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


const insertUsersQuery = `
  INSERT INTO users (first_name, last_name, email, role, departments)
  VALUES
    ('Liam', 'Turner', 'ishaansingh77+1@gmail.com', 'substitute', 'Upper School, Science'),
    ('Emma', 'Brooks', 'ishaansingh779+2@gmail.com', 'substitute', 'Upper School, Math'),
    ('Noah', 'Miller', 'ishaansingh779+3@gmail.com', 'substitute', 'Upper School, History'),
    ('Olivia', 'Reed', 'ishaansingh779+4@gmail.com', 'substitute', 'Upper School, English'),
    ('Mason', 'Clark', 'ishaansingh779+5@gmail.com', 'substitute', 'Upper School, Classics');
`;

connection.query(insertUsersQuery, (err, results) => {
  if (err) {
    console.error('Error inserting users: ' + err.stack);
    return;
  }
  console.log('Users inserted successfully.');
});



connection.end();