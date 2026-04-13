#!/bin/bash
# NubeOS Update Script

set -e
INSTALL_DIR="/opt/nubeos"

echo "--- Iniciando actualización de NubeOS ---"
cd $INSTALL_DIR

# 1. Sync with GitHub (Force clean state)
echo "[1/4] Sincronizando con GitHub (Forzando estado limpio)..."
git fetch --all
git reset --hard origin/main
git pull origin main

# 2. Update Backend dependencies
echo "[2/4] Actualizando dependencias del Backend..."
cd $INSTALL_DIR/backend
npm install --omit=dev

# 3. Update Frontend dependencies and rebuild
echo "[3/4] Actualizando dependencias del Frontend..."
cd $INSTALL_DIR/frontend
# Solo borramos node_modules si hay errores previos o es una actualización mayor
# rm -rf node_modules 
npm install --include=dev

echo "Construyendo el nuevo Frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "ERROR: No se pudo generar la carpeta dist tras la construcción."
    exit 1
fi

# 4. Finalize and Restart
echo "[4/4] Actualización completada con éxito. Reiniciando servicio..."

# Reiniciamos el servicio en segundo plano para no interrumpir la respuesta de la API
(sleep 2; systemctl restart nubeos) &

echo "Actualización finalizada. El sistema se reiniciará en breve."
