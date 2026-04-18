#!/bin/bash
# NubeOS Update Script - Asynchronous Version

set -e
# Detectar directorio raíz del proyecto dinámicamente
INSTALL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="$INSTALL_DIR/data/update.log"
STATUS_FILE="$INSTALL_DIR/data/update_status.json"

# Asegurar que el directorio de datos existe
mkdir -p "$INSTALL_DIR/data"

# Función para reportar estado
set_status() {
    local step=$1
    local progress=$2
    local message=$3
    echo "{\"step\": \"$step\", \"progress\": $progress, \"message\": \"$message\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATUS_FILE"
}

# Redirigir toda la salida al archivo de log
exec > >(tee -a "$LOG_FILE") 2>&1

echo "--- Iniciando actualización de NubeOS: $(date) ---"
cd "$INSTALL_DIR"

# 1. Sync with GitHub
set_status "syncing" 10 "Sincronizando archivos con GitHub..."
echo "[1/4] Sincronizando con GitHub (Forzando estado limpio)..."
git fetch --all
git reset --hard origin/main
git pull origin main

# 2. Update Backend dependencies
set_status "backend" 30 "Actualizando dependencias del Backend..."
echo "[2/4] Actualizando dependencias del Backend..."
cd $INSTALL_DIR/backend
npm install --omit=dev

# 3. Update Frontend dependencies and rebuild
set_status "frontend_deps" 50 "Limpiando y preparando Frontend..."
echo "[3/4] Actualizando dependencias del Frontend..."
cd $INSTALL_DIR/frontend

# Limpiamos dist y caché para asegurar una construcción limpia
rm -rf dist
rm -rf node_modules/.vite

npm install --include=dev

set_status "build" 70 "Construyendo nueva versión (limpieza profunda)..."
echo "Ejecutando npm run build..."
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    set_status "error" 0 "Error: La construcción falló o no generó index.html"
    echo "ERROR: No se pudo generar la carpeta dist o el index.html."
    exit 1
fi

# 4. Finalize and Restart
set_status "restarting" 90 "¡Todo listo! Reiniciando servicios..."
echo "[4/4] Actualización completada con éxito. Programando reinicio..."

# Reiniciamos el servicio un par de segundos después para permitir que el script finalice limpiamente
(sleep 5; set_status "idle" 100 "Sistema actualizado correctamente."; systemctl restart nubeos) &

echo "Actualización finalizada correctamente a las $(date). El sistema volverá en breve."
