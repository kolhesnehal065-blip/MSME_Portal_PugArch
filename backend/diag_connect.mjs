import net from 'net';
import dotenv from 'dotenv';
dotenv.config();

function test(attempt) {
    return new Promise((resolve) => {
        console.log(`Attempt ${attempt}: Connecting to 34.93.235.136:5432`);
        const client = net.createConnection({ host: '34.93.235.136', port: 5432, timeout: 5000 }, () => {
            console.log('SUCCESS: Connected to port.');
            client.destroy();
            resolve(true);
        });
        client.on('error', (e) => {
            console.error(`ERROR: ${e.message}`);
            resolve(false);
        });
        client.on('timeout', () => {
            console.error('ERROR: Timeout');
            client.destroy();
            resolve(false);
        });
    });
}

async function main() {
    for(let i = 1; i <= 5; i++) {
        await test(i);
        await new Promise(r => setTimeout(r, 1000));
    }
}
main();
