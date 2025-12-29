import { spawn, ChildProcess } from 'child_process';
import http from 'http';

/**
 * Vaporform Frontend Watchdog
 * 
 * PURPOSE:
 * Monitors the Next.js development server and keeps it running by automatically restarting
 * it if it crashes or becomes unresponsive. This is essential for development environments
 * where the frontend may crash due to code errors, hot-reload issues, or dependency problems.
 * 
 * FEATURES:
 * - Automatic restart on crash or unresponsiveness
 * - Network binding to 0.0.0.0 for remote development access
 * - Health check monitoring every 5 seconds
 * - Graceful shutdown on SIGINT/SIGTERM
 * - Restart throttling to prevent infinite restart loops
 * - Hung process detection and recovery
 * 
 * REMOTE DEVELOPMENT:
 * The Next.js server is configured (via package.json) to bind to 0.0.0.0, allowing
 * access from other machines on the network. This is crucial for remote development
 * scenarios such as coding from a different device or remote desktop sessions.
 * 
 * CONFIGURATION:
 * Adjust the constants below to tune behavior for your environment.
 */

// ===== CONFIGURATION =====
const FRONTEND_URL = 'http://0.0.0.0:3000';            // Health check endpoint
const CHECK_INTERVAL_MS = 5000;                         // How often to check health (5s)
const STARTUP_GRACE_PERIOD_MS = 15000;                  // Wait 15s after start before health checks (Next.js is slower)
const MAX_RESTART_ATTEMPTS = 5;                         // Max restarts in time window
const RESTART_WINDOW_MS = 60000;                        // Time window for restart limiting (1min)
const HUNG_PROCESS_THRESHOLD = 3;                       // Failed health checks before killing hung process

// ===== STATE =====
let frontendProcess: ChildProcess | null = null;
let isShuttingDown = false;
let isStarting = false;
let restartTimes: number[] = [];                        // Timestamps of recent restarts
let failedHealthChecks = 0;                             // Counter for consecutive failed checks

/**
 * Health Check Function
 * 
 * Attempts to connect to the frontend HTTP endpoint to verify it's responsive.
 * Returns true if the server responds (any status code), false otherwise.
 */
function checkHealth(): Promise<boolean> {
    return new Promise((resolve) => {
        const req = http.get(FRONTEND_URL, (res) => {
            // Any response code means the server is listening and responsive
            resolve(true);
        });

        req.on('error', (err) => {
            // Connection refused, timeout, or other network error
            resolve(false);
        });

        // Set timeout to avoid hanging forever
        req.setTimeout(3000, () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

/**
 * Check Restart Rate Limit
 * 
 * Prevents infinite restart loops by limiting restarts to MAX_RESTART_ATTEMPTS
 * within the RESTART_WINDOW_MS time window.
 * 
 * @returns true if restart is allowed, false if rate limit exceeded
 */
function canRestart(): boolean {
    const now = Date.now();

    // Remove restart times outside the window
    restartTimes = restartTimes.filter(time => now - time < RESTART_WINDOW_MS);

    if (restartTimes.length >= MAX_RESTART_ATTEMPTS) {
        console.error(`[Frontend Watchdog] ❌ Restart rate limit exceeded! ${MAX_RESTART_ATTEMPTS} restarts in ${RESTART_WINDOW_MS / 1000}s.`);
        console.error(`[Frontend Watchdog] Frontend is crash-looping. Please check logs and fix the issue.`);
        return false;
    }

    restartTimes.push(now);
    return true;
}

/**
 * Start Next.js Frontend
 * 
 * Spawns the Next.js development server with network binding to 0.0.0.0 for remote access.
 * 
 * NETWORK BINDING EXPLAINED:
 * The package.json dev script includes "-H 0.0.0.0" which tells Next.js to bind to all interfaces:
 * - 127.0.0.1 (localhost): Only accessible from the same machine
 * - 0.0.0.0 (all interfaces): Accessible from any network interface, including remote machines
 * 
 * For remote development (e.g., SSH, remote desktop), 0.0.0.0 is essential.
 * In production, use proper deployment platforms (Vercel, Netlify) or reverse proxies.
 */
function startFrontend() {
    if (isShuttingDown || isStarting) return;

    if (!canRestart()) {
        console.error('[Frontend Watchdog] Giving up on restarts. Exiting.');
        process.exit(1);
    }

    console.log('[Frontend Watchdog] 🚀 Starting Next.js dev server...');
    isStarting = true;
    failedHealthChecks = 0; // Reset counter

    frontendProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
    });

    frontendProcess.on('exit', (code, signal) => {
        console.log(`[Frontend Watchdog] ⚠️  Frontend process exited with code ${code} signal ${signal}`);
        frontendProcess = null;
        isStarting = false;
    });

    frontendProcess.on('error', (err) => {
        console.error('[Frontend Watchdog] ❌ Failed to spawn frontend:', err);
        isStarting = false;
    });

    // Grace period: Don't check health immediately after starting (Next.js takes time to compile)
    setTimeout(() => {
        isStarting = false;
        console.log('[Frontend Watchdog] ✓ Startup grace period complete');
    }, STARTUP_GRACE_PERIOD_MS);
}

/**
 * Stop Frontend
 * 
 * Gracefully kills the frontend process if running.
 */
function stopFrontend() {
    if (frontendProcess) {
        console.log('[Frontend Watchdog] 🛑 Stopping frontend process...');
        frontendProcess.kill('SIGTERM');

        // Force kill if it doesn't stop within 5s
        setTimeout(() => {
            if (frontendProcess) {
                console.log('[Frontend Watchdog] Force killing frontend...');
                frontendProcess.kill('SIGKILL');
            }
        }, 5000);

        frontendProcess = null;
    }
}

/**
 * Main Monitoring Loop
 * 
 * Continuously checks frontend health and restarts if necessary.
 * 
 * HUNG PROCESS DETECTION:
 * If the process exists but fails health checks HUNG_PROCESS_THRESHOLD times,
 * we assume it's hung and force a restart.
 */
async function monitor() {
    if (isShuttingDown) return;

    if (isStarting) {
        // Skip check during startup grace period
        setTimeout(monitor, CHECK_INTERVAL_MS);
        return;
    }

    const isHealthy = await checkHealth();

    if (!isHealthy) {
        failedHealthChecks++;

        if (!frontendProcess) {
            // Process doesn't exist - start it
            console.log(`[Frontend Watchdog] ⚠️  Frontend not running (${failedHealthChecks} failed checks). Starting...`);
            failedHealthChecks = 0;
            startFrontend();
        } else {
            // Process exists but health check failed - might be hung
            console.log(`[Frontend Watchdog] ⚠️  Frontend process exists but health check failed (${failedHealthChecks}/${HUNG_PROCESS_THRESHOLD})`);

            if (failedHealthChecks >= HUNG_PROCESS_THRESHOLD) {
                console.log('[Frontend Watchdog] ❌ Frontend appears to be hung. Forcing restart...');
                stopFrontend();
                failedHealthChecks = 0;
                // Will be restarted on next tick
            }
        }
    } else {
        // Healthy - reset counter
        if (failedHealthChecks > 0) {
            console.log('[Frontend Watchdog] ✓ Frontend recovered');
        }
        failedHealthChecks = 0;
    }

    setTimeout(monitor, CHECK_INTERVAL_MS);
}

// ===== SIGNAL HANDLERS =====
process.on('SIGINT', () => {
    console.log('\n[Frontend Watchdog] Received SIGINT. Shutting down...');
    isShuttingDown = true;
    stopFrontend();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[Frontend Watchdog] Received SIGTERM. Shutting down...');
    isShuttingDown = true;
    stopFrontend();
    process.exit(0);
});

// ===== START =====
console.log('═'.repeat(60));
console.log('[Frontend Watchdog] Vaporform Frontend Watchdog Started');
console.log(`[Frontend Watchdog] Monitoring: ${FRONTEND_URL}`);
console.log(`[Frontend Watchdog] Check interval: ${CHECK_INTERVAL_MS}ms`);
console.log(`[Frontend Watchdog] Max restarts: ${MAX_RESTART_ATTEMPTS}/${RESTART_WINDOW_MS / 1000}s`);
console.log('═'.repeat(60));
monitor();
