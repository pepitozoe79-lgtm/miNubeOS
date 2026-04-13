# NubeOS - Tu Nube Personal Local

NubeOS es un sistema de gestión de archivos y aplicaciones en la nube para uso personal (NAS casero). Proporciona una interfaz de escritorio intuitiva basada en la web para gestionar archivos, instalar aplicaciones y monitorear el sistema desde cualquier lugar de tu red local.

![NubeOS Dashboard](https://github.com/elpato001/NubeOs/blob/main/frontend/src/assets/logo.png?raw=true)
![NubeOS Dashboard](https://raw.githubusercontent.com/elpato001/NubeOs/main/screenshots/desktop_preview.png)

## 🚀 Características

- **Interfaz de Escritorio Web**: Experiencia similar a un sistema operativo real con ventanas móviles, fondos de pantalla personalizables y accesos directos.
- **Gestor de Archivos**: Sube, descarga, organiza y visualiza documentos y multimedia.
- **App Center**: Instala y gestiona aplicaciones dentro de tu ecosistema personal.
- **Panel de Control**: Monitorea el estado del servidor y gestiona usuarios.
- **Seguridad**: Autenticación de usuarios y protección de datos.

## 🛠️ Tecnologías

- **Frontend**: Vue 3, Vite, Pinia (Estado), Vue Router.
- **Backend**: Node.js, Express, Better-SQLite3.
- **Base de Datos**: SQLite (almacenada en `data/`).

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (Versión 16 o superior recomendada)
- [NPM](https://www.npmjs.com/) (Viene incluido con Node.js)

## ⚙️ Instalación y Ejecución

### Opción Rápida (Linux - Debian/Ubuntu)

Puedes instalar todo el ecosistema de NubeOS con un solo comando (vía Terminal):

```bash
curl -fsSL https://raw.githubusercontent.com/elpato001/NubeOs/main/install.sh | sudo bash
```

### Desinstalar NubeOS (Linux)

Si deseas eliminar NubeOS por completo de tu sistema Linux (incluyendo servicios, archivos y contenedores de aplicaciones):

```bash
curl -fsSL https://raw.githubusercontent.com/elpato001/NubeOs/main/uninstall.sh | sudo bash
```

### Instalación Limpia desde Cero (Linux)

Si quieres desinstalar y volver a instalar NubeOS en un solo paso para resolver problemas:

```bash
curl -fsSL https://raw.githubusercontent.com/elpato001/NubeOs/main/uninstall.sh | sudo bash && curl -fsSL https://raw.githubusercontent.com/elpato001/NubeOs/main/install.sh | sudo bash
```

### Opción Rápida (Windows)

Si estás en Windows, puedes usar el script automatizado que se encuentra en la raíz del proyecto:

1. Haz doble clic en `instalar_y_ejecutar.bat`.
2. El script detectará Node.js, instalará las dependencias necesarias e iniciará tanto el frontend como el backend automáticamente.

### Instalación Manual

Si prefieres hacerlo manualmente o estás en otro sistema operativo:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/elpato001/NubeOs.git
   cd NubeOs
   ```

2. **Configurar el Backend:**
   ```bash
   cd backend
   npm install
   # El backend usa SQLite, la base de datos se creará automáticamente
   node src/index.js
   ```

3. **Configurar el Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Acceder a la aplicación:**
   Abre tu navegador en [http://localhost:5173](http://localhost:5173)

## 📁 Estructura del Proyecto

- `/backend`: Servidor API y lógica de negocio.
- `/frontend`: Aplicación cliente basada en Vue.js.
- `/data`: Archivos de base de datos y configuración del sistema.
- `instalar_y_ejecutar.bat`: Script de inicio rápido para Windows.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de abrir un *Issue* o enviar un *Pull Request* para mejorar NubeOS.

---
Desarrollado con ❤️ para la comunidad de Self-Hosting.
