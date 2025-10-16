import { openDB } from "idb";

const DB_NAME = "taskflow-db";
const STORE_NAME = "tasks";

export const initDB = async () => {
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