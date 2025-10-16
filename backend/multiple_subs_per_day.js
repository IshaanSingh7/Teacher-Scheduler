require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });

    try {
        // Create request_assignments table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS request_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                request_id INT NOT NULL,
                block VARCHAR(255) NOT NULL,
                sub_id INT NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
                FOREIGN KEY (sub_id) REFERENCES Users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_assignment (request_id, block)
            )
        `);
        console.log('Created request_assignments table');

        // Check if subs column exists in requests table
        const [columns] = await connection.execute(
            'SHOW COLUMNS FROM requests LIKE "subs"'
        );

        if (columns.length > 0) {
            // Drop subs column if it exists
            await connection.execute('ALTER TABLE requests DROP COLUMN subs');
            console.log('Dropped subs column from requests table');
        } else {
            console.log('subs column does not exist, skipping drop');
        }
    } catch (error) {
        console.error('Error executing migration:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();