const pty = require('node-pty');
const path = require('path');

// Communication protocol: Messages from parent (Bun) are JSON lines on stdin
// Messages to parent (Bun) are JSON lines on stdout
// PTY data is sent as raw bytes (base64 or similar) or simple strings if no binary is involved.
// For simplicity, we'll use a specific JSON format: { type: 'data'|'exit', ... }

const shell = process.argv[2] || (process.platform === 'darwin' ? 'zsh' : 'bash');
const cwd = process.argv[3] || process.cwd();
const cols = parseInt(process.argv[4] || '80');
const rows = parseInt(process.argv[5] || '24');

// Interactive flag for macOS shells to prevent SIGHUP
const shellArgs = (process.platform === 'darwin') ? ['-l'] : [];

const ptyProcess = pty.spawn(shell, shellArgs, {
  name: 'xterm-256color',
  cols: cols,
  rows: rows,
  cwd: cwd,
  env: {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    LANG: 'en_US.UTF-8'
  }
});

ptyProcess.onData((data) => {
  process.stdout.write(JSON.stringify({ type: 'data', data }) + '\n');
});

ptyProcess.onExit(({ exitCode, signal }) => {
  process.stdout.write(JSON.stringify({ type: 'exit', exitCode, signal }) + '\n');
  process.exit(0);
});

// Listen for commands from Bun
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    switch (msg.type) {
      case 'write':
        ptyProcess.write(msg.data);
        break;
      case 'resize':
        if (msg.cols > 0 && msg.rows > 0) {
          ptyProcess.resize(msg.cols, msg.rows);
        }
        break;
      case 'kill':
        ptyProcess.kill(msg.signal);
        process.exit(0);
        break;
    }
  } catch (e) {
    // Ignore invalid JSON
  }
});

// Keep process alive
process.stdin.resume();
