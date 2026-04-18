/**
 * Terminal WebSocket Service
 * 
 * Provides a real shell session over WebSocket.
 * Uses child_process.spawn for maximum compatibility (no native deps like node-pty).
 * Authenticates via JWT token passed as query parameter.
 */

const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const path = require('path');

// Track active sessions for cleanup
const activeSessions = new Map();

function attachTerminalWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server, 
    path: '/ws/terminal' 
  });

  console.log('🖥️  Terminal WebSocket server attached at /ws/terminal');

  wss.on('connection', (ws, req) => {
    // --- 1. Authenticate ---
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.send(JSON.stringify({ type: 'error', data: 'Autenticación requerida.' }));
      ws.close(4001, 'No token');
      return;
    }

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', data: 'Token inválido o expirado.' }));
      ws.close(4002, 'Invalid token');
      return;
    }

    // Only admins can use terminal
    if (user.role !== 'admin') {
      ws.send(JSON.stringify({ type: 'error', data: 'Se requiere rol de administrador.' }));
      ws.close(4003, 'Not admin');
      return;
    }

    // --- 2. Spawn Shell Process ---
    const isLinux = process.platform === 'linux';
    const shell = isLinux ? '/bin/bash' : 'powershell.exe';
    const shellArgs = isLinux ? ['--login'] : ['-NoLogo', '-NoProfile'];
    const homeDir = isLinux 
      ? (process.env.HOME || '/root') 
      : (process.env.USERPROFILE || 'C:\\');

    let proc;
    try {
      proc = spawn(shell, shellArgs, {
        cwd: homeDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          LANG: 'en_US.UTF-8',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', data: `No se pudo iniciar la shell: ${err.message}` }));
      ws.close(4004, 'Shell spawn failed');
      return;
    }

    const sessionId = `${user.username}-${Date.now()}`;
    activeSessions.set(sessionId, { proc, user: user.username });

    console.log(`[Terminal] Session started: ${sessionId} (${shell})`);

    // Send welcome banner
    const welcomeBanner = [
      '\x1b[1;36m╔══════════════════════════════════════════════╗\x1b[0m',
      '\x1b[1;36m║\x1b[0m  \x1b[1;37m🖥️  NubeOS Terminal\x1b[0m                          \x1b[1;36m║\x1b[0m',
      `\x1b[1;36m║\x1b[0m  \x1b[0;33mUsuario: ${user.username.padEnd(35)}\x1b[1;36m║\x1b[0m`,
      `\x1b[1;36m║\x1b[0m  \x1b[0;33mShell:   ${path.basename(shell).padEnd(35)}\x1b[1;36m║\x1b[0m`,
      '\x1b[1;36m╚══════════════════════════════════════════════╝\x1b[0m',
      '',
    ].join('\r\n');

    ws.send(JSON.stringify({ type: 'output', data: welcomeBanner }));

    // --- 3. Pipe shell output -> WebSocket ---
    proc.stdout.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: data.toString('utf8') }));
      }
    });

    proc.stderr.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: data.toString('utf8') }));
      }
    });

    proc.on('exit', (code) => {
      console.log(`[Terminal] Process exited for ${sessionId} with code ${code}`);
      activeSessions.delete(sessionId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'exit', 
          data: `\r\n\x1b[1;31m[Proceso terminado con código ${code}]\x1b[0m\r\n` 
        }));
        ws.close(1000, 'Process exited');
      }
    });

    proc.on('error', (err) => {
      console.error(`[Terminal] Process error for ${sessionId}:`, err.message);
      activeSessions.delete(sessionId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'error', data: `Error del proceso: ${err.message}` }));
        ws.close(4005, 'Process error');
      }
    });

    // --- 4. Pipe WebSocket input -> shell stdin ---
    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message.toString());
        
        if (msg.type === 'input' && proc.stdin.writable) {
          proc.stdin.write(msg.data);
        } else if (msg.type === 'resize') {
          // For spawn-based shells, we can't truly resize, 
          // but we store the info for future use
          // (node-pty would support proc.resize(cols, rows))
        }
      } catch (e) {
        // If not JSON, treat as raw input
        if (proc.stdin.writable) {
          proc.stdin.write(message.toString());
        }
      }
    });

    // --- 5. Cleanup on disconnect ---
    ws.on('close', () => {
      console.log(`[Terminal] WebSocket closed for ${sessionId}`);
      activeSessions.delete(sessionId);
      
      try {
        if (!proc.killed) {
          proc.stdin.end();
          proc.kill('SIGTERM');
          
          // Force kill after 3 seconds if still alive
          setTimeout(() => {
            try {
              if (!proc.killed) proc.kill('SIGKILL');
            } catch (e) { /* ignore */ }
          }, 3000);
        }
      } catch (e) {
        // Process may already be dead
      }
    });

    ws.on('error', (err) => {
      console.error(`[Terminal] WebSocket error for ${sessionId}:`, err.message);
    });
  });

  // Cleanup all sessions on server shutdown
  process.on('SIGINT', () => {
    activeSessions.forEach(({ proc }, id) => {
      try { proc.kill('SIGTERM'); } catch (e) { /* ignore */ }
    });
  });

  return wss;
}

module.exports = { attachTerminalWebSocket };
