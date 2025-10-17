import { useState, useEffect } from "react";
import { openDB } from "idb";
import "./Task.css";

const DB_NAME = "taskflow-db";
const STORE_NAME = "tasks";

interface TaskItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });
}

async function getAllTasks() {
  const db = await initDB();
  const tasks = await db.getAll(STORE_NAME);
  return tasks.map((t: any) => ({ ...t, createdAt: new Date(t.createdAt) }));
}

async function addTaskDB(task: Omit<TaskItem, "id">) {
  const db = await initDB();
  await db.add(STORE_NAME, task);
}

async function deleteTaskDB(id: number) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

async function updateTaskDB(task: TaskItem) {
  const db = await initDB();
  await db.put(STORE_NAME, task);
}

async function clearCompletedDB() {
  const db = await initDB();
  const all = await db.getAll(STORE_NAME);
  const completed = all.filter((t: any) => t.completed);
  for (const t of completed) {
    await db.delete(STORE_NAME, t.id);
  }
}

// --- Componente principal ---
function Task() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Detectar cambios de conexión
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Cargar tareas desde IndexedDB al iniciar
  useEffect(() => {
  const loadTasks = async () => {
    try {
      console.log('Cargando tareas desde IndexedDB...');
      const stored = await getAllTasks();
      console.log('Tareas cargadas:', stored);
      setTasks(stored);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };
  loadTasks();
}, []);

  const addTask = async () => {
    if (newTask.trim() === "") return;

    const task = {
      text: newTask.trim(),
      completed: false,
      createdAt: new Date(),
    };

    await addTaskDB(task);
    const updated = await getAllTasks();
    setTasks(updated);
    setNewTask("");
  };

  const deleteTask = async (id: number) => {
    await deleteTaskDB(id);
    const updated = await getAllTasks();
    setTasks(updated);
  };

  const toggleTask = async (id: number) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
    const toggled = updatedTasks.find((t) => t.id === id);
    if (toggled) await updateTaskDB(toggled);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTask();
  };

  const clearCompleted = async () => {
    await clearCompletedDB();
    const updated = await getAllTasks();
    setTasks(updated);
  };

  return (
    <div className="task-container">
      <header className="task-header">
        <h1>Mis Tareas</h1>
        <p>Organiza tu día de manera eficiente</p>
        <p className={`status ${isOnline ? "online" : "offline"}`}>
          {isOnline ? "🟢 Conectado" : "🔴 Sin conexión"}
        </p>
      </header>

      <div className="task-input-section">
        <div className="input-group">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe una nueva tarea..."
            className="task-input"
          />
          <button onClick={addTask} className="add-btn">
            Agregar
          </button>
        </div>
      </div>

      <div className="tasks-stats">
        <span>{tasks.filter((t) => !t.completed).length} tareas pendientes</span>
        {tasks.some((t) => t.completed) && (
          <button onClick={clearCompleted} className="clear-btn">
            Limpiar completadas
          </button>
        )}
      </div>

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No hay tareas aún</p>
            <small>¡Agrega tu primera tarea arriba!</small>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? "completed" : ""}`}
            >
              <div className="task-content">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="task-checkbox"
                />
                <span className="task-text">{task.text}</span>
                <small className="task-date">
                  {task.createdAt.toLocaleDateString()}
                </small>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="delete-btn"
                aria-label="Eliminar tarea"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <footer className="task-footer">
        <small>TaskFlow - Organiza tu vida</small>
      </footer>
    </div>
  );
}

export default Task;