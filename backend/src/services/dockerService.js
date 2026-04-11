const Docker = require('dockerode');
const docker = new Docker(); // Defaults to /var/run/docker.sock or Win local pipe

let isMockMode = false;

const getContainers = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    return containers.map(c => ({
      id: c.Id,
      name: c.Names[0].replace('/', ''),
      image: c.Image,
      status: c.State,
      state: c.Status
    }));
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      isMockMode = true;
      return [
        { id: '1', name: 'Nextcloud', image: 'nextcloud:latest', status: 'running', state: 'Up 2 hours' },
        { id: '2', name: 'Pi-hole', image: 'pihole/pihole:latest', status: 'exited', state: 'Exited (0) 5 days ago' },
        { id: '3', name: 'Plex', image: 'plexinc/pms-docker', status: 'running', state: 'Up 10 minutes' }
      ];
    }
    throw error;
  }
};

const getAvailableApps = () => {
  // Mock "App Store" - This could come from a JSON file later
  return [
    { id: 'nextcloud', name: 'Nextcloud', description: 'Nube personal y colaboración.', image: 'nextcloud', icon: '☁️' },
    { id: 'plex', name: 'Plex', description: 'Servidor de medios avanzado.', image: 'plexinc/pms-docker', icon: '🎬' },
    { id: 'homeassistant', name: 'Home Assistant', description: 'Domótica inteligente.', image: 'homeassistant/home-assistant', icon: '🏠' },
    { id: 'mariadb', name: 'MariaDB', description: 'Base de datos SQL.', image: 'mariadb', icon: '🗄️' },
    { id: 'transmission', name: 'Transmission', description: 'Cliente BitTorrent ligero.', image: 'linuxserver/transmission', icon: '⏬' }
  ];
};

const startContainer = async (id) => {
  if (isMockMode) return true;
  const container = docker.getContainer(id);
  return await container.start();
};

const stopContainer = async (id) => {
  if (isMockMode) return true;
  const container = docker.getContainer(id);
  return await container.stop();
};

module.exports = {
  getContainers,
  getAvailableApps,
  startContainer,
  stopContainer,
  isMockMode: () => isMockMode
};
