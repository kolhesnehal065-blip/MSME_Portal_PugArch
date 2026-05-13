import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

// Override URL with additional params to rescue Prisma engine
const base = process.env.DATABASE_URL;
const connector = base.includes('?') ? '&' : '?';
const improvedUrl = `${base}${connector}connect_timeout=60&pool_timeout=60&sslmode=prefer`;

console.log('Attempting to run Prisma command via stable wrapper...');
try {
    execSync(process.argv[2], {
        env: { ...process.env, DATABASE_URL: improvedUrl },
        stdio: 'inherit'
    });
    console.log('Execution SUCCESSFUL');
} catch (e) {
    console.error('Execution FAILED');
}
