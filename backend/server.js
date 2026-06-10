require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); // unchanged


// With this
const express = require('express');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('./db.js');
const path = require('path');

// =====================
// DEBUG LOGS (OPTIONAL)
// =====================
console.log('Dotenv loaded');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);

// =====================
// APP SETUP
// =====================
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());


// server.js

const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL at 127.0.0.1:3306');
    connection.release();
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    // Do NOT call connection.release() here
  }
};

checkConnection();

// =====================
// EMAIL TRANSPORTER
// =====================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error configuring transporter:', error);
  } else {
    console.log('Transporter configured and ready');
  }
});



app.get('/api/getting-requests', async (req, res) => {
  const { teacherId } = req.query;

  if (!teacherId) {
    return res.status(400).json({ error: 'Teacher id is required' });
  }

  const requestQuery = `
    SELECT r.id, r.blocks_requested, r.subject, r.room, r.day, r.subs, r.notes, r.sent
    FROM Requests r
    WHERE r.teacher_id = ?
  `;

  try {
    const [results] = await pool.query(requestQuery, [teacherId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No requests found for this teacher ID' });
    }

    const formattedResults = results.map(row => ({
      id: row.id,
      blocks_requested: row.blocks_requested,
      subject: row.subject,
      room: row.room,
      day: row.day,
      subs: row.subs,
      notes: row.notes,
      sent: row.sent,
    }));

    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error getting requests with teacher ID', err);
    res.status(500).json({ error: 'Database query error' });
  }
});





app.get('/api/open-or-taken', async (req, res) => {
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

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

  try {
    // Use pool.query instead of connection
    const [results] = await pool.query(query, [requestId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Request not found or completed' });
    }

    const request = results[0];
    const assignments = JSON.parse(request.assignments || '[]');
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


app.post('/api/verify-token', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // jwt.verify is callback-based, so wrap in a Promise
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    res.json({
      user: {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      },
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});





app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
      console.error('Missing JWT_SECRET or JWT_EXPIRES_IN');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const query = 'SELECT * FROM Users WHERE email = ?';
    const [results] = await pool.query(query, [email]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];

    // Temporary fixed password logic
    if (password !== '234rfawerf') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('Login success for:', email);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        departments: user.departments,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});





app.get('/api/check-chair', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const query = 'SELECT departments FROM Users WHERE email = ?';
    const [results] = await pool.query(query, [email]);

    if (!results.length) {
      return res.json({ isChair: false });
    }

    const isChair = results[0].departments?.includes('Chair') || false;
    res.json({ isChair });
  } catch (err) {
    console.error('Error checking chair status:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});





app.get('/api/substitute-email', async (req, res) => {
  const { first_name, last_name } = req.query;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  try {
    // ✅ CHANGED: Use pool.query instead of connection.promise().query
    const [results] = await pool.query(
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



app.post('/api/send-substitute-email', async (req, res) => {
  try {
    // Verify transporter connection
    await transporter.verify();

    const {
      teacherEmail,
      date,
      room,
      blocks = '',
      subject,
      notes = '',
      teacherId,
      selectedSubs,
      adminEmail, // Received from selectedChairEmail in the frontend
    } = req.body;

    // Validation
    if (!teacherEmail || !date || !room || !teacherId || !adminEmail) {
      return res.status(400).json({
        error: 'Missing required fields: teacherEmail, date, room, teacherId, or adminEmail',
      });
    }

    if (!Array.isArray(selectedSubs)) {
      return res.status(400).json({ error: 'selectedSubs must be an array' });
    }

    // 1. Fetch teacher name for the email subject/body
    const [teacherResults] = await pool.query(
      'SELECT first_name, last_name FROM Users WHERE id = ?',
      [teacherId]
    );

    if (!teacherResults.length) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const { first_name: firstName, last_name: lastName } = teacherResults[0];
    const subEmailsString = selectedSubs.map(item => item.email).join(',') || null;

    // 2. Insert request into DB including admin_email
    const insertQuery = `
      INSERT INTO Requests (teacher_id, blocks_requested, subject, room, day, notes, sent, admin_email, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'uncompleted')
    `;
    
    const [insertResult] = await pool.query(insertQuery, [
      teacherId,
      blocks,
      subject,
      room,
      date,
      notes,
      subEmailsString,
      adminEmail, // Saving the chair email to your database
    ]);

    const requestId = insertResult.insertId;

    // 3. Prepare Email Template (Reusable)
    const generateEmailHtml = (isChair = false, link = '') => `
      <html lang="en">
      <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr><td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;"></td></tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">
                ${isChair ? 'Notification: Substitute Request' : 'Substitute Request'}
              </h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                ${isChair 
                  ? `This is a copy of a substitute request sent on behalf of <strong>${firstName} ${lastName}</strong> for your records.` 
                  : `A new substitute request is available from <strong>${firstName} ${lastName}</strong>.`}
              </p>
              <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Date:</strong></td><td style="border: 1px solid #e0e0e0;">${date}</td></tr>
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Room:</strong></td><td style="border: 1px solid #e0e0e0;">${room}</td></tr>
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Blocks:</strong></td><td style="border: 1px solid #e0e0e0;">${blocks || 'Not specified'}</td></tr>
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Notes:</strong></td><td style="border: 1px solid #e0e0e0;">${notes || 'None'}</td></tr>
              </table>
              ${!isChair ? `
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${link}" style="background-color: rgb(175, 214, 241); color: rgb(20, 54, 100); padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block;">Sign Up for This Request</a>
                </p>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="background-color: rgb(30, 64, 110); color: #ffffff; padding: 15px; text-align: center; font-size: 14px;">
              <p style="margin: 0;">Substitute Scheduler | The Episcopal Academy</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailPromises = [];

    // 4. Send email to the Department Chair (CC / Notification Only)
    emailPromises.push(
      transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: adminEmail,
        subject: `[DEPT CHAIR COPY] Substitute Request for ${firstName} ${lastName}`,
        html: generateEmailHtml(true),
      })
    );

    // 5. Send individual emails with login tokens to each selected substitute
    if (selectedSubs.length > 0) {
      const FRONTEND_URL = process.env.FRONTEND_URL;
      
      const subPromises = selectedSubs.map((sub) => {
        const token = jwt.sign(
          { email: sub.email, requestId },
          process.env.JWT_SECRET,
          { expiresIn: '1y' }
        );

        const link = `${FRONTEND_URL}/LinkLogin?token=${token}&requestId=${requestId}`;
        
        return transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: sub.email,
          subject: `Substitute Request for ${firstName} ${lastName}`,
          html: generateEmailHtml(false, link),
        });
      });

      emailPromises.push(...subPromises);
    }

    // Wait for all emails (Chair + Subs) to finish
    await Promise.all(emailPromises);

    res.json({ 
      message: 'Request processed and emails sent successfully.',
      requestId 
    });

  } catch (err) {
    console.error('Error in /api/send-substitute-email:', err);
    res.status(500).json({ error: 'Failed to process substitute email request' });
  }
});


app.get('/api/sub-open-requests', async (req, res) => {
  const { subEmail } = req.query;

  if (!subEmail) {
    return res.status(400).json({ error: 'subEmail required' });
  }

  try {
    const query = `
      SELECT
        r.id,
        r.day,
        r.subject,
        r.room,
        r.notes,
        t.first_name,
        t.last_name,
        t.email AS teacher_email,
        r.blocks_requested,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT('block', ra.block, 'assigned', TRUE)
            )
            FROM request_assignments ra
            WHERE ra.request_id = r.id
          ),
          '[]'
        ) AS assigned_blocks
      FROM Requests r
      JOIN Users t ON r.teacher_id = t.id
      WHERE r.status != 'completed'
      GROUP BY r.id
    `;

    const [rows] = await pool.query(query);

    // 1. EXACT SAME variable name and source as send-substitute-email
    const FRONTEND_URL = process.env.FRONTEND_URL;

    const requests = rows.map(row => {
      // 2. Define requestId explicitly so the template string ${requestId} works
      const requestId = row.id;

      const requested = row.blocks_requested
        ? row.blocks_requested.split(',').map(b => b.trim())
        : [];

      const assigned = JSON.parse(row.assigned_blocks).map(a => a.block);

      const blocks = requested.map(block => {
        const isAssigned = assigned.includes(block);

        // 3. EXACT SAME token generation logic
        const token = jwt.sign(
          { email: subEmail, requestId },
          process.env.JWT_SECRET,
          { expiresIn: '1y' }
        );

        // 4. EXACT SAME link construction
        const link = `${FRONTEND_URL}/LinkLogin?token=${token}&requestId=${requestId}`;

        return {
          block,
          assigned: isAssigned,
          signup_link: isAssigned ? null : link,
        };
      });

      return {
        id: row.id,
        teacher_name: `${row.first_name} ${row.last_name}`,
        teacher_email: row.teacher_email,
        subject: row.subject,
        room: row.room,
        day: row.day,
        notes: row.notes,
        blocks,
      };
    });

    res.json(requests);
  } catch (err) {
    console.error('Error in /api/sub-open-requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/api/teacher-requests', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // --- helper: normalize date ---
  function formatDateToMDY(dateStr) {
    if (!dateStr) return '';

    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${parseInt(m)}-${parseInt(d)}-${y}`;
    }

    return dateStr;
  }

  try {
    const [userResults] = await pool
      .query('SELECT id FROM Users WHERE email = ?', [email]);

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacherId = userResults[0].id;

    const [requestResults] = await pool.query(
      `
        SELECT 
          id, day, subject, room, notes,
          blocks_requested,
          sent,
          status
        FROM Requests
        WHERE teacher_id = ? AND status != 'completed'
      `,
      [teacherId]
    );

    const formattedResults = await Promise.all(
      requestResults.map(async request => {
        // --- parse blocks_requested ---
        const blocksRequested = request.blocks_requested
          ? request.blocks_requested.split(',').map(b => b.trim())
          : [];

        // --- fix sent (Buffer → string → array) ---
        const rawSent =
          request.sent == null
            ? ''
            : Buffer.isBuffer(request.sent)
              ? request.sent.toString('utf8')
              : request.sent;

        const sentList = rawSent
          ? rawSent.split(',').map(s => s.trim())
          : [];

        // --- get assignments ---
        const [assignmentResults] = await pool.query(
          `
            SELECT 
              ra.block,
              CONCAT(u.first_name, ' ', u.last_name) AS substitute_name,
              u.email AS substitute_email
            FROM request_assignments ra
            JOIN Users u ON ra.sub_id = u.id
            WHERE ra.request_id = ?
          `,
          [request.id]
        );

        const assignedBlocks = assignmentResults.map(a => a.block);

        const blocks = blocksRequested.map(block => {
          const match = assignmentResults.find(a => a.block === block);
          return {
            block,
            assigned: !!match,
            substitute_name: match ? match.substitute_name : null,
            substitute_email: match ? match.substitute_email : null,
          };
        });

        return {
          id: request.id,
          day: formatDateToMDY(request.day), 
          subject: request.subject,
          room: request.room,
          notes: request.notes,
          blocks,
          sent: sentList,                   
          status: request.status
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
    const [userResults] = await pool.query('SELECT id FROM Users WHERE email = ?', [email]);
    if (userResults.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const teacherId = userResults[0].id;

    // Verify request belongs to teacher and is not completed
    const [requestResults] = await pool.query(
      'SELECT id FROM Requests WHERE id = ? AND teacher_id = ? AND status != ?',
      [requestId, teacherId, 'completed']
    );
    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found or already completed' });
    }

    // Update request status to completed
    await pool.query(
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
  if (!email || !requestId)
    return res.status(400).json({ error: 'Email and requestId are required' });

  try {
    // verify SMTP transporter connection
    await transporter.verify();

    // fetch teacher id
    const [userResults] = await pool.query(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    );
    if (!userResults.length)
      return res.status(404).json({ error: 'Teacher not found' });

    const teacherId = userResults[0].id;

    // get request data
    const [requestResults] = await pool.query(
      `SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.sent,
              t.first_name AS teacher_first_name, t.last_name AS teacher_last_name
       FROM Requests r
       JOIN Users t ON r.teacher_id = t.id
       WHERE r.id = ? AND r.teacher_id = ? AND r.status != 'completed'`,
      [requestId, teacherId]
    );

    if (!requestResults.length)
      return res
        .status(404)
        .json({ error: 'Request not found or already completed' });

    const request = requestResults[0];
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;
    const sentEmails = request.sent
      ? [...new Set(
        request.sent
          .split(',')
          .map(e => e.trim())
          .filter(e => e)
      )]
      : [];


    // fetch assigned substitutes
    const [assignments] = await pool.query(
      `SELECT ra.block, u.email, u.first_name, u.last_name
       FROM request_assignments ra
       JOIN Users u ON ra.sub_id = u.id
       WHERE ra.request_id = ?`,
      [requestId]
    );

    const assignedSubEmails = [...new Set(assignments.map(a => a.email))];
    const notAssignedEmails = sentEmails.filter(
      e => !assignedSubEmails.includes(e)
    );

    // delete from DB
    await pool.query(
      'DELETE FROM request_assignments WHERE request_id = ?',
      [requestId]
    );
    await pool.query('DELETE FROM Requests WHERE id = ?', [
      requestId,
    ]);

    // EMAIL #1 – notify all unassigned subs (originally emailed but not accepted)
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
</body></html>`;

      await Promise.all(
        notAssignedEmails.map(recipient =>
          transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: recipient,
            subject: `Request #${requestId} Canceled`,
            html: basicHtml,
          })
        )
      );
    }

    // EMAIL #2 – notify assigned subs (accepted the job)
    if (assignments.length) {
      const assignedByEmail = {};
      assignments.forEach(a => {
        if (!assignedByEmail[a.email])
          assignedByEmail[a.email] = {
            name: `${a.first_name} ${a.last_name}`,
            blocks: [],
          };
        assignedByEmail[a.email].blocks.push(a.block);
      });

      await Promise.all(
        Object.entries(assignedByEmail).map(([email, { name, blocks }]) => {
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
</body></html>`;

          return transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: `Your Blocks Canceled – Request #${requestId}`,
            html: warningHtml,
          });
        })
      );
    }

    res
      .status(200)
      .json({ message: 'Request canceled successfully', added: true });
  } catch (err) {
    console.error('Error canceling request:', err);
    res
      .status(500)
      .json({ error: `Failed to cancel request: ${err.message}` });
  }
});



app.post('/api/assign-substitute', async (req, res) => {
  const { token, password, requestId, blocks } = req.body;

  // Validation
  if (!token || !password || !requestId || !Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ 
      error: 'Token, password, requestId, and non-empty blocks array are required' 
    });
  }

  try {
    // 1. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    if (!email || decoded.requestId !== parseInt(requestId)) {
      throw new Error('Invalid or mismatched token');
    }

    // 2. Get substitute info (with row lock)
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, role FROM Users WHERE email = ? FOR UPDATE',
      [email]
    );

    if (!users.length) {
      throw new Error('Substitute not found');
    }

    const user = users[0];

    if (password !== 'ea1785ea') {
      throw new Error('Invalid password');
    }

    if (user.role === 'teacher') {
      throw new Error("Teachers cannot sign up as substitutes");
    }

    const subId = user.id;
    const subName = `${user.first_name} ${user.last_name}`;

    // 3. Get request details + lock row
    const [requests] = await pool.query(
      `SELECT r.*, 
              t.email AS teacher_email, 
              t.first_name AS teacher_first_name, 
              t.last_name AS teacher_last_name,
              r.admin_email
       FROM Requests r
       JOIN Users t ON r.teacher_id = t.id
       WHERE r.id = ? FOR UPDATE`,
      [requestId]
    );

    if (!requests.length) {
      throw new Error('Request not found');
    }

    const request = requests[0];
    const teacherEmail = request.teacher_email;
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;
    const adminEmail = request.admin_email || null;

    const requestedBlocks = request.blocks_requested
      ? request.blocks_requested.split(',').map(b => b.trim())
      : [];

    const sentEmails = request.sent
      ? [...new Set(request.sent.split(',').map(e => e.trim()).filter(Boolean))]
      : [];

    // 4. Validate requested blocks
    const invalidBlocks = blocks.filter(b => !requestedBlocks.includes(b));
    if (invalidBlocks.length > 0) {
      throw new Error(`Invalid blocks requested: ${invalidBlocks.join(', ')}`);
    }

    // 5. Check for already assigned blocks
    const [existing] = await pool.query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND block IN (?)',
      [requestId, blocks]
    );

    const takenBlocks = existing.map(r => r.block);
    const conflicts = blocks.filter(b => takenBlocks.includes(b));

    if (conflicts.length > 0) {
      throw new Error(`The following blocks are already taken: ${conflicts.join(', ')}`);
    }

    // 6. Insert new assignments
    const values = blocks.map(block => [requestId, subId, block]);
    await pool.query(
      'INSERT INTO request_assignments (request_id, sub_id, block) VALUES ?',
      [values]
    );

    // 7. Check if request is now fully covered
    const [assignedRows] = await pool.query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [requestId]
    );

    const assignedBlocks = assignedRows.map(r => r.block);
    const isFullyCovered = requestedBlocks.every(b => assignedBlocks.includes(b));

    // 8. Email to teacher (+ admin if exists)
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

    const recipients = [teacherEmail];
    if (adminEmail) recipients.push(adminEmail);

    await Promise.all(
      recipients.map(recipient =>
        transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: recipient,
          subject: `Blocks Assigned: ${blocks.join(', ')} – ${request.day}`,
          html: teacherHtml,
        })
      )
    );

    // 9. If fully covered → send notification to all relevant parties
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

      const allRecipients = [...new Set([
        ...sentEmails,
        teacherEmail,
        ...(adminEmail ? [adminEmail] : [])
      ].filter(Boolean))];

      await Promise.all(
        allRecipients.map(recipient =>
          transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: recipient,
            subject: `Fully Covered: ${teacherName} – ${request.day}`,
            html: finalHtml,
          })
        )
      );
    }

    // Success response
    return res.status(200).json({
      message: 'Substitute assigned successfully',
      blocks,
      added: true,
      fullyCovered: isFullyCovered,
    });

  } catch (err) {
    console.error('Assign substitute error:', err);
    
    const status = err.message.includes('Invalid') || err.message.includes('not found') 
      ? 400 
      : 500;
    
    return res.status(status).json({ 
      error: err.message || 'Failed to assign substitute' 
    });
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
    // 1. Get substitute ID
    const [subs] = await pool.query(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    );

    if (!subs.length) {
      return res.status(404).json({ error: 'Substitute not found' });
    }

    const subId = subs[0].id;

    // 2. Verify the assignment actually exists
    const [assignments] = await pool.query(
      'SELECT 1 FROM request_assignments WHERE request_id = ? AND sub_id = ? AND block = ?',
      [id, subId, block]
    );

    if (!assignments.length) {
      return res.status(404).json({ error: 'This block assignment was not found' });
    }

    // 3. Get request + teacher information
    const [requests] = await pool.query(
      `SELECT r.subject, r.room, r.day, r.notes,
              u.first_name, u.last_name, u.email AS teacher_email
       FROM Requests r
       JOIN Users u ON r.teacher_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (!requests.length) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];
    const teacherName = `${request.first_name} ${request.last_name}`;
    const teacherEmail = request.teacher_email;

    // 4. Delete the specific assignment
    const [deleteResult] = await pool.query(
      'DELETE FROM request_assignments WHERE request_id = ? AND sub_id = ? AND block = ?',
      [id, subId, block]
    );

    // This check is technically redundant after previous existence check,
    // but kept for extra safety
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Block assignment not found' });
    }

    // 5. Prepare notification recipients
    // Note: Sending to ALL substitutes might be too broad.
    // Consider sending only to substitutes who previously received this request
    // (using r.sent field) if that data is available.
    const [otherSubs] = await pool.query(
      'SELECT email FROM Users WHERE role = "substitute" AND email != ?',
      [email]
    );

    const recipients = [
      teacherEmail,
      ...otherSubs.map(s => s.email)
    ].filter(Boolean);

    // Remove duplicates (though unlikely)
    const uniqueRecipients = [...new Set(recipients)];

    // 6. Send notification email if there are recipients
    if (uniqueRecipients.length > 0) {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Substitute Block Now Available</title>
        </head>
        <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
          <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <tr><td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;"></td></tr>
            <tr>
              <td style="padding: 30px;">
                <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">
                  Substitute Block Now Available
                </h2>
                <p style="color: #333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                  The <strong>${block}</strong> block for <strong>${teacherName}</strong> 
                  is available again due to a cancellation.
                </p>
                <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333;">
                  <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Block:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${block}</td></tr>
                  <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.subject || '-'}</td></tr>
                  <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
                  <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day || '-'}</td></tr>
                  <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Notes:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.notes || 'None'}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color: rgb(30,64,110); color:#fff; padding:15px; text-align:center; font-size:14px;">
                <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
                <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: uniqueRecipients.join(','),
          subject: `Block ${block} Available Again – ${teacherName}`,
          html,
        });

        return res.status(200).json({
          message: 'Block assignment cancelled and notification emails sent',
          cancelledBlock: block
        });
      } catch (emailErr) {
        console.error('Failed to send cancellation notification:', emailErr);
        // Still return success - email failure is not critical
        return res.status(200).json({
          message: 'Block assignment cancelled (email notification failed)',
          cancelledBlock: block,
          emailError: true
        });
      }
    }

    // No recipients → just success
    return res.status(200).json({
      message: 'Block assignment cancelled successfully',
      cancelledBlock: block
    });

  } catch (err) {
    console.error('Error in cancel-substitute endpoint:', err);
    return res.status(500).json({
      error: 'Failed to cancel substitute assignment'
    });
  }
});


// 1. GET /api/get-everything
// Returns all requests with their current assignments
app.get('/api/get-everything', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id, 
        r.teacher_id, 
        r.blocks_requested, 
        r.subject, 
        r.room, 
        r.day, 
        r.status,
        t.first_name, 
        t.last_name,
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
            WHERE ra.request_id = r.id 
              AND ra.block IS NOT NULL
          ),
          '[]'
        ) AS assignments
      FROM Requests r
      JOIN Users t ON r.teacher_id = t.id
      GROUP BY r.id, r.teacher_id, r.blocks_requested, r.subject, r.room, r.day, r.status, 
               t.first_name, t.last_name
      ORDER BY r.id DESC
    `;

    const [results] = await pool.query(query);

    const formattedResults = results.map(row => ({
      ...row,
      assignments: row.assignments ? JSON.parse(row.assignments) : []
    }));

    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error fetching all requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// 2. GET /api/edit-request/:requestId
// Get single request details for editing
app.get('/api/edit-request/:requestId', async (req, res) => {
  const { requestId } = req.params;

  try {
    const [results] = await pool.query(
      'SELECT * FROM Requests WHERE id = ?',
      [requestId]
    );

    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Request not found',
        requestId 
      });
    }

    // Return first (and only) matching row
    res.status(200).json(results[0]);
  } catch (err) {
    console.error(`Error fetching request ${requestId}:`, err);
    res.status(500).json({ error: 'Failed to fetch request details' });
  }
});

// 3. PUT /api/requests/:id
// Update existing request
app.put('/api/requests/:id', async (req, res) => {
  const { id } = req.params;
  const {
    teacher_id,
    blocks_requested,
    subject,
    room,
    day,
    notes,
    sent
  } = req.body;

  // Basic validation
  if (!teacher_id || !blocks_requested || !subject || !room || !day) {
    return res.status(400).json({ 
      error: 'Missing required fields (teacher_id, blocks_requested, subject, room, day)' 
    });
  }

  // Normalize blocks_requested to comma-separated string
  const blocksStr = Array.isArray(blocks_requested)
    ? blocks_requested.join(',')
    : String(blocks_requested).trim();

  try {
    const [result] = await pool.query(
      `UPDATE Requests
       SET 
         teacher_id = ?,
         blocks_requested = ?,
         subject = ?,
         room = ?,
         day = ?,
         notes = ?,
         sent = ?
       WHERE id = ?`,
      [teacher_id, blocksStr, subject, room, day, notes || null, sent || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Request not found or no changes were made',
        requestId: id 
      });
    }

    res.status(200).json({ 
      message: 'Request updated successfully',
      requestId: id 
    });
  } catch (err) {
    console.error(`Error updating request ${id}:`, err);
    
    if (err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ error: 'Invalid teacher_id - user does not exist' });
    }
    
    res.status(500).json({ error: 'Failed to update request' });
  }
});


// Helper function (unchanged - good as is)
const formatDeptsForDB = (depts) => {
  if (Array.isArray(depts)) return depts.join(',');
  return depts || "";
};





app.get('/api/get-subs', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT * FROM Users WHERE role = ?',
      ['substitute']
    );
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching substitutes:', err);
    res.status(500).json({ error: 'Failed to fetch substitute list' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET teacher ids + names (minimal info)
// ──────────────────────────────────────────────────────────────
app.get('/api/get-teacher-ids', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT id, first_name, last_name FROM Users WHERE role = ?',
      ['teacher']
    );
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching teacher IDs:', err);
    res.status(500).json({ error: 'Failed to fetch teacher list' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET teachers with email (already good - just minor cleanup)
// ──────────────────────────────────────────────────────────────
app.get('/api/get-teachers', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email FROM Users WHERE role = ?',
      ['teacher']
    );
    
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET all users
// ──────────────────────────────────────────────────────────────
app.get('/api/get-users', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM Users');
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// ──────────────────────────────────────────────────────────────
// POST - Add new user
// ──────────────────────────────────────────────────────────────
app.post('/api/add-user', async (req, res) => {
  const { 
    first_name, 
    last_name, 
    email, 
    role, 
    departments, 
    phone_number 
  } = req.body;

  // Basic validation
  if (!email || !first_name || !last_name || !role) {
    return res.status(400).json({ 
      error: 'Missing required fields: email, first_name, last_name, role' 
    });
  }

  const deptString = formatDeptsForDB(departments);

  try {
    const [result] = await pool.query(
      `INSERT INTO Users 
         (email, first_name, last_name, role, departments, phone_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, first_name, last_name, role, deptString, phone_number || null]
    );

    // Return newly created user data (departments kept as array for frontend)
    res.status(201).json({
      id: result.insertId,
      first_name,
      last_name,
      email,
      role,
      departments: departments || [], // return array as frontend expects
      phone_number: phone_number || null
    });

  } catch (err) {
    console.error('Error creating user:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Email already exists. Please use a different email.' 
      });
    }

    res.status(500).json({ error: 'Failed to create user' });
  }
});



// GET /api/get-chairs
// Returns all users who have 'chair' in their departments
app.get('/api/get-chairs', async (req, res) => {
  try {
    const [results] = await pool.query(
      "SELECT id, first_name, last_name, email, departments FROM Users WHERE departments LIKE '%chair%'"
    );
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching department chairs:', err);
    res.status(500).json({ error: 'Failed to fetch department chairs' });
  }
});

// GET /api/find-dept-chair
// Find chair(s) for a specific subject
app.get('/api/find-dept-chair', async (req, res) => {
  const { subject } = req.query;

  if (!subject) {
    return res.status(400).json({ error: 'Subject parameter is required' });
  }

  try {
    const searchTerm = `%${subject}%`;
    
    const [results] = await pool.query(
      `
        SELECT id, first_name, last_name, email, departments 
        FROM Users 
        WHERE departments LIKE ? 
          AND departments LIKE '%chair%'
      `,
      [searchTerm]
    );

    res.status(200).json(results);
    // Returns:
    // []          → no chair found
    // [oneChair]  → auto-selection possible
    // [multiple]  → teacher/admin needs to choose
  } catch (err) {
    console.error('Error finding department chair:', err);
    res.status(500).json({ error: 'Failed to find department chair' });
  }
});

// PATCH /api/update-user/:id
// Update existing user information
app.patch('/api/update-user/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    first_name, 
    last_name, 
    email, 
    role, 
    departments, 
    phone_number 
  } = req.body;

  const deptString = formatDeptsForDB(departments);

  try {
    const [result] = await pool.query(
      `UPDATE Users 
       SET first_name = ?, last_name = ?, email = ?, 
           role = ?, departments = ?, phone_number = ?
       WHERE id = ?`,
      [first_name, last_name, email, role, deptString, phone_number, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id,
      first_name,
      last_name,
      email,
      role,
      departments,        // keeping as array for frontend
      phone_number
    });
  } catch (err) {
    console.error(`Error updating user ${id}:`, err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Email already exists' 
      });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/delete-user/:id
// Remove a user from the system
app.delete('/api/delete-user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM Users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      message: 'User deleted successfully',
      deletedUserId: id 
    });
  } catch (err) {
    console.error(`Error deleting user ${id}:`, err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/check-request
// Check if a request exists by ID
app.get('/api/check-request', async (req, res) => {
  const { requestId } = req.query;

  if (!requestId) {
    return res.status(400).json({ error: 'requestId parameter is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM Requests WHERE id = ?',
      [requestId]
    );

    const exists = rows[0].count > 0;
    
    res.status(200).json({ exists });
  } catch (err) {
    console.error('Error checking request existence:', err);
    res.status(500).json({ error: 'Failed to check request' });
  }
});



// PATCH /api/requests/:id/complete
// Marks a specific substitute block as completed + sends notification to teacher
app.patch('/api/requests/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { email, block } = req.body;

  if (!email || !block) {
    return res.status(400).json({ error: 'Email and block are required' });
  }

  try {
    // 1. Get substitute info
    const [subs] = await pool.query(
      'SELECT id, first_name, last_name FROM Users WHERE email = ?',
      [email]
    );

    if (!subs.length) {
      return res.status(404).json({ error: 'Substitute not found' });
    }

    const sub = subs[0];
    const subId = sub.id;
    const subName = `${sub.first_name} ${sub.last_name}`;

    // 2. Verify this block is actually assigned to this substitute
    const [assignments] = await pool.query(
      'SELECT 1 FROM request_assignments WHERE request_id = ? AND sub_id = ? AND block = ?',
      [id, subId, block]
    );

    if (!assignments.length) {
      return res.status(404).json({ error: 'Block assignment not found for this substitute' });
    }

    // 3. Get request + teacher information
    const [requests] = await pool.query(
      `SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.status,
              u.first_name AS teacher_first_name, u.last_name AS teacher_last_name,
              u.email AS teacher_email
       FROM Requests r
       JOIN Users u ON r.teacher_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (!requests.length) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    if (request.status === 'completed') {
      return res.status(400).json({ error: 'This request is already fully completed' });
    }

    // 4. Check if this completion makes the request fully covered
    const [assigned] = await pool.query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [id]
    );

    const requestedBlocks = request.blocks_requested
      ? request.blocks_requested.split(',').map(b => b.trim())
      : [];

    const assignedBlocks = assigned.map(a => a.block);
    const isNowFullyCovered = requestedBlocks.every(b => assignedBlocks.includes(b));

    // 5. If fully covered → update request status
    if (isNowFullyCovered) {
      await pool.query(
        'UPDATE Requests SET status = "completed" WHERE id = ?',
        [id]
      );
    }

    // 6. Send notification email to teacher
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Substitute Block Completed</title></head>
      <body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;">
          <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
          <tr><td style="padding:30px;">
            <h2 style="color:rgb(20,54,100);margin:0 0 20px;font-size:24px;">Substitute Block Completed</h2>
            <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
              Dear <strong>${request.teacher_first_name} ${request.teacher_last_name}</strong>,
            </p>
            <p style="color:#333;font-size:16px;line-height:1.5;margin:0 0 20px;">
              The substitute block <strong>${block}</strong> for <strong>${request.day}</strong> 
              has been completed by <strong>${subName}</strong>.
            </p>
            <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;">
              <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.day}</td></tr>
              <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Block:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${block}</td></tr>
              <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.room || '-'}</td></tr>
              <tr><td style="border:1px solid #e0e0e0;padding:10px;"><strong>Notes:</strong></td><td style="border:1px solid #e0e0e0;padding:10px;">${request.notes || 'None'}</td></tr>
            </table>
            <p style="color:#333;font-size:16px;line-height:1.5;margin:20px 0 0;">Thank you,<br>Substitute Scheduler</p>
          </td></tr>
          <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:14px;">
            <p style="margin:0;">Substitute Scheduler | The Episcopal Academy</p>
            <p style="margin:5px 0;">1785 Bishop White Drive, Newtown Square, PA 19073</p>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: request.teacher_email,
        subject: `Block Completed: ${block} – ${request.day}`,
        html
      });

      res.status(200).json({
        message: 'Block marked as completed and teacher notified',
        fullyCovered: isNowFullyCovered,
        block,
        date: request.day
      });
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr);
      // Still consider the action successful - email is secondary
      res.status(200).json({
        message: 'Block marked as completed (teacher notification failed)',
        fullyCovered: isNowFullyCovered,
        block,
        date: request.day,
        emailSent: false
      });
    }
  } catch (err) {
    console.error('Error completing substitute block:', err);
    res.status(500).json({ error: 'Failed to complete block assignment' });
  }
});

// GET /api/admin-requests
// Paginated list of requests for admin dashboard
app.get('/api/admin-requests', async (req, res) => {
  const { page = 1, limit = 10, includeCompleted = 'false' } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  const showCompleted = includeCompleted === 'true';

  try {
    const whereClause = showCompleted
      ? '1 = 1'
      : "r.status IN ('uncompleted', 'pending', 'in_progress')";

    // Main request list query
    const requestQuery = `
      SELECT 
        r.id, r.day, r.subject, r.room, r.notes, r.blocks_requested, 
        r.status, r.sent,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher,
        u.email AS teacher_email
      FROM Requests r
      JOIN Users u ON r.teacher_id = u.id
      WHERE ${whereClause}
      ORDER BY r.id DESC
      LIMIT ? OFFSET ?
    `;

    const [requests] = await pool.query(requestQuery, [limitNum, offset]);

    // Enrich each request with current assignment status
    const formatted = await Promise.all(
      requests.map(async (reqItem) => {
        const blocksRequested = reqItem.blocks_requested
          ? reqItem.blocks_requested.split(',').map(b => b.trim())
          : [];

        const [assignments] = await pool.query(
          `SELECT ra.block, 
                  CONCAT(u.first_name, ' ', u.last_name) AS substitute_name,
                  u.email AS substitute_email
           FROM request_assignments ra
           JOIN Users u ON ra.sub_id = u.id
           WHERE ra.request_id = ?`,
          [reqItem.id]
        );

        const assignedBlocks = assignments.map(a => a.block);

        const blocks = blocksRequested.map(block => ({
          block,
          assigned: assignedBlocks.includes(block),
          substitute_name: assignments.find(a => a.block === block)?.substitute_name || null,
          substitute_email: assignments.find(a => a.block === block)?.substitute_email || null,
        }));

        return {
          id: reqItem.id,
          day: reqItem.day,
          subject: reqItem.subject,
          room: reqItem.room,
          notes: reqItem.notes,
          status: reqItem.status,
          sent: reqItem.sent,
          blocks,
          teacher: reqItem.teacher,
          teacher_email: reqItem.teacher_email,
        };
      })
    );

    // Get total count for pagination
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total
       FROM Requests r
       JOIN Users u ON r.teacher_id = u.id
       WHERE ${whereClause}`
    );

    res.status(200).json({
      requests: formatted,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('Error fetching admin requests:', err);
    res.status(500).json({ error: 'Failed to load admin request list' });
  }
});







// POST /api/accept-request
// Allows a substitute to accept one or more blocks for a request
app.post('/api/accept-request', async (req, res) => {
  const { requestId, email, blocks } = req.body;

  if (!requestId || !email || !Array.isArray(blocks) || blocks.length === 0) {
    return res.status(400).json({ 
      error: 'Request ID, email, and non-empty blocks array are required' 
    });
  }

  try {
    // 1. Get substitute ID
    const [subs] = await pool.query(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    );

    if (!subs.length) {
      return res.status(404).json({ error: 'Substitute not found' });
    }

    const subId = subs[0].id;

    // 2. Verify request exists and is still open
    const [requests] = await pool.query(
      'SELECT blocks_requested FROM Requests WHERE id = ? AND status != "completed"',
      [requestId]
    );

    if (!requests.length) {
      return res.status(404).json({ 
        error: 'Request not found or already completed' 
      });
    }

    const requestedBlocks = requests[0].blocks_requested
      ? requests[0].blocks_requested.split(',').map(b => b.trim())
      : [];

    // 3. Validate all requested blocks are valid for this request
    const invalidBlocks = blocks.filter(b => !requestedBlocks.includes(b));
    if (invalidBlocks.length > 0) {
      return res.status(400).json({ 
        error: `Invalid blocks: ${invalidBlocks.join(', ')}` 
      });
    }

    // 4. Check for already assigned blocks (race condition protection)
    const [existing] = await pool.query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND block IN (?)',
      [requestId, blocks]
    );

    const alreadyTaken = existing.map(r => r.block);
    const conflicts = blocks.filter(b => alreadyTaken.includes(b));

    if (conflicts.length > 0) {
      return res.status(409).json({ 
        error: `The following blocks are already taken: ${conflicts.join(', ')}` 
      });
    }

    // 5. Insert the new assignments
    const values = blocks.map(block => [requestId, subId, block]);

    await pool.query(
      'INSERT INTO request_assignments (request_id, sub_id, block) VALUES ?',
      [values]
    );

    res.status(200).json({ 
      message: 'Blocks assigned successfully',
      assignedBlocks: blocks,
      requestId 
    });

  } catch (err) {
    console.error('Error accepting request blocks:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Assignment conflict - block already taken' });
    }
    
    res.status(500).json({ error: 'Failed to accept blocks' });
  }
});

// GET /api/substitute-requests
// Get all active requests where the substitute is currently assigned
app.get('/api/substitute-requests', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Get substitute ID
    const [users] = await pool.query(
      'SELECT id FROM Users WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(404).json({ error: 'Substitute not found' });
    }

    const subId = users[0].id;

    // 2. Fetch all requests where this substitute is assigned
    const [results] = await pool.query(
      `
        SELECT 
          r.id, r.day, r.subject, r.room, r.notes,
          t.first_name, t.last_name, t.email AS teacher_email,
          COALESCE(
            (
              SELECT JSON_ARRAYAGG(ra.block)
              FROM request_assignments ra
              WHERE ra.request_id = r.id 
                AND ra.sub_id = ? 
                AND ra.block IS NOT NULL
            ),
            '[]'
          ) AS blocks
        FROM Requests r
        JOIN Users t ON r.teacher_id = t.id
        JOIN request_assignments ra ON r.id = ra.request_id
        WHERE ra.sub_id = ? 
          AND r.status != 'completed'
        GROUP BY r.id, r.day, r.subject, r.room, r.notes, 
                 t.first_name, t.last_name, t.email
        ORDER BY r.day ASC
      `,
      [subId, subId]
    );

    const formattedResults = results.map(row => ({
      id: row.id,
      day: row.day,
      subject: row.subject,
      room: row.room,
      notes: row.notes,
      teacher_name: `${row.first_name} ${row.last_name}`,
      teacher_email: row.teacher_email,
      blocks: JSON.parse(row.blocks || '[]'),
    }));

    res.status(200).json(formattedResults);
  } catch (err) {
    console.error('Error fetching substitute requests:', err);
    res.status(500).json({ error: 'Failed to load your assigned requests' });
  }
});

//new cancel assignment below


app.post('/api/cancel-assignment', async (req, res) => {
  const { email, requestId } = req.body;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // 1. Get canceling substitute info
    const [subResults] = await pool.query(
      'SELECT id, first_name, last_name FROM Users WHERE email = ?',
      [email]
    );

    if (subResults.length === 0) {
      return res.status(404).json({ error: 'Substitute not found' });
    }

    const sub = subResults[0];
    const subId = sub.id;
    const subName = `${sub.first_name} ${sub.last_name}`;

    // 2. Get request + teacher + admin info
    const [requestResults] = await pool.query(
      `SELECT r.blocks_requested, r.subject, r.room, r.day, r.notes, r.sent, r.admin_email,
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
    const adminEmail = request.admin_email || null;
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;

    const requestedBlocks = request.blocks_requested
      ? request.blocks_requested.split(',').map(b => b.trim())
      : [];

    const sentEmails = request.sent
      ? [...new Set(request.sent.split(',').map(e => e.trim()).filter(Boolean))]
      : [];

    // 3. Get currently assigned blocks for this substitute
    const [assignmentResults] = await pool.query(
      'SELECT block FROM request_assignments WHERE request_id = ? AND sub_id = ?',
      [requestId, subId]
    );

    if (assignmentResults.length === 0) {
      return res.status(404).json({ error: 'No assignments found for this substitute' });
    }

    const canceledBlocks = assignmentResults.map(a => a.block);

    // 4. Check coverage status BEFORE deletion
    const [beforeResults] = await pool.query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [requestId]
    );

    const wasFullyCovered = requestedBlocks.every(b =>
      beforeResults.some(r => r.block === b)
    );

    // 5. Delete all assignments for this substitute on this request
    await pool.query(
      'DELETE FROM request_assignments WHERE request_id = ? AND sub_id = ?',
      [requestId, subId]
    );

    // 6. Determine which blocks are now open
    const [afterResults] = await pool.query(
      'SELECT block FROM request_assignments WHERE request_id = ?',
      [requestId]
    );

    const afterAssigned = afterResults.map(r => r.block);
    const openBlocks = requestedBlocks.filter(b => !afterAssigned.includes(b));
    const hasOpenBlocks = openBlocks.length > 0;

    // 7. Reusable request info HTML table
    const requestInfoHtml = `
      <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:16px;color:#333;margin-top:20px;">
        <tr><td style="border:1px solid #e0e0e0;background:#f9f9f9;"><strong>Teacher:</strong></td><td style="border:1px solid #e0e0e0;">${teacherName}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;background:#f9f9f9;"><strong>Subject:</strong></td><td style="border:1px solid #e0e0e0;">${request.subject || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;background:#f9f9f9;"><strong>Room:</strong></td><td style="border:1px solid #e0e0e0;">${request.room || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;background:#f9f9f9;"><strong>Date:</strong></td><td style="border:1px solid #e0e0e0;">${request.day || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;background:#f9f9f9;"><strong>Full Schedule:</strong></td><td style="border:1px solid #e0e0e0;">${request.blocks_requested || '-'}</td></tr>
        <tr><td style="border:1px solid #e0e0e0;background:#f9f9f9;"><strong>Notes:</strong></td><td style="border:1px solid #e0e0e0;">${request.notes || 'None'}</td></tr>
      </table>`;

    // 8. Email to teacher (+ admin if exists)
    const teacherHtml = `
      <html><body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
        <table align="center" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;border-collapse:collapse;">
          <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
          <tr><td style="padding:30px;">
            <h2 style="color:rgb(20,54,100);margin:0 0 10px;">Blocks Canceled</h2>
            <p style="color:#333;font-size:16px;">
              <strong>${subName}</strong> has canceled their assignment for the following blocks:
            </p>
            <p style="background:#ffebee;padding:15px;border-radius:6px;font-weight:bold;color:#c62828;font-size:18px;text-align:center;">
              ${canceledBlocks.join(', ')}
            </p>
            <h3 style="color:rgb(20,54,100);border-bottom:1px solid #e0e0e0;padding-bottom:5px;">Original Request Details</h3>
            ${requestInfoHtml}
          </td></tr>
          <tr><td style="background:rgb(30,64,110);color:#fff;padding:15px;text-align:center;font-size:12px;">
            Substitute Scheduler | The Episcopal Academy
          </td></tr>
        </table>
      </body></html>`;

    const teacherRecipients = [teacherEmail];
    if (adminEmail) teacherRecipients.push(adminEmail);

    await Promise.all(
      teacherRecipients.map(recipient =>
        transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: recipient,
          subject: `Blocks Canceled by ${subName} – Request #${requestId}`,
          html: teacherHtml,
        })
      )
    );

    // 9. Notify other substitutes if the request was full and now has open blocks
    if (wasFullyCovered && hasOpenBlocks) {
      const otherSubEmails = sentEmails.filter(e => e !== email);

      if (otherSubEmails.length > 0) {
        await Promise.all(
          otherSubEmails.map(async (recipient) => {
            const token = jwt.sign(
              { email: recipient, requestId },
              process.env.JWT_SECRET,
              { expiresIn: '1y' }
            );

            const subHtml = `
            <html><body style="background:#f4f4f4;margin:0;padding:20px;font-family:Arial,sans-serif;">
              <table align="center" width="100%" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                <tr><td style="background:rgb(20,54,100);padding:20px;text-align:center;"></td></tr>
                <tr><td style="padding:30px;">
                  <h2 style="color:rgb(20,54,100);margin:0 0 10px;">Blocks Now Available</h2>
                  <p style="color:#333;font-size:16px;">
                    A previous assignment has been canceled. The following blocks are now open:
                  </p>
                  <p style="background:#e8f5e8;padding:15px;border-radius:6px;font-weight:bold;color:#2e7d32;font-size:18px;text-align:center;">
                    ${openBlocks.join(', ')}
                  </p>
                  <h3 style="color:rgb(20,54,100);border-bottom:1px solid #e0e0e0;padding-bottom:5px;">Assignment Context</h3>
                  ${requestInfoHtml}
                  <p style="text-align:center;margin-top:30px;">
                    <a href="${process.env.FRONTEND_URL}/LinkLogin?token=${token}&requestId=${requestId}" 
                       style="background:rgb(20,54,100);color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
                      Claim These Blocks
                    </a>
                  </p>
                </td></tr>
              </table>
            </body></html>`;

            return transporter.sendMail({
              from: process.env.FROM_EMAIL,
              to: recipient,
              subject: `Available: ${openBlocks.join(', ')} – Request #${requestId}`,
              html: subHtml,
            });
          })
        );
      }
    }

    // Success response
    res.status(200).json({
      message: 'Assignment canceled successfully',
      canceledBlocks,
      requestId,
      remainingOpenBlocks: openBlocks.length > 0 ? openBlocks : null
    });

  } catch (err) {
    console.error('Error canceling assignment:', err);
    res.status(500).json({
      error: 'Failed to cancel assignment',
      details: err.message
    });
  }
});






app.post('/api/admin-complete-request', async (req, res) => {
  const { email, requestId } = req.body;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // 1. Verify user exists and has chair privileges
    const [users] = await pool.query(
      'SELECT id, departments FROM Users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const departments = user.departments || "";

    // Case-insensitive check for 'chair' in departments
    if (!departments.toLowerCase().includes('chair')) {
      console.warn(`Unauthorized attempt - ${email} (departments: ${departments})`);
      return res.status(403).json({
        error: 'Unauthorized: Department Chair access required'
      });
    }

    // 2. Verify request exists
    const [requests] = await pool.query(
      'SELECT 1 FROM Requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // 3. Mark request as completed
    await pool.query(
      'UPDATE Requests SET status = ? WHERE id = ?',
      ['completed', requestId]
    );

    res.status(200).json({
      message: 'Request marked as completed',
      requestId,
      completedBy: email
    });

  } catch (err) {
    console.error('Error completing request as admin:', err);
    res.status(500).json({
      error: 'Failed to complete request',
      details: err.message
    });
  }
});




app.delete('/api/requests/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { email, role: frontendRole } = req.query;

  if (!email || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    await transporter.verify();

    // 1. Get user info and determine permissions
    const [users] = await pool.query(
      'SELECT id, role FROM Users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id: requesterId, role: dbRole } = users[0];

    // Permission check - admin can delete any, teachers only their own unfinished requests
    const isAdmin =
      dbRole?.toLowerCase() === 'admin' ||
      email.toLowerCase().includes('admin@ea') ||
      frontendRole?.toLowerCase() === 'admin';

    // 2. Fetch request with permission filter
    let query = `
      SELECT r.*, 
             t.first_name AS teacher_first_name, 
             t.last_name AS teacher_last_name
      FROM Requests r
      JOIN Users t ON r.teacher_id = t.id
      WHERE r.id = ?
    `;
    const params = [requestId];

    if (!isAdmin) {
      query += ` AND r.teacher_id = ? AND r.status != 'completed'`;
      params.push(requesterId);
    }

    const [requests] = await pool.query(query, params);

    if (requests.length === 0) {
      return res.status(404).json({
        error: 'Request not found, already completed, or permission denied'
      });
    }

    const request = requests[0];
    const teacherName = `${request.teacher_first_name} ${request.teacher_last_name}`;

    const sentEmails = request.sent
      ? [...new Set(request.sent.split(',').map(e => e.trim()).filter(Boolean))]
      : [];

    // 3. Get all current assignments
    const [assignments] = await pool.query(
      `SELECT ra.block, u.email, u.first_name, u.last_name
       FROM request_assignments ra
       JOIN Users u ON ra.sub_id = u.id
       WHERE ra.request_id = ?`,
      [requestId]
    );

    const assignedEmails = [...new Set(assignments.map(a => a.email))];
    const notAssignedEmails = sentEmails.filter(e => !assignedEmails.includes(e));

    const emailPromises = [];

    // 4. Notify unassigned substitutes
    if (notAssignedEmails.length > 0) {
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

      notAssignedEmails.forEach(recipient => {
        emailPromises.push(
          transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: recipient,
            subject: `Request #${requestId} Canceled`,
            html,
          })
        );
      });
    }

    // 5. Notify assigned substitutes
    if (assignments.length > 0) {
      const grouped = {};
      assignments.forEach(a => {
        if (!grouped[a.email]) {
          grouped[a.email] = { name: `${a.first_name} ${a.last_name}`, blocks: [] };
        }
        grouped[a.email].blocks.push(a.block);
      });

      Object.entries(grouped).forEach(([subEmail, { name, blocks }]) => {
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

        emailPromises.push(
          transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: subEmail,
            subject: `Your Blocks Canceled – Request #${requestId}`,
            html,
          })
        );
      });
    }

    // Send all emails
    await Promise.all(emailPromises);

    // 6. Clean up database
    await pool.query('DELETE FROM request_assignments WHERE request_id = ?', [requestId]);
    await pool.query('DELETE FROM Requests WHERE id = ?', [requestId]);

    // Success response
    res.status(200).json({
      message: 'Request canceled and deleted successfully',
      deleted: true,
      requestId,
      canceledBy: isAdmin ? 'admin' : 'teacher'
    });

  } catch (err) {
    console.error('Error in request deletion:', err);
    res.status(500).json({
      error: 'Failed to cancel and delete request',
      details: err.message
    });
  }
});



// DELETE /api/requests/:id
// Admin/teacher deletes a request (with notifications)
app.delete('/api/requests/:id', async (req, res) => {
  const { id: requestId } = req.params;
  const { email: adminEmail } = req.query; // From frontend URL: ?email=...

  if (!adminEmail || !requestId) {
    return res.status(400).json({ error: 'Email and requestId are required' });
  }

  try {
    // 1. Get request details (needed for notifications)
    const [requestResults] = await pool.query(
      `SELECT r.*, 
              t.email AS teacher_email, 
              t.first_name, 
              t.last_name 
       FROM Requests r 
       JOIN Users t ON r.teacher_id = t.id 
       WHERE r.id = ?`,
      [requestId]
    );

    if (requestResults.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const reqData = requestResults[0];

    // 2. Delete related assignments first, then the request
    // (order matters if you don't have ON DELETE CASCADE)
    await pool.query(
      'DELETE FROM request_assignments WHERE request_id = ?',
      [requestId]
    );

    await pool.query(
      'DELETE FROM Requests WHERE id = ?',
      [requestId]
    );

    // 3. Prepare and send notification email to teacher + chair (if exists)
    const cancelHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Request Canceled by Admin</h2>
        <p>The substitute request for <strong>${reqData.first_name} ${reqData.last_name}</strong> 
           on <strong>${reqData.day}</strong> has been removed from the system.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p><strong>Details:</strong></p>
        <ul style="list-style: none; padding-left: 0; line-height: 1.6;">
          <li><strong>Subject:</strong> ${reqData.subject || '—'}</li>
          <li><strong>Room:</strong> ${reqData.room || '—'}</li>
          <li><strong>Blocks:</strong> ${reqData.blocks_requested || '—'}</li>
        </ul>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          Canceled by: ${adminEmail}
        </p>
      </div>
    `;

    const recipients = [reqData.teacher_email];
    if (reqData.admin_email) {
      recipients.push(reqData.admin_email);
    }

    await Promise.all(
      recipients.map(to =>
        transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to,
          subject: `Canceled: Sub Request for ${reqData.first_name} ${reqData.last_name} (${reqData.day})`,
          html: cancelHtml,
        })
      )
    );

    // Success response
    res.status(200).json({
      deleted: true,
      message: 'Request deleted successfully',
      requestId,
      notified: recipients
    });

  } catch (err) {
    console.error('Admin Delete Error:', err);
    res.status(500).json({
      error: 'Failed to delete request',
      details: err.message
    });
  }
});




app.post('/api/expand-request-notifications', async (req, res) => {
  try {
    await transporter.verify();

    const { requestId, selectedSubs, adminEmail } = req.body;

    if (!requestId || !Array.isArray(selectedSubs) || selectedSubs.length === 0) {
      return res.status(400).json({ error: 'Invalid requestId or no subs selected' });
    }

    // 1. Fetch the existing request data and teacher info
    const [requestResults] = await pool.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM Requests r 
       JOIN Users u ON r.teacher_id = u.id 
       WHERE r.id = ?`,
      [requestId]
    );

    if (!requestResults.length) {
      return res.status(404).json({ error: 'Original request not found' });
    }

    const request = requestResults[0];
    const { first_name: firstName, last_name: lastName, day, room, blocks_requested: blocks, notes, sent: existingSent } = request;

    // 2. Construct the updated "sent" string for the database
    const newEmails = selectedSubs.map(s => s.email.trim());
    const currentEmails = existingSent ? existingSent.split(',').map(e => e.trim()) : [];
    
    // Combine and remove duplicates just in case
    const updatedSentList = Array.from(new Set([...currentEmails, ...newEmails])).join(',');

    // 3. Update the Requests table
    await pool.query(
      'UPDATE Requests SET sent = ? WHERE id = ?',
      [updatedSentList, requestId]
    );

    // 4. Reuse your Email Template Logic
    const generateEmailHtml = (link = '') => `
      <html lang="en">
      <body style="background-color: #f4f4f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr><td style="background-color: rgb(20, 54, 100); padding: 20px; text-align: center;"></td></tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: rgb(20, 54, 100); margin: 0 0 20px; font-size: 24px;">Substitute Request</h2>
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                A new substitute request is available from <strong>${firstName} ${lastName}</strong>.
              </p>
              <table cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; font-size: 16px; color: #333333;">
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Date:</strong></td><td style="border: 1px solid #e0e0e0;">${day}</td></tr>
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Room:</strong></td><td style="border: 1px solid #e0e0e0;">${room}</td></tr>
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Blocks:</strong></td><td style="border: 1px solid #e0e0e0;">${blocks || 'Not specified'}</td></tr>
                <tr><td style="border: 1px solid #e0e0e0;"><strong>Notes:</strong></td><td style="border: 1px solid #e0e0e0;">${notes || 'None'}</td></tr>
              </table>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${link}" style="background-color: rgb(175, 214, 241); color: rgb(20, 54, 100); padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block;">Sign Up for This Request</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 5. Send individual emails to ONLY the new subs
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const emailPromises = selectedSubs.map((sub) => {
      const token = jwt.sign(
        { email: sub.email, requestId },
        process.env.JWT_SECRET,
        { expiresIn: '1y' }
      );

      const link = `${FRONTEND_URL}/LinkLogin?token=${token}&requestId=${requestId}`;
      
      return transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: sub.email,
        subject: `[Update] Substitute Request for ${firstName} ${lastName}`,
        html: generateEmailHtml(link),
      });
    });

    await Promise.all(emailPromises);

    res.json({ message: 'Additional substitutes notified successfully.' });
  } catch (err) {
    console.error('Error expanding notifications:', err);
    res.status(500).json({ error: 'Failed to notify additional substitutes' });
  }
});



// 1. First, serve your static files
app.use(express.static(path.join(__dirname, '../build')));

// 2. ONLY catch GET requests that are NOT for the API
app.get('*', (req, res, next) => {
  // If it's an API call that didn't match any route above, pass it to the 404 handler
  if (req.url.startsWith('/api')) {
    return next();
  }
  // Otherwise, serve the React App
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

// 3. Final 404 handler for API only
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

// 4. Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});