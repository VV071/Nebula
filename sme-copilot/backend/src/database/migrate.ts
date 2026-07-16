import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import db from '../config/database';

const migrate = async () => {
    console.log('Running migrations...');
    try {
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`Executing migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
                await db.query(sql);
            }
        }

        console.log('Migrations completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
