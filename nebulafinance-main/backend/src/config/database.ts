import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';


export interface IDbClient {
    query(text: string, params?: any[]): Promise<any>;
    release(): void;
}

export interface IDatabase {
    query(text: string, params?: any[]): Promise<any>;
    connect(): Promise<IDbClient>;
}

class PostgresDatabase implements IDatabase {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async query(text: string, params?: any[]): Promise<any> {
        return this.pool.query(text, params);
    }

    async connect(): Promise<IDbClient> {
        return this.pool.connect();
    }
}

const sqlite3 = require('sqlite3').verbose();

class SqliteDatabase implements IDatabase {
    private db: any;

    constructor() {
        const dbPath = path.join(process.cwd(), 'nebula_finance.db');
        console.log('Opening SQLite DB at:', dbPath);
        this.db = new sqlite3.Database(dbPath, (err: Error | null) => {
            if (err) console.error('Could not connect to database', err);
            else {
                console.log('Connected to SQLite database');
                this.db.run('PRAGMA journal_mode = WAL');
            }
        });
    }

    async connect(): Promise<IDbClient> {
        // SQLite is single-threaded; return a wrapper over this same instance
        const self = this;
        return { query: (t, p) => self.query(t, p), release: () => {} };
    }

    async query(text: string, params?: any[]): Promise<any> {
        // Replace $1, $2 etc with ?
        const sqliteText = text.replace(/\$\d+/g, '?');

        return new Promise((resolve, reject) => {
            // Basic detection of query type
            const trimmed = sqliteText.trim().toUpperCase();
            const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.includes('RETURNING') || trimmed.startsWith('PRAGMA');

            if (!params || params.length === 0) {
                if (isSelect) {
                    this.db.all(sqliteText, [], (err: Error | null, rows: any[]) => {
                        if (err) reject(err);
                        else resolve({ rows, rowCount: rows ? rows.length : 0 });
                    });
                } else {
                    // For multi-statement scripts, exec is needed
                    this.db.exec(sqliteText, (err: Error | null) => {
                        if (err) reject(err);
                        else resolve({ rows: [], rowCount: 0 });
                    });
                }
            } else {
                if (isSelect) {
                    this.db.all(sqliteText, params, (err: Error | null, rows: any[]) => {
                        if (err) reject(err);
                        else resolve({ rows, rowCount: rows ? rows.length : 0 });
                    });
                } else {
                    this.db.run(sqliteText, params, function (this: any, err: Error | null) {
                        if (err) reject(err);
                        else resolve({
                            rows: [],
                            rowCount: this.changes,
                            lastID: this.lastID,
                            changes: this.changes
                        });
                    });
                }
            }
        });
    }
}

const dbType = process.env.DB_TYPE || 'postgres';
console.log('Database Type config:', dbType);
const db = dbType === 'postgres' ? new PostgresDatabase() : new SqliteDatabase();

export default db;
