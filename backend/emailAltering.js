// const mysql = require('mysql2');

// // Create a connection to the MySQL database
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'sub_app',
//   password: 'ea1785ea',
//   database: 'sub_emails'
// });

// // Connect to the database
// connection.connect(err => {
//   if (err) {
//     console.error('Error connecting: ' + err.stack);
//     return;
//   }
//   console.log('Connected to the database.');

//   const query = `
//     ALTER TABLE sub_emails
//     MODIFY COLUMN id INT NOT NULL,
//     DROP PRIMARY KEY,
//     ADD PRIMARY KEY (email);
//   `;
  
//   connection.query(query, (err, results) => {
//     if (err) {
//       console.error('Error altering table: ' + err.stack);
//     } else {
//       console.log('Table altered successfully.');
//     }
//     connection.end();
//   });
// });
