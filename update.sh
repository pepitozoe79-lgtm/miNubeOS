#!/bin/bash
# NubeOS Update Script

set -e
INSTALL_DIR="/opt/nubeos"

echo "--- Iniciando actualización de NubeOS ---"
cd $INSTALL_DIR

# 1. Pull changes
echo "Sincronizando con GitHub..."
git pull origin main

# 2. Update Backend dependencies
echo "Actualizando dependencias del Backend..."
cd $INSTALL_DIR/backend
npm install --omit=dev

# 3. Update Frontend dependencies and rebuild
echo "Actualizando dependencias del Frontend..."
cd $INSTALL_DIR/frontend
rm -rf node_modules
npm install --include=dev
echo "Construyendo el nuevo Frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "ERROR: No se pudo generar la carpeta dist"
    exit 1
fi

echo "--- Actualización completada con éxito ---"

# 4. Restart service in the background to allow the current process to finish
echo "Reiniciando el servicio NubeOS..."
(sleep 2; systemctl restart nubeos) &
