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

app.get('/open-or-taken', async (req, res) => {
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  try {
    const query = `
      SELECT 
        r.id, r.blocks_requested, r.subject, r.room, r.day, r.notes, r.status,
        t.first_name, t.last_name,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'block', ra.block,
                'sub_id', ra.sub_id,
                'sub_first_name', s.first_name,
                'sub_last_name', s.last_name
              )
            )
            FROM request_assignments ra
            LEFT JOIN Users s ON ra.sub_id = s.id
            WHERE ra.request_id = r.id AND ra.block IS NOT NULL
          ),
          '[]'
        ) AS assignments
      FROM requests r
      JOIN Users t ON r.teacher_id = t.id
      WHERE r.id = ? AND r.status != 'completed'
    `;

    const [results] = await connection.promise().query(query, [requestId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Request not found or completed' });
    }

    const request = results[0];
    const assignments = JSON.parse(request.assignments);
    const requestedBlocks = request.blocks_requested
      ? request.blocks_requested.split(',').map(b => b.trim())
      : [];

    const blockDetails = requestedBlocks.map(block => {
      const assignment = assignments.find(a => a.block === block);
      return {
        name: block,
        available: !assignment,
        assigned_to: assignment ? `${assignment.sub_first_name} ${assignment.sub_last_name}` : null,
      };
    });

    const available = blockDetails.some(b => b.available);

    res.status(200).json({
      teacher_name: `${request.first_name} ${request.last_name}`,
      blocks_requested: request.blocks_requested,
      subject: request.subject,
      room: request.room,
      day: request.day,
      notes: request.notes,
      block_details: blockDetails,
      available,
    });
  } catch (err) {
    console.error('Error checking request availability:', err);
    res.status(500).json({ error: 'Database query error' });
  }
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

app.get('/substitute-email', async (req, res) => {
  const { first_name, last_name } = req.query;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  try {
    const [results] = await connection.promise().query(
      'SELECT email FROM Users WHERE first_name = ? AND last_name = ?',
      [first_name, last_name]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: 'Substitute not found' });
    }

    res.status(200).json({ email: results[0].email });
  } catch (err) {
    console.error('Error fetching substitute email:', err);
    res.status(500).json({ error: `Failed to fetch email: ${err.message}` });
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
      subject,
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
          INSERT INTO requests (teacher_id, blocks_requested, subject, room, day, notes, sent)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const insertValues = [
          teacherId,
          blocks,
          subject,
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


app.get('/teacher-requests', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Fetch teacher ID
    const [userResults] = await connection.promise().query('SELECT id FROM Users WHERE email = ?', [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const teacherId = userResults[0].id;

    // Fetch non-completed requests
    const query = `
      SELECT 
        r.id, r.day, r.subject, r.room, r.notes,
        r.blocks_requested
      FROM requests r
      WHERE r.teacher_id = ? AND r.status != 'completed'
    `;
    const [requestResults] = await connection.promise().query(query, [teacherId]);

    // Fetch assigned blocks with substitute names and emails
    const formattedResults = await Promise.all(
      requestResults.map(async request => {
        const blocksRequested = request.blocks_requested ? request.blocks_requested.split(',').map(b => b.trim()) : [];
        
        // Fetch assigned blocks, substitute names, and emails
        const [assignmentResults] = await connection.promise().query(
          `
          SELECT ra.block, CONCAT(u.first_name, ' ', u.last_name) AS substitute_name, u.email AS substitute_email
          FROM request_assignments ra
          JOIN Users u ON ra.sub_id = u.id
          WHERE ra.request_id = ?
          `,
          [request.id]
        );

        // Create blocks array with assignment status
        const assignedBlocks = assignmentResults.map(a => a.block);
        const blocks = blocksRequested.map(block => ({
          block,
          assigned: assignedBlocks.includes(block),
          substitute_name: assignedBlocks.includes(block)
            ? assignmentResults.find(a => a.block === block).substitute_name
            : null,
          substitute_email: assignedBlocks.includes(block)
            ? assignmentResults.find(a => a.block === block).substitute_email
            : null,
        }));

        return {
          id: request.id,
          day: request.day,
          subject: request.subject,
          room: request.room,
          notes: request.notes,
          blocks,
        };
      })
    );

    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error fetching teacher requests:', err);
    res.status(500).json({ error: `Failed to fetch requests: ${err.message}` });
  }
});

app.post('/complete-request', async (req, res) => {
  const { email, requestId } = req.body;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // Fetch teacher ID
    const [userResults] = await connection.promise().query('SELECT id FROM Users WHERE email = ?', [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const teacherId = userResults[0].id;

    // Verify request belongs to teacher and is not completed
    const [requestResults] = await connection.promise().query(
      'SELECT id FROM requests WHERE id = ? AND teacher_id = ? AND status != ?',
      [requestId, teacherId, 'completed']
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    // Update request status to completed
    await connection.promise().query(
      'UPDATE requests SET status = ? WHERE id = ?',
      ['completed', requestId]
    );

    res.status(200).json({ message: 'Request marked as completed', added: true });
  } catch (err) {
    console.error('Error completing request:', err);
    res.status(500).json({ error: `Failed to complete request: ${err.message}` });
  }
});

app.post('/cancel-request', async (req, res) => {
  const { email, requestId } = req.body;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('SMTP transporter verified successfully');
    } catch (err) {
      console.error('SMTP configuration error:', err);
      return res.status(500).json({ error: 'Email service configuration error: Invalid credentials' });
    }

    // Fetch teacher ID
    const [userResults] = await connection.promise().query('SELECT id FROM Users WHERE email = ?', [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const teacherId = userResults[0].id;

    // Fetch request details, including sent column
    const [requestResults] = await connection.promise().query(
      `
      SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.sent,
             t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
      FROM requests r
      JOIN Users t ON r.teacher_id = t.id
      WHERE r.id = ? AND r.teacher_id = ? AND r.status != 'completed'
      `,
      [requestId, teacherId]
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    const request = requestResults[0];
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;

    // Parse unique substitute emails from sent column
    const substituteEmails = request.sent
      ? [...new Set(request.sent.split(',').map(email => email.trim()))]
      : [];
    
    // Fetch assigned blocks for email content
    const [assignmentResults] = await connection.promise().query(
      `
      SELECT ra.block
      FROM request_assignments ra
      WHERE ra.request_id = ?
      `,
      [requestId]
    );
    const canceledBlocks = assignmentResults.map(a => a.block);

    // Prepare email content
    const subject = `Substitution Request #${requestId} Canceled`;
    const html = `
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Request Canceled Notification</title>
      </head>
      <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitution Request Canceled</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                The following substitution request by <strong>${teacherName}</strong> has been canceled.
              </p>
              <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Blocks:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${canceledBlocks.join(', ') || request.blocks_requested || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Subject:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.subject || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Room:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.room || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.day || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Notes:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.notes || 'None'}</td>
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
    `;
    const text = `
      Substitution Request Canceled
      
      The following request #${requestId} by ${teacherName} has been canceled:
      
      Blocks: ${canceledBlocks.join(', ') || request.blocks_requested || '-'}
      Subject: ${request.subject || '-'}
      Room: ${request.room || '-'}
      Date: ${request.day || '-'}
      Notes: ${request.notes || 'None'}
    `;

    // Send emails to unique substitutes from sent column
    if (substituteEmails.length > 0) {
      console.log(`Sending cancellation emails to: ${substituteEmails.join(', ')}`);
      try {
        await Promise.all(
          substituteEmails.map(async (recipient) => {
            const info = await transporter.sendMail({
              from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
              to: recipient,
              subject,
              text,
              html,
            });
            console.log(`Email sent to ${recipient}: Message ID ${info.messageId}`);
            return info;
          })
        );
      } catch (err) {
        console.error('Error sending emails:', err);
        return res.status(500).json({ error: `Failed to send emails: ${err.message}` });
      }
    } else {
      console.log('No substitutes to notify for request', requestId);
    }

    // Delete assignments and request after sending emails
    await connection.promise().query('DELETE FROM request_assignments WHERE request_id = ?', [requestId]);
    await connection.promise().query('DELETE FROM requests WHERE id = ?', [requestId]);

    res.status(200).json({ message: 'Request canceled successfully', added: true });
  } catch (err) {
    console.error('Error canceling request:', err);
    res.status(500).json({ error: `Failed to cancel request: ${err.message}` });
  }
});

app.post('/assign-substitute', async (req, res) => {
  const { token, password, requestId, blocks } = req.body;

  // Validate request body
  if (!token || !password || !requestId || !Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ error: 'Token, password, requestId, and blocks array are required' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    if (!email || decoded.requestId !== parseInt(requestId)) {
      return res.status(400).json({ error: 'Invalid or mismatched token' });
    }

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('SMTP transporter verified successfully');
    } catch (err) {
      console.error('SMTP configuration error:', err);
      return res.status(500).json({ error: 'Email service configuration error: Invalid credentials' });
    }

    // Check if the email exists in the Users table and get substitute details
    const [userResults] = await connection.promise().query(
      'SELECT id, first_name, last_name, role FROM Users WHERE email = ?',
      [email]
    );
    if (userResults.length === 0 || password !== 'ea1785ea') {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    if (userResults[0].role === 'teacher') {
      return res.status(400).json({ error: "You're a teacher!" });
    }
    const subId = userResults[0].id;
    const subName = `${userResults[0].first_name} ${userResults[0].last_name}`;

    // Check if the request exists and get teacher and sent details
    const [requestResults] = await connection.promise().query(
      `
      SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.teacher_id, r.sent,
             t.email AS teacher_email, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
      FROM requests r
      JOIN Users t ON r.teacher_id = t.id
      WHERE r.id = ? AND r.status != 'completed'
      `,
      [requestId]
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }
    const request = requestResults[0];
    const teacherEmail = request.teacher_email;
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;
    const requestedBlocks = request.blocks_requested ? request.blocks_requested.split(',').map(b => b.trim()) : [];
    const sentEmails = request.sent ? [...new Set(request.sent.split(',').map(e => e.trim()))] : [];

    // Validate selected blocks
    const invalidBlocks = blocks.filter(b => !requestedBlocks.includes(b));
    if (invalidBlocks.length > 0) {
      return res.status(400).json({ error: `Invalid blocks: ${invalidBlocks.join(', ')}` });
    }

    // Check if selected blocks are already assigned
    const [existingAssignments] = await connection.promise().query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND block IN (?)',
      [requestId, blocks]
    );
    const assignedBlocks = existingAssignments.map(a => a.block);
    const alreadyTakenBlocks = blocks.filter(b => assignedBlocks.includes(b));
    if (alreadyTakenBlocks.length > 0) {
      return res.status(409).json({ error: `Blocks already taken: ${alreadyTakenBlocks.join(', ')}` });
    }

    // Insert assignments into request_assignments
    const insertQuery = 'INSERT INTO request_assignments (request_id, sub_id, block) VALUES ?';
    const values = blocks.map(block => [requestId, subId, block]);
    await connection.promise().query(insertQuery, [values]);

    // Prepare email content for teacher and substitutes
    const emailContent = {
      subject: `Substitution Request #${requestId} Assigned`,
      html: `
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Assigned Notification</title>
        </head>
        <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
          <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitution Request Assigned</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                  The following blocks for the substitution request by <strong>${teacherName}</strong> have been assigned to <strong>${subName}</strong>.
                </p>
                <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
                  <tr>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Blocks:</strong></td>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;">${blocks.join(', ')}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Subject:</strong></td>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.subject || '-'}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Room:</strong></td>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.room || '-'}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.day || '-'}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Notes:</strong></td>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.notes || 'None'}</td>
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
      text: `
        Substitution Request Assigned
        
        The following blocks for request #${requestId} by ${teacherName} have been assigned to ${subName}:
        
        Blocks: ${blocks.join(', ')}
        Subject: ${request.subject || '-'}
        Room: ${request.room || '-'}
        Date: ${request.day || '-'}
        Notes: ${request.notes || 'None'}
      `
    };

    // Send email to teacher
    console.log(`Sending assignment email to teacher: ${teacherEmail}`);
    try {
      const teacherInfo = await transporter.sendMail({
        from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
        to: teacherEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });
      console.log(`Email sent to ${teacherEmail}: Message ID ${teacherInfo.messageId}`);
    } catch (err) {
      console.error('Error sending email to teacher:', err);
      return res.status(500).json({ error: `Failed to send email to teacher: ${err.message}` });
    }

    // Send email to other substitutes (excluding the accepting substitute)
    const otherSubEmails = sentEmails.filter(e => e !== email);
    if (otherSubEmails.length > 0) {
      console.log(`Sending assignment notification emails to substitutes: ${otherSubEmails.join(', ')}`);
      try {
        await Promise.all(
          otherSubEmails.map(async (recipient) => {
            const info = await transporter.sendMail({
              from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
              to: recipient,
              subject: emailContent.subject,
              text: emailContent.text,
              html: emailContent.html,
            });
            console.log(`Email sent to ${recipient}: Message ID ${info.messageId}`);
            return info;
          })
        );
      } catch (err) {
        console.error('Error sending emails to substitutes:', err);
        return res.status(500).json({ error: `Failed to send emails to substitutes: ${err.message}` });
      }
    } else {
      console.log('No other substitutes to notify for request', requestId);
    }

    res.status(200).json({ message: 'Substitute assigned successfully', email, blocks, added: true });
  } catch (err) {
    console.error('Error assigning substitute:', err);
    res.status(400).json({ error: `Invalid token or server error: ${err.message}` });
  }
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




 // when a sub cancels their assignment
app.patch('/requests/:id/cancel-substitute', async (req, res) => {
  const { id } = req.params;
  const { email, block } = req.body;

  if (!email || !block) {
    return res.status(400).json({ error: 'Email and block are required' });
  }

  try {
    // Fetch substitute's ID
    const [subResults] = await connection.promise().query('SELECT id FROM Users WHERE email = ?', [email]);
    if (subResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const subId = subResults[0].id;

    // Verify the block assignment exists
    const [assignResults] = await connection.promise().query(
      'SELECT * FROM request_assignments WHERE request_id = ? AND sub_id = ? AND block = ?',
      [id, subId, block]
    );
    if (assignResults.length === 0) {
      return res.status(404).json({ error: 'Block assignment not found' });
    }

    // Fetch request details and teacher info
    const [requestResults] = await connection.promise().query(
      'SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.teacher_id, u.first_name, u.last_name, u.email AS teacher_email ' +
      'FROM requests r JOIN Users u ON r.teacher_id = u.id WHERE r.id = ?',
      [id]
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestData = requestResults[0];
    const teacherName = `${requestData.first_name} ${requestData.last_name}`;
    const teacherEmail = requestData.teacher_email;

    // Fetch all substitutes' emails (excluding the cancelling substitute)
    const [subEmailsResults] = await connection.promise().query(
      'SELECT email FROM Users WHERE role = "substitute" AND email != ?',
      [email]
    );
    const subEmails = subEmailsResults.map(sub => sub.email);

    // Combine teacher email and substitute emails
    const recipients = [teacherEmail, ...subEmails].filter((v, i, a) => a.indexOf(v) === i);

    // Delete the block assignment
    const [deleteResult] = await connection.promise().query(
      'DELETE FROM request_assignments WHERE request_id = ? AND sub_id = ? AND block = ?',
      [id, subId, block]
    );
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Block assignment not found' });
    }

    // Send email notification
    if (recipients.length > 0) {
      const mailOptions = {
        from: 'ishaansingh779@gmail.com',
        to: recipients.join(','),
        subject: 'Substitute Block Now Available',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Substitute Block Now Available</title>
          </head>
          <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
            <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitute Block Now Available</h2>
                  <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                    The substitute block from <strong>${teacherName}</strong> is available again due to a cancellation.
                  </p>
                  <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
                    <tr>
                      <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Block:</strong></td>
                      <td style="border: 1px solid #e0e0e0; padding: 10px;">${block}</td>
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
        return res.status(200).json({ message: 'Block assignment cancelled and emails sent' });
      } catch (emailError) {
        console.error('Error sending emails:', emailError.message);
        return res.status(500).json({ error: 'Failed to send cancellation emails' });
      }
    } else {
      return res.status(200).json({ message: 'Block assignment cancelled' });
    }
  } catch (err) {
    console.error('Error cancelling block assignment:', err);
    return res.status(500).json({ error: 'Database query error' });
  }
});


app.get('/get-everything', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id, r.teacher_id, r.blocks_requested, r.subject, r.room, r.day, r.status,
        t.first_name, t.last_name,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'block', ra.block,
                'sub_id', ra.sub_id,
                'sub_first_name', s.first_name,
                'sub_last_name', s.last_name
              )
            )
            FROM request_assignments ra
            LEFT JOIN Users s ON ra.sub_id = s.id
            WHERE ra.request_id = r.id AND ra.block IS NOT NULL
          ),
          '[]'
        ) AS assignments
      FROM requests r
      JOIN Users t ON r.teacher_id = t.id
      GROUP BY r.id, r.teacher_id, r.blocks_requested, r.subject, r.room, r.day, r.status, t.first_name, t.last_name
    `;

    const [results] = await connection.promise().query(query);
    
    const formattedResults = results.map(row => ({
      ...row,
      assignments: row.assignments ? JSON.parse(row.assignments) : []
    }));

    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ error: 'Database query error' });
  }
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



app.patch('/requests/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { email, block } = req.body;

  if (!email || !block) {
    return res.status(400).json({ error: 'Email and block are required' });
  }

  try {
    // Fetch substitute's ID
    const [subResults] = await connection.promise().query('SELECT id, first_name, last_name FROM Users WHERE email = ?', [email]);
    if (subResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const subId = subResults[0].id;
    const subName = `${subResults[0].first_name} ${subResults[0].last_name}`;

    // Verify the block assignment exists
    const [assignResults] = await connection.promise().query(
      'SELECT * FROM request_assignments WHERE request_id = ? AND sub_id = ? AND block = ?',
      [id, subId, block]
    );
    if (assignResults.length === 0) {
      return res.status(404).json({ error: 'Block assignment not found' });
    }

    // Fetch request details and teacher info
    const [requestResults] = await connection.promise().query(
      'SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.status, r.teacher_id, ' +
      'u.first_name AS teacher_first_name, u.last_name AS teacher_last_name, u.email AS teacher_email ' +
      'FROM requests r JOIN Users u ON r.teacher_id = u.id WHERE r.id = ?',
      [id]
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResults[0];
    if (request.status === 'completed') {
      return res.status(400).json({ error: 'Request is already completed' });
    }

    // Check if all blocks for the request are assigned
    const [blockResults] = await connection.promise().query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [id]
    );
    const requestedBlocks = request.blocks_requested ? request.blocks_requested.split(', ').map(b => b.trim()) : [];
    const assignedBlocks = blockResults.map(b => b.block);
    const allBlocksAssigned = requestedBlocks.every(b => assignedBlocks.includes(b));

    // Update request status if all blocks are assigned
    if (allBlocksAssigned) {
      const [updateResult] = await connection.promise().query(
        'UPDATE requests SET status = "completed" WHERE id = ?',
        [id]
      );
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
    }

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: request.teacher_email,
      subject: `Substitute Block Completed for ${request.day}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Substitute Block Completed</title>
        </head>
        <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
          <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitute Block Completed</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                  Dear <strong>${request.teacher_first_name} ${request.teacher_last_name}</strong>,
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                  The substitute block for ${request.day} has been completed by <strong>${subName}</strong>.
                </p>
                <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
                  <tr>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.day}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Block:</strong></td>
                    <td style="border: 1px solid #e0e0e0; padding: 10px;">${block}</td>
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
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Block marked as completed and email sent' });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      res.status(200).json({ message: 'Block marked as completed, but email notification failed' });
    }
  } catch (err) {
    console.error('Error completing block:', err);
    return res.status(500).json({ error: 'Database query error' });
  }
});

app.get('/admin-requests', async (req, res) => {
  const { page = 1, limit = 10, includeCompleted = 'false' } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Fetch requests with teacher info, optionally including completed
    const query = `
      SELECT 
        r.id, r.day, r.subject, r.room, r.notes, r.blocks_requested, r.status,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher,
        u.email AS teacher_email
      FROM requests r
      JOIN Users u ON r.teacher_id = u.id
      ${includeCompleted === 'true' ? '' : 'WHERE r.status != "completed"'}
      LIMIT ? OFFSET ?
    `;
    const [requestResults] = await connection.promise().query(query, [parseInt(limit), parseInt(offset)]);

    // Fetch assigned blocks with substitute names and emails
    const formattedResults = await Promise.all(
      requestResults.map(async request => {
        const blocksRequested = request.blocks_requested ? request.blocks_requested.split(',').map(b => b.trim()) : [];
        
        // Fetch assigned blocks, substitute names, and emails
        const [assignmentResults] = await connection.promise().query(
          `
          SELECT ra.block, CONCAT(u.first_name, ' ', u.last_name) AS substitute_name, u.email AS substitute_email
          FROM request_assignments ra
          JOIN Users u ON ra.sub_id = u.id
          WHERE ra.request_id = ?
          `,
          [request.id]
        );

        // Create blocks array with assignment status
        const assignedBlocks = assignmentResults.map(a => a.block);
        const blocks = blocksRequested.map(block => ({
          block,
          assigned: assignedBlocks.includes(block),
          substitute_name: assignedBlocks.includes(block)
            ? assignmentResults.find(a => a.block === block).substitute_name
            : null,
          substitute_email: assignedBlocks.includes(block)
            ? assignmentResults.find(a => a.block === block).substitute_email
            : null,
        }));

        return {
          id: request.id,
          day: request.day,
          subject: request.subject,
          room: request.room,
          notes: request.notes,
          status: request.status,
          blocks,
          teacher: request.teacher,
          teacher_email: request.teacher_email,
        };
      })
    );

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM requests r
      JOIN Users u ON r.teacher_id = u.id
      ${includeCompleted === 'true' ? '' : 'WHERE r.status != "completed"'}
    `;
    const [[{ total }]] = await connection.promise().query(countQuery);

    res.status(200).json({ requests: formattedResults, total });
  } catch (err) {
    console.error('Error fetching admin requests:', err);
    res.status(500).json({ error: `Failed to fetch requests: ${err.message}` });
  }
});

app.post('/accept-request', async (req, res) => {
  const { requestId, email, blocks } = req.body;

  if (!requestId || !email || !blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ error: 'Request ID, email, and blocks array are required' });
  }

  try {
    // Fetch substitute ID
    const [subResults] = await connection.promise().query('SELECT id FROM Users WHERE email = ?', [email]);
    if (subResults.length === 0) {
      return res.status(404).json({ error: 'Substitute not found' });
    }
    const subId = subResults[0].id;

    // Verify request exists
    const [requestResults] = await connection.promise().query(
      'SELECT blocks_requested FROM requests WHERE id = ? AND status != "completed"',
      [requestId]
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    const requestedBlocks = requestResults[0].blocks_requested
      ? requestResults[0].blocks_requested.split(',').map(b => b.trim())
      : [];

    // Validate requested blocks
    const invalidBlocks = blocks.filter(block => !requestedBlocks.includes(block));
    if (invalidBlocks.length > 0) {
      return res.status(400).json({ error: `Invalid blocks: ${invalidBlocks.join(', ')}` });
    }

    // Check for existing assignments
    const [existingAssignments] = await connection.promise().query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND block IN (?)',
      [requestId, blocks]
    );
    const assignedBlocks = existingAssignments.map(a => a.block);
    const alreadyAssigned = blocks.filter(block => assignedBlocks.includes(block));
    if (alreadyAssigned.length > 0) {
      return res.status(400).json({ error: `Blocks already assigned: ${alreadyAssigned.join(', ')}` });
    }

    // Insert assignments
    const insertQuery = 'INSERT INTO request_assignments (request_id, sub_id, block) VALUES ?';
    const values = blocks.map(block => [requestId, subId, block]);
    await connection.promise().query(insertQuery, [values]);

    res.status(200).json({ message: 'Blocks assigned successfully' });
  } catch (err) {
    console.error('Error accepting blocks:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/substitute-requests', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Fetch substitute ID
    const [userResults] = await connection.promise().query(
      'SELECT id FROM Users WHERE email = ?', 
      [email]
    );
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Substitute not found' });
    }
    const subId = userResults[0].id;

    // Fetch assigned requests including teacher email
    const query = `
      SELECT 
        r.id, r.day, r.subject, r.room, r.notes,
        t.first_name, t.last_name, t.email AS teacher_email,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(ra.block)
            FROM request_assignments ra
            WHERE ra.request_id = r.id AND ra.sub_id = ? AND ra.block IS NOT NULL
          ),
          '[]'
        ) AS blocks
      FROM requests r
      JOIN Users t ON r.teacher_id = t.id
      JOIN request_assignments ra ON r.id = ra.request_id
      WHERE ra.sub_id = ? AND r.status != 'completed'
      GROUP BY r.id, r.day, r.subject, r.room, r.notes, t.first_name, t.last_name, t.email
    `;

    const [results] = await connection.promise().query(query, [subId, subId]);

    const formattedResults = results.map(row => ({
      ...row,
      teacher_name: `${row.first_name} ${row.last_name}`,
      blocks: JSON.parse(row.blocks),
    }));

    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error fetching substitute requests:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});



app.post('/cancel-assignment', async (req, res) => {
  const { email, requestId } = req.body;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (err) {
      console.error('SMTP configuration error:', err);
      return res.status(500).json({ error: 'Email service configuration error: Invalid credentials' });
    }

    // Fetch substitute ID
    const [userResults] = await connection.promise().query('SELECT id FROM Users WHERE email = ?', [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Substitute not found' });
    }
    const subId = userResults[0].id;

    // Fetch request details and teacher email
    const [requestResults] = await connection.promise().query(
      `
      SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes,
             t.email AS teacher_email, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
      FROM requests r
      JOIN Users t ON r.teacher_id = t.id
      WHERE r.id = ? AND r.status != 'completed'
      `,
      [requestId]
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    const request = requestResults[0];
    const teacherEmail = request.teacher_email;
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;

    // Fetch all substitute emails
    const [substituteResults] = await connection.promise().query(
      'SELECT email FROM Users WHERE role = ? AND email != ?',
      ['substitute', email]
    );
    const substituteEmails = substituteResults.map(row => row.email);

    // Fetch assigned blocks for this substitute
    const [assignmentResults] = await connection.promise().query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND sub_id = ?',
      [requestId, subId]
    );
    if (assignmentResults.length === 0) {
      return res.status(404).json({ error: 'No assignments found for this substitute' });
    }
    const canceledBlocks = assignmentResults.map(a => a.block);

    // Delete assignments
    await connection.promise().query(
      'DELETE FROM request_assignments WHERE request_id = ? AND sub_id = ?',
      [requestId, subId]
    );

    // Prepare email content
    const subject = `Substitution Blocks Canceled for Request #${requestId}`;
    const html = `
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Blocks Canceled Notification</title>
      </head>
      <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;">
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitution Blocks Canceled</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                The following blocks for a substitution request by <strong>${teacherName}</strong> have been canceled and are now available.
              </p>
              <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Blocks:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${canceledBlocks.join(', ') || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Subject:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.subject || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Room:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.room || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Date:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.day || '-'}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;"><strong>Notes:</strong></td>
                  <td style="border: 1px solid #e0e0e0; padding: 10px;">${request.notes || 'None'}</td>
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
    `;
    const text = `
      Substitution Blocks Canceled
      
      The following blocks for Request #${requestId} by ${teacherName} have been canceled:
      
      Blocks: ${canceledBlocks.join(', ') || '-'}
      Subject: ${request.subject || '-'}
      Room: ${request.room || '-'}
      Date: ${request.day || '-'}
      Notes: ${request.notes || 'None'}
      
      These blocks are now available for other substitutes to accept.
    `;

    // Send emails to teacher and all substitutes
    try {
      const recipients = [teacherEmail, ...substituteEmails];
      await Promise.all(
        recipients.map(recipient =>
          transporter.sendMail({
            from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
            to: recipient,
            subject,
            text,
            html,
          })
        )
      );
    } catch (err) {
      console.error('Error sending emails:', err);
      return res.status(500).json({ error: `Failed to send emails: ${err.message}` });
    }

    res.status(200).json({ message: 'Assignment canceled successfully', added: true });
  } catch (err) {
    console.error('Error canceling assignment:', err);
    res.status(500).json({ error: `Failed to cancel assignment: ${err.message}` });
  }
});


app.post('/admin-complete-request', async (req, res) => {
  const { email, requestId } = req.body;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // Verify user is an admin
    const [userResults] = await connection.promise().query('SELECT id, role FROM Users WHERE email = ?', [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userResults[0].role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Verify request exists and is not completed
    const [requestResults] = await connection.promise().query(
      'SELECT id FROM requests WHERE id = ? AND status != ?',
      [requestId, 'completed']
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    // Update request status to completed
    await connection.promise().query(
      'UPDATE requests SET status = ? WHERE id = ?',
      ['completed', requestId]
    );

    res.status(200).json({ message: 'Request marked as completed', added: true });
  } catch (err) {
    console.error('Error completing request:', err);
    res.status(500).json({ error: `Failed to complete request: ${err.message}` });
  }
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

