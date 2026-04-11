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

# 2. Detener y eliminar servicios
echo -e "${BLUE}[1/3] Deteniendo y eliminando servicios de NubeOS...${NC}"
systemctl stop nubeos-backend || true
systemctl stop nubeos-frontend || true
systemctl disable nubeos-backend || true
systemctl disable nubeos-frontend || true

rm -f /etc/systemd/system/nubeos-backend.service
rm -f /etc/systemd/system/nubeos-frontend.service
systemctl daemon-reload

# 3. Eliminar archivos de la aplicación
echo -e "${BLUE}[2/3] Eliminando archivos de la aplicación en /opt/nubeos...${NC}"
rm -rf /opt/nubeos

# 4. Limpieza (Opcional - podrías dejar Docker/Node si el usuario los usa para más cosas)
echo -e "${BLUE}[3/3] Limpieza final...${NC}"

echo
echo -e "${GREEN}======================================================"
echo -e "        NubeOS HA SIDO ELIMINADO EXITOSAMENTE"
echo -e "======================================================${NC}"
echo
echo "Nota: Docker y Node.js no han sido eliminados por seguridad."
echo "¡Gracias por haber probado NubeOS!"
