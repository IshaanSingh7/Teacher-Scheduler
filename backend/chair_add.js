const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};

(async function main() {
  const conn = await mysql.createConnection(dbConfig);

  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT id, first_name, last_name, departments FROM Users WHERE departments LIKE '%Chair%'`
    );

    console.log(`Found ${rows.length} rows with 'Chair' tag. Updating role to 'admin'...`);

    if (rows.length > 0) {
      await conn.execute(
        `UPDATE Users SET role='teacher' WHERE departments LIKE '%Chair%'`
      );
      console.log('Update complete.');
    } else {
      console.log('No rows found with Chair tag.');
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('Error, rolled back:', err);
  } finally {
    await conn.end();
  }
})();
