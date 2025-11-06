// addEASubs.js
// Adds EA substitutes into existing `users` table (assumes table/schema already created)
require('dotenv').config();
const mysql = require('mysql2/promise');

async function addEASubs() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER || 'sub_app',
    password: process.env.DATABASE_PASSWORD || 'ea1785ea',
    database: process.env.DATABASE_NAME || 'scheduling_app',
  });

  const subs = [
    ['Brandon', 'Peaker', 'brandonpeaker@yahoo.com', '267-977-0886', 'Lower School, Middle School, Upper School, Other'],
    ['Don', 'Morgan', 'donmorgan1@comcast.net', '610-859-8184', 'Middle School, Upper School, English'],
    ['Ryan', 'Fitzpatrick', 'rfitzpatrick@episcopalacademy.org', '610-505-1333', 'All Divisions, Other'],
    ['Kate', 'Howlin', '', '', 'Other'],
    ['Chris', 'Slayton', 'slayton.chris@gmail.com', '(302)-373-2086', 'Upper School, Middle School, Math'],
    ['Laura', 'Murdoch', 'ldormans18@gmail.com', '(610) 457-2351', 'All Divisions, Reading, Science, Other'],
    ['Paul', 'Viloski', 'pjviloski@gmail.com', '(610)-324-5464', 'Upper School, Middle School, Math, Science'],
    ['Erica', 'James', 'ejames001@gmail.com', '(832) 247-6266', 'Upper School, Humanities, World Languages, Other'],
    ['Matt', 'Gress', 'mattg031111@gmail.com', '(610) 733-0138', 'Lower School, Middle School, All Subjects, Other'],
    ['Bob', 'Deasey', 'rdeasey@episcopalacademy.org', '(610) 937-1253', 'Upper School, Administration, Other'],
    ['Colleen', 'Kramer', 'colleen.m.kramer@gmail.com', '(301) 580-7292', 'All Divisions, Other'],
    ['Maryanne', 'Staszak', 'maryannt2006@gmail.com', '(484) 684-5366', 'All Divisions, All Subjects'],
    ['Maverick', 'Jacobs', 'mjacobs@infocus.org', '(609) 444-6529', 'All Divisions, Other'],
    ['Vlad', 'Puskovich', 'BrotherVIP@aol.com', '(570)-955-9743', 'All Divisions, Music'],
    ['Bob', 'Fyfe', 'Fyfe1@comcast.net', '(610) 247-7333', 'All Divisions, Math'],
    ['Richard', 'Barkley', 'ricbarkley@aol.com', '(610) 608-1517', 'Middle School, Upper School, Math, Science'],
    ['Sonia', 'Reid', 'sonialeereid70@gmail.com', '(774) 276-2008', 'Middle School, Upper School, World Languages, Humanities'],
    ['Paige', 'Adams', 'paigeadams1146@gmail.com', '(484) 356-6244', 'Lower School, All Subjects'],
    ['Ruth', 'King', 'ruthking305@gmail.com', '(610) 804-9034', 'Lower School, All Subjects'],
    ['Sophie', 'Niami', 'Sniami1@yahoo.com', '(610)-247-6297', 'Lower School, Special Education, Other'],
    ['Juliet', 'Tinsley', 'juliettinsley@gmail.com', '(445) 210-1423', 'Lower School, All Subjects'],
    ['Carmella', 'Marrollo', '', '610.804.9375', 'Other'],
    ['Tom', 'Hankel', 'tnh607@yahoo.com', '610-574-8748', 'Lower School, Middle School, Upper School, Math'],
    ['Grace', 'Limaye', 'gclimaye@gmail.com', '650-468-6071', 'All Divisions, Science'],
  ];

  try {
    for (const [first, last, email, phone, departments] of subs) {
      // skip entries without email (can't uniquely identify)
      if (!email || email.trim() === '') {
        console.log(`Skipped (no email): ${first} ${last}`);
        continue;
      }

      await connection.execute(
        `INSERT INTO Users (first_name, last_name, email, role, phone_number, departments)
         VALUES (?, ?, ?, 'substitute', ?, ?)
         ON DUPLICATE KEY UPDATE
           phone_number = VALUES(phone_number),
           departments = VALUES(departments),
           role = 'substitute'`,
        [first, last, email, phone, departments]
      );

      console.log(`Added/updated: ${first} ${last} <${email}>`);
    }

    console.log('All substitutes processed.');
  } catch (err) {
    console.error('Error inserting subs:', err);
  } finally {
    await connection.end();
  }
}

addEASubs();