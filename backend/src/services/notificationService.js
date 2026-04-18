let io;

/**
 * Initialize Notification Service with Socket.io instance
 * @param {import('socket.io').Server} socketIo 
 */
function initNotificationService(socketIo) {
  io = socketIo;
}

/**
 * Send a system notification to all connected clients
 * @param {Object} notification 
 * @param {string} notification.title
 * @param {string} notification.message
 * @param {'info'|'success'|'warning'|'error'} notification.type
 */
function notifyAll(notification) {
  if (!io) {
    console.warn('[NOTIFY] Service not initialized yet');
    return;
  }

  const payload = {
    id: Date.now().toString(),
    timestamp: new Date(),
    title: notification.title || 'Sistema',
    message: notification.message,
    type: notification.type || 'info',
    read: false
  };

  console.log(`[NOTIFY] Emitting: ${payload.title} - ${payload.message}`);
  io.emit('notification', payload);
}

module.exports = {
  initNotificationService,
  notifyAll
};
