const Docker = require('dockerode');
const isLinux = process.platform === 'linux';

const docker = new Docker(isLinux ? { socketPath: '/var/run/docker.sock' } : {});
const { DATA_DIR } = require('../utils/fileHelper');
const path = require('path');
const APPDATA_BASE = isLinux ? '/opt/nubeos/appdata' : path.resolve(__dirname, '../../../data/appdata').replace(/\\/g, '/');

let isMockMode = false;

const getContainers = async () => {
  try {
    const containers = await docker.listContainers({ all: true });
    return containers.map(c => ({
      id: c.Id,
      name: c.Names[0].replace('/', ''),
      image: c.Image,
      status: c.State,
      state: c.Status,
      ports: c.Ports || []
    }));
  } catch (error) {
    console.warn('⚠️ Docker no accesible:', error.message);
    if (process.env.NODE_ENV === 'development' || error.message.includes('permission denied') || error.code === 'ENOENT') {
      isMockMode = true;
      return [];
    }
    return [];
  }
};

const ICON_CDN = 'https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png';

const getAvailableApps = () => {
  return [
    // ── Cloud ──
    {
      id: 'nextcloud',
      name: 'Nextcloud',
      description: 'Tu propia nube personal. Almacena, sincroniza y comparte archivos, calendario, contactos y más.',
      image: 'nextcloud:latest',
      icon: `${ICON_CDN}/nextcloud.png`,
      category: 'cloud',
      developer: 'Nextcloud GmbH',
      ports: { '80/tcp': 8080 },
      volumes: { 
        '/var/www/html': `${APPDATA_BASE}/nextcloud/html`,
        '/storage': DATA_DIR 
      },
      webPort: 8080
    },
    {
      id: 'syncthing',
      name: 'Syncthing',
      description: 'Sincronización continua de archivos entre dispositivos. Descentralizado y privado.',
      image: 'syncthing/syncthing:latest',
      icon: `${ICON_CDN}/syncthing.png`,
      category: 'cloud',
      developer: 'Syncthing Foundation',
      ports: { '8384/tcp': 8384, '22000/tcp': 22000 },
      volumes: { '/var/syncthing': `${APPDATA_BASE}/syncthing/data` },
      webPort: 8384
    },
    {
      id: 'filebrowser',
      name: 'FileBrowser',
      description: 'Explorador de archivos web con interfaz moderna. Subida, descarga y gestión de archivos.',
      image: 'filebrowser/filebrowser:latest',
      icon: `${ICON_CDN}/filebrowser.png`,
      category: 'cloud',
      developer: 'FileBrowser',
      ports: { '80/tcp': 8082 },
      volumes: { 
        '/srv': `${APPDATA_BASE}/filebrowser/srv`, 
        '/database.db': `${APPDATA_BASE}/filebrowser/database.db` 
      },
      webPort: 8082
    },

    // ── Media ──
    {
      id: 'plex',
      name: 'Plex',
      description: 'Servidor multimedia avanzado. Organiza y transmite películas, series y música.',
      image: 'lscr.io/linuxserver/plex:latest',
      icon: `${ICON_CDN}/plex.png`,
      category: 'media',
      developer: 'Plex Inc.',
      ports: { '32400/tcp': 32400 },
      volumes: { 
        '/config': `${APPDATA_BASE}/plex/config`, 
        '/Media': DATA_DIR 
      },
      env: { PUID: '1000', PGID: '1000', VERSION: 'docker' },
      networkMode: 'host',
      webPort: 32400,
      webPath: '/web/index.html'
    },
    {
      id: 'jellyfin',
      name: 'Jellyfin',
      description: 'El sistema de medios de software libre. Colecciona, gestiona y transmite tus archivos multimedia.',
      image: 'jellyfin/jellyfin:latest',
      icon: `${ICON_CDN}/jellyfin.png`,
      category: 'media',
      developer: 'Jellyfin Project',
      ports: { '8096/tcp': 8096 },
      volumes: { 
        '/config': `${APPDATA_BASE}/jellyfin/config`, 
        '/cache': `${APPDATA_BASE}/jellyfin/cache`, 
        '/media': DATA_DIR 
      },
      webPort: 8096
    },
    {
      id: 'emby',
      name: 'Emby Server',
      description: 'Organiza y transmite tus videos, música y fotos a cualquier dispositivo. Potente y fácil de usar.',
      image: 'emby/embyserver:latest',
      icon: `${ICON_CDN}/emby.png`,
      category: 'media',
      developer: 'Emby LLC',
      ports: { '8096/tcp': 8095, '8920/tcp': 8921 },
      volumes: { 
        '/config': `${APPDATA_BASE}/emby/config`, 
        '/data': DATA_DIR 
      },
      webPort: 8095
    },
    {
      id: 'photoprism',
      name: 'PhotoPrism',
      description: 'Galería de fotos inteligente con reconocimiento facial y clasificación automática por IA.',
      image: 'photoprism/photoprism:latest',
      icon: `${ICON_CDN}/photoprism.png`,
      category: 'media',
      developer: 'PhotoPrism UG',
      ports: { '2342/tcp': 2342 },
      volumes: { 
        '/photoprism/storage': `${APPDATA_BASE}/photoprism/storage`, 
        '/photoprism/originals': DATA_DIR 
      },
      env: { PHOTOPRISM_ADMIN_PASSWORD: 'nubeos123' },
      webPort: 2342
    },
    {
      id: 'navidrome',
      name: 'Navidrome',
      description: 'Servidor de música moderno. Transmite tu colección musical desde cualquier dispositivo.',
      image: 'deluan/navidrome:latest',
      icon: `${ICON_CDN}/navidrome.png`,
      category: 'media',
      developer: 'Navidrome',
      ports: { '4533/tcp': 4533 },
      volumes: { 
        '/data': `${APPDATA_BASE}/navidrome/data`, 
        '/music': DATA_DIR 
      },
      webPort: 4533
    },
    {
      id: 'deemix',
      name: 'Deemix',
      description: 'Descarga de música en alta calidad (FLAC/MP3). Gestiona y descarga tu biblioteca musical de forma sencilla.',
      image: 'ghcr.io/bambanah/deemix:latest',
      icon: `${ICON_CDN}/deemix.png`,
      category: 'media',
      developer: 'Bambanah',
      ports: { '6595/tcp': 6595 },
      volumes: { 
        '/config': `${APPDATA_BASE}/deemix/config`, 
        '/downloads': DATA_DIR 
      },
      env: { PUID: '1000', PGID: '1000' },
      webPort: 6595
    },

    // ── Productividad ──
    {
      id: 'homeassistant',
      name: 'Home Assistant',
      description: 'Automatización del hogar inteligente. Controla luces, sensores y dispositivos IoT.',
      image: 'homeassistant/home-assistant:latest',
      icon: `${ICON_CDN}/home-assistant.png`,
      category: 'productivity',
      developer: 'Nabu Casa',
      ports: { '8123/tcp': 8123 },
      volumes: { '/config': `${APPDATA_BASE}/homeassistant/config` },
      webPort: 8123
    },
    {
      id: 'vaultwarden',
      name: 'Vaultwarden',
      description: 'Gestor de contraseñas seguro. Compatible con Bitwarden, auto-hospedado.',
      image: 'vaultwarden/server:latest',
      icon: `${ICON_CDN}/vaultwarden.png`,
      category: 'productivity',
      developer: 'Vaultwarden',
      ports: { '80/tcp': 8083 },
      volumes: { '/data': `${APPDATA_BASE}/vaultwarden/data` },
      webPort: 8083
    },

    // ── Desarrollo ──
    {
      id: 'gitea',
      name: 'Gitea',
      description: 'Servidor Git ligero y rápido. Tu propio GitHub privado.',
      image: 'gitea/gitea:latest',
      icon: `${ICON_CDN}/gitea.png`,
      category: 'development',
      developer: 'Gitea Community',
      ports: { '3000/tcp': 3001, '22/tcp': 2222 },
      volumes: { '/data': `${APPDATA_BASE}/gitea/data` },
      webPort: 3001
    },
    {
      id: 'codeserver',
      name: 'Code Server',
      description: 'Visual Studio Code en el navegador. Programa desde cualquier dispositivo.',
      image: 'lscr.io/linuxserver/code-server:latest',
      icon: `${ICON_CDN}/visual-studio-code.png`,
      category: 'development',
      developer: 'Coder Inc.',
      ports: { '8443/tcp': 8443 },
      volumes: { 
        '/config': `${APPDATA_BASE}/codeserver/config`,
        '/home/coder/project': DATA_DIR
      },
      env: { PUID: '1000', PGID: '1000', DEFAULT_WORKSPACE: '/config/workspace' },
      webPort: 8443
    },

    // ── Base de Datos ──
    {
      id: 'mariadb',
      name: 'MariaDB',
      description: 'Base de datos relacional SQL de alto rendimiento. Fork mejorado de MySQL.',
      image: 'mariadb:latest',
      icon: `${ICON_CDN}/mariadb.png`,
      category: 'database',
      developer: 'MariaDB Foundation',
      ports: { '3306/tcp': 3306 },
      volumes: { '/var/lib/mysql': `${APPDATA_BASE}/mariadb/data` },
      env: { MYSQL_ROOT_PASSWORD: 'nubeos123' }
    },
    {
      id: 'postgres',
      name: 'PostgreSQL',
      description: 'Base de datos relacional avanzada. La más potente del mundo open-source.',
      image: 'postgres:16-alpine',
      icon: `${ICON_CDN}/postgresql.png`,
      category: 'database',
      developer: 'PostgreSQL Global',
      ports: { '5432/tcp': 5432 },
      volumes: { '/var/lib/postgresql/data': `${APPDATA_BASE}/postgres/data` },
      env: { POSTGRES_PASSWORD: 'nubeos123' }
    },
    {
      id: 'redis',
      name: 'Redis',
      description: 'Almacén clave-valor en memoria, ultra-rápido. Ideal para caché y colas.',
      image: 'redis:alpine',
      icon: `${ICON_CDN}/redis.png`,
      category: 'database',
      developer: 'Redis Ltd.',
      ports: { '6379/tcp': 6379 },
      volumes: { '/data': `${APPDATA_BASE}/redis/data` }
    },

    // ── Seguridad ──
    {
      id: 'pihole',
      name: 'Pi-hole',
      description: 'Bloqueador de anuncios a nivel DNS. Protege toda tu red doméstica.',
      image: 'pihole/pihole:latest',
      icon: `${ICON_CDN}/pi-hole.png`,
      category: 'security',
      developer: 'Pi-hole LLC',
      ports: { '80/tcp': 8084, '53/tcp': 53, '53/udp': 53 },
      volumes: { 
        '/etc/pihole': `${APPDATA_BASE}/pihole/etc`, 
        '/etc/dnsmasq.d': `${APPDATA_BASE}/pihole/dnsmasq` 
      },
      env: { WEBPASSWORD: 'nubeos123' },
      webPort: 8084,
      webPath: '/admin'
    },
    {
      id: 'wireguard',
      name: 'WireGuard',
      description: 'VPN moderna, rápida y segura. Accede a tu red doméstica desde cualquier lugar.',
      image: 'lscr.io/linuxserver/wireguard:latest',
      icon: `${ICON_CDN}/wireguard.png`,
      category: 'security',
      developer: 'LinuxServer.io',
      ports: { '51820/udp': 51820 },
      volumes: { '/config': `${APPDATA_BASE}/wireguard/config` },
      env: { PUID: '1000', PGID: '1000', SERVERPORT: '51820' }
    },

    // ── Utilidades ──
    {
      id: 'transmission',
      name: 'Transmission',
      description: 'Cliente BitTorrent ligero con interfaz web. Descarga archivos de forma eficiente.',
      image: 'lscr.io/linuxserver/transmission:latest',
      icon: `${ICON_CDN}/transmission.png`,
      category: 'utilities',
      developer: 'LinuxServer.io',
      ports: { '9091/tcp': 9091, '51413/tcp': 51413 },
      volumes: { 
        '/config': `${APPDATA_BASE}/transmission/config`, 
        '/downloads': DATA_DIR 
      },
      env: { PUID: '1000', PGID: '1000' },
      webPort: 9091
    },
    {
      id: 'portainer',
      name: 'Portainer',
      description: 'Panel visual para gestionar contenedores Docker. Monitorea y administra tus apps.',
      image: 'portainer/portainer-ce:latest',
      icon: `${ICON_CDN}/portainer.png`,
      category: 'utilities',
      developer: 'Portainer.io',
      ports: { '9000/tcp': 9000 },
      volumes: { 
        '/data': `${APPDATA_BASE}/portainer/data`, 
        '/var/run/docker.sock': '/var/run/docker.sock' 
      },
      webPort: 9000
    },
    {
      id: 'uptimekuma',
      name: 'Uptime Kuma',
      description: 'Monitoreo de servicios con alertas. Vigila que tus sitios y apps estén siempre activos.',
      image: 'louislam/uptime-kuma:latest',
      icon: `${ICON_CDN}/uptime-kuma.png`,
      category: 'utilities',
      developer: 'Louis Lam',
      ports: { '3001/tcp': 3002 },
      volumes: { '/app/data': `${APPDATA_BASE}/uptimekuma/data` },
      webPort: 3002
    },
    {
      id: 'homarr',
      name: 'Homarr',
      description: 'Dashboard personalizable para tu servidor. Accede a todas tus apps desde un solo lugar.',
      image: 'ghcr.io/homarr-labs/homarr:latest',
      icon: `${ICON_CDN}/homarr.png`,
      category: 'utilities',
      developer: 'Homarr Labs',
      ports: { '7575/tcp': 7575 },
      volumes: { '/appdata': `${APPDATA_BASE}/homarr/data` },
      webPort: 7575
    },
  ];
};

const installApp = async (appId) => {
  if (isMockMode) return true;

  const apps = getAvailableApps();
  const app = apps.find(a => a.id === appId);
  if (!app) throw new Error('Aplicación no encontrada en la tienda');

  console.log(`📦 Instalando ${app.name} (${app.image})...`);

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

  console.log(`✅ Imagen descargada: ${app.image}`);

  // Prepare Port Bindings
  const portBindings = {};
  const exposedPorts = {};
  for (const [containerPort, hostPort] of Object.entries(app.ports)) {
    portBindings[containerPort] = [{ HostPort: hostPort.toString() }];
    exposedPorts[containerPort] = {};
  }

  // Prepare Volume Binds
  const binds = [];
  if (app.volumes) {
    const fs = require('fs');
    for (const [containerPath, hostPath] of Object.entries(app.volumes)) {
      // Don't create dirs for socket files
      if (!hostPath.endsWith('.sock') && !hostPath.endsWith('.db')) {
        if (!fs.existsSync(hostPath)) {
          fs.mkdirSync(hostPath, { recursive: true });
        }
      }
      binds.push(`${hostPath}:${containerPath}`);
    }
  }

  // Prepare Environment Variables
  const envArr = [];
  if (app.env) {
    for (const [key, value] of Object.entries(app.env)) {
      envArr.push(`${key}=${value}`);
    }
  }

  // Create Container config
  const containerConfig = {
    Image: app.image,
    name: `nubeos-${app.id}`,
    ExposedPorts: exposedPorts,
    Env: envArr.length > 0 ? envArr : undefined,
    HostConfig: {
      PortBindings: app.networkMode === 'host' ? undefined : portBindings,
      NetworkMode: app.networkMode || 'bridge',
      Binds: binds.length > 0 ? binds : undefined,
      RestartPolicy: { Name: 'unless-stopped' }
    }
  };

  const container = await docker.createContainer(containerConfig);
  await container.start();

  console.log(`🚀 ${app.name} iniciada correctamente`);
  return true;
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
