const path = require('path');
const fs = require('fs');

const DATA_DIR = path.resolve(__dirname, '../../../data/users');

const getUserRoot = (username) => {
  const userPath = path.join(DATA_DIR, username);
  if (!fs.existsSync(userPath)) {
    fs.mkdirSync(userPath, { recursive: true });
  }
  return userPath;
};

const getSafePath = (username, requestedPath = '') => {
  const root = getUserRoot(username);
  
  // Allow access to /media/nubeos for external drives
  if (requestedPath.startsWith('/media/nubeos')) {
     // Security: Prevent directory traversal even in /media
     const normalized = path.normalize(requestedPath);
     if (!normalized.startsWith('/media/nubeos')) {
       throw new Error('Acceso denegado: Intento de escape en medios externos.');
     }
     return normalized;
  }

  const fullPath = path.resolve(root, requestedPath);
  
  // Security check: ensure the path is within the user's root
  if (!fullPath.startsWith(root)) {
    throw new Error('Acceso denegado: Intento de escape de directorio.');
  }
  
  return fullPath;
};

module.exports = { getUserRoot, getSafePath, DATA_DIR };
