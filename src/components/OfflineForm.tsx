import { useState, useEffect } from "react";
import { addTask, getAllTasks, clearTasks } from "../utils/idb";
import "./OfflineForm.css";

const OfflineForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Detectar estado de conexión
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Cargar tareas guardadas al iniciar
  useEffect(() => {
    const fetchTasks = async () => {
      const all = await getAllTasks();
      setTasks(all);
    };
    fetchTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Escribe un título");
    await addTask({ title, description });
    setTitle("");
    setDescription("");
    const all = await getAllTasks();
    setTasks(all);
  };

  const handleClear = async () => {
    await clearTasks();
    setTasks([]);
  };

  return (
    <div className="offline-form">
      <h2>Gestor Offline</h2>

      <p className={`status ${isOnline ? "online" : "offline"}`}>
        {isOnline ? "🟢 Conectado" : "🔴 Sin conexión"}
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Título de la tarea"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Guardar</button>
      </form>

      <button onClick={handleClear} className="clear-btn">
        Limpiar todo
      </button>

      <h3>Tareas guardadas</h3>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong> - {t.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OfflineForm;