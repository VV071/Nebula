// SQLite connection layer — same pattern as the Nebula backend it was
// ported from: a promise-based query(text, params) API with pg-style $n
// placeholders rewritten to sqlite's ?, so queries stay portable.

import path from 'path';

const sqlite3 = require('sqlite3').verbose();

export interface QueryResult {
    rows: any[];
    rowCount: number;
    lastID?: number;
    changes?: number;
}

class SqliteDatabase {
    private db: any;

    constructor() {
        const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'sme_copilot.db');
        console.log('Opening SQLite DB at:', dbPath);
        this.db = new sqlite3.Database(dbPath, (err: Error | null) => {
            if (err) console.error('Could not connect to database', err);
            else {
                console.log('Connected to SQLite database');
                this.db.run('PRAGMA journal_mode = WAL');
                this.db.run('PRAGMA foreign_keys = ON');
            }
        });
    }

    async query(text: string, params?: any[]): Promise<QueryResult> {
        const sqliteText = text.replace(/\$\d+/g, '?');

        return new Promise((resolve, reject) => {
            const trimmed = sqliteText.trim().toUpperCase();
            const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA');

            if (!params || params.length === 0) {
                if (isSelect) {
                    this.db.all(sqliteText, [], (err: Error | null, rows: any[]) => {
                        if (err) reject(err);
                        else resolve({ rows, rowCount: rows ? rows.length : 0 });
                    });
                } else {
                    // Multi-statement scripts (migrations) need exec
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
                            changes: this.changes,
                        });
                    });
                }
            }
        });
    }
}

const db = new SqliteDatabase();

export default db;
