<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { io, Socket } from 'socket.io-client';

const terminalElement = ref<HTMLElement | null>(null);
let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let socket: Socket | null = null;

const initializeTerminal = () => {
  if (!terminalElement.value) return;

  // 1. Setup Xterm
  term = new Terminal({
    cursorBlink: true,
    fontFamily: '"Cascadia Code", "Fira Code", monospace',
    fontSize: 14,
    theme: {
      background: '#0f172a',
      foreground: '#e2e8f0',
      cursor: '#818cf8',
      selectionBackground: '#334155',
      black: '#000000',
      red: '#ef4444',
      green: '#22c55e',
      yellow: '#eab308',
      blue: '#3b82f6',
      magenta: '#a855f7',
      cyan: '#06b6d4',
      white: '#ffffff',
    }
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(terminalElement.value);
  fitAddon.fit();

  // 2. Setup Socket.io
  // Probar la URL actual para el socket
  const protocol = window.location.protocol;
  const host = window.location.hostname;
  const port = 3000; // Backend port (ajustar si es necesario)
  
  socket = io(`${protocol}//${host}:${port}`);

  socket.on('connect', () => {
    term?.write('\x1b[32m[NubeOS] Conectado a la terminal del sistema\r\n\x1b[0m');
  });

  socket.on('output', (data: string) => {
    term?.write(data);
  });

  socket.on('disconnect', () => {
    term?.write('\r\n\x1b[31m[NubeOS] Conexión cerrada con el servidor\r\n\x1b[0m');
  });

  // 3. Bridge Terminal & Socket
  term.onData((data) => {
    socket?.emit('input', data);
  });

  term.onResize((size) => {
    socket?.emit('resize', { cols: size.cols, rows: size.rows });
  });

  // 4. Handle window resize
  window.addEventListener('resize', handleResize);
};

const handleResize = () => {
  fitAddon?.fit();
};

onMounted(() => {
  initializeTerminal();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  socket?.disconnect();
  term?.dispose();
});
</script>

<template>
  <div class="terminal-view-container">
    <div ref="terminalElement" class="xterm-wrapper"></div>
  </div>
</template>

<style scoped>
.terminal-view-container {
  width: 100%;
  height: 100%;
  background: #0f172a;
  padding: 10px;
  overflow: hidden;
}

.xterm-wrapper {
  width: 100%;
  height: 100%;
}

:deep(.xterm-viewport) {
  background-color: #0f172a !important;
}
</style>
