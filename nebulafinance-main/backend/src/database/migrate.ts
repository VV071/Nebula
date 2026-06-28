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
                const dbType = process.env.DB_TYPE;
                console.log(`Checking file: ${file}, DB_TYPE: ${dbType}`);
                const isSqlite = dbType === 'sqlite';
                if (isSqlite && file !== 'sqlite_schema.sql') {
                    console.log(`Skipping ${file} (not sqlite_schema)`);
                    continue;
                }
                if (!isSqlite && file === 'sqlite_schema.sql') {
                    console.log(`Skipping ${file} (sqlite_schema in postgres mode)`);
                    continue;
                }

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
