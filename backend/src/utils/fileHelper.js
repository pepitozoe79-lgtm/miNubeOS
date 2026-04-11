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
  const fullPath = path.join(root, requestedPath);
  
  // Security check: ensure the path is within the user's root
  if (!fullPath.startsWith(root)) {
    throw new Error('Acceso denegado: Intento de escape de directorio.');
  }
  
  return fullPath;
};

module.exports = { getUserRoot, getSafePath };
