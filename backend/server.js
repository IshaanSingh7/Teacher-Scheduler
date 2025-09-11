// require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// const express = require('express');
// const nodemailer = require('nodemailer');
// const mysql = require('mysql2');
// const cors = require('cors');
// const jwt = require('jsonwebtoken');

// console.log('Dotenv parsed:', process.env);
// console.log('Environment variables:', {
//   JWT_SECRET: !!process.env.JWT_SECRET,
//   JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
// });

// const app = express();
// const port = 3001;
// app.use(express.json());
// app.use(cors());

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'sub_app',
//   password: 'ea1785ea',
//   database: 'scheduling_app',
// });

// // confirmation for connecting to MySQL database
// connection.connect((err) => {
//   if (err) {
//     console.error('Database connection error:', err);
//     return;
//   }
//   console.log('Connected to the MySQL database.');
// });

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'ishaansingh779@gmail.com',
//     pass: 'qnwn vide olym vymq', // Use your email password or app password
//   },
// });
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('Error configuring transporter:', error);
//   } else {
//     console.log('Transporter configured and ready to send emails.');
//   }
// });



// app.get('/teacher-requests', (req, res) => {
//   const { teacherId } = req.query;

//   if (!teacherId) {
//     return res.status(400).json({ error: 'Teacher ID is required' });
//   }

//   const requestQuery = `
//     SELECT r.id, r.day, r.room, r.subject, r.blocks_requested, r.notes, r.subs,
//            r.status, u.first_name AS sub_first_name, u.last_name AS sub_last_name
//     FROM requests r
//     LEFT JOIN Users u ON r.subs = u.email
//     WHERE r.teacher_id = ?
//     ORDER BY r.day DESC
//   `;

//   connection.query(requestQuery, [teacherId], (err, results) => {
//     if (err) {
//       console.error('Error getting teacher requests:', err);
//       return res.status(500).json({ error: 'Database query error' });
//     }

//     const formattedResults = results.map(row => ({
//       id: row.id,
//       day: row.day,
//       room: row.room,
//       subject: row.subject,
//       blocks_requested: row.blocks_requested,
//       notes: row.notes,
//       subs: row.subs,
//       sub_first_name: row.sub_first_name,
//       sub_last_name: row.sub_last_name,
//       status: row.status
//     }));

//     res.status(200).json(formattedResults); // Return empty array if no results
//   });
// });


// app.get('/accepted-requests', (req, res) => {
//   const { email } = req.query;
//   console.log(email);

//   if (!email) {
//     return res.status(400).json({ error: 'Sub email is required' });
//   }

//   const requestQuery = `
//     SELECT r.id, u.email AS teacher_email, u.first_name, u.last_name, 
//            r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, r.status
//     FROM requests r
//     JOIN Users u ON r.teacher_id = u.id
//     WHERE r.subs = ? AND r.status != 'completed'
//     ORDER BY r.day DESC
//   `;

//   connection.query(requestQuery, [email], (err, results) => {
//     if (err) {
//       console.error('Error getting requests with sub email:', err);
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     if (results.length === 0) {
//       console.log('No requests with sub email');
//       return res.status(200).json([]);
//     }

//     const formattedResults = results.map(row => ({
//       id: row.id,
//       teacher_email: row.teacher_email,
//       teacher_first_name: row.first_name,
//       teacher_last_name: row.last_name,
//       blocks_requested: row.blocks_requested,
//       subject: row.subject,
//       room: row.room,
//       day: row.day,
//       subs: row.subs,
//       notes: row.notes,
//       status: row.status
//     }));

//     res.status(200).json(formattedResults);
//   });
// });

// app.get('/getting-requests', (req, res) => {
//   const { teacherId } = req.query;  // Use 'id' as the query parameter
//   console.log("Teacher ID received:", teacherId);

//   if (!teacherId) {
//     return res.status(400).json({ error: 'Teacher id is required' });
//   }

//   const requestQuery = `
//     SELECT r.id, r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, r.sent
//     FROM requests r
//     WHERE r.teacher_id = ?
//   `;

//   connection.query(requestQuery, [teacherId], (err, results) => {
//     if (err) {
//       console.error('Error getting requests with teacher ID', err);
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     if (results.length === 0) {
//       console.log('No requests found for teacher ID:', teacherId);
//       return res.status(404).json({ error: 'No requests found for this teacher ID' });
//     }

//     // Format the results as a JSON array of dictionaries
//     const formattedResults = results.map(row => ({
//       id: row.id,
//       blocks_requested: row.blocks_requested,
//       subject: row.subject,
//       room: row.room,
//       day: row.day,
//       subs: row.subs,
//       notes: row.notes,
//       sent: row.sent
//     }));

//     // Return the formatted results
//     res.status(200).json(formattedResults); // Return JSON formatted data
//   });
// });


// app.get('/open-or-taken', (req, res) => {
//   const { requestId } = req.query;

//   if (!requestId) {
//     return res.status(400).json({ error: 'Request ID is required' });
//   }

//   // Modify the query to join the Users table to get teacher's name
//   const selectRequestQuery = `
//     SELECT r.id, r.teacher_id, r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, u.first_name, u.last_name
//     FROM requests r
//     LEFT JOIN Users u ON r.teacher_id = u.id
//     WHERE r.id = ?
//   `;

//   connection.query(selectRequestQuery, [requestId], (err, results) => {
//     if (err) {
//       console.error('Error querying request by ID:', err); // Log query error
//       return res.status(500).json({ error: 'Database query error' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Request not found' });
//     }

//     // Access the first (and only) result, since requestId is unique
//     const row = results[0];
//     console.log('Specific Request:', row);

//     // Check availability based on subs field
//     const available = !row.subs || (row.subs && row.subs.trim() === '');
//     row.available = available;

//     // Return the response with teacher name (first_name, last_name) included
//     return res.status(200).json({
//       ...row,
//       teacher_name: `${row.first_name} ${row.last_name}` // Combine first_name and last_name
//     });
//   });
// });

// app.post('/verify-token', (req, res) => {
//   // Extract token from the 'Authorization' header
//   const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

//   // If no token provided, return an error
//   if (!token) {
//     return res.status(401).json({ error: 'No token provided' });
//   }

//   // Verify the token using the secret key and expiration time
//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       // If the token is invalid or expired, return an error
//       return res.status(401).json({ error: 'Invalid or expired token' });
//     }

//     // Token is valid, send the decoded user data (this contains user info encoded in the token)
//     return res.json({
//       user: {
//         id: decoded.id,   // User ID from the decoded token
//         role: decoded.role, // User role from the decoded token
//         email: decoded.email, // User email from the decoded token
//       },
//     });
//   });
// });

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
//     console.error('Missing JWT_SECRET or JWT_EXPIRES_IN');
//     return res.status(500).json({ error: 'Server configuration error' });
//   }

//   const query = 'SELECT * FROM Users WHERE email = ?';
//   connection.query(query, [email], (err, results) => {
//     if (err) {
//       console.error('Database error:', err.message);
//       return res.status(500).json({ error: 'Database error' });
//     }
//     if (results.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const user = results[0];
//     if (password !== 'ea1785ea') {
//       return res.status(401).json({ error: 'Invalid password' });
//     }

//     const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });

//     console.log('Login success for:', email);
//     res.json({
//       token,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         first_name: user.first_name,
//         last_name: user.last_name,
//       },
//     });
//   });
// });

// app.post('/verify-token', (req, res) => {
//   const token = req.headers['authorization']?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ error: 'No token provided' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).json({ error: 'Invalid or expired token' });
//     }
//     return res.json({
//       user: {
//         id: decoded.id,
//         role: decoded.role,
//         email: decoded.email,
//       },
//     });
//   });
// });

// app.post('/assign-substitute', (req, res) => {
//   const { token, password, requestId } = req.body;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const email = decoded.email;

//     if (!email || decoded.requestId !== parseInt(requestId)) {
//       return res.status(400).json({ error: 'Invalid or mismatched token' });
//     }

//     const checkEmailQuery = 'SELECT * FROM Users WHERE email = ?';
//     connection.query(checkEmailQuery, [email], (err, results) => {
//       if (err) {
//         return res.status(500).json({ error: 'Database query error' });
//       }

//       if (results.length === 0 || password !== 'ea1785ea') {
//         return res.status(400).json({ error: 'Invalid credentials' });
//       }
//       if (results[0].role === 'teacher') {
//         return res.status(400).json({ error: "You're a teacher!" });
//       }

//       const checkRequestQuery = 'SELECT * FROM requests WHERE id = ?';
//       connection.query(checkRequestQuery, [requestId], (err, requestResults) => {
//         if (err) {
//           return res.status(500).json({ error: 'Error querying the requests table' });
//         }

//         if (requestResults.length === 0) {
//           return res.status(404).json({ error: 'Request not found' });
//         }

//         const request = requestResults[0];

//         if (request.subs === null || request.subs.trim() === '') {
//           const updateRequestQuery = 'UPDATE requests SET subs = ? WHERE id = ?';
//           connection.query(updateRequestQuery, [email, requestId], (err, updateResults) => {
//             if (err) {
//               return res.status(500).json({ error: 'Error updating the request table' });
//             }
//             return res.status(200).json({ message: 'Substitute added successfully', email, added: true });
//           });
//         } else {
//           return res.status(409).json({ message: 'This request has already been taken by another substitute', added: false });
//         }
//       });
//     });
//   } catch (err) {
//     console.error('JWT verification error:', err);
//     return res.status(400).json({ error: 'Invalid token' });
//   }
// });

// app.post('/send-substitute-email', (req, res) => {
//   transporter.verify((error, success) => {
//     if (error) {
//       console.error('Error configuring transporter:', error);
//       return res.status(500).json({ error: 'Email transporter configuration failed' });
//     }

//     const {
//       teacherEmail,
//       date,
//       room,
//       blocks = '',
//       notes = '',
//       teacherId,
//       selectedSubs,
//     } = req.body;

//     if (!teacherEmail || !date || !room || !teacherId) {
//       return res.status(400).json({
//         error: 'Missing required fields: teacherEmail, date, room, teacherId',
//       });
//     }

//     if (!Array.isArray(selectedSubs)) {
//       return res.status(400).json({ error: 'selectedSubs must be an array' });
//     }

//     const teacherNameQuery = 'SELECT first_name, last_name FROM Users WHERE id = ?';
//     connection.query(teacherNameQuery, [teacherId], (err, teacherResults) => {
//       if (err) {
//         console.error('Error fetching teacher:', err);
//         return res.status(500).json({ error: 'Database error fetching teacher' });
//       }
//       if (!teacherResults.length) {
//         return res.status(404).json({ error: 'Teacher not found' });
//       }

//       const { first_name: firstName, last_name: lastName } = teacherResults[0];

//       sendEmails(selectedSubs);

//       function sendEmails(emailRecipients) {
//         const subEmailsString = emailRecipients.map(item => item.email).join(',') || null;

//         const insertRequestQuery = `
//           INSERT INTO requests (teacher_id, blocks_requested, room, day, notes, sent)
//           VALUES (?, ?, ?, ?, ?, ?)
//         `;
//         const insertValues = [
//           teacherId,
//           blocks,
//           room,
//           date,
//           notes,
//           subEmailsString,
//         ];

//         connection.query(insertRequestQuery, insertValues, (err, insertResult) => {
//           if (err) {
//             console.error('Error inserting request:', err);
//             return res.status(500).json({ error: 'Database error inserting request' });
//           }

//           const requestId = insertResult.insertId;

//           if (emailRecipients.length > 0) {
//             const emailPromises = emailRecipients.map((sub) => {
//               const acceptToken = jwt.sign({ email: sub.email, requestId }, process.env.JWT_SECRET, { expiresIn: '1y' });

//               const link = `http://localhost:3000/LinkLogin?token=${acceptToken}&requestId=${requestId}`;
//               const emailSubject = `Substitute Request for ${firstName} ${lastName}`;
//               const emailBody = `
//                 <h2>Substitute Request</h2>
//                 <p>Teacher: ${firstName} ${lastName}</p>
//                 <p>Date: ${date}</p>
//                 <p>Room: ${room}</p>
//                 <p>Blocks: ${blocks || 'Not specified'}</p>
//                 <p>Extra Notes: ${notes || 'None'}</p>
//                 <p><a href="${link}">Click here to sign up for this request!</a></p>
//               `;

//               return new Promise((resolve, reject) => {
//                 transporter.sendMail({
//                   from: process.env.EMAIL_USER || 'ishaansingh779@gmail.com',
//                   to: sub.email,
//                   subject: emailSubject,
//                   html: emailBody,
//                 }, (err, info) => {
//                   if (err) reject(err);
//                   resolve(info);
//                 });
//               });
//             });

//             Promise.all(emailPromises)
//               .then(() => {
//                 finalizeRequest();
//               })
//               .catch((error) => {
//                 console.error('Error sending emails:', error);
//                 res.status(500).json({ error: 'Error sending emails' });
//               });
//           } else {
//             finalizeRequest();
//           }

//           function finalizeRequest() {
//             const updateRequestQuery = `
//               UPDATE requests
//               SET sent = ?
//               WHERE id = ?
//             `;
//             connection.query(updateRequestQuery, [subEmailsString, requestId], (err, updateResult) => {
//               if (err) {
//                 console.error('Error updating request:', err);
//                 return res.status(500).json({ error: 'Database error updating request' });
//               }
//               res.json({ message: 'Request processed successfully'});
//             });
//           }
//         });
//       }
//     });
//   });
// });

// app.get('/get-subject-emails', (req, res) => {
//   const { subject } = req.query;  // Access the subject as a string

//   if (!subject) {
//     return res.status(400).json({ error: 'Subject is required' });
//   }

//   let query;
//   let queryParams;

//   if (subject !== 'Other') {
//     query = `
//       SELECT first_name, last_name, email 
//       FROM Users 
//       WHERE specialty = ? AND role = 'substitute'
//     `;
//     queryParams = [subject];
//   } else {
//     query = `
//       SELECT first_name, last_name, email 
//       FROM Users 
//       WHERE role = 'substitute'
//     `;
//     queryParams = [];
//   }

//   connection.query(query, queryParams, (err, results) => {
//     if (err) {
//       console.error('Error executing query:', err);
//       return res.status(500).json({ error: 'Database query failed' });
//     }

//     if (results.length === 0) {
//       query = `
//       SELECT first_name, last_name, email 
//       FROM Users 
//       WHERE role = 'substitute'
//     `;
//       queryParams = [];
//       connection.query(query, queryParams, (err, results) => {
//         if (err) {
//           console.error('Error executing query:', err);
//           return res.status(500).json({ error: 'Database query failed' });
//         }
//         return res.json(results);
//       });
//     } else {

//       return res.json(results);
//     }
//   });
// });


// // handling substitute login
// app.post('/assign-substitute', (req, res) => {
//   const { token, password, requestId } = req.body;

//   // Step 1: Verify JWT token
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const email = decoded.email;

//     if (!email || decoded.requestId !== parseInt(requestId)) {
//       return res.status(400).json({ error: 'Invalid or mismatched token' });
//     }

//     // Step 2: Check if the email exists in the Users table
//     const checkEmailQuery = 'SELECT * FROM Users WHERE email = ?';
//     connection.query(checkEmailQuery, [email], (err, results) => {
//       if (err) {
//         return res.status(500).json({ error: 'Database query error' });
//       }

//       if (results.length === 0 || password !== 'ea1785ea') {
//         return res.status(400).json({ error: 'Invalid credentials' });
//       }
//       if (results[0].role === 'teacher') {
//         return res.status(400).json({ error: "You're a teacher!" });
//       }

//       // Step 3: Check if the request exists
//       const checkRequestQuery = 'SELECT * FROM requests WHERE id = ?';
//       connection.query(checkRequestQuery, [requestId], (err, requestResults) => {
//         if (err) {
//           return res.status(500).json({ error: 'Error querying the requests table' });
//         }

//         if (requestResults.length === 0) {
//           return res.status(404).json({ error: 'Request not found' });
//         }

//         const request = requestResults[0];

//         // Step 4: Check if the subs column is null
//         if (request.subs === null || request.subs.trim() === '') {
//           // Step 5: Assign substitute email
//           const updateRequestQuery = 'UPDATE requests SET subs = ? WHERE id = ?';
//           connection.query(updateRequestQuery, [email, requestId], (err, updateResults) => {
//             if (err) {
//               return res.status(500).json({ error: 'Error updating the request table' });
//             }
//             return res.status(200).json({ message: 'Substitute added successfully', email, added: true });
//           });
//         } else {
//           return res.status(409).json({ message: 'This request has already been taken by another substitute', added: false });
//         }
//       });
//     });
//   } catch (err) {
//     console.error('JWT verification error:', err);
//     return res.status(400).json({ error: 'Invalid token' });
//   }
// });



// app.delete('/requests/:requestId', (req, res) => {
//   const { requestId } = req.params;

//   if (!requestId) {
//     return res.status(400).json({ error: 'RequestId is required.' });
//   }

//   // SQL query to get all data from the request
//   const selectQuery = 'SELECT * FROM requests WHERE id = ?';

//   connection.query(selectQuery, [requestId], (err, results) => {
//     if (err) {
//       console.error('Error fetching request data:', err.message);
//       return res.status(500).json({ error: 'An error occurred while fetching the request data.' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Request not found.' });
//     }

//     const requestData = results[0];
//     const sentColumn = requestData.sent;
//     const emailAddresses = sentColumn.split(',').map(email => email.trim());

//     // SQL query to get the teacher's email from Users table
//     const selectUserQuery = 'SELECT * FROM Users WHERE id = ?';

//     connection.query(selectUserQuery, [requestData.teacher_id], (err, userResults) => {
//       if (err) {
//         console.error('Error fetching user data:', err.message);
//         return res.status(500).json({ error: 'An error occurred while fetching the user data.' });
//       }

//       if (userResults.length === 0) {
//         return res.status(404).json({ error: 'User not found.' });
//       }

//       const teacherEmail = userResults[0].email;
//       const teacherName = userResults[0].first_name; + ' ' + userResults[0].last_name;

//       const mailOptions = {
//         from: 'ishaansingh779@gmail.com',
//         to: emailAddresses,
      
//         subject: 'Request Deleted Notification',
//         html: `
//   <div style="color: red;">
//     <p>The request by <strong>${teacherName}</strong> has been deleted. Here are the details:</p>
//     <table border="1" style="border-collapse: collapse; width: 100%;">
//       <tr>
//         <th>Blocks Requested</th>
//         <th>Subject</th>
//         <th>Room</th>
//         <th>Day</th>
//         <th>Notes</th>
//       </tr>
//       <tr>
//         <td>${requestData.blocks_requested}</td>
//         <td>${requestData.subject}</td>
//         <td>${requestData.room}</td>
//         <td>${requestData.day}</td>
//         <td>${requestData.notes}</td>
//       </tr>
//     </table>
//   </div>
// `
//       };

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.error('Error sending email:', error);
//           return res.status(500).json({ error: 'An error occurred while sending the notification email.' });
//         }

//         console.log('Email sent:', info.response);

//         // SQL query to delete the row with the given primary key
//         const deleteQuery = 'DELETE FROM requests WHERE id = ?';

//         connection.query(deleteQuery, [requestId], (err, result) => {
//           if (err) {
//             console.error('Error deleting request:', err.message);
//             return res.status(500).json({ error: 'An error occurred while deleting the request.' });
//           }

//           if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Request not found.' });
//           }

//           res.status(200).json({ message: 'Request successfully deleted and notification email sent.' });
//         });
//       });
//     });
//   });
// });

// // app.patch('/requests/:id/cancel', (req, res) => {
// //   const { requestId } = req.params; // Get the request ID from the URL

// //   // SQL query to update the subs column to null
// //   const updateQuery = 'UPDATE requests SET subs = NULL WHERE id = ?';

// //   connection.query(updateQuery, [requestId], (err, result) => {
// //     if (err) {
// //       console.error('Error updating request:', err.message);
// //       return res.status(500).json({ error: 'An error occurred while updating the request.' });
// //     }

// //     if (result.affectedRows === 0) {
// //       return res.status(404).json({ error: 'Request not found.' });
// //     }


// //     res.status(200).json({ message: 'Request successfully updated.' });
// //   });
// // });

// app.patch('/requests/:requestId/cancel', async (req, res) => {
//   const { requestId } = req.params;
//   const { teacherId } = req.body;

//   if (!teacherId) {
//     return res.status(400).json({ error: 'Teacher ID is required' });
//   }

//   // Fetch request details and teacher_id
//   const getRequestQuery = 'SELECT sent, teacher_id, blocks_requested, subject, room, day, notes FROM requests WHERE id = ? AND teacher_id = ?';
//   connection.query(getRequestQuery, [requestId, teacherId], async (err, results) => {
//     if (err) {
//       console.error('Error fetching request:', err.message);
//       return res.status(500).json({ error: 'Database error fetching request' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Request not found or not owned by teacher' });
//     }

//     const requestData = results[0];
//     const sentEmails = requestData.sent ? requestData.sent.split(',').map(e => e.trim()).filter(e => e) : [];

//     // Fetch teacher's name and email
//     const getTeacherQuery = 'SELECT first_name, last_name, email FROM Users WHERE id = ?';
//     connection.query(getTeacherQuery, [requestData.teacher_id], async (err, teacherResults) => {
//       if (err) {
//         console.error('Error fetching teacher:', err.message);
//         return res.status(500).json({ error: 'Database error fetching teacher' });
//       }

//       if (teacherResults.length === 0) {
//         return res.status(404).json({ error: 'Teacher not found' });
//       }

//       const teacherName = `${teacherResults[0].first_name} ${teacherResults[0].last_name}`;

//       // Delete the request
//       const deleteRequestQuery = 'DELETE FROM requests WHERE id = ?';
//       connection.query(deleteRequestQuery, [requestId], async (err, deleteResult) => {
//         if (err) {
//           console.error('Error deleting request:', err.message);
//           return res.status(500).json({ error: 'Database error deleting request' });
//         }

//         if (deleteResult.affectedRows === 0) {
//           return res.status(404).json({ error: 'Request not found' });
//         }

//         // Send emails if there are recipients
//         if (sentEmails.length > 0) {
//           const mailOptions = {
//             from: 'ishaansingh779@gmail.com',
//             to: sentEmails.join(','),
//             subject: 'Substitute Request Cancelled',
//             html: `
//               <div>
//                 <p>The substitute request from <strong>${teacherName}</strong> has been cancelled. Details:</p>
//                 <table border="1" style="border-collapse: collapse; width: 100%; color: green;">
//                   <tr>
//                     <th>Blocks Requested</th>
//                     <th>Subject</th>
//                     <th>Room</th>
//                     <th>Day</th>
//                     <th>Notes</th>
//                   </tr>
//                   <tr>
//                     <td>${requestData.blocks_requested || '-'}</td>
//                     <td>${requestData.subject || '-'}</td>
//                     <td>${requestData.room || '-'}</td>
//                     <td>${requestData.day || '-'}</td>
//                     <td>${requestData.notes || 'None'}</td>
//                   </tr>
//                 </table>
//               </div>
//             `,
//           };

//           try {
//             await transporter.sendMail(mailOptions);
//             return res.status(200).json({ message: 'Request cancelled and emails sent' });
//           } catch (emailError) {
//             console.error('Error sending emails:', emailError.message);
//             return res.status(500).json({ error: 'Failed to send cancellation emails' });
//           }
//         } else {
//           return res.status(200).json({ message: 'Request cancelled' });
//         }
//       });
//     });
//   });
// });


//  // when a sub cancels their assignment
// app.patch('/requests/:requestId/cancel-substitute', async (req, res) => {
//   const { requestId } = req.params;
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: 'Substitute email is required' });
//   }

//   // Fetch request details including subs and sent emails
//   const getRequestQuery = 'SELECT subs, sent, teacher_id, blocks_requested, subject, room, day, notes FROM requests WHERE id = ?';
//   connection.query(getRequestQuery, [requestId], async (err, results) => {
//     if (err) {
//       console.error('Error fetching request:', err.message);
//       return res.status(500).json({ error: 'Database error fetching request' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Request not found' });
//     }

//     const requestData = results[0];
//     if (requestData.subs !== email) {
//       return res.status(403).json({ error: 'Not authorized: Substitute not assigned to this request' });
//     }

//     // Fetch teacher's name and email
//     const getTeacherQuery = 'SELECT first_name, last_name, email FROM Users WHERE id = ?';
//     connection.query(getTeacherQuery, [requestData.teacher_id], async (err, teacherResults) => {
//       if (err) {
//         console.error('Error fetching teacher:', err.message);
//         return res.status(500).json({ error: 'Database error fetching teacher' });
//       }

//       if (teacherResults.length === 0) {
//         return res.status(404).json({ error: 'Teacher not found' });
//       }

//       const teacher = teacherResults[0];
//       const teacherName = `${teacher.first_name} ${teacher.last_name}`;
//       const teacherEmail = teacher.email;

//       // Fetch all substitutes' emails (excluding the cancelling substitute)
//       const getSubsQuery = 'SELECT email FROM Users WHERE role = "substitute" AND email != ?';
//       connection.query(getSubsQuery, [email], async (err, subResults) => {
//         if (err) {
//           console.error('Error fetching substitutes:', err.message);
//           return res.status(500).json({ error: 'Database error fetching substitutes' });
//         }

//         const subEmails = subResults.map(sub => sub.email);
//         const sentEmails = requestData.sent ? requestData.sent.split(',').map(e => e.trim()).filter(e => e && e !== email) : [];

//         // Combine teacher email and other substitute emails
//         const recipients = [teacherEmail, ...subEmails, ...sentEmails].filter((v, i, a) => a.indexOf(v) === i);

//         // Update request to remove substitute assignment
//         const updateRequestQuery = 'UPDATE requests SET subs = NULL WHERE id = ?';
//         connection.query(updateRequestQuery, [requestId], async (err, updateResult) => {
//           if (err) {
//             console.error('Error updating request:', err.message);
//             return res.status(500).json({ error: 'Database error updating request' });
//           }

//           if (updateResult.affectedRows === 0) {
//             return res.status(404).json({ error: 'Request not found' });
//           }

//           // Send email notification
//           if (recipients.length > 0) {
//             const mailOptions = {
//               from: 'ishaansingh779@gmail.com',
//               to: recipients.join(','),
//               subject: 'Substitute Request Now Available',
//               html: `
//                 <div>
//                   <p>The substitute request from <strong>${teacherName}</strong> is now available again due to a cancellation. Details:</p>
//                   <table border="1" style="border-collapse: collapse; width: 100%; color: green;">
//                     <tr>
//                       <th>Blocks Requested</th>
//                       <th>Subject</th>
//                       <th>Room</th>
//                       <th>Day</th>
//                       <th>Notes</th>
//                     </tr>
//                     <tr>
//                       <td>${requestData.blocks_requested || '-'}</td>
//                       <td>${requestData.subject || '-'}</td>
//                       <td>${requestData.room || '-'}</td>
//                       <td>${requestData.day || '-'}</td>
//                       <td>${requestData.notes || 'None'}</td>
//                     </tr>
//                   </table>
//                 </div>
//               `,
//             };

//             try {
//               await transporter.sendMail(mailOptions);
//               return res.status(200).json({ message: 'Substitute assignment cancelled and emails sent' });
//             } catch (emailError) {
//               console.error('Error sending emails:', emailError.message);
//               return res.status(500).json({ error: 'Failed to send cancellation emails' });
//             }
//           } else {
//             return res.status(200).json({ message: 'Substitute assignment cancelled' });
//           }
//         });
//       });
//     });
//   });
// });





// app.get('/get-everything', (req, res) => {
//   const query = `
//     SELECT 
//       requests.*, 
//       Users.first_name, 
//       Users.last_name 
//     FROM requests 
//     JOIN Users ON requests.id = Users.id
//   `;

//   connection.query(query, (err, results) => {
//     if (err) {
//       console.error('Error fetching data:', err);
//       return res.status(500).send('Error fetching data');
//     }
//     res.json(results);
//   });
// });

// app.get('/edit-request/:requestId', (req, res) => {

//   const requestId = req.params.requestId;
//   console.log('Received requestId:', requestId); // Log to confirm route is hit
//   const query = 'SELECT * FROM requests WHERE id = ?';

//   connection.query(query, [requestId], (err, results) => {
//     if (err) {
//       console.log("HERE2");
//       console.error('Error executing query:', err.stack);
//       return res.status(500).send('Internal server error');
//     }

//     if (results.length === 0) {
//       console.log(`Request with ID ${requestId} not found`);
//       return res.json({});  // Send empty object if no data found
//     }
//     console.log("HERE1");
//     console.log("Request data fetched:", results[0]);
//     return res.json(results[0]);  // Send first result
//   });
// });



// app.put('/requests/:id', (req, res) => {
//   const { id } = req.params;
//   const updatedData = req.body;

//   const { teacher_id, blocks_requested, subject, room, day, subs, notes, sent } = updatedData;

//   // SQL query to update the request
//   const query = `
//       UPDATE requests
//       SET 
//           teacher_id = ?,
//           blocks_requested = ?,
//           subject = ?,
//           room = ?,
//           day = ?,
//           subs = ?,
//           notes = ?,
//           sent = ?
//       WHERE id = ?
//   `;

//   // Execute the query with the data values
//   connection.execute(query, [teacher_id, blocks_requested, subject, room, day, subs, notes, sent, id], (err, result) => {
//     if (err) {
//       console.error('Error updating request:', err);
//       return res.status(500).json({ error: 'Internal server error' });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Request not found' });
//     }

//     return res.status(200).json({ message: 'Request updated successfully' });
//   });
// });


// app.get('/get-subs', (req, res) => {
//   const query = 'SELECT * FROM Users WHERE role = ?';
//   const role = 'substitute'; // The role you're fetching from the database

//   connection.query(query, [role], (error, results) => {
//     if (error) {
//       console.error('Error fetching substitutes:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     console.log('Query Results:', results); // Check if query is returning the expected results
//     res.json(results); // Send the query result back as JSON
//   });
// });

// app.get('/get-teacher-ids', (req, res) => {
//   const query = 'SELECT id, first_name, last_name FROM Users WHERE role = ?';
//   const role = 'teacher'; // The role you're fetching from the database

//   connection.query(query, [role], (error, results) => {
//     if (error) {
//       console.error('Error fetching substitutes:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     res.json(results); // Send the query result back as JSON
//   });
// });

// app.get('/get-users', (req, res) => {
//   const query = 'SELECT * FROM Users';

//   connection.query(query, [], (error, results) => {
//     if (error) {
//       console.error('Error fetching substitutes:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     res.json(results); // Send the query result back as JSON
//   });

// });

// app.post('/add-user', (req, res) => {
//   const { first_name, last_name, email, role, departments, phone_number } = req.body;
//   const query = `INSERT INTO Users (email, first_name, last_name, role, departments, phone_number)
//                  VALUES (?, ?, ?, ?, ?, ?)`;

//   connection.query(query, [email, first_name, last_name, role, departments, phone_number], (error, results) => {
//     if (error) {
//       console.error('Database Error:', error);

//       // Check if the error is a duplicate entry for the 'email' key
//       if (error.code === 'ER_DUP_ENTRY') {
//         return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
//       }

//       return res.status(500).json({ error: 'Internal Server Error' });
//     }

//     res.json({ message: 'User added successfully', data: results });
//   });
// });

// app.delete('/delete-user/:id', (req, res) => {
//   const userId = req.params.id;
//   const query = 'DELETE FROM Users WHERE id = ?';

//   connection.query(query, [userId], (error, results) => {
//     if (error) {
//       console.error('Error deleting user:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     if (results.affectedRows === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json({ message: 'User deleted successfully' });
//   });
// });

// app.patch('/update-user/:id', (req, res) => {
//   const { id: userId } = req.params;
//   const { first_name, last_name, email, role, departments, phone_number } = req.body;
//   const query = 'UPDATE Users SET first_name = ?, last_name = ?, email = ?, role = ?, departments = ?, phone_number = ? WHERE id = ?';
//   const values = [first_name, last_name, email, role, departments, phone_number, userId];

//   connection.query(query, values, (error, results) => {
//     if (error) {
//       console.error('Error updating user:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     if (results.affectedRows === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json({ 
//       message: 'User updated successfully', 
//       user: { id: userId, first_name, last_name, email, role, departments, phone_number }
//     });
//   });
// });

// app.get('/check-request', (req, res) => {
//   const { requestId } = req.query;
//   const query = 'SELECT COUNT(*) as count FROM Requests WHERE id = ?';

//   connection.query(query, [requestId], (error, results) => {
//     if (error) {
//       console.error('Error checking request:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     const exists = results[0].count > 0;
//     res.json({ exists });
//   });
// });



// app.patch('/requests/:id/complete', (req, res) => {
//   const { id } = req.params;
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ error: 'Substitute email is required' });
//   }

//   // Verify request exists and is assigned to substitute
//   const selectQuery = `
//     SELECT r.id, r.status, r.subs, r.day, r.blocks_requested, r.room, r.notes,
//            u.email AS teacher_email, u.first_name AS teacher_first_name, u.last_name AS teacher_last_name,
//            sub.first_name AS sub_first_name, sub.last_name AS sub_last_name
//     FROM requests r
//     JOIN Users u ON r.teacher_id = u.id
//     JOIN Users sub ON r.subs = sub.email
//     WHERE r.id = ? AND r.subs = ?
//   `;

//   connection.query(selectQuery, [id, email], (err, results) => {
//     if (err) {
//       console.error('Error querying request:', err);
//       return res.status(500).json({ error: 'Database query error' });
//     }
//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Request not found or not assigned to you' });
//     }

//     const request = results[0];
//     if (request.status === 'completed') {
//       return res.status(400).json({ error: 'Request is already completed' });
//     }

//     // Update request status
//     const updateQuery = `UPDATE requests SET status = 'completed' WHERE id = ?`;
//     connection.query(updateQuery, [id], (err) => {
//       if (err) {
//         console.error('Error updating request status:', err);
//         return res.status(500).json({ error: 'Database update error' });
//       }

//       // Prepare email
//       const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: request.teacher_email,
//         subject: `Substitute Request Completed for ${request.day}`,
//         text: `
// Dear ${request.teacher_first_name} ${request.teacher_last_name},

// The substitute request for ${request.day} has been completed by ${request.sub_first_name} ${request.sub_last_name}.

// Details:
// - Date: ${request.day}
// - Blocks: ${request.blocks_requested}
// - Room: ${request.room}
// - Notes: ${request.notes || 'None'}

// Thank you,
// Substitute Scheduler
//         `,
//       };

//       // Send email
//       transporter.sendMail(mailOptions, (error) => {
//         if (error) {
//           console.error('Error sending email:', error);
//           // Don't fail the request if email fails
//           return res.status(200).json({ message: 'Request marked as completed, but email notification failed' });
//         }
//         res.status(200).json({ message: 'Request marked as completed and email sent' });
//       });
//     });
//   });
// });


// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });
// // CREATE TABLE Users (
// //   id INT NOT NULL AUTO_INCREMENT,
// //   email VARCHAR(255) NOT NULL,
// //   first_name VARCHAR(50),
// //   last_name VARCHAR(50),
// //   role VARCHAR(20),
// //   specialty VARCHAR(100),
// //   phone_number VARCHAR(20),
// //   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// //   PRIMARY KEY (id),
// //   UNIQUE(email)
// // );






require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');

console.log('Dotenv parsed:', process.env);
console.log('Environment variables:', {
  JWT_SECRET: !!process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
});

const app = express();
const port = 3001;
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));
const connection = mysql.createConnection({

  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

// confirmation for connecting to MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ishaansingh779@gmail.com',
    pass: 'qnwn vide olym vymq', // Use your email password or app password
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.error('Error configuring transporter:', error);
  } else {
    console.log('Transporter configured and ready to send emails.');
  }
});



app.get('/teacher-requests', (req, res) => {
  const { teacherId } = req.query;

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher ID is required' });
  }

  const requestQuery = `
    SELECT r.id, r.day, r.room, r.subject, r.blocks_requested, r.notes, r.subs,
           r.status, u.first_name AS sub_first_name, u.last_name AS sub_last_name
    FROM requests r
    LEFT JOIN Users u ON r.subs = u.email
    WHERE r.teacher_id = ?
    ORDER BY r.day DESC
  `;

  connection.query(requestQuery, [teacherId], (err, results) => {
    if (err) {
      console.error('Error getting teacher requests:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    const formattedResults = results.map(row => ({
      id: row.id,
      day: row.day,
      room: row.room,
      subject: row.subject,
      blocks_requested: row.blocks_requested,
      notes: row.notes,
      subs: row.subs,
      sub_first_name: row.sub_first_name,
      sub_last_name: row.sub_last_name,
      status: row.status
    }));

    res.status(200).json(formattedResults); // Return empty array if no results
  });
});


app.get('/accepted-requests', (req, res) => {
  const { email } = req.query;
  console.log(email);

  if (!email) {
    return res.status(400).json({ error: 'Sub email is required' });
  }

  const requestQuery = `
    SELECT r.id, u.email AS teacher_email, u.first_name, u.last_name, 
           r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, r.status
    FROM requests r
    JOIN Users u ON r.teacher_id = u.id
    WHERE r.subs = ? AND r.status != 'completed'
    ORDER BY r.day DESC
  `;

  connection.query(requestQuery, [email], (err, results) => {
    if (err) {
      console.error('Error getting requests with sub email:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    if (results.length === 0) {
      console.log('No requests with sub email');
      return res.status(200).json([]);
    }

    const formattedResults = results.map(row => ({
      id: row.id,
      teacher_email: row.teacher_email,
      teacher_first_name: row.first_name,
      teacher_last_name: row.last_name,
      blocks_requested: row.blocks_requested,
      subject: row.subject,
      room: row.room,
      day: row.day,
      subs: row.subs,
      notes: row.notes,
      status: row.status
    }));

    res.status(200).json(formattedResults);
  });
});

app.get('/getting-requests', (req, res) => {
  const { teacherId } = req.query;  // Use 'id' as the query parameter
  console.log("Teacher ID received:", teacherId);

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher id is required' });
  }

  const requestQuery = `
    SELECT r.id, r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, r.sent
    FROM requests r
    WHERE r.teacher_id = ?
  `;

  connection.query(requestQuery, [teacherId], (err, results) => {
    if (err) {
      console.error('Error getting requests with teacher ID', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    if (results.length === 0) {
      console.log('No requests found for teacher ID:', teacherId);
      return res.status(404).json({ error: 'No requests found for this teacher ID' });
    }

    // Format the results as a JSON array of dictionaries
    const formattedResults = results.map(row => ({
      id: row.id,
      blocks_requested: row.blocks_requested,
      subject: row.subject,
      room: row.room,
      day: row.day,
      subs: row.subs,
      notes: row.notes,
      sent: row.sent
    }));

    // Return the formatted results
    res.status(200).json(formattedResults); // Return JSON formatted data
  });
});


app.get('/open-or-taken', (req, res) => {
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  // Modify the query to join the Users table to get teacher's name
  const selectRequestQuery = `
    SELECT r.id, r.teacher_id, r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, u.first_name, u.last_name
    FROM requests r
    LEFT JOIN Users u ON r.teacher_id = u.id
    WHERE r.id = ?
  `;

  connection.query(selectRequestQuery, [requestId], (err, results) => {
    if (err) {
      console.error('Error querying request by ID:', err); // Log query error
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Access the first (and only) result, since requestId is unique
    const row = results[0];
    console.log('Specific Request:', row);

    // Check availability based on subs field
    const available = !row.subs || (row.subs && row.subs.trim() === '');
    row.available = available;

    // Return the response with teacher name (first_name, last_name) included
    return res.status(200).json({
      ...row,
      teacher_name: `${row.first_name} ${row.last_name}` // Combine first_name and last_name
    });
  });
});

app.post('/verify-token', (req, res) => {
  // Extract token from the 'Authorization' header
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

  // If no token provided, return an error
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Verify the token using the secret key and expiration time
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // If the token is invalid or expired, return an error
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Token is valid, send the decoded user data (this contains user info encoded in the token)
    return res.json({
      user: {
        id: decoded.id,   // User ID from the decoded token
        role: decoded.role, // User role from the decoded token
        email: decoded.email, // User email from the decoded token
      },
    });
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    console.error('Missing JWT_SECRET or JWT_EXPIRES_IN');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const query = 'SELECT * FROM Users WHERE email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];
    if (password !== 'ea1785ea') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    console.log('Login success for:', email);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  });
});

app.post('/verify-token', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.json({
      user: {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      },
    });
  });
});

app.post('/assign-substitute', (req, res) => {
  const { token, password, requestId } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    if (!email || decoded.requestId !== parseInt(requestId)) {
      return res.status(400).json({ error: 'Invalid or mismatched token' });
    }

    const checkEmailQuery = 'SELECT * FROM Users WHERE email = ?';
    connection.query(checkEmailQuery, [email], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database query error' });
      }

      if (results.length === 0 || password !== 'ea1785ea') {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      if (results[0].role === 'teacher') {
        return res.status(400).json({ error: "You're a teacher!" });
      }

      const checkRequestQuery = 'SELECT * FROM requests WHERE id = ?';
      connection.query(checkRequestQuery, [requestId], (err, requestResults) => {
        if (err) {
          return res.status(500).json({ error: 'Error querying the requests table' });
        }

        if (requestResults.length === 0) {
          return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestResults[0];

        if (request.subs === null || request.subs.trim() === '') {
          const updateRequestQuery = 'UPDATE requests SET subs = ? WHERE id = ?';
          connection.query(updateRequestQuery, [email, requestId], (err, updateResults) => {
            if (err) {
              return res.status(500).json({ error: 'Error updating the request table' });
            }
            return res.status(200).json({ message: 'Substitute added successfully', email, added: true });
          });
        } else {
          return res.status(409).json({ message: 'This request has already been taken by another substitute', added: false });
        }
      });
    });
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(400).json({ error: 'Invalid token' });
  }
});

app.post('/send-substitute-email', (req, res) => {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Error configuring transporter:', error);
      return res.status(500).json({ error: 'Email transporter configuration failed' });
    }

    const {
      teacherEmail,
      date,
      room,
      blocks = '',
      notes = '',
      teacherId,
      selectedSubs,
    } = req.body;

    if (!teacherEmail || !date || !room || !teacherId) {
      return res.status(400).json({
        error: 'Missing required fields: teacherEmail, date, room, teacherId',
      });
    }

    if (!Array.isArray(selectedSubs)) {
      return res.status(400).json({ error: 'selectedSubs must be an array' });
    }

    const teacherNameQuery = 'SELECT first_name, last_name FROM Users WHERE id = ?';
    connection.query(teacherNameQuery, [teacherId], (err, teacherResults) => {
      if (err) {
        console.error('Error fetching teacher:', err);
        return res.status(500).json({ error: 'Database error fetching teacher' });
      }
      if (!teacherResults.length) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      const { first_name: firstName, last_name: lastName } = teacherResults[0];

      sendEmails(selectedSubs);

      function sendEmails(emailRecipients) {
        const subEmailsString = emailRecipients.map(item => item.email).join(',') || null;

        const insertRequestQuery = `
          INSERT INTO requests (teacher_id, blocks_requested, room, day, notes, sent)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
          teacherId,
          blocks,
          room,
          date,
          notes,
          subEmailsString,
        ];

        connection.query(insertRequestQuery, insertValues, (err, insertResult) => {
          if (err) {
            console.error('Error inserting request:', err);
            return res.status(500).json({ error: 'Database error inserting request' });
          }

          const requestId = insertResult.insertId;

          if (emailRecipients.length > 0) {
            const emailPromises = emailRecipients.map((sub) => {
              const acceptToken = jwt.sign({ email: sub.email, requestId }, process.env.JWT_SECRET, { expiresIn: '1y' });

              const link = `http://localhost:3000/LinkLogin?token=${acceptToken}&requestId=${requestId}`;
              const emailSubject = `Substitute Request for ${firstName} ${lastName}`;
              const emailBody = `
             <html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Substitute Request</title>
</head>
<body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitute Request</h2>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
          A new substitute request is available from <strong>${firstName} ${lastName}</strong>.
        </p>
        <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${date}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Room:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${room}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Blocks:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${blocks || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Notes:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${notes || 'None'}</td>
          </tr>
        </table>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: rgb(175, 214, 241); color: rgb(20, 54, 100); padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block;">Sign Up for This Request</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: rgb(30, 64, 110); color: #ffffff; padding: 15px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Substitute Scheduler | The Episcopal Academy</p>
        <p style="margin: 5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
      </td>
    </tr>
  </table>
</body>
</html>
              `;

              return new Promise((resolve, reject) => {
                transporter.sendMail({
                  from: process.env.EMAIL_USER || 'ishaansingh779@gmail.com',
                  to: sub.email,
                  subject: emailSubject,
                  html: emailBody,
                }, (err, info) => {
                  if (err) reject(err);
                  resolve(info);
                });
              });
            });

            Promise.all(emailPromises)
              .then(() => {
                finalizeRequest();
              })
              .catch((error) => {
                console.error('Error sending emails:', error);
                res.status(500).json({ error: 'Error sending emails' });
              });
          } else {
            finalizeRequest();
          }

          function finalizeRequest() {
            const updateRequestQuery = `
              UPDATE requests
              SET sent = ?
              WHERE id = ?
            `;
            connection.query(updateRequestQuery, [subEmailsString, requestId], (err, updateResult) => {
              if (err) {
                console.error('Error updating request:', err);
                return res.status(500).json({ error: 'Database error updating request' });
              }
              res.json({ message: 'Request processed successfully'});
            });
          }
        });
      }
    });
  });
});

app.get('/get-subject-emails', (req, res) => {
  const { subject } = req.query;  // Access the subject as a string

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  let query;
  let queryParams;

  if (subject !== 'Other') {
    query = `
      SELECT first_name, last_name, email 
      FROM Users 
      WHERE specialty = ? AND role = 'substitute'
    `;
    queryParams = [subject];
  } else {
    query = `
      SELECT first_name, last_name, email 
      FROM Users 
      WHERE role = 'substitute'
    `;
    queryParams = [];
  }

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (results.length === 0) {
      query = `
      SELECT first_name, last_name, email 
      FROM Users 
      WHERE role = 'substitute'
    `;
      queryParams = [];
      connection.query(query, queryParams, (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ error: 'Database query failed' });
        }
        return res.json(results);
      });
    } else {

      return res.json(results);
    }
  });
});


// handling substitute login
app.post('/assign-substitute', (req, res) => {
  const { token, password, requestId } = req.body;

  // Step 1: Verify JWT token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    if (!email || decoded.requestId !== parseInt(requestId)) {
      return res.status(400).json({ error: 'Invalid or mismatched token' });
    }

    // Step 2: Check if the email exists in the Users table
    const checkEmailQuery = 'SELECT * FROM Users WHERE email = ?';
    connection.query(checkEmailQuery, [email], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database query error' });
      }

      if (results.length === 0 || password !== 'ea1785ea') {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      if (results[0].role === 'teacher') {
        return res.status(400).json({ error: "You're a teacher!" });
      }

      // Step 3: Check if the request exists
      const checkRequestQuery = 'SELECT * FROM requests WHERE id = ?';
      connection.query(checkRequestQuery, [requestId], (err, requestResults) => {
        if (err) {
          return res.status(500).json({ error: 'Error querying the requests table' });
        }

        if (requestResults.length === 0) {
          return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestResults[0];

        // Step 4: Check if the subs column is null
        if (request.subs === null || request.subs.trim() === '') {
          // Step 5: Assign substitute email
          const updateRequestQuery = 'UPDATE requests SET subs = ? WHERE id = ?';
          connection.query(updateRequestQuery, [email, requestId], (err, updateResults) => {
            if (err) {
              return res.status(500).json({ error: 'Error updating the request table' });
            }
            return res.status(200).json({ message: 'Substitute added successfully', email, added: true });
          });
        } else {
          return res.status(409).json({ message: 'This request has already been taken by another substitute', added: false });
        }
      });
    });
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(400).json({ error: 'Invalid token' });
  }
});



app.delete('/requests/:requestId', (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    return res.status(400).json({ error: 'RequestId is required.' });
  }

  // SQL query to get all data from the request
  const selectQuery = 'SELECT * FROM requests WHERE id = ?';

  connection.query(selectQuery, [requestId], (err, results) => {
    if (err) {
      console.error('Error fetching request data:', err.message);
      return res.status(500).json({ error: 'An error occurred while fetching the request data.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const requestData = results[0];
    const sentColumn = requestData.sent;
    const emailAddresses = sentColumn.split(',').map(email => email.trim());

    // SQL query to get the teacher's email from Users table
    const selectUserQuery = 'SELECT * FROM Users WHERE id = ?';

    connection.query(selectUserQuery, [requestData.teacher_id], (err, userResults) => {
      if (err) {
        console.error('Error fetching user data:', err.message);
        return res.status(500).json({ error: 'An error occurred while fetching the user data.' });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const teacherEmail = userResults[0].email;
      const teacherName = userResults[0].first_name; + ' ' + userResults[0].last_name;

      const mailOptions = {
        from: 'ishaansingh779@gmail.com',
        to: emailAddresses,
      
        subject: 'Request Deleted Notification',
        html: `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Deleted Notification</title>
</head>
<body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Request Deleted</h2>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
          The request by <strong>${teacherName}</strong> has been deleted.
        </p>
        <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Blocks:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.blocks_requested || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Subject:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.subject || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Room:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.room || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.day || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Notes:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.notes || 'None'}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: rgb(30, 64, 110); color: #ffffff; padding: 15px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Substitute Scheduler | The Episcopal Academy</p>
        <p style="margin: 5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'An error occurred while sending the notification email.' });
        }

        console.log('Email sent:', info.response);

        // SQL query to delete the row with the given primary key
        const deleteQuery = 'DELETE FROM requests WHERE id = ?';

        connection.query(deleteQuery, [requestId], (err, result) => {
          if (err) {
            console.error('Error deleting request:', err.message);
            return res.status(500).json({ error: 'An error occurred while deleting the request.' });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found.' });
          }

          res.status(200).json({ message: 'Request successfully deleted and notification email sent.' });
        });
      });
    });
  });
});

// app.patch('/requests/:id/cancel', (req, res) => {
//   const { requestId } = req.params; // Get the request ID from the URL

//   // SQL query to update the subs column to null
//   const updateQuery = 'UPDATE requests SET subs = NULL WHERE id = ?';

//   connection.query(updateQuery, [requestId], (err, result) => {
//     if (err) {
//       console.error('Error updating request:', err.message);
//       return res.status(500).json({ error: 'An error occurred while updating the request.' });
//     }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: 'Request not found.' });
//     }


//     res.status(200).json({ message: 'Request successfully updated.' });
//   });
// });

app.patch('/requests/:requestId/cancel', async (req, res) => {
  const { requestId } = req.params;
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher ID is required' });
  }

  // Fetch request details and teacher_id
  const getRequestQuery = 'SELECT sent, teacher_id, blocks_requested, subject, room, day, notes FROM requests WHERE id = ? AND teacher_id = ?';
  connection.query(getRequestQuery, [requestId, teacherId], async (err, results) => {
    if (err) {
      console.error('Error fetching request:', err.message);
      return res.status(500).json({ error: 'Database error fetching request' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Request not found or not owned by teacher' });
    }

    const requestData = results[0];
    const sentEmails = requestData.sent ? requestData.sent.split(',').map(e => e.trim()).filter(e => e) : [];

    // Fetch teacher's name and email
    const getTeacherQuery = 'SELECT first_name, last_name, email FROM Users WHERE id = ?';
    connection.query(getTeacherQuery, [requestData.teacher_id], async (err, teacherResults) => {
      if (err) {
        console.error('Error fetching teacher:', err.message);
        return res.status(500).json({ error: 'Database error fetching teacher' });
      }

      if (teacherResults.length === 0) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      const teacherName = `${teacherResults[0].first_name} ${teacherResults[0].last_name}`;

      // Delete the request
      const deleteRequestQuery = 'DELETE FROM requests WHERE id = ?';
      connection.query(deleteRequestQuery, [requestId], async (err, deleteResult) => {
        if (err) {
          console.error('Error deleting request:', err.message);
          return res.status(500).json({ error: 'Database error deleting request' });
        }

        if (deleteResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Request not found' });
        }

        // Send emails if there are recipients
        if (sentEmails.length > 0) {
          const mailOptions = {
            from: 'ishaansingh779@gmail.com',
            to: sentEmails.join(','),
            subject: 'Substitute Request Cancelled',
            html: `
              <div>
                <p>The substitute request from <strong>${teacherName}</strong> has been cancelled. Details:</p>
                <table border="1" style="border-collapse: collapse; width: 100%; color: green;">
                  <tr>
                    <th>Blocks Requested</th>
                    <th>Subject</th>
                    <th>Room</th>
                    <th>Day</th>
                    <th>Notes</th>
                  </tr>
                  <tr>
                    <td>${requestData.blocks_requested || '-'}</td>
                    <td>${requestData.subject || '-'}</td>
                    <td>${requestData.room || '-'}</td>
                    <td>${requestData.day || '-'}</td>
                    <td>${requestData.notes || 'None'}</td>
                  </tr>
                </table>
              </div>
            `,
          };

          try {
            await transporter.sendMail(mailOptions);
            return res.status(200).json({ message: 'Request cancelled and emails sent' });
          } catch (emailError) {
            console.error('Error sending emails:', emailError.message);
            return res.status(500).json({ error: 'Failed to send cancellation emails' });
          }
        } else {
          return res.status(200).json({ message: 'Request cancelled' });
        }
      });
    });
  });
});


 // when a sub cancels their assignment
app.patch('/requests/:requestId/cancel-substitute', async (req, res) => {
  const { requestId } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Substitute email is required' });
  }

  // Fetch request details including subs and sent emails
  const getRequestQuery = 'SELECT subs, sent, teacher_id, blocks_requested, subject, room, day, notes FROM requests WHERE id = ?';
  connection.query(getRequestQuery, [requestId], async (err, results) => {
    if (err) {
      console.error('Error fetching request:', err.message);
      return res.status(500).json({ error: 'Database error fetching request' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestData = results[0];
    if (requestData.subs !== email) {
      return res.status(403).json({ error: 'Not authorized: Substitute not assigned to this request' });
    }

    // Fetch teacher's name and email
    const getTeacherQuery = 'SELECT first_name, last_name, email FROM Users WHERE id = ?';
    connection.query(getTeacherQuery, [requestData.teacher_id], async (err, teacherResults) => {
      if (err) {
        console.error('Error fetching teacher:', err.message);
        return res.status(500).json({ error: 'Database error fetching teacher' });
      }

      if (teacherResults.length === 0) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      const teacher = teacherResults[0];
      const teacherName = `${teacher.first_name} ${teacher.last_name}`;
      const teacherEmail = teacher.email;

      // Fetch all substitutes' emails (excluding the cancelling substitute)
      const getSubsQuery = 'SELECT email FROM Users WHERE role = "substitute" AND email != ?';
      connection.query(getSubsQuery, [email], async (err, subResults) => {
        if (err) {
          console.error('Error fetching substitutes:', err.message);
          return res.status(500).json({ error: 'Database error fetching substitutes' });
        }

        const subEmails = subResults.map(sub => sub.email);
        const sentEmails = requestData.sent ? requestData.sent.split(',').map(e => e.trim()).filter(e => e && e !== email) : [];

        // Combine teacher email and other substitute emails
        const recipients = [teacherEmail, ...subEmails, ...sentEmails].filter((v, i, a) => a.indexOf(v) === i);

        // Update request to remove substitute assignment
        const updateRequestQuery = 'UPDATE requests SET subs = NULL WHERE id = ?';
        connection.query(updateRequestQuery, [requestId], async (err, updateResult) => {
          if (err) {
            console.error('Error updating request:', err.message);
            return res.status(500).json({ error: 'Database error updating request' });
          }

          if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Request not found' });
          }

          // Send email notification
          if (recipients.length > 0) {
            const mailOptions = {
              from: 'ishaansingh779@gmail.com',
              to: recipients.join(','),
              subject: 'Substitute Request Now Available',
              html: `
               <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Substitute Request Now Available</title>
</head>
<body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitute Request Now Available</h2>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
          The substitute request from <strong>${teacherName}</strong> is available again due to a cancellation.
        </p>
        <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Blocks:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.blocks_requested || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Subject:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.subject || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Room:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.room || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.day || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Notes:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${requestData.notes || 'None'}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: rgb(30, 64, 110); color: #ffffff; padding: 15px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Substitute Scheduler | The Episcopal Academy</p>
        <p style="margin: 5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
      </td>
    </tr>
  </table>
</body>
</html>
              `,
            };

            try {
              await transporter.sendMail(mailOptions);
              return res.status(200).json({ message: 'Substitute assignment cancelled and emails sent' });
            } catch (emailError) {
              console.error('Error sending emails:', emailError.message);
              return res.status(500).json({ error: 'Failed to send cancellation emails' });
            }
          } else {
            return res.status(200).json({ message: 'Substitute assignment cancelled' });
          }
        });
      });
    });
  });
});





app.get('/get-everything', (req, res) => {
  const query = `
    SELECT 
      requests.*, 
      Users.first_name, 
      Users.last_name 
    FROM requests 
    JOIN Users ON requests.id = Users.id
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Error fetching data');
    }
    res.json(results);
  });
});

app.get('/edit-request/:requestId', (req, res) => {

  const requestId = req.params.requestId;
  console.log('Received requestId:', requestId); // Log to confirm route is hit
  const query = 'SELECT * FROM requests WHERE id = ?';

  connection.query(query, [requestId], (err, results) => {
    if (err) {
      console.log("HERE2");
      console.error('Error executing query:', err.stack);
      return res.status(500).send('Internal server error');
    }

    if (results.length === 0) {
      console.log(`Request with ID ${requestId} not found`);
      return res.json({});  // Send empty object if no data found
    }
    console.log("HERE1");
    console.log("Request data fetched:", results[0]);
    return res.json(results[0]);  // Send first result
  });
});



app.put('/requests/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const { teacher_id, blocks_requested, subject, room, day, subs, notes, sent } = updatedData;

  // SQL query to update the request
  const query = `
      UPDATE requests
      SET 
          teacher_id = ?,
          blocks_requested = ?,
          subject = ?,
          room = ?,
          day = ?,
          subs = ?,
          notes = ?,
          sent = ?
      WHERE id = ?
  `;

  // Execute the query with the data values
  connection.execute(query, [teacher_id, blocks_requested, subject, room, day, subs, notes, sent, id], (err, result) => {
    if (err) {
      console.error('Error updating request:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json({ message: 'Request updated successfully' });
  });
});


app.get('/get-subs', (req, res) => {
  const query = 'SELECT * FROM Users WHERE role = ?';
  const role = 'substitute'; // The role you're fetching from the database

  connection.query(query, [role], (error, results) => {
    if (error) {
      console.error('Error fetching substitutes:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    console.log('Query Results:', results); // Check if query is returning the expected results
    res.json(results); // Send the query result back as JSON
  });
});

app.get('/get-teacher-ids', (req, res) => {
  const query = 'SELECT id, first_name, last_name FROM Users WHERE role = ?';
  const role = 'teacher'; // The role you're fetching from the database

  connection.query(query, [role], (error, results) => {
    if (error) {
      console.error('Error fetching substitutes:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results); // Send the query result back as JSON
  });
});

app.get('/get-users', (req, res) => {
  const query = 'SELECT * FROM Users';

  connection.query(query, [], (error, results) => {
    if (error) {
      console.error('Error fetching substitutes:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results); // Send the query result back as JSON
  });

});

app.post('/add-user', (req, res) => {
  const { first_name, last_name, email, role, departments, phone_number } = req.body;
  const query = `INSERT INTO Users (email, first_name, last_name, role, departments, phone_number)
                 VALUES (?, ?, ?, ?, ?, ?)`;

  connection.query(query, [email, first_name, last_name, role, departments, phone_number], (error, results) => {
    if (error) {
      console.error('Database Error:', error);

      // Check if the error is a duplicate entry for the 'email' key
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
      }

      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.json({ message: 'User added successfully', data: results });
  });
});

app.delete('/delete-user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM Users WHERE id = ?';

  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

app.patch('/update-user/:id', (req, res) => {
  const { id: userId } = req.params;
  const { first_name, last_name, email, role, departments, phone_number } = req.body;
  const query = 'UPDATE Users SET first_name = ?, last_name = ?, email = ?, role = ?, departments = ?, phone_number = ? WHERE id = ?';
  const values = [first_name, last_name, email, role, departments, phone_number, userId];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      message: 'User updated successfully', 
      user: { id: userId, first_name, last_name, email, role, departments, phone_number }
    });
  });
});

app.get('/check-request', (req, res) => {
  const { requestId } = req.query;
  const query = 'SELECT COUNT(*) as count FROM Requests WHERE id = ?';

  connection.query(query, [requestId], (error, results) => {
    if (error) {
      console.error('Error checking request:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    const exists = results[0].count > 0;
    res.json({ exists });
  });
});



app.patch('/requests/:id/complete', (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Substitute email is required' });
  }

  // Verify request exists and is assigned to substitute
  const selectQuery = `
    SELECT r.id, r.status, r.subs, r.day, r.blocks_requested, r.room, r.notes,
           u.email AS teacher_email, u.first_name AS teacher_first_name, u.last_name AS teacher_last_name,
           sub.first_name AS sub_first_name, sub.last_name AS sub_last_name
    FROM requests r
    JOIN Users u ON r.teacher_id = u.id
    JOIN Users sub ON r.subs = sub.email
    WHERE r.id = ? AND r.subs = ?
  `;

  connection.query(selectQuery, [id, email], (err, results) => {
    if (err) {
      console.error('Error querying request:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Request not found or not assigned to you' });
    }

    const request = results[0];
    if (request.status === 'completed') {
      return res.status(400).json({ error: 'Request is already completed' });
    }

    // Update request status
    const updateQuery = `UPDATE requests SET status = 'completed' WHERE id = ?`;
    connection.query(updateQuery, [id], (err) => {
      if (err) {
        console.error('Error updating request status:', err);
        return res.status(500).json({ error: 'Database update error' });
      }

      // Prepare email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: request.teacher_email,
        subject: `Substitute Request Completed for ${request.day}`,
        text: `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Substitute Request Completed</title>
</head>
<body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitute Request Completed</h2>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
          Dear <strong>${request.teacher_first_name} ${request.teacher_last_name}</strong>,
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
          The substitute request for ${request.day} has been completed by <strong>${request.sub_first_name} ${request.sub_last_name}</strong>.
        </p>
        <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.day}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Blocks:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.blocks_requested || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Room:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.room || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Notes:</strong></td>
            <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.notes || 'None'}</td>
          </tr>
        </table>
        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 20px 0 0;">
          Thank you,<br>Substitute Scheduler
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: rgb(30, 64, 110); color: #ffffff; padding: 15px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Substitute Scheduler | The Episcopal Academy</p>
        <p style="margin: 5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      };

      // Send email
      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error('Error sending email:', error);
          // Don't fail the request if email fails
          return res.status(200).json({ message: 'Request marked as completed, but email notification failed' });
        }
        res.status(200).json({ message: 'Request marked as completed and email sent' });
      });
    });
  });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// CREATE TABLE Users (
//   id INT NOT NULL AUTO_INCREMENT,
//   email VARCHAR(255) NOT NULL,
//   first_name VARCHAR(50),
//   last_name VARCHAR(50),
//   role VARCHAR(20),
//   specialty VARCHAR(100),
//   phone_number VARCHAR(20),
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   PRIMARY KEY (id),
//   UNIQUE(email)
// );

