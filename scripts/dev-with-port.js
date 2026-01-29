#!/usr/bin/env node
/* Cross-platform dev server launcher with port selection and self-healing for EADDRINUSE */
const { spawn } = require('child_process');

const portArg = process.argv.find((a) => /^--?p(ort)?=/.test(a));
const portIndex = process.argv.findIndex((a) => a === '-p' || a === '--port');
let port = 3000;
if (portArg) {
  port = Number(String(portArg).split('=')[1] || '3000');
} else if (portIndex >= 0 && process.argv[portIndex + 1]) {
  port = Number(process.argv[portIndex + 1]);
}
if (!Number.isFinite(port) || port <= 0) port = 3000;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    child.on('exit', (code) => {
      if (code === 0) resolve(0); else reject(code);
    });
    child.on('error', (err) => reject(err));
  });
}

async function killPort(p) {
  try {
    if (process.platform === 'win32') {
      // Kill process by port on Windows
      // Find PID using netstat and taskkill it
      const find = spawn('powershell.exe', [
        '-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',
        `(Get-NetTCPConnection -LocalPort ${p} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess`
      ], { stdio: ['ignore','pipe','inherit'] });
      const chunks = [];
      const pid = await new Promise((res) => {
        find.stdout.on('data', (c) => chunks.push(Buffer.from(c)));
        find.on('exit', () => res(String(Buffer.concat(chunks)).trim()))
      });
      if (pid && /^\d+$/.test(pid)) {
        await run('taskkill', ['/PID', pid, '/F']);
      }
    } else if (process.platform === 'darwin') {
      await run('bash', ['-lc', `lsof -ti tcp:${p} | xargs -r kill -9 || true`]);
    } else {
      await run('bash', ['-lc', `fuser -k ${p}/tcp || lsof -ti tcp:${p} | xargs -r kill -9 || true`]);
    }
  } catch {}
}

async function main() {
  const args = ['next', 'dev', '-p', String(port)];
  const bin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const proc = spawn(bin, args, { stdio: 'inherit', shell: true });
  proc.on('error', async (err) => {
    if (String(err && err.message || '').includes('EADDRINUSE')) {
      console.warn(`Detected EADDRINUSE on port ${port}. Attempting to free the port and retry...`);
      await killPort(port);
      spawn(bin, args, { stdio: 'inherit', shell: true });
    }
  });
  proc.on('exit', async (code) => {
    if (code && code !== 0) {
      // Heuristic: if process failed, try to kill the port and retry once
      await killPort(port);
      spawn(bin, args, { stdio: 'inherit', shell: true });
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


