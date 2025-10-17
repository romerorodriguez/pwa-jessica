import { openDB } from "idb";

const DB_NAME = "taskflow-db";
const STORE_NAME = "tasks";
const SYNC_STORE_NAME = "pending-sync";

export const initDB = async () => {
  return openDB(DB_NAME, 2, {
    upgrade(db) {  // Remover oldVersion si no se usa
      // Crear store de tareas si no existe
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
      
      // Crear store de sincronización (nuevo en versión 2)
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
};
export const addTask = async (task: { text: string; completed: boolean; createdAt: Date }) => {
  const db = await initDB();
  const result = await db.add(STORE_NAME, {
    ...task,
    createdAt: task.createdAt.toISOString(),
    synced: false
  });
  
  // También agregar a pendientes de sync si está offline
  if (!navigator.onLine) {
    await addToPendingSync({ ...task, localId: result });
  }
  return result;
};

export const getAllTasks = async () => {
  const db = await initDB();
  const tasks = await db.getAll(STORE_NAME);
  return tasks.map((t: any) => ({ 
    ...t, 
    createdAt: new Date(t.createdAt),
    text: t.text || t.title 
  }));
};

export const clearTasks = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
  await db.clear(SYNC_STORE_NAME);
};

// NUEVAS FUNCIONES PARA SYNC
export const addToPendingSync = async (task: any) => {
  const db = await initDB();
  return await db.add(SYNC_STORE_NAME, {
    ...task,
    timestamp: new Date().toISOString(),
    type: 'TASK_ADD'
  });
};

export const getPendingSyncTasks = async () => {
  const db = await initDB();
  return await db.getAll(SYNC_STORE_NAME);
};

export const removeFromPendingSync = async (id: number) => {
  const db = await initDB();
  return await db.delete(SYNC_STORE_NAME, id);
};

// Funciones CRUD adicionales que faltaban
export const deleteTaskDB = async (id: number) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const updateTaskDB = async (task: any) => {
  const db = await initDB();
  await db.put(STORE_NAME, task);
};

export const clearCompletedDB = async () => {
  const db = await initDB();
  const all = await db.getAll(STORE_NAME);
  const completed = all.filter((t: any) => t.completed);
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
      console.log('Background Sync registrado');
    } catch (error) {
      console.log('Background Sync no disponible:', error);
    }
  }
};