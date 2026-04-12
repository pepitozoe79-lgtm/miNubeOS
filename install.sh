#!/bin/bash

# NubeOS One-Line Installer for Debian/Ubuntu
# Inspirado en CasaOS

set -e

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================"
echo -e "           INSTALADOR OFICIAL DE NubeOS"
echo -e "======================================================${NC}"
echo

# 1. Verificar si es root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}[ERROR] Por favor, ejecuta el instalador como root o con sudo.${NC}"
  exit 1
fi

# 2. Actualizar sistema e instalar dependencias básicas
echo -e "${GREEN}[1/6] Actualizando sistema e instalando dependencias básicas...${NC}"
apt update && apt install -y curl git build-essential ca-certificates gnupg lsb-release

# 3. Instalar Docker si no existe
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}[2/6] Instalando Docker Engine...${NC}"
    # Detectar si es Ubuntu o Debian
    OS_ID=$(grep -oP '^ID=\K\w+' /etc/os-release)
    [ "$OS_ID" == "ubuntu" ] || OS_ID="debian"
    
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$OS_ID/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS_ID \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}[2/6] Docker ya está instalado. Asegurando permisos...${NC}"
fi

# 4. Instalar/Actualizar Node.js (v20 requerido por Vite)
echo -e "${GREEN}[3/6] Asegurando Node.js v20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 5. Clonar el repositorio
INSTALL_DIR="/opt/nubeos"
echo -e "${GREEN}[4/6] Clonando NubeOS en $INSTALL_DIR...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${BLUE}Ya existe una instalación previa. Actualizando...${NC}"
    cd $INSTALL_DIR && git pull origin main
else
    git clone https://github.com/elpato001/NubeOs.git $INSTALL_DIR
fi

# 6. Instalar dependencias del proyecto
echo -e "${GREEN}[5/6] Instalando dependencias de Backend y Frontend...${NC}"
cd $INSTALL_DIR/backend && npm install
# Asegurar permisos para la base de datos
mkdir -p $INSTALL_DIR/data/db
chmod -R 777 $INSTALL_DIR/data # Permisos amplios para evitar bloqueos en Ubuntu

cd $INSTALL_DIR/frontend && npm install
npm run build # Construir el frontend para producción

# 7. Configurar servicios Systemd
echo -e "${GREEN}[6/6] Configurando servicios del sistema...${NC}"

# Servicio para el Backend
cat <<EOF > /etc/systemd/system/nubeos-backend.service
[Unit]
Description=NubeOS Backend Manager
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/node src/index.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Servicio para el Frontend (usando un servidor estático o preview para simplificar)
# NOTA: En producción lo ideal es servirlo con Nginx, pero para el instalador rápido
# usaremos 'npm run dev' o un servidor simple para que funcione de inmediato.
cat <<EOF > /etc/systemd/system/nubeos-frontend.service
[Unit]
Description=NubeOS Frontend Interface
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=/usr/bin/npm run dev -- --host
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Habilitar e iniciar servicios
systemctl daemon-reload
systemctl enable nubeos-backend
systemctl enable nubeos-frontend
systemctl restart nubeos-backend
systemctl restart nubeos-frontend

# 7. Finalización
echo
echo -e "${BLUE}======================================================"
echo -e "           ¡INSTALACIÓN COMPLETADA! "
echo -e "======================================================${NC}"
echo
echo -e "NubeOS ahora está funcionando como un servicio."
echo
echo -e "NubeOS Dashboard: ${GREEN}http://$(hostname -I | awk '{print $1}'):5173${NC}"
echo -e "NubeOS API:       ${GREEN}http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo
echo -e "Para comenzar, abre el ${BLUE}Dashboard${NC} en tu navegador y sigue los pasos"
echo -e "del asistente para crear tu cuenta de administrador."
echo
echo -e "Puedes gestionar los servicios con:"
echo -e "  systemctl status nubeos-backend"
echo -e "  systemctl status nubeos-frontend"
echo.
echo -e "${BLUE}¡Gracias por usar NubeOS!${NC}"
