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




app.get('/api/getting-requests', (req, res) => {
  const { teacherId } = req.query;  // Use 'id' as the query parameter
  console.log("Teacher ID received:", teacherId);

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher id is required' });
  }

  const requestQuery = `
    SELECT r.id, r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, r.sent
    FROM Requests r
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

app.get('/api/open-or-taken', async (req, res) => {
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
      FROM Requests r
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

app.post('/api/verify-token', (req, res) => {
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




app.post('/api/login', async (req, res) => {
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


app.get('/api/substitute-email', async (req, res) => {
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

app.post('/api/send-substitute-email', (req, res) => {
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
          INSERT INTO Requests (teacher_id, blocks_requested, subject, room, day, notes, sent)
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

              const FRONTEND_URL = process.env.FRONTEND_URL;
              const link = `${FRONTEND_URL}/LinkLogin?token=${acceptToken}&requestId=${requestId}`;
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
              UPDATE Requests
              SET sent = ?
              WHERE id = ?
            `;
            connection.query(updateRequestQuery, [subEmailsString, requestId], (err, updateResult) => {
              if (err) {
                console.error('Error updating request:', err);
                return res.status(500).json({ error: 'Database error updating request' });
              }
              res.json({ message: 'Request processed successfully' });
            });
          }
        });
      }
    });
  });
});




// app.get('/api/sub-open-requests', async (req, res) => {
//   const { subEmail } = req.query;

//   if (!subEmail) return res.status(400).json({ error: 'subEmail required' });

//   try {
//     const [rows] = await connection.execute(`
//       SELECT 
//         r.id, r.teacher_name, r.subject, r.room, r.day, r.notes,
//         JSON_ARRAYAGG(
//           JSON_OBJECT('block', b.block, 'assigned', b.assigned)
//         ) AS blocks
//       FROM requests r
//       JOIN request_blocks b ON r.id = b.request_id
//       WHERE r.status != 'completed'
//       GROUP BY r.id
//     `);

//     const requests = rows.map(row => {
//       const blocks = JSON.parse(row.blocks).map(b => ({
//         block: b.block,
//         assigned: b.assigned,
//         signup_link: b.assigned
//           ? null
//           : `${process.env.FRONTEND_URL}/LinkLogin?token=${jwt.sign(
//             { email: subEmail, requestId: row.id, block: b.block },
//             process.env.JWT_SECRET,
//             { expiresIn: '1y' }
//           )}&requestId=${row.id}`
//       }));

//       return {
//         id: row.id,
//         teacher_name: row.teacher_name,
//         subject: row.subject,
//         room: row.room,
//         day: row.day,
//         notes: row.notes,
//         blocks
//       };
//     });

//     res.json(requests); // ← No filtering
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// test below
// app.get(' http://31.97.141.212:/api/sub-open-requests', async (req, res) => {
//   res.json([{ test: 'Open requests endpoint works' }]);
// });


app.get('/api/teacher-requests', async (req, res) => {
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
      FROM Requests r
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

app.post('/api/complete-request', async (req, res) => {
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
      'SELECT id FROM Requests WHERE id = ? AND teacher_id = ? AND status != ?',
      [requestId, teacherId, 'completed']
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    // Update request status to completed
    await connection.promise().query(
      'UPDATE Requests SET status = ? WHERE id = ?',
      ['completed', requestId]
    );

    res.status(200).json({ message: 'Request marked as completed', added: true });
  } catch (err) {
    console.error('Error completing request:', err);
    res.status(500).json({ error: `Failed to complete request: ${err.message}` });
  }
});


app.post('/api/cancel-request', async (req, res) => {
  const { email, requestId } = req.body;
  if (!email || !requestId) return res.status(400).json({ error: 'Email and requestId are required' });

  try {
    await transporter.verify();

    const [userResults] = await connection.promise().query('SELECT id FROM Users WHERE email = ?', [email]);
    if (!userResults.length) return res.status(404).json({ error: 'Teacher not found' });
    const teacherId = userResults[0].id;

    const [requestResults] = await connection.promise().query(
      `SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.sent,
              t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM Requests r
       JOIN Users t ON r.teacher_id = t.id
       WHERE r.id = ? AND r.teacher_id = ? AND r.status != 'completed'`,
      [requestId, teacherId]
    );
    if (!requestResults.length) return res.status(404).json({ error: 'Request not found or already completed' });

    const request = requestResults[0];
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;
    const sentEmails = request.sent ? [...new Set(request.sent.split(',').map(e => e.trim()))] : [];

    const [assignments] = await connection.promise().query(
      `SELECT ra.block, u.email, u.first_name, u.last_name
       FROM request_assignments ra
       JOIN Users u ON ra.sub_id = u.id
       WHERE ra.request_id = ?`,
      [requestId]
    );

    const assignedSubEmails = [...new Set(assignments.map(a => a.email))];
    const notAssignedEmails = sentEmails.filter(e => !assignedSubEmails.includes(e));

    await connection.promise().query('DELETE FROM request_assignments WHERE request_id = ?', [requestId]);
    await connection.promise().query('DELETE FROM Requests WHERE id = ?', [requestId]);

    if (notAssignedEmails.length) {
      const basicHtml = `
      <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Request Canceled</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        The substitution request by <strong>${teacherName}</strong> has been canceled.
      </p>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day || '-'}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>`; // unchanged
      await Promise.all(notAssignedEmails.map(recipient => transporter.sendMail({
        from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `Request #${requestId} Canceled`,
        html: basicHtml,
      })));
    }

    if (assignments.length) {
      const assignedByEmail = {};
      assignments.forEach(a => {
        if (!assignedByEmail[a.email]) assignedByEmail[a.email] = { name: `${a.first_name} ${a.last_name}`, blocks: [] };
        assignedByEmail[a.email].blocks.push(a.block);
      });

      await Promise.all(Object.entries(assignedByEmail).map(([email, { name, blocks }]) => {
        const warningHtml = `
        <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Your Assignment Canceled</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        <strong>${name}</strong>, your assigned blocks for <strong>${teacherName}</strong>'s request have been canceled.
      </p>
      <div style="background:#ffebee;padding:15px;border-radius:6px;margin:15px 0;">
        <p style="margin:0;font-weight:bold;color:#c62828;">
          CANCELED BLOCKS: ${blocks.join(', ')}
        </p>
      </div>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day || '-'}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>
        `; // unchanged
        return transporter.sendMail({
          from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Your Blocks Canceled – Request #${requestId}`,
          html: warningHtml,
        });
      }));
    }

    res.status(200).json({ message: 'Request canceled successfully', added: true });
  } catch (err) {
    console.error('Error canceling request:', err);
    res.status(500).json({ error: `Failed to cancel request: ${err.message}` });
  }
});







app.post('/api/assign-substitute', async (req, res) => {
  const { token, password, requestId, blocks } = req.body;

  if (!token || !password || !requestId || !Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ error: 'Token, password, requestId, and blocks array are required' });
  }

  try {
    // ---------- 1. Verify JWT ----------
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
    const email = decoded.email;
    if (!email || decoded.requestId !== parseInt(requestId)) {
      throw new Error('Invalid or mismatched token');
    }

    // ---------- 2. Helper: promise-wrapped query ----------
    const query = (sql, params) => new Promise((resolve, reject) => {
      connection.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });

    // ---------- 3. Get substitute (lock row) ----------
    const userResults = await query(
      'SELECT id, first_name, last_name, role FROM Users WHERE email = ? FOR UPDATE',
      [email]
    );
    if (userResults.length === 0) throw new Error('Substitute not found');
    if (password !== 'ea1785ea') throw new Error('Invalid password');
    if (userResults[0].role === 'teacher') throw new Error("You're a teacher!");

    const subId = userResults[0].id;
    const subName = `${userResults[0].first_name} ${userResults[0].last_name}`;

    // ---------- 4. Get request (lock row) ----------
    const requestResults = await query(
      `SELECT r.*, t.email AS teacher_email, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM Requests r
       JOIN Users t ON r.teacher_id = t.id
       WHERE r.id = ? FOR UPDATE`,
      [requestId]
    );
    if (requestResults.length === 0) throw new Error('Request not found or already completed');

    const request = requestResults[0];
    const teacherEmail = request.teacher_email;
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;
    const requestedBlocks = request.blocks_requested
      ? request.blocks_requested.split(',').map(b => b.trim())
      : [];
    const sentEmails = request.sent
      ? [...new Set(request.sent.split(',').map(e => e.trim()))]
      : [];

    // ---------- 5. Validate blocks ----------
    const invalidBlocks = blocks.filter(b => !requestedBlocks.includes(b));
    if (invalidBlocks.length > 0) {
      throw new Error(`Invalid blocks: ${invalidBlocks.join(', ')}`);
    }

    // ---------- 6. Check for conflicts ----------
    const existing = await query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND block IN (?)',
      [requestId, blocks]
    );
    const taken = existing.map(r => r.block);
    const conflict = blocks.filter(b => taken.includes(b));
    if (conflict.length > 0) {
      throw new Error(`Blocks already taken: ${conflict.join(', ')}`);
    }

    // ---------- 7. Insert assignments ----------
    const values = blocks.map(block => [requestId, subId, block]);
    await query(
      'INSERT INTO request_assignments (request_id, sub_id, block) VALUES ?',
      [values]
    );

    // ---------- 8. Check if now fully covered ----------
    const assignedRows = await query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [requestId]
    );
    const assignedBlocks = assignedRows.map(r => r.block);
    const isFullyCovered = requestedBlocks.every(b => assignedBlocks.includes(b));

    // ---------- 9. Email to teacher ----------
    const teacherHtml = `
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Blocks Assigned</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        <strong>${subName}</strong> has signed up for: <strong>${blocks.join(', ')}</strong>
      </p>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day || '-'}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>`;

    await transporter.sendMail({
      from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
      to: teacherEmail,
      subject: `Blocks Assigned: ${blocks.join(', ')}`,
      html: teacherHtml,
    });

    // ---------- 10. If fully covered → final email (NO status change) ----------
    if (isFullyCovered) {
      const finalHtml = `
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Request Fully Covered</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        All blocks for <strong>${teacherName}</strong>'s request have been filled. No further action needed.
      </p>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Blocks:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${requestedBlocks.join(', ')}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day || '-'}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>`;

      const allRecipients = [...sentEmails, teacherEmail].filter((v, i, a) => a.indexOf(v) === i);

      await Promise.all(
        allRecipients.map(recipient =>
          transporter.sendMail({
            from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
            to: recipient,
            subject: 'Request Fully Covered – No More Blocks Available',
            html: finalHtml,
          })
        )
      );
    }

    // ---------- 11. Success ----------
    res.status(200).json({
      message: 'Substitute assigned successfully',
      blocks,
      added: true,
      fullyCovered: isFullyCovered,
    });
  } catch (err) {
    console.error('Assign substitute error:', err);
    res.status(400).json({ error: err.message });
  }
});








// when a sub cancels their assignment
app.patch('/api/requests/:id/cancel-substitute', async (req, res) => {
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
      'FROM Requests r JOIN Users u ON r.teacher_id = u.id WHERE r.id = ?',
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


app.get('/api/get-everything', async (req, res) => {
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
      FROM Requests r
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

app.get('/api/edit-request/:requestId', (req, res) => {

  const requestId = req.params.requestId;
  console.log('Received requestId:', requestId); // Log to confirm route is hit
  const query = 'SELECT * FROM Requests WHERE id = ?';

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


app.put('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  const { teacher_id, blocks_requested, subject, room, day, notes, sent } = updatedData;

  // === VALIDATE required fields ===
  if (!teacher_id || !blocks_requested || !subject || !room || !day) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // === Normalize blocks_requested to comma-separated string ===
  const blocksStr = Array.isArray(blocks_requested)
    ? blocks_requested.join(',')
    : String(blocks_requested);

  // === SQL: Remove `subs` column (doesn't exist) ===
  const query = `
    UPDATE Requests
    SET 
        teacher_id = ?,
        blocks_requested = ?,
        subject = ?,
        room = ?,
        day = ?,
        notes = ?,
        sent = ?
    WHERE id = ?
  `;

  connection.execute(
    query,
    [teacher_id, blocksStr, subject, room, day, notes, sent || null, id],
    (err, result) => {
      if (err) {
        console.error('Error updating request:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.status(200).json({ message: 'Request updated successfully' });
    }
  );
});


app.get('/api/get-subs', (req, res) => {
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

app.get('/api/get-teacher-ids', (req, res) => {
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

app.get('/api/get-users', (req, res) => {
  const query = 'SELECT * FROM Users';

  connection.query(query, [], (error, results) => {
    if (error) {
      console.error('Error fetching substitutes:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results); // Send the query result back as JSON
  });

});

app.post('/api/add-user', (req, res) => {
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

app.delete('/api/delete-user/:id', (req, res) => {
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

app.patch('/api/update-user/:id', (req, res) => {
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

app.get('/api/check-request', (req, res) => {
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



app.patch('/api/requests/:id/complete', async (req, res) => {
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
      'FROM Requests r JOIN Users u ON r.teacher_id = u.id WHERE r.id = ?',
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
        'UPDATE Requests SET status = "completed" WHERE id = ?',
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



app.get('/api/admin-requests', async (req, res) => {
  const { page = 1, limit = 10, includeCompleted = 'false' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const showCompleted = includeCompleted === 'true';
    const whereClause = showCompleted
      ? '1'
      : '(r.status = "uncompleted" OR r.status = "pending" OR r.status = "in_progress")';

    const requestQuery = `
      SELECT 
        r.id, r.day, r.subject, r.room, r.notes, r.blocks_requested, r.status,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher,
        u.email AS teacher_email
      FROM Requests r
      JOIN Users u ON r.teacher_id = u.id
      WHERE ${whereClause}
      ORDER BY r.id DESC
      LIMIT ? OFFSET ?
    `;


    const [requestResults] = await connection.promise().query(requestQuery, [parseInt(limit), parseInt(offset)]);

    const formattedResults = await Promise.all(
      requestResults.map(async (request) => {
        const blocksRequested = request.blocks_requested
          ? request.blocks_requested.split(',').map(b => b.trim())
          : [];

        const [assignmentResults] = await connection.promise().query(
          `SELECT ra.block, CONCAT(u.first_name, ' ', u.last_name) AS substitute_name, u.email AS substitute_email
           FROM request_assignments ra
           JOIN Users u ON ra.sub_id = u.id
           WHERE ra.request_id = ?`,
          [request.id]
        );

        const assignedBlocks = assignmentResults.map(a => a.block);
        const blocks = blocksRequested.map(block => ({
          block,
          assigned: assignedBlocks.includes(block),
          substitute_name: assignmentResults.find(a => a.block === block)?.substitute_name || null,
          substitute_email: assignmentResults.find(a => a.block === block)?.substitute_email || null,
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

    const countQuery = `
      SELECT COUNT(*) as total
      FROM Requests r
      JOIN Users u ON r.teacher_id = u.id
      WHERE ${whereClause}
    `;
    const [[{ total }]] = await connection.promise().query(countQuery);

    res.status(200).json({ requests: formattedResults, total });
  } catch (err) {
    console.error('Error in /api/admin-requests:', err);
    res.status(500).json({ error: 'Failed to fetch admin requests' });
  }
});






app.post('/api/accept-request', async (req, res) => {
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
      'SELECT blocks_requested FROM Requests WHERE id = ? AND status != "completed"',
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


app.get('/api/substitute-requests', async (req, res) => {
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
      FROM Requests r
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



app.post('/api/cancel-assignment', async (req, res) => {
  const { email, requestId } = req.body;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // Get canceling substitute's ID and name
    const [subResults] = await connection.promise().query(
      'SELECT id, first_name, last_name FROM Users WHERE email = ?',
      [email]
    );
    if (subResults.length === 0) {
      return res.status(404).json({ error: 'Substitute not found' });
    }
    const subId = subResults[0].id;
    const subName = `${subResults[0].first_name} ${subResults[0].last_name}`;

    // Get request + teacher + sent list
    const [requestResults] = await connection.promise().query(
      `SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.sent,
              t.email AS teacher_email, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM Requests r
       JOIN Users t ON r.teacher_id = t.id
       WHERE r.id = ? AND r.status != 'completed'`,
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

    // Get blocks being canceled
    const [assignmentResults] = await connection.promise().query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND sub_id = ?',
      [requestId, subId]
    );
    if (assignmentResults.length === 0) {
      return res.status(404).json({ error: 'No assignments found for this substitute' });
    }
    const canceledBlocks = assignmentResults.map(a => a.block);

    // === Check if was fully covered BEFORE cancel ===
    const [beforeResults] = await connection.promise().query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [requestId]
    );
    const wasFullyCovered = requestedBlocks.every(b => beforeResults.some(r => r.block === b));

    // === DELETE assignments ===
    await connection.promise().query(
      'DELETE FROM request_assignments WHERE request_id = ? AND sub_id = ?',
      [requestId, subId]
    );

    // === Check open blocks AFTER cancel ===
    const [afterResults] = await connection.promise().query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [requestId]
    );
    const afterAssigned = afterResults.map(r => r.block);
    const hasOpenBlocks = requestedBlocks.some(b => !afterAssigned.includes(b));
    const openBlocks = requestedBlocks.filter(b => !afterAssigned.includes(b));

    // === ALWAYS notify teacher ===
    const teacherHtml = `
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Blocks Canceled</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        <strong>${subName}</strong> has canceled their assignment for:
      </p>
      <p style="background:#ffebee;padding:15px;border-radius:6px;font-weight:bold;color:#c62828;">
        ${canceledBlocks.join(', ')}
      </p>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day || '-'}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>`;

    await transporter.sendMail({
      from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
      to: teacherEmail,
      subject: `Blocks Canceled by ${subName} – Request #${requestId}`,
      html: teacherHtml,
    });

    // === Notify other subs ONLY if was full → now has openings ===
    if (wasFullyCovered && hasOpenBlocks) {
      const subHtml = `
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Blocks Now Available</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        <strong>${subName}</strong> has canceled. The following blocks are now open:
      </p>
      <p style="background:#e8f5e8;padding:15px;border-radius:6px;font-weight:bold;color:#2e7d32;">
        ${openBlocks.join(', ')}
      </p>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day || '-'}</td></tr>
      </table>
      <p style="margin-top:20px;">
        <a href="${process.env.APP_URL}/assign?requestId=${requestId}" 
           style="background:rgb(20,54,100);color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Claim These Blocks
        </a>
      </p>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>`;

      const otherSubEmails = sentEmails.filter(e => e !== email);
      if (otherSubEmails.length > 0) {
        await Promise.all(
          otherSubEmails.map(recipient =>
            transporter.sendMail({
              from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
              to: recipient,
              subject: `Blocks Available: ${openBlocks.join(', ')} – Request #${requestId}`,
              html: subHtml,
            })
          )
        );
      }
    }

    res.status(200).json({ message: 'Assignment canceled successfully', added: true });
  } catch (err) {
    console.error('Error canceling assignment:', err);
    res.status(500).json({ error: `Failed to cancel assignment: ${err.message}` });
  }
});




app.post('/api/admin-complete-request', async (req, res) => {
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
      'SELECT id FROM Requests WHERE id = ? AND status != ?',
      [requestId, 'completed']
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    // Update request status to completed
    await connection.promise().query(
      'UPDATE Requests SET status = ? WHERE id = ?',
      ['completed', requestId]
    );

    res.status(200).json({ message: 'Request marked as completed', added: true });
  } catch (err) {
    console.error('Error completing request:', err);
    res.status(500).json({ error: `Failed to complete request: ${err.message}` });
  }
});



app.delete('/api/requests/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { email } = req.query;

  if (!email || !requestId)
    return res.status(400).json({ error: 'Email and requestId are required' });

  try {
    await transporter.verify();

    // 🔹 Lookup user
    const [userResults] = await connection
      .promise()
      .query('SELECT id, role FROM Users WHERE email = ?', [email]);

    if (!userResults.length)
      return res.status(404).json({ error: 'User not found' });

    const { id: teacherId, role } = userResults[0];
    const isAdmin =
      email.toLowerCase().includes('admin@ea') ||
      role?.toLowerCase() === 'admin';

    // 🔹 Build query (admins can cancel any request)
    console.log('isAdmin:', isAdmin, 'requestId:', requestId, 'email:', email);
    let query = `
      SELECT r.*, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
      FROM Requests r
      JOIN Users t ON r.teacher_id = t.id
      WHERE r.id = ? AND r.status != 'completed'
    `;
    const params = [requestId];

    if (!isAdmin) {
      query = query.replace('AND r.status !=', 'AND r.teacher_id = ? AND r.status !=');
      params.splice(1, 0, teacherId);
    }

    // 🔹 Fetch request
    const [requestResults] = await connection.promise().query(query, params);
    if (!requestResults.length)
      return res
        .status(404)
        .json({ error: 'Request not found or already completed' });

    const request = requestResults[0];
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;
    const sentEmails = request.sent
      ? [...new Set(request.sent.split(',').map((e) => e.trim()))]
      : [];

    // 🔹 Get assignments
    const [assignments] = await connection.promise().query(
      `SELECT ra.block, u.email, u.first_name, u.last_name
       FROM request_assignments ra
       JOIN Users u ON ra.sub_id = u.id
       WHERE ra.request_id = ?`,
      [requestId]
    );

    const assignedEmails = [...new Set(assignments.map((a) => a.email))];
    const notAssignedEmails = sentEmails.filter(
      (e) => !assignedEmails.includes(e)
    );

    // 🔹 Send email to non-assigned substitutes
    if (notAssignedEmails.length) {
      const html = `
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Request Canceled</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        The substitution request by <strong>${teacherName}</strong> has been canceled.
      </p>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;">${request.day || '-'}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>`;
      await Promise.all(
        notAssignedEmails.map((recipient) =>
          transporter.sendMail({
            from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
            to: recipient,
            subject: `Request #${requestId} Canceled`,
            html,
          })
        )
      );
    }

    // 🔹 Send email to assigned substitutes
    if (assignments.length) {
      const grouped = {};
      assignments.forEach((a) => {
        if (!grouped[a.email])
          grouped[a.email] = { name: `${a.first_name} ${a.last_name}`, blocks: [] };
        grouped[a.email].blocks.push(a.block);
      });

      await Promise.all(
        Object.entries(grouped).map(([subEmail, { name, blocks }]) => {
          const html = `
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
    <tr><td style="padding:30px;">
      <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Your Assignment Canceled</h2>
      <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
        <strong>${name}</strong>, your assigned blocks for <strong>${teacherName}</strong>'s request have been canceled.
      </p>
      <div style="background:#ffebee;padding:15px;border-radius:6px;margin:15px 0;">
        <p style="margin:0;font-weight:bold;color:#c62828;">
          CANCELED BLOCKS: ${blocks.join(', ')}
        </p>
      </div>
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
        <tr><td style="border:1px solid #e0e0e0;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;">${request.day || '-'}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
      <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
      <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
    </td></tr>
  </table>
</body></html>`;
          return transporter.sendMail({
            from: `"Substitute Scheduler" <${process.env.EMAIL_USER}>`,
            to: subEmail,
            subject: `Your Blocks Canceled – Request #${requestId}`,
            html,
          });
        })
      );
    }

    // 🔹 Delete request and assignments
    await connection
      .promise()
      .query('DELETE FROM request_assignments WHERE request_id = ?', [
        requestId,
      ]);
    await connection.promise().query('DELETE FROM Requests WHERE id = ?', [
      requestId,
    ]);

    res.status(200).json({
      message: 'Request canceled successfully',
      deleted: true,
      canceledBy: isAdmin ? 'admin' : 'teacher',
    });
  } catch (err) {
    console.error('Error canceling request:', err);
    res.status(500).json({ error: `Failed to cancel request: ${err.message}` });
  }
});




// app.use(express.static('public'));


const path = require('path');

// Serve React build folder (assuming it's at ../build)
app.use(express.static(path.join(__dirname, '../build')));

// Optional: log requests for debugging
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Catch-all route — send React app for non-API routes
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  } else {
    res.status(404).send('API route not found');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://31.97.141.212:${port}`);
});