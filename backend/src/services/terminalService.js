const pty = require('node-pty');
const os = require('os');

function initTerminalSocket(io) {
  io.on('connection', (socket) => {
    console.log('[TERM] Nuevo cliente conectado:', socket.id);

    const isWindows = os.platform() === 'win32';
    const shell = isWindows ? 'powershell.exe' : 'bash';

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.env.USERPROFILE,
      env: process.env
    });

    // Send pty output to client
    ptyProcess.onData((data) => {
      socket.emit('output', data);
    });

    // Receive input from client
    socket.on('input', (data) => {
      ptyProcess.write(data);
    });

    // Handle resizing
    socket.on('resize', (size) => {
      if (size && size.cols && size.rows) {
        ptyProcess.resize(size.cols, size.rows);
      }
    });

    socket.on('disconnect', () => {
      console.log('[TERM] Cliente desconectado, cerrando pty:', socket.id);
      ptyProcess.kill();
    });
  });
}

module.exports = { initTerminalSocket };
