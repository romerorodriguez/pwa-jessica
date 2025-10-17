import { openDB } from "idb";

const DB_NAME = "taskflow-db";
const STORE_NAME = "tasks";

export const initDB = async () => {
  try {
    console.log('Inicializando IndexedDB...');
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        console.log('Upgrading database...');
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
          console.log('Object store creado:', STORE_NAME);
        }
      },
    });
    console.log('Conexión a IndexedDB exitosa');
    return db;
  } catch (error) {
    console.error('Error en IndexedDB:', error);
    throw error;
  }
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
};

export const addTask = async (task: { title: string; description: string }) => {
  const db = await initDB();
  await db.add(STORE_NAME, {
    ...task,
    createdAt: new Date().toISOString(),
  });
};

export const getAllTasks = async () => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};

export const clearTasks = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};