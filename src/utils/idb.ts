import { openDB } from "idb";

const DB_NAME = "taskflow-db";
const STORE_NAME = "tasks";
const SYNC_STORE_NAME = "pending-sync";

export const initDB = async () => {
  try {
    console.log('📦 Inicializando IndexedDB...');
    const db = await openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        console.log('🔄 Actualizando base de datos de versión:', oldVersion, 'a 2');
        
        // Crear store de tareas si no existe
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
          console.log('✅ Object store creado:', STORE_NAME);
        }
        
        // Crear store de sincronización (nuevo en versión 2)
        if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
          db.createObjectStore(SYNC_STORE_NAME, { keyPath: "id", autoIncrement: true });
          console.log('✅ Object store creado:', SYNC_STORE_NAME);
        }
      },
    });
    console.log('✅ Conexión a IndexedDB exitosa');
    return db;
  } catch (error) {
    console.error('❌ Error en IndexedDB:', error);
    throw error;
  }
};

// Función principal para agregar tareas
export const addTask = async (task: { text: string; completed: boolean; createdAt: Date }) => {
  const db = await initDB();
  
  const taskToSave = {
    ...task,
    createdAt: task.createdAt.toISOString(),
    synced: false
  };
  
  const result = await db.add(STORE_NAME, taskToSave);
  console.log('✅ Tarea guardada con ID:', result);
  
  // También agregar a pendientes de sync si está offline
  if (!navigator.onLine) {
    console.log('📥 Guardando en sync pendiente (offline)');
    await addToPendingSync({ ...taskToSave, localId: result });
  }
  
  return result;
};

export const getAllTasks = async () => {
  const db = await initDB();
  const tasks = await db.getAll(STORE_NAME);
  
  const formattedTasks = tasks.map((t: any) => ({ 
    ...t, 
    id: t.id,
    text: t.text || t.title || '',
    completed: t.completed || false,
    createdAt: new Date(t.createdAt)
  }));
  
  console.log('📋 Tareas recuperadas:', formattedTasks.length);
  return formattedTasks;
};

export const clearTasks = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
  await db.clear(SYNC_STORE_NAME);
  console.log('🗑️ Todas las tareas eliminadas');
};

// FUNCIONES PARA SYNC
export const addToPendingSync = async (task: any) => {
  const db = await initDB();
  const result = await db.add(SYNC_STORE_NAME, {
    ...task,
    timestamp: new Date().toISOString(),
    type: 'TASK_ADD'
  });
  console.log('📥 Tarea agregada a sync pendiente:', result);
  return result;
};

export const getPendingSyncTasks = async () => {
  const db = await initDB();
  const tasks = await db.getAll(SYNC_STORE_NAME);
  console.log('🔄 Tareas pendientes de sync:', tasks.length);
  return tasks;
};

export const removeFromPendingSync = async (id: number) => {
  const db = await initDB();
  await db.delete(SYNC_STORE_NAME, id);
  console.log('✅ Tarea removida de sync pendiente:', id);
};

// FUNCIONES CRUD ADICIONALES
export const deleteTaskDB = async (id: number) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
  console.log('🗑️ Tarea eliminada:', id);
};

export const updateTaskDB = async (task: any) => {
  const db = await initDB();
  await db.put(STORE_NAME, task);
  console.log('✏️ Tarea actualizada:', task.id);
};

export const clearCompletedDB = async () => {
  const db = await initDB();
  const all = await db.getAll(STORE_NAME);
  const completed = all.filter((t: any) => t.completed);
  
  console.log('🧹 Limpiando tareas completadas:', completed.length);
  
  for (const t of completed) {
    await db.delete(STORE_NAME, t.id);
  }
};

// Extender la interfaz de ServiceWorkerRegistration para SyncManager
declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register(tag: string): Promise<void>;
    };
  }
}

// Función para registrar sync cuando se agrega tarea offline
export const registerBackgroundSync = async () => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-tasks');
      console.log('🔄 Background Sync registrado');
    } catch (error) {
      console.log('⚠️ Background Sync no disponible:', error);
    }
  } else {
    console.log('⚠️ Background Sync no soportado en este navegador');
  }
};