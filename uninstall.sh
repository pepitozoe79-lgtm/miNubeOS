#!/bin/bash

# NubeOS Uninstaller for Debian/Ubuntu

set -e

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}======================================================"
echo -e "           DESINSTALADOR DE NubeOS"
echo -e "======================================================${NC}"
echo

# 1. Verificar si es root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}[ERROR] Por favor, ejecuta el desinstalador como root o con sudo.${NC}"
  exit 1
fi

# 2. Detener y eliminar servicios (nuevo y viejos)
echo -e "${BLUE}[1/3] Deteniendo y eliminando servicios de NubeOS...${NC}"
systemctl stop nubeos 2>/dev/null || true
systemctl disable nubeos 2>/dev/null || true
rm -f /etc/systemd/system/nubeos.service

# Limpiar servicios viejos si existen
systemctl stop nubeos-backend 2>/dev/null || true
systemctl stop nubeos-frontend 2>/dev/null || true
systemctl disable nubeos-backend 2>/dev/null || true
systemctl disable nubeos-frontend 2>/dev/null || true
rm -f /etc/systemd/system/nubeos-backend.service
rm -f /etc/systemd/system/nubeos-frontend.service

systemctl daemon-reload

# 3. Eliminar archivos de la aplicación
echo -e "${BLUE}[2/3] Eliminando archivos de la aplicación en /opt/nubeos...${NC}"

# Intentar detener y eliminar contenedores de Docker gestionados por NubeOS
if command -v docker &> /dev/null; then
    echo -e "${YELLOW}Buscando contenedores de aplicaciones NubeOS...${NC}"
    CONTAINERS=$(docker ps -a --filter "name=nubeos-" --format "{{.Names}}")
    if [ ! -z "$CONTAINERS" ]; then
        echo -e "${YELLOW}Deteniendo y eliminando contenedores:${NC}"
        echo "$CONTAINERS"
        docker stop $CONTAINERS &>/dev/null || true
        docker rm $CONTAINERS &>/dev/null || true
    fi
fi

rm -rf /opt/nubeos

# 4. Limpieza
echo -e "${BLUE}[3/3] Limpieza final...${NC}"

echo
echo -e "${GREEN}======================================================"
echo -e "        NubeOS HA SIDO ELIMINADO EXITOSAMENTE"
echo -e "======================================================${NC}"
echo
echo "Nota: Docker y Node.js no han sido eliminados por seguridad."
echo "¡Gracias por haber probado NubeOS!"
