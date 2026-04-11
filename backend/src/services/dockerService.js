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
  return [
    { id: 'nextcloud', name: 'Nextcloud', description: 'Nube personal y colaboración.', image: 'nextcloud', icon: '☁️', ports: { '80/tcp': 8080 } },
    { id: 'plex', name: 'Plex', description: 'Servidor de medios avanzado.', image: 'plexinc/pms-docker', icon: '🎬', ports: { '32400/tcp': 32400 } },
    { id: 'homeassistant', name: 'Home Assistant', description: 'Domótica inteligente.', image: 'homeassistant/home-assistant', icon: '🏠', ports: { '8123/tcp': 8123 } },
    { id: 'mariadb', name: 'MariaDB', description: 'Base de datos SQL.', image: 'mariadb', icon: '🗄️', ports: { '3306/tcp': 3306 } },
    { id: 'transmission', name: 'Transmission', description: 'Cliente BitTorrent ligero.', image: 'linuxserver/transmission', icon: '⏬', ports: { '9091/tcp': 9091 } }
  ];
};

const installApp = async (appId) => {
  if (isMockMode) return true;
  
  const apps = getAvailableApps();
  const app = apps.find(a => a.id === appId);
  if (!app) throw new Error('Aplicación no encontrada en la tienda');

  // Pull image
  await new Promise((resolve, reject) => {
    docker.pull(app.image, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
  });

  // Prepare Port Bindings
  const portBindings = {};
  const exposedPorts = {};
  for (const [containerPort, hostPort] of Object.entries(app.ports)) {
    portBindings[containerPort] = [{ HostPort: hostPort.toString() }];
    exposedPorts[containerPort] = {};
  }

  // Create Container
  const container = await docker.createContainer({
    Image: app.image,
    name: `nubeos-${app.id}`,
    ExposedPorts: exposedPorts,
    HostConfig: {
      PortBindings: portBindings,
      RestartPolicy: { Name: 'always' }
    }
  });

  return await container.start();
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
  installApp,
  isMockMode: () => isMockMode
};
