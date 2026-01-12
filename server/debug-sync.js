
import fetch from 'node-fetch';

const BASE = 'http://localhost:8000/api';

async function run() {
    console.log("--- DEBUGGER ---");

    // 1. Check existing
    console.log("Checking existing transactions...");
    try {
        const list = await fetch(`${BASE}/transactions?limit=1`).then(r => r.json());
        console.log(`Current Total: ${list.total}`);
    } catch (e) {
        console.log("Error fetching list:", e.message);
    }

    // 2. Trigger Sync
    console.log("\nTriggering Sync...");
    try {
        const res = await fetch(`${BASE}/data/sync/transactions`, { method: 'POST' });
        const json = await res.json();
        console.log("Sync Result:", JSON.stringify(json, null, 2));
    } catch (e) {
        console.log("Sync Failed:", e.message);
    }

    // 3. Check again
    console.log("\nChecking total again...");
    try {
        const list = await fetch(`${BASE}/transactions?limit=1`).then(r => r.json());
        console.log(`New Total: ${list.total}`);
    } catch (e) {
        console.log("Error fetching list:", e.message);
    }
}

run();
