import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

import app from './app';
import { startScheduler } from './scheduler';

const PORT = parseInt(process.env.PORT || '5005', 10);

const server = app.listen(PORT, () => {
    console.log(`[Backend] Server running on port ${PORT}`);
    console.log(`[Backend] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Backend] Health check: http://localhost:${PORT}/api/health`);
    startScheduler();
});

server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`[CRITICAL] Port ${PORT} is already in use.`);
        console.error(`Please kill the process using port ${PORT} or check for other running instances.`);
        process.exit(1);
    } else {
        console.error('[CRITICAL] Server error:', error);
        process.exit(1);
    }
});
