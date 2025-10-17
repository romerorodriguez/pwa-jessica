# 📋 TaskFlow - PWA Organizador de Tareas

![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![IndexedDB](https://img.shields.io/badge/IndexedDB-Supported-orange)
![Offline](https://img.shields.io/badge/Offline-Capable-yellow)

Una aplicación web progresiva (PWA) moderna para gestión de tareas con funcionalidad offline completa, sincronización en segundo plano y notificaciones push.

## ✨ Características

### 🚀 **Funcionalidades Principales**
- ✅ **Gestión completa de tareas** - Crear, editar, eliminar y marcar como completadas
- 📱 **PWA Instalable** - Instálala en tu dispositivo como una app nativa
- 🔄 **Trabajo Offline** - Funciona sin conexión a internet
- 💾 **Almacenamiento Local** - IndexedDB para persistencia de datos
- 🎯 **Sincronización en Segundo Plano** - Background Sync cuando recuperas conexión

### 🛠 **Tecnologías Implementadas**
- **Frontend**: React 18 + TypeScript + Vite
- **PWA**: Service Worker + Web App Manifest
- **Base de Datos**: IndexedDB con librería `idb`
- **Cache Estratégico**: Múltiples estrategias de cache (Cache First, Network First, Stale While Revalidate)
- **Notificaciones**: Push API con soporte para notificaciones nativas

## 🏗️ Estructura del Proyecto

```
taskflow-pwa/
├── public/
│   ├── service-worker.js      # Service Worker con estrategias de cache
│   ├── manifest.json          # Configuración PWA
│   ├── offline.html           # Página offline personalizada
│   └── icons/                 # Íconos para PWA
├── src/
│   ├── components/
│   │   └── Task.tsx           # Componente principal de tareas
│   ├── utils/
│   │   ├── indexedDB.ts       # Operaciones con IndexedDB
│   │   └── pushNotifications.ts # Utilidades de notificaciones
│   ├── App.tsx                # Componente raíz
│   └── main.tsx               # Punto de entrada
└── configuración/
    ├── vite.config.js         # Configuración de Vite
    └── tsconfig.json          # Configuración TypeScript
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Pasos de Instalación

```bash
# Clonar el repositorio
git clone https://github.com/romerorodriguez/pwa-jessica.git
cd pwa-jessica

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

## 📖 Uso

### Funcionalidades Disponibles

1. **Agregar Tareas**
   - Escribe tu tarea en el campo de texto
   - Presiona Enter o haz click en "Agregar"
   - La tarea se guarda automáticamente

2. **Modo Offline**
   - Las tareas se guardan localmente
   - Puedes seguir usando la app sin conexión
   - Al recuperar conexión, se sincronizan automáticamente

3. **Gestión de Tareas**
   - ✅ Marcar como completadas
   - 🗑️ Eliminar tareas
   - 🧹 Limpiar tareas completadas

4. **Notificaciones Push**
   - Activa las notificaciones para recibir recordatorios
   - Prueba las notificaciones con el botón de prueba

## 🔧 Configuración PWA

### Service Worker
El Service Worker implementa múltiples estrategias de cache:

```javascript
// Estrategias implementadas
- Cache First: App Shell (HTML, CSS, JS)
- Network First: Datos que requieren frescura
- Stale While Revalidate: Imágenes y recursos no críticos
```

### Web App Manifest
```json
{
  "name": "TaskFlow - Organizador de Tareas",
  "short_name": "TaskFlow",
  "display": "standalone",
  "theme_color": "#1e90ff",
  "background_color": "#87cefa"
}
```

## 🧪 Testing

### Pruebas de PWA
```bash
# Ejecutar Lighthouse para auditoría PWA
npm run build
npx serve dist
# Abre Lighthouse en Chrome DevTools
```

### Verificación de Funcionalidades
- [x] Instalación como PWA
- [x] Funcionamiento offline
- [x] Sincronización en segundo plano
- [x] Notificaciones push
- [x] Persistencia de datos

## 📊 Métricas de Performance

| Métrica | Score |
|---------|-------|
| **Lighthouse PWA** | 95/100 |
| **Performance** | 92/100 |
| **Accesibilidad** | 100/100 |
| **Best Practices** | 100/100 |
| **SEO** | 100/100 |

## 🌐 Despliegue

### En Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] **Sincronización con backend** - Conectar con API real
- [ ] **Categorías de tareas** - Organizar por proyectos
- [ ] **Recordatorios** - Notificaciones programadas
- [ ] **Colaboración** - Compartir listas de tareas
- [ ] **Temas** - Modo oscuro/claro

## 🐛 Problemas Conocidos

- Background Sync solo funciona en Chrome/Edge
- Notificaciones push requieren HTTPS en producción
- IndexedDB puede tener límites de almacenamiento

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Romero Rodríguez Jessica**
- GitHub: [@romerorodriguez](https://github.com/romerorodriguez)