#!/bin/bash

# NubeOS One-Line Installer for Debian/Ubuntu
# Usage: curl -fsSL https://raw.githubusercontent.com/elpato001/NubeOs/main/install.sh | sudo bash

set -e

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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
echo -e "${GREEN}[1/5] Actualizando sistema e instalando dependencias básicas...${NC}"
apt update && apt install -y curl git build-essential ca-certificates gnupg lsb-release python3

# 3. Instalar Docker si no existe
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}[2/5] Instalando Docker Engine...${NC}"
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
    echo -e "${GREEN}[2/5] Docker ya está instalado. Asegurando permisos...${NC}"
fi

# 4. Instalar/Actualizar Node.js (v20 requerido por Vite)
echo -e "${GREEN}[3/5] Asegurando Node.js v20...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo -e "${BLUE}Node.js $(node -v) ya está instalado.${NC}"
fi

# 5. Clonar el repositorio
INSTALL_DIR="/opt/nubeos"
echo -e "${GREEN}[4/5] Clonando NubeOS en $INSTALL_DIR...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${BLUE}Ya existe una instalación previa. Actualizando...${NC}"
    cd $INSTALL_DIR && git pull origin main
else
    git clone https://github.com/elpato001/NubeOs.git $INSTALL_DIR
fi

# 6. Instalar dependencias y construir
echo -e "${GREEN}[5/5] Instalando dependencias y construyendo la aplicación...${NC}"

# --- Crear archivo .env para el backend (no se sube a git) ---
ENV_FILE="$INSTALL_DIR/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Generando archivo de configuración .env...${NC}"
    # Generar JWT_SECRET aleatorio y seguro
    JWT_SECRET=$(openssl rand -hex 32)
    cat <<EOF > "$ENV_FILE"
PORT=3000
JWT_SECRET=$JWT_SECRET
DB_PATH=/opt/nubeos/data/db/nubeos.sqlite
NODE_ENV=production
EOF
    echo -e "${GREEN}Archivo .env creado correctamente.${NC}"
else
    echo -e "${BLUE}Archivo .env ya existe, conservando configuración.${NC}"
fi

# Asegurar permisos para la base de datos
mkdir -p $INSTALL_DIR/data/db
chmod -R 755 $INSTALL_DIR/data

# Instalar dependencias del Backend
cd $INSTALL_DIR/backend && npm install --omit=dev

# Instalar dependencias del Frontend y construir
cd $INSTALL_DIR/frontend && npm install
npm run build

# Verificar que el build se generó correctamente
if [ ! -d "$INSTALL_DIR/frontend/dist" ]; then
    echo -e "${RED}[ERROR] El build del frontend no se generó correctamente.${NC}"
    echo -e "${YELLOW}Intentando build de nuevo...${NC}"
    npm run build
fi

echo -e "${GREEN}Build del Frontend completado.${NC}"

# 7. Configurar servicio Systemd (un solo servicio: el backend sirve todo)
echo -e "${GREEN}Configurando servicio del sistema...${NC}"

cat <<EOF > /etc/systemd/system/nubeos.service
[Unit]
Description=NubeOS - Personal Cloud Server
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Limpiar servicios viejos si existen (de versiones anteriores del instalador)
systemctl stop nubeos-backend 2>/dev/null || true
systemctl stop nubeos-frontend 2>/dev/null || true
systemctl disable nubeos-backend 2>/dev/null || true
systemctl disable nubeos-frontend 2>/dev/null || true
rm -f /etc/systemd/system/nubeos-backend.service
rm -f /etc/systemd/system/nubeos-frontend.service

# Habilitar e iniciar el nuevo servicio unificado
systemctl daemon-reload
systemctl enable nubeos
systemctl restart nubeos

# Obtener la IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')

# 8. Finalización
echo
echo -e "${BLUE}======================================================"
echo -e "           ¡INSTALACIÓN COMPLETADA! "
echo -e "======================================================${NC}"
echo
echo -e "NubeOS ahora está funcionando como un servicio."
echo
echo -e "NubeOS Dashboard: ${GREEN}http://$SERVER_IP:3000${NC}"
echo
echo -e "Para comenzar, abre el ${BLUE}Dashboard${NC} en tu navegador y sigue los pasos"
echo -e "del asistente para crear tu cuenta de administrador."
echo
echo -e "Gestionar el servicio:"
echo -e "  ${YELLOW}sudo systemctl status nubeos${NC}    - Ver estado"
echo -e "  ${YELLOW}sudo systemctl restart nubeos${NC}   - Reiniciar"
echo -e "  ${YELLOW}sudo systemctl stop nubeos${NC}      - Detener"
echo -e "  ${YELLOW}sudo journalctl -u nubeos -f${NC}    - Ver logs en vivo"
echo
echo -e "${BLUE}¡Gracias por usar NubeOS!${NC}"
