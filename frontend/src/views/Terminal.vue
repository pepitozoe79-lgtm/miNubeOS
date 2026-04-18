<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useAuthStore } from '../stores/auth';
import '@xterm/xterm/css/xterm.css';

const auth = useAuthStore();
const terminalRef = ref<HTMLDivElement | null>(null);
const isConnected = ref(false);
const isConnecting = ref(true);
const errorMessage = ref('');
const connectionRetries = ref(0);

let term: Terminal | null = null;
let fitAddon: FitAddon | null = null;
let ws: WebSocket | null = null;
let resizeObserver: ResizeObserver | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

const MAX_RETRIES = 3;

const initTerminal = () => {
  if (!terminalRef.value) return;

  // Create xterm instance with premium theme
  term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    cursorWidth: 2,
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "SF Mono", Menlo, Monaco, "Courier New", monospace',
    lineHeight: 1.4,
    letterSpacing: 0,
    allowProposedApi: true,
    scrollback: 5000,
    smoothScrollDuration: 100,
    theme: {
      background: '#0c0e14',
      foreground: '#c9d1d9',
      cursor: '#58a6ff',
      cursorAccent: '#0c0e14',
      selectionBackground: 'rgba(88, 166, 255, 0.25)',
      selectionForeground: '#ffffff',
      selectionInactiveBackground: 'rgba(88, 166, 255, 0.12)',
      black: '#0d1117',
      red: '#ff7b72',
      green: '#3fb950',
      yellow: '#d29922',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#39d2c0',
      white: '#c9d1d9',
      brightBlack: '#484f58',
      brightRed: '#ffa198',
      brightGreen: '#56d364',
      brightYellow: '#e3b341',
      brightBlue: '#79c0ff',
      brightMagenta: '#d2a8ff',
      brightCyan: '#56d4dd',
      brightWhite: '#f0f6fc',
    }
  });

  fitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();

  term.loadAddon(fitAddon);
  term.loadAddon(webLinksAddon);

  term.open(terminalRef.value);

  // Initial fit 
  nextTick(() => {
    try { fitAddon?.fit(); } catch (e) { /* ignore */ }
  });

  // Observe container size changes for responsive fit
  resizeObserver = new ResizeObserver(() => {
    try { fitAddon?.fit(); } catch (e) { /* ignore */ }
  });
  resizeObserver.observe(terminalRef.value);

  // Connect to backend WebSocket
  connectWebSocket();
};

const connectWebSocket = () => {
  if (!term || !auth.token) return;

  isConnecting.value = true;
  errorMessage.value = '';

  // Build WebSocket URL (same host, different protocol)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  // In dev mode, connect directly to backend port 3000
  // In production, connect to the same port
  const port = import.meta.env.DEV ? '3000' : window.location.port;
  const wsUrl = `${protocol}//${host}:${port}/ws/terminal?token=${auth.token}`;

  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    errorMessage.value = 'No se pudo crear la conexión WebSocket.';
    isConnecting.value = false;
    return;
  }

  ws.onopen = () => {
    isConnected.value = true;
    isConnecting.value = false;
    connectionRetries.value = 0;
    term?.focus();

    // Send initial terminal size
    if (term) {
      ws?.send(JSON.stringify({ 
        type: 'resize', 
        cols: term.cols, 
        rows: term.rows 
      }));
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'output' || msg.type === 'exit') {
        term?.write(msg.data);
      } else if (msg.type === 'error') {
        term?.write(`\r\n\x1b[1;31m❌ ${msg.data}\x1b[0m\r\n`);
        errorMessage.value = msg.data;
      }
    } catch (e) {
      // Raw data fallback
      term?.write(event.data);
    }
  };

  ws.onerror = () => {
    errorMessage.value = 'Error de conexión con el servidor.';
    isConnecting.value = false;
  };

  ws.onclose = (event) => {
    isConnected.value = false;
    isConnecting.value = false;

    if (event.code !== 1000 && connectionRetries.value < MAX_RETRIES) {
      // Auto-reconnect with backoff
      connectionRetries.value++;
      const delay = Math.min(2000 * connectionRetries.value, 8000);
      term?.write(`\r\n\x1b[0;33m⟳ Reconectando en ${delay / 1000}s... (intento ${connectionRetries.value}/${MAX_RETRIES})\x1b[0m\r\n`);
      
      reconnectTimeout = setTimeout(() => {
        connectWebSocket();
      }, delay);
    } else if (event.code !== 1000) {
      term?.write('\r\n\x1b[1;31m✖ Conexión perdida. Usa el botón reconectar.\x1b[0m\r\n');
    }
  };

  // Pipe terminal keyboard input -> WebSocket
  term.onData((data: string) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data }));
    }
  });
};

const handleReconnect = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Close existing connection
  if (ws) {
    ws.onclose = null; // Prevent auto-reconnect loop
    ws.close();
    ws = null;
  }

  connectionRetries.value = 0;
  
  // Clear terminal and reconnect
  term?.clear();
  term?.write('\x1b[1;36m⟳ Reconectando...\x1b[0m\r\n');
  
  connectWebSocket();
};

const handleClear = () => {
  term?.clear();
  term?.focus();
};

// Cleanup
onMounted(() => {
  nextTick(() => {
    initTerminal();
  });
});

onUnmounted(() => {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  
  if (term) {
    term.dispose();
    term = null;
  }
  
  fitAddon = null;
});

// Re-fit when the parent window changes
const handleFit = () => {
  nextTick(() => {
    try { fitAddon?.fit(); } catch (e) { /* ignore */ }
  });
};

// Expose for parent Window component resize events
defineExpose({ handleFit });
</script>

<template>
  <div class="terminal-container">
    <!-- Terminal Toolbar -->
    <div class="terminal-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="toolbar-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          NubeOS Terminal
        </span>
        <span class="connection-badge" :class="{ connected: isConnected, connecting: isConnecting }">
          <span class="badge-dot"></span>
          {{ isConnecting ? 'Conectando...' : (isConnected ? 'Conectado' : 'Desconectado') }}
        </span>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn" @click="handleClear" title="Limpiar terminal">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M21 21v-5h-5"></path>
          </svg>
        </button>
        <button 
          class="toolbar-btn reconnect" 
          @click="handleReconnect" 
          :disabled="isConnecting"
          title="Reconectar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Terminal Area -->
    <div class="terminal-body">
      <div ref="terminalRef" class="xterm-wrapper"></div>

      <!-- Connecting Overlay -->
      <div v-if="isConnecting && !isConnected" class="terminal-overlay">
        <div class="connecting-animation">
          <div class="pulse-ring"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </div>
        <span>Iniciando sesión de terminal...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #0c0e14;
  overflow: hidden;
  margin: -1.5rem;
}

/* ── Toolbar ── */
.terminal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  min-height: 40px;
  padding: 0 1rem;
  background: linear-gradient(180deg, #161b22, #0d1117);
  border-bottom: 1px solid rgba(88, 166, 255, 0.08);
  user-select: none;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  opacity: 0.8;
}

.dot.red { background: #ff5f57; }
.dot.yellow { background: #febc2e; }
.dot.green { background: #28c840; }

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #8b949e;
  letter-spacing: 0.02em;
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 70, 70, 0.1);
  color: #ff7b72;
  border: 1px solid rgba(255, 70, 70, 0.15);
}

.connection-badge.connected {
  background: rgba(63, 185, 80, 0.1);
  color: #3fb950;
  border-color: rgba(63, 185, 80, 0.15);
}

.connection-badge.connecting {
  background: rgba(210, 153, 34, 0.1);
  color: #d29922;
  border-color: rgba(210, 153, 34, 0.15);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.connection-badge.connecting .badge-dot {
  animation: blink 1s ease-in-out infinite;
}

.connection-badge.connected .badge-dot {
  box-shadow: 0 0 6px currentColor;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #484f58;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #c9d1d9;
}

.toolbar-btn.reconnect:hover {
  color: #3fb950;
  background: rgba(63, 185, 80, 0.1);
}

.toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Terminal Body ── */
.terminal-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding: 0.25rem;
}

.xterm-wrapper {
  width: 100%;
  height: 100%;
}

/* Override xterm.js viewport to remove scrollbar gutter gaps */
.xterm-wrapper :deep(.xterm) {
  height: 100%;
  padding: 0.5rem;
}

.xterm-wrapper :deep(.xterm-viewport) {
  scrollbar-width: thin;
  scrollbar-color: rgba(88, 166, 255, 0.15) transparent;
}

.xterm-wrapper :deep(.xterm-viewport::-webkit-scrollbar) {
  width: 6px;
}

.xterm-wrapper :deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background: rgba(88, 166, 255, 0.15);
  border-radius: 3px;
}

.xterm-wrapper :deep(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background: rgba(88, 166, 255, 0.3);
}

/* ── Overlays ── */
.terminal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  background: rgba(12, 14, 20, 0.92);
  z-index: 10;
  backdrop-filter: blur(4px);
  color: #8b949e;
  font-size: 0.85rem;
}

.connecting-animation {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #58a6ff;
}

.pulse-ring {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(88, 166, 255, 0.3);
  animation: pulse-expand 1.5s ease-out infinite;
}

@keyframes pulse-expand {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
